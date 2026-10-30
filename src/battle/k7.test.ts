/** Görev K7: yukarı slotta ek dart/ışın (Magic Missile, Scorching Ray), Eldritch Blast ışınları, Extra Attack sayıları. */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { P1, mk } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { BattleEvent, BattleState, Combatant } from './types';

function cast(spellName: string, slotLevel: number | undefined, a: Partial<Combatant> = {}): BattleEvent[] {
  const caster = mk('A', { ownerId: 'p1', spellNames: [spellName], spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0], spellAttack: 30, spellSaveDc: 13, spellMod: 3, level: 5, ...a });
  const foe = mk('B', { side: 'enemies', hp: 500, maxHp: 500, ac: 5 });
  const st = startBattle('k7', 'd-z-zemin', [caster, foe], () => 0.5).state;
  const state: BattleState = { ...st, status: 'active', order: ['A', 'B'], turnIndex: 0 };
  const r = execute(state, { type: 'cast_spell', actorId: 'A', spellName, targetId: 'B', ...(slotLevel ? { slotLevel } : {}) }, P1, () => 0.5);
  if (!r.ok) throw new Error(r.error);
  return r.events;
}
const hitsOf = (ev: BattleEvent[]) => ev.filter((e) => e.type === 'attack_resolved').length;

describe('ışın ve dart sayıları', () => {
  it('Magic Missile 3 dart, slot başına +1; Scorching Ray 3 ışın, slot başına +1', () => {
    expect(hitsOf(cast('Magic Missile', 1))).toBe(3);
    expect(hitsOf(cast('Magic Missile', 3))).toBe(5);
    expect(hitsOf(cast('Scorching Ray', 2))).toBe(3);
    expect(hitsOf(cast('Scorching Ray', 3))).toBe(4);
  });
  it('Eldritch Blast ışınları seviyeyle (1/5/11/17)', () => {
    expect(hitsOf(cast('Eldritch Blast', undefined, { level: 1 }))).toBe(1);
    expect(hitsOf(cast('Eldritch Blast', undefined, { level: 5 }))).toBe(2);
    expect(hitsOf(cast('Eldritch Blast', undefined, { level: 11 }))).toBe(3);
    expect(hitsOf(cast('Eldritch Blast', undefined, { level: 17 }))).toBe(4);
  });
});

describe('Attack eylemi başına saldırı (SRD 5.2.1)', () => {
  it('Extra Attack 5. seviyede; Fighter 11 ve 20; diğerleri 1', () => {
    const at = (classId: string, level: number) => combatantFromSheet({ ...blankCharacter('a').sheet, name: 'A', classId, level, baseScores: suggestedScores(classId),
      armorName: 'Zırhsız', ...(level >= 3 ? { subclassId: undefined } : {}) }, { id: 'a', ownerId: 'x' }).attacksPerAction;
    for (const c of ['barbarian', 'fighter', 'monk', 'paladin', 'ranger']) { expect(at(c, 4), c).toBe(1); expect(at(c, 5), c).toBe(2); }
    for (const c of ['bard', 'cleric', 'druid', 'rogue', 'sorcerer', 'warlock', 'wizard']) expect(at(c, 5), c).toBe(1);
    expect(at('fighter', 11)).toBe(3);
    expect(at('fighter', 20)).toBe(4);
  });
});
