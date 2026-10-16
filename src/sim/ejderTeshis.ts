/**
 * Uyuyan ejderha teşhisi (başsız): her ejderha seçeneği için 200 tohum. Uyanma turu, uyandıktan
 * sonra ejderhanın tur sayısı, verdiği hasar, düşürdüğü karakter, nefes kullanımı, hedefe varıp
 * varamadığı ve uyumadan biten savaşlar. Kod değiştirmez.
 * Çalıştırma: `npx vite-node src/sim/ejderTeshis.ts [tohum] [senaryo kimlikleri...]`
 */
import { SCENARIOS, seeded, setupBattle } from './balance';
import { execute } from '../battle';
import type { BattleState } from '../battle';
import { currentActorId } from '../battle/common';
import { chooseCommand } from '../battle/ai';
import { contextFor } from '../ui/session';
import { distance } from '../rules/hex';
declare const process: { argv: string[] };

const N = Number(process.argv[2] ?? 200);
const ids = process.argv.slice(3);
const scen = SCENARIOS.filter((s) => s.map?.dragon && (ids.length === 0 || ids.includes(s.id)));

const pcs = (s: BattleState) => Object.values(s.combatants).filter((c) => c.side === 'party' && !c.civilian);
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : '–');
const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '–');

console.log('| Senaryo | Parti kazandı | Uyandı | Uyanma turu (ort.) | Uyanık tur | Ejderha hasarı | Düşürdüğü PC | Nefes/savaş | Ejderha PC\'ye vardı | Ejderha öldü | Uyumadan bitti | Uyumadan bitti, parti kazandı |');
console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const s of scen) {
  let wins = 0, woke = 0, reached = 0, killed = 0, sleptEnd = 0, sleptWin = 0;
  const wakeRound: number[] = [], awakeTurns: number[] = [], dmg: number[] = [], downs: number[] = [], breaths: number[] = [];
  const reasons: Record<string, number> = {};
  const cmdTypes: Record<string, number> = {};
  for (let seed = 1; seed <= N; seed++) {
    const rng = seeded(seed);
    let state = setupBattle(s, rng);
    const did = state.map?.dragon?.id as string;
    let wr = 0, turns = 0, d = 0, dn = 0, br = 0, near = false;
    const note = (events: { type: string; reason?: string }[], round: number) => {
      const e = events.find((x) => x.type === 'dragon_woke');
      if (!e || wr) return;
      wr = round;
      const why = (e.reason ?? '').startsWith('Algı') ? 'Algı' : (e.reason ?? '');
      reasons[why] = (reasons[why] ?? 0) + 1;
    };
    for (let g = 0; g < 2000 && state.status === 'active' && state.round <= 20; g++) {
      const id = currentActorId(state);
      const isDragon = id === did && !state.combatants[did]?.asleep;
      if (isDragon) turns++;
      for (let k = 0; k < 12; k++) {
        const cmd = chooseCommand(state);
        if (cmd.type === 'end_turn') break;
        const before = state;
        const r = execute(state, cmd, contextFor(state, id), rng);
        if (!r.ok) break;
        state = r.state;
        note(r.events, before.round);
        for (const e of r.events) if (e.type === 'recharge_used' && e.actorId === did) br++;
        if (isDragon) {
          cmdTypes[cmd.type] = (cmdTypes[cmd.type] ?? 0) + 1;
          for (const p of pcs(before)) {
            const now = state.combatants[p.id];
            if (!now) continue;
            d += Math.max(0, p.hp - now.hp);
            if (p.hp > 0 && now.hp <= 0) dn++;
          }
        }
        if (state.status !== 'active' || currentActorId(state) !== id) break;
      }
      const dr = state.combatants[did];
      if (dr?.pos && !dr.asleep && pcs(state).some((p) => p.pos && p.hp > 0 && distance(p.pos, dr.pos!) * 5 <= 15)) near = true;
      if (state.status === 'active' && currentActorId(state) === id) {
        const r = execute(state, { type: 'end_turn', actorId: id }, contextFor(state, id), rng);
        if (r.ok) { note(r.events, state.round); state = r.state; }
      }
    }
    const won = state.status === 'finished' && state.winner === 'party';
    if (won) wins++;
    const dr = state.combatants[did];
    if (wr) {
      woke++; wakeRound.push(wr); awakeTurns.push(turns); dmg.push(d); downs.push(dn); breaths.push(br);
      if (near) reached++;
      if (dr && dr.hp <= 0) killed++;
    } else {
      sleptEnd++;
      if (won) sleptWin++;
    }
  }
  console.log(`| ${s.name} | ${pct(wins, N)} | ${pct(woke, N)} | ${avg(wakeRound)} | ${avg(awakeTurns)} | ${avg(dmg)} | ${avg(downs)} | ${avg(breaths)} | ${pct(reached, woke)} | ${pct(killed, woke)} | ${pct(sleptEnd, N)} | ${pct(sleptWin, sleptEnd)} |`);
  console.log(`|   uyanma nedeni: ${JSON.stringify(reasons)}; ejderha komutları: ${JSON.stringify(cmdTypes)} |`);
}
