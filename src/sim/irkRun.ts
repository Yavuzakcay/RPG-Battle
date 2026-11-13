/**
 * Kuyruk K20: ırk karşılaştırması. Aynı parti (bütün üyeler aynı türde) aynı senaryolarda; tablo tür × seviye kazanma
 * oranı. Celestial ev kuralı açık (`celestialIrki`).
 *   npm run sim:irk -- 100 [--seviye 1,2,3,4,5,9] [--senaryo col,kale] [--irk celestial,human] [--soy high-elf] [--parti standart]
 */
import { loadTrExtra } from '../i18n';
import { loadClassData, loadMonsters, races } from '../data';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
// Görev AS2: alt sınıf paketi (icerik/ ya da 12 kaydın fikstürü).
await (await import('./simIcerik')).loadSimContent();
const { SCENARIOS, measure, setPartyKind, setPartyRace, setSimHouseRules } = await import('./balance');

declare const process: { argv: string[] };
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const runs = Number(args.find((a, i) => /^\d+$/.test(a) && !(args[i - 1] ?? '').startsWith('--')) ?? 100);
const levels = (opt('--seviye') ?? '1,2,3,4,5,9').split(',').map(Number);
const ids = (opt('--senaryo') ?? 'col,kale,magara').split(',');
const raceIds = opt('--irk')?.split(',') ?? races.map((r) => r.id);
if (opt('--parti')) setPartyKind(opt('--parti') as string);
setSimHouseRules({ celestialIrki: true });
const scen = ids.map((id) => { const s = SCENARIOS.find((x) => x.id === id); if (!s) throw new Error(`senaryo yok: ${id}`); return s; });
console.log(`| Tür | ${levels.map((l) => `Sv ${l}`).join(' | ')} | Ort. |`);
console.log(`|---|${levels.map(() => '---').join('|')}|---|`);
for (const r of raceIds) {
  setPartyRace(r, opt('--soy'));
  const row = levels.map((lv) => {
    let w = 0, n = 0;
    for (const s of scen) { const m = measure(s, runs, 1, lv); w += m.partyWins; n += m.runs; }
    return w / n;
  });
  const avg = row.reduce((a, b) => a + b, 0) / row.length;
  console.log(`| ${r} | ${row.map((x) => `${Math.round(x * 100)}%`).join(' | ')} | ${Math.round(avg * 100)}% |`);
}
