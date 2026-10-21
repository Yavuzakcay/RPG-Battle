// Hasar efekti sprite'ları: assets-ham/efektler/<ad>.jpg (macenta arka planda çerçeveli kareler, yan yana)
// → public/efektler/<ad>.webp (128×128 karelerden tek yatay şerit) + data/efekt-sprites.json.
// Çalıştırma: npm run efektler
//
// 1. Kareler çerçeve dikdörtgenlerinden bulunur (sabit eşit bölme yok; burn'de kare genişlikleri farklı):
//    uzun dikey koyu çizgi (yüksekliğin ≥ %20'si ve ≥ 100 px) olan sütunlar dikey kenar; iki dikey kenar arası,
//    üstünde yatay koyu kenar varsa bir karedir (macenta aralıklar kare sayılmaz). Kare çerçevenin içinden,
//    çerçeve kalınlığı + 4 px payla kırpılır.
// 2. Arka plan: macenta/pembe tonu (R ve B yüksek, G belirgin düşük; JPG gürültüsü ve açık pembe zemin dahil)
//    kenardan flood-fill ve içeride kalan aynı tondaki parazit pikseller silinir; ardından arka plana 2 px
//    içindeki macentaya kaymış pikseller (despill). Parçacık efektleri olduğu için küçük parçalar atılmaz.
//    Zehrin mor kabarcık ve dumanı gerçek içeriktir (B > R); buz ve kanda mor/pembe olmadığından oradaki
//    karışım pikselleri renk olarak düzeltilir (`untint`).
// 3. Her efektte bütün karelere aynı ölçek ve çıpa: içeriklerin kare çerçevesine göre birleşik sınırı tek bir
//    pencere olur (kare başına ortalama yok, titreme olmaz). Asit ve kanama damlası karenin üstünden başlar:
//    pencerenin üstü karenin üst kenarına sabitlenir. 128×128, nearest-neighbor.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(root, 'assets-ham/efektler');
const OUT = path.join(root, 'public/efektler');
const DATA = path.join(root, 'data/efekt-sprites.json');
const SIZE = 128;
const FIT = 124;
const PAD = 4;
const FRAME_MS = 110;

/** Efektler: hangi hasar türünde oynar ve çıpası (üst: damla karenin üstünden başlar). */
const EFFECTS = {
  burn: { damageTypes: ['fire'], anchor: 'center' },
  poison: { damageTypes: ['poison'], anchor: 'center' },
  // Buzda mor yok: pembeye kaymış piksellerde kırmızı yeşile çekilir (lavanta → buz mavisi).
  freeze: { damageTypes: ['cold'], anchor: 'center', untint: (r, g, b) => [Math.min(r, g + 10), g, b] },
  acid: { damageTypes: ['acid'], anchor: 'top' },
  // Kanda mavi yok: pembeye kaymış piksellerde mavi kırmızıya göre sınırlanır (pembe → kan kırmızısı).
  bleed: { damageTypes: [], conditions: ['Infernal Wound'], anchor: 'top', untint: (r, g, b) => [r, g, Math.min(b, Math.round(r * 0.35))] },
};

/**
 * Macenta/pembe arka plan ve parazit: R ve B yüksek ve neredeyse eşit, G belirgin düşük. Zehrin mor
 * kabarcıkları (≈160,60,200: B, R'den ~40 fazla) bu yüzden korunur.
 */
const isMagenta = (r, g, b) => r >= 140 && b >= 140 && g <= Math.min(r, b) - 70 && Math.abs(r - b) <= 25;
/** Despill: arka plana komşu, macentaya kaymış parlak karışım pikseli (koyu mor dış çizgiler korunur). */
const isSpill = (r, g, b) => Math.max(r, b) >= 110 && Math.min(r, b) - g >= 50 && Math.abs(r - b) <= 30;
/** Çerçeve çizgisi: koyu (siyah ya da asitteki gibi koyu zeytin), macenta değil. */
const isDark = (r, g, b) => Math.max(r, g, b) < 120 && !isMagenta(r, g, b);

