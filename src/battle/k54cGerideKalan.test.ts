/**
 * Kuyruk K54c G4: Geride Kalanın Yolu (kural sürümü 28): Yaralı Kalp tavanı ve Moral kapalıyken Yıpranma havuzu,
 * Öfkeyle Ayakta (öfkede çökmeme), Dostunun Yası (tepki: öfke + geçici can), Alışkın Acı (ceza yok), Küllerden Doğan
 * (öfke + dostlara geçici can); sürüm 27'de yok.
 */
import { describe, it, expect } from 'vitest';
import { kitArena, o, mid } from './k54bKit';
import { applyEvents } from './reduce';
import { commandEndHookEvents } from './turnHooks';
import { moraleAfterEvents, moraleSaveDice } from './morale';
import './imza';

const G = (level: number, extra: Partial<Parameters<typeof kitArena>[0]> = {}) => kitArena({ cls: 'barbarian', sub: 'imza_geride_kalan', level, scores: { str: 16, wis: 12 },
  place: { A: o(3, 3), C: o(4, 4), B: o(9, 3) }, ...extra });

describe('K54c Geride Kalan', () => {
  it('Yaralı Kalp: Moral kapalıyken Yıpranma havuzu üçte bir tavanla; sürüm 27\'de yok', () => {
    const r = G(3);
    const a = r.c('A');
    expect(a.yipranmaNormal).toBeGreaterThan(0);
    expect(a.moralMax).toBe(Math.max(1, Math.floor((a.yipranmaNormal ?? 0) / 3)));
    expect(G(3, { kuralSurumu: 27 }).c('A').moralMax).toBeUndefined();
    expect(G(3, { house: false }).c('A').moralMax).toBeUndefined();
  });
  it('Öfkeyle Ayakta: öfkedeyken 0 puanda çökmez, öfke bitince çöker', () => {
    const r = G(3);
    r.do({ type: 'rage', actorId: 'A' });
    const a = r.c('A');
    const z = { ...r.state, combatants: { ...r.state.combatants, A: { ...a, moral: 0 } } };
    expect(moraleAfterEvents({ ...r.state, combatants: { ...r.state.combatants, A: { ...a, moral: 1 } } }, z, []).some((e) => e.type === 'effect_added')).toBe(false);
    const calm = { ...z, combatants: { ...z.combatants, A: { ...z.combatants.A!, rage: null } } };
    expect(moraleAfterEvents(z, calm as never, []).some((e) => e.type === 'effect_added' && e.effect.id === 'moral:cokmus')).toBe(true);
  });
  it('Dostunun Yası (6): dost düşünce tepkiyle öfke (kullanım harcamaz) + 2 × seviye geçici can', () => {
    const r = G(6);
    const rage0 = r.c('A').resources.rage;
    const next = { ...r.state, combatants: { ...r.state.combatants, C: { ...r.c('C'), hp: 0, life: 'dying' as const } } };
    const s = applyEvents(next, commandEndHookEvents(r.state, next, [], { type: 'end_turn', actorId: 'B' }, mid, applyEvents));
    expect(s.combatants.A!.rage).toBeTruthy();
    expect(s.combatants.A!.tempHp).toBe(12);
    expect(s.combatants.A!.resources.rage).toBe(rage0);
  });
  it('Alışkın Acı (10): düşük puan cezası yok; Küllerden Doğan (14): öfke + dostlara geçici can', () => {
    const r = G(10);
    expect(moraleSaveDice({ ...r.c('A'), moral: 0 }, 'wis')).toEqual([]);
    expect(moraleSaveDice({ ...G(3).c('A'), moral: 0 }, 'wis').length).toBeGreaterThan(0);
    const k = G(14);
    const ward = k.c('A').effects?.find((e) => e.id === 'imza:imza_geride_kalan/risen-from-ashes');
    const next = { ...k.state, combatants: { ...k.state.combatants, A: { ...k.c('A'), hp: 1, effects: (k.c('A').effects ?? []).filter((e) => e !== ward) } } };
    const s = applyEvents(next, commandEndHookEvents(k.state, next, [], { type: 'end_turn', actorId: 'B' }, mid, applyEvents));
    expect(s.combatants.A!.rage).toBeTruthy();
    expect(s.combatants.C!.tempHp).toBe(14);
  });
});
