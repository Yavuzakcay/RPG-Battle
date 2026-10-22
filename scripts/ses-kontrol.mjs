/**
 * Ses akışı kontrolü (Görev S, gerçek tarayıcıda): ilk dokunuşta AudioContext çalışıyor mu, kanallar kurulu mu,
 * menüde menü müziği, Game Master kurulumunda yalnızca ortam, savaşta ortam + müzik, sekme gizlenince askıya alma.
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

let d = await debug();
check('dokunmadan önce bağlam yok (otomatik oynatma engeli)', d.state === 'none' && !d.unlocked, d);
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
await page.selectOption('select[aria-label="Harita"]', 'volkan');
await page.check('[aria-label="Varyant"] input[value="uyuyan-ejderha"]');
await wait(2500);
d = await debug();
check('kurulumda yalnızca ortam (Volkan a + b)', d.playing.sort().join() === 'a:ortam-volkan-a,a:ortam-volkan-b', d);

await page.click('button.cta');
await page.waitForSelector('.hud-cta');
await wait(1500);
d = await debug();
check('savaş yerleşiminde ortam sürüyor, müzik yok', d.playing.sort().join() === 'a:ortam-volkan-a,a:ortam-volkan-b', d);
await page.click('.hud-cta');
await wait(3000);
d = await debug();
check('savaş başlayınca gece müziği (uyuyan ejderha kuralı) ortamın altında', d.playing.sort().join() === 'a:ortam-volkan-a,a:ortam-volkan-b,m:muzik-savas-gece', d);
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

check('sayfa hatası yok', errors.length === 0, errors);
await browser.close();
await server.close();
const bad = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length} kontrol, ${bad} hata.`);
process.exit(bad ? 1 : 0);
