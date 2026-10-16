/**
 * Denge raporu: `npm run sim -- [savaş sayısı] [senaryo kimliği...]`.
 * Her senaryo aynı tohumlarla (1..N) oynanır; sonuç tekrarlanabilir.
 */
import { SCENARIOS, measure, scenarioXp } from './balance';
import { loadMonsters } from '../data';

// Canavar verisi tembel yüklenir.
await loadMonsters();

declare const process: { argv: string[] };

const args = process.argv.slice(2);
const runs = Number(args[0] ?? 200) || 200;
const only = args.slice(1);
const pct = (x: number) => `${Math.round(x * 100)}%`;

console.log(`| Senaryo | XP | Savaş | Parti kazandı | Berabere (20 tur) | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC | Ort. kurtarılan masum | Ejderha uyandı | Uyanınca kazanma | Süre |`);
console.log(`|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|`);
for (const s of SCENARIOS.filter((x) => only.length === 0 || only.includes(x.id))) {
  const t0 = Date.now();
  const m = measure(s, runs);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`| ${s.name} | ${scenarioXp(s)} | ${m.runs} | ${pct(m.partyWins / m.runs)} | ${pct(m.timeouts / m.runs)} | ${m.avgRounds.toFixed(1)} | ${m.avgDead.toFixed(2)} | ${pct(m.anyDeath)} | ${m.avgDown.toFixed(2)} | ${m.avgSaved === null ? '–' : `${m.avgSaved.toFixed(2)}/${s.map?.civilians ?? 0}`} | ${m.dragonWokeRate === null ? '–' : pct(m.dragonWokeRate)} | ${m.winWhenWoke === null ? '–' : pct(m.winWhenWoke)} | ${secs} sn |`);
}
