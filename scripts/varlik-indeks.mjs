/**
 * Kuyruk 19 D3: harita görsel indeksi. `data/harita-bolgeleri.json` ve `data/maps/*.json`'dan:
 * - docs/VARLIK-HARITASI.md: bölge başına her harita (kimlik, ad, boyut, varyant), işlenmiş görsel (public/maps),
 *   kaynak referans (docs/harita/referans/<bolge>/<ad>.jpg), ham görsel (assets-ham/harita/<bolge>/), ızgara referansı
 *   (harita-referans çıktısı), planlanan görseller ve sahneler;
 * - README'ler: docs/harita/README.md, data/maps/duzeltme/README.md, her bölgede docs/harita/referans/<bolge>/README.md; public/maps/<bolge>/README.md yalnızca henüz görseli olmayan bölgede.
 * Yalnızca okur ve bu dosyaları yazar; görsellere dokunmaz. Çalıştırma: `npm run varlik-indeks`.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const rel = (...p) => path.join(ROOT, ...p);
const { bolgeler, sahneler } = JSON.parse(fs.readFileSync(rel('data/harita-bolgeleri.json'), 'utf8'));
const maps = fs.readdirSync(rel('data/maps')).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(rel('data/maps', f), 'utf8')));
const kb = (f) => (fs.existsSync(f) ? `${Math.max(1, Math.round(fs.statSync(f).size / 1024))} kB` : null);
const first = (dir, name, exts) => exts.map((e) => path.join(dir, `${name}.${e}`)).find((f) => fs.existsSync(f)) ?? null;
const show = (f) => (f ? `\`${path.relative(ROOT, f).replace(/\\/g, '/')}\`` : '—');
/** Önizleme/prompt anahtarı (src/map/mapArt.ts previewKey ile aynı kural). */
const previewKey = (m, vid) => (new Set(m.variants.map((v) => v.image)).size <= 1 ? m.id : `${m.id}-${vid}`);
const artName = (image) => { const m = /^maps\/([^/]+)\/([^/]+)\.webp$/.exec(image); return m ? { bolge: m[1], name: m[2] } : null; };

/** Görsel adının üç kökteki durumu; `missing`: işlenmiş görsel yokken yazılacak metin. */
function status(bolge, name, key = null, missing = '**bulunamadı**') {
  const pub = rel('public/maps', bolge, `${name}.webp`);
  const ref = first(rel('docs/harita/referans', bolge), name, ['jpg', 'jpeg']);
  const ham = first(rel('assets-ham/harita', bolge), name, ['png', 'jpg', 'jpeg', 'webp']);
  const grid = key !== null && fs.existsSync(rel('docs/harita/onizleme', `${key}-izgara.png`));
  const src = ham ? 'ham' : ref ? 'referans' : fs.existsSync(pub) ? 'yok (mevcut görsel elle/eski)' : 'yok';
  return { pub: fs.existsSync(pub) ? `${name}.webp (${kb(pub)})` : missing, ref, ham, grid, src };
}

