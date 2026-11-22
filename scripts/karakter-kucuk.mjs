// Karakter jetonlarının küçük kopyaları: public/characters/*.webp (256×256) → public/characters/kucuk/*.webp (96×96).
// Listelerde ve oluşturucuda rozet 44–48 px; 96 px yüksek yoğunluklu ekranda (2×) da keskin. Haritadaki jeton
// büyük görseli kullanmaya devam eder. Çalıştırma: npm run karakter-kucuk (yeni karakter görseli eklenince; yalnız bazı jetonlar: -- <ad> ...).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'public/characters');
const OUT = path.join(SRC, 'kucuk');
const SIZE = 96;

fs.mkdirSync(OUT, { recursive: true });
let before = 0;
let after = 0;
// İsteğe bağlı: yalnız verilen jetonlar (ad, uzantısız ya da .webp): npm run karakter-kucuk -- celestial-erkek-cleric-ID1 ...
const only = new Set(process.argv.slice(2).map((a) => (a.endsWith('.webp') ? a : `${a}.webp`)));
const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.webp') && (only.size === 0 || only.has(f))).sort();
if (only.size && files.length !== only.size) console.warn(`bulunamayan: ${[...only].filter((f) => !files.includes(f)).join(', ')}`);
for (const f of files) {
  const out = path.join(OUT, f);
  await sharp(path.join(SRC, f)).resize(SIZE, SIZE, { kernel: 'lanczos3' }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(out);
  before += fs.statSync(path.join(SRC, f)).size;
  after += fs.statSync(out).size;
}
console.log(`${files.length} görsel: ortalama ${Math.round(before / files.length / 1024)} kB → ${(after / files.length / 1024).toFixed(1)} kB`);
