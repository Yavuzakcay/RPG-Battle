// Kuyruk 14 SP1: Gemini sprite'larını içe aktarır. Çalıştırma:
//   npm run sprite-ice [klasör] [--golge-sil] [--tolerans N] [--boyut N] [--cikti klasör]
// assets-ham/sprite/*.(png|jpg|jpeg) → public/sprites/<ad>.webp (kayıpsız) + data/sprite-mevcut.json (üretilen adlar).
// Adımlar: köşe renginden zemin (toleranslı), dışarıdan doldurma + iç boşluklar (ağ delikleri), yeşil ya da magenta
// (Kuyruk 16 K16A) hale temizliği,
// isteğe bağlı koyu yeşil düşme gölgesi silme, içeriğe kırpma (+2 px), en yakın komşuyla hedef boya küçültme.
// Boyut/oran sorunlarında uyarır, düzeltmez. Hedefler: yuzey- 128 px, nesne- 96 px (docs/sprite-boyutlari.md).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const SRC = args.find((a, i) => !a.startsWith('--') && !['--tolerans', '--boyut', '--cikti'].includes(args[i - 1])) ?? 'assets-ham/sprite';
const OUT = opt('--cikti', 'public/sprites');
const LIST = opt('--liste', path.join(OUT === 'public/sprites' ? 'data' : OUT, 'sprite-mevcut.json'));
const TOL = Number(opt('--tolerans', 70));
const SHADOW = flag('--golge-sil');
const PAD = 2;
const sizeFor = (name) => Number(opt('--boyut', 0)) || (name.startsWith('nesne-') ? 96 : 128);
const NAME_RE = /^(yuzey|nesne)-[a-z0-9]+(?:-[a-z0-9]+)*$/;

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const greenish = (r, g, b) => g > 110 && g - Math.max(r, b) > 45;
/** Magenta anahtar: R ve B yüksek, G ikisinden belirgin düşük (Kuyruk 16 K16A). */
const magentish = (r, g, b) => r > 110 && b > 110 && Math.min(r, b) - g > 60;
/** Magenta taşması: R ve B'nin küçüğü G'den bu kadar fazlaysa piksel anahtar rengiyle karışmış sayılır. */
const MAGENTA_SPILL = 10;

