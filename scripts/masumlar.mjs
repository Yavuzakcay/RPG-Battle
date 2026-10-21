// Masum jetonları: assets-ham/masumlar/masum-N.jpg (macenta arka plan) → public/masumlar/masum-N.webp (128×128, saydam).
// Çalıştırma: npm run masumlar
//
// 1. Arka plan: görüntü kenarından başlayan flood-fill; macenta tonu sıkı eşikle (G çok düşük, R ve B yüksek ve
//    birbirine yakın). JPG gürültüsüyle koyulaşmış macenta lekeler (masum-1 üst kenar) de bu tona girer. Figürün
//    içindeki kapalı boşluklar yalnızca saf arka plan rengindeki piksellerden tohumlanır; ten ve giysi bozulmaz.
// 2. Despill: arka plana 2 px'e kadar yakın, macentaya kaymış (R ve B, G'den belirgin yüksek) kenar pikselleri silinir.
// 3. Ana figüre bağlı olmayan küçük parçalar (JPG blok lekeleri) atılır.
// 4. Figür sınırına kırpılır; hepsine aynı sabit ölçek (en uzun figür 120 px), nearest-neighbor. Ayak hizası aynı
//    (alt kenar 124 px), yatayda gövde merkezi (kütle medyanı; ince baston/sepet etkilemez) ortada.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(root, 'assets-ham/masumlar');
const OUT = path.join(root, 'public/masumlar');
const SIZE = 128;
const TALLEST = 120;
const FOOT = 124;

/** Macenta arka plan tonu (sıkı): G ≤ 45, R ve B ≥ 150, |R − B| ≤ 50. */
const isMagenta = (r, g, b) => g <= 45 && r >= 150 && b >= 150 && Math.abs(r - b) <= 50;
/** Arka planın kendisi (≈255,0,250): kapalı boşluk tohumu. */
const isPureBg = (r, g, b) => g <= 20 && r >= 235 && b >= 225;
/** Kenarda macentaya kaymış karışım pikseli (despill). */
const isSpill = (r, g, b) => Math.min(r, b) - g >= 45 && Math.abs(r - b) <= 90;

async function cutout(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const n = w * h;
  const bg = new Uint8Array(n);
  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  // 1) Kenarlardan flood-fill.
  const stack = [];
  const seed = (i) => { if (!bg[i] && isMagenta(...px(i))) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
  // Kapalı boşluklar (kol ile gövde arası, kova sapının içi): kenardan ulaşılamaz; yalnızca arka planın
  // kendisine çok yakın saf macenta piksellerden tohumlanır (ten ve giysi bu renge hiç yaklaşmaz).
  for (let i = 0; i < n; i++) if (isPureBg(...px(i))) seed(i);
  while (stack.length) {
    const i = stack.pop();
    const x = i % w, y = (i / w) | 0;
    if (x > 0) seed(i - 1);
    if (x < w - 1) seed(i + 1);
    if (y > 0) seed(i - w);
    if (y < h - 1) seed(i + w);
  }
  // 2) Despill: arka plana 2 px içindeki macentaya kaymış pikseller (iki tur).
  for (let pass = 0; pass < 2; pass++) {
    const add = [];
    for (let i = 0; i < n; i++) {
      if (bg[i]) continue;
      const x = i % w, y = (i / w) | 0;
      const near = (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w]);
      if (near && isSpill(...px(i))) add.push(i);
    }
    for (const i of add) bg[i] = 1;
  }
  // 3) En büyük bağlı parça ve ona göre büyük parçalar kalır; küçük kopuk lekeler atılır.
  const comp = new Int32Array(n).fill(-1);
  const sizes = [];
  for (let s = 0; s < n; s++) {
    if (bg[s] || comp[s] >= 0) continue;
    const id = sizes.length;
    let count = 0;
    const q = [s];
    comp[s] = id;
    while (q.length) {
      const i = q.pop();
      count++;
      const x = i % w, y = (i / w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
        if (j >= 0 && !bg[j] && comp[j] < 0) { comp[j] = id; q.push(j); }
      }
    }
    sizes.push(count);
  }
  const biggest = Math.max(...sizes);
  const keep = sizes.map((c) => c >= biggest * 0.01);
  const rgba = Buffer.alloc(n * 4);
  let minX = w, minY = h, maxX = -1, maxY = -1;
  const cols = new Float64Array(w);
  let mass = 0;
  for (let i = 0; i < n; i++) {
    const on = !bg[i] && keep[comp[i]];
    if (!on) continue;
    const x = i % w, y = (i / w) | 0;
    rgba[i * 4] = data[i * 3]; rgba[i * 4 + 1] = data[i * 3 + 1]; rgba[i * 4 + 2] = data[i * 3 + 2]; rgba[i * 4 + 3] = 255;
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    cols[x]++; mass++;
  }
  // Gövde merkezi: kütlenin yatay medyanı.
  let acc = 0, center = minX;
  for (let x = minX; x <= maxX; x++) { acc += cols[x]; if (acc >= mass / 2) { center = x; break; } }
  return { rgba, w, h, box: { minX, minY, maxX, maxY }, center, removedSpots: sizes.filter((c, k) => !keep[k]).length };
}

