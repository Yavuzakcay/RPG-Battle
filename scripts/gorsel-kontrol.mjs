// GORSEL-DUZELTME: önce/sonra kanıt kareleri. /onizleme-kontrol.html?d=<durum> (gerçek Builder + savaş jetonu, uygulamadaki yükleme
// sırası) açılır; oluşturma ekranı önizlemesi (.wiz-preview-side) ve savaş jetonu yan yana gorsel-dokum/kontrol/<durum>-<etiket>.png.
// Çalıştırma: node scripts/gorsel-kontrol.mjs <etiket> [durum ...]   (etiket: once | sonra; durumlar db hu gf gr)
import { chromium } from 'playwright';
import { createServer } from 'vite';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const [etiket = 'once', ...rest] = process.argv.slice(2);
const durumlar = rest.length ? rest : ['db', 'hu', 'gf', 'gr', 'cc'];
const OUT = 'gorsel-dokum/kontrol';
mkdirSync(OUT, { recursive: true });
const server = await createServer({ server: { port: 0, host: '127.0.0.1', watch: { ignored: ['**/gorsel-dokum/**'] } }, logLevel: 'error',
  optimizeDeps: { entries: ['onizleme-kontrol.html', 'src/preview/kontrolOnizleme.tsx', 'src/screens/Builder.tsx'] } });
await server.listen();
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
for (const d of durumlar) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = []; page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));
  await page.goto(`${server.resolvedUrls.local[0]}onizleme-kontrol.html?d=${d}`);
  await page.waitForSelector('.wiz-preview-side svg.char-figure image', { timeout: 120000 });
  await page.waitForSelector('#kontrol-jeton image', { timeout: 120000 });
  await page.waitForTimeout(3000); // boyama (tintedUrl) ve görsellerin çözülmesi
  // Kanıt (1): kanat filtre ev sahibindeki tanım sayısı ve Blue taban paletinin orada olup olmadığı (geç yüklenen veriden sonra).
  const host = await page.evaluate(() => { const h = document.querySelector('svg[data-wing-filters]'); return { n: h ? h.querySelectorAll('filter').length : -1, blue: !!h?.querySelector('#wp-002a48-4c6c8f-e760') }; });
  const a = await page.locator('.wiz-preview-side svg.char-figure').screenshot();
  const b = await page.locator('#kontrol-jeton').screenshot();
  const [ma, mb] = await Promise.all([sharp(a).metadata(), sharp(b).metadata()]);
  const H = Math.max(ma.height, mb.height);
  await sharp({ create: { width: ma.width + mb.width + 12, height: H, channels: 4, background: '#1d2128' } })
    .composite([{ input: a, left: 0, top: Math.round((H - ma.height) / 2) }, { input: b, left: ma.width + 12, top: Math.round((H - mb.height) / 2) }])
    .png().toFile(`${OUT}/${d}-${etiket}.png`);
  const src = await page.evaluate(() => document.querySelector('#kontrol-jeton image')?.getAttribute('href') ?? '');
  const bsrc = await page.evaluate(() => [...document.querySelectorAll('.token-preview image, .token-preview img')].map((e) => e.getAttribute('href') ?? e.getAttribute('src') ?? '').join(' | '));
  console.log(`  oluşturucu önizlemesi: ${bsrc}`);
  console.log(`${OUT}/${d}-${etiket}.png · jeton ${src.startsWith('blob:') ? '(boyalı)' : src.replace(/^.*\//, '')} · kanat filtre ev sahibi: ${host.n} tanım, Blue taban paleti ${host.blue ? 'var' : 'YOK'}${errors.length ? ` (sayfa hatası: ${errors.join(' | ')})` : ''}`);
  await page.close();
}
await browser.close();
await server.close();
