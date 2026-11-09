/**
 * Kuyruk K73d: K73c kurallarının denge ölçümü (63 ↔ 64, aynı tohumlar; DENGE AYARI YOK). Yalnız `K73D_TOHUM` verilince
 * koşar (varsayılan atlanır). PowerShell: `$env:K73D_TOHUM=30; npx vitest run src/sim/k73dOlcum.test.ts`.
 * Çıktı satırı `K73D <senaryo> L<seviye> v<sürüm> kazanç % tur ort. ölü ort. zaman aşımı <n> sayaçlar imza <hash>`.
 * Sürümler `K73D_SURUM` (varsayılan 63,64; K73e: `64,65`). Kuyruk K73e: sayaçlar durum geçişlerinden (kazma, yer altından
 * çıkış, dalış, sudan çıkış, boğulma) ve YZ kaçış kararından (`k73eStats.digFlee`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { execute } from '../battle';
import { currentActorId } from '../battle/common';
import { chooseCommand, k73eStats } from '../battle/ai';
import { contextFor } from '../ui/session';
import { roundLimit, seeded, setPartyKind, setupBattle } from './balance';
import { K73D_SCENARIOS, shoreStart, submergeStart } from './k73dSenaryo';
import type { BattleEvent, BattleState, Command } from '../battle/types';
import type { Rng } from '../rules/dice';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.K73D_TOHUM ?? 0);
const VERS = (process.env.K73D_SURUM ?? '63,64').split(',').map(Number);
const ONLY = process.env.K73D_SENARYO?.split(',');

/** FNV-1a (iki 32 bit tohum) → 12 onaltılık hane (k73bRegresyon ile aynı). */
function hash(text: string): string {
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    a = Math.imul(a ^ ch, 0x01000193) >>> 0;
    b = Math.imul(b ^ ch, 0x01000193) >>> 0;
  }
  return (a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0')).slice(0, 12);
}

/** Sayaçlar (durum geçişleri): kazma, yer altından çıkış, dalış, sudan çıkış. */
interface Counts { kazma: number; cikis: number; dalis: number; sudanCikis: number }
function transitions(before: BattleState, after: BattleState, c: Counts): void {
  for (const [id, b] of Object.entries(before.combatants)) {
    const a = after.combatants[id];
    if (!a || !b.pos || !a.pos) continue;
    const ba = b.altitudeFt ?? 0, aa = a.altitudeFt ?? 0;
    if (!b.burrowed && a.burrowed) c.kazma++;
    else if (b.burrowed && !a.burrowed) c.cikis++;
    else if (!a.burrowed && !b.burrowed && ba >= 0 && aa < 0) c.dalis++;
    else if (!a.burrowed && !b.burrowed && ba < 0 && aa >= 0) c.sudanCikis++;
  }
}

/** `playBattle` ile aynı döngü (src/sim/balance.ts), olayları ve geçiş sayaçlarını da toplar. */
function play(start: BattleState, rng: Rng, maxRounds: number, c: Counts): { state: BattleState; events: BattleEvent[] } {
  let state = start;
  const events: BattleEvent[] = [];
  const apply = (cmd: Command): boolean => {
    const actorId = 'actorId' in cmd ? cmd.actorId : '';
    const r = execute(state, cmd, contextFor(state, actorId), rng);
    if (!r.ok) return false;
    transitions(state, r.state, c);
    state = r.state; events.push(...r.events);
    return true;
  };
  for (let guard = 0; guard < 2000 && state.status === 'active' && state.round <= maxRounds; guard++) {
    const actorId = currentActorId(state);
    for (let step = 0; step < 12; step++) {
      const cmd = chooseCommand(state);
      if (cmd.type === 'end_turn' || !apply(cmd)) break;
      if (state.status !== 'active' || currentActorId(state) !== actorId) break;
    }
    if (state.status === 'active' && currentActorId(state) === actorId) apply({ type: 'end_turn', actorId });
  }
  return { state, events };
}

afterEach(() => { setDefaultRuleVersion(CURRENT_RULES); setPartyKind('standart'); });

const CASES: Array<{ id: string; level: number; party: string }> = [
  { id: 'k73d-kazan', level: 5, party: 'standart' }, { id: 'k73d-kazan', level: 9, party: 'standart' },
  { id: 'k73d-sualti', level: 5, party: 'standart' }, { id: 'k73d-kiyi', level: 5, party: 'standart' },
  { id: 'k73d-firtina', level: 5, party: 'k18-druid' }, { id: 'k73d-firtina', level: 9, party: 'k18-druid' },
];

describe.skipIf(!SEEDS)('K73d denge ölçümü: kazan, su altı, fırtına (63 ↔ 64)', () => {
  for (const c of CASES) {
    if (ONLY && !ONLY.includes(c.id)) continue;
    it(`${c.id} L${c.level}`, () => {
      const sc = K73D_SCENARIOS.find((s) => s.id === c.id);
      if (!sc) throw new Error(c.id);
      for (const ver of VERS) {
        setDefaultRuleVersion(ver);
        setPartyKind(c.party);
        let sig = '';
        let wins = 0, rounds = 0, dead = 0, timeouts = 0, boguldu = 0, cl = 0, devralma = 0;
        const cnt: Counts = { kazma: 0, cikis: 0, dalis: 0, sudanCikis: 0 };
        const flee0 = k73eStats.digFlee;
        for (let seed = 1; seed <= SEEDS; seed++) {
          const rng = seeded(seed);
          let start = setupBattle(sc, rng, c.level);
          if (c.id === 'k73d-sualti') start = submergeStart(start, ver >= 64);
          if (c.id === 'k73d-kiyi') start = shoreStart(start);
          const { state: end, events } = play(start, rng, roundLimit(c.level), cnt);
          const dd = Object.values(end.combatants).filter((x) => x.side === 'party' && x.life === 'dead').length;
          const cs = Object.values(end.combatants).map((x) => `${x.id}:${x.hp}:${x.life}:${x.pos ? `${x.pos.col},${x.pos.row}` : '-'}:${x.altitudeFt ?? 0}`).sort();
          sig += `${end.status}|${end.winner ?? ''}|${end.round}|${cs.join(';')}\n`;
          if (end.status === 'finished' && end.winner === 'party') wins++;
          if (end.status !== 'finished') timeouts++;
          rounds += end.round; dead += dd;
          boguldu += events.filter((e) => e.type === 'exhaustion_changed' && String((e as { reason?: string }).reason ?? '').includes('boğulma')).length;
          cl += events.filter((e) => e.type === 'spell_cast' && (e as { label?: string }).label === 'Call Lightning').length;
          devralma += events.filter((e) => e.type === 'zone_created' && (e as { zone: { cloud?: { storm?: unknown } } }).zone.cloud?.storm).length;
        }
        const kacis = k73eStats.digFlee - flee0;
        console.log(`K73D ${c.id} L${c.level} v${ver} kazanc %${Math.round((100 * wins) / SEEDS)} tur ${(rounds / SEEDS).toFixed(1)} olu ${(dead / SEEDS).toFixed(2)} zaman ${timeouts} sayac kazma ${cnt.kazma} cikis ${cnt.cikis} kacis ${kacis} dalis ${cnt.dalis} sudanCikis ${cnt.sudanCikis} bogulma ${boguldu} CL ${cl} devralma ${devralma} imza ${hash(sig)}`);
      }
      expect(true).toBe(true);
    }, 3_600_000);
  }
});
