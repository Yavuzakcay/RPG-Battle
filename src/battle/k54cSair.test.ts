/**
 * Kuyruk K54c G1: Şair Koleji (kural sürümü 28): Nakarat (ikinci hedefe yarım etki), Ölümsüz Dize (dost 0 HP'de 1 HP +
 * geçici can), Usta Şair (ilham zarı harcamadan d12 Mısra); sürüm 27'de yok; ev kuralı kapalıyken yok; replay aynı.
 */
import { describe, it, expect } from 'vitest';
import { kitArena, o, mid, low } from './k54bKit';
import { applyEvents, replay } from './reduce';
import { commandEndHookEvents } from './turnHooks';
import { chooseCommand } from './ai';
import { mk } from './fixtures';
import './imza';
import type { Combatant } from './types';

const ally = (id: string, pos: { col: number; row: number }, hp = 20) => ({ ...mk(id, { ownerId: 'p1', hp, maxHp: 30 }), pos }) as Combatant;
const S = (level: number, extra: Partial<Parameters<typeof kitArena>[0]> = {}) => kitArena({ cls: 'bard', sub: 'imza_sair', level, scores: { cha: 16 },
  place: { A: o(3, 3), C: o(5, 3), B: o(10, 7) }, extra: [ally('D', o(6, 4))], ...extra });

describe('K54c Şair Koleji', () => {
  it('Nakarat (6): Övgü ikinci dosta yarım geçici can; sürüm 27\'de ikinci hedef yok', () => {
    const r = S(6);
    const ev = r.do(r.use('praise', 'C'), mid);
    const temps = ev.filter((e) => e.type === 'temp_hp');
    expect(temps.map((e) => e.type === 'temp_hp' && e.targetId)).toEqual(['C', 'D']);
    const [a, b] = temps.map((e) => (e.type === 'temp_hp' ? e.amount : 0));
    expect(b).toBeLessThanOrEqual(Math.ceil((a ?? 0) / 2));
    const old = S(6, { kuralSurumu: 27 });
    expect(old.do(old.use('praise', 'C'), mid).filter((e) => e.type === 'temp_hp')).toHaveLength(1);
    expect(replay(r.events).combatants.D?.tempHp).toBe(r.c('D').tempHp);
  });
  it('Nakarat (6): Hiciv ikinci düşmana aynı kurtulma, yarım hasar', () => {
    const r = S(6, { place: { A: o(3, 3), C: o(0, 0), B: o(5, 3) }, extra: [{ ...mk('E', { side: 'enemies', hp: 60, maxHp: 60, saves: { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 } }), pos: o(6, 3) } as Combatant] });
    const ev = r.do(r.use('satire', 'B'), low);
    expect(ev.filter((e) => e.type === 'save_resolved').map((e) => e.type === 'save_resolved' && e.targetId)).toEqual(['B', 'E']);
  });
  it('Ölümsüz Dize (14): 0 HP\'ye düşen dost 1 HP + Bard seviyesi geçici can; kaynak harcanır', () => {
    const r = S(14);
    const before = r.state;
    const next = { ...r.state, combatants: { ...r.state.combatants, C: { ...r.c('C'), hp: 0, life: 'dying' as const, conditions: ['Unconscious'] } } };
    const ev = commandEndHookEvents(before, next, [], { type: 'end_turn', actorId: 'B' }, mid, applyEvents);
    const s = applyEvents(next, ev);
    expect(s.combatants.C!.hp).toBe(1);
    expect(s.combatants.C!.tempHp).toBe(14);
    expect(s.combatants.A!.resources.imzaOlumsuzDize).toBe(0);
    expect(commandEndHookEvents(before, next, [], { type: 'end_turn', actorId: 'B' }, mid, applyEvents).length).toBeGreaterThan(0);
    const old = S(14, { kuralSurumu: 27 });
    const n2 = { ...old.state, combatants: { ...old.state.combatants, C: { ...old.c('C'), hp: 0, life: 'dying' as const } } };
    expect(commandEndHookEvents(old.state, n2, [], { type: 'end_turn', actorId: 'B' }, mid, applyEvents)).toEqual([]);
  });
  it('Usta Şair (14): ilham zarı harcamadan Övgü (d12); kısa dinlenmede bir', () => {
    const r = S(14);
    const bi = r.c('A').resources.bardicInspiration;
    r.do(r.use('praise-master', 'C'), mid);
    expect(r.c('A').resources.bardicInspiration).toBe(bi);
    expect(r.c('A').resources.imzaUstaSair).toBe(0);
    expect(S(14, { kuralSurumu: 27 }).keys()).not.toContain('imza:imza_sair/praise-master');
    expect(S(14, { house: false }).keys().filter((k) => k.startsWith('imza:'))).toEqual([]);
  });
  it('YZ: yarı canın altındaki dosta Övgü', () => {
    const r = S(6, { place: { A: o(3, 3), C: o(4, 3), B: o(10, 7) } });
    r.state = { ...r.state, combatants: { ...r.state.combatants, C: { ...r.c('C'), hp: 6 } } };
    const c = chooseCommand(r.state);
    expect(c.type === 'use_feature' && c.feature).toBe('imza:imza_sair/praise');
  });
});
