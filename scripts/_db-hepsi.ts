import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { tintPixels } from '../src/ui/tint';
import { lineageTint } from '../src/battle/avatar';
const C = 'public/characters', S = 112, PER = 48, COLS = 6;
const color = process.argv[2] ?? 'red', outDir = process.argv[3]!;
const names = fs.readdirSync(C).filter((f) => /^dragonborn-(erkek|kadin)-.*\.webp$/.test(f)).map((f) => f.replace('.webp', '')).sort();
for (let p = 0; p * PER < names.length; p++) {
  const tiles: Array<{ input: Buffer; left: number; top: number }> = [];
  const sl = names.slice(p * PER, (p + 1) * PER);
  for (let i = 0; i < sl.length; i++) {
    const name = sl[i]!;
    const { data, info } = await sharp(path.join(C, `${name}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const m = await sharp(path.join(C, 'maske', `${name}.png`)).greyscale().raw().toBuffer().catch(() => null);
    const px = new Uint8ClampedArray(data);
    const t = lineageTint('dragonborn', color, name.includes('-erkek-') ? 'male' : 'female', true);
    if (t && m) tintPixels(px, t, Uint8Array.from(m, (v) => (v > 127 ? 1 : 0)));
    const enc = (a: Uint8ClampedArray) => sharp(Buffer.from(a.buffer), { raw: { width: info.width, height: info.height, channels: 4 } }).resize(S, S, { kernel: 'nearest' }).png().toBuffer();
    const col = i % COLS, row = Math.floor(i / COLS), x = col * S * 2, y = row * (S + 12);
    tiles.push({ input: await enc(new Uint8ClampedArray(data)), left: x, top: y }, { input: await enc(px), left: x + S, top: y });
    const short = name.replace('dragonborn-', '').replace('erkek', 'E').replace('kadin', 'K');
    tiles.push({ input: Buffer.from(`<svg width="${S * 2}" height="12"><text x="2" y="10" font-size="10" fill="#cfd3dc" font-family="sans-serif">${short}</text></svg>`), left: x, top: y + S });
  }
  await sharp({ create: { width: COLS * S * 2, height: Math.ceil(sl.length / COLS) * (S + 12), channels: 4, background: { r: 45, g: 50, b: 60, alpha: 1 } } }).composite(tiles).png().toFile(path.join(outDir, `h${p}.png`));
}
console.log(names.length);
