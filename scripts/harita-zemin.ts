// Kuyruk 21 D1: görselden altıgen zemin önerisi. Çalıştırma:
//   npm run harita-zemin -- <kimlik> [--boyut 31x17 --gorsel <bolge>/<ad>] [--k 8] [--bosluk 12] [--izgara] [--cikti <yol.json>] [--yaz]
// Kimlikle çalışır: harita kaydı varsa boyut ve görsel adı oradan; yoksa (yeni harita) --boyut ve --gorsel verilir.
// Kaynak görsel harita/<bolge>/gorsel/<ad>.jpg hedef en-boy oranına ortadan kırpılır, dünya boyutuna getirilir; her
// altıgenin ortalama rengi kümelenir (k-means) ve kümeler paletin (harita/_ortak/zemin-renkleri.json) en yakın zeminine
// eşlenir; sonra harita/<bolge>/duzeltme/<ad>.json elle düzeltmeleri uygulanır (src/map/terrainGuess.ts).
// Çıktı: satırlar ekrana; --izgara harita/<bolge>/onizleme/<ad>-zemin.png (görsel + harfler); --cikti {tiles} JSON;
// --yaz harita kaydının `tiles` alanını günceller (yalnızca kayıt varsa).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { artSize, centerCropBox } from '../src/map/mapArt';
import { applyCorrections, suggestTiles, type Rgb, type TerrainCorrections } from '../src/map/terrainGuess';
import { hexCenter, hexPoints } from '../src/ui/mapView';

const ROOT = path.join(import.meta.dirname ?? '.', '..');
const args = process.argv.slice(2);
const opt = (n: string): string | undefined => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const id = args.find((a, i) => !a.startsWith('--') && !['--boyut', '--gorsel', '--k', '--cikti', '--bosluk'].includes(args[i - 1] ?? ''));
if (!id) throw new Error('Kimlik ver: npm run harita-zemin -- <kimlik> [--boyut 31x17 --gorsel <bolge>/<ad>]');

/** Kimlikten harita kaydı (harita/<bolge>/<ad>.json; dosya adı kimlik değil, JSON'daki `id`). */
function findMap(mid: string): { file: string; raw: { id: string; gorsel: string; size: { cols: number; rows: number }; tiles: string[] } } | null {
  const root = path.join(ROOT, 'harita');
  for (const d of fs.readdirSync(root)) {
    if (d === 'belgeler' || d === '_ortak' || !fs.statSync(path.join(root, d)).isDirectory()) continue;
    for (const f of fs.readdirSync(path.join(root, d)).filter((x) => x.endsWith('.json'))) {
      const raw = JSON.parse(fs.readFileSync(path.join(root, d, f), 'utf8'));
      if (raw.id === mid) return { file: path.join(root, d, f), raw };
    }
  }
  return null;
}

const found = findMap(id);
const gorsel = found?.raw.gorsel ?? opt('--gorsel');
const boyut = opt('--boyut');
const size = found?.raw.size ?? (boyut ? { cols: Number(boyut.split('x')[0]), rows: Number(boyut.split('x')[1]) } : null);
if (!gorsel || !size) throw new Error(`${id}: harita kaydı yok; --boyut CxR ve --gorsel <bolge>/<ad> ver`);
const [bolge, ad] = gorsel.split('/') as [string, string];
const src = ['jpg', 'jpeg', 'png'].map((e) => path.join(ROOT, 'harita', bolge, 'gorsel', `${ad}.${e}`)).find((f) => fs.existsSync(f));
if (!src) throw new Error(`Kaynak görsel yok: harita/${bolge}/gorsel/${ad}.jpg`);

const target = artSize(size);
const meta = await sharp(src).metadata();
const crop = centerCropBox(meta.width ?? 0, meta.height ?? 0, target.w / target.h);
const { data, info } = await sharp(src).extract(crop).resize(target.w, target.h, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const px = (x: number, y: number): Rgb => {
  const xi = Math.max(0, Math.min(info.width - 1, Math.round(x))), yi = Math.max(0, Math.min(info.height - 1, Math.round(y)));
  const o = (yi * info.width + xi) * 3;
  return [data[o]!, data[o + 1]!, data[o + 2]!];
};
// Her altıgenin merkezi çevresindeki (yarıçapın ~yarısı) 7×7 örneğin ortalaması.
const r = (hexCenter({ col: 0, row: 1 }).y - hexCenter({ col: 0, row: 0 }).y) * 0.3;
const colors: Rgb[] = [];
for (let row = 0; row < size.rows; row++) for (let col = 0; col < size.cols; col++) {
  const c = hexCenter({ col, row });
  const acc = [0, 0, 0];
  let n = 0;
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const p = px(c.x + (dx / 3) * r, c.y + (dy / 3) * r); acc[0]! += p[0]; acc[1]! += p[1]; acc[2]! += p[2]; n++; }
  colors.push([acc[0]! / n, acc[1]! / n, acc[2]! / n]);
}
const paletteFile = JSON.parse(fs.readFileSync(path.join(ROOT, 'harita/_ortak/zemin-renkleri.json'), 'utf8')) as { palet: Record<string, Rgb[]>; bosluk?: number };
let tiles = suggestTiles(colors, size.cols, size.rows, paletteFile.palet, Number(opt('--k') ?? 8), Number(opt('--bosluk') ?? paletteFile.bosluk ?? 0));
const fixFile = path.join(ROOT, 'harita', bolge, 'duzeltme', `${ad}.json`);
if (fs.existsSync(fixFile)) {
  tiles = applyCorrections(tiles, JSON.parse(fs.readFileSync(fixFile, 'utf8')) as TerrainCorrections);
  console.log(`düzeltme uygulandı: ${path.relative(ROOT, fixFile)}`);
}
console.log(tiles.map((l, i) => `${String(i + 1).padStart(2)} ${l}`).join('\n'));

if (args.includes('--izgara')) {
  const out = path.join(ROOT, 'harita', bolge, 'onizleme', `${ad}-zemin.png`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const parts: string[] = [];
  tiles.forEach((line, row) => [...line].forEach((ch, col) => {
    const c = hexCenter({ col, row });
    parts.push(`<polygon points="${hexPoints({ col, row })}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="2"/>`);
    parts.push(`<text x="${c.x}" y="${c.y + 10}" font-size="30" font-family="monospace" text-anchor="middle" fill="#ff0" stroke="#000" stroke-width="3" paint-order="stroke">${ch === '<' ? '&lt;' : ch === '&' ? '&amp;' : ch}</text>`);
  }));
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${target.w}" height="${target.h}">${parts.join('')}</svg>`);
  await sharp(src).extract(crop).resize(target.w, target.h, { fit: 'fill' }).composite([{ input: svg }]).png().toFile(out);
  console.log(`ızgara: ${path.relative(ROOT, out)}`);
}
const cikti = opt('--cikti');
if (cikti) fs.writeFileSync(path.resolve(cikti), JSON.stringify({ id, gorsel, size, tiles }, null, 1) + '\n');
if (args.includes('--yaz')) {
  if (!found) throw new Error('--yaz için harita kaydı gerekir');
  const text = fs.readFileSync(found.file, 'utf8');
  const indent = /\n( +)"/.exec(text)?.[1]?.length ?? 2;
  fs.writeFileSync(found.file, JSON.stringify({ ...found.raw, tiles }, null, indent) + '\n');
  console.log(`yazıldı: ${path.relative(ROOT, found.file)}`);
}
