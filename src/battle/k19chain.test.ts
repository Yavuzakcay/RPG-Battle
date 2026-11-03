/** Kuyruk 19: Warlock invocation'larının kalanları (anahtar `invocationsK19`, kural sürümü 16). */
import { describe, expect, it } from 'vitest';
import { applyEvents } from './reduce';
import { execute } from './commands';
import { protectorsGiftEvents } from './chainPact';
import { startBattle } from './create';
import { replay } from './reduce';
import { P1, mk } from './fixtures';
import type { BattleEvent, BattleState, Combatant } from './types';

const bite = { name: 'Bite', bonus: 4, damageDice: '1d4+2', damageType: 'piercing', repeat: 1, ranged: false, reachFt: 5, text: 'Bite' };

function arena(kuralSurumu: number, traits: string[], toggles?: Record<string, boolean>) {
  const parts = [
    mk('W', { ownerId: 'p1', hp: 30, maxHp: 30, traits, modifiers: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 3 }, attacksPerAction: 2 }),
    mk('F', { ownerId: 'p1', hp: 5, maxHp: 5, attacks: [bite], summon: { by: 'W', spellId: 'find-familiar', spell: 'Find Familiar', turn: 'own', level: 1, noAttack: true } as Combatant['summon'] }),
    mk('A', { ownerId: 'p1', hp: 20, maxHp: 20 }),
    mk('B', { side: 'enemies', hp: 40, maxHp: 40, ac: 5 }),
  ];
  const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
  const combatants = { ...s0.combatants };
  for (const [id, p] of Object.entries({ W: { col: 3, row: 3 }, F: { col: 5, row: 2 }, A: { col: 2, row: 3 }, B: { col: 5, row: 3 } })) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const state: BattleState = { ...s0, status: 'active', order: ['W', 'F', 'A', 'B'], turnIndex: 0, combatants, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
  return { state, events: [{ type: 'battle_started', state } as BattleEvent] };
}

const attacked = (s: BattleState): BattleState => ({ ...s, combatants: { ...s.combatants, W: { ...(s.combatants.W as Combatant), economy: { ...(s.combatants.W as Combatant).economy, action: true, attacksLeft: 1 } } } });

describe('Kuyruk 19: Pact of the Chain', () => {
  it('sürüm 16: familiar bir saldırının yerine tepkisiyle saldırır', () => {
    const { state } = arena(16, ['pact-of-the-chain']);
    const r = execute(attacked(state), { type: 'familiar_strike', actorId: 'W', targetId: 'B' }, P1, () => 0.9);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.combatants.W?.economy.attacksLeft).toBe(0);
    expect(r.state.combatants.F?.economy.reaction).toBe(true);
    expect(r.events.some((e) => e.type === 'attack_resolved')).toBe(true);
  });
  it('Attack eylemi olmadan, anahtar kapalı ya da sürüm 15: reddedilir', () => {
    expect(execute(arena(16, ['pact-of-the-chain']).state, { type: 'familiar_strike', actorId: 'W', targetId: 'B' }, P1, () => 0.9).ok).toBe(false);
    for (const { state } of [arena(16, ['pact-of-the-chain'], { invocationsK19: false }), arena(15, ['pact-of-the-chain'])])
      expect(execute(attacked(state), { type: 'familiar_strike', actorId: 'W', targetId: 'B' }, P1, () => 0.9).ok).toBe(false);
  });
});

describe('Kuyruk 19: Investment of the Chain Master', () => {
  it('emirsiz familiar saldıramaz; bonus eylemle emir verilince saldırır', () => {
    const { state, events } = arena(16, ['pact-of-the-chain', 'chain-master']);
    const fTurn = { ...state, turnIndex: 1 };
    expect(execute(fTurn, { type: 'monster_attack', actorId: 'F', targetId: 'B', attackIndex: 0 } as never, P1, () => 0.9).ok).toBe(false);
    const o = execute(state, { type: 'familiar_order', actorId: 'W' }, P1, () => 0.5);
    expect(o.ok).toBe(true);
    if (!o.ok) return;
    expect(o.state.combatants.W?.economy.bonus).toBe(true);
    expect(replay([...events, ...o.events])).toEqual(o.state);
    expect(execute({ ...o.state, turnIndex: 1 }, { type: 'monster_attack', actorId: 'F', targetId: 'B', attackIndex: 0 } as never, P1, () => 0.9).ok).toBe(true);
  });
  it('anahtar kapalıyken emir yok', () => {
    expect(execute(arena(16, ['chain-master'], { invocationsK19: false }).state, { type: 'familiar_order', actorId: 'W' }, P1, () => 0.5).ok).toBe(false);
  });
});

