/**
 * Kuyruk K54b: imza alt sınıf testleri için ortak arena (yalnız testler içe aktarır). 15×9 açık zemin, A (imza
 * karakteri, p1), C (dost, p1), B (düşman); kural sürümü ve ev kuralı seçilir.
 */
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { FRESH_ECONOMY } from './types';
import { blankCharacter } from '../rules/builder';
import type { Rng } from '../rules/dice';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

export const o = (col: number, row: number) => ({ col, row });
export const mid: Rng = () => 0.5;
export const low: Rng = () => 0.01;
export const high: Rng = () => 0.99;

export interface KitOpts {
  cls: string; sub: string; level: number; kuralSurumu?: number; house?: boolean; scores?: Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>;
  place?: Record<string, { col: number; row: number }>; extra?: Combatant[]; enemy?: Partial<Combatant>; ally?: Partial<Combatant>;
}
export function kitHero(o2: KitOpts, id = 'A'): Combatant {
  return combatantFromSheet({ ...blankCharacter('k54b').sheet, name: 'İmza', raceId: 'human', classId: o2.cls, subclassId: o2.sub, level: o2.level, gender: 'kadin',
    baseScores: { str: 12, dex: 14, con: 14, int: 14, wis: 14, cha: 14, ...o2.scores } } as CharacterSheet, { id, ownerId: 'p1' });
}
export function kitArena(opts: KitOpts) {
  const B = mk('B', { side: 'enemies', hp: 60, maxHp: 60, monsterId: 'bandit', saves: { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 }, ...opts.enemy });
  const C = mk('C', { ownerId: 'p1', hp: 20, maxHp: 30, ...opts.ally });
  const s0 = startBattle('k54b', 'k54b', [kitHero(opts), C, B, ...(opts.extra ?? [])], () => 0.5, {
    map: { id: 'col' }, houseRules: { [opts.sub]: opts.house ?? true }, ...(opts.kuralSurumu ? { kuralSurumu: opts.kuralSurumu } : {}) }).state;
  const combatants = { ...s0.combatants };
  const place: Record<string, { col: number; row: number }> = { A: o(3, 3), B: o(4, 3), C: o(0, 0), ...opts.place };
  for (const [id, p] of Object.entries(place)) if (combatants[id]) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const ids = Object.keys(combatants);
  const state: BattleState = { ...s0, status: 'active', order: ['A', ...ids.filter((x) => x !== 'A')], turnIndex: 0, combatants,
    map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 9 }, () => '.'.repeat(15)), objects: [], zones: [] } };
  const run = {
    state, events: [{ type: 'battle_started', state } as BattleEvent],
    do(cmd: Command, rng: Rng = mid) {
      const r = execute(run.state, cmd, P1, rng);
      if (!r.ok) throw new Error(r.error);
      run.state = r.state; run.events.push(...r.events);
      return r.events;
    },
    try: (cmd: Command, rng: Rng = mid) => execute(run.state, cmd, P1, rng),
    gm(cmd: Command, rng: Rng = mid) {
      const r = execute(run.state, cmd, GM, rng);
      if (!r.ok) throw new Error(r.error);
      run.state = r.state; run.events.push(...r.events);
      return r.events;
    },
    /** Savaşçının eylem ekonomisini tazele (aynı testte ikinci eylem). */
    fresh(id = 'A') { run.state = { ...run.state, combatants: { ...run.state.combatants, [id]: { ...(run.state.combatants[id] as Combatant), economy: FRESH_ECONOMY } } }; },
    c: (id: string) => run.state.combatants[id] as Combatant,
    use: (f: string, targetId?: string, to?: { col: number; row: number }, actorId = 'A'): Command =>
      ({ type: 'use_feature', actorId, feature: `imza:${opts.sub}/${f}`, ...(targetId ? { targetId } : {}), ...(to ? { to } : {}) }),
    keys: () => (run.state.combatants.A?.features ?? []).map((f) => f.key),
  };
  return run;
}
