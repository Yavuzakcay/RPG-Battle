/**
 * Denge raporu: `npm run sim -- [savaş sayısı] [senaryo kimliği...]`.
 * Her senaryo aynı tohumlarla (1..N) oynanır; sonuç tekrarlanabilir.
 */
import { DEFAULT_LEVEL, SCENARIOS, measure, scenarioXp, setPartyKind } from './balance';
import { loadClassData, loadMonsters } from '../data';

// Canavar verisi tembel yüklenir.
await Promise.all([loadMonsters(), loadClassData()]);

declare const process: { argv: string[] };

const argv = process.argv.slice(2);
// `--seviye N` (parti seviyesi, varsayılan 5) herhangi bir yerde; kalanlar: savaş sayısı ve senaryo kimlikleri.
const at = argv.indexOf('--seviye');
const level = at >= 0 ? Number(argv[at + 1]) : DEFAULT_LEVEL;
if (!Number.isInteger(level) || level < 1 || level > 20) throw new Error(`--seviye 1–20 olmalı: ${argv[at + 1]}`);
let args = at >= 0 ? [...argv.slice(0, at), ...argv.slice(at + 2)] : argv;
// `--parti barbar`: Fighter yerine Barbarian (Görev P-Barbarian); varsayılan standart parti.
const pAt = args.indexOf('--parti');
if (pAt >= 0) {
  const kind = args[pAt + 1];
  if (kind !== 'barbar' && kind !== 'standart') throw new Error(`--parti standart|barbar olmalı: ${kind}`);
  setPartyKind(kind);
  console.log(`> Parti: ${kind === 'barbar' ? 'Barbarian partisi (Bor yerine Grum)' : 'standart'}\n`);
  args = [...args.slice(0, pAt), ...args.slice(pAt + 2)];
}
const runs = Number(args[0] ?? 200) || 200;
const only = args.slice(1);
// 5. seviye dışındaki partiler iskelet (Görev N): içerik 5. seviye partisiyle aynı, yalnızca seviye farklı.
if (level !== DEFAULT_LEVEL) console.log(`> Parti seviyesi ${level} (iskelet: skor, donanım ve büyüler 5. seviye partisiyle aynı; düşman listesi senaryonun 5. seviye listesi).\n`);
const pct = (x: number) => `${Math.round(x * 100)}%`;

console.log(`| Senaryo | XP | Savaş | Parti kazandı | Berabere (20 tur) | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC | Ort. kurtarılan masum | Ejderha uyandı | Uyanınca kazanma | Süre |`);
console.log(`|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|`);
for (const s of SCENARIOS.filter((x) => only.length === 0 || only.includes(x.id))) {
  const t0 = Date.now();
  const m = measure(s, runs, 1, level);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`| ${s.name} | ${scenarioXp(s, level)} | ${m.runs} | ${pct(m.partyWins / m.runs)} | ${pct(m.timeouts / m.runs)} | ${m.avgRounds.toFixed(1)} | ${m.avgDead.toFixed(2)} | ${pct(m.anyDeath)} | ${m.avgDown.toFixed(2)} | ${m.avgSaved === null ? '–' : `${m.avgSaved.toFixed(2)}/${s.map?.civilians ?? 0}`} | ${m.dragonWokeRate === null ? '–' : pct(m.dragonWokeRate)} | ${m.winWhenWoke === null ? '–' : pct(m.winWhenWoke)} | ${secs} sn |`);
}
