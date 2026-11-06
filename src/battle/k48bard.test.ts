/**
 * Kuyruk K48 Adım A: Bardic Inspiration zinciri (kural sürümü 19, `bardicInspirationChain`). İkinci şansı olan
 * savaşçıda (Indomitable) ilk ikinci şans tutmazsa ilham zarı da atılır; sürüm 18'de eski davranış (yalnızca ilki).
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { P1, mk, scripted } from './fixtures';
import { saveDice } from './effectDice';
import { resolveSave } from '../rules/attack';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { BattleEvent, BattleState, Combatant } from './types';

const bard = combatantFromSheet({ ...blankCharacter('b').sheet, name: 'Lira', classId: 'bard', subclassId: 'college-of-lore', level: 5, baseScores: suggestedScores('bard') }, { id: 'A', ownerId: 'p1' });

/** C: Indomitable (save'de yeniden atış, +seviye) ve ilham almış. */
function inspired(kuralSurumu: number, toggles?: Record<string, boolean>) {
  const parts = [bard, mk('C', { ownerId: 'p1', hp: 30, maxHp: 30, level: 1, traits: ['indomitable'], resources: { indomitable: 1 } }), mk('B', { side: 'enemies', hp: 40, maxHp: 40 })];
  const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
  const combatants = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: { col: 3, row: 3 }, B: { col: 5, row: 3 }, C: { col: 4, row: 3 } })) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const state: BattleState = { ...s0, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
  const a = execute(state, { type: 'use_feature', actorId: 'A', feature: 'bard:bardic-inspiration', targetId: 'C' }, P1, () => 0.5);
  if (!a.ok) throw new Error(a.error);
  return { state: a.state, events: [{ type: 'battle_started', state } as BattleEvent, ...a.events] };
}
/** DC 13 save: d20 5 (ıska), Indomitable yeniden 6 (+1 = 7, yine ıska), ilham zarı (Bard 5: d8) 6 → 13. */
const roll = (c: Combatant) => resolveSave({ modifier: 0, dc: 13, mode: 'normal', extra: saveDice(c, 'wis') }, scripted([20, 5], [20, 6], [8, 6]));

describe('Kuyruk K48: Bardic Inspiration zinciri', () => {
  it('sürüm 19: Indomitable tutmayınca ilham zarı da atılır (7 + 6 = 13 → başarı)', () => {
    const r = inspired(19);
    const c = r.state.combatants.C as Combatant;
    expect(c.inspireChain).toBe(true);
    const s = roll(c);
    expect(s.extra?.map((x) => x.label)).toEqual(['Indomitable', expect.stringMatching(/Bardic|İlham|Inspiration/)]);
    expect(s.total).toBe(13);
    expect(s.success).toBe(true);
    expect(replay(r.events)).toEqual(r.state);
  });
  it('sürüm 18 ya da anahtar kapalı: eski davranış (yalnızca Indomitable; 7 → başarısız)', () => {
    for (const r of [inspired(18), inspired(19, { bardicInspirationChain: false })]) {
      const c = r.state.combatants.C as Combatant;
      expect(c.inspireChain).toBeUndefined();
      const s = roll(c);
      expect(s.extra?.map((x) => x.label)).toEqual(['Indomitable']);
      expect(s.total).toBe(7);
      expect(s.success).toBe(false);
    }
  });
});
