// Görev H1/H2/HG1: harita arka plan görseli. Çalıştırma:
//   npm run harita-gorsel -- <harita-kimliği> [...] [--yer-tutucu] [--zorla]
// Her varyant için `image` yoluna (public/ altında) dünya boyutunda webp yazar:
// - assets-ham/harita/<ad>.(png|jpg|jpeg|webp) varsa (Gemini çıktısı; <ad> = kimlik, çok varyantlıysa
//   <kimlik>-<varyant>): boyut ve en-boy oranı doğrulanır (src/map/mapArt.ts checkArt; şartname
//   docs/harita/gorsel-sartnamesi.md), uyarılar yazılır, görsel tam hedef boyuta getirilip WebP'ye çevrilir. Oran hatası
//   (altıgen hizası bozulur) varsa dosya yazılmaz; --zorla ile yine de yazılır.
// - Kuyruk 18 V1: yoksa docs/harita/referans/<ad>.(jpg|png) (tam üstten çizilmiş referans; ızgaradan biraz yüksek):
//   hedef en-boy oranına ORTADAN kırpılır (üst/alt eşit), sonra aynı yoldan WebP'ye çevrilir.
// - yoksa (ya da --yer-tutucu): zemin harflerinden yer tutucu (TERRAIN_COLOR, basit işaretler). Kurala dokunmaz.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { TERRAIN_COLOR } from '../src/map/terrain';
import { artSize, checkArt } from '../src/map/mapArt';
import { hexCenter, hexPoints } from '../src/ui/mapView';

const ROOT = path.join(import.meta.dirname ?? '.', '..');
const RAW_DIR = path.join(ROOT, 'assets-ham/harita');
const args = process.argv.slice(2);
const ids = args.filter((a) => !a.startsWith('--'));
const placeholderOnly = args.includes('--yer-tutucu');
const force = args.includes('--zorla');
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

async function placeholder(raw: { environmentId: string; tiles: string[] }, tiles: string[], world: { w: number; h: number }, out: string) {
  // Yeraltında açık zemin çimen değil taş taban rengiyle çizilir (yalnızca görsel).
  const colors: Record<string, string> = raw.environmentId.startsWith('yeralt') ? { ...TERRAIN_COLOR, '.': '#6f675a' } : TERRAIN_COLOR;
  const parts: string[] = [`<rect width="${world.w}" height="${world.h}" fill="#1b1c20"/>`];
  for (let row = 0; row < tiles.length; row++) for (let col = 0; col < [...tiles[row]!].length; col++) {
    const ch = [...tiles[row]!][col]!;
    const k = rnd(col, row);
    parts.push(`<polygon points="${hexPoints({ col, row }, 1.02)}" fill="${shade(colors[ch] ?? '#555555', 0.9 + k * 0.2)}"/>`);
  }
  for (let row = 0; row < tiles.length; row++) for (let col = 0; col < [...tiles[row]!].length; col++) {
    const ch = [...tiles[row]!][col]!;
    const c = hexCenter({ col, row });
    parts.push(mark(ch, c.x, c.y, 50, rnd(row, col)));
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${world.w}" height="${world.h}">${parts.join('')}</svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(out);
}

/** assets-ham/harita/ içindeki ham görsel (varsa). */
function rawImage(name: string): string | null {
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) { const f = path.join(RAW_DIR, `${name}.${ext}`); if (fs.existsSync(f)) return f; }
  return null;
}

/** Kuyruk 18 V1: docs/harita/referans/<ad>.jpg referansı (Ejder Yuvası gibi elle çizilmiş tam görseller). */
const REF_DIR = path.join(ROOT, 'docs/harita/referans');
function refImage(name: string): string | null {
  for (const ext of ['jpg', 'jpeg']) { const f = path.join(REF_DIR, `${name}.${ext}`); if (fs.existsSync(f)) return f; }
  return null;
}

/** Görseli hedef en-boy oranına ortadan kırpar (fazla yükseklik üst/alttan eşit, fazla en sağ/soldan eşit). */
export function centerCrop(w: number, h: number, ratio: number): { left: number; top: number; width: number; height: number } {
  if (w / h < ratio) { const height = Math.round(w / ratio); return { left: 0, top: Math.floor((h - height) / 2), width: w, height }; }
  const width = Math.round(h * ratio);
  return { left: Math.floor((w - width) / 2), top: 0, width, height: h };
}

let failed = 0;
for (const id of ids) {
  const file = path.join(ROOT, 'data/maps', `${id}.json`);
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as { environmentId: string; size: { cols: number; rows: number }; tiles: string[]; variants: Array<{ id: string; image: string; tiles?: string[] }> };
  const target = artSize(raw.size);
  for (const v of raw.variants) {
    const tiles = v.tiles ?? raw.tiles;
    const out = path.join(ROOT, 'public', v.image);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const name = raw.variants.length > 1 ? `${id}-${v.id}` : id;
    const ref = placeholderOnly ? null : refImage(name);
    if (ref && !rawImage(name)) {
      const meta = await sharp(ref).metadata();
      const crop = centerCrop(meta.width ?? 0, meta.height ?? 0, target.w / target.h);
      await sharp(ref).extract(crop).resize(target.w, target.h, { fit: 'fill' }).webp({ quality: 80 }).toFile(out);
      console.log(`${name}: ${path.relative(ROOT, ref)} ${meta.width}×${meta.height} → ortadan kırpma ${crop.width}×${crop.height} (üst ${crop.top}, sol ${crop.left}) → ${v.image} (${Math.round(fs.statSync(out).size / 1024)} kB)`);
      continue;
    }
    const src = placeholderOnly ? null : rawImage(name);
    if (!src) {
      await placeholder(raw, tiles, target, out);
      console.log(`${name}: yer tutucu ${v.image} (${target.w}×${target.h}; assets-ham/harita/${name}.png yok)`);
      continue;
    }
    const meta = await sharp(src).metadata();
    const kb = fs.statSync(src).size / 1024;
    const check = checkArt({ w: meta.width ?? 0, h: meta.height ?? 0 }, raw.size);
    console.log(`${name}: ${path.relative(ROOT, src)} ${meta.width}×${meta.height} (${Math.round(kb)} kB) → hedef ${target.w}×${target.h}`);
    for (const i of check.issues) console.log(`  ${i.level === 'error' ? 'HATA' : 'uyarı'}: ${i.text}`);
    if (check.level === 'error' && !force) { failed++; console.log('  yazılmadı (--zorla ile yine de yazılır)'); continue; }
    await sharp(src).resize(target.w, target.h, { fit: 'fill' }).webp({ quality: 82 }).toFile(out);
    const outKb = fs.statSync(out).size / 1024;
    const after = checkArt({ ...target, kb: outKb }, raw.size);
    for (const m of after.messages) console.log(`  uyarı: ${m}`);
    console.log(`  → ${v.image} (${Math.round(outKb)} kB WebP)`);
  }
}
if (failed) process.exitCode = 1;