const files = fs.readdirSync(RAW).filter((f) => /^masum-\d+\.jpg$/.test(f)).sort((a, b) => parseInt(a.slice(6)) - parseInt(b.slice(6)));
const cuts = [];
for (const f of files) cuts.push({ name: f.replace('.jpg', ''), ...(await cutout(path.join(RAW, f))) });
const tallest = Math.max(...cuts.map((c) => c.box.maxY - c.box.minY + 1));
const scale = TALLEST / tallest;
fs.mkdirSync(OUT, { recursive: true });
for (const c of cuts) {
  const { minX, minY, maxX, maxY } = c.box;
  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  const tw = Math.max(1, Math.round(bw * scale)), th = Math.max(1, Math.round(bh * scale));
  const fig = await sharp(c.rgba, { raw: { width: c.w, height: c.h, channels: 4 } })
    .extract({ left: minX, top: minY, width: bw, height: bh })
    .resize(tw, th, { kernel: 'nearest' })
    .raw().toBuffer();
  // Ayak hizası FOOT, gövde merkezi tuvalin ortasında; taşan kısım kırpılır.
  const left = Math.round(SIZE / 2 - (c.center - minX) * scale);
  const top = FOOT - th;
  const out = Buffer.alloc(SIZE * SIZE * 4);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const X = left + x, Y = top + y;
    if (X < 0 || Y < 0 || X >= SIZE || Y >= SIZE) continue;
    fig.copy(out, (Y * SIZE + X) * 4, (y * tw + x) * 4, (y * tw + x) * 4 + 4);
  }
  // Son despill (küçültülmüş tuvalde): macentaya bulaşmış koyu kenar pikseli saydamlığa değiyorsa silinir,
  // içerideyse griye çevrilir. Gerçek pembe tonlar (G yüksek) etkilenmez.
  const at = (x, y) => (x < 0 || y < 0 || x >= SIZE || y >= SIZE ? 0 : out[(y * SIZE + x) * 4 + 3]);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const k = (y * SIZE + x) * 4;
    const [r, g, b, a] = [out[k], out[k + 1], out[k + 2], out[k + 3]];
    if (!a || g > 40 || Math.min(r, b) - g < 40 || Math.abs(r - b) > 50) continue;
    if (!at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1)) out[k + 3] = 0;
    else { const v = Math.round((r + g + b) / 3 * 0.7); out[k] = v; out[k + 1] = v; out[k + 2] = v; }
  }
  await sharp(out, { raw: { width: SIZE, height: SIZE, channels: 4 } }).webp({ lossless: true }).toFile(path.join(OUT, `${c.name}.webp`));
  console.log(`${c.name}: figür ${bw}×${bh} → ${tw}×${th}, sol ${left}, üst ${top}, atılan leke ${c.removedSpots}`);
}
console.log(`ölçek ${scale.toFixed(4)} (en uzun ${tallest} px → ${TALLEST} px)`);
