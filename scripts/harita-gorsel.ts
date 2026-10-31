// Görev H1/H2/HG1: harita arka plan görseli. Çalıştırma:
//   npm run harita-gorsel -- <harita-kimliği> [...] [--yer-tutucu] [--zorla]
// Her varyant için `image` yoluna (public/ altında) dünya boyutunda webp yazar:
// Kuyruk 19 D2: <ad> = varyant görselinin adı (`maps/<bolge>/<ad>.webp`; kimlikten bağımsız, kayıttaki `gorsel`).
// - assets-ham/harita/<bolge>/<ad>.(png|jpg|jpeg|webp) varsa (Gemini çıktısı): boyut ve en-boy oranı doğrulanır (src/map/mapArt.ts checkArt; şartname
//   harita/belgeler/gorsel-sartnamesi.md), uyarılar yazılır, görsel tam hedef boyuta getirilip WebP'ye çevrilir. Oran hatası
//   (altıgen hizası bozulur) varsa dosya yazılmaz; --zorla ile yine de yazılır.
// - Kuyruk 18 V1: yoksa harita/<bolge>/gorsel/<ad>.jpg (Kuyruk 19C) (tam üstten çizilmiş referans; ızgaradan biraz yüksek):
//   hedef en-boy oranına ORTADAN kırpılır (üst/alt eşit), sonra aynı yoldan WebP'ye çevrilir.
// - Kuyruk 18 V3: sahne (harita değil; `data/seferler.json` `odulSahnesi`, kimlik `volkan-hazine` ya da `odul-sahnesi`):
//   harita/volkan/gorsel/volkan-hazine.jpg → public/maps/volkan/volkan-hazine.webp
//   (en çok 1600 px en, kırpmasız; sefer ödül sahnesinin arka planı).
// - Kuyruk 19B T2: ikisi de yoksa mevcut işlenmiş görsele DOKUNMAZ (uyarı); yer tutucu yalnızca görsel hiç yoksa ya da
//   --yer-tutucu ile: zemin harflerinden (TERRAIN_COLOR, basit işaretler). Kurala dokunmaz. Karar: artSourcePlan.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { TERRAIN_COLOR } from '../src/map/terrain';
import { artName, artSize, artSourcePlan, checkArt } from '../src/map/mapArt';
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

/**
 * Kuyruk 19 D2: kaynak görseller bölge klasöründe, görselin adıyla (`artName`: `maps/<bolge>/<ad>.webp` → <bolge>, <ad>).
 * Eski düz adlar (`<kimlik>`, `<kimlik>-<varyant>`) geriye dönük olarak hâlâ aranır.
 */
function findIn(dir: string, names: string[], exts: string[]): string | null {
  for (const n of names) for (const ext of exts) { const f = path.join(dir, `${n}.${ext}`); if (fs.existsSync(f)) return f; }
  return null;
}
/** assets-ham/harita/<bolge>/<ad>.png|jpg|jpeg|webp (Gemini çıktısı; varsa). */
const rawImage = (bolge: string, name: string, legacy: string): string | null =>
  findIn(path.join(RAW_DIR, bolge), [name], ['png', 'jpg', 'jpeg', 'webp']) ?? findIn(RAW_DIR, [legacy], ['png', 'jpg', 'jpeg', 'webp']);
/** Kuyruk 19C: harita/<bolge>/gorsel/<ad>.jpg (tam üstten çizilmiş kaynak; ortadan kırpılır). */
const MAP_ROOT = path.join(ROOT, 'harita');
const refImage = (bolge: string, name: string, legacy: string): string | null =>
  findIn(path.join(MAP_ROOT, bolge, 'gorsel'), [name, legacy], ['jpg', 'jpeg']);