export async function processSprite(file, { tol = TOL, shadow = SHADOW, size } = {}) {
  const warnings = [];
  const img = sharp(file).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = (x, y) => (y * w + x) * 4;
  // Zemin rengi: dört köşenin (3×3) ortalaması.
  const corners = [[0, 0], [w - 3, 0], [0, h - 3], [w - 3, h - 3]].map(([cx, cy]) => {
    let r = 0, g = 0, b = 0;
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) { const i = px(cx + dx, cy + dy); r += data[i]; g += data[i + 1]; b += data[i + 2]; }
    return [r / 9, g / 9, b / 9];
  });
  const bg = [0, 1, 2].map((k) => corners.reduce((s, c) => s + c[k], 0) / 4);
  if (Math.max(...corners.map((c) => dist(c, bg))) > tol) warnings.push('köşe renkleri farklı (zemin tek renk değil)');
  const magentaKey = magentish(bg[0], bg[1], bg[2]);
  const keyish = magentaKey ? magentish : greenish;
  const isBg = (i, t) => dist([data[i], data[i + 1], data[i + 2]], bg) <= t || (keyish(data[i], data[i + 1], data[i + 2]) && dist([data[i], data[i + 1], data[i + 2]], bg) <= t * 2.2);
  // Dışarıdan doldurma (kenara bağlı zemin).
  const clear = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push([x, 0], [x, h - 1]);
  for (let y = 0; y < h; y++) stack.push([0, y], [w - 1, y]);
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h || clear[y * w + x] || !isBg(px(x, y), tol)) continue;
    clear[y * w + x] = 1;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  // İç boşluklar (ağ delikleri): kenara bağlı olmayan, zemine daha sıkı benzeyen pikseller.
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!clear[y * w + x] && isBg(px(x, y), tol * 0.8)) clear[y * w + x] = 2;
  // Koyu yeşil düşme gölgesi.
  if (shadow) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = px(x, y); const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (!clear[y * w + x] && g > r + 15 && g > b + 15 && (r + g + b) / 3 < 90) clear[y * w + x] = 3;
  }
  for (let k = 0; k < w * h; k++) if (clear[k]) data[k * 4 + 3] = 0;
  // Hale: şeffafa komşu yeşilimsi pikseller silinir, kalan yeşil taşma bastırılır.
  const nearClear = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X < 0 || Y < 0 || X >= w || Y >= h || clear[Y * w + X]; });
  if (!magentaKey) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (clear[y * w + x] || !nearClear(x, y)) continue;
    const i = px(x, y); const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (greenish(r, g, b) && dist([r, g, b], bg) <= tol * 2.5) { data[i + 3] = 0; continue; }
    if (g > Math.max(r, b)) data[i + 1] = Math.max(r, b);
  }
  // Magenta hale (Kuyruk 16 K16A): şeffafa komşu halkada (iki tur, içe doğru) magentaya yakın piksel silinir; anahtarla
  // karışmış kenar pikseli (R ve B, G'den belirgin yüksek) içerideki magentasız komşuların ortalamasıyla boyanır, böylece
  // sprite'ın kendi tonu (ör. zehirde zeytin-sarı) korunur. Komşu yoksa silinir.
  // İlk turdan sonra yalnızca düzeltilmiş pikselin komşusundaki magenta taşmaları (halka içe doğru ilerler).
  const touched = new Uint8Array(w * h);
  const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const spilled = (x, y) => N8.some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < w && Y < h && touched[Y * w + X]; });
  const nearClear8 = (x, y) => N8.some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X < 0 || Y < 0 || X >= w || Y >= h || clear[Y * w + X]; });
  if (magentaKey) for (let ring = 0; ring < 4; ring++) {
    const fix = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (clear[y * w + x] || touched[y * w + x] || !(nearClear8(x, y) || spilled(x, y))) continue;
      const i = px(x, y); const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      if (magentish(r, g, b) && dist([r, g, b], bg) <= tol * 2.5) { fix.push([x, y, null]); continue; }
      if (Math.min(r, b) - g <= MAGENTA_SPILL) continue;
      let n = 0; const acc = [0, 0, 0];
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const X = x + dx, Y = y + dy;
        if ((!dx && !dy) || X < 0 || Y < 0 || X >= w || Y >= h || clear[Y * w + X]) continue;
        const j = px(X, Y);
        if (Math.min(data[j], data[j + 2]) - data[j + 1] > MAGENTA_SPILL) continue;
        acc[0] += data[j]; acc[1] += data[j + 1]; acc[2] += data[j + 2]; n++;
      }
      fix.push([x, y, n ? acc.map((v) => Math.round(v / n)) : null]);
    }
    if (!fix.length) break;
    for (const [x, y, c] of fix) {
      const i = px(x, y);
      touched[y * w + x] = 1;
      if (c) { data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; } else { data[i + 3] = 0; clear[y * w + x] = 4; }
    }
  }
  // İçeriğe kırp.
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[px(x, y) + 3] > 0) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (x1 < 0) throw new Error('boş görsel (her şey zemin sayıldı; --tolerans düşür)');
  const left = Math.max(0, x0 - PAD), top = Math.max(0, y0 - PAD);
  const cw = Math.min(w, x1 + PAD + 1) - left, ch = Math.min(h, y1 + PAD + 1) - top;
  const ratio = cw / ch;
  if (ratio > 2.5 || ratio < 0.4) warnings.push(`oran sıra dışı (${cw}×${ch})`);
  const target = size ?? 128;
  if (Math.max(cw, ch) < target) warnings.push(`kaynak hedeften küçük (${cw}×${ch} < ${target}); büyütülmedi`);
  let out = sharp(data, { raw: { width: w, height: h, channels: 4 } }).extract({ left, top, width: cw, height: ch });
  if (Math.max(cw, ch) > target) out = out.resize({ width: cw >= ch ? target : undefined, height: ch > cw ? target : undefined, kernel: 'nearest' });
  const webp = await out.webp({ lossless: true }).toBuffer({ resolveWithObject: true });
  return { buffer: webp.data, width: webp.info.width, height: webp.info.height, warnings, bg };
}

async function main() {
  if (!fs.existsSync(SRC)) { console.log(`${SRC} yok; işlenecek sprite yok.`); return; }
  const files = fs.readdirSync(SRC).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
  fs.mkdirSync(OUT, { recursive: true });
  const made = [];
  for (const f of files) {
    const name = f.replace(/\.(png|jpe?g)$/i, '').toLowerCase();
    if (!NAME_RE.test(name)) { console.warn(`${f}: ad kuralına uymuyor (yuzey-<ad>[-n] ya da nesne-<ad>); atlandı`); continue; }
    try {
      const r = await processSprite(path.join(SRC, f), { size: sizeFor(name) });
      fs.writeFileSync(path.join(OUT, `${name}.webp`), r.buffer);
      made.push(name);
      console.log(`${f} → ${OUT}/${name}.webp ${r.width}×${r.height}${r.warnings.length ? ` ⚠ ${r.warnings.join('; ')}` : ''}`);
    } catch (e) { console.warn(`${f}: ${e.message}`); }
  }
  const all = fs.readdirSync(OUT).filter((f) => f.endsWith('.webp')).map((f) => f.replace(/\.webp$/, '')).sort();
  fs.writeFileSync(LIST, `${JSON.stringify({ note: 'npm run sprite-ice üretir: public/sprites/ içindeki sprite adları (çizim yalnızca bunları kullanır).', sprites: all }, null, 2)}\n`);
  console.log(`${made.length} sprite işlendi; liste ${LIST} (${all.length}).`);
}

if (process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) await main();
