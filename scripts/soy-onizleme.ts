// Görev K15: bütün soyların kadın ve erkek jetonları yan yana (Barbarian, Wizard, Rogue); docs/sabah/k15-soylar.png.
import path from 'node:path';
import sharp from 'sharp';
import { tintPixels } from '../src/ui/tint';
import soy from '../data/soy-renkleri.json';
import type { TintSpec } from '../src/battle/types';
import { lineageTint } from '../src/battle/avatar';

const ROOT = path.join(import.meta.dirname ?? '.', '..');
const CHAR = path.join(ROOT, 'public/characters');
type Race = { lineages: Record<string, TintSpec['to'] | null>; select: TintSpec['select'] };
const RACES = (soy as unknown as { races: Record<string, Race> }).races;

export default async function onizleme(out: string, classes = ['barbarian', 'wizard', 'rogue'], only?: Array<[string, string, string[]?]>): Promise<void> {
  const T = 96, rows: Array<{ input: Buffer; left: number; top: number }> = [];
  let y = 0, maxW = 0;
  for (const [race, r] of Object.entries(RACES)) for (const g of ['female', 'male']) {
    const sel = only?.find(([ra, ge]) => ra === race && ge === g);
    if (only && !sel) continue;
    let x = 0;
    const label = Buffer.from(`<svg width="150" height="${T}"><text x="4" y="${T / 2}" font-size="15" fill="#eee" font-family="sans-serif">${race} ${g === 'male' ? '♂' : '♀'}</text></svg>`);
    rows.push({ input: label, left: 0, top: y }); x = 150;
    for (const lin of Object.keys(r.lineages).filter((l) => !sel?.[2] || sel[2].includes(l))) for (const cls of classes) {
      const name = `${race}-${g}-${cls}`;
      const { data, info } = await sharp(path.join(CHAR, `${name}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const m = await sharp(path.join(CHAR, 'maske', `${name}.png`)).greyscale().raw().toBuffer();
      const mask = new Uint8Array(m.length); for (let i = 0; i < m.length; i++) mask[i] = m[i]! > 127 ? 1 : 0;
      const px = new Uint8ClampedArray(data);
      const tint = lineageTint(race, lin, g as 'male' | 'female');
      if (tint) tintPixels(px, tint, mask);
      rows.push({ input: await sharp(Buffer.from(px.buffer), { raw: { width: info.width, height: info.height, channels: 4 } }).resize(T).png().toBuffer(), left: x, top: y });
      x += T;
      if (cls === classes[classes.length - 1]) {
        rows.push({ input: Buffer.from(`<svg width="${T * classes.length}" height="14"><text x="2" y="12" font-size="12" fill="#ccc" font-family="sans-serif">${lin}</text></svg>`), left: x - T * classes.length, top: y + T - 12 });
        x += 8;
      }
    }
    maxW = Math.max(maxW, x); y += T + 4;
  }
  await sharp({ create: { width: maxW, height: y, channels: 4, background: { r: 34, g: 34, b: 44, alpha: 1 } } }).composite(rows).png({ compressionLevel: 9 }).toFile(out);
}
