/**
 * Kuyruk 19 D3 / 19C: harita görsel indeksi. `harita/_ortak/harita-bolgeleri.json` ve `harita/<bolge>/<kimlik>.json`'dan:
 * - docs/VARLIK-HARITASI.md: bölge başına her harita (kimlik, ad, boyut, varyant), işlenmiş görsel (public/maps),
 *   kaynak görsel (harita/<bolge>/gorsel/<ad>.jpg), ham görsel (assets-ham/harita/<bolge>/), önizleme
 *   (harita/<bolge>/onizleme/), planlanan görseller ve sahneler;
 * - README'ler: harita/belgeler/README.md (klasör haritası), her bölgede harita/<bolge>/README.md ve
 *   public/maps/<bolge>/README.md ("üretilen çıktı, elle düzenlenmez").
 * Yalnızca okur ve bu dosyaları yazar; görsellere dokunmaz. Çalıştırma: `npm run varlik-indeks`.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const rel = (...p) => path.join(ROOT, ...p);
const { bolgeler, sahneler } = JSON.parse(fs.readFileSync(rel('harita/_ortak/harita-bolgeleri.json'), 'utf8'));
const NOT_REGION = new Set(['belgeler', '_ortak']);
const mapFiles = fs.readdirSync(rel('harita')).filter((d) => !NOT_REGION.has(d) && fs.statSync(rel('harita', d)).isDirectory())
  .flatMap((d) => fs.readdirSync(rel('harita', d)).filter((f) => f.endsWith('.json')).map((f) => ({ dir: d, file: rel('harita', d, f) })));
const maps = mapFiles.map(({ dir, file }) => ({ ...JSON.parse(fs.readFileSync(file, 'utf8')), _dir: dir }));
const misplaced = maps.filter((m) => m.bolge !== m._dir);
const kb = (f) => (fs.existsSync(f) ? `${Math.max(1, Math.round(fs.statSync(f).size / 1024))} kB` : null);
const first = (dir, name, exts) => exts.map((e) => path.join(dir, `${name}.${e}`)).find((f) => fs.existsSync(f)) ?? null;
const show = (f) => (f ? `\`${path.relative(ROOT, f).replace(/\\/g, '/')}\`` : '—');
/** Önizleme/prompt anahtarı (src/map/mapArt.ts previewKey ile aynı kural). */
const previewKey = (m, vid) => (new Set(m.variants.map((v) => v.image)).size <= 1 ? m.id : `${m.id}-${vid}`);
const artName = (image) => { const m = /^maps\/([^/]+)\/([^/]+)\.webp$/.exec(image); return m ? { bolge: m[1], name: m[2] } : null; };

/** Görsel adının üç kökteki durumu; `missing`: işlenmiş görsel yokken yazılacak metin. */
function status(bolge, name, key = null, missing = '**bulunamadı**') {
  const pub = rel('public/maps', bolge, `${name}.webp`);
  const ref = first(rel('harita', bolge, 'gorsel'), name, ['jpg', 'jpeg']);
  const ham = first(rel('assets-ham/harita', bolge), name, ['png', 'jpg', 'jpeg', 'webp']);
  const grid = key !== null && fs.existsSync(rel('harita', bolge, 'onizleme', `${key}-izgara.png`));
  const src = ham ? 'ham' : ref ? 'referans' : fs.existsSync(pub) ? 'yok (mevcut görsel elle/eski)' : 'yok';
  return { pub: fs.existsSync(pub) ? `${name}.webp (${kb(pub)})` : missing, ref, ham, grid, src };
}

