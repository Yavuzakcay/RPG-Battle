// Zar görselleri: assets-ham/zarlar/zar-<tema>.jpg (macenta zeminde yan yana boş yüzlü zarlar, soldan sağa
// d4, d6, d8, d10, d12, d20, d100) → public/zarlar/<tema>/d4.webp … d100.webp (128×128, saydam).
// Çalıştırma: npm run zarlar [-- --kuru | --incele] [-- --yalniz tema1,tema2]
//
// SD9: 63 ham kimlik (data/zar-gorselleri.json; ham dosya zar-<kimlik>.jpg). `--kuru`: görsel yazmaz; ham dosyaları ve veriyi
// karşılaştırır (veride olmayan ham, ham'ı olmayan tema, bölütleme sonucu), boyut raporu verir. `--incele` (SD9b): görsel/veri
// yazmaz; sorunlu sayfalar (data/zar-kesim.json `incele` + yedi zar ayrışmayanlar) için bileşenleri renkli çizen inceleme görseli
// docs/zar-kesim/<tema>.png ve docs/zar-kesim/RAPOR.md (kurtarıldı / yeniden üretilmeli) yazar. İş bitince data/zar-mevcut.json
// (görseli üretilmiş temalar) güncellenir; kuru ve inceleme kipinde yazılmaz.
//
// Bölütleme (scripts/lib/zar-kesim.mjs, testli): zeminden flood-fill + despill + bağlı bileşenler (sıkı eşik); yedi bileşen
// çıkmazsa sırayla gevşek zemin eşiği, aşındırma (zarlar birbirine değiyorsa), data/zar-kesim.json `kutular` (elle 7 dikdörtgen,
// varsa önce o) ve başarılı sayfalardan oransal şablon; hiçbiri tutmazsa "yeniden üretilmeli". Hepsine aynı ölçek (en büyük kenar
// 116 px), nearest-neighbor; alt kenar (ayak) 122 px, yatayda ortalı.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { NAMES, segment, templateFrom } from './lib/zar-kesim.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(root, 'assets-ham/zarlar');
const OUT = path.join(root, 'public/zarlar');
const DOCS = path.join(root, 'docs/zar-kesim');
const SIZE = 128;
const LARGEST = 116;
const FOOT = 122;

const argv = process.argv.slice(2);
const DRY = argv.includes('--kuru');
const INSPECT = argv.includes('--incele');
const only = argv.includes('--yalniz') ? (argv[argv.indexOf('--yalniz') + 1] ?? '').split(',').filter(Boolean) : null;
const themeIds = JSON.parse(fs.readFileSync(path.join(root, 'data/zar-gorselleri.json'), 'utf8')).themes.map((x) => x.id);
const kesim = JSON.parse(fs.readFileSync(path.join(root, 'data/zar-kesim.json'), 'utf8'));
const rawFiles = fs.existsSync(RAW) ? fs.readdirSync(RAW).filter((f) => /^zar-[a-z0-9-]+\.(jpg|png)$/.test(f)).sort() : [];
const rawTheme = (f) => f.replace(/^zar-/, '').replace(/\.(jpg|png)$/, '');
const rawIds = rawFiles.map(rawTheme);
const unknown = rawIds.filter((id) => !themeIds.includes(id));
const noRaw = themeIds.filter((id) => !rawIds.includes(id));
console.log(`Veride ${themeIds.length} tema; ham dosya ${rawFiles.length}.`);
if (unknown.length) console.log(`Veride OLMAYAN ham dosya (kimlik data/zar-gorselleri.json'a eklenmeli ya da ad düzeltilmeli): ${unknown.join(', ')}`);
if (noRaw.length) console.log(`Ham dosyası OLMAYAN tema (klasik yedekle çizilir): ${noRaw.join(', ')}`);
if (rawFiles.length === 0 && !DRY && !INSPECT) throw new Error(`${RAW} altında zar-<tema>.jpg yok (yalnız kurulum yerelde; bulutta --kuru ya da --incele kullanma, ham dosya gerekir)`);

