/**
 * Kuyruk 43 madde 4: yapay zekâ — Thirsting Blade sınırı (ek saldırı yalnızca pact silahıyla) ve basit Metamagic
 * (Twinned: ek hedef alan tek hedefli büyü; Quickened: eylem harcanmışken eylemle yapılan büyü bonus eylemle).
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { chooseCommand } from './ai';
import { P1, mk } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { CharacterSheet } from '../rules/stats';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
function arena(a: Combatant, foes: Array<[string, Partial<Combatant>, Offset]>): BattleState {
  const parts = [a, ...foes.map(([id, p]) => mk(id, { side: 'enemies', hp: 60, maxHp: 60, saves: LOW, ac: 10, ...p }))];
  const s = startBattle('k43', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), ...Object.fromEntries(foes.map(([id, , p]) => [id, p])) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: Object.keys(pos), turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
}

describe('K43 yapay zekâ: Thirsting Blade', () => {
  it('pact silahıyla başlayan Attack eyleminin ek saldırısını yine pact silahıyla yapar', () => {
    const sheet: CharacterSheet = {
      ...blankCharacter('w').sheet, name: 'Mira', classId: 'warlock', subclassId: 'fiend-patron', level: 5, baseScores: suggestedScores('warlock'),
      armorName: 'Zırhsız', weapons: [{ name: 'Longsword' }, { name: 'Greataxe' }], pactWeapon: 'Longsword', spellNames: ['Eldritch Blast'],
      invocations: ['pact-of-the-blade', 'thirsting-blade', 'armor-of-shadows', 'agonizing-blast:Eldritch Blast', 'repelling-blast:Eldritch Blast'],
    };
    const a = combatantFromSheet(sheet, { id: 'A', ownerId: 'p1' });
    let st = arena(a, [['B', {}, o(4, 3)]]);
    const sword = a.weaponOptions.find((w) => w.pact && !w.ranged) as Combatant['weaponOptions'][number];
    const r = execute(st, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, () => 0.5);
    if (!r.ok) throw new Error(r.error);
    st = r.state;
    expect(st.combatants.A?.economy.attacksLeft).toBe(1);
    const next = chooseCommand(st);
    expect(next.type).toBe('attack');
    if (next.type === 'attack') expect(next.option.pact).toBe(true);
    expect(execute(st, next, P1, () => 0.5).ok).toBe(true);
  });
});

describe('K43 yapay zekâ: Metamagic', () => {
  const MM = { quickened: 2, twinned: 1 };
  const sorc = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0], spellSaveDc: 15, spellAttack: 7, spellMod: 4, level: 5,
    resources: { sorceryPoints: 5 }, resourceCap: { sorceryPoints: 5 }, metamagic: MM, modifiers: { str: 0, dex: 2, con: 1, int: 0, wis: 0, cha: 4 }, ...p });
  it('Quickened: eylem harcanmış, bonus eylem boşken eylemle yapılan büyüyü bonus eylemle yapar', () => {
    const st = arena(sorc({ spellNames: ['Fire Bolt'] }), [['B', {}, o(6, 3)]]);
    const a = st.combatants.A as Combatant;
    const used = { ...st, combatants: { ...st.combatants, A: { ...a, economy: { ...a.economy, action: true, attacksLeft: 0 } } } };
    const cmd = chooseCommand(used);
    expect(cmd.type).toBe('cast_spell');
    if (cmd.type === 'cast_spell') expect(cmd.metamagic).toContain('quickened');
    expect(execute(used, cmd, P1, () => 0.5).ok).toBe(true);
  });
  it('Quickened: Sorcery Point yetmiyorsa turu bitirir', () => {
    const st = arena(sorc({ spellNames: ['Fire Bolt'], resources: { sorceryPoints: 1 } }), [['B', {}, o(6, 3)]]);
    const a = st.combatants.A as Combatant;
    const used = { ...st, combatants: { ...st.combatants, A: { ...a, economy: { ...a.economy, action: true, attacksLeft: 0 } } } };
    expect(chooseCommand(used).type).toBe('end_turn');
  });
  it('Twinned: ek hedef alan tek hedefli büyüye ikinci düşmanı ekler', () => {
    const st = arena(sorc({ spellNames: ['Hold Person'] }), [['B', { hp: 40, maxHp: 40 }, o(6, 3)], ['D', { hp: 40, maxHp: 40 }, o(6, 4)]]);
    const cmd = chooseCommand(st);
    expect(cmd.type).toBe('cast_spell');
    if (cmd.type === 'cast_spell') {
      expect(cmd.metamagic).toEqual(['twinned']);
      expect(cmd.targetIds?.length).toBe(2);
    }
    expect(execute(st, cmd, P1, () => 0.5).ok).toBe(true);
  });
});
