/**
 * Görev KATALOG-ON-HAZIRLIK (kural sürümü 108): canavar saldırısının ek hasarı (`riderExtras`) hedefin direncini kurtarmalı hasarla
 * aynı tek yoldan okur (`profileIn`): süren etkiden gelen direnç (Protection from Energy) ek hasarı yarıya alır; 107 ve altı
 * yalnız kalıcı direnç (eski davranış). Kalıcı direnç + süren etki birlikte tek kez uygulanır.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster, startBattle } from './create';
import { GM, dice, mk, scripted } from './fixtures';
import { getMonster } from '../data';
import { CURRENT_RULES } from './ruleVersion';
import { RIDER_RESIST_VERSION, riderResist108On } from './riderResist108Surum';
import type { Offset } from '../rules/hex';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const pfe: ActiveEffect = { id: 'pfe', name: 'Protection from Energy', sourceId: 'A', resist: ['fire'] };
const dragon = (id: string) => ({ ...combatantFromMonster(getMonster('young-red-dragon'), { id }), initiativeBonus: 30 });

/** Düz harita; sıra D, (D2), sonra A. `kuralSurumu` verilen sürüm. */
function arena(parts: Combatant[], pos: Record<string, Offset>, kuralSurumu: number): BattleState {
  const started = startBattle('r108', 'd-z-zemin', parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map: { id: 'col' } });
  const combatants = { ...started.state.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...started.state, kuralSurumu, status: 'active', turnIndex: 0, combatants, map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles: flat } };
}
const target = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', ac: 10, hp: 200, maxHp: 200, ...p });
const rend = (s: BattleState, actorId: string) => {
  const i = s.combatants[actorId]!.attacks.findIndex((a) => a.name === 'Rend');
  // Çöl haritasının sıcaklık kuralı kırmızı ejderhaya avantaj verir: iki d20 (15, 15) isabet; Rend 2d6 = 3 + 3, ek 1d6 fire = 6.
  return ok(execute(s, { type: 'monster_attack', actorId, targetId: 'A', attackIndex: i }, GM, scripted([20, 15], [20, 15], [6, 3], [6, 3], [6, 6])));
};
const hitOf = (events: BattleEvent[]) => events.find((e): e is Extract<BattleEvent, { type: 'attack_resolved' }> => e.type === 'attack_resolved')!;

describe('kural sürümü 108: ek hasar süren etki direnci', () => {
  it('tek sabit 108, güncel sürüm; kapı 107 kapalı, 108 açık', () => {
    expect(RIDER_RESIST_VERSION).toBe(108);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(108);
    expect(riderResist108On({ kuralSurumu: 107 })).toBe(false);
    expect(riderResist108On({ kuralSurumu: 108 })).toBe(true);
    expect(riderResist108On({})).toBe(false);
  });

  it('Protection from Energy (fire) altındaki hedef Rend\'in +1d6 fire ekini 108\'de yarıya alır, 107\'de almaz; ana hasar ikisinde aynı', () => {
    const mkState = (v: number) => arena([dragon('D'), target({ effects: [pfe] })], { D: o(2, 3), A: o(3, 3) }, v);
    const yeni = hitOf(rend(mkState(108), 'D').events);
    const eski = hitOf(rend(mkState(107), 'D').events);
    expect(yeni.extra?.[0]).toMatchObject({ type: 'fire', raw: 6, applied: 3 });
    expect(eski.extra?.[0]).toMatchObject({ type: 'fire', raw: 6, applied: 6 });
    expect(yeni.appliedDamage - 3).toBe(eski.appliedDamage - 6);
    // Uygulanan hasar HP'ye aynen yazılır.
    const r = rend(mkState(108), 'D');
    expect(r.state.combatants.A!.hp).toBe(200 - hitOf(r.events).appliedDamage);
  });

  it('saldırı eki ve kurtarmalı hasar aynı turda aynı dirençle: Fire Breath ve Rend ikisi de yarıya iner (108)', () => {
    let s = arena([dragon('D'), dragon('E'), target({ effects: [pfe] })], { D: o(2, 3), E: o(4, 3), A: o(3, 3) }, 108);
    expect(s.order.slice(0, 2)).toEqual(['D', 'E']);
    const d = s.combatants.D!;
    // D: Fire Breath (16d6 hepsi 3 = 48), A save'i başaramaz → 48, Protection from Energy ile 24.
    const breath = ok(execute(s, { type: 'monster_attack', actorId: 'D', targetId: '', attackIndex: d.attacks.findIndex((a) => !!a.area), targetHex: o(5, 3) }, GM,
      scripted(...dice(6, ...Array<number>(16).fill(3)), [20, 1], [20, 1])));
    const save = breath.events.find((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved' && e.targetId === 'A')!;
    expect(save).toMatchObject({ success: false, rawDamage: 48, appliedDamage: 24 });
    s = ok(execute(breath.state, { type: 'end_turn', actorId: 'D' }, GM, scripted())).state;
    expect(s.order[s.turnIndex]).toBe('E');
    expect(s.round).toBe(breath.state.round);
    const hit = rend(s, 'E');
    expect(hitOf(hit.events).extra?.[0]).toMatchObject({ type: 'fire', raw: 6, applied: 3 });
    expect(hit.state.combatants.A!.hp).toBe(200 - 24 - hitOf(hit.events).appliedDamage);
  });

  it('kalıcı direnç + süren etki aynı türde tek kez uygulanır (iki kez yarılanmaz)', () => {
    const s = arena([dragon('D'), target({ resistances: ['fire'], effects: [pfe] })], { D: o(2, 3), A: o(3, 3) }, 108);
    expect(hitOf(rend(s, 'D').events).extra?.[0]).toMatchObject({ type: 'fire', raw: 6, applied: 3 });
    // Yalnız kalıcı direnç: 107 ile 108 aynı (eski yol da yarıya alıyordu).
    const kalici = (v: number) => hitOf(rend(arena([dragon('D'), target({ resistances: ['fire'] })], { D: o(2, 3), A: o(3, 3) }, v), 'D').events).extra?.[0];
    expect(kalici(107)).toMatchObject({ applied: 3 });
    expect(kalici(108)).toMatchObject({ applied: 3 });
  });

  it('süren etkinin bağışıklığı da tek yoldan (Mind Blank gibi `immuneDamage`): 108\'de 0, 107\'de tam', () => {
    const ward: ActiveEffect = { id: 'w', name: 'Test', sourceId: 'A', immuneDamage: ['fire'] };
    const ek = (v: number) => hitOf(rend(arena([dragon('D'), target({ effects: [ward] })], { D: o(2, 3), A: o(3, 3) }, v), 'D').events).extra?.[0];
    expect(ek(108)).toMatchObject({ raw: 6, applied: 0 });
    expect(ek(107)).toMatchObject({ raw: 6, applied: 6 });
  });
});
