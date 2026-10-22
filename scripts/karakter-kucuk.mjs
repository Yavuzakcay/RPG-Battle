// Karakter jetonlarının küçük kopyaları: public/characters/*.webp (256×256) → public/characters/kucuk/*.webp (96×96).
// Listelerde ve oluşturucuda rozet 44–48 px; 96 px yüksek yoğunluklu ekranda (2×) da keskin. Haritadaki jeton
// büyük görseli kullanmaya devam eder. Çalıştırma: npm run karakter-kucuk (yeni karakter görseli eklenince).
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
const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.webp')).sort();
for (const f of files) {
  const out = path.join(OUT, f);
  await sharp(path.join(SRC, f)).resize(SIZE, SIZE, { kernel: 'lanczos3' }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(out);
  before += fs.statSync(path.join(SRC, f)).size;
  after += fs.statSync(out).size;
}
console.log(`${files.length} görsel: ortalama ${Math.round(before / files.length / 1024)} kB → ${(after / files.length / 1024).toFixed(1)} kB`);
