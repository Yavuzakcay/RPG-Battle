/**
 * Görev A2: engelden geçme. Etkiyle (`phase`) ya da canavar özelliğiyle (Incorporeal Movement) duvar ve yaratık
 * altıgenlerinden geçilir; yürüyüş boş ve geçilebilir altıgende biter; Incorporeal Movement'ta geçilen altıgenler
 * zorlu zemin; yapay zekâ duvarın arkasındaki hedefe duvarın içinden yürür.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { chooseCommand } from './ai';
import { monsterPhase, phaseOf } from './phase';
import { P1, mk } from './fixtures';
import type { Offset } from '../rules/hex';
import type { AttackOption, BattleEvent, BattleState, Combatant } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const sword: AttackOption = { label: 'Longsword', attackBonus: 4, damage: '1d8+2', damageType: 'slashing', ranged: false, spell: false,
  tag: 'longsword', weaponId: 'longsword', weaponDamage: '1d8', abilityMod: 2 };
const claw = { name: 'Claw', bonus: 4, damageDice: '1d6+2', damageType: 'necrotic', repeat: 1, ranged: false, reachFt: 5, text: '' };
const PHASE = { id: 'test-phase', name: 'Geçiş', sourceId: 'A', phase: {} };

/** 15×7 harita; 5. sütun baştan sona duvar ('s'). */
function arena(a: Partial<Combatant> = {}, b: Partial<Combatant> = {}, posB = o(9, 3), order = ['A', 'B']) {
  const parts = [mk('A', { ownerId: 'p1', speed: 30, weaponOptions: [sword], ...a }), mk('B', { side: 'enemies', hp: 40, maxHp: 40, attacks: [claw], ...b })];
  const started = startBattle('a2', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } });
  const combatants = { ...started.state.combatants };
  combatants.A = { ...(combatants.A as Combatant), pos: o(3, 3) };
  combatants.B = { ...(combatants.B as Combatant), pos: posB };
  const tiles = Array.from({ length: 7 }, () => '.....s.........');
  return { ...started.state, status: 'active', order, turnIndex: 0, combatants,
    map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles } } as BattleState;
}
const move = (s: BattleState, id: string, to: Offset) => execute(s, { type: 'move', actorId: id, to }, P1, () => 0.5);
const moved = (r: ReturnType<typeof move>) => (r.ok ? r.events.find((e) => e.type === 'moved') as Extract<BattleEvent, { type: 'moved' }> : undefined);

describe('engelden geçme', () => {
  it('veride: Incorporeal Movement zorlu zemin sayılır; etki ve özellik birlikteyse serbest olan geçerli', () => {
    expect(monsterPhase('Uçma 40 ft. Ethereal Sight, Incorporeal Movement.')).toEqual({ difficult: true });
    expect(monsterPhase('Pack Tactics')).toBeUndefined();
    expect(phaseOf({ effects: [] })).toBeNull();
    expect(phaseOf({ phase: { difficult: true }, effects: [PHASE] })).toEqual({ difficult: false });
  });
  it('duvardan geçme: etkisiz yol yok; etkiyle duvarın içinden geçer', () => {
    expect(move(arena(), 'A', o(7, 3)).ok).toBe(false);
    const r = move(arena({ effects: [PHASE] }), 'A', o(7, 3));
    const ev = moved(r);
    expect(ev?.path.some((h) => h.col === 5)).toBe(true);
    expect(ev?.cost).toBe(4);
    if (r.ok) expect(r.state.combatants.A!.pos).toEqual(o(7, 3));
  });
  it('bitiş geçerli olmalı: duvar ya da dolu altıgende durulmaz; yaratığın içinden geçilir', () => {
    const s = arena({ effects: [PHASE] }, {}, o(6, 3));
    expect(move(s, 'A', o(5, 3)).ok).toBe(false);
    expect(move(s, 'A', o(6, 3)).ok).toBe(false);
    const through = moved(move(s, 'A', o(7, 3)));
    expect(through?.path.at(-1)).toEqual(o(7, 3));
  });
  it('Incorporeal Movement: geçilen duvar altıgeni zorlu zemin (2)', () => {
    const r = move(arena({ phase: { difficult: true } }), 'A', o(7, 3));
    expect(moved(r)?.cost).toBe(5);
  });
  it('yapay zekâ: duvarın arkasındaki hedefe duvarın içinden yürüyüp saldırır', () => {
    const s = arena({ hp: 30, maxHp: 30 }, { phase: { difficult: true }, speed: 40 }, o(7, 3), ['B', 'A']);
    const cmd = chooseCommand(s);
    expect(cmd.type).toBe('move');
    const r = execute(s, cmd, { playerId: 'gm', isGm: true }, () => 0.5);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const at = r.state.combatants.B!.pos as Offset;
    expect(at.col).toBeLessThan(5);
    expect(r.state.map!.tiles[at.row]![at.col]).not.toBe('s');
  });
});
