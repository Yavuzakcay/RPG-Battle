/**
 * F1: Savage Attacker (SRD 5.2.1: "Once per turn when you hit a target with a weapon, you can roll the weapon's damage
 * dice twice and use either roll"). Turda bir kez, yalnızca silah; büyük olan kullanılır; ikinci atış zar defterine
 * yazılır (elle zarda ayrıca istenir); replay aynı durumu verir.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './index';
import { replay } from './reduce';
import { startBattle, combatantFromSheet } from './create';
import { envId, mk, scripted, sword, P1 } from './fixtures';
import type { BattleState, Command } from './types';
import { askFor, newBook, runWithDice } from '../rules/manualDice';
import { blankCharacter } from '../rules/builder';
import { resolveAttack } from '../rules/attack';

function arena() {
  const parts = [mk('A', { ownerId: 'p1', initiativeBonus: 5, traits: ['savage-attacker'] }), mk('B', { side: 'enemies', hp: 60, maxHp: 60 })];
  const r = startBattle('s', envId('Düz'), parts, scripted([20, 15], [20, 5]));
  return { state: r.state, events: r.events };
}
const hit = (s: BattleState, ...rolls: Array<[number, number]>) => {
  const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, scripted([20, 15], ...rolls));
  if (!r.ok) throw new Error(r.error);
  return r;
};

describe('Savage Attacker', () => {
  it('çekirdek: iki hasar atışı, büyüğü; işaret yoksa tek atış', () => {
    const one = resolveAttack({ attackBonus: 5, targetAc: 10, mode: 'normal', damage: '1d8+3' }, scripted([20, 15], [8, 2]));
    expect(one.damage?.total).toBe(5);
    expect(one.savage).toBeUndefined();
    const two = resolveAttack({ attackBonus: 5, targetAc: 10, mode: 'normal', damage: '1d8+3', savage: true }, scripted([20, 15], [8, 2], [8, 7]));
    expect(two.damage?.total).toBe(10);
    expect(two.savage).toEqual({ rolls: [[2], [7]], totals: [5, 10], kept: 1 });
    const first = resolveAttack({ attackBonus: 5, targetAc: 10, mode: 'normal', damage: '1d8+3', savage: true }, scripted([20, 15], [8, 6], [8, 1]));
    expect(first.damage?.total).toBe(9);
    // Iskada ikinci atış yok.
    const miss = resolveAttack({ attackBonus: 0, targetAc: 30, mode: 'normal', damage: '1d8+3', savage: true }, scripted([20, 5]));
    expect(miss.savage).toBeUndefined();
  });
  it('savaşta turda bir kez: ikinci isabet tek atış; olay ve günlükte iki atış', () => {
    const { state } = arena();
    const a = hit(state, [8, 2], [8, 7]);
    const ev = a.events.find((e) => e.type === 'attack_resolved');
    expect(ev).toMatchObject({ rawDamage: 10, savage: { totals: [5, 10], kept: 1 } });
    // Aynı turda ikinci saldırı (Extra Attack gibi; ekonomi sıfırlanarak).
    const s2 = { ...a.state, combatants: { ...a.state.combatants, A: { ...a.state.combatants.A!, economy: state.combatants.A!.economy } } };
    const b = hit(s2, [8, 2]);
    expect(b.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ rawDamage: 5 });
    expect(b.events.find((e) => e.type === 'attack_resolved' && 'savage' in e && e.savage)).toBeUndefined();
  });
  it('elle zar: ikinci hasar atışı ayrıca istenir ve deftere yazılır; replay aynı', () => {
    const { state, events } = arena();
    const cmd: Command = { type: 'attack', actorId: 'A', targetId: 'B', option: sword };
    const ask = { ask: askFor('everyone', () => true), auto: scripted() };
    const book = newBook();
    const r1 = runWithDice((rng) => execute(state, cmd, P1, rng), book, ask);
    expect(r1.ok ? null : r1.need).toMatchObject({ sides: 20, kind: 'attack' });
    book.entries.push({ group: { sides: 20, count: 1, values: [15] } });
    const r2 = runWithDice((rng) => execute(state, cmd, P1, rng), book, ask);
    expect(r2.ok ? null : r2.need).toMatchObject({ sides: 8, kind: 'damage' });
    book.entries.push({ group: { sides: 8, count: 1, values: [3] } });
    const r3 = runWithDice((rng) => execute(state, cmd, P1, rng), book, ask);
    expect(r3.ok ? null : r3.need).toMatchObject({ sides: 8, kind: 'damage' });
    book.entries.push({ group: { sides: 8, count: 1, values: [6] } });
    const r4 = runWithDice((rng) => execute(state, cmd, P1, rng), book, ask);
    expect(r4.ok).toBe(true);
    if (!r4.ok || !r4.value.ok) return;
    expect(r4.value.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ rawDamage: 9, savage: { totals: [6, 9], kept: 1 } });
    expect(replay([...events, ...r4.value.events])).toEqual(r4.value.state);
  });
  it('feat veriden işarete: Soldier geçmişi (Savage Attacker) savaşçıya trait verir', () => {
    const sheet = { ...blankCharacter('s').sheet, name: 'Asker', backgroundId: 'soldier' };
    expect(combatantFromSheet(sheet, { id: 'A', ownerId: 'p1' }).traits).toContain('savage-attacker');
    expect(combatantFromSheet(blankCharacter('s').sheet, { id: 'A', ownerId: 'p1' }).traits ?? []).not.toContain('savage-attacker');
  });
});
