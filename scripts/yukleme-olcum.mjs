/**
 * Yükleme ölçümü (Görev I): üretim derlemesini (dist/) yerel sunucuda açar, ağı yavaşlatır (Chromium CDP)
 * ve şunları ölçer:
 *  - arkaPlan: sayfa açılışından menü arka planının (poster ya da video karesi) görünmesine kadar geçen süre;
 *  - video: açılıştan videonun oynamaya başlamasına kadar (oynatılamıyorsa "—");
 *  - temaBosluk: tema düğmesine basıldıktan sonraki 3 sn içinde arka planın boş kaldığı (hiçbir görsel ya da video
 *    karesi tam görünmediği) toplam süre; temaYeni: yeni temanın arka planı tam görünene dek geçen süre;
 *  - liste: Oyuncu ekranına geçişten 5 kayıtlı karakterin görselleri görünene dek;
 *  - yeni: "Yeni karakter" ekranına geçişten avatar görünene dek; sinif: ekranda 1,5 sn sonra sınıf değişince yeni avatara dek;
 *  - kB: ölçüm boyunca indirilen karakter görseli ve arka plan baytları.
 * Her ölçüm boş önbellekli yeni bir tarayıcı bağlamında yapılır.
 *
 * Çalıştırma: `npm run build` sonra `npm run olcum` (isteğe bağlı tekrar sayısı: `npm run olcum -- 5`).
 * Tarayıcı yolu `PW_CHROMIUM` ile verilebilir.
 */
import { chromium } from 'playwright';
import { preview } from 'vite';

const RUNS = Number(process.argv[2] ?? 3);
const PROFILES = [
  { id: 'hizli3g', name: 'Hızlı 3G (1,6 Mbit/s, 150 ms)', down: 1.6e6 / 8, latency: 150 },
  { id: '4g', name: '4G (9 Mbit/s, 60 ms)', down: 9e6 / 8, latency: 60 },
];
const SIZES = [['pc', 1280, 800], ['telefon', 390, 844]];

const server = await preview({ preview: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});

const CHARS = [['human', 'fighter'], ['elf', 'wizard'], ['dwarf', 'cleric'], ['halfling', 'rogue'], ['orc', 'barbarian']]
  .map(([raceId, classId], i) => ({
    id: `olcum${i}`, method: 'standard', classSkills: [], otherSkills: [],
    sheet: { name: `K${i}`, raceId, classId, gender: i % 2 ? 'kadin' : 'erkek', level: 1, baseScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } },
  }));

/** Sayfada: koşul sağlanana dek her karede bakar; geçen ms. */
const waitFor = (page, fn, arg, t0Expr = 'performance.now()') => page.evaluate(async ({ src, arg, t0Expr }) => {
  // eslint-disable-next-line no-new-func
  const test = new Function('arg', src);
  // eslint-disable-next-line no-new-func
  const t0 = new Function(`return ${t0Expr}`)();
  const deadline = performance.now() + 30000;
  while (performance.now() < deadline) {
    if (test(arg)) return Math.round(performance.now() - t0);
    await new Promise((r) => requestAnimationFrame(r));
  }
  return null;
}, { src: fn, arg, t0Expr });

/**
 * Arka planda tam görünen (kendisi ve üstleri opak) bir görsel ya da video karesi var mı; `arg` verilirse
 * yalnızca o temanınkiler.
 */
const BG_VISIBLE = `
  const opaque = (el) => { let o = 1; for (let e = el; e && !e.classList?.contains('menu-bg'); e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none') return false; o *= Number(cs.opacity); } return o >= 0.99; };
  const bg = document.querySelector('.menu-bg');
  if (!bg) return false;
  for (const el of bg.querySelectorAll('img, video')) {
    const src = el.currentSrc || el.src || '';
    if (arg && !src.includes('-' + arg + '.')) continue;
    if (!opaque(el)) continue;
    if (el.tagName === 'IMG' && el.complete && el.naturalWidth > 0) return true;
    if (el.tagName === 'VIDEO' && el.readyState >= 2) return true;
    if (el.tagName === 'VIDEO' && el.poster && performance.getEntriesByName(el.poster).some((p) => p.responseEnd > 0)) return true;
  }
  return false;`;
/** `ms` boyunca her karede bakar; koşulun sağlanmadığı toplam süre. */
const blankFor = (page, fn, ms) => page.evaluate(async ({ src, ms }) => {
  // eslint-disable-next-line no-new-func
  const test = new Function('arg', src);
  const t0 = window.__t;
  let last = t0;
  let blank = 0;
  while (performance.now() - t0 < ms) {
    await new Promise((r) => requestAnimationFrame(r));
    const now = performance.now();
    if (!test(null)) blank += now - last;
    last = now;
  }
  return Math.round(blank);
}, { src: fn, ms });
const VIDEO_PLAYING = `
  const v = [...document.querySelectorAll('.menu-bg video')].find((x) => (x.currentSrc || x.src).includes('-' + arg + '.') && getComputedStyle(x).opacity !== '0');
  return !!v && v.readyState >= 3 && !v.paused && v.currentTime > 0;`;
