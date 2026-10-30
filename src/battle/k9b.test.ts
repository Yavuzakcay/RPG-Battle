/**
 * Görev K9b: yukarı slot ölçeklenmesi. Zar artışı (Guiding Bolt, Cure Wounds), ek hedef (Enhance Ability), alan yarıçapı
 * (Fog Cloud), patlama zarı (Ice Knife), Dragon's Breath, Magic Weapon bonus eşikleri, Bestow Curse süre/konsantrasyon.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { P1, mk } from './fixtures';
import { replay } from './reduce';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high = () => 0.99;
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };

function arena(names: string[]) {
  const a = mk('A', { ownerId: 'p1', spellNames: names, spellSlots: [4, 3, 3, 3, 3, 1, 0, 0, 0], spellAttack: 30, spellSaveDc: 30, spellMod: 3, level: 11, hp: 10, maxHp: 80 });
  const b = mk('B', { side: 'enemies', hp: 500, maxHp: 500, ac: 5, saves: LOW });
  const c = mk('C', { ownerId: 'p1', hp: 20, maxHp: 20 });
  const st = startBattle('k9b', 'd-z-zemin', [a, b, c], () => 0.5, { map: { id: 'col' } }).state;
  const combatants = { ...st.combatants, A: { ...(st.combatants.A as Combatant), pos: o(3, 3) }, B: { ...(st.combatants.B as Combatant), pos: o(4, 3) }, C: { ...(st.combatants.C as Combatant), pos: o(2, 3) } };
  const tiles = Array.from({ length: 7 }, () => '.'.repeat(15));
  return { ...st, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants, map: { ...(st.map as NonNullable<BattleState['map']>), tiles } } as BattleState;
}
function run(state: BattleState, cmd: Command, rng = high): { state: BattleState; events: BattleEvent[] } {
  const r = execute(state, cmd, P1, rng);
  if (!r.ok) throw new Error(r.error);
  return r;
}
const cast = (name: string, slotLevel: number, extra: Partial<Extract<Command, { type: 'cast_spell' }>> = {}, rng = high) =>
  run(arena([name]), { type: 'cast_spell', actorId: 'A', spellName: name, slotLevel, ...extra }, rng);
const rollsOf = (ev: BattleEvent[]) => (ev.find((e) => e.type === 'attack_resolved' || e.type === 'save_resolved') as { damageRolls: number[] }).damageRolls.length;

describe('zar ve hedef', () => {
  it('Guiding Bolt 4d6, slot başına +1d6; Cure Wounds 2d8, slot başına +2d8', () => {
    // Orta zar: isabet ama kritik değil (kritikte zar iki kat).
    expect(rollsOf(cast('Guiding Bolt', 1, { targetId: 'B' }, () => 0.5).events)).toBe(4);
    expect(rollsOf(cast('Guiding Bolt', 3, { targetId: 'B' }, () => 0.5).events)).toBe(6);
    const heal = (lv: number) => (cast('Cure Wounds', lv, { targetId: 'A' }).events.find((e) => e.type === 'healed') as { amount: number }).amount;
    expect(heal(1)).toBe(16 + 3);
    expect(heal(2)).toBe(32 + 3);
  });
  it('Enhance Ability: 2. slotta 1, 3. slotta 2 hedef', () => {
    const s = arena(['Enhance Ability']);
    expect(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Enhance Ability', targetIds: ['A', 'C'], slotLevel: 2 }, P1, high).ok).toBe(false);
    expect(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Enhance Ability', targetIds: ['A', 'C'], slotLevel: 3 }, P1, high).ok).toBe(true);
  });
});

describe('özel ölçeklenmeler', () => {
  it('Fog Cloud: yukarı slotta yarıçap +20 ft (daha çok altıgen)', () => {
    const hexes = (lv: number) => (cast('Fog Cloud', lv, { targetHex: o(7, 3) }).events.find((e) => e.type === 'zone_created') as { zone: { hexes: Offset[] } }).zone.hexes.length;
    expect(hexes(2)).toBeGreaterThan(hexes(1));
  });
  it('Ice Knife: patlamanın cold zarı 2d6, slot başına +1d6', () => {
    const burstRolls = (lv: number) => (cast('Ice Knife', lv, { targetId: 'B' }).events.filter((e) => e.type === 'save_resolved').pop() as { damageRolls: number[] }).damageRolls.length;
    expect(burstRolls(1)).toBe(2);
    expect(burstRolls(3)).toBe(4);
  });
  it('Dragon\'s Breath: nefes 3d6, slot başına +1d6 (tekrarda da)', () => {
    const r = cast("Dragon's Breath", 3, { targetId: 'A' });
    const f = run(r.state, { type: 'spell_followup', actorId: 'A', targetId: 'B' });
    expect((f.events.find((e) => e.type === 'save_resolved') as { damageRolls: number[] }).damageRolls.length).toBe(4);
  });
  it('Magic Weapon: 2. slotta +1, 3–5. slotta +2, 6. slotta +3', () => {
    const bonus = (lv: number) => (cast('Magic Weapon', lv).events.find((e) => e.type === 'buff_added') as { buff: { attackBonus: number; damageBonus: number } }).buff;
    expect(bonus(2)).toMatchObject({ attackBonus: 1, damageBonus: 1 });
    expect(bonus(3)).toMatchObject({ attackBonus: 2, damageBonus: 2 });
    expect(bonus(5)).toMatchObject({ attackBonus: 2 });
    expect(bonus(6)).toMatchObject({ attackBonus: 3, damageBonus: 3 });
  });
  it('Bestow Curse: 3. slot 1 dk konsantrasyon, 4. slot 10 dk, 5. slot 8 saat konsantrasyonsuz; replay aynı', () => {
    const curse = (lv: number) => {
      const r = cast('Bestow Curse', lv, { targetIds: ['B'], choice: 'wis' });
      return { fx: r.state.combatants.B?.effects?.find((e) => e.name === 'Bestow Curse'), conc: r.state.combatants.A?.concentration, r };
    };
    const c3 = curse(3); expect(c3.fx).toMatchObject({ until: c3.r.state.round + 9, concentration: 'Bestow Curse' }); expect(c3.conc?.spell).toBe('Bestow Curse');
    const c4 = curse(4); expect(c4.fx).toMatchObject({ until: c4.r.state.round + 99, concentration: 'Bestow Curse' });
    const c5 = curse(5); expect(c5.fx?.until).toBe(c5.r.state.round + 4799); expect(c5.fx?.concentration).toBeUndefined(); expect(c5.conc).toBeNull();
    expect(replay([{ type: 'battle_started', state: arena(['Bestow Curse']) }, ...c5.r.events])).toEqual(c5.r.state);
  });
});
