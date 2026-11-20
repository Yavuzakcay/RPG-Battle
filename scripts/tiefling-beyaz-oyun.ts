// Tiefling beyaz benek teşhisi, 1. adım: oyundaki boyamanın birebir kopyası (yalnız ölçüm; public/ ve data/ değişmez).
// `npx vite-node scripts/tiefling-beyaz-oyun.ts <çıktı-klasörü>`
// Her Tiefling jetonu × boyalı soy (abyssal, chthonic, winged) için src/ui/tint.ts yolu: otomatik ikili ten maskesi
// (public/characters/maske/<jeton>.png; Tiefling'de elle maske yok, skinCleanup ve kafa kaplaması yok) + tintPixels.
// Çıktı <klasör>/<soy>/<jeton>.png; sayımı scripts/tiefling-beyaz.py yapar.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { tintPixels } from '../src/ui/tint';
import { lineageTint } from '../src/battle/avatar';

const C = 'public/characters';
const SOYLAR = ['abyssal', 'chthonic', 'winged'];
const out = process.argv[2];
if (!out) throw new Error('çıktı klasörü gerekli');
const names = fs.readdirSync(C).filter((f) => /^tiefling-(erkek|kadin|male|female)-.*\.webp$/.test(f)).map((f) => f.replace('.webp', ''));
let n = 0;
for (const soy of SOYLAR) fs.mkdirSync(path.join(out, soy), { recursive: true });
for (const name of names) {
  const mf = path.join(C, 'maske', `${name}.png`);
  const { data, info } = await sharp(path.join(C, `${name}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const m = fs.existsSync(mf) ? await sharp(mf).resize(info.width, info.height, { kernel: 'nearest' }).greyscale().raw().toBuffer() : null;
  const gender = /-(erkek|male)-/.test(name) ? 'male' : 'female';
  for (const soy of SOYLAR) {
    const px = new Uint8ClampedArray(data);
    const t = lineageTint('tiefling', soy, gender);
    if (t && m) tintPixels(px, t, Uint8Array.from(m, (v) => (v > 127 ? 1 : 0)));
    await sharp(Buffer.from(px.buffer), { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(path.join(out, soy, `${name}.png`));
  }
  n++;
}
console.log(n, 'jeton ×', SOYLAR.length, 'soy;', 'maskesiz:', names.filter((x) => !fs.existsSync(path.join(C, 'maske', `${x}.png`))).join(', ') || 'yok');
