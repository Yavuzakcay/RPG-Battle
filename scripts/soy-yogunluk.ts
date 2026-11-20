// Alt soy görünüm kararı: ten yoğunluğu ölçümü. Tenhausser (Human, Koyu ton) ve Drow paletleri (A–D) için boyalı ten
// pikselleri üzerinde ortalama HSL doygunluk/açıklık ve OKLCH kroma/açıklık (24 jeton, ten maskesi). Çalıştırma:
//   npx vite-node scripts/soy-yogunluk.ts [--yaz] [--etiket eski|yeni]
// --yaz: data/soy-olcum.json `paletler.yogunluk.<etiket>` altına yazar (soy-maske.ts bu anahtarı korur).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { tintPixels } from '../src/ui/tint';
import { skinTint } from '../src/ui/lineageLook';
import { paletteKeys, paletteTint } from '../src/battle/avatar';
import { CHAR, ROOT } from './soy-maske-yollar';
import rapor from '../data/soy-maske-rapor.json';
import type { TintSpec } from '../src/battle/types';

const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export function hslOf(r: number, g: number, b: number): [number, number] {
  const R = r / 255, G = g / 255, B = b / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, d = mx - mn;
  return [d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)), l];
}
export function oklchOf(r: number, g: number, b: number): [number, number] {
  const R = lin(r / 255), G = lin(g / 255), B = lin(b / 255);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B), m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B), s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(a, bb)];
}
async function load(name: string) {
  const { data, info } = await sharp(path.join(CHAR, `${name}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const hand = (rapor as { sprites: Record<string, string> }).sprites[name] === 'el';
  const mp = path.join(CHAR, hand ? 'maske-el' : 'maske', `${name}.png`);
  const m = await sharp(mp).resize(info.width, info.height, { kernel: 'nearest' }).greyscale().raw().toBuffer();
  return { data, W: info.width, H: info.height, mask: m, hand };
}
export interface Yog { s: number; l: number; c: number; ol: number; lStd: number; sStd: number }
export async function measure(race: string, tint: TintSpec | undefined): Promise<Yog> {
  let n = 0, ss = 0, ls = 0, cs = 0, ols = 0, ls2 = 0, ss2 = 0;
  for (const g of ['female', 'male']) for (const cls of CLASSES) {
    const { data, mask, hand } = await load(`${race}-${g}-${cls}`);
    const px = new Uint8ClampedArray(data);
    const bin = new Uint8Array(mask.length).map((_, i) => (mask[i]! > 127 ? 1 : 0));
    if (tint) tintPixels(px, tint, hand ? undefined : bin, hand ? Uint8Array.from(mask) : undefined);
    for (let i = 0; i < bin.length; i++) {
      if (!bin[i] || px[i * 4 + 3]! < 128) continue;
      const [s, l] = hslOf(px[i * 4]!, px[i * 4 + 1]!, px[i * 4 + 2]!), [ol, c] = oklchOf(px[i * 4]!, px[i * 4 + 1]!, px[i * 4 + 2]!);
      n++; ss += s; ls += l; cs += c; ols += ol; ls2 += l * l; ss2 += s * s;
    }
  }
  const r = (v: number, k = 1000) => Math.round(v * k) / k;
  return { s: r(ss / n), l: r(ls / n), c: r(cs / n), ol: r(ols / n), lStd: r(Math.sqrt(ls2 / n - (ls / n) ** 2)), sStd: r(Math.sqrt(ss2 / n - (ss / n) ** 2)) };
}
{
  const args = process.argv.slice(2);
  const etiket = args.includes('--etiket') ? args[args.indexOf('--etiket') + 1]! : 'olcum';
  const out: Record<string, Yog> = {};
  out['human/tenhausser'] = await measure('human', skinTint('human', 'siyahi'));
  for (const k of paletteKeys('elf', 'drow')) out[`elf/drow@${k}`] = await measure('elf', paletteTint('elf', 'drow', k));
  console.table(out);
  if (args.includes('--yaz')) {
    const f = path.join(ROOT, 'data/soy-olcum.json');
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    j.paletler.yogunluk = { ...(j.paletler.yogunluk ?? {}), [etiket]: { not: 'Ortalama HSL doygunluk (s) ve açıklık (l), OKLCH kroma (c) ve açıklık (ol), açıklık/doygunluk standart sapması; ten maskesi pikselleri, 24 jeton (npx vite-node scripts/soy-yogunluk.ts --yaz --etiket <ad>).', ...out } };
    fs.writeFileSync(f, JSON.stringify(j, null, 1) + '\n');
  }
}
