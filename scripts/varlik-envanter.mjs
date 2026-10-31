/**
 * Kuyruk 19 D0: varlık envanteri (yalnızca okur, hiçbir şeyi taşımaz/silmez). Depodaki (git ls-files) görsel, ses,
 * video ve veri dosyalarını listeler: yol, boyut, kim başvuruyor (kod, test, veri, betik, belge), kullanılıyor mu.
 * Başvuru: metin dosyalarında (ts/tsx/json/mjs/md…) dosyanın public/ altındaki yolu, adı ya da uzantısız adı geçiyor mu.
 * Addan türetilen yollar (jeton `characters/<ırk>-<cinsiyet>-<sınıf>.webp`, canavar `monsters/<id>.webp`, açılış
 * videosu, zar temaları…) `data/varlik-desenleri.json` kurallarıyla tanınır.
 * Çıktı: docs/VARLIK-ENVANTERI.md, docs/sabah/kullanilmayan-dosyalar.md.
 * Çalıştırma: `npm run varlik-envanter`.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const OUT = 'docs/VARLIK-ENVANTERI.md';
const OUT_UNUSED = 'docs/sabah/kullanilmayan-dosyalar.md';
const files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean).filter((f) => fs.existsSync(path.join(ROOT, f)));

const ASSET = /\.(webp|png|jpe?g|gif|svg|ico|mp3|ogg|wav|mp4|webm|pdf)$/i;
const TEXT = /\.(ts|tsx|js|mjs|cjs|json|md|html|css|txt|py|yml|yaml)$/i;
const isData = (f) => f.startsWith('data/') && f.endsWith('.json');
const assets = files.filter((f) => ASSET.test(f) || isData(f));
const corpusFiles = files.filter((f) => TEXT.test(f) && f !== OUT && f !== OUT_UNUSED && !f.startsWith('docs/sabah/kullanilmayan'));

/** Başvuran dosyanın türü. */
function kindOf(f) {
  if (/\.test\.|test-setup|\/fixtures\//.test(f)) return 'test';
  if (f.startsWith('src/') || f === 'index.html' || f === 'vite.config.ts') return 'kod';
  if (f.startsWith('data/')) return 'veri';
  if (f.startsWith('scripts/') || f === 'package.json') return 'betik';
  return 'belge';
}

// Dizin: metindeki her yol benzeri parça ve onun bütün "/" sonrası son ekleri → başvuran dosyalar.
const index = new Map();
const add = (tok, f) => { let s = index.get(tok); if (!s) index.set(tok, (s = new Set())); s.add(f); };
for (const f of corpusFiles) {
  const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of text.matchAll(/[A-Za-z0-9_.\/-]{3,}/g)) {
    const tok = m[0].replace(/^[./]+/, '');
    const parts = tok.split('/');
    for (let i = 0; i < parts.length; i++) add(parts.slice(i).join('/'), f);
  }
}

// Addan türetilen başvurular.
const rules = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/varlik-desenleri.json'), 'utf8')).kurallar;
const monsterIds = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/monsters.json'), 'utf8')).map?.((m) => m.id) ?? []);
const known = { monster: monsterIds };

function refsOf(f) {
  const base = path.basename(f);
  const stem = base.replace(/\.[^.]+$/, '');
  const pub = f.startsWith('public/') ? f.slice('public/'.length) : null;
  const keys = [f, base, ...(pub ? [pub] : [])];
  // Uzantısız ad yalnızca yeterince ayırt ediciyse (tire içeren ya da 6+ harf) sayılır.
  if (stem.includes('-') || stem.length >= 6) keys.push(stem);
  const by = new Set();
  for (const k of keys) for (const r of index.get(k) ?? []) if (r !== f) by.add(r);
  const dyn = [];
  for (const r of rules) {
    if (!f.startsWith(r.onEk)) continue;
    const rest = f.slice(r.onEk.length);
    if (r.desen && !new RegExp(r.desen).test(rest)) continue;
    if (r.kimlik) { const id = rest.replace(/\.[^.]+$/, '').replace(new RegExp(r.kimlikSil ?? '$^'), ''); if (!known[r.kimlik]?.has(id)) continue; }
    dyn.push(r);
  }
  return { by: [...by].sort(), dyn };
}

