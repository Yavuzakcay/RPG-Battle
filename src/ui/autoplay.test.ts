import { describe, it, expect } from 'vitest';
import { createDemoSession } from '../demo';
import { scripted } from '../battle/fixtures';
import { autoplayEnemyTurns, chooseEnemyCommand } from './autoplay';
import { dispatch } from './session';

/** Sıra: Troll (19), Mira (13), Bor (6), Wolf 1 (5), Wolf 2 (4). */
const demo = (scenario: 'standart' | 'dusuk-hp' = 'standart') =>
  createDemoSession(scripted([20, 10], [20, 5], [20, 18], [20, 3], [20, 2]), scenario);

/** Sürekli aynı değeri veren zar üretici. */
const always = (u: number) => () => u;

describe('chooseEnemyCommand', () => {
  it('Troll: Multiattack ile en düşük HP oranlı hedefi seçer', () => {
    // Mira 6/32 (%19), Bor 10/54 (%18,5): Bor oran olarak daha düşük.
    const s = demo('dusuk-hp');
    const cmd = chooseEnemyCommand(s.state);
    expect(cmd.type).toBe('multiattack');
    if (cmd.type === 'multiattack') expect(cmd.targetId).toBe('bor');
  });
  it('oyuncu sırasında turu bitirir', () => {
    const s = dispatch(demo(), { type: 'end_turn', actorId: 'troll' }, scripted());
    expect(chooseEnemyCommand(s.state).type).toBe('end_turn');
  });
  it('Wolf: ilk hasar saldırısını seçer', () => {
    let s = demo();
    s = { ...s, state: { ...s.state, turnIndex: s.state.order.indexOf('wolf1') } };
    const cmd = chooseEnemyCommand(s.state);
    expect(cmd.type).toBe('monster_attack');
  });
});

describe('autoplayEnemyTurns', () => {
  it('Troll oynar ve sıra bir oyuncuya geçer', () => {
    const s = autoplayEnemyTurns(demo(), always(0.7));
    expect(s.error).toBe(null);
    const current = s.state.combatants[s.state.order[s.state.turnIndex] ?? ''];
    expect(current?.side).toBe('party');
    expect(s.lines.length).toBeGreaterThan(demo().lines.length);
  });
  it('oyuncu sırasında hiçbir şey yapmaz', () => {
    const s = dispatch(demo(), { type: 'end_turn', actorId: 'troll' }, scripted());
    expect(autoplayEnemyTurns(s, always(0.7))).toBe(s);
  });
  it('düşük HP senaryosunda tam isabetle savaş sona erebilir', () => {
    let s = demo('dusuk-hp');
    for (let i = 0; i < 6 && s.state.status === 'active'; i++) {
      s = autoplayEnemyTurns(s, always(0.95));
      if (s.state.status !== 'active') break;
      const id = s.state.order[s.state.turnIndex] ?? '';
      s = dispatch(s, { type: 'end_turn', actorId: id }, always(0.95));
    }
    expect(s.state.status).toBe('finished');
    expect(s.state.winner).toBe('enemies');
  });
});

describe('GM HP ayarı', () => {
  it('düşmanın HP’sini değiştirir ve sınırlar', () => {
    let s = dispatch(demo(), { type: 'adjust_hp', targetId: 'troll', hp: 10 }, scripted());
    expect(s.error).toBe(null);
    expect(s.state.combatants.troll?.hp).toBe(10);
    s = dispatch(s, { type: 'adjust_hp', targetId: 'troll', hp: 9999 }, scripted());
    expect(s.state.combatants.troll?.hp).toBe(s.state.combatants.troll?.maxHp);
    s = dispatch(s, { type: 'adjust_hp', targetId: 'troll', hp: -5 }, scripted());
    expect(s.state.combatants.troll?.hp).toBe(0);
  });
  it('oyuncu karakteri 0 HP olunca ölmekte sayılır, yükselince ayağa kalkar', () => {
    let s = dispatch(demo(), { type: 'adjust_hp', targetId: 'bor', hp: 0 }, scripted());
    expect(s.state.combatants.bor?.life).toBe('dying');
    expect(s.state.combatants.bor?.conditions).toContain('Unconscious');
    s = dispatch(s, { type: 'adjust_hp', targetId: 'bor', hp: 5 }, scripted());
    expect(s.state.combatants.bor?.life).toBe('alive');
    expect(s.state.combatants.bor?.conditions).not.toContain('Unconscious');
  });
  it('oyuncu yetkisiyle reddedilir (execute doğrudan)', async () => {
    const { execute } = await import('../battle');
    const r = execute(demo().state, { type: 'adjust_hp', targetId: 'troll', hp: 1 }, { playerId: 'p1', isGm: false }, scripted());
    expect(r.ok).toBe(false);
  });
  it('günlüğe satır yazar', () => {
    const s = dispatch(demo(), { type: 'adjust_hp', targetId: 'troll', hp: 10 }, scripted());
    expect(s.lines[s.lines.length - 1]).toBe('Troll: HP elle ayarlandı → 10.');
  });
});

describe('senaryolar', () => {
  it('düşük HP senaryosunda Mira 6, Bor 10 HP ile başlar', () => {
    const s = demo('dusuk-hp');
    expect(s.state.combatants.mira?.hp).toBe(6);
    expect(s.state.combatants.bor?.hp).toBe(10);
    expect(demo().state.combatants.mira?.hp).toBe(32);
  });
});
