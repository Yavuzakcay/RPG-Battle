// Zar görselleri: assets-ham/zarlar/zar-<tema>.jpg (macenta zeminde yan yana boş yüzlü zarlar, soldan sağa
// d4, d6, d8, d10, d12, d20, d100) → public/zarlar/<tema>/d4.webp … d100.webp (128×128, saydam).
// Çalıştırma: npm run zarlar [-- --kuru] [-- --yalniz tema1,tema2]
// SD9: 63 tema (data/zar-gorselleri.json kimlikleri; ham dosya zar-<kimlik>.jpg). `--kuru`: görsel yazmaz; ham dosyaları
// ve veriyi karşılaştırır (veride olmayan ham, ham'ı olmayan tema, zar sayısı), boyut raporu verir. İş bitince
// data/zar-mevcut.json (görseli üretilmiş temalar) güncellenir; kuru kipte yazılmaz.
//
// Masum ve efekt betikleriyle aynı yöntem:
// 1. Arka plan: görüntü kenarından flood-fill (sıkı macenta eşiği); kapalı boşluklar yalnızca saf arka plan
//    renginden tohumlanır. 2. Despill: arka plana değen macentaya kaymış kenar pikselleri silinir (iki tur).
// 3. Bağlı bileşenler: en büyüğün %5'inden küçük lekeler atılır; kalanlar zar sayılır (sayı koddan bulunur,
//    beklenen 7 değilse betik nedenini yazar ve durur). Soldan sağa sıralanıp d4..d100 adını alır.
// 4. Hepsine aynı ölçek (en büyük kenar 116 px), nearest-neighbor; alt kenar (ayak) 122 px, yatayda ortalı.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(root, 'assets-ham/zarlar');
const OUT = path.join(root, 'public/zarlar');
const NAMES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
const SIZE = 128;
const LARGEST = 116;
const FOOT = 122;

const isMagenta = (r, g, b) => g <= 70 && r >= 150 && b >= 150 && Math.abs(r - b) <= 60;
const isPureBg = (r, g, b) => g <= 25 && r >= 230 && b >= 220;
const isSpill = (r, g, b) => Math.min(r, b) - g >= 60 && Math.abs(r - b) <= 90;

async function dice(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const n = w * h;
  const bg = new Uint8Array(n);
  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  const stack = [];
  const seed = (i) => { if (!bg[i] && isMagenta(...px(i))) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
  for (let i = 0; i < n; i++) if (isPureBg(...px(i))) seed(i);
  while (stack.length) {
    const i = stack.pop();
    const x = i % w, y = (i / w) | 0;
    if (x > 0) seed(i - 1);
    if (x < w - 1) seed(i + 1);
    if (y > 0) seed(i - w);
    if (y < h - 1) seed(i + w);
  }
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
  // Bağlı bileşenler (4-komşu).
  const comp = new Int32Array(n).fill(-1);
  const parts = [];
  for (let s = 0; s < n; s++) {
    if (bg[s] || comp[s] >= 0) continue;
    const id = parts.length;
    const p = { id, count: 0, minX: w, minY: h, maxX: -1, maxY: -1 };
    const q = [s];
    comp[s] = id;
    while (q.length) {
      const i = q.pop();
      const x = i % w, y = (i / w) | 0;
      p.count++;
      if (x < p.minX) p.minX = x; if (x > p.maxX) p.maxX = x; if (y < p.minY) p.minY = y; if (y > p.maxY) p.maxY = y;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
        if (j >= 0 && !bg[j] && comp[j] < 0) { comp[j] = id; q.push(j); }
      }
    }
    parts.push(p);
  }
  const biggest = Math.max(...parts.map((p) => p.count));
  const kept = parts.filter((p) => p.count >= biggest * 0.05).sort((a, b) => a.minX - b.minX);
  return { data, w, h, bg, comp, kept, spots: parts.length - kept.length };
}