const g = (s: BattleState) => applyEvents(s, protectorsGiftEvents(s));

describe('Kuyruk 19: Gift of the Protectors', () => {
  it('savaş başında CHA kadar dosta yazılır (sürüm 16); kapalıda yok', () => {
    const on = g(arena(16, ['gift-of-the-protectors']).state);
    const gifted = Object.values(on.combatants).filter((c) => c.effects?.some((e) => e.giftOf === 'W'));
    expect(gifted.length).toBe(2); // W ve A (familiar ve düşman sayılmaz)
    for (const s of [g(arena(16, ['gift-of-the-protectors'], { invocationsK19: false }).state), g(arena(15, ['gift-of-the-protectors']).state)])
      expect(Object.values(s.combatants).some((c) => c.effects?.some((e) => e.giftOf))).toBe(false);
  });
  it('biri 0 HP\'ye düşünce 1 HP\'de kalır; armağan herkesten düşer', () => {
    const s = g(arena(16, ['gift-of-the-protectors']).state);
    const bolt = { label: 'Yay', attackBonus: 30, damage: '10d10', damageType: 'piercing', ranged: true, rangeFt: 80, spell: false, tag: 'x' };
    const r = execute({ ...s, turnIndex: 3 }, { type: 'attack', actorId: 'B', targetId: 'A', option: bolt }, { playerId: 'gm', isGm: true }, () => 0.6);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.combatants.A?.hp).toBe(1);
    expect(Object.values(r.state.combatants).some((c) => c.effects?.some((e) => e.giftOf))).toBe(false);
    expect(r.state.combatants.W?.resources['protectors-gift']).toBe(0);
  });
});

describe('Kuyruk 19: Gaze of Two Minds', () => {
  it('bitişik dosta bağlanır (bonus eylem); uzaktakine ilk bağ olmaz', () => {
    const { state } = arena(16, ['gaze-of-two-minds']);
    const r = execute(state, { type: 'gaze', actorId: 'W', targetId: 'A' }, P1, () => 0.5);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.combatants.W?.effects?.some((e) => e.gazeAt === 'A')).toBe(true);
    expect(execute(state, { type: 'gaze', actorId: 'W', targetId: 'F' }, P1, () => 0.5).ok).toBe(false);
    expect(execute(arena(15, ['gaze-of-two-minds']).state, { type: 'gaze', actorId: 'W', targetId: 'A' }, P1, () => 0.5).ok).toBe(false);
  });
});

describe('Kuyruk 19: Pact of the Tome ve Lessons of the First Ones (oluşturucu)', () => {
  it('Tome iki ritüel ister ve kite geçer; Lessons feat\'i sheetFeats\'e girer', async () => {
    const { invocationKit, invocationProblems, TOME_RITUALS } = await import('../rules/invocations');
    const { sheetFeats } = await import('../rules/advancement');
    const [r1, r2] = TOME_RITUALS();
    expect(r1 && r2).toBeTruthy();
    expect(invocationKit('warlock', 3, [`pact-of-the-tome:${r1}|${r2}`]).rituals).toEqual([r1, r2]);
    expect(invocationProblems('warlock', 3, ['pact-of-the-tome', 'agonizing-blast:eldritch-blast', 'repelling-blast:eldritch-blast']).some((p) => p.includes('ritüel'))).toBe(true);
    expect(sheetFeats({ invocations: ['lessons-of-the-first-ones:alert'] })).toContain('alert');
  });
});
