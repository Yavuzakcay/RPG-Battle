// Dragonborn pul "kör topal" (önceden boyanmayan jetonlar) kontak sayfası, oyun kodundan (src/ui/scaleTint.ts); yalnız önizleme.
// `npx vite-node scripts/dragonborn-pul-kortopal-sayfa.ts [git-ref]`  (önce = ref'teki maske, yoksa boyasız; sonra = çalışma ağacı)
// Çıktı docs/sabah/dragonborn-desen-v2/kor-topal/kor-topal-NN.webp: satır başına jeton, orijinal | önce Kırmızı | sonra Kırmızı | önce Mavi | sonra Mavi
// (192 px), jeton adı ve seçenek (a/b/c) görselin altında.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { scalePixels } from '../src/ui/scaleTint';

const C = 'public/characters', OUT = 'docs/sabah/dragonborn-desen-v2/kor-topal', ref = process.argv[2] ?? 'HEAD';
const BG = { r: 44, g: 48, b: 58, alpha: 1 }, Z = 192, LAB = 34, PER = 6;
const duz = JSON.parse(fs.readFileSync('data/dragonborn-pul-duzeltme.json', 'utf8')).jetonlar as Record<string, { secenek?: string; neden: string }>;
const names = Object.keys(duz).filter((n) => duz[n]!.secenek);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (w: number, h: number, lines: string[], size = 13) =>
  Buffer.from(`<svg width="${w}" height="${h}">${lines.map((l, i) => `<text x="4" y="${15 + i * 16}" font-size="${size}" fill="#e6e8ee" font-family="DejaVu Sans, Arial, sans-serif">${esc(l)}</text>`).join('')}</svg>`);
const bits = async (buf: Buffer | null) => (buf ? Uint8Array.from(await sharp(buf).greyscale().raw().toBuffer(), (v) => (v > 127 ? 1 : 0)) : null);

fs.mkdirSync(OUT, { recursive: true });
for (let p = 0; p * PER < names.length; p++) {
  const chunk = names.slice(p * PER, p * PER + PER), W = 5 * Z, H = 26 + chunk.length * (Z + LAB);
  const comp: sharp.OverlayOptions[] = [{ input: text(W, 26, ['Kör topal: orijinal | önce Kırmızı | sonra Kırmızı | önce Mavi | sonra Mavi (önce = boyanmıyordu)']), left: 0, top: 0 }];
  for (const [r, n] of chunk.entries()) {
    const { data, info } = await sharp(path.join(C, `${n}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const rel = `public/characters/maske-pul/${n}.png`;
    let old: Buffer | null = null;
    try { old = execFileSync('git', ['show', `${ref}:${rel}`], { maxBuffer: 1 << 24, stdio: ['ignore', 'pipe', 'ignore'] }); } catch { old = null; }
    const once = await bits(old), sonra = await bits(fs.existsSync(rel) ? fs.readFileSync(rel) : null);
    const draw = async (soy: string | null, m: Uint8Array | null) => {
      const px = new Uint8ClampedArray(data);
      if (soy && m) scalePixels(px, soy, m, info.width, info.height);
      const png = await sharp(Buffer.from(px.buffer), { raw: { width: info.width, height: info.height, channels: 4 } }).resize(Z, Z, { kernel: 'nearest' }).png().toBuffer();
      return sharp(png).flatten({ background: BG }).png().toBuffer();
    };
    const y = 26 + r * (Z + LAB);
    const cols = [await draw(null, null), await draw('red', once), await draw('red', sonra), await draw('blue', once), await draw('blue', sonra)];
    cols.forEach((b, i) => comp.push({ input: b, left: i * Z, top: y }));
    comp.push({ input: text(W, LAB, [`${n.replace(/^dragonborn-/, '')}  (${duz[n]!.secenek})`, duz[n]!.neden.replace(/^kör topal \(.\): /, '')]), left: 0, top: y + Z });
  }
  await sharp({ create: { width: W, height: H, channels: 4, background: BG } }).composite(comp).webp({ quality: 90 }).toFile(path.join(OUT, `kor-topal-${String(p + 1).padStart(2, '0')}.webp`));
}
console.log(names.length, 'jeton', OUT);
