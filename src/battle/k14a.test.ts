/**
 * Kuyruk 14 K14A: sızma haritasında (uyuyan/habersiz grup) SRD 5.2.1 Hide: yürümek gizlenmeyi bozmaz, uyanık düşman
 * pasif Algıyla bulursa ortaya çıkar; grupsuz haritada eski kural. Parti yapay zekâsı gözcü yakınken gizlenir. Düşman
 * yapay zekâsı yolundaki kapalı kapıyı açar, kilitliyi açmaz.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { chooseCommand } from './ai';
import { GM, P1, mk } from './fixtures';
import { applyEvents } from './reduce';
import { formGroupsEvent } from './alarm';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, SleepGroup } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high = () => 0.99;

function arena(groups: SleepGroup[] | undefined, at: Record<string, Offset>, extra: Partial<BattleState> = {}): BattleState {
  const a = mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, bonusActions: [] });
  const b = mk('B', { side: 'enemies', hp: 50, maxHp: 50 });
  const st = startBattle('k14a', 'd-z-zemin', [a, b], () => 0.5, { map: { id: 'kale-baskini' } }).state;
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: at[id] ?? null, initiative: id === 'A' ? 15 : 10 }]));
  const s0 = { ...st, status: 'active', order: ['A', 'B'], turnIndex: 0, round: 1, combatants, groups, goals: undefined, ...extra } as BattleState;
  const formed = groups ? formGroupsEvent(s0) : null;
  return formed ? applyEvents(s0, [formed as BattleEvent]) : s0;
}
const hidden = (s: BattleState, dc = 30): BattleState => ({ ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), hidden: { dc } } } });

describe('sızma haritasında gizlenme', () => {
  it('grup haritasında gizli yürüyen ortaya çıkmaz; uyanık düşman pasif Algıyla bulursa çıkar; grupsuz haritada eski kural', () => {
    const groups: SleepGroup[] = [{ id: 'g', state: 'asleep', hexes: [o(25, 15)] }];
    const quiet = hidden(arena(groups, { A: o(2, 8), B: o(25, 15) }));
    const r = execute(quiet, { type: 'move', actorId: 'A', to: o(3, 8) }, P1, high);
    expect(r.ok && r.state.combatants.A?.hidden).toBeTruthy();
    const awake = hidden(arena([{ id: 'g', state: 'alarmed', hexes: [o(9, 8)] }], { A: o(2, 8), B: o(9, 8) }), 5);
    const seen = execute(awake, { type: 'move', actorId: 'A', to: o(3, 8) }, P1, high);
    expect(seen.ok && seen.events.find((e) => e.type === 'revealed')).toBeTruthy();
    const old = hidden(arena(undefined, { A: o(2, 8), B: o(25, 15) }));
    const r2 = execute(old, { type: 'move', actorId: 'A', to: o(3, 8) }, P1, high);
    expect(r2.ok && r2.events.find((e) => e.type === 'revealed')).toMatchObject({ reason: 'yürüdü' });
  });
  it('parti yapay zekâsı: habersiz gözcü yakın ve açık sızma hedefi varken gizlenme yerinde gizlenir', () => {
    // 1 tabanlı (1,4) çalılık (g): gizlenme yeri; gözcü 8 altıgen doğuda, habersiz.
    const s = arena([{ id: 'd', state: 'calm', hexes: [o(8, 3)] }], { A: o(0, 3), B: o(8, 3) },
      { goals: { mode: 'any', list: [{ id: 'k', kind: 'reach', hexes: [o(28, 2)] }] } });
    expect(chooseCommand(s)).toMatchObject({ type: 'hide', actorId: 'A' });
  });
});

describe('düşman kapı açar', () => {
  it('yolundaki kapalı kapıyı açar; kilitliyi açmaz', () => {
    let s = arena(undefined, { A: o(2, 8), B: o(13, 8) }, { order: ['B', 'A'] });
    const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r.state; };
    s = ok(execute(s, { type: 'place_object', kind: 'door', at: o(12, 8) }, GM, high));
    expect(chooseCommand(s)).toMatchObject({ type: 'object_use', action: 'open' });
    const locked = ok(execute(ok(execute(s, { type: 'place_object', at: o(12, 8) }, GM, high)), { type: 'place_object', kind: 'door', at: o(12, 8), state: 'locked' }, GM, high));
    expect(chooseCommand(locked).type).not.toBe('object_use');
  });
});
