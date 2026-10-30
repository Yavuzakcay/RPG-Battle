// Görev H1/H2: zemin harflerinden harita arka plan görseli (çizimi olmayan geniş haritalar için). Çalıştırma:
//   npm run harita-gorsel -- <harita-kimliği> [...]
// data/maps/<kimlik>.json'daki her varyantın `image` yoluna (public/ altında) dünya boyutunda webp yazar: altıgen başına
// zemin rengi (src/map/terrain.ts TERRAIN_COLOR), hafif doku ve harfe göre basit işaretler (ağaç, kaya, su dalgası, duvar
// taşı). Kurala dokunmaz; yalnızca görsel. Elle çizilmiş görsel gelince dosya onunla değiştirilir.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { TERRAIN_COLOR } from '../src/map/terrain';
import { hexCenter, hexPoints, worldOf } from '../src/ui/mapView';

const ROOT = path.join(import.meta.dirname ?? '.', '..');
const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (ids.length === 0) throw new Error('Harita kimliği ver: npm run harita-gorsel -- orman-yolu');

/** Tohumlu sayı (aynı harita aynı görsel). */
const rnd = (a: number, b: number) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  return `rgb(${c.join(',')})`;
};

function mark(ch: string, x: number, y: number, r: number, k: number): string {
  switch (ch) {
    case 'a': return `<circle cx="${x}" cy="${y}" r="${r * 0.62}" fill="#24451f"/><circle cx="${x - r * 0.2}" cy="${y - r * 0.2}" r="${r * 0.4}" fill="#3c6b31"/>`;
    case 'g': return [0, 1, 2].map((i) => `<path d="M${x - r * 0.4 + i * r * 0.4} ${y + r * 0.3} l${r * 0.08} ${-r * 0.5}" stroke="#7aa04c" stroke-width="5"/>`).join('');
    case 'r': case 'k': return `<ellipse cx="${x}" cy="${y + r * 0.1}" rx="${r * 0.5}" ry="${r * 0.32}" fill="#5a5750" stroke="#3b3934" stroke-width="4"/>`;
    case 'w': case 'n': return `<path d="M${x - r * 0.5} ${y} q${r * 0.25} ${-r * 0.2} ${r * 0.5} 0 t${r * 0.5} 0" stroke="#8fc0e0" stroke-width="4" fill="none" opacity="0.7"/>`;
    case 's': return `<rect x="${x - r * 0.6}" y="${y - r * 0.25}" width="${r * 0.55}" height="${r * 0.22}" fill="#5c5b62"/><rect x="${x + r * 0.05}" y="${y + r * 0.05}" width="${r * 0.55}" height="${r * 0.22}" fill="#5c5b62"/>`;
    case 'm': case 'c': case 'v': return `<circle cx="${x}" cy="${y}" r="${r * 0.38}" fill="#6a625a" stroke="#3a3530" stroke-width="5"/>`;
    case 'x': return `<rect x="${x - r * 0.35}" y="${y - r * 0.3}" width="${r * 0.7}" height="${r * 0.6}" fill="#7a5a34" stroke="#4a3418" stroke-width="5"/>`;
    case 'o': return `<rect x="${x - r * 0.45}" y="${y - r * 0.15}" width="${r * 0.9}" height="${r * 0.3}" fill="#8a6a3a"/>`;
    case 'h': case 'z': return `<path d="M${x - r * 0.6} ${y + r * 0.35} h${r * 1.2}" stroke="#6a6450" stroke-width="6"/>`;
    case 'e': return `<circle cx="${x}" cy="${y}" r="${r * 0.3}" fill="#bff6ff" opacity="${0.6 + k * 0.3}"/>`;
    default: return k > 0.86 ? `<circle cx="${x + (k - 0.9) * r}" cy="${y}" r="${r * 0.06}" fill="rgba(0,0,0,0.18)"/>` : '';
  }
}

for (const id of ids) {
  const file = path.join(ROOT, 'data/maps', `${id}.json`);
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as { size: { cols: number; rows: number }; tiles: string[]; variants: Array<{ image: string; tiles?: string[] }> };
  const world = worldOf(raw.size);
  for (const v of raw.variants) {
    const tiles = v.tiles ?? raw.tiles;
    const parts: string[] = [`<rect width="${world.w}" height="${world.h}" fill="#1b1c20"/>`];
    for (let row = 0; row < tiles.length; row++) for (let col = 0; col < [...tiles[row]!].length; col++) {
      const ch = [...tiles[row]!][col]!;
      const k = rnd(col, row);
      parts.push(`<polygon points="${hexPoints({ col, row }, 1.02)}" fill="${shade(TERRAIN_COLOR[ch] ?? '#555555', 0.9 + k * 0.2)}"/>`);
    }
    for (let row = 0; row < tiles.length; row++) for (let col = 0; col < [...tiles[row]!].length; col++) {
      const ch = [...tiles[row]!][col]!;
      const c = hexCenter({ col, row });
      parts.push(mark(ch, c.x, c.y, 50, rnd(row, col)));
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(world.w)}" height="${Math.round(world.h)}">${parts.join('')}</svg>`;
    const out = path.join(ROOT, 'public', v.image);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(out);
    console.log(`${id}: ${v.image} (${Math.round(world.w)}×${Math.round(world.h)})`);
  }
}
