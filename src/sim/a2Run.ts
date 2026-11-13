/**
 * Kuyruk 41: Üst seviye (6–10) denge ölçümü. Veri `data/sim-a2.json` (partiler, seviyeler, senaryolar, Kolay listeleri);
 * Normal listeler `data/sim-senaryolar.json` `enemies.<seviye>`. Sonuçlar `harita/belgeler/DENGE.md`'ye elle yazılır.
 *   npm run sim:a2 -- 100 [--parti a2-klasik] [--seviye 7] [--zorluk kolay|normal] [--senaryo col,kale]
 */
import { loadTrExtra } from '../i18n';
import { loadClassData, loadMonsters } from '../data';
import a2 from '../../data/sim-a2.json';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
// Görev AS2: alt sınıf paketi (icerik/ ya da 12 kaydın fikstürü).
await (await import('./simIcerik')).loadSimContent();
const { SCENARIOS, measure, setPartyKind } = await import('./balance');

declare const process: { argv: string[] };
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const runs = Number(args.find((a) => /^\d+$/.test(a)) ?? 100);
const data = a2 as unknown as { seviyeler: number[]; partiler: string[]; senaryolar: string[]; kolay: Record<string, Record<string, Record<string, number>>> };
const parties = opt('--parti') ? [opt('--parti') as string] : data.partiler;
const levels = opt('--seviye') ? [Number(opt('--seviye'))] : data.seviyeler;
const diffs = opt('--zorluk') ? [opt('--zorluk') as string] : ['normal', 'kolay'];
const scen = opt('--senaryo') ? (opt('--senaryo') as string).split(',') : data.senaryolar;

const pct = (a: number, b: number) => `${Math.round((100 * a) / b)}%`;
console.log('| Parti | Seviye | Zorluk | ' + scen.join(' | ') + ' | Ortalama |');
console.log('|---|---|---|' + scen.map(() => '---').join('|') + '|---|');
for (const party of parties) {
  setPartyKind(party);
  for (const level of levels) for (const diff of diffs) {
    const cells: string[] = [];
    let wins = 0, total = 0;
    for (const id of scen) {
      const base = SCENARIOS.find((s) => s.id === id);
      if (!base) throw new Error(`senaryo yok: ${id}`);
      const list = diff === 'kolay' ? data.kolay[id]?.[String(level)] : base.byLevel?.[level];
      if (!list) throw new Error(`${id} ${level} ${diff}: liste yok`);
      const s = { ...base, byLevel: { ...base.byLevel, [level]: list } };
      const r = measure(s, runs, 1, level);
      cells.push(`${pct(r.partyWins, r.runs)}${r.timeouts ? ` (z${r.timeouts})` : ''}`);
      wins += r.partyWins; total += r.runs;
    }
    console.log(`| ${party} | ${level} | ${diff === 'kolay' ? 'Kolay' : 'Normal'} | ${cells.join(' | ')} | **${pct(wins, total)}** |`);
  }
}
