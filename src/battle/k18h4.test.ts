/**
 * Kuyruk 18 H4: savaş içi kat değişimi (Derinlikler merdiveni; `floorLink`, kural sürümü 15).
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, mk } from './fixtures';
import { winnerOf } from './common';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const low = () => 0.3;
const C = (s: BattleState, id: string) => s.combatants[id] as Combatant;
function upstairs(opts: { surum?: number; off?: boolean } = {}): BattleState {
  const parts = [mk('A', { ownerId: 'p1', hp: 30, maxHp: 30 }), mk('D', { ownerId: 'p2', hp: 30, maxHp: 30 }), mk('B', { side: 'enemies', hp: 20, maxHp: 20 })];
  const st = startBattle('k18h4', 'magara', parts, () => 0.5, { map: { id: 'derinlikler-magara-karakol', ...(opts.off ? { ruleToggles: { floorLink: false } } : {}) } }).state;
  const pos: Record<string, Offset> = { A: o(14, 8), D: o(13, 9), B: o(25, 3) };
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
  return { ...st, status: 'active', order: ['A', 'D', 'B'], turnIndex: 0, combatants, ...(opts.surum ? { kuralSurumu: opts.surum } : {}) } as BattleState;
}
const go = (s: BattleState, id = 'A') => { const r = execute(s, { type: 'change_floor', actorId: id } as Command, id === 'A' ? P1 : { playerId: 'p2', isGm: false }, low); if (!r.ok) throw new Error(r.error); return r; };

describe('K18 H4: kat merdiveni', () => {
  it('merdivendeki üye bütün partiyi alt kata götürür; üst kattaki düşman bekler; yeni düşmanlar sıraya girer; replay aynı', () => {
    const s0 = upstairs();
    const r = go(s0);
    expect(r.state.map?.id).toBe('derinlikler-mezar-labirenti');
    expect(r.state.floors?.['derinlikler-magara-karakol']?.id).toBe('derinlikler-magara-karakol');
    expect(C(r.state, 'A').pos).not.toBeNull();
    expect(C(r.state, 'D').pos).not.toBeNull();
    expect(C(r.state, 'B').offFloor).toBe('derinlikler-magara-karakol');
    const added = Object.values(r.state.combatants).filter((c) => c.id.startsWith('kat-'));
    expect(added.length).toBe(4);
    expect(added.every((c) => c.pos && r.state.order.includes(c.id))).toBe(true);
    expect(r.state.order[r.state.turnIndex]).toBe('A');
    expect(replay([{ type: 'battle_started', state: s0 }, ...r.events] as BattleEvent[])).toEqual(r.state);
    // Üst kattaki düşman sırada atlanır ve kazanma sayımına girmez.
    expect(winnerOf({ ...r.state, combatants: Object.fromEntries(Object.entries(r.state.combatants).filter(([id]) => !id.startsWith('kat-'))) })).toBe('party');
  });
  it('geri dönüş: üst kat haritası ve bekleyen düşman yerine gelir; alt kattakiler bekler, yeniden inince yeni düşman gelmez', () => {
    const down = go(upstairs()).state;
    const a = C(down, 'A');
    // A'yı merdivene koy, yeni tura geçmiş gibi hareketi sıfırla.
    const atStairs = { ...down, combatants: { ...down.combatants, A: { ...a, pos: o(1, 7), movementUsed: 0 } } };
    const up = go(atStairs).state;
    expect(up.map?.id).toBe('derinlikler-magara-karakol');
    expect(C(up, 'B').offFloor).toBeUndefined();
    expect(C(up, 'B').pos).toEqual(o(25, 3));
    expect(Object.values(up.combatants).filter((c) => c.id.startsWith('kat-')).every((c) => c.offFloor === 'derinlikler-mezar-labirenti')).toBe(true);
    const A2 = C(up, 'A');
    const again = go({ ...up, combatants: { ...up.combatants, A: { ...A2, pos: o(14, 8), movementUsed: 0 } } }).state;
    expect(Object.values(again.combatants).filter((c) => c.id.startsWith('kat-')).length).toBe(4);
  });
  it('merdiven dışında, anahtar kapalıyken ya da kural sürümü 14\'te reddedilir', () => {
    const s = upstairs();
    const away = { ...s, combatants: { ...s.combatants, A: { ...C(s, 'A'), pos: o(5, 5) } } };
    expect(execute(away, { type: 'change_floor', actorId: 'A' } as Command, P1, low).ok).toBe(false);
    expect(execute(upstairs({ off: true }), { type: 'change_floor', actorId: 'A' } as Command, P1, low).ok).toBe(false);
    expect(execute(upstairs({ surum: 14 }), { type: 'change_floor', actorId: 'A' } as Command, P1, low).ok).toBe(false);
    void GM;
  });
});
