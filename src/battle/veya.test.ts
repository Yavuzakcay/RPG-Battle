/**
 * Kuyruk 18 V2: "VEYA" hedefi. Seçeneklerden birinin bütün alt hedefleri sağlanınca parti kazanır; alt hedefler (ulaşma,
 * taşıma) tek tek kilitlenir; bütün seçenekler başarısızsa düşman kazanır. VEYA'sız hedefler eskisi gibi.
 */
import { describe, expect, it } from 'vitest';
import { goalEvents, goalOutcome, goalsFromData, leafGoals, liveGoalStatus } from './goals';
import { applyEvents } from './reduce';
import { startBattle } from './create';
import { mk } from './fixtures';
import type { BattleState, Combatant, Goals } from './types';

const base = (): BattleState => {
  const st = startBattle('v', 'd-z-zemin', [mk('A', { ownerId: 'p1' }), mk('A2', { ownerId: 'p1' }), mk('B', { side: 'enemies' })], () => 0.5, { map: { id: 'col' } }).state;
  return { ...st, status: 'active' };
};
const place = (s: BattleState, pos: Record<string, { col: number; row: number }>, hp: Record<string, number> = {}): BattleState => ({
  ...s, combatants: Object.fromEntries(Object.entries(s.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? (c as Combatant).pos, ...(hp[id] !== undefined ? { hp: hp[id] } : {}) }])),
});
const goals = (): Goals => goalsFromData({ mode: 'any', list: [{ id: 'v', kind: 'veya', options: [
  [{ id: 'yen', kind: 'defeat' }],
  [{ id: 'k1', kind: 'reach', hexes: [[3, 3]] }, { id: 'k2', kind: 'reach', hexes: [[6, 3]] }],
] }] }) as Goals;

describe('VEYA hedefi', () => {
  it('alt hedef kimlikleri yapraklarda; 1 tabanlı altıgenler dönüştürülür', () => {
    const g = goals();
    expect(leafGoals(g.list).map((x) => x.id)).toEqual(['yen', 'k1', 'k2']);
    expect(leafGoals(g.list)[1]?.hexes).toEqual([{ col: 2, row: 2 }]);
  });
  it('ikinci seçenek: iki ulaşma ayrı ayrı kilitlenir, ikisi de olunca parti kazanır (düşman ayaktayken)', () => {
    let s: BattleState = { ...place(base(), { A: { col: 2, row: 2 }, A2: { col: 0, row: 0 }, B: { col: 12, row: 3 } }), goals: goals() };
    expect(goalOutcome(s)).toBeNull();
    s = applyEvents(s, goalEvents(s));
    expect(s.goals?.status?.k1).toBe('done');
    // A ayrılsa da kilit kalır; A2 ikinci altıgene varınca biter.
    s = place(s, { A: { col: 1, row: 1 }, A2: { col: 5, row: 2 } });
    s = applyEvents(s, goalEvents(s));
    expect(goalOutcome(s)).toBe('party');
  });
  it('ilk seçenek: düşmanlar yenilince kazanır; VEYA olmayan liste eskisi gibi', () => {
    const s: BattleState = { ...place(base(), { A: { col: 0, row: 0 }, A2: { col: 0, row: 1 }, B: { col: 12, row: 3 } }, { B: 0 }), goals: goals() };
    expect(liveGoalStatus(s, s.goals!.list[0]!)).toBe('done');
    expect(goalOutcome(s)).toBe('party');
    const plain: BattleState = { ...s, goals: goalsFromData({ mode: 'all', list: [{ kind: 'reach', hexes: [[3, 3]] }] }) as Goals };
    expect(goalOutcome(plain)).toBeNull();
  });
});
