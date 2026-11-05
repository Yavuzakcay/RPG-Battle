/**
 * Kuyruk K54b G4: İnfazcı (kural sürümü 27): Hüküm devri (hükümlü düşünce bedava, turda bir), Müdahale tepkisi,
 * Peşini Bırakmayan (yer bilgisi: gizli hükümlü hedef alınır; takip); sürüm 26'da yok; YZ hükümlü seçer.
 */
import { describe, it, expect } from 'vitest';
import { kitArena, o, mid } from './k54bKit';
import { applyEvents, replay } from './reduce';
import { afterAttackReactions } from './reactions';
import { knowsWhere } from './sight';
import { distance } from '../rules/hex';
import { chooseCommand } from './ai';
import './imza';

const I = (level: number, extra: Partial<Parameters<typeof kitArena>[0]> = {}) => kitArena({ cls: 'rogue', sub: 'imza_infazci', level, scores: { dex: 16 }, ...extra });
const condemn = (r: ReturnType<typeof I>) => r.do(r.use('verdict', 'B'));

describe('K54b İnfazcı', () => {
  it('Hüküm devri: hükümlü düşünce yeni hüküm kullanım harcamaz (turda bir); sürüm 26\'da harcar', () => {
    for (const v of [27, 26]) {
      const r = I(3, { kuralSurumu: v, extra: [{ ...I(3).c('B'), id: 'E', name: 'E', pos: o(6, 3) }] });
      condemn(r);
      r.state = { ...r.state, combatants: { ...r.state.combatants, B: { ...r.c('B'), hp: 0, life: 'dead' } } };
      r.fresh();
      const left = r.c('A').resources.imzaHukum;
      r.do(r.use('verdict', 'E'));
      expect(r.c('A').resources.imzaHukum).toBe(v === 27 ? left : (left ?? 0) - 1);
    }
  });
  it('Müdahale (9): hükümlü dosta isabet ettirince tepkiyle yanına gelip saldırır', () => {
    const r = I(9, { place: { A: o(3, 3), B: o(7, 3), C: o(8, 3) } });
    condemn(r);
    const ev = afterAttackReactions(r.state, 'B', 'C', { events: [], hit: true, ac: 10, damage: 4 }, { melee: true, damageType: 'slashing', dealt: 4 }, mid);
    expect(ev.some((e) => e.type === 'reaction_used' && e.reaction === 'imza-mudahale')).toBe(true);
    const s = applyEvents(r.state, ev);
    expect(distance(s.combatants.A!.pos!, s.combatants.B!.pos!)).toBe(1);
    expect(ev.some((e) => e.type === 'attack_resolved' && e.actorId === 'A')).toBe(true);
    const old = I(9, { kuralSurumu: 26, place: { A: o(3, 3), B: o(7, 3), C: o(8, 3) } });
    condemn(old);
    expect(afterAttackReactions(old.state, 'B', 'C', { events: [], hit: true, ac: 10, damage: 4 }, { melee: true, damageType: 'slashing', dealt: 4 }, mid).some((e) => e.type === 'reaction_used')).toBe(false);
  });
  it('Peşini Bırakmayan (13): gizli hükümlünün yeri bilinir; uzaklaşınca takip', () => {
    const r = I(13, { place: { A: o(3, 3), B: o(5, 3) } });
    condemn(r);
    expect(knowsWhere(r.state, r.c('A'), r.c('B'))).toBe(true);
    expect(knowsWhere(I(13, { kuralSurumu: 26 }).state, r.c('A'), r.c('B'))).toBe(false);
    r.state = { ...r.state, turnIndex: r.state.order.indexOf('B') };
    const ev = r.gm({ type: 'move', actorId: 'B', to: o(9, 3) });
    expect(ev.some((e) => e.type === 'teleported' && e.actorId === 'A')).toBe(true);
    expect(distance(r.c('A').pos!, r.c('B').pos!)).toBeLessThan(6);
    expect(replay(r.events).combatants.A?.pos).toEqual(r.c('A').pos);
  });
  it('YZ: hükümlü yokken Hüküm verir', () => {
    const r = I(3, { place: { B: o(5, 3) } });
    const c = chooseCommand(r.state);
    expect(c.type === 'use_feature' && c.feature).toBe('imza:imza_infazci/verdict');
  });
});
