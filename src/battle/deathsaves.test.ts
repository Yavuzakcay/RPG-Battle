import { describe, it, expect } from 'vitest';
import { execute, replay, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './index';
import type { Rng } from '../rules/dice';
import { GM, P1, P2, dice, envId, mk, scripted, sword, zero } from './fixtures';

/** Sıra: E (düşman), A (oyuncu 1), C (oyuncu 2). */
function scene(a: Partial<Combatant> = {}, c: Partial<Combatant> = {}): BattleState {
  const parts = [
    mk('E', { side: 'enemies', hp: 40, maxHp: 40 }),
    mk('A', { ownerId: 'p1', ...a }),
    mk('C', { ownerId: 'p2', ...c }),
  ];
  return startBattle('b', envId('Düz'), parts, scripted([20, 20], [20, 10], [20, 2])).state;
}
const dyingA: Partial<Combatant> = { hp: 0, life: 'dying', conditions: ['Unconscious'] };

function ok(r: ReturnType<typeof execute>) {
  if (!r.ok) throw new Error(r.error);
  return r;
}
const run = (s: BattleState, cmd: Command, ctx: CommandContext, rng: Rng = scripted()) => execute(s, cmd, ctx, rng);
const endTurn = (actorId: string): Command => ({ type: 'end_turn', actorId });
const hitA = (option = sword): Command => ({ type: 'attack', actorId: 'E', targetId: 'A', option });
const types = (events: BattleEvent[]) => events.map((e) => e.type);

describe('0 HP\'ye düşme', () => {
  it('karakter ölmez, ölmekte olur ve bilincini kaybeder', () => {
    const r = ok(run(scene({ hp: 5, maxHp: 20 }), hitA(), GM, scripted([20, 15], [8, 6])));
    const a = r.state.combatants.A;
    expect(a?.hp).toBe(0);
    expect(a?.life).toBe('dying');
    expect(a?.conditions.includes('Unconscious')).toBe(true);
    expect(a?.deathSaves).toEqual({ successes: 0, failures: 0 });
  });
  it('kalan hasar maksimum HP\'ye eşit veya fazlaysa anında ölür', () => {
    const big = { ...sword, damage: '1d8+10' };
    const r = ok(run(scene({ hp: 5, maxHp: 10 }), hitA(big), GM, scripted([20, 15], [8, 8])));
    expect(r.state.combatants.A?.life).toBe('dead');
  });
  it('düşmanlar 0 HP\'de ölmekte olmaz', () => {
    const s = ok(run(scene(), endTurn('E'), GM)).state; // sıra A'da (E: 40 HP, hasar sonrası 0 HP için ayarlı)
    const weak = { ...s, combatants: { ...s.combatants, E: { ...mk('E', { side: 'enemies', hp: 5, maxHp: 40 }) } } };
    const r = ok(run(weak, { type: 'attack', actorId: 'A', targetId: 'E', option: sword }, P1, scripted([20, 15], [8, 6])));
    expect(r.state.combatants.E?.life).toBe('alive');
    expect(r.state.combatants.E?.hp).toBe(0);
  });
});

describe('ölmekte olana hasar', () => {
  it('her isabet bir başarısız save, kritik iki sayılır, üçte ölür', () => {
    const ranged = { ...sword, ranged: true };
    const one = ok(run(scene(dyingA), hitA(ranged), GM, scripted([20, 15], [8, 2])));
    expect(one.state.combatants.A?.deathSaves.failures).toBe(1);
    // Bilinci kapalı hedefe yakından isabet kritik sayılır: iki başarısızlık.
    const melee = ok(run(scene(dyingA), hitA(), GM, scripted([20, 15], [8, 2], [8, 2])));
    expect(melee.state.combatants.A?.deathSaves.failures).toBe(2);
    const crit = ok(run(scene(dyingA), hitA(), GM, scripted([20, 20], [8, 2], [8, 2])));
    expect(crit.state.combatants.A?.deathSaves.failures).toBe(2);
    expect(crit.state.combatants.A?.life).toBe('dying');
    const third = ok(run(scene({ ...dyingA, deathSaves: { successes: 0, failures: 2 } }), hitA(), GM, scripted([20, 15], [8, 2])));
    expect(third.state.combatants.A?.life).toBe('dead');
  });
  it('maksimum HP kadar hasar anında öldürür', () => {
    const big = { ...sword, damage: '1d8+10' };
    const r = ok(run(scene({ ...dyingA, maxHp: 10 }), hitA(big), GM, scripted([20, 15], [8, 2])));
    expect(r.state.combatants.A?.life).toBe('dead');
  });
});

describe('ölüm save\'i (tur başında)', () => {
  it('başarı sayılır, ölmekte olan oynayamaz ve sıra atlanır', () => {
    const r = ok(run(scene(dyingA), endTurn('E'), GM, scripted([20, 12])));
    expect(types(r.events)).toEqual(['turn_ended', 'death_save', 'turn_ended']);
    expect(r.state.combatants.A?.deathSaves).toEqual({ successes: 1, failures: 0 });
    expect(r.state.order[r.state.turnIndex]).toBe('C');
  });
  it('doğal 20: 1 HP ile ayağa kalkar ve o tur oynar', () => {
    const r = ok(run(scene(dyingA), endTurn('E'), GM, scripted([20, 20])));
    const a = r.state.combatants.A;
    expect(a?.hp).toBe(1);
    expect(a?.life).toBe('alive');
    expect(a?.conditions.includes('Unconscious')).toBe(false);
    expect(r.state.order[r.state.turnIndex]).toBe('A');
  });
  it('doğal 1 iki başarısızlık sayılır, üçüncüde ölür', () => {
    const r = ok(run(scene({ ...dyingA, deathSaves: { successes: 0, failures: 1 } }), endTurn('E'), GM, scripted([20, 1])));
    expect(r.state.combatants.A?.life).toBe('dead');
    const mid = ok(run(scene(dyingA), endTurn('E'), GM, scripted([20, 1])));
    expect(mid.state.combatants.A?.deathSaves.failures).toBe(2);
    expect(mid.state.combatants.A?.life).toBe('dying');
  });
  it('üç başarıda stabil olur ve artık save atmaz', () => {
    const s = scene({ ...dyingA, deathSaves: { successes: 2, failures: 0 } });
    const first = ok(run(s, endTurn('E'), GM, scripted([20, 14])));
    expect(first.state.combatants.A?.life).toBe('stable');
    // sıra C'de: C ve ardından E'nin turu geçince A'ya sıra gelmez (stabil atlanır)
    const second = ok(run(first.state, endTurn('C'), P2));
    const third = ok(run(second.state, endTurn('E'), GM));
    expect(types(third.events).includes('death_save')).toBe(false);
    expect(third.state.order[third.state.turnIndex]).toBe('C');
  });
});

describe('iyileştirme ve stabilize', () => {
  const healer = { spellNames: ['Cure Wounds'], spellSlots: [4, 0, 0, 0, 0, 0, 0, 0, 0], spellMod: 3, level: 3 };
  it('iyileştirilen karakter ayağa kalkar, Unconscious kalkar, save sayaçları sıfırlanır', () => {
    let s = ok(run(scene({ ...dyingA, deathSaves: { successes: 1, failures: 1 } }, healer), endTurn('E'), GM, scripted([20, 12]))).state;
    expect(s.order[s.turnIndex]).toBe('C');
    const r = ok(run(s, { type: 'cast_spell', actorId: 'C', spellName: 'Cure Wounds', targetId: 'A' }, P2, scripted([8, 4])));
    s = r.state;
    const a = s.combatants.A;
    expect(a?.hp).toBe(7);
    expect(a?.life).toBe('alive');
    expect(a?.conditions.includes('Unconscious')).toBe(false);
    expect(a?.deathSaves).toEqual({ successes: 0, failures: 0 });
  });
  it('stabilize: başarılıysa stabil olur, başarısızsa ölmekte kalır', () => {
    const base = scene(dyingA, { modifiers: { ...zero, wis: 2 } });
    const atC = ok(run(base, endTurn('E'), GM, scripted([20, 12]))).state;
    const good = ok(run(atC, { type: 'stabilize', actorId: 'C', targetId: 'A' }, P2, scripted([20, 8])));
    expect(good.state.combatants.A?.life).toBe('stable'); // 8 + 2 = 10
    const bad = ok(run(atC, { type: 'stabilize', actorId: 'C', targetId: 'A' }, P2, scripted([20, 5])));
    expect(bad.state.combatants.A?.life).toBe('dying'); // 5 + 2 = 7
  });
  it('ölmekte olmayanı veya kendini stabilize edemez', () => {
    const atC = ok(run(scene({}, {}), endTurn('E'), GM)).state; // sıra A'da
    expect(run(atC, { type: 'stabilize', actorId: 'A', targetId: 'C' }, P1).ok).toBe(false);
    expect(run(atC, { type: 'stabilize', actorId: 'A', targetId: 'A' }, P1).ok).toBe(false);
  });
});

describe('yeniden oynatma', () => {
  it('ölüm save\'i olayları baştan oynatılınca aynı durum çıkar', () => {
    const start = startBattle('b', envId('Düz'),
      [mk('E', { side: 'enemies', hp: 40, maxHp: 40 }), mk('A', { ownerId: 'p1', hp: 5, maxHp: 20 }), mk('C', { ownerId: 'p2' })],
      scripted([20, 20], [20, 10], [20, 2]));
    let state = start.state;
    const all: BattleEvent[] = [...start.events];
    const go = (cmd: Command, ctx: CommandContext, rng: Rng) => {
      const r = ok(run(state, cmd, ctx, rng));
      state = r.state;
      all.push(...r.events);
    };
    go(hitA(), GM, scripted([20, 15], [8, 6]));
    go(endTurn('E'), GM, scripted([20, 7]));
    expect(state.combatants.A?.deathSaves.failures).toBe(1);
    go(endTurn('C'), P2, scripted());
    expect(replay(all)).toEqual(state);
    expect(dice(6, 1).length).toBe(1);
  });
});
