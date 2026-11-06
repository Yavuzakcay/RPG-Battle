/**
 * Y2 G2: yapay zekâ karar süresi ölçümü. `npm run sim:yz-sure -- [savaş] [senaryo] [--parti kimlik] [--seviye N] [--yavas K]`
 * Her `chooseCommand` çağrısının süresi (ms): ortalama, p50, p95, en çok; karar başına aday, önizleme (önbellek dışı),
 * kuru çalıştırma (`execute`) ve `tryCmd` sayısı. `--yavas K`: telefon tahmini için süreleri K ile çarpar (varsayılan 4).
 * Ayrıca aynı tohumla seçilen komut dizisinin özeti (karar imzası) yazılır: önbellek/budama değişikliğinde karşılaştırma.
 */
import { loadTrExtra } from '../i18n';
import { loadClassData, loadMonsters } from '../data';
import { PARTY_KINDS, SCENARIOS, roundLimit, seeded, setPartyKind, setupBattle } from './balance';
import { execute, type BattleState, type Command } from '../battle';
import { currentActorId } from '../battle/common';
import { chooseCommand } from '../battle/ai';
import { aiStats, resetAiStats } from '../battle/ai/preview';
import { contextFor } from '../ui/session';

await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
declare const process: { argv: string[] };
let args = process.argv.slice(2);
const opt = (k: string, d: string): string => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1] ?? d; args = args.filter((_, j) => j !== i && j !== i + 1); return v; };
const kind = opt('--parti', 'buyucu');
const level = Number(opt('--seviye', '5'));
const slow = Number(opt('--yavas', '4'));
if (!PARTY_KINDS[kind]) throw new Error(`--parti ${Object.keys(PARTY_KINDS).join('|')}`);
setPartyKind(kind);
const runs = Number(args[0] ?? 5) || 5;
const sc = SCENARIOS.find((s) => s.id === (args[1] ?? 'kale'));
if (!sc) throw new Error(`senaryo yok: ${args[1]}`);

const times: number[] = [];
let sig = 2166136261;
const mix = (str: string) => { for (let i = 0; i < str.length; i++) { sig ^= str.charCodeAt(i); sig = Math.imul(sig, 16777619); } };
resetAiStats();
for (let seed = 1; seed <= runs; seed++) {
  const rng = seeded(seed);
  let state: BattleState = setupBattle(sc, rng, level);
  for (let g = 0; g < 2000 && state.status === 'active' && state.round <= roundLimit(level); g++) {
    const id = currentActorId(state);
    for (let step = 0; step < 12; step++) {
      const t0 = performance.now();
      const cmd = chooseCommand(state);
      times.push(performance.now() - t0);
      mix(JSON.stringify(cmd));
      if (cmd.type === 'end_turn') break;
      const r = execute(state, cmd, contextFor(state, id), rng);
      if (!r.ok) break;
      state = r.state;
      if (state.status !== 'active' || currentActorId(state) !== id) break;
    }
    if (state.status === 'active' && currentActorId(state) === id) {
      const r = execute(state, { type: 'end_turn', actorId: id } as Command, contextFor(state, id), rng);
      if (r.ok) state = r.state;
    }
  }
}
const n = times.length;
const sorted = [...times].sort((a, b) => a - b);
const q = (p: number) => sorted[Math.min(n - 1, Math.floor(p * n))] ?? 0;
const avg = times.reduce((s, x) => s + x, 0) / n;
const f = (x: number) => x.toFixed(1);
console.log(`| Senaryo | Parti | Savaş | Karar | Ort. ms | p50 | p95 | En çok | ×${slow} ort. | ×${slow} p95 | Aday/karar | Önizleme/karar (önbellek dışı) | Kuru çalıştırma/karar | tryCmd/karar (önbellek dışı) | İmza |`);
console.log(`|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|`);
console.log(`| ${sc.name} | ${kind} | ${runs} | ${n} | ${f(avg)} | ${f(q(0.5))} | ${f(q(0.95))} | ${f(sorted[n - 1] ?? 0)} | ${f(avg * slow)} | ${f(q(0.95) * slow)} | ${f(aiStats.candidates / n)} | ${f(aiStats.previews / n)} (${f(aiStats.previewMisses / n)}) | ${f(aiStats.previewRuns / n)} | ${f(aiStats.tries / n)} (${f(aiStats.tryMisses / n)}) | ${(sig >>> 0).toString(16)} |`);
