/**
 * Görev ODA-1 (O1) bitti ölçütü, uçtan uca (npm test dışında): aynı tarayıcıda iki sekme. GM sekmesi oda kurar ve
 * "Çevrimiçi aç" der; oyuncu sekmesi kodla katılır ve karakter kopyası gönderir; GM savaşı başlatır; oyuncu sekmesi
 * savaşı salt izler ve GM'in her komutu (sıra şeridi) oyuncu sekmesinde de görünür. Tek ekran görüntüsü
 * `docs/oda-1/iki-sekme.png` (`--ekran`).
 *
 * Çalıştırma: `node scripts/oda-sekme-e2e.mjs [--ekran]` (Vite geliştirme sunucusu kendiliğinden açılır).
 */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';

const ekran = process.argv.includes('--ekran');
const server = await createServer({
  server: { port: 0, host: '127.0.0.1' }, logLevel: 'error',
  optimizeDeps: { entries: ['index.html', 'src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/test-setup.ts'] },
});
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => {
  try { localStorage.setItem('rpg-battle-effects', 'off'); localStorage.setItem('rpg-battle-dice-anim', 'off'); localStorage.setItem('rpg-battle-acilis', 'off'); } catch { /* yok */ }
});
const hatalar = [];
const sayfa = async (ad) => {
  const p = await ctx.newPage();
  p.setDefaultTimeout(60_000);
  p.on('pageerror', (e) => hatalar.push(`${ad}: ${e}`));
  return p;
};
const adim = (s) => console.log(`· ${s}`);
let sonuc = 1;
try {
  const gm = await sayfa('gm');
  await gm.goto(url);
  // Oyuncunun karakterleri (aynı tarayıcı: ortak localStorage; GM partisi yalnız gelen kopyalardan).
  await gm.evaluate(async () => {
    const f = await import('/src/screens/fixtures.ts');
    localStorage.setItem('rpg-battle-characters', JSON.stringify(f.demoCharacters().slice(0, 1)));
  });
  await gm.reload();
  await gm.click('[data-testid="home-room-create"]');
  await gm.click('[data-testid="oda-create"]');
  await gm.waitForSelector('[data-testid="map-region"]');
  // Kurulumdaki yerel karakter işaretini kaldır: partide yalnız kopya olsun.
  for (const c of await gm.locator('[data-testid="party-chip"] input:checked').all()) await c.uncheck();
  await gm.click('[data-testid="oda-cevrimici-ac"]');
  const kod = (await gm.locator('[data-testid="oda-kod"]').textContent())?.trim() ?? '';
  adim(`GM oda açtı, kod ${kod}`);
  if (!/^[1-9]\d{5}$/.test(kod)) throw new Error(`kod geçersiz: ${kod}`);

  const oy = await sayfa('oyuncu');
  await oy.goto(url);
  await oy.click('.home-card.join');
  await oy.fill('[data-testid="oda-kod-gir"]', kod);
  await oy.click('[data-testid="oda-katil"]');
  await oy.waitForSelector('[data-testid="oda-lobi"]');
  await oy.click('[data-testid="oda-kopya-gonder"]');
  adim('oyuncu kodla katıldı, karakter kopyası gönderdi');
  await gm.waitForFunction(() => document.querySelector('[data-testid="oda-cevrimici"]')?.textContent?.includes('1'));
  await gm.waitForSelector('[data-testid="party-chip"] input:checked');
  adim('GM partisinde kopya işaretli');

  await gm.click('[data-testid="map-start"]');
  await gm.click('[data-testid="battle-start"]');
  await gm.waitForSelector('[data-testid="battle-stage"]');
  await oy.waitForSelector('[data-testid="oda-izle-bar"]');
  await oy.waitForSelector('[data-testid="battle-stage"]');
  adim('savaş başladı; oyuncu sekmesi izliyor');

  const simdiki = (p) => p.locator('.turn-strip .strip-item.now').first().getAttribute('aria-label').catch(() => null);
  for (let i = 0; i < 4; i++) {
    const once = await simdiki(gm);
    const dusman = gm.locator('.hud-btn.enemy-play');
    if (await dusman.count()) await dusman.first().click();
    else await gm.locator('.radial-btn', { hasText: 'Turu bitir' }).first().click();
    await gm.waitForFunction((o) => document.querySelector('.turn-strip .strip-item.now')?.getAttribute('aria-label') !== o, once);
    const g = await simdiki(gm);
    await oy.waitForFunction((x) => document.querySelector('.turn-strip .strip-item.now')?.getAttribute('aria-label') === x, g, { timeout: 5000 });
    adim(`komut ${i + 1}: iki sekmede sıra ${g}`);
  }
  if (ekran) {
    mkdirSync('docs/oda-1', { recursive: true });
    await oy.screenshot({ path: 'docs/oda-1/iki-sekme.png' });
    adim('ekran görüntüsü docs/oda-1/iki-sekme.png');
  }
  if (hatalar.length) throw new Error(hatalar[0]);
  console.log('tamam: O1 iki sekme akışı');
  sonuc = 0;
} catch (e) {
  console.error(`HATA: ${String(e?.message ?? e).split('\n')[0]}`);
  for (const h of hatalar) console.error(`  sayfa hatası ${h}`);
} finally {
  await browser.close();
  await server.close();
}
process.exit(sonuc);
