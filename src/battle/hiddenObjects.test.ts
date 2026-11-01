/**
 * Kuyruk 30 D1: gizli (keşif) nesneler. Heykel Gölü'nde heykelin gözü ve geçit sandığı gizli.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { applyEvents, replay } from './reduce';
import { enterHexEvents, turnStartMapEvents } from './maprules';
import { concealed, objectShown } from './hiddenObjects';
import { serializeSession, restoreSession } from '../app/battleSave';
import { createSession } from '../ui/session';
import { terrainInfo } from '../ui/mapView';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleState, Combatant, MapObject } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const EYE = o(22, 4);
function battle(pos: Record<string, Offset>, opt: { v?: number; toggles?: Record<string, boolean>; perception?: number } = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 60, maxHp: 60, skills: { investigation: 10, perception: opt.perception ?? 0 } }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60 }),
  ];
  const st = startBattle('k30', 'orman', parts, () => 0.5, {
    map: { id: 'orman-heykel-golu', ...(opt.toggles ? { ruleToggles: opt.toggles } : {}) }, ...(opt.v ? { kuralSurumu: opt.v } : {}),
  }).state;
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
  return { ...st, status: 'active', order: Object.keys(pos), turnIndex: 0, combatants } as BattleState;
}
const eye = (s: BattleState) => s.map?.objects?.find((x) => x.id === 'heykelGozu') as MapObject;
const solve = (s: BattleState, ctx = P1) => execute(s, { type: 'object_use', actorId: 'A', objectId: 'heykelGozu', action: 'solve' }, ctx, high);

describe('Kuyruk 30 D1: gizli nesneler', () => {
  const far = { A: o(16, 4), B: o(2, 9) };
  it('bulunmadan oyuncu görünümünde çizilmez, bilgi kutusunda yazmaz; Game Master görünümünde soluk', () => {
    const s = battle(far);
    expect(concealed(s, eye(s))).toBe(true);
    expect(objectShown(s, eye(s), false)).toBe('none');
    expect(objectShown(s, eye(s), true)).toBe('faded');
    expect(terrainInfo(s, EYE)).not.toMatch(/Heykelin gözü/);
    expect(terrainInfo({ ...s, map: { ...s.map!, objects: s.map!.objects!.map((x) => (x.id === 'heykelGozu' ? { ...x, found: true } : x)) } }, EYE)).toMatch(/Heykelin gözü/);
    expect(objectShown(s, s.map?.objects?.find((x) => x.id === 'gecitSandik') as MapObject, false)).toBe('none');
  });
  it('bulunmadan oyuncu etkileşemez; Game Master zorlayabilir', () => {
    const s = battle({ A: o(21, 4), B: o(2, 9) });
    expect(solve(s).ok).toBe(false);
    const r = execute(s, { type: 'reveal_object', objectId: 'heykelGozu' }, GM, high);
    expect(r.ok).toBe(true);
    if (r.ok) expect(solve(r.state).ok).toBe(true);
    expect(execute(s, { type: 'reveal_object', objectId: 'heykelGozu' }, P1, high).ok).toBe(false);
  });
  it('komşu altıgene girince bulunur, keşif bayrağı yazılır; kayıt/yükleme ve replay korur', () => {
    const s0 = battle(far);
    const evs = enterHexEvents(s0, s0.combatants.A as Combatant, o(21, 4), high).events;
    expect(evs.some((e) => e.type === 'object_changed' && e.found)).toBe(true);
    const s1 = applyEvents(s0, evs);
    expect(eye(s1).found).toBe(true);
    expect(s1.flags).toContain('heykel-gozu-bulundu');
    expect(objectShown(s1, eye(s1), false)).toBe('shown');
    expect(replay([{ type: 'battle_started', state: s0 }, ...evs])).toEqual(s1);
    const back = restoreSession(serializeSession(createSession(s1, [{ type: 'battle_started', state: s0 }, ...evs])));
    expect(back.ok && eye(back.session.state).found).toBe(true);
  });
  it('tur başında pasif Algıyla (DC 12, 3 altıgen) bulunur; düşük Algıyla bulunmaz; uçan da bulur', () => {
    const near = { A: o(20, 4), B: o(2, 9) };
    const sharp = battle(near, { perception: 4 });
    expect(turnStartMapEvents(sharp, sharp.combatants.A as Combatant, high).some((e) => e.type === 'object_changed' && e.found)).toBe(true);
    const dull = battle(near, { perception: 0 });
    expect(turnStartMapEvents(dull, dull.combatants.A as Combatant, high).some((e) => e.type === 'object_changed')).toBe(false);
    const fly = { ...(sharp.combatants.A as Combatant), fly: 30 };
    expect(turnStartMapEvents(sharp, fly, high).some((e) => e.type === 'object_changed' && e.found)).toBe(true);
  });
  it('düşman bulamaz', () => {
    const s = battle({ A: o(2, 9), B: o(16, 4) });
    expect(enterHexEvents(s, s.combatants.B as Combatant, o(21, 4), high).events.some((e) => e.type === 'object_changed')).toBe(false);
  });
  it('Game Master anahtarı kapalıyken ve eski savaşta eski davranış (hepsi görünür, etkileşilir)', () => {
    const off = battle({ A: o(21, 4), B: o(2, 9) }, { toggles: { hiddenObjects: false } });
    expect(objectShown(off, eye(off), false)).toBe('shown');
    expect(solve(off).ok).toBe(true);
    const old = battle({ A: o(21, 4), B: o(2, 9) }, { v: 9 });
    expect(concealed(old, eye(old))).toBe(false);
  });
});
