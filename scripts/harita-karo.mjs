/**
 * K45: dünya haritası karo piramidi (sharp / libvips).
 *
 *   npm run harita-karo                      # assets-ham/harita/dunya/dunya-final-v47.png → public/maps/dunya/
 *   npm run harita-karo -- --kaynak <png> --cikti <klasör> [--kalite 95] [--ilk-kalite 85] [--ilk-sinir 1048576]
 *   npm run harita-karo -- --dogrula         # üretilmiş karolardan 20'sini kaynaktan kesip kıyaslar, yeniden üretip bayt eşitliğine bakar
 *   npm run harita-karo -- --oz-test         # kaynak gerekmez: yapay bir görselle bütün adımları sınar (CI, bulut)
 *
 * Çıktı: `<cikti>/{z}/{x}/{y}.webp` (512 px, WebP kalite 95 — ilk yükleme (z0–z2 + manifest) 1 MB'ı aşarsa yalnız z0–z2 kalite 85; kenar karoları kısmi boyutta), 6 zoom (0 tüm harita,
 * 5 = 1:1) ve `<cikti>/manifest.json` (tuval, karo boyu, seviyeler, kaynak SHA-256, boyutlar).
 * Bellek: libvips'in Deep Zoom yazıcısı (`tile`, layout dz) kaynağı akışla okur; 82 MP görsel tek seferde açılmaz
 * (`limitInputPixels: false`, `sequentialRead`). Aynı kaynak ve ayarla çıktı bayt bayt aynıdır (deterministik).
 * Windows: `sharp` kurulum betiği engellenmişse önce `npm install-scripts approve sharp` (ya da `npm rebuild sharp`).
 */
import { createHash } from 'node:crypto';
import { copyFileSync, createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const TILE = 512;
const LEVELS = 6;
const quality = Number(opt('--kalite', '95'));
/** H2c: ilk yükleme (z0–z2 + manifest) bu sınırı aşarsa yalnız z0–z2 `firstQuality` ile yeniden üretilir. */
const firstQuality = Number(opt('--ilk-kalite', '85'));
const firstLimit = Number(opt('--ilk-sinir', String(1024 * 1024)));
const FIRST_ZOOMS = 2;

/** Taşıma: geçici klasör başka sürücüdeyse renameSync EXDEV verir; o zaman kopyala + sil (H2c). */
function moveFile(from, to) {
  try { renameSync(from, to); } catch (e) {
    if (e && e.code === 'EXDEV') { copyFileSync(from, to); rmSync(from, { force: true }); } else throw e;
  }
}
const source = path.resolve(ROOT, opt('--kaynak', path.join('assets-ham', 'harita', 'dunya', 'dunya-final-v47.png')));
const out = path.resolve(ROOT, opt('--cikti', path.join('public', 'maps', 'dunya')));

sharp.cache(false);
sharp.concurrency(2);

/** Dosyanın SHA-256'sı (akışla). */
function sha256File(file) {
  return new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(file).on('data', (d) => h.update(d)).on('end', () => resolve(h.digest('hex'))).on('error', reject);
  });
}

/** Klasördeki bütün dosyalar (göreli yol, sıralı). */
function walk(dir, base = dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).sort().flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? walk(p, base) : [path.relative(base, p)];
  });
}