const size = (f) => fs.statSync(path.join(ROOT, f)).size;
const kb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} kB`);
const group = (f) => { const p = f.split('/'); return p.length > 2 ? `${p[0]}/${p[1]}` : p[0]; };

const rows = assets.map((f) => {
  const { by, dyn } = refsOf(f);
  const kinds = new Set([...by.map(kindOf), ...dyn.map((d) => d.tur)]);
  // Kullanılıyor: kod/veri/test/betik başvurusu ya da desen. docs/ ve assets-ham/ altındaki dosyada belge başvurusu da yeter.
  const live = new Set([...by.map(kindOf), ...dyn.filter((d) => d.kullanilir !== false).map((d) => d.tur)]);
  const used = ['kod', 'veri', 'test', 'betik'].some((k) => live.has(k)) || ((f.startsWith('docs/') || f.startsWith('assets-ham/') || f.startsWith('assets/')) && live.has('belge'));
  return { f, size: size(f), by, dyn, kinds: [...kinds].sort(), used };
});

const groups = new Map();
for (const r of rows) { const g = group(r.f); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(r); }
const total = rows.reduce((n, r) => n + r.size, 0);
const unused = rows.filter((r) => !r.used);
const show = (r) => {
  const list = [...r.dyn.map((d) => `${d.tur}: ${d.ad}`), ...r.by.slice(0, 3).map((b) => `${kindOf(b)}: \`${b}\``)];
  if (r.by.length > 3) list.push(`+${r.by.length - 3}`);
  return list.join('; ') || '—';
};

const lines = [
  '# Varlık envanteri',
  '',
  `\`npm run varlik-envanter\` üretir (Kuyruk 19 D0; elle düzenlenmez). Depodaki görsel, ses, video, PDF ve veri dosyaları: ${rows.length} dosya, ${kb(total)}. Kullanılmayanlar: \`${OUT_UNUSED}\`.`,
  '',
  'Başvuru türleri: **kod** (`src/`), **test**, **veri** (`data/`), **betik** (`scripts/`, `package.json`), **belge** (`docs/`, README). "Kullanılıyor": kod/veri/test/betik başvurusu ya da addan türetilen yol (`data/varlik-desenleri.json`); `docs/`, `assets/` ve `assets-ham/` altında belge başvurusu da sayılır. Metin araması sezgiseldir: aynı adı taşıyan başka bir dosya başvuruyu "görünür" yapabilir.',
  '',
  '## Özet',
  '',
  '| Klasör | Dosya | Boyut | Kullanılmayan | Kullanılmayan boyut |',
  '|---|---:|---:|---:|---:|',
  ...[...groups].sort((a, b) => a[0].localeCompare(b[0])).map(([g, list]) => {
    const u = list.filter((r) => !r.used);
    return `| \`${g}\` | ${list.length} | ${kb(list.reduce((n, r) => n + r.size, 0))} | ${u.length} | ${u.length ? kb(u.reduce((n, r) => n + r.size, 0)) : '—'} |`;
  }),
  '',
];
for (const [g, list] of [...groups].sort((a, b) => a[0].localeCompare(b[0]))) {
  lines.push(`## \`${g}\``, '', '| Dosya | Boyut | Başvuran | Durum |', '|---|---:|---|---|');
  for (const r of list.sort((a, b) => a.f.localeCompare(b.f))) lines.push(`| \`${r.f}\` | ${kb(r.size)} | ${show(r)} | ${r.used ? 'kullanılıyor' : '**kullanılmıyor**'} |`);
  lines.push('');
}
fs.writeFileSync(path.join(ROOT, OUT), lines.join('\n'));

const u = [
  '# Kullanılmayan dosyalar',
  '',
  `\`npm run varlik-envanter\` üretir (Kuyruk 19 D0). Hiçbir şey silinmedi. ${unused.length} dosya, ${kb(unused.reduce((n, r) => n + r.size, 0))}. "Yalnızca belge": yalnızca bir belgede anılıyor (kod/veri kullanmıyor).`,
  '',
  '| Dosya | Boyut | Not |',
  '|---|---:|---|',
  ...unused.sort((a, b) => b.size - a.size).map((r) => `| \`${r.f}\` | ${kb(r.size)} | ${r.dyn.length ? r.dyn.map((d) => d.ad).join('; ') : r.by.length ? `yalnızca belge: ${r.by.slice(0, 2).map((b) => `\`${b}\``).join(', ')}` : 'hiç başvuru yok'} |`),
  '',
];
fs.writeFileSync(path.join(ROOT, OUT_UNUSED), u.join('\n'));
console.log(`${rows.length} dosya (${kb(total)}), kullanılmayan ${unused.length} (${kb(unused.reduce((n, r) => n + r.size, 0))}) → ${OUT}, ${OUT_UNUSED}`);
