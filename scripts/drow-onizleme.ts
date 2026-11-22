/**
 * SD8: Dark Elf (drow) ten paleti hızlı önizleme. Tek satır: `npm run drow-onizleme -- D` (ya da `A B C D`; boşsa dördü).
 * Wizard/Barbarian/Rogue × erkek/kadın jetonları son commit'teki (önce) ve çalışma ağacındaki (sonra) paletle yan yana çizer →
 * docs/sd8/onizleme-<palet>.png (+ `-yuz.png`: yüz 8×). Paleti değiştirmek: data/soy-renkleri.json `races.elf.paletler.drow.secenekler.<A–D>`
 * (duraklar [L, a, b]); varsayılan palet `races.elf.drowPalet`. Oyundaki ten işlemi (delik kapatma dahil) aynen uygulanır.
 */
import sharp from 'sharp';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { tintPixels } from '../src/ui/tint';
import { closeSkinHoles } from '../src/ui/maskClose';
import { paletteTint } from '../src/battle/avatar';
import type { TintSpec } from '../src/battle/types';

const keys = process.argv.slice(2).filter((a) => /^[A-D]$/.test(a));
const palettes = keys.length ? keys : ['A', 'B', 'C', 'D'];
const SPRITES = ['wizard', 'barbarian', 'rogue'].flatMap((c) => [`elf-male-${c}`, `elf-female-${c}`]);
const old = JSON.parse(execSync('git show HEAD:data/soy-renkleri.json').toString());
const oldTint = (k: string): TintSpec => ({ select: old.races.elf.select, to: old.races.elf.paletler.drow.secenekler[k] });

async function render(name: string, tint: TintSpec, size: number, crop?: { left: number; top: number; width: number; height: number }): Promise<Buffer> {
  const img = await sharp(`public/characters/${name}.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = img.info.width, H = img.info.height;
  const m = await sharp(`public/characters/maske/${name}.png`).ensureAlpha().resize(W, H, { kernel: 'nearest' }).raw().toBuffer();
  const data = new Uint8ClampedArray(img.data);
  let mask: Uint8Array | undefined = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) mask[i] = (m[i * 4] ?? 0) > 127 ? 1 : 0;
  mask = closeSkinHoles(data, mask, undefined, W, H).mask;
  tintPixels(data, tint, mask, undefined);
  let s = sharp(Buffer.from(data.buffer), { raw: { width: W, height: H, channels: 4 } }).flatten({ background: '#2a2a33' });
  if (crop) s = s.extract(crop);
  return s.resize(size, size, { kernel: 'nearest' }).png().toBuffer();
}

async function sheet(file: string, names: string[], size: number, crop?: { left: number; top: number; width: number; height: number }): Promise<void> {
  const cols = 1 + palettes.length; // önce + her palet
  const tiles: Array<{ input: Buffer; left: number; top: number }> = [];
  for (const [r, name] of names.entries()) {
    tiles.push({ input: await render(name, oldTint('D'), size, crop), left: 0, top: r * size });
    for (const [c, k] of palettes.entries()) tiles.push({ input: await render(name, paletteTint('elf', 'drow', k) as TintSpec, size, crop), left: (c + 1) * size, top: r * size });
  }
  await sharp({ create: { width: cols * size, height: names.length * size, channels: 3, background: '#2a2a33' } }).composite(tiles).png().toFile(file);
  console.log(`${file}: sütunlar = önce (son commit D) | ${palettes.join(' | ')}; satırlar = ${names.join(', ')}`);
}

mkdirSync('docs/sd8', { recursive: true });
const tag = palettes.join('');
await sheet(`docs/sd8/onizleme-${tag}.png`, SPRITES, 256);
await sheet(`docs/sd8/onizleme-${tag}-yuz.png`, ['elf-female-wizard', 'elf-male-barbarian'], 384, { left: 64, top: 24, width: 128, height: 128 });
