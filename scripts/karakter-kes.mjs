// Wizard ırk sayfaları (4x2, A ve B) → jeton PNG'leri. Kullanım: npm run karakter-kes -- [--kuru] [--zorla] [--girdi klasör] [--cikti klasör] [--tuval 512] [--yalniz ad]
// Girdi: assets-ham/karakter/wizard-<male|female>-<irk>-<a|b>.<png|jpg> (assets-ham kökünde, depoya girmez; erkek/kadin de kabul). Çıktı: wizard-<erkek|kadin>-<irk>-<slug>.png (varsayılan public/characters).
// Var olan dosya --zorla olmadan ezilmez. --kuru hiçbir şey yazmaz, ızgara/hücre raporu verir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { processSheet, placement } from './lib/karakter-kesim.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const IN = path.resolve(opt('--girdi', path.join(root, 'assets-ham')));
const OUT = path.resolve(opt('--cikti', path.join(root, 'public/characters')));
const CANVAS = Number(opt('--tuval', 512));
const MARGIN = Math.round(CANVAS * 0.05);
const kuru = flag('--kuru'), zorla = flag('--zorla'), yalniz = opt('--yalniz', null);

if (!fs.existsSync(IN)) { console.log(`girdi klasörü yok: ${IN} (ham sayfalar assets-ham/ kökünde)`); process.exit(0); }
const files = fs.readdirSync(IN).map((f) => ({ f, m: /^wizard-(male|female|erkek|kadin)-(.+)-(a|b)\.(?:png|jpe?g)$/i.exec(f) })).filter((x) => x.m && (!yalniz || x.f.includes(yalniz))).sort((p, q) => p.f.localeCompare(q.f));
if (!files.length) console.log('eşleşen sayfa yok (wizard-<male|female>-<irk>-<a|b>.png|jpg)');

// Çapraz sınıf karşılaştırması: mevcut jetonlarda karakter yüksekliği (alfa kutusu) ortalaması
async function existingHeights() {
  const dir = OUT;
  if (!fs.existsSync(dir)) return [];
  const rows = [];
  for (const f of fs.readdirSync(dir).filter((x) => /-(male|female)-(?!wizard)[a-z]+\.webp$/.test(x)).slice(0, 60)) {
    const { data, info } = await sharp(path.join(dir, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let y0 = info.height, y1 = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 16) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (y1 >= 0) rows.push((y1 - y0 + 1) / info.height);
  }
  return rows;
}
const mean = (a) => (a.length ? a.reduce((p, q) => p + q, 0) / a.length : 0);

const heights = [];
let written = 0, skipped = 0;
if (!kuru) fs.mkdirSync(OUT, { recursive: true });
for (const { f, m } of files) {
  const [, g0, race, kind] = m;
  const gender = { male: 'erkek', female: 'kadin' }[g0.toLowerCase()] ?? g0.toLowerCase();
  const { data, info } = await sharp(path.join(IN, f)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { grid, cells } = processSheet(new Uint8Array(data), info.width, info.height, kind.toLowerCase());
  console.log(`\n${f}: ${info.width}x${info.height}, ızgara ${grid.ok ? 'tamam' : 'BULUNAMADI'}, ${grid.cells.length} hücre (${grid.cells[0].w}x${grid.cells[0].h})`);
  if (grid.warn) console.warn(`  UYARI: ${grid.warn}`);
  for (const c of cells) {
    const tag = `  #${c.index} ${c.slug ?? '(boş)'}`;
    if (c.empty) { console.log(`${tag}: boş hücre, atlandı`); continue; }
    const pl = placement(c.box, c.rect, CANVAS, MARGIN);
    heights.push(pl.h / CANVAS);
    const warn = c.distEdge < 6 ? '  ⚠ kenara yakın (kırpılmış olabilir)' : '';
    console.log(`${tag}: zemin ${c.bg.name}, karakter ${c.box.w}x${c.box.h}, kenara ${c.distEdge} px, kalan zemin pikseli ${c.leftover}${warn}`);
    const name = `wizard-${gender}-${race}-${c.slug}.png`;
    const target = path.join(OUT, name);
    if (kuru) continue;
    if (fs.existsSync(target) && !zorla) { skipped++; console.log(`    var, atlandı: ${name} (--zorla)`); continue; }
    const crop = await sharp(Buffer.from(c.rgba), { raw: { width: c.rect.w, height: c.rect.h, channels: 4 } })
      .extract({ left: c.box.x, top: c.box.y, width: c.box.w, height: c.box.h })
      .resize(pl.w, pl.h, { kernel: 'lanczos3' }).png().toBuffer();
    await sharp({ create: { width: CANVAS, height: CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: crop, left: pl.left, top: pl.top }]).png().toFile(target);
    written++;
  }
}
const ex = await existingHeights();
console.log(`\nKarşılaştırma (tuval ${CANVAS}): mevcut diğer sınıf jetonlarında karakter yüksekliği ort. ${(mean(ex) * 100).toFixed(0)}% (${ex.length} jeton); bu sayfalarda ${(mean(heights) * 100).toFixed(0)}% (${heights.length} hücre)`);
console.log(kuru ? 'kuru çalıştırma: hiçbir şey yazılmadı' : `${written} yazıldı, ${skipped} atlandı → ${OUT}`);
