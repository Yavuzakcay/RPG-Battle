/**
 * Kuyruk K57: tek ekran süre ölçümü (üretim derlemesi; önce `npm run build`). Açılış ekranı ve efektler kapalı,
 * telefon görünümü, boş önbellek, her ölçüm yeni bağlamda. Ölçülenler (ms, medyan):
 *  - acilis: sayfa açılışından giriş menüsünün (Oyuncu/Game Master kartları) görünmesine;
 *  - oyuncu: "Oyuncu" kartına dokunuştan karakter listesine (sınıf + büyü verisi hazır); oyuncu15: giriş menüsü göründükten
 *    1,5 sn sonra dokununca (yeni sayfa);
 *  - sihirbaz: "Yeni karakter"den oluşturucunun ilk adımına (tembel Builder parçası); sihirbaz15: listeye girdikten 1,5 sn
 *    sonra (Oyuncu ekranındaki önyükleme ipucunun etkisi; yeni sayfa, boş önbellek);
 *  - gm: "Game Master" kartından harita seçicisine (canavar verisi + Game Master parçası);
 *  - savas: Game Master'da "Savaşa başla"dan savaş ekranının (.mb-stage) çizilmesine.
 * İki profil: ağ/işlemci kısıtsız ve 4G (9 Mbit/s, 60 ms) + 4× yavaş işlemci (telefon tahmini).
 *
 * Çalıştırma: `npx vite-node scripts/k57-olcum.ts [tekrar]` (varsayılan 3).
 */
import { chromium, type Page } from 'playwright';
import { preview } from 'vite';
import { demoCharacters } from '../src/screens/fixtures';
import { loadClassData, loadMonsters } from '../src/data';

await Promise.all([loadMonsters(), loadClassData()]);
const RUNS = Number(process.argv[2] ?? 3);
const CHARS = JSON.stringify(demoCharacters());
const PROFILES = [
  { id: 'kisitsiz', name: 'kısıtsız', net: null as null | { down: number; latency: number }, cpu: 1 },
  { id: 'telefon', name: '4G + 4× işlemci', net: { down: 9e6 / 8, latency: 60 }, cpu: 4 },
];

const server = await preview({ preview: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
const url = server.resolvedUrls?.local[0] as string;
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});

async function timed(page: Page, act: () => Promise<unknown>, selector: string): Promise<number> {
  const t0 = Date.now();
  await act();
  await page.waitForSelector(selector, { timeout: 60_000 });
  return Date.now() - t0;
}

async function once(p: (typeof PROFILES)[number]): Promise<Record<string, number>> {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  await ctx.addInitScript((chars) => {
    try {
      localStorage.setItem('rpg-battle-effects', 'off'); localStorage.setItem('rpg-battle-dice-anim', 'off'); localStorage.setItem('rpg-battle-acilis', 'off');
      localStorage.setItem('rpg-battle-characters', chars);
    } catch { /* yok */ }
  }, CHARS);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (p.net) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: p.net.latency, downloadThroughput: p.net.down, uploadThroughput: p.net.down });
  if (p.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: p.cpu });
  const r: Record<string, number> = {};
  r.acilis = await timed(page, () => page.goto(url), 'button.role.player');
  r.oyuncu = await timed(page, () => page.click('button.role.player'), 'text=Yeni karakter');
  // Giriş menüsünde 1,5 sn sonra (açılışta başlayan sınıf/büyü verisi yüklemesinin etkisi; yeni sayfa).
  await page.goto(url);
  await page.waitForSelector('button.role.player', { timeout: 60_000 });
  await page.waitForTimeout(1500);
  r.oyuncu15 = await timed(page, () => page.click('button.role.player'), 'text=Yeni karakter');
  r.sihirbaz = await timed(page, () => page.click('text=Yeni karakter'), 'main.builder');
  // Kullanıcı listeye bir an bakar: 1,5 sn sonra ikinci giriş (önyükleme ipucunun etkisi).
  await page.goto(url);
  await page.waitForSelector('button.role.player', { timeout: 60_000 });
  await page.click('button.role.player');
  await page.waitForSelector('text=Yeni karakter', { timeout: 60_000 });
  await page.waitForTimeout(1500);
  r.sihirbaz15 = await timed(page, () => page.click('text=Yeni karakter'), 'main.builder');
  await page.goto(url);
  await page.waitForSelector('button.role.gm', { timeout: 60_000 });
  r.gm = await timed(page, () => page.click('button.role.gm'), '[data-region]');
  // Kuyruk 25 iki adımlı seçici: haritanın kartını gösteren bölge çipi, sonra kart (kara-ekran.mjs `pickMap` gibi).
  for (const chip of await page.locator('[data-region]').all()) {
    if (await page.locator('[data-map="orman"]').count()) break;
    await chip.click();
  }
  await page.click('[data-map="orman"]');
  r.savas = await timed(page, () => page.click('button.cta'), '.mb-stage');
  await ctx.close();
  return r;
}

const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] as number; };
for (const p of PROFILES) {
  const all: Array<Record<string, number>> = [];
  for (let i = 0; i < RUNS; i++) all.push(await once(p));
  const keys = Object.keys(all[0] ?? {});
  console.log(`${p.name.padEnd(18)} ${keys.map((k) => `${k} ${med(all.map((x) => x[k] as number))}`).join('  ')}`);
}
await browser.close();
await server.close();
