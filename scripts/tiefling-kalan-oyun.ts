// Tiefling kalanları teşhisi, 1. adım: oyunun şimdiki çizimi birebir (src/ui/tint.ts `tintedUrl` yolu: otomatik ten maskesi + TB1/TG1
// `fixSkinMask` onarımı + `tintPixels`); yalnız ölçüm, public/ ve data/ değişmez.
// `npx vite-node scripts/tiefling-kalan-oyun.ts <çıktı-klasörü> [soy] [jeton...]`  (soy varsayılan abyssal; çıktı <klasör>/<jeton>.png ve <jeton>.mask.png)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { skinFixFor, tintPixels } from '../src/ui/tint';
import { fixSkinMask } from '../src/ui/maskClose';
import { lineageTint } from '../src/battle/avatar';

const C = 'public/characters';
const [out, soy = 'abyssal', ...only] = process.argv.slice(2);
if (!out) throw new Error('çıktı klasörü gerekli');
fs.mkdirSync(out, { recursive: true });
const names = (only.length ? only : fs.readdirSync(C).filter((f) => /^tiefling-.*\.webp$/.test(f)).map((f) => f.slice(0, -5)));
let n = 0;
for (const name of names) {
  const mf = path.join(C, 'maske', `${name}.png`);
  if (!fs.existsSync(mf)) continue;
  const { data, info } = await sharp(path.join(C, `${name}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const mraw = await sharp(mf).resize(W, H, { kernel: 'nearest' }).greyscale().raw().toBuffer();
  let mask: Uint8Array = Uint8Array.from(mraw, (v) => (v > 127 ? 1 : 0));
  const px = new Uint8ClampedArray(data);
  const fix = skinFixFor(name);
  if (fix) { const r = fixSkinMask(px, mask, undefined, W, H, fix); if (r.mask) mask = r.mask; }
  const t = lineageTint('tiefling', soy, /-(erkek|male)-/.test(name) ? 'male' : 'female');
  if (t) tintPixels(px, t, mask);
  await sharp(Buffer.from(px.buffer), { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(out, `${name}.png`));
  await sharp(Buffer.from(Uint8Array.from(mask, (v) => v * 255)), { raw: { width: W, height: H, channels: 1 } }).png().toFile(path.join(out, `${name}.mask.png`));
  n++;
}
console.log(n, 'jeton, soy', soy);
