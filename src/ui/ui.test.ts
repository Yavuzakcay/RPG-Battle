import { describe, it, expect } from 'vitest';
import { createDemoSession } from '../demo';
import { describeEvent } from './log';
import { contextFor, dispatch } from './session';
import { scripted } from '../battle/fixtures';
import type { BattleEvent } from '../battle';

/** Sıra: Troll (19), Mira (13), Bor (6), Wolf 1 (5), Wolf 2 (4). */
const demo = () => createDemoSession(scripted([20, 10], [20, 5], [20, 18], [20, 3], [20, 2]));

describe('demo savaşı', () => {
  it('kurulum ve ilk sıra', () => {
    const s = demo();
    expect(s.state.order).toEqual(['troll', 'mira', 'bor', 'wolf1', 'wolf2']);
    expect(s.state.combatants.mira?.maxHp).toBe(32);
    expect(s.state.combatants.bor?.ac).toBe(18);
    // Görev F: iki silah + herkesin silahsız vuruşu (1 + STR).
    expect(s.state.combatants.bor?.weaponOptions.length).toBe(3);
    expect(s.lines[0]).toBe('Savaş başladı. Sıra: Troll, Mira, Bor, Wolf 1, Wolf 2.');
  });
});

describe('oturum', () => {
  it('Troll Multiattack: üç satır, yükseklik farkı dezavantaj verir', () => {
    const rng = scripted(
      [20, 15], [20, 16], [6, 3], [6, 2],
      [20, 15], [20, 16], [6, 2], [6, 2],
      [20, 15], [20, 16], [6, 1], [6, 1],
    );
    const s = dispatch(demo(), { type: 'multiattack', actorId: 'troll', targetId: 'mira' }, rng);
    expect(s.error).toBe(null);
    expect(s.lines.length).toBe(1 + 3);
    expect(s.state.combatants.mira?.hp).toBe(9); // 32 - 9 - 8 - 6
    const line = s.lines[1] ?? '';
    expect(line.includes('Troll → Mira: Rend')).toBe(true);
    expect(line.includes('dezavantaj')).toBe(true);
    expect(line.includes('Alçak zemin dezavantajı')).toBe(true);
  });
  it('sırası olmayanın isteği reddedilir, durum ve günlük değişmez', () => {
    const s = demo();
    const r = dispatch(s, { type: 'end_turn', actorId: 'mira' }, scripted());
    expect(r.error).toBe('Sıra bu savaşçıda değil.');
    expect(r.state).toBe(s.state);
    expect(r.lines).toEqual(s.lines);
  });
  it('tur bitirme günlüğe yazılır, hata temizlenir', () => {
    const bad = dispatch(demo(), { type: 'end_turn', actorId: 'mira' }, scripted());
    const good = dispatch(bad, { type: 'end_turn', actorId: 'troll' }, scripted());
    expect(good.error).toBe(null);
    expect(good.lines[good.lines.length - 1]).toBe('Sıra Mira (tur 1).');
  });
  it('contextFor: düşmanı GM, karakteri sahibi yönetir', () => {
    const { state } = demo();
    expect(contextFor(state, 'troll')).toEqual({ playerId: 'gm', isGm: true });
    expect(contextFor(state, 'mira')).toEqual({ playerId: 'p1', isGm: false });
    expect(contextFor(state, 'yok').isGm).toBe(false);
  });
  it('Fireball: save ve hasar satırı', () => {
    let s = dispatch(demo(), { type: 'end_turn', actorId: 'troll' }, scripted());
    const rng = scripted([20, 3], [20, 4], ...Array.from({ length: 8 }, () => [6, 3] as [number, number]));
    s = dispatch(s, { type: 'cast_spell', actorId: 'mira', spellName: 'Fireball', targetId: 'troll' }, rng);
    expect(s.error).toBe(null);
    const text = s.lines.join('\n');
    expect(text.includes('DEX kurtarma zarı')).toBe(true);
    expect(text.includes('başarısız')).toBe(true);
    expect(text.includes('3+3+3+3+3+3+3+3 = 24')).toBe(true);
    expect(s.state.combatants.troll?.hp).toBe(70); // 94 - 24
  });
});

describe('describeEvent', () => {
  const state = demo().state;
  it('ölüm save\'i ve yenilenme olayları', () => {
    const death: BattleEvent = { type: 'death_save', actorId: 'mira', natural: 20, successes: 0, failures: 0, outcome: 'revived' };
    expect(describeEvent(death, state)).toBe('Mira: ölüm kurtarma zarı 20: ayağa kalktı (1 HP) (0 başarı, 0 başarısızlık).');
    const regen: BattleEvent = { type: 'regeneration', actorId: 'troll', amount: 10, blocked: false, died: false, hpAfter: 94 };
    expect(describeEvent(regen, state)).toBe('Troll: 10 HP yenilendi.');
    const done: BattleEvent = { type: 'battle_finished', winner: 'party' };
    expect(describeEvent(done, state)).toBe('Savaş bitti: parti kazandı.');
  });
});
