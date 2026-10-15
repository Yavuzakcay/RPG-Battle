/**
 * Kara ekran kontrolü: her harita × varyant × (aynasız, aynalı) × (efekt kapalı, açık) için savaş
 * ekranını gerçek tarayıcıda (Chromium, telefon yatay ve PC) açar, sahnenin ekran görüntüsünden
 * ortalama parlaklığı ve "boş" (neredeyse siyah) piksel oranını ölçer, aynı ölçümü harita
 * görselinin kendisi için de yapar ve karşılaştırır. Görsel yüklenemezse (arayüzdeki uyarı),
 * sayfa hatası olursa ya da sahne görselden belirgin biçimde karanlıksa başarısız olur.
 *
 * Çalıştırma: `npm run check:harita` (önce bir kez `npx playwright install chromium`).
 * Tarayıcı yolu `PW_CHROMIUM` ile verilebilir. `--hizli`: yalnızca telefon boyutu. Harita kimlikleri
 * verilirse yalnızca onlar (`npm run check:harita -- col magara`).
 * Menü videosu (H.264) savaş ekranında yok; başsız Chromium'da oynatılamaması kontrolü etkilemez.
 */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';

const OUT = 'test-results/kara-ekran';
const quick = process.argv.includes('--hizli');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const maps = readdirSync('data/maps').filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(`data/maps/${f}`, 'utf8')))
  .filter((m) => only.length === 0 || only.includes(m.id))
  .sort((a, b) => a.id.localeCompare(b.id));
const sizes = quick ? [['telefon', 844, 390]] : [['telefon', 844, 390], ['pc', 1440, 900]];

/** Sahne görüntüsü görselin parlaklığının en az bu oranında olmalı. */
const MIN_RATIO = 0.55;
/** Boş piksel oranı görseldekinden en çok bu kadar fazla olabilir. */
const MAX_EXTRA_EMPTY = 0.2;
/** Mutlak alt sınırlar: en karanlık görsel (mağara) ~32; altı görsel boş ya da çözülemedi demek. */
const MIN_ART = 15;
const MIN_STAGE = 25;

const server = await createServer({ server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
mkdirSync(OUT, { recursive: true });

const measure = (page, b64) => page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = 320; c.height = Math.round((320 * img.height) / img.width);
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, c.width, c.height);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  let sum = 0; let empty = 0;
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    sum += l; if (l < 10) empty++;
  }
  return { mean: sum / (d.length / 4), empty: empty / (d.length / 4) };
}, b64);

let failures = 0;
const rows = [];
for (const map of maps) {
  for (const v of map.variants) {
    const mirrorable = v.mirrorable ?? map.mirrorable;
    for (const mirrored of mirrorable ? [false, true] : [false]) {
      for (const fx of [false, true]) {
        for (const [size, width, height] of sizes) {
          const page = await browser.newPage({ viewport: { width, height } });
          const errors = [];
          page.on('pageerror', (e) => errors.push(String(e)));
          await page.addInitScript((on) => { try { localStorage.setItem('rpg-battle-effects', on ? 'on' : 'off'); } catch { /* yok */ } }, fx);
          await page.goto(url);
          await page.click('text=GM');
          await page.click('text=Hazır savaş');
          await page.selectOption('select[aria-label="Harita"]', map.id);
          await page.selectOption('select[aria-label="Varyant"]', v.id);
          if (mirrored) await page.click('label.toggle:has-text("Aynala")');
          await page.click('button.cta');
          await page.waitForSelector('.hud-cta');
          await page.click('.hud-cta');
          await page.mouse.move(1, 1);
          await page.waitForTimeout(fx ? 1200 : 400);
          const shot = await page.locator('.mb-stage').screenshot();
          const name = `${map.id}-${v.id}${mirrored ? '-ayna' : ''}-${fx ? 'efekt' : 'duz'}-${size}`;
          const stage = await measure(page, `data:image/png;base64,${shot.toString('base64')}`);
          const art = await measure(page, `${url}${v.image}`).catch(() => ({ mean: 0, empty: 1 }));
          const artError = await page.locator('.art-error').count();
          const bad = [];
          if (artError) bad.push('görsel yüklenemedi');
          if (art.mean < MIN_ART) bad.push(`görsel boş ya da çözülemedi (parlaklık ${art.mean.toFixed(0)})`);
          if (stage.mean < MIN_STAGE) bad.push(`sahne kara (parlaklık ${stage.mean.toFixed(0)})`);
          if (errors.length) bad.push(`sayfa hatası: ${errors[0]}`);
          if (stage.mean < art.mean * MIN_RATIO) bad.push(`karanlık: parlaklık ${stage.mean.toFixed(0)} < ${(art.mean * MIN_RATIO).toFixed(0)}`);
          if (stage.empty > art.empty + MAX_EXTRA_EMPTY) bad.push(`boş piksel %${(stage.empty * 100).toFixed(0)} (görsel %${(art.empty * 100).toFixed(0)})`);
          if (bad.length) { failures++; await page.screenshot({ path: `${OUT}/${name}.png` }); }
          rows.push(`${bad.length ? 'HATA' : 'tamam'}  ${name.padEnd(42)} parlaklık ${stage.mean.toFixed(0).padStart(3)} / görsel ${art.mean.toFixed(0).padStart(3)}  boş %${(stage.empty * 100).toFixed(0).padStart(2)}${bad.length ? `  ${bad.join('; ')}` : ''}`);
          console.log(rows[rows.length - 1]);
          await page.close();
        }
      }
    }
  }
}
await browser.close();
await server.close();
console.log(`\n${rows.length} kontrol, ${failures} hata.${failures ? ` Ekran görüntüleri: ${OUT}/` : ''}`);
process.exit(failures ? 1 : 0);