async function load(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
const wanted = rawFiles.filter((f) => themeIds.includes(rawTheme(f)) && (!only || only.includes(rawTheme(f))));

// 1. geçiş: şablonsuz bölütleme; başarılılardan oransal şablon; 2. geçiş: yalnız başarısızlar şablonla.
const results = new Map();
for (const f of wanted) {
  const theme = rawTheme(f); const img = await load(path.join(RAW, f));
  results.set(theme, { img, seg: segment(img.data, img.w, img.h, { kutu: kesim.kutular?.[theme], sablonYok: true, erodeMax: kesim.erozyonMax }) });
}
const goods = [...results.values()].filter((r) => r.seg.ok && (r.seg.method === 'temel' || r.seg.method === 'gevsek')).map((r) => r.seg);
const sablon = kesim.sablon ?? (goods.length >= 3 ? templateFrom(goods) : null);
for (const [theme, r] of results) {
  if (r.seg.ok) continue;
  r.seg = segment(r.img.data, r.img.w, r.img.h, { kutu: kesim.kutular?.[theme], sablon: sablon ?? undefined, erodeMax: kesim.erozyonMax });
}
const bad = [...results].filter(([, r]) => !r.seg.ok).map(([t]) => t);
for (const [theme, r] of results) console.log(`${theme}: ${r.seg.ok ? `${r.seg.kept.length} zar [${r.seg.method}]` : `AYRIŞMADI (${r.seg.note})`}`);

// İnceleme görseli: bileşenler renkli; gözle doğrulama için.
const COLORS = [[255, 80, 80], [80, 200, 255], [255, 220, 60], [120, 255, 120], [255, 140, 255], [255, 160, 60], [180, 180, 255]];
async function inspectImage(theme, r) {
  const { w, h, data } = r.img; const out = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    const id = r.seg.comp[i]; const k = id >= 0 ? r.seg.kept.findIndex((p) => p.id === id) : -1;
    const c = k >= 0 ? COLORS[k % 7] : null;
    out[i * 3] = c ? (data[i * 3] * 0.45 + c[0] * 0.55) | 0 : data[i * 3] * 0.35; out[i * 3 + 1] = c ? (data[i * 3 + 1] * 0.45 + c[1] * 0.55) | 0 : data[i * 3 + 1] * 0.35; out[i * 3 + 2] = c ? (data[i * 3 + 2] * 0.45 + c[2] * 0.55) | 0 : data[i * 3 + 2] * 0.35;
  }
  fs.mkdirSync(DOCS, { recursive: true });
  await sharp(out, { raw: { width: w, height: h, channels: 3 } }).resize({ width: Math.min(w, 1600) }).png().toFile(path.join(DOCS, `${theme}.png`));
}
if (INSPECT) {
  const list = [...new Set([...(kesim.incele ?? []), ...bad])].filter((t) => results.has(t));
  const lines = ['# Zar sayfası kesim incelemesi (`npm run zarlar -- --incele`)', '', '| tema | yöntem | zar | durum |', '|---|---|---|---|'];
  for (const t of list) {
    const r = results.get(t); await inspectImage(t, r);
    const st = !r.seg.ok ? 'yeniden üretilmeli' : r.seg.method === 'sablon' ? 'kurtarıldı (oransal şablon: gözle doğrula)' : r.seg.method === 'kutu' ? 'kurtarıldı (elle kutu)' : 'kurtarıldı';
    lines.push(`| ${t} | ${r.seg.method} | ${r.seg.kept.length} | ${st} |`);
  }
  for (const t of (kesim.incele ?? []).filter((x) => !results.has(x))) lines.push(`| ${t} | – | – | ham dosya yok |`);
  lines.push('', `Yeniden üretilmeli: ${bad.length ? bad.join(', ') : 'yok'}`);
  fs.mkdirSync(DOCS, { recursive: true });
  fs.writeFileSync(path.join(DOCS, 'RAPOR.md'), lines.join('\n') + '\n');
  console.log(`İnceleme: docs/zar-kesim/ (${list.length} sayfa); yeniden üretilmeli: ${bad.length ? bad.join(', ') : 'yok'}`);
}