const argv = process.argv.slice(2);
const DRY = argv.includes('--kuru');
const only = argv.includes('--yalniz') ? (argv[argv.indexOf('--yalniz') + 1] ?? '').split(',').filter(Boolean) : null;
const themeIds = JSON.parse(fs.readFileSync(path.join(root, 'data/zar-gorselleri.json'), 'utf8')).themes.map((x) => x.id);
const rawFiles = fs.existsSync(RAW) ? fs.readdirSync(RAW).filter((f) => /^zar-[a-z0-9-]+\.(jpg|png)$/.test(f)).sort() : [];
const rawTheme = (f) => f.replace(/^zar-/, '').replace(/\.(jpg|png)$/, '');
const rawIds = rawFiles.map(rawTheme);
const unknown = rawIds.filter((id) => !themeIds.includes(id));
const noRaw = themeIds.filter((id) => !rawIds.includes(id));
console.log(`Veride ${themeIds.length} tema; ham dosya ${rawFiles.length}.`);
if (unknown.length) console.log(`Veride OLMAYAN ham dosya (kimlik data/zar-gorselleri.json'a eklenmeli ya da ad düzeltilmeli): ${unknown.join(', ')}`);
if (noRaw.length) console.log(`Ham dosyası OLMAYAN tema (klasik yedekle çizilir): ${noRaw.join(', ')}`);
if (rawFiles.length === 0 && !DRY) throw new Error(`${RAW} altında zar-<tema>.jpg yok (yalnız kurulum yerelde; bulutta --kuru kullan)`);
let failed = false;
for (const f of rawFiles) {
  const theme = rawTheme(f);
  if (!themeIds.includes(theme) || (only && !only.includes(theme))) continue;
  const d = await dice(path.join(RAW, f));
  if (d.kept.length !== NAMES.length) {
    console.error(`${f}: ${d.kept.length} zar bulundu, ${NAMES.length} bekleniyordu. Bileşen boyları: ${d.kept.map((p) => p.count).join(', ')}`
      + ' (zarlar birbirine değiyorsa birleşir; zeminde kopuk parça varsa fazla çıkar). Görsel düzeltilmeli.');
    failed = true;
    continue;
  }
  if (DRY) { console.log(`${theme}: ${d.kept.length} zar (kuru kip, yazılmadı)`); continue; }
  const largest = Math.max(...d.kept.map((p) => Math.max(p.maxX - p.minX + 1, p.maxY - p.minY + 1)));
  const scale = LARGEST / largest;
  const out = path.join(OUT, theme);
  fs.mkdirSync(out, { recursive: true });
  for (const [k, p] of d.kept.entries()) {
    const bw = p.maxX - p.minX + 1, bh = p.maxY - p.minY + 1;
    const rgba = Buffer.alloc(bw * bh * 4);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const i = (p.minY + y) * d.w + p.minX + x;
      if (d.bg[i] || d.comp[i] !== p.id) continue;
      const o = (y * bw + x) * 4;
      rgba[o] = d.data[i * 3]; rgba[o + 1] = d.data[i * 3 + 1]; rgba[o + 2] = d.data[i * 3 + 2]; rgba[o + 3] = 255;
    }
    const tw = Math.max(1, Math.round(bw * scale)), th = Math.max(1, Math.round(bh * scale));
    const fig = await sharp(rgba, { raw: { width: bw, height: bh, channels: 4 } }).resize(tw, th, { kernel: 'nearest' }).raw().toBuffer();
    const left = Math.round((SIZE - tw) / 2);
    const top = FOOT - th;
    const canvas = Buffer.alloc(SIZE * SIZE * 4);
    for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
      const X = left + x, Y = top + y;
      if (X < 0 || Y < 0 || X >= SIZE || Y >= SIZE) continue;
      fig.copy(canvas, (Y * SIZE + X) * 4, (y * tw + x) * 4, (y * tw + x) * 4 + 4);
    }
    await sharp(canvas, { raw: { width: SIZE, height: SIZE, channels: 4 } }).webp({ lossless: true }).toFile(path.join(out, `${NAMES[k]}.webp`));
  }
  console.log(`${theme}: ${d.kept.length} zar, ölçek ${scale.toFixed(4)}, atılan leke ${d.spots}`);
}

// Boyut raporu ve hazır tema listesi (public/zarlar/<tema>/ içinde yedi görsel olanlar).
const sizeOf = (id) => NAMES.reduce((n, k) => { const f = path.join(OUT, id, `${k}.webp`); return n + (fs.existsSync(f) ? fs.statSync(f).size : 0); }, 0);
const ready = themeIds.filter((id) => NAMES.every((k) => fs.existsSync(path.join(OUT, id, `${k}.webp`))));
let total = 0;
for (const id of ready) { const b = sizeOf(id); total += b; console.log(`  ${id}: ${(b / 1024).toFixed(0)} KB`); }
const perTheme = ready.length ? total / ready.length : 0;
console.log(`Hazır tema ${ready.length}/${themeIds.length}; toplam ${(total / 1048576).toFixed(2)} MB; tema başına ort. ${(perTheme / 1024).toFixed(0)} KB; 63 tema tahmini ${(perTheme * themeIds.length / 1048576).toFixed(1)} MB.`);
if (perTheme * themeIds.length > 25 * 1048576) console.log('UYARI: > 25 MB: tembel indirme önerilir (tema görselleri ilk seçimde indirilsin, ön yükleme yalnız seçili tema).');
if (!DRY) {
  fs.writeFileSync(path.join(root, 'data/zar-mevcut.json'), JSON.stringify({ _aciklama: 'npm run zarlar yazar: public/zarlar/<tema>/ altında görseli üretilmiş temalar. Listede olmayan tema klasik görsellerle (ve kendi 3D renkleriyle) çizilir.', mevcut: ready }, null, 2) + '\n');
  console.log(`data/zar-mevcut.json güncellendi (${ready.length} tema).`);
}
if (failed) process.exit(1);
