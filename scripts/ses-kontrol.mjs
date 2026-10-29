/**
 * Ses akışı kontrolü (Görev S, gerçek tarayıcıda): ilk dokunuşta AudioContext çalışıyor mu, kanallar kurulu mu,
 * menüde menü müziği, Game Master kurulumunda da yalnızca menü müziği (harita/varyant değişse de ortam yok), savaş
 * ekranında ortam + savaş müziği, savaştan çıkınca menü müziği, kayıtlı savaşı yüklemek, sekme gizlenince askıya alma.
 * Kulakla dinleme yerine motorun durumunu (`window.__rpgSes.debug()`) okur. Çalıştırma: `node scripts/ses-kontrol.mjs`
 * (Chromium yolu gerekiyorsa PW_CHROMIUM).
 */
import { chromium } from 'playwright';
import { createServer } from 'vite';

const server = await createServer({ server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({
  ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
  args: ['--autoplay-policy=user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('rpg-battle-theme', 'light'); } catch { /* yok */ } });
// Otomatik oynatma kısıtı (Chrome'un "user gesture required" davranışı): headless kabuk bayrağı yok saydığı için taklit
// edilir; dokunuşa dek bağlam askıda, resume() beklemede kalır.
await page.addInitScript(() => {
  const AC = window.AudioContext;
  if (!AC) return;
  let gesture = false;
  for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, () => { gesture = true; }, { capture: true });
  const resume = AC.prototype.resume;
  AC.prototype.resume = function () { return gesture ? resume.call(this) : new Promise(() => {}); };
  window.AudioContext = class extends AC { constructor(...a) { super(...a); if (!gesture) void this.suspend(); } };
});
await page.goto(url);
await page.evaluate(async () => {
  const f = await import('/src/screens/fixtures.ts');
  localStorage.setItem('rpg-battle-characters', JSON.stringify(f.demoCharacters()));
});
await page.reload();
const debug = () => page.evaluate(() => window.__rpgSes.debug());
const wait = (ms) => page.waitForTimeout(ms);
const checks = [];
const check = (name, ok, info) => { checks.push({ name, ok, info }); console.log(`${ok ? 'tamam' : 'HATA '}  ${name}  ${JSON.stringify(info)}`); };

await wait(1200);
let d = await debug();
// Görev U: motor sayfa açılınca yüklenir ve menü müziğini önyükler; otomatik oynatma kısıtı varsa çalmaz, bekler.
check('dokunmadan önce çalmıyor (otomatik oynatma engeli), menü müziği önyüklendi', !d.unlocked && d.playing.length === 0 && d.state !== 'running' && d.prefetched.includes('menu-light'), d);
await page.mouse.click(5, 5);
await wait(2500);
d = await debug();
check('ilk dokunuşta bağlam çalışıyor, kanallar kurulu', d.state === 'running' && d.buses.join() === 'master,ambient,music,effects', d);
check('menüde menü müziği (açık tema)', d.playing.join() === 'menu:menu-light', d);

// Tema değişince menü müziği çapraz geçişle değişir.
await page.click('header button:has-text("açık")');
await wait(2500);
d = await debug();
check('tema koyu: menü müziği menu-dark', d.playing.join() === 'menu:menu-dark', d);

await page.click('button.role >> nth=1');
await wait(1500);
d = await debug();
check('Game Master kurulumunda yalnızca menü müziği', d.playing.join() === 'menu:menu-dark', d);
await page.selectOption('select[aria-label="Harita"]', 'orman');
await page.check('[aria-label="Varyant"] input[value="gece"]');
await wait(1500);
await page.selectOption('select[aria-label="Harita"]', 'volkan');
await page.check('[aria-label="Varyant"] input[value="uyuyan-ejderha"]');
await wait(2500);
d = await debug();
check('kurulumda harita ve varyant değişince de ortam sesi yok', d.playing.join() === 'menu:menu-dark', d);

await page.click('button.cta');
await page.waitForSelector('.hud-cta');
await wait(3000);
d = await debug();
check('savaş ekranına girince menü kapanır; ortam + gece müziği (uyuyan ejderha kuralı)', d.playing.sort().join() === 'a:ortam-volkan-a,a:ortam-volkan-b,m:muzik-savas-gece', d);
await page.click('.hud-cta');
await wait(2000);
// İnisiyatif zarları: atış ve durma (3D'de sekme) sesleri çaldı.
const groups = new Set(d.effects.map((e) => e.replace(/-\d+$/, '')));
check('zar sesleri çaldı (atış, durma)', (groups.has('zar-tekli') || groups.has('zar-coklu')) && groups.has('zar-dur'), d.effects);

await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
await wait(500);
d = await debug();
check('sekme gizlenince askıya alınır', d.state === 'suspended', d);
await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
await wait(500);
d = await debug();
check('geri gelince devam eder', d.state === 'running', d);

// Kayıtlı savaş: savaşı kaydet, ana ekrana dön (menü müziği, ortam kapalı), kayıttan devam et (ortam + müzik).
await page.evaluate(async () => {
  const data = await import('/src/data/index.ts');
  await data.loadMonsters();
  const setup = await import('/src/app/setup.ts');
  const session = await import('/src/ui/session.ts');
  const save = await import('/src/app/battleSave.ts');
  const f = await import('/src/screens/fixtures.ts');
  const plan = { party: f.demoCharacters().map((c) => ({ id: c.id, sheet: c.sheet })), enemies: [{ monster: data.getMonster('wolf'), count: 2 }],
    mapId: 'volkan', variantId: 'normal', mirrored: false };
  const s = session.dispatch(setup.createMapBattle(setup.planParticipants(plan), plan, Math.random), { type: 'start_battle' }, Math.random);
  save.saveBattle(s);
});
// Yeniden yüklemede tema yine açık (başlangıç betiği).
await page.reload();
await page.waitForSelector('button.role');
await page.mouse.click(5, 5);
await wait(2500);
d = await debug();
check('ana ekranda menü müziği, ortam yok', d.playing.join() === 'menu:menu-light', d);
await page.click('text=Kayıtlı savaşa devam et');
await page.waitForSelector('.mb-stage');
await wait(3000);
d = await debug();
check('kayıtlı savaşı yüklemek: ortam + gündüz müziği (Volkan, ejderha yok), menü kapalı', d.playing.sort().join() === 'a:ortam-volkan-a,a:ortam-volkan-b,m:muzik-savas-gunduz', d);
// Savaştan çıkış (menüdeki "Kuruluma dön"): ortam ve müzik kapanır, menü müziği döner.
await page.click('button.hud-btn[aria-label]:has-text("≡")');
await page.click('.hud-pop button:has-text("Kuruluma dön")');
await wait(3000);
d = await debug();
check('savaştan çıkınca menü müziği döner, ortam kapalı', d.playing.join() === 'menu:menu-light', d);

check('sayfa hatası yok', errors.length === 0, errors);
await browser.close();

// Görev U: tarayıcı otomatik oynatmaya izin veriyorsa menü müziği dokunuşsuz başlar.
const free = await chromium.launch({
  ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const p2 = await free.newPage({ viewport: { width: 1280, height: 800 } });
await p2.addInitScript(() => { try { localStorage.setItem('rpg-battle-theme', 'light'); } catch { /* yok */ } });
await p2.goto(url);
await p2.waitForTimeout(3000);
d = await p2.evaluate(() => window.__rpgSes.debug());
check('otomatik oynatma serbestse menü müziği dokunuşsuz başlar', d.unlocked && d.state === 'running' && d.playing.join() === 'menu:menu-light', d);
await free.close();
await server.close();
const bad = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length} kontrol, ${bad} hata.`);
process.exit(bad ? 1 : 0);
