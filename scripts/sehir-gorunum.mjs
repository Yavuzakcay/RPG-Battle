// Kuyruk 44: yerleşim şehir görünümü görselleri ve düğümleri.
//   npm run sehir-gorunum            (assets-ham/yerlesim/ → public/yerlesim/<id>.webp + data/sehir-gorunum.json)
//   npm run sehir-gorunum -- --kuru  (yalnızca rapor; dosya yazmaz)
// Girdi (depo dışı, gitignore): assets-ham/yerlesim/kirpilmis/*-2337.jpg + dugumler.json + dugumler-kasaba.json,
// assets-ham/yerlesim/beyaz-sehir/beyaz-sehir-gorunum.jpg. Dosya/grup adı yerleşim kimliğine anahtar sözcükle eşlenir.
// Düğüm kimliği kalıcıdır: aynı adlı düğüm eski kimliğini korur; yeni düğüm `<yerlesim>/<ad>`. Koordinatlar görsele
// göre 0–1 (kırpılmış görselde değişmez). Beyaz Şehir düğümleri veride elle (görevde verildi); betik yalnızca görseli üretir.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = new URL('..', import.meta.url).pathname;
const HAM = join(ROOT, 'assets-ham/yerlesim');
const OUT = join(ROOT, 'public/yerlesim');
const DATA = join(ROOT, 'data/sehir-gorunum.json');
const DRY = process.argv.includes('--kuru');
const MAX_W = 1920;

const SOZ = [
  [/kral/, 'kral-kalesi'], [/cuce|dwarf/, 'cuce-kalesi'], [/goliath/, 'goliath-kalesi'], [/ejder|dragon/, 'ejder-kalesi'],
  [/elf/, 'elf-kasabasi'], [/hobbit|yarimcik|halfling/, 'yarimcik-kasabasi'], [/tiefling/, 'tiefling-kasabasi'],
  [/gnom|gnome/, 'gnom-kasabasi'], [/(^|[^a-z])ork|orc/, 'ork-kasabasi'], [/beyaz/, 'beyaz-sehir'],
];
const sade = (s) => String(s).replace(/ı/g, 'i').replace(/İ/g, 'i').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const slug = (s) => sade(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const yerlesimOf = (s) => SOZ.find(([re]) => re.test(sade(s)))?.[1] ?? null;

/** "x;y" | [x, y] | {x, y} → [x, y] */
function koord(v) {
  if (typeof v === 'string') { const m = v.replace(',', '.').split(/[;\s]+/).map(Number); return m.length >= 2 ? [m[0], m[1]] : null; }
  if (Array.isArray(v) && v.length >= 2) return [Number(v[0]), Number(v[1])];
  if (v && typeof v === 'object' && 'x' in v && 'y' in v) return [Number(v.x), Number(v.y)];
  return null;
}
const adOf = (o) => o.ad ?? o.name ?? o.tr ?? o.bina ?? o.label ?? o.isim;
const xyOf = (o) => koord(o) ?? koord(o.konum ?? o.xy ?? o.coords ?? o.koordinat ?? o.k);

/** dugumler*.json → { yerlesim: [{ ad, x, y }] } (esnek biçim: grup → dizi/nesne; ya da düz dizi). */
function oku(file) {
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  const out = {};
  const ekle = (grup, ad, xy) => {
    const id = yerlesimOf(grup);
    if (!id) { console.warn(`  ! eşlenmeyen grup: ${grup} (atlandı)`); return; }
    if (!ad || !xy || xy.some((n) => !Number.isFinite(n))) { console.warn(`  ! geçersiz düğüm: ${grup} / ${ad}`); return; }
    (out[id] ??= []).push({ ad: String(ad), x: xy[0], y: xy[1] });
  };
  const grupla = (grup, v) => {
    if (Array.isArray(v)) for (const o of v) ekle(grup, adOf(o), xyOf(o));
    else if (v && typeof v === 'object') {
      if (Array.isArray(v.dugumler)) return grupla(grup, v.dugumler);
      for (const [ad, xy] of Object.entries(v)) ekle(grup, ad, koord(xy));
    }
  };
  if (Array.isArray(raw)) for (const o of raw) ekle(o.yerlesim ?? o.grup ?? o.sehir ?? '', adOf(o), xyOf(o));
  else for (const [grup, v] of Object.entries(raw)) grupla(grup, v);
  return out;
}

const data = JSON.parse(readFileSync(DATA, 'utf8'));
const rapor = [];
if (!existsSync(HAM)) { console.error(`Ham klasör yok: ${HAM}`); process.exit(1); }

// Düğümler.
const kirp = join(HAM, 'kirpilmis');
const dugum = {};
for (const f of ['dugumler.json', 'dugumler-kasaba.json']) {
  const p = join(kirp, f);
  if (existsSync(p)) Object.assign(dugum, oku(p)); else console.warn(`  ! ${f} yok`);
}
for (const [id, list] of Object.entries(dugum)) {
  if (id === 'beyaz-sehir') continue;
  const y = (data.yerlesimler[id] ??= { dugumler: [] });
  const eski = new Map(y.dugumler.map((n) => [sade(n.tr), n]));
  const kul = new Set();
  y.dugumler = list.map((n) => {
    const prev = eski.get(sade(n.ad));
    let nid = prev?.id ?? `${id}/${slug(n.ad)}`;
    for (let i = 2; kul.has(nid); i++) nid = `${id}/${slug(n.ad)}-${i}`;
    kul.add(nid);
    const ev = /^ev( |$)/.test(sade(n.ad));
    return { id: nid, tr: prev?.tr ?? n.ad, en: prev?.en ?? n.ad, x: n.x, y: n.y, ...(ev ? { ev: true } : {}), komsular: prev?.komsular ?? [] };
  });
  rapor.push(`${id}: ${y.dugumler.length} düğüm`);
}

// Görseller.
const kaynaklar = [];
if (existsSync(kirp)) for (const f of readdirSync(kirp)) if (/-2337\.(jpe?g|png|webp)$/i.test(f)) kaynaklar.push(join(kirp, f));
const beyaz = join(HAM, 'beyaz-sehir/beyaz-sehir-gorunum.jpg');
if (existsSync(beyaz)) kaynaklar.push(beyaz);
if (!DRY) mkdirSync(OUT, { recursive: true });
for (const src of kaynaklar) {
  const name = src.split('/').pop();
  const id = yerlesimOf(name);
  if (!id || !data.yerlesimler[id]) { rapor.push(`! ${name}: yerleşim eşlenmedi (atlandı)`); continue; }
  const img = sharp(src);
  const meta = await img.metadata();
  const w = Math.min(MAX_W, meta.width), h = Math.round((meta.height * w) / meta.width);
  if (!DRY) await img.resize(w, h).webp({ quality: 80 }).toFile(join(OUT, `${id}.webp`));
  Object.assign(data.yerlesimler[id], { gorsel: `yerlesim/${id}.webp`, boyut: [w, h] });
  rapor.push(`${id}: ${name} → yerlesim/${id}.webp (${w}×${h})`);
}

console.log(rapor.join('\n'));
if (!DRY) writeFileSync(DATA, `${JSON.stringify(data, null, 1)}\n`);
