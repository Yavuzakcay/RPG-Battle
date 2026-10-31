/**
 * Görev B1 (kuyruk 14): eğitimsiz zırhta büyü engeli tek yerde (`castBarrierKind`): büyü menüsü gri olur, hedef seçimine
 * girilmez; motor, ritüel (kurulumda Find Familiar) ve çağırma aynı nedeni verir. Eğitimsiz zırhlı Wizard, eğitimli
 * Wizard ve Cleric (Medium zırh eğitimli).
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { castBarrier, castBarrierKind } from './castBarrier';
import { GM, P1, mk } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { spells } from '../data';
import type { CharacterSheet } from '../rules/stats';
import type { BattleState, Combatant } from './types';

const sheet = (patch: Partial<CharacterSheet>): CharacterSheet => ({ ...blankCharacter('b1').sheet, name: 'Zırh', level: 5, weapons: [{ name: 'Dagger' }], ...patch });
const wizard = (armorName: string) => sheet({ classId: 'wizard', subclassId: 'evoker', baseScores: suggestedScores('wizard'), armorName, spellNames: ['Fire Bolt', 'Flaming Sphere', 'Find Familiar'] });
const cleric = () => sheet({ classId: 'cleric', subclassId: 'life', baseScores: suggestedScores('cleric'), armorName: 'Chain Shirt', spellNames: ['Sacred Flame', 'Bless'] });
const spell = (name: string) => spells.find((s) => s.name === name)!;

function arena(a: Combatant, status: 'active' | 'setup' = 'active'): BattleState {
  const s = startBattle('b1', 'd-z-zemin', [a, mk('B', { side: 'enemies', hp: 80, maxHp: 80, ac: 5 })], () => 0.5, { map: { id: 'col' } }).state;
  const combatants = { ...s.combatants, A: { ...(s.combatants.A as Combatant), pos: { col: 3, row: 3 } }, B: { ...(s.combatants.B as Combatant), pos: { col: 6, row: 3 } } };
  return { ...s, status, order: ['A', 'B'], turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
}

describe('eğitimsiz zırh ve büyü engeli', () => {
  it('eğitimsiz zırhlı Wizard: her büyü engelli (armor), Flaming Sphere motorda zırh nedeniyle reddedilir, "boş yer yok" değil', () => {
    const s = arena(combatantFromSheet(wizard('Chain Mail'), { id: 'A', ownerId: 'p1' }));
    const a = s.combatants.A as Combatant;
    for (const n of ['Fire Bolt', 'Flaming Sphere']) expect(castBarrierKind(s, a, spell(n))).toBe('armor');
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Flaming Sphere', targetHex: { col: 4, row: 3 } }, P1, () => 0.5);
    expect(r.ok ? '' : r.error).toContain('büyü yapılamaz');
    expect(r.ok ? '' : r.error).not.toContain('boş yer');
  });
  it('ritüel yolu da tutarlı: kurulumda Find Familiar eğitimsiz zırhla reddedilir, eğitimliyle olur', () => {
    const bad = arena(combatantFromSheet(wizard('Chain Mail'), { id: 'A', ownerId: 'p1' }), 'setup');
    const r = execute(bad, { type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', form: 'owl' } as never, P1, () => 0.5);
    expect(r.ok ? '' : r.error).toContain('büyü yapılamaz');
    const good = arena(combatantFromSheet(wizard('Zırhsız'), { id: 'A', ownerId: 'p1' }), 'setup');
    const g = execute(good, { type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', form: 'owl' } as never, P1, () => 0.5);
    expect(g.ok ? '' : g.error).not.toContain('büyü yapılamaz');
  });
  it('eğitimli Wizard ve Medium zırhlı Cleric: engel yok, büyü yapılır', () => {
    const w = arena(combatantFromSheet(wizard('Zırhsız'), { id: 'A', ownerId: 'p1' }));
    expect(castBarrier(w, w.combatants.A as Combatant, spell('Flaming Sphere'))).toBeNull();
    expect(execute(w, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, P1, () => 0.5).ok).toBe(true);
    const c = arena(combatantFromSheet(cleric(), { id: 'A', ownerId: 'p1' }));
    expect((c.combatants.A as Combatant).effects?.some((e) => e.noCast) ?? false).toBe(false);
    expect(castBarrierKind(c, c.combatants.A as Combatant, spell('Sacred Flame'))).toBeNull();
    expect(execute(c, { type: 'cast_spell', actorId: 'A', spellName: 'Sacred Flame', targetId: 'B' }, P1, () => 0.5).ok).toBe(true);
  });
});
