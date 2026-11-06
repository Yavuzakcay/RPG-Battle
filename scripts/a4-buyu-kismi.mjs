/**
 * Kuyruk A4: kısmi büyü denetimi. Büyü verisinden (0–9) savaşta kullanılan büyülerin kısmi kalanlarını listeler:
 * `approx` (yaklaşıklık) ya da yalnızca Game Master notu (`gmNote`) olanlar kısmidir; `kapsamDisi` eksik parçanın savaş
 * modelinin dışında kaldığını söyler (çalışır sayılır). Kural sürümü 32+ hâli (`a4` alanları) uygulanmış mekanikle sayar.
 * Çıktı: harita/belgeler/BUYU-KISMI.md. Çalıştırma: `node scripts/a4-buyu-kismi.mjs`.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FILES = ['data/spells.json', 'data/spells-45.json', 'data/spells-69.json'];
const all = FILES.flatMap((f) => JSON.parse(readFileSync(f, 'utf8')).map((s) => ({ ...s, file: f.replace('data/', '') })));

/** Eksik parçanın bağlı olduğu altyapı (anahtar sözcük → grup). İlk eşleşen kazanır. */
const GROUPS = [
  ['yükseklik/irtifa (uçuş katmanı yok)', /Yükseklik|silindir|yükselme|tırmanma hızı|irtifa|atlama/i],
  ['nesne ve el modeli (eşya bırakma, nesneye yapma)', /nesne|silah(ı)? bırak|elindekini|el boşluğu|Kılıç el|metal taşıyor|dokunulan dost|kendi silah/i],
  ['alan geometrisi ve taşıma (serbest çizim, rüzgârla dağılma)', /küp yerine|küre yerine|Duvar düz|rüzgâr|Taşıma|tek ışık|dört ışık|bitişik altıgen|bölge çıkarma|tek küre/i],
  ['yanılsama ve algı (biçim, Study, yerini bilme)', /Yanılsama|yerini her zaman|Blindsight|Truesight|gizlenmiş/i],
  ['eylem ekonomisi (ek eylem, gecikme, uyandırma)', /Ek eylem|gecikme|uyandır|Sarsarak|bonus eylemle Dash|Kurtulma eylemle|tur başı hasardan sonra/i],
  ['çağırma ve sürü', /Sürü|Fey ruhu|kurulumda|ayrı yaratık/i],
  ['buyruk/öneri metni', /Öneri|Drop|kayıtsızlık|dur/i],
];
const groupOf = (txt) => (GROUPS.find(([, re]) => re.test(txt)) ?? ['tekil (büyüye özgü)'])[0];

const rows = [];
let before = 0; let after = 0; let kapsam = 0; let combat = 0;
for (const s of all) {
  const m = s.mechanics ?? {};
  if (m.offCombat || s.offCombat) continue;
  combat += 1;
  const merged = m.a4 ? { ...m, ...m.a4 } : m;
  const wasPartial = !!(m.approx || m.gmNote || m.kapsamDisi);
  const isPartial = !!(merged.approx || (merged.gmNote && !merged.kapsamDisi));
  if (wasPartial) before += 1;
  if (isPartial) after += 1;
  if (merged.kapsamDisi && !isPartial) kapsam += 1;
  if (wasPartial) rows.push({ id: s.id, level: s.level, file: s.file, eksik: merged.approx || (merged.kapsamDisi ? '' : merged.gmNote) || '', kapsam: merged.kapsamDisi ?? '', a4: !!m.a4, partial: isPartial });
}
rows.sort((a, b) => Number(b.partial) - Number(a.partial) || a.level - b.level || a.id.localeCompare(b.id));
const groups = new Map();
for (const r of rows.filter((x) => x.partial)) { const g = groupOf(r.eksik); groups.set(g, [...(groups.get(g) ?? []), r.id]); }
const cell = (t) => t.replace(/\|/g, '\\|');
const lines = [
  '# Kısmi büyüler (Kuyruk A4)',
  '',
  '`node scripts/a4-buyu-kismi.mjs` üretir; elle düzenlenmez. Savaşta kullanılan (savaş dışı olmayan) büyülerden yaklaşıklığı (`approx`) ya da yalnızca Game Master notu kalanlar "kısmi"dir. `kapsamDisi`: eksik parça savaş modelinin dışında (sosyal, düzlem, nesne, saatlik süre); gerekçeler DECISIONS.md (Kuyruk A4). Sayım kural sürümü 32+ mekaniğiyle (`a4`).',
  '',
  '## Özet',
  '',
  '| | Sayı |',
  '|---|---|',
  `| Savaşta kullanılan büyü | ${combat} |`,
  `| A4 öncesi kısmi | ${before} |`,
  `| A4 sonrası kısmi | ${after} |`,
  `| Tamamlanan (sürüm 32, \`a4\`) | ${rows.filter((r) => r.a4 && !r.partial).length} |`,
  `| Kapsam dışı olarak çalışır sayılan | ${kapsam} |`,
  '',
  '## Kalan kısmiler: altyapıya göre',
  '',
  '| Altyapı | Sayı | Büyüler |',
  '|---|---|---|',
  ...[...groups.entries()].sort((a, b) => b[1].length - a[1].length).map(([g, ids]) => `| ${g} | ${ids.length} | ${ids.join(', ')} |`),
  '',
  '## Liste',
  '',
  '| Kimlik | Sv | Dosya | Durum | Eksik | Kapsam dışı |',
  '|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.id} | ${r.level} | ${r.file} | ${r.partial ? 'kısmi' : r.a4 ? 'tamam (A4)' : 'çalışır (kapsam dışı)'} | ${cell(r.eksik)} | ${cell(r.kapsam)} |`),
  '',
];
writeFileSync('harita/belgeler/BUYU-KISMI.md', lines.join('\n'));
console.log(`savaşta ${combat}; kısmi önce ${before}, sonra ${after}; kapsam dışı ${kapsam}`);
