// Zar görselleri: assets-ham/zarlar/zar-<tema>.jpg (macenta zeminde yan yana boş yüzlü zarlar, soldan sağa
// d4, d6, d8, d10, d12, d20, d100) → public/zarlar/<tema>/d4.webp … d100.webp (128×128, saydam).
// Çalıştırma: npm run zarlar [-- --kuru | --incele] [-- --yalniz tema1,tema2] [-- --sure 60] [-- --is 2] [-- --girdi klasör] [-- --cikti klasör]
// Her dosya ayrı işçide (scripts/lib/zar-isci.mjs) ve zaman aşımıyla (--sure sn, varsayılan 60) işlenir; ilerleme "[i/N] dosya başladı/bitti (ms)", takılan dosya ve adım raporlanır.
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
import { NAMES, templateFrom } from './lib/zar-kesim.mjs';
import { runJob, pool } from './lib/zar-havuz.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const argOpt = (n) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : null);
const RAW = argOpt('--girdi') ? path.resolve(argOpt('--girdi')) : path.join(root, 'assets-ham/zarlar');
const OUT = argOpt('--cikti') ? path.resolve(argOpt('--cikti')) : path.join(root, 'public/zarlar');
const DEFAULT_OUT = !argOpt('--cikti');
const DOCS = path.join(root, 'docs/zar-kesim');

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

const wanted = rawFiles.filter((f) => themeIds.includes(rawTheme(f)) && (!only || only.includes(rawTheme(f))));
const WORKER = path.join(root, 'scripts/lib/zar-isci.mjs');
const TIMEOUT = Number(argv.includes('--sure') ? argv[argv.indexOf('--sure') + 1] : 60) * 1000;
const JOBS = Number(argv.includes('--is') ? argv[argv.indexOf('--is') + 1] : 2);
const WRITE = !DRY && !INSPECT; // --kuru ve --incele görsel/veri yazmaz (--incele yalnız docs/zar-kesim yazar)
const WRITE_INSPECT = INSPECT && !DRY;

// Her dosya ayrı işçide, zaman aşımıyla; ilerleme "[i/N] dosya başladı/bitti (ms)", takılırsa son adım raporlanır.
// 1. geçiş: şablonsuz bölütleme (başarılılar hemen yazılır); başarılılardan oransal şablon; 2. geçiş: yalnız başarısızlar şablonla.
const results = new Map();
const N = wanted.length;
const stepText = (r) => r.steps.filter((x) => x.ms >= 50).map((x) => `${x.name} ${x.ms}`).join(', ');
async function runPass(files, extra, label) {
  await pool(files, JOBS, async (f) => {
    const theme = rawTheme(f); const i = wanted.indexOf(f) + 1;
    console.log(`[${i}/${N}] ${f} başladı${label}`);
    const job = { file: path.join(RAW, f), theme, kutu: kesim.kutular?.[theme], erodeMax: kesim.erozyonMax, write: WRITE, outDir: OUT, inspect: WRITE_INSPECT && (extra.inspectAll || (kesim.incele ?? []).includes(theme)), inspectDir: DOCS, ...extra.job };
    const r = await runJob(WORKER, job, { timeoutMs: TIMEOUT });
    if (r.ok) {
      results.set(theme, r.result);
      console.log(`[${i}/${N}] ${f} bitti (${r.ms} ms): ${r.result.ok ? `${r.result.count} zar [${r.result.method}]` : `AYRIŞMADI (${r.result.note})`}  {${stepText(r)}}`);
    } else {
      results.set(theme, { theme, ok: false, method: 'hata', count: 0, kept: [], note: `${r.error}; son adım: ${r.lastStep}`, timedOut: !!r.timedOut });
      console.error(`[${i}/${N}] ${f} ${r.timedOut ? 'ZAMAN AŞIMI' : 'HATA'} (${r.ms} ms): ${r.error}; takılan adım: ${r.lastStep} {${stepText(r)}}`);
    }
  });
}
await runPass(wanted, { job: { sablonYok: true } }, '');
const goods = [...results.values()].filter((r) => r.ok && (r.method === 'temel' || r.method === 'gevsek'));
const sablon = kesim.sablon ?? (goods.length >= 3 ? templateFrom(goods) : null);
const retry = wanted.filter((f) => { const r = results.get(rawTheme(f)); return r && !r.ok && !r.timedOut && r.method !== 'hata'; });
if (retry.length) { console.log(`\nŞablonlu ikinci geçiş: ${retry.length} dosya`); await runPass(retry, { job: { sablon: sablon ?? undefined, sablonYok: false }, inspectAll: true }, ' (şablon)'); }
const bad = [...results].filter(([, r]) => !r.ok).map(([t]) => t);