let failed = bad.length > 0;
if (!DRY && !INSPECT) {
  for (const [theme, r] of results) {
    if (!r.seg.ok) { console.error(`${theme}: yedi zar ayrışmadı; atlandı (yeniden üretilmeli ya da data/zar-kesim.json kutular).`); continue; }
    const { img, seg } = r;
    const largest = Math.max(...seg.kept.map((p) => Math.max(p.maxX - p.minX + 1, p.maxY - p.minY + 1)));
    const scale = LARGEST / largest;
    const out = path.join(OUT, theme);
    fs.mkdirSync(out, { recursive: true });
    for (const [k, p] of seg.kept.entries()) {
      const bw = p.maxX - p.minX + 1, bh = p.maxY - p.minY + 1;
      const rgba = Buffer.alloc(bw * bh * 4);
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
        const i = (p.minY + y) * img.w + p.minX + x;
        if (seg.comp[i] !== p.id) continue;
        const o = (y * bw + x) * 4;
        rgba[o] = img.data[i * 3]; rgba[o + 1] = img.data[i * 3 + 1]; rgba[o + 2] = img.data[i * 3 + 2]; rgba[o + 3] = 255;
      }
      const tw = Math.max(1, Math.round(bw * scale)), th = Math.max(1, Math.round(bh * scale));
      const fig = await sharp(rgba, { raw: { width: bw, height: bh, channels: 4 } }).resize(tw, th, { kernel: 'nearest' }).raw().toBuffer();
      const left = Math.round((SIZE - tw) / 2);
      const top = FOOT - th;
      const canvas = Buffer.alloc(SIZE * SIZE * 4);
      for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
        const X = left + x, Y = top + y;
        if (X < 0 || Y < 0 || X >= SIZE || Y >= SIZE) continue;
        fig.copy(canvas, (Y * SIZE + X) * 4, (y * tw + x) * 4, (y * tw + x) * 4 + 4);
      }
      await sharp(canvas, { raw: { width: SIZE, height: SIZE, channels: 4 } }).webp({ lossless: true }).toFile(path.join(out, `${NAMES[k]}.webp`));
    }
    console.log(`${theme}: ${seg.kept.length} zar [${seg.method}], ölçek ${scale.toFixed(4)}`);
  }
}

// Boyut raporu ve hazır tema listesi (public/zarlar/<tema>/ içinde yedi görsel olanlar).
const sizeOf = (id) => NAMES.reduce((n, k) => { const f = path.join(OUT, id, `${k}.webp`); return n + (fs.existsSync(f) ? fs.statSync(f).size : 0); }, 0);
const ready = themeIds.filter((id) => NAMES.every((k) => fs.existsSync(path.join(OUT, id, `${k}.webp`))));
let total = 0;
for (const id of ready) { const b = sizeOf(id); total += b; console.log(`  ${id}: ${(b / 1024).toFixed(0)} KB`); }
const perTheme = ready.length ? total / ready.length : 0;
console.log(`Hazır tema ${ready.length}/${themeIds.length}; toplam ${(total / 1048576).toFixed(2)} MB; tema başına ort. ${(perTheme / 1024).toFixed(0)} KB; ${themeIds.length} tema tahmini ${(perTheme * themeIds.length / 1048576).toFixed(1)} MB.`);
if (perTheme * themeIds.length > 25 * 1048576) console.log('UYARI: > 25 MB: tembel indirme önerilir (tema görselleri ilk seçimde indirilsin, ön yükleme yalnız seçili tema).');
if (!DRY && !INSPECT) {
  fs.writeFileSync(path.join(root, 'data/zar-mevcut.json'), JSON.stringify({ _aciklama: 'npm run zarlar yazar: public/zarlar/<tema>/ altında görseli üretilmiş temalar. Listede olmayan tema klasik görsellerle (ve kendi 3D renkleriyle) çizilir.', mevcut: ready }, null, 2) + '\n');
  console.log(`data/zar-mevcut.json güncellendi (${ready.length} tema).`);
}
if (failed) { console.error(`Ayrışmayan sayfa: ${bad.join(', ')}`); process.exit(DRY || INSPECT ? 0 : 1); }
