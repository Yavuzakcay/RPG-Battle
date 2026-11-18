// SRD 5.2.1'in 12 alt sınıfını yerel `icerik/ek-<sınıf>.json` paketlerine ekler (idempotent; yalnız yerel dosyalar, `icerik/` gitignore).
//   npx vite-node scripts/srd12-paket-ekle.ts [--kuru] [--klasor icerik] [--adlari-guncelle]
// --adlari-guncelle: paketteki SRD kayıtlarının adını tabloya (TR: AD_TR, EN: fikstür) eşitler (örn. Champion/Şampiyon → Gladiator/Gladyatör).
// Kaynak: src/rules/fixtures/srd-alt-siniflar.json (kimlikler aynı kalır, `srd` alanı çıkarılır). Türkçe ad: scripts/lib/srd12-paket.ts AD_TR
// (AS2-FARKLAR / AS2-ENVANTER kitapçık adları); tabloda olmayan kimlik uydurulmaz, listelenip atlanır. Değişiklikten önce icerik/_yedek-<tarih>/.
import fs from 'node:fs';
import path from 'node:path';
import fixture from '../src/rules/fixtures/srd-alt-siniflar.json';
import type { SubclassDef } from '../src/data';
import { AD_TR, ALT_AD, addIfMissing, toPackRecord } from './lib/srd12-paket';

const args = process.argv.slice(2);
const kuru = args.includes('--kuru');
const dir = path.resolve(args.includes('--klasor') ? args[args.indexOf('--klasor') + 1]! : 'icerik');
if (!fs.existsSync(dir)) { console.error(`Klasör yok: ${dir}`); process.exit(1); }
const files = fs.readdirSync(dir).filter((f) => /^ek-.+\.json$/.test(f));
const packs = new Map<string, { file: string; text: string; json: { subclasses: Array<{ id: string; class?: string }> } }>();
for (const f of files) { const text = fs.readFileSync(path.join(dir, f), 'utf8'); packs.set(f, { file: f, text, json: JSON.parse(text) }); }
const allIds = new Set([...packs.values()].flatMap((p) => p.json.subclasses.map((s) => s.id)));
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
const changed = new Set<string>(); const skipped: string[] = []; const unknownName: string[] = [];
for (const s of (fixture as unknown as { subclasses: SubclassDef[] }).subclasses) {
  const f = `ek-${s.class}.json`;
  const p = packs.get(f);
  if (!p) { skipped.push(`${s.class}/${s.id}: ${f} yok`); continue; }
  if (allIds.has(s.id)) { console.log(`= ${s.class}/${s.id}: pakette var`); continue; }
  const ad = AD_TR[s.id];
  if (!ad) { unknownName.push(`${s.class}/${s.id} (EN ${s.name.en})`); continue; }
  addIfMissing(p.json, toPackRecord(s, ad, ALT_AD[s.id]) as { id: string });
  allIds.add(s.id); changed.add(f);
  console.log(`+ ${s.class}/${s.id}: "${ad}" eklendi`);
}
if (unknownName.length) console.log(`\nAdı tabloda olmayan (atlandı, ad için sor): ${unknownName.join(', ')}`);
if (skipped.length) console.log(`\nAtlanan: ${skipped.join('; ')}`);
if (args.includes('--adlari-guncelle')) {
  for (const s of (fixture as unknown as { subclasses: SubclassDef[] }).subclasses) {
    const p = packs.get(`ek-${s.class}.json`); const rec = p?.json.subclasses.find((x) => x.id === s.id) as { name?: { tr: string; en: string } } | undefined;
    const ad = AD_TR[s.id];
    if (!p || !rec || !ad || (rec.name?.tr === ad && rec.name?.en === s.name.en)) continue;
    console.log(`~ ${s.class}/${s.id}: "${rec.name?.tr}" / "${rec.name?.en}" → "${ad}" / "${s.name.en}"`);
    rec.name = { tr: ad, en: s.name.en }; changed.add(`ek-${s.class}.json`);
  }
}
if (!changed.size) { console.log('\nDeğişiklik yok.'); process.exit(0); }
if (kuru) { console.log(`\n--kuru: ${changed.size} dosya değişecekti (${[...changed].join(', ')}).`); process.exit(0); }
const backup = path.join(dir, `_yedek-${stamp}`); fs.mkdirSync(backup, { recursive: true });
for (const f of changed) {
  const p = packs.get(f)!;
  fs.copyFileSync(path.join(dir, f), path.join(backup, f));
  const indent = /\n( +)"/.exec(p.text)?.[1]?.length ?? 1;
  fs.writeFileSync(path.join(dir, f), JSON.stringify(p.json, null, indent) + (p.text.endsWith('\n') ? '\n' : ''));
}
console.log(`\n${changed.size} dosya güncellendi; yedek: ${backup}`);
