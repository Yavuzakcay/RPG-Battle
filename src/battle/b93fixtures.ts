/** Görev B93 test yardımcıları (arena, büyücü). */
import { expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, mk } from './fixtures';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };

export class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, ctx: CommandContext = P1, rng: Rng = () => 0.5) {
    const r = execute(this.state, cmd, ctx, rng);
    if (!r.ok) throw new Error(r.error);
    this.state = r.state; this.events.push(...r.events);
    return r.events;
  }
  try(cmd: Command, ctx: CommandContext = P1, rng: Rng = () => 0.5) { return execute(this.state, cmd, ctx, rng); }
  end(rng: Rng = () => 0.5) { const id = this.state.order[this.state.turnIndex] as string; return this.do({ type: 'end_turn', actorId: id }, this.state.combatants[id]?.side === 'enemies' ? GM : P1, rng); }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
export function arena(a: Combatant, foes: Array<[string, Partial<Combatant>, Offset]>, opts: { ally?: [Partial<Combatant>, Offset]; rules?: number } = {}) {
  const ally = opts.ally;
  const parts = [a, ...foes.map(([id, p]) => mk(id, { side: 'enemies', hp: 60, maxHp: 60, saves: LOW, ...p })), ...(ally ? [mk('C', { ownerId: 'p1', hp: 30, maxHp: 30, ...ally[0] })] : [])];
  const s = startBattle('w', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), ...Object.fromEntries(foes.map(([id, , p]) => [id, p])), ...(ally ? { C: ally[1] } : {}) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return new Run({ ...s, ...(opts.rules ? { kuralSurumu: opts.rules } : {}), status: 'active', order: Object.keys(pos), turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } });
}
export const caster = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0], spellSaveDc: 15, spellAttack: 30, spellMod: 4, level: 10, ...p });