/** Koyu sütun kesimleri: [{x0, x1, top, bottom}] (uzun dikey koyu çizgiler). */
function verticalBorders(dark, w, h) {
  const minRun = Math.max(100, Math.round(h * 0.2));
  const cols = [];
  for (let x = 0; x < w; x++) {
    let best = { len: 0, top: 0 }, run = 0;
    for (let y = 0; y < h; y++) {
      if (dark[y * w + x]) { run++; if (run > best.len) best = { len: run, top: y - run + 1 }; } else run = 0;
    }
    if (best.len >= minRun) cols.push({ x, top: best.top, bottom: best.top + best.len - 1 });
  }
  const segs = [];
  for (const c of cols) {
    const last = segs[segs.length - 1];
    if (last && c.x - last.x1 <= 2) { last.x1 = c.x; last.top = Math.min(last.top, c.top); last.bottom = Math.max(last.bottom, c.bottom); }
    else segs.push({ x0: c.x, x1: c.x, top: c.top, bottom: c.bottom });
  }
  return segs;
}

/** Bir satır aralığındaki koyu oran (x0..x1). */
const rowDark = (dark, w, y, x0, x1) => { let n = 0; for (let x = x0; x <= x1; x++) n += dark[y * w + x]; return n / (x1 - x0 + 1); };

/** Kareler: iki dikey kenar arası, üstünde ve altında yatay kenar olan dikdörtgenler; iç kutu (pay dahil). */
function findFrames(dark, w, h) {
  const segs = verticalBorders(dark, w, h);
  const frames = [];
  for (let i = 0; i + 1 < segs.length; i++) {
    const L = segs[i], R = segs[i + 1];
    const x0 = L.x1 + 1, x1 = R.x0 - 1;
    if (x1 - x0 < 40) continue;
    const top = Math.max(L.top, R.top), bottom = Math.min(L.bottom, R.bottom);
    // Üst yatay kenar: kenarın başladığı yerin çevresinde ≥ %80 koyu satırlar.
    let yTop = -1;
    for (let y = Math.max(0, top - 6); y <= Math.min(h - 1, top + 40); y++) if (rowDark(dark, w, y, x0, x1) >= 0.8) yTop = y;
    let yBot = -1;
    for (let y = Math.min(h - 1, bottom + 6); y >= Math.max(0, bottom - 40); y--) if (rowDark(dark, w, y, x0, x1) >= 0.8) yBot = y;
    if (yTop < 0 || yBot < 0 || yBot - yTop < 40) continue; // macenta aralık: kare değil
    const thick = Math.max(L.x1 - L.x0 + 1, R.x1 - R.x0 + 1);
    frames.push({ x0: x0 + PAD, x1: x1 - PAD, y0: yTop + 1 + PAD, y1: yBot - 1 - PAD, thick });
  }
  return frames;
}

