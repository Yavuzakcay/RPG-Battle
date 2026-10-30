/**
 * Görev K9d: eğitimsiz zırh (SRD 5.2.1 Armor Training). Light/Medium/Heavy zırhta eğitim yoksa Güç ve Çeviklik d20
 * testleri (saldırı, save, kontrol) dezavantajlı ve büyü yapılamaz; kalkanda eğitim yoksa kalkan AC vermez.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { chooseCommand } from './ai';
import { P1, mk } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { deriveStats, type CharacterSheet } from '../rules/stats';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const sheet = (patch: Partial<CharacterSheet>): CharacterSheet => ({
  ...blankCharacter('k9d').sheet, name: 'Zırh', level: 3, weapons: [{ name: 'Dagger' }], ...patch,
});
const wizard = (armorName: string, shield = false) =>
  sheet({ classId: 'wizard', subclassId: 'evoker', baseScores: suggestedScores('wizard'), armorName, shield, spellNames: ['Fire Bolt', 'Magic Missile'] });

function arena(a: Combatant): BattleState {
  const parts = [a, mk('B', { side: 'enemies', hp: 80, maxHp: 80, ac: 5 })];
  const s = startBattle('k9d', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
  const combatants = { ...s.combatants, A: { ...(s.combatants.A as Combatant), pos: o(3, 3) }, B: { ...(s.combatants.B as Combatant), pos: o(4, 3) } };
  return { ...s, status: 'active', order: ['A', 'B'], turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
}

describe('eğitimsiz zırh', () => {
  it('Wizard Chain Mail: büyü reddedilir, saldırı dezavantajlı; yapay zekâ büyü seçmez', () => {
    const a = combatantFromSheet(wizard('Chain Mail'), { id: 'A', ownerId: 'p1' });
    expect(a.effects?.find((e) => e.id === 'armor:untrained')).toMatchObject({ noCast: true, saveDis: ['str', 'dex'], checkDis: ['str', 'dex'] });
    const s = arena(a);
    const cast = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, P1, () => 0.5);
    expect(cast.ok ? '' : cast.error).toContain('büyü yapılamaz');
    const dagger = a.weaponOptions.find((x) => !x.spell && !x.ranged);
    const hit = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: dagger! }, P1, () => 0.5);
    expect(hit.ok && hit.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ mode: 'disadvantage' });
    const cmd = chooseCommand(s);
    expect(cmd.type).not.toBe('cast_spell');
  });
  it('eğitimli zırhta (Wizard zırhsız, Fighter Chain Mail) ceza yok; büyü yapılır', () => {
    const a = combatantFromSheet(wizard('Zırhsız'), { id: 'A', ownerId: 'p1' });
    expect(a.effects ?? []).toEqual([]);
    expect(execute(arena(a), { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, P1, () => 0.5).ok).toBe(true);
    expect(combatantFromSheet(sheet({ armorName: 'Chain Mail' }), { id: 'A', ownerId: 'p1' }).effects ?? []).toEqual([]);
  });
  it('kalkan: eğitimsiz Wizard\'a AC vermez, eğitimli Fighter\'a +2', () => {
    expect(deriveStats(wizard('Zırhsız', true)).ac).toBe(deriveStats(wizard('Zırhsız')).ac);
    expect(deriveStats(wizard('Zırhsız', true)).acParts.some((p) => p.kind === 'shield')).toBe(false);
    expect(deriveStats(sheet({ armorName: 'Chain Mail', shield: true })).ac).toBe(deriveStats(sheet({ armorName: 'Chain Mail' })).ac + 2);
  });
});
