/**
 * Kuyruk 17 G2: 6–10. seviye sınıf özellikleri (kural sürümü 13): Monk Empowered Strikes (Force), Self-Restoration,
 * Heightened Focus (Flurry 3 vuruş); Paladin Aura of Courage (10 ft Frightened bağışıklığı). Eski sürüm (12) eski davranış.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { applyEvents } from './reduce';
import { GM, P1, mk } from './fixtures';
import { economyCost } from './economy';
import { combatantFromSheet } from './create';
import { partyAt } from '../sim/balance';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
function field(parts: Combatant[], pos: Record<string, Offset>, v?: number): BattleState {
  const st = startBattle('k17g2', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' }, ...(v ? { kuralSurumu: v } : {}) }).state;
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
  return { ...st, status: 'active', order: Object.keys(pos), turnIndex: 0, combatants } as BattleState;
}

describe('K17 G2: Monk', () => {
  it('Empowered Strikes (6+): Unarmed Strike hedefe göre Force seçebilir; 5. seviyede yok', () => {
    const sheet = partyAt(5, 'monk').find((s) => s.classId === 'monk');
    expect(sheet).toBeTruthy();
    const u = (lv: number) => combatantFromSheet({ ...sheet!, level: lv }, { id: 'm', ownerId: 'p1' }).weaponOptions.find((w) => w.weaponId === 'unarmed' || /Unarmed/.test(w.label));
    expect(u(5)?.altDamageType).toBeUndefined();
    expect(u(6)?.altDamageType).toBe('force');
  });
  it('Self-Restoration: tur sonunda Charmed/Frightened/Poisoned biter (sürüm 13); sürüm 12 eski davranış', () => {
    const m = mk('M', { ownerId: 'p1', traits: ['self-restoration'], conditions: ['Frightened', 'Poisoned', 'Prone'] });
    const b = mk('B', { side: 'enemies' });
    const s = field([m, b], { M: o(2, 2), B: o(8, 2) });
    const r = execute(s, { type: 'end_turn', actorId: 'M' } as Command, P1, () => 0.5);
    if (!r.ok) throw new Error(r.error);
    expect((r.state.combatants.M as Combatant).conditions).toEqual(['Prone']);
    const old = execute(field([m, b], { M: o(2, 2), B: o(8, 2) }, 12), { type: 'end_turn', actorId: 'M' } as Command, P1, () => 0.5);
    if (!old.ok) throw new Error(old.error);
    expect((old.state.combatants.M as Combatant).conditions).toEqual(expect.arrayContaining(['Frightened', 'Poisoned']));
  });
  it('Heightened Focus: Flurry of Blows 3 vuruş (sürüm 13), 2 (sürüm 12)', () => {
    const flurry = { id: 'flurry-of-blows', name: 'Flurry of Blows', strikes: 2, resource: 'focus' };
    const m = mk('M', { ownerId: 'p1', traits: ['heightened-focus'], focusActions: [flurry] as Combatant['focusActions'] });
    const cmd = { type: 'focus_action', actorId: 'M', action: 'flurry-of-blows' } as Command;
    const left = (v?: number) => { const s = field([m, mk('B', { side: 'enemies' })], { M: o(2, 2), B: o(8, 2) }, v); const c = economyCost(s, s.combatants.M as Combatant, cmd); return c.ok && c.event?.type === 'action_used' ? c.event.flurryLeft : null; };
    expect(left()).toBe(3);
    expect(left(12)).toBe(2);
  });
});

describe('K17 G2: Paladin Aura of Courage', () => {
  const fear = (id: string): BattleEvent => ({ type: 'effect_added', targetId: id, effect: { id: 'korku', name: 'Korku', sourceId: 'B', until: 5, grants: ['Frightened'] } });
  it('Paladin ve 10 ft içindeki dost Frightened olmaz; uzaktaki olur; Paladin Incapacitated ise aura yok; sürüm 12 yok', () => {
    const pal = mk('P', { ownerId: 'p1', traits: ['aura-of-courage'] });
    const near = mk('N', { ownerId: 'p1' });
    const far = mk('F', { ownerId: 'p1' });
    const s = field([pal, near, far, mk('B', { side: 'enemies' })], { P: o(3, 3), N: o(5, 3), F: o(9, 3), B: o(12, 3) });
    const after = applyEvents(s, [fear('P'), fear('N'), fear('F')]);
    const has = (st: BattleState, id: string) => (st.combatants[id] as Combatant).effects?.some((e) => e.id === 'korku') ?? false;
    expect([has(after, 'P'), has(after, 'N'), has(after, 'F')]).toEqual([false, false, true]);
    const down = { ...s, combatants: { ...s.combatants, P: { ...(s.combatants.P as Combatant), conditions: ['Stunned'] } } };
    expect(has(applyEvents(down, [fear('N')]), 'N')).toBe(true);
    const old = field([pal, near, mk('B', { side: 'enemies' })], { P: o(3, 3), N: o(5, 3), B: o(12, 3) }, 12);
    expect(has(applyEvents(old, [fear('N')]), 'N')).toBe(true);
    void GM;
  });
});

describe('K17 G2: alt sınıf (6–10)', () => {
  const charm = (id: string): BattleEvent => ({ type: 'effect_added', targetId: id, effect: { id: 'buyu', name: 'Büyü', sourceId: 'B', until: 5, grants: ['Charmed'] } });
  const has = (st: BattleState, id: string) => (st.combatants[id] as Combatant).effects?.some((e) => e.id === 'buyu') ?? false;
  it('Aura of Devotion: 10 ft içindeki dost Charmed olmaz', () => {
    const s = field([mk('P', { ownerId: 'p1', traits: ['aura-of-devotion'] }), mk('N', { ownerId: 'p1' }), mk('F', { ownerId: 'p1' }), mk('B', { side: 'enemies' })],
      { P: o(3, 3), N: o(4, 3), F: o(10, 3), B: o(12, 3) });
    const after = applyEvents(s, [charm('N'), charm('F')]);
    expect([has(after, 'N'), has(after, 'F')]).toEqual([false, true]);
  });
  it('Mindless Rage: öfkedeyken Charmed olmaz, öfkesizken olur', () => {
    const b = mk('R', { ownerId: 'p1', traits: ['mindless-rage'] });
    const s = field([b, mk('B', { side: 'enemies' })], { R: o(3, 3), B: o(12, 3) });
    expect(has(applyEvents(s, [charm('R')]), 'R')).toBe(true);
    const raging = { ...s, combatants: { ...s.combatants, R: { ...(s.combatants.R as Combatant), rage: { until: 9 } as unknown as Combatant['rage'] } } };
    expect(has(applyEvents(raging, [charm('R')]), 'R')).toBe(false);
  });
});
