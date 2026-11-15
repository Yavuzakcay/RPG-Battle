// SD12: Alignment başlangıç karesi dağılımı → harita/belgeler/ALIGNMENT-BASLANGIC.md.
// Sınıf × geçmiş × alt sınıf (tablodaki 24 + "alt sınıf yok / katkısız") × ırk-soy kombinasyonları, çarpan başına 9 kareye dağılım ve
// True Neutral oranı. Çalıştırma: npx vite-node scripts/alignment-baslangic.ts
import fs from 'node:fs';
import { classes, races } from '../src/data';
import tablo from '../data/hizalanma-baslangic.json';
import { bucketOf, startContributions, startValue } from '../src/rules/alignment';

const T = tablo as unknown as { sinif: Record<string, unknown>; gecmis: Record<string, unknown>; altSinif: Record<string, unknown> };
const subclassTable = Object.keys(T.altSinif);
const bgs = Object.keys(T.gecmis);
const raceVariants: Array<{ raceId: string; lineageId?: string }> = [];
for (const r of races) { if (r.lineages && r.lineages.length) for (const l of r.lineages) raceVariants.push({ raceId: r.id, lineageId: l.id }); else raceVariants.push({ raceId: r.id }); }
// Alt sınıf kimliği → sınıf (tablodaki kimlikten sınıfı kimlik önekiyle bulamayız: sınıf başına liste elle)
const SUB_CLASS: Record<string, string> = {};
for (const id of subclassTable) {
  const prefix = id.split('-')[0];
  const map: Record<string, string> = { path: 'barbarian', college: 'bard', life: 'cleric', circle: 'druid', champion: 'fighter', warrior: 'monk', oath: 'paladin', hunter: 'ranger', thief: 'rogue', draconic: 'sorcerer', fiend: 'warlock', evoker: 'wizard' };
  SUB_CLASS[id] = map[prefix ?? ''] ?? '';
}
const names = (b: string, g: string) => `${b}|${g}`;
function run(carpan: number) {
  const count: Record<string, number> = {};
  let n = 0;
  for (const cl of classes) {
    const own = subclassTable.filter((id) => SUB_CLASS[id] === cl.id);
    const subs: Array<string | undefined> = [undefined, ...own];
    for (const bg of bgs) for (const sub of subs) for (const rv of raceVariants) {
      const v = startValue(startContributions({ classId: cl.id, backgroundId: bg, subclassId: sub, raceId: rv.raceId, lineageId: rv.lineageId }, true, carpan));
      const key = names(bucketOf(v.duzen), bucketOf(v.iyilik));
      count[key] = (count[key] ?? 0) + 1; n++;
    }
  }
  return { count, n };
}
const SQ: Array<[string, string, string]> = [['pos', 'pos', 'Lawful Good'], ['neu', 'pos', 'Neutral Good'], ['neg', 'pos', 'Chaotic Good'], ['pos', 'neu', 'Lawful Neutral'], ['neu', 'neu', 'True Neutral'], ['neg', 'neu', 'Chaotic Neutral'], ['pos', 'neg', 'Lawful Evil'], ['neu', 'neg', 'Neutral Evil'], ['neg', 'neg', 'Chaotic Evil']];
const L: string[] = ['# Alignment başlangıç karesi dağılımı (SD12)', '', 'Üretim: `npx vite-node scripts/alignment-baslangic.ts`. Kombinasyon = sınıf × geçmiş × alt sınıf (tablodaki 24 alt sınıf + alt sınıf yok) × ırk/soy. Alt sınıfı tabloda olmayan (dış paket) seçimler katkısızdır, "alt sınıf yok" satırıyla aynı sayılır. Kırpma ±50 ve etiket eşiği 17/2 aynı; tek ayar `data/hizalanma.json` `katkiCarpani`.', ''];
const mults = [1, 1.5, 1.8, 2, 2.5, 3, 4];
L.push('| Çarpan | ' + SQ.map((x) => x[2]).join(' | ') + ' | TN % |', '|---|' + SQ.map(() => '---:').join('|') + '|---:|');
const out: Record<number, ReturnType<typeof run>> = {};
for (const m of mults) {
  const r = run(m); out[m] = r;
  const pct = (a: string, b: string) => ((100 * (r.count[names(a, b)] ?? 0)) / r.n).toFixed(1);
  L.push(`| ×${m} | ${SQ.map((x) => pct(x[0], x[1])).join(' | ')} | **${pct('neu', 'neu')}** |`);
}
L.push('', `Kombinasyon sayısı (çarpandan bağımsız): ${out[1]?.n}.`, '');
fs.writeFileSync('harita/belgeler/ALIGNMENT-BASLANGIC.md', L.join('\n'));
console.log(L.join('\n'));
