/**
 * Görsel envanter + Dungeondex görsel eşlemesi (`npm run dd-gorsel`). Yalnız okuma: oyun koduna, veriye ve görsellere
 * dokunmaz; üç dosya yazar (elle düzenlenmez):
 * - data/dungeondex-gorsel-esleme.json: kategori → kimlik → { kaynak: efekt|jeton|ikon|yedek, ref, durum, efekt?, nadirlikRengi?, gorunum? }
 *   (Dungeondex vitrini ve #galeri okur; `yedekler` tablosu yedek glifleri, `ek` yüzey/nesne/alan/zar),
 * - harita/belgeler/GORSEL-ENVANTER.md: kategori başına var/genel/yedek sayıları, sorunlar, öneri,
 * - harita/belgeler/GORSEL-EKSIK.csv: kategori, kimlik, tür, ne eksik, önerilen dosya adı.
 * Kurallar `scripts/lib/gorsel-envanter.ts`; belge metni `scripts/lib/gorsel-belge.ts`. Test: `src/dungeondex/gorselEsleme.test.ts`.
 * Kullanım: `npm run dd-gorsel` (yalnız denetim, yazmadan: `npm run dd-gorsel -- --kuru`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadClassData, loadMonsters } from '../src/data';
import { loadLang } from '../src/i18n';
import { loadSimContent } from '../src/sim/simIcerik';

await Promise.all([loadMonsters(), loadClassData(), loadLang('tr')]);
const icerik = await loadSimContent();
const L = await import('./lib/gorsel-envanter');
const { belge } = await import('./lib/gorsel-belge');

const dex = await L.dexEntries();
const sp = L.spellRows();
const mo = await L.monsterRows();
const sub = L.subclassRows();
const ex = L.extraRows(sp.combat);
const cfg = JSON.parse(fs.readFileSync(path.join(L.ROOT, 'data/dungeondex.json'), 'utf8')) as { durumlar: Array<{ id: string; ad: string }> };
const cats: Record<string, L.GRow[]> = {
  buyu: sp.rows, esya: L.itemRows(), canavar: mo.rows, tur: L.speciesRows(), altsoy: L.lineageRows(),
  sinif: L.classRows(dex.sinif), altsinif: sub.rows, feat: L.featRows(), gecmis: L.backgroundRows(dex.gecmis),
  durum: L.conditionRows(cfg.durumlar.map((d) => d.id), Object.fromEntries(cfg.durumlar.map((d) => [d.id, d.ad]))),
};

// Denetim: Dungeondex'in her kaydı eşlemede, her ref çözülüyor.
const problems: string[] = [];
for (const [cat, list] of Object.entries(dex)) {
  const ids = new Set((cats[cat] ?? []).map((r) => r.id));
  for (const e of list) if (!ids.has(e.id)) problems.push(`${cat}/${e.id}: eşlemede yok`);
}
for (const list of [...Object.values(cats), ex.yuzey, ex.nesne, ex.alan, ex.zar]) for (const r of list) if (!L.resolves(r.ref)) problems.push(`${r.cat}/${r.id}: ref çözülmüyor (${r.ref})`);

const rec = (r: L.GRow) => ({ kaynak: r.kaynak, ref: r.ref, durum: r.durum, ad: r.ad, ...(r.not ? { not: r.not.length > 160 ? `${r.not.slice(0, 157)}…` : r.not } : {}), ...(r.efekt ? { efekt: r.efekt } : {}), ...(r.nadirlikRengi ? { nadirlikRengi: r.nadirlikRengi } : {}),
  ...(r.gorunum ? { gorunum: r.gorunum } : {}), ...(r.glif ? { glif: r.glif } : {}) });
const map = (list: L.GRow[]) => Object.fromEntries(list.map((r) => [r.id, rec(r)]));
const json = {
  _aciklama: 'npm run dd-gorsel üretir (scripts/dungeondex-gorsel-esleme.ts, kurallar scripts/lib/gorsel-envanter.ts); elle düzenlenmez. Kategori (Dungeondex kategorileri) → kimlik → { kaynak: efekt|jeton|ikon|yedek, ref: public/ yolu ya da yedek:<anahtar> (yedekler tablosu), ad, not?, durum: var (kayda özel) | genel (paylaşılan/aile görseli) | yedek (görsel yok, kategori glifi), efekt?: fxPlan FX kimliği ya da dongu:<durum şeridi>, nadirlikRengi?, gorunum?: jetonun alt soy/alt sınıf görünümü (sheetAvatar girdisi), glif? }. Büyüde görsel gerçek motorla dökülerek gözlenir (src/ui/fx/e2Verify.ts observeSpell). ek: yüzey, nesne, alan, zar (Dungeondex dışı). Belge harita/belgeler/GORSEL-ENVANTER.md.',
  nadirlikRenkleri: L.NADIRLIK_RENKLERI,
  yedekler: L.YEDEKLER,
  kategoriler: Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, map(v)])),
  ek: { yuzey: map(ex.yuzey), nesne: map(ex.nesne), alan: map(ex.alan), zar: map(ex.zar) },
};

/** Okunur ve küçük: kategori başına bir blok, kayıt başına tek satır. */
function serialize(j: typeof json): string {
  const S = JSON.stringify;
  const block = (o: Record<string, unknown>, ind: string) => `{\n${Object.entries(o).map(([k, v]) => `${ind}  ${S(k)}: ${S(v)}`).join(',\n')}\n${ind}}`;
  const group = (g: Record<string, Record<string, unknown>>) => `{\n${Object.entries(g).map(([k, v]) => `  ${S(k)}: ${block(v, '  ')}`).join(',\n')}\n }`;
  return `{\n "_aciklama": ${S(j._aciklama)},\n "nadirlikRenkleri": ${S(j.nadirlikRenkleri)},\n "yedekler": ${block(j.yedekler, ' ').replace(/\n {3}/g, '\n  ')},\n "kategoriler": ${group(j.kategoriler)},\n "ek": ${group(j.ek)}\n}\n`;
}

const csvCell =(s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
const csvRows = [...Object.values(cats).flat(), ...ex.yuzey, ...ex.nesne, ...ex.alan, ...ex.zar].filter((r) => r.eksik);
const csv = ['kategori,kimlik,tür,ne eksik,önerilen dosya adı', ...csvRows.map((r) => [r.cat, r.id, r.tur, r.eksik ?? '', r.oneri ?? ''].map(csvCell).join(','))].join('\n') + '\n';
const md = belge({ cats, ex, sp, mo: mo.info, sub, dex, icerik, csvCount: csvRows.length, problems });

const say = (l: L.GRow[]) => `${l.length} (var ${l.filter((r) => r.durum === 'var').length}, genel ${l.filter((r) => r.durum === 'genel').length}, yedek ${l.filter((r) => r.durum === 'yedek').length})`;
for (const [k, v] of Object.entries({ ...cats, ...ex })) if (Array.isArray(v)) console.log(`${k}: ${say(v)}`);
console.log(`CSV ${csvRows.length} satır; sorun ${problems.length}${problems.length ? `: ${problems.slice(0, 10).join('; ')}` : ''}`);
if (!process.argv.includes('--kuru')) {
  fs.writeFileSync(path.join(L.ROOT, 'data/dungeondex-gorsel-esleme.json'), serialize(json));
  fs.writeFileSync(path.join(L.ROOT, 'harita/belgeler/GORSEL-ENVANTER.md'), md);
  fs.writeFileSync(path.join(L.ROOT, 'harita/belgeler/GORSEL-EKSIK.csv'), csv);
}
if (problems.length) process.exitCode = 1;