const lines = [
  '# Varlık haritası (harita görselleri)',
  '',
  '`npm run varlik-indeks` üretir (Kuyruk 19 D3; elle düzenlenmez). Bölgeler `data/harita-bolgeleri.json`, haritalar `data/maps/*.json` (`bolge`, `gorsel`, varyant `image`).',
  '',
  '**Ad kuralı:** küçük harf, rakam, tire, yalnızca ASCII; `<bolge>-<ad>`. Harita **kimliği** değişmez (kayıt ve replay kimlikle çalışır); görsel adı kayıttaki `gorsel` alanında. İlk varyant `maps/<gorsel>.webp`; ayrı görseli olan diğer varyantlar `maps/<gorsel>-<varyant>.webp`.',
  '',
  '**Üç kök:** `docs/harita/referans/<bolge>/<ad>.jpg` (tam üstten çizilmiş kaynak; ortadan kırpılır) · `assets-ham/harita/<bolge>/<ad>.png|jpg|webp` (Gemini ham çıktısı; referanstan önce gelir) · `public/maps/<bolge>/<ad>.webp` (işlenmiş). İşlemek için: `npm run harita-gorsel -- <kimlik> [<kimlik> ...]` (kaynak yoksa yer tutucu yazar: **mevcut görseli ezer**).',
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

for (const b of bolgeler) {
  lines.push(`## ${b.ad} (\`${b.id}\`)`, '', b.aciklama, '');
  const ms = maps.filter((m) => m.bolge === b.id).sort((x, y) => x.id.localeCompare(y.id));
  if (ms.length) {
    lines.push('| Kimlik | Ad | Boyut | Varyant | İşlenmiş (`public/maps/`) | Kaynak referans | Ham | Önizleme (`docs/harita/onizleme/`) | Kaynak |', '|---|---|---|---|---|---|---|---|---|');
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
const head = '<!-- npm run varlik-indeks üretir (Kuyruk 19 D3); elle düzenlemeyin, data/harita-bolgeleri.json\'u düzenleyin. -->\n';
// Kuyruk 19B: assets-ham/ depo dışına alınıyor; bu betik oraya yazmaz (ham klasör kuralı docs/harita/README.md'de).
for (const b of bolgeler) {
  const list = names(b).map((n) => `- \`${n}\``).join('\n') || '- (henüz yok)';
  write(rel('docs/harita/referans', b.id, 'README.md'), `${head}# ${b.ad} (\`${b.id}\`): kaynak referanslar\n\n${b.aciklama}\n\nTam üstten çizilmiş kaynak görseller \`<ad>.jpg\` olarak buraya (ızgaradan biraz yüksek olabilir; \`npm run harita-gorsel\` hedef orana ortadan kırpar). \`*-ornek.jpg\`: eski örnekler (işlem hattı kullanmaz). Izgara önizlemeleri \`docs/harita/onizleme/\`, Gemini prompt'ları \`docs/harita/prompt/\` (\`npm run harita-referans\`).\n\n${list}\n`);
  const pubDir = rel('public/maps', b.id);
  const hasArt = fs.existsSync(pubDir) && fs.readdirSync(pubDir).some((f) => f.endsWith('.webp'));
  if (!hasArt) write(path.join(pubDir, 'README.md'), `${head}# ${b.ad} (\`${b.id}\`): işlenmiş görseller\n\nHenüz görsel yok. \`npm run harita-gorsel\` buraya \`<ad>.webp\` yazar.\n\n${list}\n`);
}
// Kuyruk 19B M4: klasör haritası ve elle düzeltme klasörü.
write(rel('docs/harita/README.md'), `${head}# Harita klasörleri

| Yol | İçerik |
|---|---|
| \`data/maps/<kimlik>.json\` | Harita kayıtları (düz; bölge kayıttaki \`bolge\` alanında, görsel adı \`gorsel\`). Kimlik değişmez. |
| \`data/maps/duzeltme/<kimlik>.json\` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik boş). |
| \`docs/harita/referans/<bolge>/<bolge>-<ad>.jpg\` | Kaynak görseller (tam üstten çizilmiş; \`npm run harita-gorsel\` ortadan kırpar). \`*-ornek.jpg\` eski örnekler. |
| \`public/maps/<bolge>/<bolge>-<ad>.webp\` | İşlenmiş görseller (oyun bunları yükler). |
| \`docs/harita/onizleme/<kimlik>-*.png\` | Üretilen önizlemeler (\`npm run harita-referans\`: \`-izgara.png\`, \`-izgarasiz.png\`). |
| \`docs/harita/prompt/<kimlik>.md\` | Gemini prompt'ları (\`npm run harita-referans\`). |
| \`docs/harita/\` | Denge (\`DENGE.md\`), görsel şartnamesi, görev ve kural belgeleri, prototipler. |
| \`assets-ham/harita/<bolge>/\` | Ham Gemini çıktıları (depo dışı, `.gitignore`; beklenen adlar `docs/VARLIK-HARITASI.md`). |

**Ad kuralı:** küçük harf, rakam, tire, yalnızca ASCII; görsel adı \`<bolge>-<ad>\` (klasik 15×7 haritalar \`<bolge>-klasik\`), çok görselli haritada ilk varyant \`<gorsel>.webp\`, diğerleri \`<gorsel>-<varyant>.webp\`. Önizleme ve prompt adı kimlikten (ayrı görselli varyantta \`<kimlik>-<varyant>\`). Başka harita klasörü açılmaz.

Bölgeler (\`data/harita-bolgeleri.json\`): ${bolgeler.map((b) => `\`${b.id}\` (${b.ad})`).join(', ')}. Her haritanın durumu: \`docs/VARLIK-HARITASI.md\` (\`npm run varlik-indeks\`).
`);
write(rel('data/maps/duzeltme/README.md'), `${head}# Elle zemin düzeltmeleri

\`<kimlik>.json\`: haritanın zemin harflerine elle düzeltmeler (K20 aracı için; biçim o görevde belirlenecek). Şimdilik boş. Harita yükleyici yalnızca \`data/maps/*.json\`'u okur (alt klasöre bakmaz).
`);
console.log(`docs/VARLIK-HARITASI.md: ${bolgeler.length} bölge, ${maps.length} harita; README'ler yazıldı.`);
