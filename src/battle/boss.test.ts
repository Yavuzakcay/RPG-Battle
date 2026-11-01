/**
 * Kuyruk 33 M2: boss paketi (kural sürümü 11). Efsanevi eylem başka yaratığın turundan sonra kullanılır, boss'un
 * turunda yenilenir; in olayı (lav püskürmesi) tur başında; anahtar kapalı ya da eski sürümde hiçbiri yok.
 */
import { describe, expect, it } from 'vitest';
import { execute, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant } from './index';
import type { Offset } from '../rules/hex';
import { DRAGON_ID } from './create';
import { lairEvents, legendaryEvents, legendaryOf } from './boss';
import { seededRng as seeded } from '../rules/dice';
import { GM, P1, mk, scripted, sword } from './fixtures';
import { describeEvent } from '../ui/log';

const o = (col: number, row: number): Offset => ({ col, row });
const flat = Array.from({ length: 7 }, () => '.'.repeat(15));

function arena(opts: { kuralSurumu?: number; toggles?: Record<string, boolean>; asleep?: boolean } = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 60, maxHp: 60, weaponOptions: [sword], speed: 30 }),
    mk('B', { ownerId: 'p1', hp: 60, maxHp: 60, weaponOptions: [sword], speed: 30 }),
  ];
  const { state } = startBattle('b', 'b-zemin', parts, scripted(...parts.map(() => [20, 10] as [number, number]), [20, 1]),
    { map: { id: 'volkan', variantId: 'uyuyan-ejderha' }, ...(opts.kuralSurumu ? { kuralSurumu: opts.kuralSurumu } : {}) });
  const combatants = { ...state.combatants };
  combatants[DRAGON_ID] = { ...(combatants[DRAGON_ID] as Combatant), pos: o(7, 2), asleep: opts.asleep ?? false };
  combatants.A = { ...(combatants.A as Combatant), pos: o(6, 2) };
  combatants.B = { ...(combatants.B as Combatant), pos: o(2, 5) };
  return {
    ...state, status: 'active', turnIndex: state.order.indexOf('A'), combatants,
    map: { ...(state.map as NonNullable<BattleState['map']>), tiles: flat, ...(opts.toggles ? { ruleToggles: opts.toggles } : {}) },
  };
}
const of = <T extends BattleEvent['type']>(ev: BattleEvent[], t: T) => ev.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === t);
const rng = () => seeded(7);

describe('efsanevi eylemler', () => {
  it('yuvadaki ejderha (ev kuralı) Pounce: A turunu bitirince bitişikteki A\'ya tek Rend; kullanım azalır, günlükte', () => {
    const s = arena();
    expect(legendaryOf(s, s.combatants[DRAGON_ID] as Combatant)?.uses).toBe(3);
    const r = execute(s, { type: 'end_turn', actorId: 'A' }, P1, rng());
    if (!r.ok) throw new Error(r.error);
    const used = of(r.events, 'legendary_used');
    expect(used[0]).toMatchObject({ actorId: DRAGON_ID, actionId: 'pounce', left: 2 });
    expect(describeEvent(used[0] as BattleEvent, r.state)).toContain('Efsanevi eylem');
    expect(r.events.some((e) => e.type === 'attack_resolved')).toBe(true);
    expect((r.state.combatants[DRAGON_ID] as Combatant).legendaryLeft).toBe(2);
  });
  it('boss\'un kendi turunun başında kullanımlar yenilenir; kendi turundan sonra efsanevi eylem yok', () => {
    const s = arena();
    const tired = { ...s, combatants: { ...s.combatants, [DRAGON_ID]: { ...(s.combatants[DRAGON_ID] as Combatant), legendaryLeft: 0, legendaryUsed: ['pounce'] } } };
    expect(legendaryEvents(tired, 'A', rng())).toEqual([]);
    expect(legendaryEvents(s, DRAGON_ID, rng())).toEqual([]);
    const before = { ...tired, turnIndex: (tired.order.indexOf(DRAGON_ID) - 1 + tired.order.length) % tired.order.length };
    const prev = before.order[before.turnIndex] as string;
    const r = execute(before, { type: 'end_turn', actorId: prev }, prev === 'A' || prev === 'B' ? P1 : GM, rng());
    if (!r.ok) throw new Error(r.error);
    expect(of(r.events, 'legendary_refresh')[0]).toMatchObject({ actorId: DRAGON_ID, left: 3 });
  });
  it('uyuyan ejderha, anahtar kapalı ve eski kural sürümü: efsanevi eylem yok', () => {
    for (const s of [arena({ asleep: true }), arena({ toggles: { legendaryActions: false } }), arena({ kuralSurumu: 10 })]) {
      const r = execute(s, { type: 'end_turn', actorId: 'A' }, P1, rng());
      if (!r.ok) throw new Error(r.error);
      expect(of(r.events, 'legendary_used')).toEqual([]);
    }
  });
});

describe('in olayı (lav püskürmesi)', () => {
  it('uyanık boss: yerdeki parti üyelerinin altıgeninde DEX save + ateş, bir tur alev yüzeyi', () => {
    const ev = lairEvents(arena(), rng());
    expect(of(ev, 'map_effect').map((e) => e.targetId).sort()).toEqual(['A', 'B']);
    const zone = of(ev, 'zone_created')[0];
    expect(zone?.zone.surface).toBe('fire');
    expect(zone?.zone.hexes).toHaveLength(2);
  });
  it('uyuyan boss, anahtar kapalı, eski sürüm: in olayı yok', () => {
    expect(lairEvents(arena({ asleep: true }), rng())).toEqual([]);
    expect(lairEvents(arena({ toggles: { lairEruption: false } }), rng())).toEqual([]);
    expect(lairEvents(arena({ kuralSurumu: 10 }), rng())).toEqual([]);
  });
});