const lines = [
  '# Varlık haritası (harita görselleri)',
  '',
  '`npm run varlik-indeks` üretir (Kuyruk 19 D3/19C; elle düzenlenmez). Bölgeler `harita/_ortak/harita-bolgeleri.json`, haritalar `harita/<bolge>/<kimlik>.json` (`bolge`, `gorsel`, varyant `image`). Klasör haritası `harita/belgeler/README.md`.',
  '',
  '**Ad kuralı:** küçük harf, rakam, tire, yalnızca ASCII; `<bolge>-<ad>`. Harita **kimliği** değişmez (kayıt ve replay kimlikle çalışır); görsel adı kayıttaki `gorsel` alanında. İlk varyant `maps/<gorsel>.webp`; ayrı görseli olan diğer varyantlar `maps/<gorsel>-<varyant>.webp`.',
  '',
  '**Kaynak ve çıktı:** `harita/<bolge>/gorsel/<ad>.jpg` (tam üstten çizilmiş kaynak; ortadan kırpılır) · `assets-ham/harita/<bolge>/<ad>.png|jpg|webp` (Gemini ham çıktısı; referanstan önce gelir) · `public/maps/<bolge>/<ad>.webp` (işlenmiş). İşlemek için: `npm run harita-gorsel -- <kimlik> [<kimlik> ...]` (kaynak yoksa mevcut görsel korunur, uyarı verilir; yer tutucu yalnızca görsel hiç yoksa ya da `--yer-tutucu` ile).',
  '',
  '| Bölge | Harita | Görsel | Planlanan |',
  '|---|---:|---:|---:|',
  ...bolgeler.map((b) => {
    const ms = maps.filter((m) => m.bolge === b.id);
    const imgs = new Set(ms.flatMap((m) => m.variants.map((v) => v.image)));
    return `| ${b.ad} (\`${b.id}\`) | ${ms.length} | ${imgs.size} | ${b.planlanan?.length ?? 0} |`;
  }),
  '',
];
const orphan = maps.filter((m) => !bolgeler.some((b) => b.id === m.bolge));
if (orphan.length) lines.push(`**Bölgesi tanımsız harita:** ${orphan.map((m) => `\`${m.id}\``).join(', ')}`, '');
if (misplaced.length) lines.push(`**Klasörü bölgesiyle eşleşmeyen harita (bulunamadı):** ${misplaced.map((m) => `\`harita/${m._dir}/${m.id}.json\` (bolge ${m.bolge})`).join(', ')}`, '');

for (const b of bolgeler) {
  lines.push(`## ${b.ad} (\`${b.id}\`)`, '', b.aciklama, '');
  const ms = maps.filter((m) => m.bolge === b.id).sort((x, y) => x.id.localeCompare(y.id));
  if (ms.length) {
    lines.push('| Kimlik | Ad | Boyut | Varyant | İşlenmiş (`public/maps/`) | Kaynak görsel | Ham | Önizleme | Kaynak |', '|---|---|---|---|---|---|---|---|---|');
    for (const m of ms) {
      const seen = new Set();
      for (const v of m.variants) {
        if (seen.has(v.image)) { lines.push(`| \`${m.id}\` | ${m.name} | ${m.size.cols}×${m.size.rows} | \`${v.id}\` | (aynı görsel) | | | | |`); continue; }
        seen.add(v.image);
        const a = artName(v.image);
        const s = a ? status(a.bolge, a.name, previewKey(m, v.id)) : { pub: `**bölgesiz yol** \`${v.image}\``, ref: null, ham: null, grid: false, src: '—' };
        lines.push(`| \`${m.id}\` | ${m.name} | ${m.size.cols}×${m.size.rows} | \`${v.id}\` | ${s.pub} | ${show(s.ref)} | ${show(s.ham)} | ${s.grid ? 'var' : '—'} | ${s.src} |`);
      }
    }
    lines.push('');
  }
  if (b.planlanan?.length) {
    lines.push('**Planlanan (kayıt yok):**', '', '| Ad | Kaynak referans | Ham | İşlenmiş |', '|---|---|---|---|');
    for (const n of b.planlanan) { const s = status(b.id, n, null, 'bekleniyor'); lines.push(`| \`${n}\` | ${show(s.ref)} | ${show(s.ham)} | ${s.pub} |`); }
    lines.push('');
  }
  const sc = sahneler.filter((x) => x.gorsel.startsWith(`${b.id}/`));
  if (sc.length) {
    lines.push('**Sahneler (harita değil):**', '', '| Ad | Görsel | Kaynak referans | İşlenmiş | Veri |', '|---|---|---|---|---|');
    for (const x of sc) { const [bb, n] = x.gorsel.split('/'); const s = status(bb, n, null, 'bekleniyor (yer tutucu degrade)'); lines.push(`| ${x.ad} | \`${n}\` | ${show(s.ref)} | ${s.pub} | ${x.kaynak} |`); }
    lines.push('');
  }
}
fs.writeFileSync(rel('docs/VARLIK-HARITASI.md'), lines.join('\n'));

