/**
 * Kuyruk A4: kısmi büyü denetimi. Büyü verisinden (0–9) savaşta kullanılan büyülerin kısmi kalanlarını listeler:
 * `approx` (yaklaşıklık) ya da yalnızca Game Master notu (`gmNote`) olanlar kısmidir; `kapsamDisi` eksik parçanın savaş
 * modelinin dışında kaldığını söyler (çalışır sayılır). Kural sürümü 32+ hâli (`a4` alanları) ve Kuyruk A6'nın 35+ hâli (`a6`; sonra A7 36, A8 37, S1 40)
 * uygulanmış mekanikle sayar; `sigmayan` SRD'nin oyuna sığmayan parçası (tamam, sığmayan parça notlu; BUYU-SIGMAYAN.md).
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
const a4Kapsam = [];
for (const s of all) {
  const m = s.mechanics ?? {};
  if (m.offCombat || s.offCombat) continue;
  combat += 1;
  const merged = { ...m, ...(m.a4 ?? {}), ...(m.a6 ?? {}), ...(m.a7 ?? {}), ...(m.a8 ?? {}), ...(m.s1 ?? {}), ...(m.s2 ?? {}), ...(m.g6 ?? {}), ...(m.k61 ?? {}), ...(m.k62 ?? {}), ...(m.k63 ?? {}), ...(m.k64 ?? {}) };
  // Kuyruk K64b: sonraki sürümlü bloklar da (K64a'nın `k64` bloğu PfEG kapsam dışı notunu kaldırır).
  const k64 = !!m.k64;
  const later = !!(m.a6 || m.a7 || m.a8 || m.s1 || m.s2);
  const wasPartial = !!(m.approx || m.gmNote || m.kapsamDisi || later);
  // Sürüm 35'te savaş dışına alınan (Plane Shift) ya da sığmayan parçası notlu büyü kısmi sayılmaz.
  const isPartial = !!(merged.approx || (merged.gmNote && !merged.kapsamDisi && !merged.offCombat && !merged.sigmayan && !merged.gmNoted));
  if (wasPartial) before += 1;
  if (isPartial) after += 1;
  // Kuyruk K57: yalnız tamamlama bloğu (a4/a6/a7/a8) olmadan, temel veride kapsam dışı notuyla çalışır sayılan. Eskiden
  // `a4` bloğundan gelen kapsam dışı notlu 3 büyü (hex, fear, beacon-of-hope) burada da sayılıyordu (A4 tamamlananlarla çift sayım).
  if (merged.kapsamDisi && !isPartial && !later && !m.a4) kapsam += 1;
  if (merged.kapsamDisi && !isPartial && !later && m.a4) a4Kapsam.push(s.id);
  if (wasPartial) rows.push({ id: s.id, level: s.level, file: s.file, eksik: merged.approx || (merged.kapsamDisi || merged.sigmayan || merged.gmNoted ? '' : merged.gmNote) || '', kapsam: merged.kapsamDisi ?? '', sigmayan: merged.sigmayan ?? '', gm: merged.gmNoted ? merged.gmNote ?? '' : '', a4: !!m.a4, a6: !!m.a6, a7: !!m.a7, a8: !!m.a8, s1: !!m.s1, s2: !!m.s2, k64, partial: isPartial });
}
rows.sort((a, b) => Number(b.partial) - Number(a.partial) || a.level - b.level || a.id.localeCompare(b.id));
const groups = new Map();
for (const r of rows.filter((x) => x.partial)) { const g = groupOf(r.eksik); groups.set(g, [...(groups.get(g) ?? []), r.id]); }
const cell = (t) => t.replace(/\|/g, '\\|');
const lines = [
  '# Kısmi büyüler (Kuyruk A4, A6, A7, A8, S1, S2)',
  '',
  '`node scripts/a4-buyu-kismi.mjs` üretir; elle düzenlenmez. Savaşta kullanılan (savaş dışı olmayan) büyülerden yaklaşıklığı (`approx`) ya da yalnızca Game Master notu kalanlar "kısmi"dir. `kapsamDisi`: eksik parça savaş modelinin dışında (sosyal, düzlem, nesne, saatlik süre); gerekçeler DECISIONS.md (Kuyruk A4, A6). Sayım kural sürümü 32+ (`a4`) ve 35+ (`a6`) mekaniğiyle; `sigmayan`: SRD metninin oyuna sığmayan parçası (kart ve günlükte Game Master notu, satırı harita/belgeler/BUYU-SIGMAYAN.md).',
  '',
  '## Özet',
  '',
  '| | Sayı |',
  '|---|---|',
  `| Savaşta kullanılan büyü | ${combat} |`,
  `| A4 öncesi kısmi | ${before} |`,
  `| A4 sonrası kısmi | ${after} |`,
  `| Tamamlanan (sürüm 32, \`a4\`) | ${rows.filter((r) => r.a4 && !r.a6 && !r.partial).length} |`,
  `| Tamamlanan (sürüm 35, \`a6\`; tam) | ${rows.filter((r) => r.a6 && !r.partial && !r.sigmayan).length} |`,
  `| Tamamlanan (sürüm 35, \`a6\`; sığmayan parça notlu) | ${rows.filter((r) => r.a6 && !r.partial && r.sigmayan).length} |`,
  ...[['a7', 36], ['a8', 37], ['s1', 40], ['s2', 41]].flatMap(([k, v]) => [
    `| Tamamlanan (sürüm ${v}, \`${k}\`; tam) | ${rows.filter((r) => r[k] && !r.partial && !r.sigmayan && !r.gm).length} |`,
    `| Tamamlanan (sürüm ${v}, \`${k}\`; Game Master notlu) | ${rows.filter((r) => r[k] && !r.partial && r.gm).length} |`,
    `| Tamamlanan (sürüm ${v}, \`${k}\`; sığmayan parça notlu) | ${rows.filter((r) => r[k] && !r.partial && r.sigmayan).length} |`]),
  `| Kapsam dışı olarak çalışır sayılan (tamamlama bloğu olmadan) | ${kapsam} |`,
  `| A4 tamamlananlardan kapsam dışı notlu (yukarıdaki A4 sayısının içinde) | ${a4Kapsam.length}${a4Kapsam.length ? ` (${a4Kapsam.join(', ')})` : ''} |`,
  '',
  '## Kalan kısmiler: altyapıya göre',
  '',
  '| Altyapı | Sayı | Büyüler |',
  '|---|---|---|',
  ...[...groups.entries()].sort((a, b) => b[1].length - a[1].length).map(([g, ids]) => `| ${g} | ${ids.length} | ${ids.join(', ')} |`),
  '',
  '## Liste',
  '',
  '| Kimlik | Sv | Dosya | Durum | Eksik | Kapsam dışı | Sığmayan parça (BUYU-SIGMAYAN.md) |',
  '|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.id} | ${r.level} | ${r.file} | ${r.partial ? 'kısmi' : r.k64 || r.s2 || r.s1 || r.a8 || r.a7 || r.a6 ? `tamam (${r.k64 ? 'K64a' : r.s2 ? 'S2' : r.s1 ? 'S1' : r.a8 ? 'A8' : r.a7 ? 'A7' : 'A6'}${r.sigmayan ? ', sığmayan parça notlu' : r.gm ? ', Game Master notlu' : ''})` : r.a4 ? 'tamam (A4)' : 'çalışır (kapsam dışı)'} | ${cell(r.eksik)} | ${cell(r.kapsam)} | ${cell(r.sigmayan)} |`),
  '',
];
writeFileSync('harita/belgeler/BUYU-KISMI.md', lines.join('\n'));
const a6full = rows.filter((r) => r.a6 && !r.partial && !r.sigmayan).length;
const a6note = rows.filter((r) => r.a6 && !r.partial && r.sigmayan).length;
const stat = (k) => `${k.toUpperCase()} tam ${rows.filter((r) => r[k] && !r.partial && !r.sigmayan && !r.gm).length}, GM notlu ${rows.filter((r) => r[k] && !r.partial && r.gm).length}, sığmayan notlu ${rows.filter((r) => r[k] && !r.partial && r.sigmayan).length}`;
console.log(`savaşta ${combat}; kısmi önce ${before}, sonra ${after}; kapsam dışı ${kapsam}; A6 tam ${a6full}, A6 sığmayan notlu ${a6note}; ${stat('a7')}; ${stat('a8')}; ${stat('s1')}; ${stat('s2')}`);
