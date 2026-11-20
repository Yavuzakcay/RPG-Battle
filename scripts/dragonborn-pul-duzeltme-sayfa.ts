// Dragonborn pul maskesi elle düzeltme önizlemesi (yalnız önizleme; public/ ve data/ değişmez), oyun kodundan (src/ui/scaleTint.ts).
// `npx vite-node scripts/dragonborn-pul-duzeltme-sayfa.ts [git-ref] [jeton...]`  (önce = ref'teki maske, varsayılan HEAD; sonra = çalışma ağacındaki maske;
// jeton adı verilirse yalnız onlar, `dragonborn-` öneki isteğe bağlı)
// Çıktı docs/sabah/dragonborn-desen-v2/duzeltme/<jeton>.webp: orijinal | önce Kırmızı | sonra Kırmızı | önce Mavi | sonra Mavi, 256 px.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { scalePixels } from '../src/ui/scaleTint';

const C = 'public/characters', OUT = 'docs/sabah/dragonborn-desen-v2/duzeltme', ref = process.argv[2] ?? 'HEAD';
const only = process.argv.slice(3).map((n) => (n.startsWith('dragonborn-') ? n : `dragonborn-${n}`));
const BG = { r: 44, g: 48, b: 58, alpha: 1 }, Z = 256;
const duz = JSON.parse(fs.readFileSync('data/dragonborn-pul-duzeltme.json', 'utf8')).jetonlar as Record<string, { neden: string; bos?: string }>;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (w: number, h: number, s: string, size = 13) =>
  Buffer.from(`<svg width="${w}" height="${h}"><text x="4" y="${h - 6}" font-size="${size}" fill="#e6e8ee" font-family="DejaVu Sans, Arial, sans-serif">${esc(s)}</text></svg>`);
const bits = async (buf: Buffer | null) => (buf ? Uint8Array.from(await sharp(buf).greyscale().raw().toBuffer(), (v) => (v > 127 ? 1 : 0)) : null);

fs.mkdirSync(OUT, { recursive: true });
for (const n of Object.keys(duz).filter((k) => !only.length || only.includes(k))) {
  const { data, info } = await sharp(path.join(C, `${n}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rel = `public/characters/maske-pul/${n}.png`;
  let old: Buffer | null = null;
  try { old = execFileSync('git', ['show', `${ref}:${rel}`], { maxBuffer: 1 << 24 }); } catch { old = null; }
  const masks = { once: await bits(old), sonra: await bits(fs.existsSync(rel) ? fs.readFileSync(rel) : null) };
  const draw = async (soy: string | null, m: Uint8Array | null) => {
    const px = new Uint8ClampedArray(data);
    if (soy && m) scalePixels(px, soy, m, info.width, info.height);
    const png = await sharp(Buffer.from(px.buffer), { raw: { width: info.width, height: info.height, channels: 4 } }).resize(Z, Z, { kernel: 'nearest' }).png().toBuffer();
    return sharp(png).flatten({ background: BG }).png().toBuffer();
  };
  const cols: [string, Buffer][] = [
    ['orijinal', await draw(null, null)],
    ['önce Kırmızı', await draw('red', masks.once)], ['sonra Kırmızı', await draw('red', masks.sonra)],
    ['önce Mavi', await draw('blue', masks.once)], ['sonra Mavi', await draw('blue', masks.sonra)],
  ];
  const W = cols.length * Z, H = 22 + Z + 24, comp: sharp.OverlayOptions[] = [];
  cols.forEach(([t, b], i) => comp.push({ input: text(Z, 22, t), left: i * Z, top: 0 }, { input: b, left: i * Z, top: 22 }));
  comp.push({ input: text(W, 24, `${n.replace(/^dragonborn-/, '')}: ${duz[n]!.neden}${masks.sonra ? '' : ' (artık boyanmaz)'}`), left: 0, top: 22 + Z });
  await sharp({ create: { width: W, height: H, channels: 4, background: BG } }).composite(comp).webp({ quality: 92 }).toFile(path.join(OUT, `${n.replace(/^dragonborn-/, '')}.webp`));
}
console.log(only.length || Object.keys(duz).length, 'jeton', OUT);
