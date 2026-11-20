// Kuyruk E4c: assets-ham/efekt/kaynak-ikonlari.jpg (MACENTA zeminli, 4×2 yuvarlak madalyon) → public/kaynak/kaynak-<ad>.webp (192 px) +
// -96 ve -64 px kopyaları. Madalyonlar sayfa ızgarasına oturmadığı için kesim nesne sınırıyla (bağlı bileşen) yapılır; kenardaki pembemsi
// saçak için alfa uydurulmuş daireden gelir (yarıçap − 2,5 px, 1,2 px yumuşak kenar). Çalıştırma: npm run kaynak-ikon [-- --kontrol <klasör>].
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export const ADLAR = ['ki', 'ilham', 'ustunluk-zari', 'kader-d20', 'ruh-kristali', 'buyu-puani', 'sifa-havuzu', 'arcanum'];
export const BOYUTLAR = [192, 96, 64];

// Ortak çekirdek (macenta anahtar, bağlı bileşen, okuma sırası, elips alfa): scripts/lib/madalyon.mjs; glif kesimi de kullanır.
export { isMagenta, components, readingOrder } from './lib/madalyon.mjs';
import { colorKeyMask, components, medallionRgba, readingOrder } from './lib/madalyon.mjs';

export async function importIcons({ src = 'assets-ham/efekt/kaynak-ikonlari.jpg', outDir = 'public/kaynak', kontrol = null } = {}) {
  if (!fs.existsSync(src)) { console.log(`${src} yok; işlenecek ikon sayfası yok.`); return null; }
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const mask = colorKeyMask(data, w, h);
  const comps = readingOrder(components(mask, w, h));
  if (comps.length !== ADLAR.length) throw new Error(`${src}: ${comps.length} madalyon bulundu, beklenen ${ADLAR.length}`);
  fs.mkdirSync(outDir, { recursive: true });
  const report = [];
  const sheet = [];
  for (let k = 0; k < comps.length; k++) {
    const c = comps[k]; const ad = ADLAR[k];
    // Madalyon hafif elips olabilir (alt sıra 529×551): alfa elipsten, sonra kare kutuya oranlanır (yuvarlak görünür).
    const { rgba, cw, ch } = medallionRgba(data, w, c);
    const base = sharp(rgba, { raw: { width: cw, height: ch, channels: 4 } });
    for (const px of BOYUTLAR) {
      const file = path.join(outDir, px === BOYUTLAR[0] ? `kaynak-${ad}.webp` : `kaynak-${ad}-${px}.webp`);
      await base.clone().resize(px, px, { kernel: 'lanczos3', fit: 'fill' }).webp({ quality: 92, alphaQuality: 100, effort: 5 }).toFile(file);
    }
    report.push(`${ad}: ${cw}×${ch} px, alan ${c.area}`);
    sheet.push(await base.clone().resize(128, 128, { fit: 'fill' }).png().toBuffer());
  }
  if (kontrol) {
    fs.mkdirSync(kontrol, { recursive: true });
    await sharp({ create: { width: 4 * 136 + 8, height: 2 * 136 + 8, channels: 4, background: { r: 60, g: 60, b: 70, alpha: 1 } } })
      .composite(sheet.map((input, i) => ({ input, left: 8 + (i % 4) * 136, top: 8 + Math.floor(i / 4) * 136 }))).png().toFile(path.join(kontrol, 'kaynak-ikonlari.png'));
  }
  return report;
}

if (process.argv[1] && process.argv[1].endsWith('kaynak-ikon.mjs')) {
  const i = process.argv.indexOf('--kontrol');
  const r = await importIcons({ kontrol: i >= 0 ? process.argv[i + 1] : null });
  if (r) console.log(r.join('\n'), `\n${r.length} ikon → public/kaynak/ (192, 96, 64 px)`);
}
