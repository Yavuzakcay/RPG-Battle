/**
 * Kuyruk 19 D3: harita görsel indeksi. `data/harita-bolgeleri.json` ve `data/maps/*.json`'dan:
 * - docs/VARLIK-HARITASI.md: bölge başına her harita (kimlik, ad, boyut, varyant), işlenmiş görsel (public/maps),
 *   kaynak referans (docs/harita/referans/<bolge>/<ad>.jpg), ham görsel (assets-ham/harita/<bolge>/), ızgara referansı
 *   (harita-referans çıktısı), planlanan görseller ve sahneler;
 * - README'ler: assets-ham/harita/README.md ve her bölgede assets-ham/harita/<bolge>/README.md,
 *   docs/harita/referans/<bolge>/README.md; public/maps/<bolge>/README.md yalnızca henüz görseli olmayan bölgede.
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
const artName = (image) => { const m = /^maps\/([^/]+)\/([^/]+)\.webp$/.exec(image); return m ? { bolge: m[1], name: m[2] } : null; };

/** Görsel adının üç kökteki durumu. */
function status(bolge, name) {
  const pub = rel('public/maps', bolge, `${name}.webp`);
  const ref = first(rel('docs/harita/referans', bolge), name, ['jpg', 'jpeg']);
  const ham = first(rel('assets-ham/harita', bolge), name, ['png', 'jpg', 'jpeg', 'webp']);
  const grid = fs.existsSync(rel('docs/harita/referans', bolge, `${name}.png`));
  const src = ham ? 'ham' : ref ? 'referans' : fs.existsSync(pub) ? 'yok (mevcut görsel elle/eski)' : 'yok';
  return { pub: fs.existsSync(pub) ? `${name}.webp (${kb(pub)})` : '**yok**', ref, ham, grid, src };
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
    lines.push('| Kimlik | Ad | Boyut | Varyant | İşlenmiş (`public/maps/`) | Kaynak referans | Ham | Izgara ref. | Kaynak |', '|---|---|---|---|---|---|---|---|---|');
    for (const m of ms) {
      const seen = new Set();
      for (const v of m.variants) {
        if (seen.has(v.image)) { lines.push(`| \`${m.id}\` | ${m.name} | ${m.size.cols}×${m.size.rows} | \`${v.id}\` | (aynı görsel) | | | | |`); continue; }
        seen.add(v.image);
        const a = artName(v.image);
        const s = a ? status(a.bolge, a.name) : { pub: `**bölgesiz yol** \`${v.image}\``, ref: null, ham: null, grid: false, src: '—' };
        lines.push(`| \`${m.id}\` | ${m.name} | ${m.size.cols}×${m.size.rows} | \`${v.id}\` | ${s.pub} | ${show(s.ref)} | ${show(s.ham)} | ${s.grid ? 'var' : '—'} | ${s.src} |`);
      }
    }
    lines.push('');
  }
  if (b.planlanan?.length) {
    lines.push('**Planlanan (kayıt yok):**', '', '| Ad | Kaynak referans | Ham | İşlenmiş |', '|---|---|---|---|');
    for (const n of b.planlanan) { const s = status(b.id, n); lines.push(`| \`${n}\` | ${show(s.ref)} | ${show(s.ham)} | ${s.pub} |`); }
    lines.push('');
  }
  const sc = sahneler.filter((x) => x.gorsel.startsWith(`${b.id}/`));
  if (sc.length) {
    lines.push('**Sahneler (harita değil):**', '', '| Ad | Görsel | Kaynak referans | İşlenmiş | Veri |', '|---|---|---|---|---|');
    for (const x of sc) { const [bb, n] = x.gorsel.split('/'); const s = status(bb, n); lines.push(`| ${x.ad} | \`${n}\` | ${show(s.ref)} | ${s.pub} | ${x.kaynak} |`); }
    lines.push('');
  }
}
fs.writeFileSync(rel('docs/VARLIK-HARITASI.md'), lines.join('\n'));

// README'ler.
const names = (b) => [...new Set(maps.filter((m) => m.bolge === b.id).flatMap((m) => m.variants.map((v) => artName(v.image)?.name).filter(Boolean))), ...(b.planlanan ?? []), ...sahneler.filter((x) => x.gorsel.startsWith(`${b.id}/`)).map((x) => x.gorsel.split('/')[1])];
const write = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const head = '<!-- npm run varlik-indeks üretir (Kuyruk 19 D3); elle düzenlemeyin, data/harita-bolgeleri.json\'u düzenleyin. -->\n';
write(rel('assets-ham/harita/README.md'), `${head}# Harita ham görselleri

Gemini (ya da başka araç) çıktıları **bölge klasörüne**, görselin adıyla: \`assets-ham/harita/<bolge>/<bolge>-<ad>.png\` (ya da .jpg/.jpeg/.webp). Ad kuralı: küçük harf, tire, yalnızca ASCII. Ad haritanın kaydındaki \`gorsel\` alanıdır (kimlik değil); çok varyantlı haritada \`<gorsel>-<varyant>\`. Bütün adlar ve durumları: \`docs/VARLIK-HARITASI.md\`.

\`\`\`powershell
npm run harita-gorsel -- <kimlik> [<kimlik> ...]
\`\`\`

Boyut ve en-boy oranı denetlenir, görsel \`public/maps/<bolge>/<ad>.webp\` olarak WebP'ye çevrilir. Ham görsel yoksa \`docs/harita/referans/<bolge>/<ad>.jpg\` (tam üstten çizilmiş referans) ortadan kırpılarak kullanılır; ikisi de yoksa yer tutucu yazılır. Hedef boyutlar, hizalama ve prompt'lar: \`docs/harita/gorsel-sartnamesi.md\`.

Bölgeler: ${bolgeler.map((b) => `\`${b.id}\``).join(', ')}.
`);
for (const b of bolgeler) {
  const list = names(b).map((n) => `- \`${n}\``).join('\n') || '- (henüz yok)';
  write(rel('assets-ham/harita', b.id, 'README.md'), `${head}# ${b.ad} (\`${b.id}\`): ham görseller\n\n${b.aciklama}\n\nBeklenen adlar (uzantı .png/.jpg/.jpeg/.webp):\n\n${list}\n`);
  write(rel('docs/harita/referans', b.id, 'README.md'), `${head}# ${b.ad} (\`${b.id}\`): kaynak referanslar\n\n${b.aciklama}\n\nTam üstten çizilmiş kaynak görseller \`<ad>.jpg\` olarak buraya (ızgaradan biraz yüksek olabilir; \`npm run harita-gorsel\` hedef orana ortadan kırpar). \`<ad>.png\`, \`<ad>-izgarasiz.png\`, \`<ad>-prompt.md\`: \`npm run harita-referans\` çıktıları (geniş haritalar).\n\n${list}\n`);
  const pubDir = rel('public/maps', b.id);
  const hasArt = fs.existsSync(pubDir) && fs.readdirSync(pubDir).some((f) => f.endsWith('.webp'));
  if (!hasArt) write(path.join(pubDir, 'README.md'), `${head}# ${b.ad} (\`${b.id}\`): işlenmiş görseller\n\nHenüz görsel yok. \`npm run harita-gorsel\` buraya \`<ad>.webp\` yazar.\n\n${list}\n`);
}
console.log(`docs/VARLIK-HARITASI.md: ${bolgeler.length} bölge, ${maps.length} harita; README'ler yazıldı.`);