/** Bir karenin saydam RGBA'sı ve içerik sınırı (kareye göre). */
function cutFrame(data, w, f, untint) {
  const fw = f.x1 - f.x0 + 1, fh = f.y1 - f.y0 + 1, n = fw * fh;
  const px = (i) => { const x = f.x0 + (i % fw), y = f.y0 + ((i / fw) | 0); const k = (y * w + x) * 3; return [data[k], data[k + 1], data[k + 2]]; };
  const bg = new Uint8Array(n);
  // Kenardan flood-fill ve içerideki aynı tondaki parazitler: ikisi de macenta tonu kuralıyla.
  for (let i = 0; i < n; i++) if (isMagenta(...px(i))) bg[i] = 1;
  for (let pass = 0; pass < 2; pass++) {
    const add = [];
    for (let i = 0; i < n; i++) {
      if (bg[i]) continue;
      const x = i % fw, y = (i / fw) | 0;
      const near = (x > 0 && bg[i - 1]) || (x < fw - 1 && bg[i + 1]) || (y > 0 && bg[i - fw]) || (y < fh - 1 && bg[i + fw]);
      if (near && isSpill(...px(i))) add.push(i);
    }
    for (const i of add) bg[i] = 1;
  }
  const rgba = Buffer.alloc(n * 4);
  let minX = fw, minY = fh, maxX = -1, maxY = -1;
  for (let i = 0; i < n; i++) {
    if (bg[i]) continue;
    let [r, g, b] = px(i);
    // Efekte özgü renk düzeltmesi: macentayla karışmış (R ve B, G'den yüksek) pikseller.
    if (untint && Math.min(r, b) - g >= 40) [r, g, b] = untint(r, g, b);
    rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b; rgba[i * 4 + 3] = 255;
    const x = i % fw, y = (i / fw) | 0;
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { rgba, fw, fh, box: maxX < 0 ? null : { minX, minY, maxX, maxY } };
}

const manifest = { note: 'Hasar efekti sprite\'ları (npm run efektler ile assets-ham/efektler/*.jpg\'den üretilir). Her efekt tek yatay şerit: frames kare, her kare size×size. Gemini ile üretildi.', frameMs: FRAME_MS, effects: {} };
fs.mkdirSync(OUT, { recursive: true });
for (const [id, conf] of Object.entries(EFFECTS)) {
  const file = path.join(RAW, `${id}.jpg`);
  if (!fs.existsSync(file)) { console.log(`${id}: ham görsel yok, atlandı`); continue; }
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const dark = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) dark[i] = isDark(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]) ? 1 : 0;
  const frames = findFrames(dark, w, h);
  const cuts = frames.map((f) => cutFrame(data, w, f, conf.untint));
  // Sabit pencere: karenin çıpasına göre (yatay orta; dikey orta ya da üst) bütün içeriklerin birleşimi.
  let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
  for (const c of cuts) {
    if (!c.box) continue;
    const ax = c.fw / 2, ay = conf.anchor === 'top' ? 0 : c.fh / 2;
    L = Math.min(L, c.box.minX - ax); R = Math.max(R, c.box.maxX + 1 - ax);
    T = Math.min(T, c.box.minY - ay); B = Math.max(B, c.box.maxY + 1 - ay);
  }
  if (conf.anchor === 'top') T = 0;
  // Yatayda simetrik pencere (çıpa ortada kalır).
  const half = Math.max(-L, R);
  const winW = 2 * half, winH = B - T;
  const scale = FIT / Math.max(winW, winH);
  const strip = Buffer.alloc(SIZE * frames.length * SIZE * 4);
  cuts.forEach((c, k) => {
    const ax = c.fw / 2, ay = conf.anchor === 'top' ? 0 : c.fh / 2;
    // Çıktı pikselinden kaynak pikseline (nearest-neighbor): pencere 128'lik karede ortalı, üst çıpada üstte.
    const offX = (SIZE - winW * scale) / 2, offY = conf.anchor === 'top' ? 0 : (SIZE - winH * scale) / 2;
    for (let oy = 0; oy < SIZE; oy++) for (let ox = 0; ox < SIZE; ox++) {
      const sx = Math.floor((ox + 0.5 - offX) / scale - half + ax);
      const sy = Math.floor((oy + 0.5 - offY) / scale + T + ay);
      if (sx < 0 || sy < 0 || sx >= c.fw || sy >= c.fh) continue;
      const s = (sy * c.fw + sx) * 4, d = (oy * SIZE * frames.length + k * SIZE + ox) * 4;
      c.rgba.copy(strip, d, s, s + 4);
    }
  });
  await sharp(strip, { raw: { width: SIZE * frames.length, height: SIZE, channels: 4 } }).webp({ lossless: true }).toFile(path.join(OUT, `${id}.webp`));
  manifest.effects[id] = {
    file: `efektler/${id}.webp`, frames: frames.length, size: SIZE, damageTypes: conf.damageTypes,
    ...(conf.conditions ? { conditions: conf.conditions } : {}),
  };
  console.log(`${id}: ${frames.length} kare (genişlikler ${frames.map((f) => f.x1 - f.x0 + 1 + 2 * PAD).join(', ')}; çerçeve ${Math.max(...frames.map((f) => f.thick))} px), pencere ${winW.toFixed(0)}×${winH.toFixed(0)}, ölçek ${scale.toFixed(3)}`);
}
fs.writeFileSync(DATA, JSON.stringify(manifest, null, 2) + '\n');
