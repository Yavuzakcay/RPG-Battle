/** Kuyruk 19 (karar 1): özellik işaretli savaşçıda Bardic Inspiration (kural sürümü 16, anahtar `bardicInspirationFix`). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { P1, mk, scripted } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { BattleEvent, BattleState, Combatant } from './types';

const bard = combatantFromSheet({ ...blankCharacter('b').sheet, name: 'Lira', classId: 'bard', subclassId: 'college-of-lore', level: 5, baseScores: suggestedScores('bard') }, { id: 'A', ownerId: 'p1' });
const swing = { label: 'Kılıç', attackBonus: 5, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'x' };

/** C işaretli (Indomitable yalnızca save'de; saldırıya ikinci şans vermez) ve ilham almış; C'nin ıskalayan saldırısı. */
function run(kuralSurumu: number, toggles?: Record<string, boolean>) {
  const parts = [bard, mk('C', { ownerId: 'p1', hp: 30, maxHp: 30, ac: 15, traits: ['indomitable'] }), mk('B', { side: 'enemies', hp: 40, maxHp: 40 })];
  const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
  const combatants = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: { col: 3, row: 3 }, B: { col: 5, row: 3 }, C: { col: 4, row: 3 } })) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  let state: BattleState = { ...s0, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
  const events: BattleEvent[] = [{ type: 'battle_started', state }];
  const a = execute(state, { type: 'use_feature', actorId: 'A', feature: 'bard:bardic-inspiration', targetId: 'C' }, P1, () => 0.5);
  if (!a.ok) throw new Error(a.error);
  state = a.state; events.push(...a.events);
  const b = execute({ ...state, turnIndex: 2 }, { type: 'attack', actorId: 'C', targetId: 'B', option: swing }, P1, scripted([20, 6], [8, 8], [8, 4]));
  if (!b.ok) throw new Error(b.error);
  const atk = b.events.find((e) => e.type === 'attack_resolved') as { hit: boolean; total: number };
  return { atk, state: a.state, events };
}

describe('Kuyruk 19: Bardic Inspiration işaretli savaşçıda', () => {
  it('sürüm 16: zar eklenir (ıska → isabet)', () => {
    const r = run(16);
    expect(r.state.combatants.C?.inspireFix).toBe(true);
    expect(r.atk.total).toBe(6 + 5 + 8);
    expect(r.atk.hit).toBe(true);
    expect(replay(r.events)).toEqual(r.state);
  });
  it('anahtar kapalı ya da eski sürüm (15): eski davranış, zar eklenmez', () => {
    for (const r of [run(16, { bardicInspirationFix: false }), run(15)]) {
      expect(r.state.combatants.C?.inspireFix).toBeUndefined();
      expect(r.atk.total).toBe(6 + 5);
      expect(r.atk.hit).toBe(false);
    }
  });
});
