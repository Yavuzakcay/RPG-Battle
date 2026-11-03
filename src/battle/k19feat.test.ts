/** Kuyruk 19 (0b): sınıf özelliklerinin kalanları (anahtar `featuresK19`, kural sürümü 16). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { P1, mk } from './fixtures';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';
import type { Rng } from '../rules/dice';

const claw = { name: 'Claw', bonus: 30, damageDice: '1d4', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: 'Claw' };
const fist: AttackOption = { label: 'Unarmed Strike', attackBonus: 30, damage: '1d4+3', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'unarmed', weaponId: 'unarmed-strike', reachFt: 5 };

/** A (parti), B (düşman, bitişik), C (dost). */
function arena(ver: number, a: Partial<Combatant>, toggles?: Record<string, boolean>, b: Partial<Combatant> = {}) {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, attacksPerAction: 1, weaponOptions: [fist], ...a }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, attacks: [claw], saves: { str: -5, dex: -5, con: -5, int: 0, wis: 0, cha: 0 }, ...b }),
    mk('C', { ownerId: 'p1', hp: 20, maxHp: 20 }),
  ];
  const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: ver, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
  const combatants = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: { col: 4, row: 3 }, B: { col: 5, row: 3 }, C: { col: 1, row: 3 } })) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const state: BattleState = { ...s0, status: 'active', round: 1, order: ['A', 'B', 'C'], turnIndex: 0, combatants, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
  return new Run(state);
}
class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, rng: Rng = () => 0.5, ctx = P1) { const r = execute(this.state, cmd, ctx, rng); if (!r.ok) throw new Error(r.error); this.state = r.state; this.events.push(...r.events); return r.events; }
  try(cmd: Command, rng: Rng = () => 0.5) { const r = execute(this.state, cmd, P1, rng); return r.ok ? null : r.error; }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
const OFF = { featuresK19: false };

describe('Kuyruk 19: serbest kayma (Tactical Shift)', () => {
  it('sürüm 16: Second Wind yarı hız bütçesi açar; kayma fırsat saldırısı tetiklemez, hareketten düşmez', () => {
    const r = arena(16, { traits: ['tactical-shift'], resources: { secondWind: 1 } as Combatant['resources'] });
    r.do({ type: 'second_wind', actorId: 'A' });
    expect(r.c('A').economy.shiftLeft).toBe(3);
    const evs = r.do({ type: 'shift_move', actorId: 'A', to: { col: 2, row: 3 } });
    expect(evs.some((e) => e.type === 'attack_resolved')).toBe(false);
    expect(r.c('A').movementUsed).toBe(0);
    expect(r.c('A').economy.shiftLeft).toBe(1);
    expect(r.c('A').economy.disengaged).toBe(false);
    r.replays();
  });
  it('anahtar kapalı ya da sürüm 15: eski yaklaşım (Disengage)', () => {
    for (const r of [arena(16, { traits: ['tactical-shift'], resources: { secondWind: 1 } as Combatant['resources'] }, OFF), arena(15, { traits: ['tactical-shift'], resources: { secondWind: 1 } as Combatant['resources'] })]) {
      r.do({ type: 'second_wind', actorId: 'A' });
      expect(r.c('A').economy.disengaged).toBe(true);
      expect(r.c('A').economy.shiftLeft).toBeUndefined();
      expect(r.try({ type: 'shift_move', actorId: 'A', to: { col: 2, row: 3 } })).not.toBeNull();
    }
  });
});