/** Kaynaktan karo piramidi üretir; manifest nesnesini döner. */
/** Deep Zoom piramidi (libvips) geçici klasöre; `only` verilirse yalnız o zoomlar `dest`e taşınır. */
async function pyramid(src, dest, w, h, q, only) {
  const tmp = path.join(tmpdir(), `harita-karo-${process.pid}-${Date.now()}-${q}`);
  mkdirSync(tmp, { recursive: true });
  try {
    // Deep Zoom: seviye L'de boyut ceil(W / 2^(maxL − L)); en üst seviye 1:1.
    await sharp(src, { limitInputPixels: false, sequentialRead: true })
      .webp({ quality: q, effort: 4, smartSubsample: false })
      .tile({ size: TILE, overlap: 0, layout: 'dz', container: 'fs' })
      .toFile(path.join(tmp, 'karo'));
    const files = path.join(tmp, 'karo_files');
    const maxL = Math.max(...readdirSync(files).filter((n) => /^\d+$/.test(n)).map(Number));
    const zooms = [];
    for (let z = 0; z < LEVELS; z++) {
      const level = maxL - (LEVELS - 1 - z);
      const dir = path.join(files, String(level));
      const scale = 2 ** (z - (LEVELS - 1));
      const zw = Math.ceil(w * scale), zh = Math.ceil(h * scale);
      const cols = Math.ceil(zw / TILE), rows = Math.ceil(zh / TILE);
      if (!only || only.includes(z)) {
        rmSync(path.join(dest, String(z)), { recursive: true, force: true });
        for (const f of readdirSync(dir)) {
          const [x, y] = f.replace('.webp', '').split('_').map(Number);
          const to = path.join(dest, String(z), String(x));
          mkdirSync(to, { recursive: true });
          moveFile(path.join(dir, f), path.join(to, `${y}.webp`));
        }
      }
      zooms.push({ z, olcek: scale, genislik: zw, yukseklik: zh, sutun: cols, satir: rows, kalite: q });
    }
    return zooms;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** Kaynaktan karo piramidi üretir; manifest nesnesini döner. */
async function build(src, dest) {
  const meta = await sharp(src, { limitInputPixels: false }).metadata();
  const [w, h] = [meta.width, meta.height];
  {
    rmSync(dest, { recursive: true, force: true });
    const zooms = await pyramid(src, dest, w, h, quality);
    const size = (f) => statSync(path.join(dest, f)).size;
    const firstBytes = () => walk(dest).filter((f) => f.endsWith('.webp') && Number(f.split(path.sep)[0]) <= FIRST_ZOOMS).reduce((n, f) => n + size(f), 0);
    // H2c: ilk yükleme (z0–z2 + manifest ≈ 2 kB) sınırı aşarsa yalnız z0–z2 düşük kaliteyle.
    if (firstQuality < quality && firstBytes() + 4096 > firstLimit) {
      const low = await pyramid(src, dest, w, h, firstQuality, Array.from({ length: FIRST_ZOOMS + 1 }, (_, i) => i));
      for (let z = 0; z <= FIRST_ZOOMS; z++) zooms[z] = low[z];
    }
    const all = walk(dest).filter((f) => f.endsWith('.webp'));
    const total = all.reduce((n, f) => n + size(f), 0);
    const first = firstBytes();
    const manifest = {
      not: 'K45: dünya haritası karoları (npm run harita-karo). Yol: {z}/{x}/{y}.webp; z = 0 tüm harita, 5 = 1:1. Elle düzenlenmez. H2c: kalite 95; ilk yükleme 1 MB\'ı aşarsa z0–z2 85 (zoom başına `kalite`).',
      tuval: [w, h], karo: TILE, seviye: LEVELS, kalite: quality, zoomlar: zooms,
      kaynak: { dosya: path.basename(src), sha256: await sha256File(src), bayt: statSync(src).size },
      karoSayisi: all.length, toplamBayt: total, ilkYuklemeBayt: first,
    };
    writeFileSync(path.join(dest, 'manifest.json'), `${JSON.stringify(manifest, null, 1)}\n`);
    return manifest;
  }
}

/** Basit tohumlu sayı üreteci (aynı karolar seçilsin). */
function lcg(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32); }

/** 20 karoyu kaynaktan kesip kıyaslar: ortalama mutlak fark (0–255) eşik altında mı. */
async function verifyTiles(src, dest, manifest, n = 20) {
  const rnd = lcg(45);
  const bad = [];
  let worst = 0;
  for (let i = 0; i < n; i++) {
    const zinfo = manifest.zoomlar[Math.floor(rnd() * manifest.zoomlar.length)];
    const x = Math.floor(rnd() * zinfo.sutun), y = Math.floor(rnd() * zinfo.satir);
    const file = path.join(dest, String(zinfo.z), String(x), `${y}.webp`);
    const tile = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const inv = 1 / zinfo.olcek;
    const left = Math.round(x * TILE * inv), top = Math.round(y * TILE * inv);
    const width = Math.min(Math.round(tile.info.width * inv), manifest.tuval[0] - left);
    const height = Math.min(Math.round(tile.info.height * inv), manifest.tuval[1] - top);
    const ref = await sharp(src, { limitInputPixels: false }).extract({ left, top, width, height })
      .resize(tile.info.width, tile.info.height, { kernel: 'cubic', fit: 'fill' }).removeAlpha().raw().toBuffer();
    let sum = 0;
    for (let k = 0; k < ref.length; k++) sum += Math.abs(ref[k] - tile.data[k]);
    const mad = sum / ref.length;
    worst = Math.max(worst, mad);
    // H2c: eşik kaliteye göre (95: 10/255, 85 ve altı: 16/255); z0–z2'de küçültme yöntemi farkı (libvips ikişer ortalama,
    // kıyas kübik) baskın olduğundan 16/255.
    const limit = zinfo.z <= FIRST_ZOOMS || (zinfo.kalite ?? manifest.kalite) < 90 ? 16 : 10;
    if (mad > limit) bad.push(`${zinfo.z}/${x}/${y} fark ${mad.toFixed(1)}`);
  }
  return { bad, worst };
}

/** İkinci üretim ilkiyle bayt bayt aynı mı. */
async function verifyBytes(src, dest) {
  const again = path.join(tmpdir(), `harita-karo-tekrar-${process.pid}`);
  try {
    await build(src, again);
    const a = walk(dest).filter((f) => f.endsWith('.webp')), b = walk(again).filter((f) => f.endsWith('.webp'));
    if (a.join() !== b.join()) return ['dosya listesi farklı'];
    return a.filter((f) => !readFileSync(path.join(dest, f)).equals(readFileSync(path.join(again, f))));
  } finally { rmSync(again, { recursive: true, force: true }); }
}

/** Manifest tutarlılığı: her zoom'da beklenen karo sayısı ve kenar karosu boyu. */
async function checkManifest(dest, m) {
  const errs = [];
  for (const z of m.zoomlar) {
    for (let x = 0; x < z.sutun; x++) for (let y = 0; y < z.satir; y++) {
      const f = path.join(dest, String(z.z), String(x), `${y}.webp`);
      if (!existsSync(f)) { errs.push(`eksik ${z.z}/${x}/${y}`); continue; }
      const { width, height } = await sharp(f).metadata();
      const ew = Math.min(TILE, z.genislik - x * TILE), eh = Math.min(TILE, z.yukseklik - y * TILE);
      if (width !== ew || height !== eh) errs.push(`${z.z}/${x}/${y}: ${width}×${height}, beklenen ${ew}×${eh}`);
    }
  }
  const count = m.zoomlar.reduce((n, z) => n + z.sutun * z.satir, 0);
  if (count !== m.karoSayisi) errs.push(`karo sayısı ${m.karoSayisi}, beklenen ${count}`);
  return errs;
}

const kb = (b) => `${(b / 1024).toFixed(0)} kB`;
async function report(dest, m) {
  const first = m.ilkYuklemeBayt + statSync(path.join(dest, 'manifest.json')).size;
  console.log(`tuval ${m.tuval.join('×')}, ${m.seviye} zoom, ${m.karoSayisi} karo, toplam ${kb(m.toplamBayt)}, ilk yükleme (z0–z2 + manifest) ${kb(first)} (${first <= firstLimit ? '≤' : '>'} ${kb(firstLimit)})`);
  for (const z of m.zoomlar) console.log(`  z${z.z}: ${z.genislik}×${z.yukseklik}, ${z.sutun}×${z.satir} karo, kalite ${z.kalite ?? m.kalite}`);
}

async function fullCheck(src, dest, m) {
  const merr = await checkManifest(dest, m);
  const { bad, worst } = await verifyTiles(src, dest, m);
  const bytes = await verifyBytes(src, dest);
  console.log(`manifest: ${merr.length ? merr.join('; ') : 'tutarlı'}`);
  console.log(`20 karo kaynakla: en büyük ortalama fark ${worst.toFixed(2)}/255 (eşik z0–z2 16, z3+ kalite ≥ 90'da 10)${bad.length ? ` — HATALI: ${bad.join(', ')}` : ''}`);
  console.log(`yeniden üretim: ${bytes.length ? `${bytes.length} dosya farklı` : 'bayt bayt aynı'}`);
  if (merr.length || bad.length || bytes.length) process.exitCode = 1;
}

if (args.includes('--oz-test')) {
  // Yapay kaynak: degrade + desen (kıyas için ayrıntılı), ölçek denetimi için tuhaf boyut.
  const dir = path.join(tmpdir(), `harita-karo-oz-${process.pid}`);
  mkdirSync(dir, { recursive: true });
  try {
    const W = 2741, H = 1200;
    const raw = Buffer.alloc(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      raw[i] = (x * 255 / W) | 0; raw[i + 1] = (y * 255 / H) | 0; raw[i + 2] = ((Math.sin(x / 37) + Math.cos(y / 23)) * 60 + 128) | 0;
    }
    const src = path.join(dir, 'kaynak.png');
    await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).png().toFile(src);
    const dest = path.join(dir, 'cikti');
    const m = await build(src, dest);
    await report(dest, m);
    await fullCheck(src, dest, m);
  } finally { rmSync(dir, { recursive: true, force: true }); }
} else {
  if (!existsSync(source)) {
    console.error(`Kaynak yok: ${source}\nDünya haritası depoya girmez (assets-ham/, .gitignore). Yerelde: npm run harita-karo -- --kaynak <png>`);
    process.exit(1);
  }
  if (args.includes('--dogrula')) {
    const m = JSON.parse(readFileSync(path.join(out, 'manifest.json'), 'utf8'));
    await fullCheck(source, out, m);
  } else {
    const t0 = Date.now();
    const m = await build(source, out);
    await report(out, m);
    console.log(`süre ${((Date.now() - t0) / 1000).toFixed(1)} sn`);
  }
}
