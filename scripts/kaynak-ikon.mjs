// Kuyruk E4c: assets-ham/efekt/kaynak-ikonlari.jpg (MACENTA zeminli, 4×2 yuvarlak madalyon) → public/kaynak/kaynak-<ad>.webp (192 px) +
// -96 ve -64 px kopyaları. Madalyonlar sayfa ızgarasına oturmadığı için kesim nesne sınırıyla (bağlı bileşen) yapılır; kenardaki pembemsi
// saçak için alfa uydurulmuş daireden gelir (yarıçap − 2,5 px, 1,2 px yumuşak kenar). Çalıştırma: npm run kaynak-ikon [-- --kontrol <klasör>].
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export const ADLAR = ['ki', 'ilham', 'ustunluk-zari', 'kader-d20', 'ruh-kristali', 'buyu-puani', 'sifa-havuzu', 'arcanum'];
export const BOYUTLAR = [192, 96, 64];

/** Macenta zemin: R ve B, G'nin en az 90 üstünde (pembemsi saçak dahil; madalyon renkleri bu eşiğin altında). */
export const isMagenta = (r, g, b) => r - g > 90 && b - g > 90;

/** Bağlı bileşenler (8 komşu, yığınla): { area, x0, y0, x1, y1 } listesi, alanı `minArea` altı atılır. */
export function components(mask, w, h, minArea = 50000) {
  const seen = new Uint8Array(w * h); const out = [];
  const stack = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || seen[i]) continue;
    let area = 0; let x0 = w; let y0 = h; let x1 = -1; let y1 = -1;
    stack.push(i); seen[i] = 1;
    while (stack.length) {
      const p = stack.pop(); const x = p % w; const y = (p - x) / w;
      area++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx; const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (mask[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
      }
    }
    if (area >= minArea) out.push({ area, x0, y0, x1, y1 });
  }
  return out;
}

/** Soldan sağa, üst sıra sonra alt sıra: önce satır (merkez y, yarım madalyon çapı toleransı), sonra x. */
export function readingOrder(comps) {
  const mid = (c) => (c.y0 + c.y1) / 2;
  const size = comps.reduce((s, c) => s + (c.x1 - c.x0), 0) / comps.length;
  const sorted = [...comps].sort((a, b) => mid(a) - mid(b));
  const rows = [];
  for (const c of sorted) {
    const row = rows.find((r) => Math.abs(mid(r[0]) - mid(c)) < size / 2);
    if (row) row.push(c); else rows.push([c]);
  }
  return rows.flatMap((r) => r.sort((a, b) => a.x0 - b.x0));
}

export async function importIcons({ src = 'assets-ham/efekt/kaynak-ikonlari.jpg', outDir = 'public/kaynak', kontrol = null } = {}) {
  if (!fs.existsSync(src)) { console.log(`${src} yok; işlenecek ikon sayfası yok.`); return null; }
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = isMagenta(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]) ? 0 : 1;
  const comps = readingOrder(components(mask, w, h));
  if (comps.length !== ADLAR.length) throw new Error(`${src}: ${comps.length} madalyon bulundu, beklenen ${ADLAR.length}`);
  fs.mkdirSync(outDir, { recursive: true });
  const report = [];
  const sheet = [];
  for (let k = 0; k < comps.length; k++) {
    const c = comps[k]; const ad = ADLAR[k];
    const cw = c.x1 - c.x0 + 1; const ch = c.y1 - c.y0 + 1;
    // Madalyon hafif elips olabilir (alt sıra 529×551): alfa elipsten, sonra kare kutuya oranlanır (yuvarlak görünür).
    const ra = cw / 2 - 2.5; const rb = ch / 2 - 2.5;
    const cx = (cw - 1) / 2; const cy = (ch - 1) / 2;
    const rgba = Buffer.alloc(cw * ch * 4);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const e = Math.hypot((x - cx) / ra, (y - cy) / rb); // 1 = elips kenarı
      const dist = (e - 1) * Math.min(ra, rb);
      const a = Math.max(0, Math.min(1, 0.5 - dist / 1.2));
      if (a <= 0) continue;
      const s = ((c.y0 + y) * w + c.x0 + x) * 3; const d = (y * cw + x) * 4;
      rgba[d] = data[s]; rgba[d + 1] = data[s + 1]; rgba[d + 2] = data[s + 2]; rgba[d + 3] = Math.round(a * 255);
    }
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
