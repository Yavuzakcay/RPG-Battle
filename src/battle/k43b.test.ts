/**
 * Kuyruk 43b: Divine Intervention'ın oyuncu isteğiyle slotsuz kullanımı (`cast_spell.free`). SRD 5.2.1: Magic eylemi,
 * 5. seviye ya da altı Cleric büyüsü slot harcamadan; uzun dinlenmeye dek bir daha yok.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { P1, mk } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

function cleric(): Combatant {
  const sheet = { ...blankCharacter('c').sheet, name: 'Rahip', classId: 'cleric', subclassId: 'life-domain', level: 10, baseScores: suggestedScores('cleric'),
    armorName: 'Chain Shirt', weapons: [{ name: 'Mace' }], spellNames: ['Sacred Flame', 'Cure Wounds', 'Flame Strike', 'Shield of Faith'] };
  return combatantFromSheet(sheet as never, { id: 'A', ownerId: 'p1' });
}

function battle() {
  const s = startBattle('k43b', 'd-z-zemin', [cleric(), mk('B', { side: 'enemies', hp: 40, maxHp: 40 })], () => 0.5).state;
  const st: BattleState = { ...s, status: 'active', order: ['A', 'B'], turnIndex: 0 };
  const events: BattleEvent[] = [{ type: 'battle_started', state: st }];
  let state = st;
  const run = (cmd: Command) => {
    const r = execute(state, cmd, P1, () => 0.5);
    if (r.ok) { state = r.state; events.push(...r.events); }
    return r;
  };
  return { run, get state() { return state; }, events };
}

describe('Kuyruk 43b: Divine Intervention düğmesi', () => {
  it('slot dolu iken oyuncu isteğiyle slotsuz yapılır: slot aynı, kaynak 0, eylem harcanır; replay aynı', () => {
    const b = battle();
    const slots = [...(b.state.combatants.A as Combatant).spellSlots];
    expect(b.state.combatants.A?.resources.divineIntervention).toBe(1);
    const r = b.run({ type: 'cast_spell', actorId: 'A', spellName: 'Shield of Faith', targetId: 'A', free: true });
    expect(r.ok).toBe(true);
    const a = b.state.combatants.A as Combatant;
    expect(a.spellSlots).toEqual(slots);
    expect(a.resources.divineIntervention).toBe(0);
    expect(a.economy.action).toBe(true);
    expect(replay(b.events)).toEqual(b.state);
  });
  it('hak bitince, cantrip ya da yukarı slotla istenince reddedilir', () => {
    const b = battle();
    expect(b.run({ type: 'cast_spell', actorId: 'A', spellName: 'Sacred Flame', targetId: 'B', free: true }).ok).toBe(false);
    expect(b.run({ type: 'cast_spell', actorId: 'A', spellName: 'Shield of Faith', targetId: 'A', free: true, slotLevel: 3 }).ok).toBe(false);
    expect(b.run({ type: 'cast_spell', actorId: 'A', spellName: 'Shield of Faith', targetId: 'A', free: true }).ok).toBe(true);
    b.run({ type: 'end_turn', actorId: 'A' });
    b.run({ type: 'end_turn', actorId: 'B' });
    const again = b.run({ type: 'cast_spell', actorId: 'A', spellName: 'Cure Wounds', targetId: 'A', free: true });
    expect(again.ok).toBe(false);
  });
  it('Divine Intervention olmayan karakterde (seviye 9) reddedilir', () => {
    const b = battle();
    const st = { ...b.state, combatants: { ...b.state.combatants, A: { ...(b.state.combatants.A as Combatant), resources: {}, freeSpells: undefined } } } as BattleState;
    expect(execute(st, { type: 'cast_spell', actorId: 'A', spellName: 'Shield of Faith', targetId: 'A', free: true }, P1, () => 0.5).ok).toBe(false);
  });
});
