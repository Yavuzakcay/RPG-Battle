/**
 * Kuyruk 19 D3 / 19C: harita görsel indeksi. `harita/_ortak/harita-bolgeleri.json` ve `harita/<bolge>/<ad>.json`'dan:
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
const maps = mapFiles.map(({ dir, file }) => ({ ...JSON.parse(fs.readFileSync(file, 'utf8')), _dir: dir, _file: path.relative(ROOT, file).replace(/\\/g, '/') }));
/** Kuyruk 19D: ad tabanı = ilk varyantın görsel adı (kaydın `gorsel` alanı; src/map/mapArt.ts mapFileBase). */
const baseOf = (m) => m.gorsel?.split('/')[1] ?? m.id;
const misplaced = maps.filter((m) => m.bolge !== m._dir);
const kb = (f) => (fs.existsSync(f) ? `${Math.max(1, Math.round(fs.statSync(f).size / 1024))} kB` : null);
const first = (dir, name, exts) => exts.map((e) => path.join(dir, `${name}.${e}`)).find((f) => fs.existsSync(f)) ?? null;
const show = (f) => (f ? `\`${path.relative(ROOT, f).replace(/\\/g, '/')}\`` : '—');
/** Önizleme/prompt anahtarı (src/map/mapArt.ts previewKey ile aynı kural). */
const previewKey = (m, vid) => (new Set(m.variants.map((v) => v.image)).size <= 1 ? baseOf(m) : `${baseOf(m)}-${vid}`);
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
  '`npm run varlik-indeks` üretir (Kuyruk 19 D3/19C; elle düzenlenmez). Bölgeler `harita/_ortak/harita-bolgeleri.json`, haritalar `harita/<bolge>/<ad>.json` (`bolge`, `gorsel`, varyant `image`). Klasör haritası `harita/belgeler/README.md`.',
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
    // Kuyruk 19D: harita başına tek satır.
    lines.push('| Kimlik | Ad | Bölge | JSON | Görsel (jpg) | Webp | Önizleme | Prompt | Durum |', '|---|---|---|---|---|---|---|---|---|');
    for (const m of ms) {
      const imgs = [...new Set(m.variants.map((v) => v.image))].map((im) => ({ im, a: artName(im), v: m.variants.find((x) => x.image === im) }));
      const st = imgs.map(({ a, v }) => (a ? status(a.bolge, a.name, previewKey(m, v.id)) : null));
      const count = (f) => { const n = st.filter((x) => x && f(x)).length; return n === st.length ? 'var' : n === 0 ? 'yok' : `${n}/${st.length}`; };
      const webpOk = st.every((x) => x && !x.pub.startsWith('**'));
      const key = previewKey(m, m.variants[0].id);
      const prompt = fs.existsSync(rel('harita', m.bolge, 'prompt', `${key}.md`));
      const nameOk = m._file === `harita/${m.bolge}/${baseOf(m)}.json`;
      const src = [...new Set(st.map((x) => x?.src ?? '—'))].join(', ');
      const durum = [!webpOk ? '**bulunamadı** (webp)' : 'tamam', `kaynak: ${src}`, imgs.length > 1 ? `${imgs.length} görsel / ${m.variants.length} varyant` : m.variants.length > 1 ? `${m.variants.length} varyant` : '', nameOk ? '' : '**ad uyuşmuyor**'].filter(Boolean).join('; ');
      lines.push(`| \`${m.id}\` | \`${baseOf(m)}\` | \`${m.bolge}\` | \`${m._file}\` | ${count((x) => x.ref)} | ${webpOk ? 'var' : 'yok'} | ${count((x) => x.grid)} | ${prompt ? 'var' : 'yok'} | ${durum} |`);
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
  const ms = maps.filter((m) => m.bolge === b.id).sort((x, y) => x.id.localeCompare(y.id));
  const table = ms.length ? ['| Kimlik | Ad (dosya tabanı) | Harita | Varyant |', '|---|---|---|---|', ...ms.map((m) => `| \`${m.id}\` | \`${baseOf(m)}\` | ${m.name} | ${m.variants.map((v) => `\`${v.id}\``).join(', ')} |`)].join('\n') : '- (henüz yok)';
  write(rel('harita', b.id, 'README.md'), `${head}# ${b.ad} (\`${b.id}\`)

${b.aciklama}

| Yol | İçerik |
|---|---|
| \`<ad>.json\` | Harita verisi (kural, zemin, varyantlar; dosya adı = ad tabanı, kimlik JSON'un \`id\` alanında; \`bolge\` = bu klasör). |
| \`gorsel/<ad>.jpg\` | Kaynak görseller (tam üstten çizilmiş; \`npm run harita-gorsel -- <kimlik>\` ortadan kırpıp \`public/maps/${b.id}/<ad>.webp\` üretir). \`*-ornek.jpg\`: eski örnekler (işlem hattı kullanmaz). |
| \`onizleme/<ad>-izgara.png\`, \`-izgarasiz.png\` | Üretilen önizlemeler (\`npm run harita-referans\`). |
| \`prompt/<ad>.md\` | Gemini prompt'ları (\`npm run harita-referans\`). |
| \`duzeltme/<ad>.json\` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |

**Haritalar (kimlik → ad):** bir haritanın bütün dosyaları ad tabanını taşır (\`<ad>.json\`, \`gorsel/<ad>.jpg\`, \`onizleme/<ad>-izgara.png\`, \`prompt/<ad>.md\`, \`duzeltme/<ad>.json\`); kimlik JSON'un \`id\` alanında kalır.

${table}

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
| \`harita/<bolge>/<ad>.json\` | Harita verisi (dosya adı = ad tabanı = ilk varyantın görsel adı; kimlik JSON'un \`id\` alanında; klasör = kaydın \`bolge\` alanı; test denetler). Varyantlı haritalar tek JSON. |
| \`harita/<bolge>/gorsel/<bolge>-<ad>.jpg\` | Kaynak görseller (\`*-ornek.jpg\` eski örnekler). |
| \`harita/<bolge>/onizleme/<ad>-*.png\` | Üretilen önizlemeler (\`npm run harita-referans\`). |
| \`harita/<bolge>/prompt/<ad>.md\` | Gemini prompt'ları (\`npm run harita-referans\`). |
| \`harita/<bolge>/duzeltme/<ad>.json\` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |
| \`harita/<bolge>/README.md\` | Bölge özeti (\`npm run varlik-indeks\`). |
| \`harita/belgeler/\` | Denge (\`DENGE.md\`), görsel şartnamesi, görev ve tasarım belgeleri, \`terrain-ek.json\`, prototipler. |
| \`harita/_ortak/\` | Harita betiklerinin ortak verisi: \`harita-bolgeleri.json\`, \`harita-referans.json\`. |
| \`public/maps/<bolge>/<bolge>-<ad>.webp\` | **Üretilen** görseller (\`npm run harita-gorsel\`; elle düzenlenmez). |
| \`assets-ham/harita/<bolge>/\` | Ham Gemini çıktıları (depo dışı, \`.gitignore\`). |

**Ad kuralı:** küçük harf, rakam, tire, yalnızca ASCII; görsel adı \`<bolge>-<ad>\` (klasik 15×7 haritalar \`<bolge>-klasik\`), çok görselli haritada ilk varyant \`<gorsel>.webp\`, diğerleri \`<gorsel>-<varyant>.webp\`. **Bir haritanın bütün dosyaları aynı \`<ad>\` tabanını taşır** (JSON, kaynak görsel, önizleme, prompt, düzeltme; ayrı görselli varyantta \`<ad>-<varyant>\`); kimlik yalnızca JSON'un \`id\` alanında. \`harita/\` içinde yalnızca bu alt klasörler açılır.

Bölgeler: ${bolgeler.map((b) => `\`${b.id}\` (${b.ad})`).join(', ')}. Her haritanın durumu: \`docs/VARLIK-HARITASI.md\`.
`);
console.log(`docs/VARLIK-HARITASI.md: ${bolgeler.length} bölge, ${maps.length} harita; README'ler yazıldı.`);