const IMGS_DONE = `
  const imgs = [...document.querySelectorAll(arg.sel)].filter((i) => i.complete && i.naturalWidth > 0 && getComputedStyle(i).opacity !== '0' && (!arg.has || (i.currentSrc || i.src).includes(arg.has)));
  return imgs.length >= arg.n;`;

async function context(profile, size, theme = 'light') {
  const ctx = await browser.newContext({ viewport: { width: size[1], height: size[2] }, colorScheme: 'light', reducedMotion: 'no-preference' });
  await ctx.addInitScript(([chars, theme]) => {
    localStorage.setItem('rpg-battle-characters', JSON.stringify(chars));
    localStorage.setItem('rpg-battle-theme', theme);
    localStorage.setItem('rpg-battle-lang', 'tr');
  }, [CHARS, theme]);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: profile.latency, downloadThroughput: profile.down, uploadThroughput: profile.down });
  const bytes = { characters: 0, acilis: 0 };
  cdp.on('Network.loadingFinished', (e) => { const u = urls.get(e.requestId) ?? ''; if (u.includes('/characters/')) bytes.characters += e.encodedDataLength; if (u.includes('/acilis/')) bytes.acilis += e.encodedDataLength; });
  const urls = new Map();
  cdp.on('Network.requestWillBeSent', (e) => urls.set(e.requestId, e.request.url));
  return { ctx, page, bytes };
}

const median = (xs) => { const v = xs.filter((x) => x !== null).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };

async function once(profile, size) {
  const out = {};
  // 1) Açılış ve tema geçişi.
  {
    const { ctx, page, bytes } = await context(profile, size);
    await page.goto(url, { waitUntil: 'commit' });
    out.arkaPlan = await waitFor(page, BG_VISIBLE, 'light', '0');
    out.video = await waitFor(page, VIDEO_PLAYING, 'light', '0');
    await page.waitForLoadState('load');
    await page.waitForTimeout(4000);
    // Düğme sayfa içinden tıklanır: tıklama anı ile ölçümün başlangıcı aynı karede.
    await page.evaluate(() => { window.__t = performance.now(); document.querySelector('header button').click(); });
    const [bosluk, yeni] = await Promise.all([blankFor(page, BG_VISIBLE, 3000), waitFor(page, BG_VISIBLE, 'dark', 'window.__t')]);
    out.temaBosluk = bosluk;
    out.temaYeni = yeni;
    out.arkaPlanKB = Math.round(bytes.acilis / 1024);
    await ctx.close();
  }
  // 2) Karakter listesi ve yeni karakter ekranı.
  {
    const { ctx, page, bytes } = await context(profile, size);
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { window.__t = performance.now(); });
    await page.click('button.role >> nth=0');
    out.liste = await waitFor(page, IMGS_DONE, { sel: '.char-card .avatar img', n: CHARS.length }, 'window.__t');
    await page.evaluate(() => { window.__t = performance.now(); });
    await page.getByRole('button', { name: 'Yeni karakter' }).click();
    out.yeni = await waitFor(page, IMGS_DONE, { sel: '.builder-form .avatar img', n: 1 }, 'window.__t');
    await page.waitForTimeout(1500);
    await page.evaluate(() => { window.__t = performance.now(); });
    // Sınıf seçimi: yeni karakter savaşçı (fighter) ile başlar, büyücüye (wizard) geçilir.
    const classSel = await page.$$('.builder-form select');
    let changed = null;
    for (const sel of classSel) {
      const opts = await sel.$$eval('option', (os) => os.map((o) => o.value));
      if (opts.includes('wizard')) { await sel.selectOption('wizard'); changed = 'wizard'; break; }
    }
    out.sinif = changed ? await waitFor(page, IMGS_DONE, { sel: '.builder-form .avatar img', n: 1, has: '-wizard' }, 'window.__t') : null;
    out.karakterKB = Math.round(bytes.characters / 1024);
    await ctx.close();
  }
  return out;
}

const rows = [];
for (const profile of PROFILES) {
  for (const size of SIZES) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) runs.push(await once(profile, size));
    const m = Object.fromEntries(Object.keys(runs[0]).map((k) => [k, median(runs.map((r) => r[k]))]));
    rows.push({ profil: profile.name, ekran: size[0], ...m });
    console.log(JSON.stringify(rows.at(-1)));
  }
}
const fmt = (v) => (v === null ? '—' : String(v));
console.log('\n| Ağ | Ekran | Arka plan (ms) | Video oynar (ms) | Tema geçişinde boşluk (ms) | Yeni tema tam görünür (ms) | Arka plan kB | Liste 5 görsel (ms) | Yeni karakter (ms) | Sınıf değişimi (ms) | Karakter görselleri kB |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.profil} | ${r.ekran} | ${fmt(r.arkaPlan)} | ${fmt(r.video)} | ${fmt(r.temaBosluk)} | ${fmt(r.temaYeni)} | ${fmt(r.arkaPlanKB)} | ${fmt(r.liste)} | ${fmt(r.yeni)} | ${fmt(r.sinif)} | ${fmt(r.karakterKB)} |`);
await browser.close();
await server.httpServer.close();