/** Kuyruk 19D: kimlikten harita dosyası (harita/<bolge>/<ad>.json; dosya adı kimlik değil, JSON'un `id` alanı aranır). */
function mapFile(id: string): string | null {
  for (const d of fs.readdirSync(MAP_ROOT)) {
    if (d === 'belgeler' || d === '_ortak' || !fs.statSync(path.join(MAP_ROOT, d)).isDirectory()) continue;
    for (const f of fs.readdirSync(path.join(MAP_ROOT, d))) {
      if (!f.endsWith('.json')) continue;
      const p = path.join(MAP_ROOT, d, f);
      if ((JSON.parse(fs.readFileSync(p, 'utf8')) as { id?: string }).id === id) return p;
    }
  }
  return null;
}

/** Harita olmayan sahne görselleri (V3 ödül sahnesi): kimlik ya da görsel adı → `data/seferler.json` `odulSahnesi`. */
function sceneImage(id: string): string | null {
  const seferler = (JSON.parse(fs.readFileSync(path.join(ROOT, 'data/seferler.json'), 'utf8')) as { seferler: Array<{ odulSahnesi?: string }> }).seferler;
  for (const s of seferler) {
    if (!s.odulSahnesi) continue;
    if (id === 'odul-sahnesi' || artName(s.odulSahnesi).name === id) return s.odulSahnesi;
  }
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
  const file = mapFile(id);
  const scene = file ? null : sceneImage(id);
  if (scene) {
    const { bolge, name } = artName(scene);
    const ref = refImage(bolge, name, 'odul-sahnesi');
    if (!ref) { console.log(`${id}: harita/${bolge}/gorsel/${name}.jpg yok, atlandı (sahne yer tutucu degradeyle çizilir).`); continue; }
    const out = path.join(ROOT, 'public', scene);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await sharp(ref).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
    console.log(`${id}: ${path.relative(ROOT, ref)} → public/${scene} (${Math.round(fs.statSync(out).size / 1024)} kB)`);
    continue;
  }
  if (!file) { console.log(`${id}: harita ya da sahne yok`); failed++; continue; }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as { environmentId: string; size: { cols: number; rows: number }; tiles: string[]; variants: Array<{ id: string; image: string; tiles?: string[] }> };
  const target = artSize(raw.size);
  const done = new Set<string>();
  for (const v of raw.variants) {
    const tiles = v.tiles ?? raw.tiles;
    // Aynı görseli paylaşan varyantlar (Volkan normal/uyuyan ejderha) bir kez işlenir.
    if (done.has(v.image)) continue;
    done.add(v.image);
    const out = path.join(ROOT, 'public', v.image);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const { bolge, name } = artName(v.image);
    const legacy = raw.variants.length > 1 ? `${id}-${v.id}` : id;
    const ref = placeholderOnly ? null : refImage(bolge, name, legacy);
    const src = placeholderOnly ? null : rawImage(bolge, name, legacy);
    const plan = artSourcePlan({ raw: !!src, ref: !!ref, existing: fs.existsSync(out), placeholderFlag: placeholderOnly });
    if (plan === 'keep') {
      console.log(`${name}: uyarı: assets-ham/harita/${bolge}/${name}.png ve harita/${bolge}/gorsel/${name}.jpg yok; mevcut ${v.image} korundu (yer tutucu için --yer-tutucu).`);
      continue;
    }
    if (plan === 'ref' && ref) {
      const meta = await sharp(ref).metadata();
      const crop = centerCrop(meta.width ?? 0, meta.height ?? 0, target.w / target.h);
      await sharp(ref).extract(crop).resize(target.w, target.h, { fit: 'fill' }).webp({ quality: 80 }).toFile(out);
      console.log(`${name}: ${path.relative(ROOT, ref)} ${meta.width}×${meta.height} → ortadan kırpma ${crop.width}×${crop.height} (üst ${crop.top}, sol ${crop.left}) → ${v.image} (${Math.round(fs.statSync(out).size / 1024)} kB)`);
      continue;
    }
    if (plan === 'placeholder' || !src) {
      await placeholder(raw, tiles, target, out);
      console.log(`${name}: yer tutucu ${v.image} (${target.w}×${target.h}; assets-ham/harita/${bolge}/${name}.png ve harita/${bolge}/gorsel/${name}.jpg yok)`);
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
