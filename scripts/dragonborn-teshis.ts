// Dragonborn maske teşhisi: 12 sınıf × erkek/kadın Gariban jetonu; orijinal | maske kaplaması | boyalı (Red) yan yana.
import sharp from 'sharp';
import path from 'node:path';
import { tintPixels } from '../src/ui/tint';
import { lineageTint } from '../src/battle/avatar';
const C = 'public/characters';
const CL = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
const color = process.argv[2] ?? 'red', out = process.argv[3] ?? 'docs/sabah/dragonborn-renk/teshis.png';
const code = process.argv[4] ?? 'GR';
const S = 128, tiles: Array<{ input: Buffer; left: number; top: number }> = [];
let i = 0;
const names = process.argv[5] ? process.argv[5].split(',') : CL.flatMap((cls) => ['erkek', 'kadin'].map((g) => `dragonborn-${g}-${cls}-${code}`));
for (const name of names) {
  const g = name.split('-')[1]!;
  const { data, info } = await sharp(path.join(C, `${name}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const m = await sharp(path.join(C, 'maske', `${name}.png`)).greyscale().raw().toBuffer().catch(() => null);
  const px = new Uint8ClampedArray(data), ov = new Uint8ClampedArray(data);
  const bin = Uint8Array.from(m ?? new Uint8Array(info.width * info.height), (v) => (v > 127 ? 1 : 0));
  for (let k = 0; k < bin.length; k++) if (bin[k]) { ov[k * 4] = 255; ov[k * 4 + 1] = 0; ov[k * 4 + 2] = 255; }
  const t = lineageTint('dragonborn', color, g === 'erkek' ? 'male' : 'female', true);
  if (t && m) tintPixels(px, t, bin);
  const enc = async (a: Uint8ClampedArray) => sharp(Buffer.from(a.buffer), { raw: { width: info.width, height: info.height, channels: 4 } }).resize(S, S, { kernel: 'nearest' }).png().toBuffer();
  const col = i % 4, row = Math.floor(i / 4);
  tiles.push({ input: await enc(new Uint8ClampedArray(data)), left: col * S * 3, top: row * S }, { input: await enc(ov), left: col * S * 3 + S, top: row * S }, { input: await enc(px), left: col * S * 3 + 2 * S, top: row * S });
  i++;
}
await sharp({ create: { width: 4 * S * 3, height: Math.ceil(names.length / 4) * S, channels: 4, background: { r: 45, g: 50, b: 60, alpha: 1 } } }).composite(tiles).png().toFile(out);
