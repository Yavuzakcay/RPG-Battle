// K27/K27b: elle zemin okuma yardımcısı. Görseli harita-gorsel gibi ortadan kırpar, üstüne 0 tabanlı "sütun,satır"
// etiketli altıgen ızgara (ya da verilen harita JSON'unun zemin harfleri) çizer.
//   npx vite-node scripts/harita-etiket.ts <görsel> <çıktı.png> [harita.json] [--boyut 21x11]
import fs from 'node:fs';
import sharp from 'sharp';
import { artSize, centerCropBox } from '../src/map/mapArt';
import { hexCenter, hexPoints } from '../src/ui/mapView';

const args = process.argv.slice(2);
const bi = args.indexOf('--boyut');
const [cols, rows] = (bi >= 0 ? args[bi + 1]! : '21x11').split('x').map(Number) as [number, number];
const [src, out, json] = args.filter((a, i) => !a.startsWith('--') && (bi < 0 || i !== bi + 1)) as [string, string, string | undefined];
const size = { cols, rows };
const target = artSize(size);
const meta = await sharp(src).metadata();
const crop = centerCropBox(meta.width ?? 0, meta.height ?? 0, target.w / target.h);
const tiles = json ? (JSON.parse(fs.readFileSync(json, 'utf8')) as { tiles: string[] }).tiles : null;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const parts: string[] = [];
for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
  const c = hexCenter({ col, row });
  parts.push(`<polygon points="${hexPoints({ col, row })}" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>`);
  const label = tiles ? (tiles[row]?.[col] ?? '?') : `${col},${row}`;
  parts.push(`<text x="${c.x}" y="${c.y + 8}" font-size="${tiles ? 34 : 22}" font-family="monospace" text-anchor="middle" fill="#ff0" stroke="#000" stroke-width="4" paint-order="stroke">${esc(label)}</text>`);
}
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${target.w}" height="${target.h}">${parts.join('')}</svg>`);
await sharp(src).extract(crop).resize(target.w, target.h, { fit: 'fill' }).composite([{ input: svg }]).png().toFile(out);
console.log(out);
