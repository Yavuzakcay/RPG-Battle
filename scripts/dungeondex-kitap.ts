// Dungeondex "Kitap" kabuğu varlık hattı (Görev DD-Kitap): assets-ham/dungeondex/*.jpg (macenta #FF00FF zemin) →
// public/dungeondex/*.webp (şeffaf, ≤ 400 kB) + data/dungeondex-kitap.json (kutular, 0–1 oran).
// Çalıştırma: npm run dd-kitap   (vite-node; saf ölçüm src/dungeondex/book/measure.ts, testler sentetik tamponla sınar)
//
// Şeffaflaştırma logo hattıyla aynı (keyWhite, zemin yüklemi macenta) + kenarda macenta yayılması temizliği + saydam
// kenar kırpma. Ham görsel yoksa o görselin JSON kaydı ve webp'si korunur (yalnızca uyarı). JSON'da `animasyon` ve
// `yontem` elle düzenlenir, betik korur; `elle` alanındaki kutular ölçümün üstüne yazılır (ölçüm yanlışsa düzeltme).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { Raw } from '../src/ui/logoKey';
import { coverProblems, keyMagenta, measureCover, measureMobile, measureSpread, spreadProblems, MEASURE_DEFAULTS, type MeasureOpts } from '../src/dungeondex/book/measure';

const root = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), '..');
const RAW = path.join(root, 'assets-ham/dungeondex');
const OUT = path.join(root, 'public/dungeondex');
const DATA = path.join(root, 'data/dungeondex-kitap.json');
// Telefonda keskin (390 px × DPR 3 ≈ 1170 px), üç görsel toplamı 2 MB altında.
const MAX_BYTES = 650_000;

type Kind = 'kapak' | 'genis' | 'mobil';
const SOURCES: Record<Kind, { src: string; out: string; width: number }> = {
  kapak: { src: 'kapak', out: 'kapak.webp', width: 1200 },
  genis: { src: 'cerceve-genis', out: 'cerceve-genis.webp', width: 2400 },
  mobil: { src: 'cerceve-mobil', out: 'cerceve-mobil.webp', width: 1200 },
};

function findRaw(base: string): string | null {
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
    const f = path.join(RAW, base + ext);
    if (fs.existsSync(f)) return f;
  }
  return null;
}

async function readRgb(file: string): Promise<Raw> {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: 3 };
}

/** Kaliteyi (sonra eni) düşürerek ≤ MAX_BYTES WebP. */
async function writeWebp(img: Raw, file: string, width: number): Promise<{ bytes: number; width: number; height: number; quality: number }> {
  let w = Math.min(width, img.width);
  for (;;) {
    for (let q = 84; q >= 52; q -= 8) {
      const buf = await sharp(Buffer.from(img.data), { raw: { width: img.width, height: img.height, channels: 4 } })
        .resize({ width: w, kernel: 'lanczos3' }).webp({ quality: q, alphaQuality: 90, effort: 6 }).toBuffer();
      if (buf.length <= MAX_BYTES || (q <= 52 && w < 500)) {
        fs.writeFileSync(file, buf);
        const meta = await sharp(buf).metadata();
        return { bytes: buf.length, width: meta.width!, height: meta.height!, quality: q };
      }
    }
    w = Math.round(w * 0.88);
  }
}

/** Kapağın deri rengi: opak kenar bandındaki (sol ve sağ %4, orta yükseklik) piksellerin medyanı; ekran kenarlarını doldurur. */
function edgeColor(img: Raw): string {
  const vals: number[][] = [[], [], []];
  const band = Math.max(2, Math.round(img.width * 0.04));
  for (let y = Math.round(img.height * 0.25); y < img.height * 0.75; y += 2) {
    for (const x0 of [0, img.width - band]) for (let x = x0; x < x0 + band; x += 2) {
      const i = (y * img.width + x) * 4;
      if (img.data[i + 3]! < 250) continue;
      for (let c = 0; c < 3; c++) vals[c]!.push(img.data[i + c]!);
    }
  }
  const med = (a: number[]) => { if (!a.length) return 26; a.sort((p, q) => p - q); return a[a.length >> 1]!; };
  return '#' + vals.map((a) => med(a).toString(16).padStart(2, '0')).join('');
}

const data = JSON.parse(fs.readFileSync(DATA, 'utf8')) as Record<string, unknown> & { yontem?: Partial<MeasureOpts>; elle?: Partial<Record<Kind, Record<string, unknown>>> };
const opts = { ...MEASURE_DEFAULTS, ...(data.yontem ?? {}) };
fs.mkdirSync(OUT, { recursive: true });
let fail = false;

for (const kind of Object.keys(SOURCES) as Kind[]) {
  const s = SOURCES[kind];
  const file = findRaw(s.src);
  if (!file) { console.warn(`! ${s.src}: ham görsel yok (${path.relative(root, RAW)}); kayıt korunuyor.`); continue; }
  const img = keyMagenta(await readRgb(file));
  const aspect = img.width / img.height;
  const m = kind === 'kapak' ? measureCover(img, opts) : kind === 'genis' ? measureSpread(img, opts) : measureMobile(img, opts);
  if (!m) { console.error(`✗ ${s.src}: kutular bulunamadı (yontem eşiklerini ya da elle alanını kullan).`); fail = true; continue; }
  const merged = { ...m, ...(data.elle?.[kind] ?? {}) };
  const problems = kind === 'kapak' ? coverProblems(merged as never, aspect) : spreadProblems(merged as never, aspect, kind);
  const out = await writeWebp(img, path.join(OUT, s.out), s.width);
  const zemin = kind === 'kapak' ? { zemin: edgeColor(img) } : {};
  data[kind] = { file: `dungeondex/${s.out}`, width: out.width, height: out.height, aspect: Math.round(aspect * 10000) / 10000, bytes: out.bytes, quality: out.quality, ...zemin, ...merged };
  console.log(`${problems.length ? '!' : '✓'} ${s.src}: ${out.width}×${out.height}, ${(out.bytes / 1000).toFixed(1)} kB (q ${out.quality})`);
  for (const [k, v] of Object.entries(merged)) console.log(`   ${k}: ${JSON.stringify(v)}`);
  for (const p of problems) console.warn(`   ! ${p}`);
  if (problems.length) fail = true;
}

// Kapaktaki ejderhanın altıgeni: kapalı kanatlı logo gövdesinin alfa sınırı (kendi görselinin oranı).
{
  const f = path.join(root, 'public/logo/acilis-kapali-govde.webp');
  if (fs.existsSync(f)) {
    const { data: px, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (px[(y * info.width + x) * 4 + 3]! > 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const r = (v: number) => Math.round(v * 10000) / 10000;
    if (x1 >= 0) data.logoAltigen = { x: r(x0 / info.width), y: r(y0 / info.height), w: r((x1 - x0 + 1) / info.width), h: r((y1 - y0 + 1) / info.height) };
  }
}

fs.writeFileSync(DATA, JSON.stringify(data, null, 1) + '\n');
console.log(`→ ${path.relative(root, DATA)}`);
if (fail) process.exitCode = 1;
