/**
 * Kuyruk A5: eşya sınıflandırması. `data/items.json` + `data/items-srd.json` (SRD 5.2.1) eşyalarını üç sınıfa ayırır:
 * (a) savaş dışı (`offCombat`), (b) veriyle tanımlı (`passive`, `use`, `spells`, `bonus`, `onHit`, `attack`, `effects`),
 * (c) kalıba uymayan (`data/esya-siniflandirma.json` `karar`: karar bekliyor). Bir eşya (c) listesindeyse veriyle kısmen
 * tanımlı olsa da (c) sayılır (ör. yalnız +X olan özel silahlar). Çıktı: harita/belgeler/ESYA-SINIFLANDIRMA.md.
 * Çalıştırma: `node scripts/a5-esya-siniflandirma.mjs`.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const items = [...JSON.parse(readFileSync('data/items.json', 'utf8')), ...JSON.parse(readFileSync('data/items-srd.json', 'utf8'))];
const cls = JSON.parse(readFileSync('data/esya-siniflandirma.json', 'utf8'));

/** Eşyanın savaştaki veri alanları (görünen ad). */
export function mechanicFields(it) {
  const f = [];
  if (Object.keys(it.effects ?? {}).length) f.push('effects');
  for (const k of ['passive', 'use', 'spells', 'bonus', 'onHit', 'attack', 'paket']) if (it[k]) f.push(k);
  if (cls.kod?.[it.id]) f.push('kod');
  return f;
}
export function classify(it) {
  if (cls.gm[it.id]) return 'c';
  if (it.offCombat) return 'a';
  return mechanicFields(it).length || cls.kod?.[it.id] ? 'b' : 'c?';
}

const rows = items.map((it) => ({ it, k: classify(it), f: mechanicFields(it) }));
const count = (k) => rows.filter((r) => r.k === k).length;
const cell = (t) => String(t ?? '').replace(/\|/g, '\\|');
const lines = [
  '# Eşya sınıflandırması (Kuyruk A5)',
  '',
  '`node scripts/a5-esya-siniflandirma.mjs` üretir; elle düzenlenmez. Kaynak: `data/items.json` + `data/items-srd.json`, karar listesi `data/esya-siniflandirma.json`. Kararlar DECISIONS.md (Kuyruk A5).',
  '',
  '- **(a) savaş dışı:** eşyada `offCombat` (gerekçe metni; görevdeki `savasDisi: true` bu alan, ikinci bir alan açılmadı).',
  '- **(b) veriyle tanımlı:** savaşta etkisi mevcut şemayla veride (`kod`: bir sınıf özelliği eşyayı arar): `effects` (AC, save, yetenek), `passive` (süren etki alanları), `use` (iksir, fırlatma, sürme), `spells`/`charges` (yüklü büyü), `bonus` (+X), `onHit` (isabette ek zar), `attack`.',
  "- **(c) Game Master'a bırakılan:** mevcut ilkellerle tanımlanamayan; P7 kararıyla savaşta uygulanmaz (gerekçe ve gereken kanca yazılı).",
  '',
  '## Özet',
  '',
  '| Sınıf | Sayı |',
  '|---|---|',
  `| (a) savaş dışı | ${count('a')} |`,
  `| (b) veriyle tanımlı | ${count('b')} |`,
  `| (c) Game Master'a bırakılan (savaşta uygulanmaz) | ${count('c')} |`,
  `| sınıflanmamış (alan yok, karar yok) | ${count('c?')} |`,
  `| **Toplam** | ${rows.length} |`,
  '',
  `Uyum (attunement) gerektiren: ${items.filter((i) => i.attunement).length} (en çok 3 eşya; fazlası savaşa girmez: \`MAX_ATTUNED\`, \`src/rules/stats.ts\`). Sarf eşyası (\`use\`): ${items.filter((i) => i.use).length} (savaşta "Eşya" menüsü, \`use_item\`; yapay zekâ yarı canın altında iyileştirme iksiri içer). Yüklü büyülü: ${items.filter((i) => i.spells).length}.`,
  '',
  "## (c) Game Master'a bırakılanlar (P7)",
  '',
  '| Kimlik | Ad | Veride olan | Gereken |',
  '|---|---|---|---|',
  ...rows.filter((r) => r.k === 'c').map((r) => `| ${r.it.id} | ${cell(r.it.name)} | ${r.f.join(', ') || '—'} | ${cell(cls.gm[r.it.id])} |`),
  '',
  '## A5\'te tanımlananlar',
  '',
  '| Kimlik | Tanım |',
  '|---|---|',
  ...Object.entries(cls.a5).map(([id, t]) => `| ${id} | ${cell(t)} |`),
  '',
  '## (b) Veriyle tanımlı',
  '',
  '| Kimlik | Ad | Alanlar |',
  '|---|---|---|',
  ...rows.filter((r) => r.k === 'b').map((r) => `| ${r.it.id} | ${cell(r.it.name)} | ${r.f.join(', ')} |`),
  '',
  '## (a) Savaş dışı',
  '',
  '| Kimlik | Ad | Gerekçe |',
  '|---|---|---|',
  ...rows.filter((r) => r.k === 'a').map((r) => `| ${r.it.id} | ${cell(r.it.name)} | ${cell(r.it.offCombat)} |`),
  '',
];
if (count('c?')) lines.push('## Sınıflanmamış', '', ...rows.filter((r) => r.k === 'c?').map((r) => `- ${r.it.id}`), '');
writeFileSync('harita/belgeler/ESYA-SINIFLANDIRMA.md', lines.join('\n'));
console.log(`(a) ${count('a')} (b) ${count('b')} (c) ${count('c')} sınıflanmamış ${count('c?')} / ${rows.length}`);