describe('Kuyruk 19: Grapple ve Grappler', () => {
  it('Grapple: Attack eyleminde bir saldırı, başarısız save Grappled (kaçış DC = 8 + STR + PB)', () => {
    const r = arena(16, { modifiers: { str: 3, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } });
    r.do({ type: 'grapple', actorId: 'A', targetId: 'B' }, () => 0.1);
    expect(r.c('B').conditions).toContain('Grappled');
    expect(r.c('B').grapple).toMatchObject({ by: 'A', escapeDc: 13 });
    expect(r.c('A').economy.action).toBe(true);
    r.replays();
  });
  it('Martial Arts geçerliyken DC DEX ile', () => {
    const r = arena(16, { bonusStrike: {} as Combatant['bonusStrike'], modifiers: { str: 0, dex: 4, con: 0, int: 0, wis: 0, cha: 0 } });
    r.do({ type: 'grapple', actorId: 'A', targetId: 'B' }, () => 0.1);
    expect(r.c('B').grapple?.escapeDc).toBe(14);
  });
  it('Grappler: Punch and Grab (hasar + yakalama, turda bir) ve yakaladığına avantaj', () => {
    const r = arena(16, { traits: ['grappler'], attacksPerAction: 2, modifiers: { str: 3, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } });
    const evs = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: fist, grab: true }, () => 0.1);
    expect(evs.some((e) => e.type === 'attack_resolved' && e.hit)).toBe(true);
    expect(r.c('B').conditions).toContain('Grappled');
    const second = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: fist, grab: true }, () => 0.1);
    const atk = second.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(atk.mode).toBe('advantage');
    r.replays();
  });
  it('anahtar kapalı ya da sürüm 15: Grapple komutu yok, Punch and Grab yakalamaz', () => {
    for (const r of [arena(16, { traits: ['grappler'] }, OFF), arena(15, { traits: ['grappler'] })]) {
      expect(r.try({ type: 'grapple', actorId: 'A', targetId: 'B' })).not.toBeNull();
      r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: fist, grab: true }, () => 0.1);
      expect(r.c('B').conditions).not.toContain('Grappled');
    }
  });
});

describe('Kuyruk 19: Cunning Strike', () => {
  const rogue = { traits: ['cunning-strike', 'devious-strikes', 'poisoners-kit'], sneakAttackDice: 7, modifiers: { str: 0, dex: 4, con: 0, int: 0, wis: 0, cha: 0 }, proficiency: 4 };
  it('Poison: Poisoner\'s Kit ile CON save, Poisoned (save ends); sürüm 15\'te reddedilir', () => {
    const r = arena(16, rogue);
    r.state = { ...r.state, combatants: { ...r.state.combatants, C: { ...r.c('C'), pos: { col: 6, row: 3 } } } };
    r.events = [{ type: 'battle_started', state: r.state }];
    const dagger = { ...fist, label: 'Dagger', weaponId: 'dagger', finesse: true } as AttackOption;
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: dagger, cunning: ['poison'] }, () => 0.1);
    expect(r.c('B').conditions).toContain('Poisoned');
    expect(r.c('B').conditionTimers?.some((t) => t.condition === 'Poisoned' && t.save?.ability === 'con')).toBe(true);
    r.replays();
    expect(arena(15, rogue).try({ type: 'attack', actorId: 'A', targetId: 'B', option: fist, cunning: ['poison'] })).toMatch(/Poison/);
  });
  it('Knock Out: hasar alınca Unconscious biter (sürüm 16); sürüm 15\'te sürer', async () => {
    const { cunningEvents } = await import('./classTraits');
    const { applyEvents } = await import('./reduce');
    for (const [ver, wakes] of [[16, true], [15, false]] as const) {
      const r = arena(ver, rogue);
      const ko = cunningEvents(r.state, r.c('A'), r.c('B'), ['knock-out'], () => 0.01);
      let s = applyEvents(r.state, ko);
      expect(s.combatants.B?.conditions).toContain('Unconscious');
      const hit = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: fist }, P1, () => 0.5);
      if (!hit.ok) throw new Error(hit.error);
      expect(hit.state.combatants.B?.conditions.includes('Unconscious')).toBe(!wakes);
    }
  });
});

describe('Kuyruk 19: Alert (Initiative Swap)', () => {
  it('1. turda, ikisi de oynamamışken sıra ve inisiyatif değişir; ikinci kez olmaz', () => {
    const r = arena(16, { traits: ['alert'] });
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), initiative: 18 }, C: { ...r.c('C'), initiative: 5 } } };
    r.events = [{ type: 'battle_started', state: r.state }];
    r.do({ type: 'initiative_swap', actorId: 'A', allyId: 'C' });
    expect(r.state.order).toEqual(['C', 'B', 'A']);
    expect(r.c('A').initiative).toBe(5);
    expect(r.c('C').initiative).toBe(18);
    expect(r.try({ type: 'initiative_swap', actorId: 'A', allyId: 'C' })).not.toBeNull();
    r.replays();
  });
  it('anahtar kapalı ya da sürüm 15: yok', () => {
    for (const r of [arena(16, { traits: ['alert'] }, OFF), arena(15, { traits: ['alert'] })]) expect(r.try({ type: 'initiative_swap', actorId: 'A', allyId: 'C' })).not.toBeNull();
  });
});