// README'ler.
const names = (b) => [...new Set(maps.filter((m) => m.bolge === b.id).flatMap((m) => m.variants.map((v) => artName(v.image)?.name).filter(Boolean))), ...(b.planlanan ?? []), ...sahneler.filter((x) => x.gorsel.startsWith(`${b.id}/`)).map((x) => x.gorsel.split('/')[1])];
const write = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const head = '<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json\'u düzenleyin. -->\n';
// Kuyruk 19B: assets-ham/ depo dışına alınıyor; bu betik oraya yazmaz (ham klasör kuralı harita/belgeler/README.md'de).
for (const b of bolgeler) {
  const list = names(b).map((n) => `- \`${n}\``).join('\n') || '- (henüz yok)';
  const ms = maps.filter((m) => m.bolge === b.id).map((m) => `- \`${m.id}.json\`: ${m.name}`).join('\n') || '- (henüz yok)';
  write(rel('harita', b.id, 'README.md'), `${head}# ${b.ad} (\`${b.id}\`)

${b.aciklama}

| Yol | İçerik |
|---|---|
| \`<kimlik>.json\` | Harita verisi (kural, zemin, varyantlar; kimlik = dosya adı, \`bolge\` = bu klasör). |
| \`gorsel/<ad>.jpg\` | Kaynak görseller (tam üstten çizilmiş; \`npm run harita-gorsel -- <kimlik>\` ortadan kırpıp \`public/maps/${b.id}/<ad>.webp\` üretir). \`*-ornek.jpg\`: eski örnekler (işlem hattı kullanmaz). |
| \`onizleme/<kimlik>-izgara.png\`, \`-izgarasiz.png\` | Üretilen önizlemeler (\`npm run harita-referans\`). |
| \`prompt/<kimlik>.md\` | Gemini prompt'ları (\`npm run harita-referans\`). |
| \`duzeltme/<kimlik>.json\` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |

**Haritalar:**

${ms}

**Görsel adları** (kaynak \`gorsel/<ad>.jpg\`, ham \`assets-ham/harita/${b.id}/<ad>.png\`, çıktı \`public/maps/${b.id}/<ad>.webp\`):

${list}
`);
  write(rel('public/maps', b.id, 'README.md'), `${head}# ${b.ad} (\`${b.id}\`): üretilen görseller

**Elle düzenlenmez:** bu klasördeki \`.webp\` dosyaları \`harita/${b.id}/gorsel/<ad>.jpg\` (ya da \`assets-ham/harita/${b.id}/\`) kaynaklarından \`npm run harita-gorsel -- <kimlik>\` ile üretilir. Kaynak yoksa mevcut görsel korunur.

${list}
`);
}
// Klasör haritası (Kuyruk 19C).
write(rel('harita/belgeler/README.md'), `${head}# Harita klasörleri

Bir haritanın elle dokunulan her şeyi kendi bölge klasöründe: \`harita/<bolge>/\`. Tarayıcı yalnızca \`public/\`'ten okuduğu için üretilen görseller \`public/maps/<bolge>/\` altında.

| Yol | İçerik |
|---|---|
| \`harita/<bolge>/<kimlik>.json\` | Harita verisi (kimlik = dosya adı; klasör = kaydın \`bolge\` alanı, test denetler). Varyantlı haritalar tek JSON. |
| \`harita/<bolge>/gorsel/<bolge>-<ad>.jpg\` | Kaynak görseller (\`*-ornek.jpg\` eski örnekler). |
| \`harita/<bolge>/onizleme/<kimlik>-*.png\` | Üretilen önizlemeler (\`npm run harita-referans\`). |
| \`harita/<bolge>/prompt/<kimlik>.md\` | Gemini prompt'ları (\`npm run harita-referans\`). |
| \`harita/<bolge>/duzeltme/<kimlik>.json\` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |
| \`harita/<bolge>/README.md\` | Bölge özeti (\`npm run varlik-indeks\`). |
| \`harita/belgeler/\` | Denge (\`DENGE.md\`), görsel şartnamesi, görev ve tasarım belgeleri, \`terrain-ek.json\`, prototipler. |
| \`harita/_ortak/\` | Harita betiklerinin ortak verisi: \`harita-bolgeleri.json\`, \`harita-referans.json\`. |
| \`public/maps/<bolge>/<bolge>-<ad>.webp\` | **Üretilen** görseller (\`npm run harita-gorsel\`; elle düzenlenmez). |
| \`assets-ham/harita/<bolge>/\` | Ham Gemini çıktıları (depo dışı, \`.gitignore\`). |

**Ad kuralı:** küçük harf, rakam, tire, yalnızca ASCII; görsel adı \`<bolge>-<ad>\` (klasik 15×7 haritalar \`<bolge>-klasik\`), çok görselli haritada ilk varyant \`<gorsel>.webp\`, diğerleri \`<gorsel>-<varyant>.webp\`. Önizleme ve prompt adı kimlikten (ayrı görselli varyantta \`<kimlik>-<varyant>\`). \`harita/\` içinde yalnızca bu alt klasörler açılır.

Bölgeler: ${bolgeler.map((b) => `\`${b.id}\` (${b.ad})`).join(', ')}. Her haritanın durumu: \`docs/VARLIK-HARITASI.md\`.
`);
console.log(`docs/VARLIK-HARITASI.md: ${bolgeler.length} bölge, ${maps.length} harita; README'ler yazıldı.`);
