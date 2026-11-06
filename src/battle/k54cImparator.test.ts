/**
 * Kuyruk K54c G2: İmparator (kural sürümü 28): Ferman (Action Surge'de dosta tek seferlik ek eylem), Buyruk (dostun
 * tepkisi; yer değiştirme kipi), Hükümdar Sözü (sana ve 5 ft içindeki dostlarına dezavantaj), Ölümsüz Taht (dostlara ilk
 * saldırı avantajı); sürüm 27'de eski davranış.
 */
import { describe, it, expect } from 'vitest';
import { kitArena, o, mid, low } from './k54bKit';
import { applyEvents, replay } from './reduce';
import { commandEndHookEvents } from './turnHooks';
import { wardSources } from './divine';
import { distance } from '../rules/hex';
import './imza';

const I = (level: number, extra: Partial<Parameters<typeof kitArena>[0]> = {}) => kitArena({ cls: 'fighter', sub: 'imza_imparator', level, scores: { cha: 14, str: 16 },
  place: { A: o(3, 3), C: o(4, 4), B: o(5, 3) }, ...extra });

describe('K54c İmparator', () => {
  it('Ferman (10): Action Surge kullanınca 60 ft içindeki dost bir kez ek eylem kazanır; sürüm 27\'de yok', () => {
    const r = I(10);
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), economy: { ...r.c('A').economy, action: true, attacksLeft: 0 } } } };
    const ev = r.do({ type: 'action_surge', actorId: 'A' });
    expect(ev.some((e) => e.type === 'effect_added' && e.targetId === 'C' && e.effect.name === 'Ferman')).toBe(true);
    expect(r.c('A').resources.imzaFerman).toBe(0);
    // Dost ek eylemini kullanınca etki biter.
    r.state = { ...r.state, turnIndex: r.state.order.indexOf('C'), combatants: { ...r.state.combatants, C: { ...r.c('C'), economy: { ...r.c('C').economy, action: true, attacksLeft: 0 } } } };
    r.do({ type: 'haste_action', actorId: 'C' });
    expect(r.c('C').effects?.some((e) => e.name === 'Ferman')).toBe(false);
    const old = I(10, { kuralSurumu: 27 });
    old.state = { ...old.state, combatants: { ...old.state.combatants, A: { ...old.c('A'), economy: { ...old.c('A').economy, action: true, attacksLeft: 0 } } } };
    expect(old.do({ type: 'action_surge', actorId: 'A' }).some((e) => e.type === 'effect_added')).toBe(false);
  });
  it('Buyruk (28): dostun tepkisi harcanır; yer değiştirme kipi fırsat saldırısı doğurmaz', () => {
    const r = I(3);
    r.do(r.use('decree-move', 'C', o(4, 6)));
    expect(r.c('C').pos).toEqual(o(4, 6));
    expect(r.c('C').economy.reaction).toBe(true);
    r.fresh();
    expect(r.try(r.use('decree', 'C')).ok).toBe(false);
    expect(replay(r.events).combatants.C?.pos).toEqual(o(4, 6));
  });
  it('Hükümdar Sözü (28): sana ve 5 ft içindeki dostlara saldırırken dezavantaj', () => {
    const r = I(7);
    r.do(r.use('royal-word-2', 'B'), low);
    const b = r.c('B');
    expect(wardSources(r.state, b, r.c('A')).some((x) => x.reason === 'Hükümdar Sözü')).toBe(true);
    expect(distance(r.c('A').pos!, r.c('C').pos!)).toBe(1);
    expect(wardSources(r.state, b, r.c('C')).some((x) => x.reason === 'Hükümdar Sözü')).toBe(true);
    expect(I(7, { kuralSurumu: 27 }).keys()).toContain('imza:imza_imparator/royal-word');
  });
  it('Ölümsüz Taht (15): tetiklenince 30 ft içindeki dostların ilk saldırısı avantajlı', () => {
    const r = I(15);
    const ward = r.c('A').effects?.find((e) => e.id === 'imza:imza_imparator/undying-throne');
    expect(ward).toBeDefined();
    const next = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), hp: 1, effects: (r.c('A').effects ?? []).filter((e) => e !== ward) } } };
    const s = applyEvents(next, commandEndHookEvents(r.state, next, [], { type: 'end_turn', actorId: 'B' }, mid, applyEvents));
    expect(s.combatants.C!.effects?.some((e) => e.firstRoll?.mode === 'advantage')).toBe(true);
  });
});