// Tablo: tema, durum, kaç zar üretildi
console.log('\n| tema | durum | yöntem | zar | yazılan | not |\n|---|---|---|---|---|---|');
for (const f of wanted) { const t = rawTheme(f); const r = results.get(t); console.log(`| ${t} | ${r.ok ? 'tamam' : (r.timedOut ? 'ZAMAN AŞIMI' : 'HATALI')} | ${r.method} | ${r.count}/7 | ${r.wrote ?? 0} | ${r.ok ? '' : r.note} |`); }

if (WRITE_INSPECT) {
  const list = [...new Set([...(kesim.incele ?? []), ...bad])].filter((t) => results.has(t));
  const lines = ['# Zar sayfası kesim incelemesi (`npm run zarlar -- --incele`)', '', '| tema | yöntem | zar | durum |', '|---|---|---|---|'];
  for (const t of list) {
    const r = results.get(t);
    const st = !r.ok ? 'yeniden üretilmeli' : r.method === 'sablon' ? 'kurtarıldı (oransal şablon: gözle doğrula)' : r.method === 'kutu' ? 'kurtarıldı (elle kutu)' : 'kurtarıldı';
    lines.push(`| ${t} | ${r.method} | ${r.count} | ${st} |`);
  }
  for (const t of (kesim.incele ?? []).filter((x) => !results.has(x))) lines.push(`| ${t} | – | – | ham dosya yok |`);
  lines.push('', `Yeniden üretilmeli: ${bad.length ? bad.join(', ') : 'yok'}`);
  fs.mkdirSync(DOCS, { recursive: true });
  fs.writeFileSync(path.join(DOCS, 'RAPOR.md'), lines.join('\n') + '\n');
  console.log(`İnceleme: docs/zar-kesim/ (${list.length} sayfa); yeniden üretilmeli: ${bad.length ? bad.join(', ') : 'yok'}`);
}
const failed = bad.length > 0;

// Boyut raporu ve hazır tema listesi (public/zarlar/<tema>/ içinde yedi görsel olanlar).
const sizeOf = (id) => NAMES.reduce((n, k) => { const f = path.join(OUT, id, `${k}.webp`); return n + (fs.existsSync(f) ? fs.statSync(f).size : 0); }, 0);
const ready = themeIds.filter((id) => NAMES.every((k) => fs.existsSync(path.join(OUT, id, `${k}.webp`))));
let total = 0;
for (const id of ready) { const b = sizeOf(id); total += b; console.log(`  ${id}: ${(b / 1024).toFixed(0)} KB`); }
const perTheme = ready.length ? total / ready.length : 0;
console.log(`Hazır tema ${ready.length}/${themeIds.length}; toplam ${(total / 1048576).toFixed(2)} MB; tema başına ort. ${(perTheme / 1024).toFixed(0)} KB; ${themeIds.length} tema tahmini ${(perTheme * themeIds.length / 1048576).toFixed(1)} MB.`);
if (perTheme * themeIds.length > 25 * 1048576) console.log('UYARI: > 25 MB: tembel indirme önerilir (tema görselleri ilk seçimde indirilsin, ön yükleme yalnız seçili tema).');
if (!DRY && !INSPECT && DEFAULT_OUT) {
  fs.writeFileSync(path.join(root, 'data/zar-mevcut.json'), JSON.stringify({ _aciklama: 'npm run zarlar yazar: public/zarlar/<tema>/ altında görseli üretilmiş temalar. Listede olmayan tema klasik görsellerle (ve kendi 3D renkleriyle) çizilir.', mevcut: ready }, null, 2) + '\n');
  console.log(`data/zar-mevcut.json güncellendi (${ready.length} tema).`);
}
if (failed) { console.error(`Ayrışmayan sayfa: ${bad.join(', ')}`); process.exit(DRY || INSPECT ? 0 : 1); }
