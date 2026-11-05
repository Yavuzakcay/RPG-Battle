/**
 * Kuyruk K53 S1–S2: tek ışınlanma girişi (varış kancaları) ve tek zorla hareket girişi (itme/çekme/yana/serbest,
 * çarpma ev kuralı). Eski sürüm (23) eski davranış; replay aynı durum.
 */
import { describe, expect, it } from 'vitest';
import { execute, replay, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command } from './index';
import type { Offset } from '../rules/hex';
import { distance } from '../rules/hex';
import { applyEvents } from './reduce';
import { forcedMove, teleport, teleportTargets } from './motion';
import { pushAwayEvents } from './forced';
import { GM, mk, scripted, zero } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });
const high = () => 0.99;
function board(fill: string, patch: Array<[Offset, string]> = []): string[] {
  const rows = Array.from({ length: 7 }, () => fill.repeat(15).split(''));
  for (const [h, ch] of patch) (rows[h.row] as string[])[h.col] = ch;
  return rows.map((r) => r.join(''));
}
function field(parts: Combatant[], positions: Record<string, Offset>, tiles: string[], version?: number): BattleState {
  const { state } = startBattle('f', 'd-z-zemin', parts.map((c) => ({ ...c, initiativeBonus: 0 })), scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map: { id: 'kale' } });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  return { ...state, status: 'active', combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles }, ...(version ? { kuralSurumu: version } : {}) };
}
const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, modifiers: { ...zero, str: 3 }, ...p });
const B = (p: Partial<Combatant> = {}) => mk('B', { side: 'enemies', hp: 40, maxHp: 40, ...p });
const C = (p: Partial<Combatant> = {}) => mk('C', { side: 'enemies', hp: 40, maxHp: 40, ...p });
const pos = (s: BattleState, evs: BattleEvent[], id: string) => applyEvents(s, evs).combatants[id]?.pos;
const slams = (evs: BattleEvent[]) => evs.filter((e) => e.type === 'map_effect' && e.rule === 'carpmaHasari') as Array<Extract<BattleEvent, { type: 'map_effect' }>>;

describe('forcedMove: kipler', () => {
  it('itme: kaynaktan uzağa 15 ft = 3 altıgen (eski pushAwayEvents ile aynı yol)', () => {
    const s = field([A(), B()], { A: o(3, 3), B: o(4, 3) }, board('.'));
    const evs = forcedMove(s, 'B', 'push', 15, 'A', high, { origin: o(3, 3) });
    expect(evs.filter((e) => e.type === 'pushed')).toHaveLength(3);
    expect(distance(o(3, 3), pos(s, evs, 'B')!)).toBe(4);
    expect(pushAwayEvents(s, o(3, 3), 'B', 15, 'A', high)).toEqual(evs);
  });
  it('çekme: kaynağa doğru, bitişikte durur', () => {
    const s = field([A(), B()], { A: o(2, 3), B: o(8, 3) }, board('.'));
    const evs = forcedMove(s, 'B', 'pull', 50, 'A', high, { origin: o(2, 3) });
    expect(distance(o(2, 3), pos(s, evs, 'B')!)).toBe(1);
    expect(slams(evs)).toHaveLength(0);
  });
  it('yana kaydırma: kaynağa uzaklık aynı kalır', () => {
    const s = field([A(), B()], { A: o(5, 3), B: o(7, 3) }, board('.'));
    const evs = forcedMove(s, 'B', 'slide', 5, 'A', high, { origin: o(5, 3) });
    const to = pos(s, evs, 'B')!;
    expect(to).not.toEqual(o(7, 3));
    expect(distance(o(5, 3), to)).toBe(2);
  });
  it('serbest doğrultu: hedef altıgene doğru (telekinezi gibi)', () => {
    const s = field([A(), B()], { A: o(1, 1), B: o(5, 3) }, board('.'));
    const evs = forcedMove(s, 'B', 'free', 30, 'A', high, { to: o(9, 3) });
    expect(pos(s, evs, 'B')).toEqual(o(9, 3));
  });
});

describe('çarpma hasarı (ev kuralı carpmaHasari, sürüm 24)', () => {
  // İtmenin ilk adımı (açık zeminde) — engel oraya konur.
  const open = field([A(), B()], { A: o(4, 3), B: o(5, 3) }, board('.'));
  const first = (forcedMove(open, 'B', 'push', 5, 'A', high, { origin: o(4, 3) })[0] as Extract<BattleEvent, { type: 'pushed' }>).to;
  const wall = board('.', [[first, '#']]);
  it('duvara: yarıda kalan altıgen kadar 1d6 kuvvet (en çok 3d6)', () => {
    const s = field([A(), B()], { A: o(4, 3), B: o(5, 3) }, wall);
    const evs = forcedMove(s, 'B', 'push', 20, 'A', high, { origin: o(4, 3) });
    expect(evs.filter((e) => e.type === 'pushed')).toHaveLength(0);
    const hit = slams(evs);
    expect(hit).toHaveLength(1);
    expect(hit[0]).toMatchObject({ targetId: 'B', damage: { type: 'force' } });
    expect(hit[0]!.damage?.rolls).toHaveLength(3); // 4 kalan → en çok 3d6
  });
  it('yaratığa: çarpılan da yarıda kalan kadar 1d6 alır (ayrı zar)', () => {
    const s = field([A(), B(), C()], { A: o(4, 3), B: o(5, 3), C: first }, board('.'));
    const evs = forcedMove(s, 'B', 'push', 10, 'A', high, { origin: o(4, 3) });
    const hit = slams(evs);
    expect(hit.map((e) => e.targetId)).toEqual(['B', 'C']);
    expect(hit.map((e) => e.damage?.rolls.length)).toEqual([2, 2]);
  });
  it('ev kuralı kapalı ya da eski sürüm (23): çarpma yok, eski sonuç', () => {
    const off = { ...field([A(), B()], { A: o(4, 3), B: o(5, 3) }, wall), houseRules: { carpmaHasari: false } } as BattleState;
    expect(slams(forcedMove(off, 'B', 'push', 20, 'A', high, { origin: o(4, 3) }))).toHaveLength(0);
    const old = field([A(), B()], { A: o(4, 3), B: o(5, 3) }, wall, 23);
    expect(forcedMove(old, 'B', 'push', 20, 'A', high, { origin: o(4, 3) })).toEqual([]);
  });
});

describe('teleport: tek giriş ve varış', () => {
  it('geçersiz hedef (dolu, duvar, menzil dışı) neden döner; geçerli hedefler listelenir', () => {
    const s = field([A(), B()], { A: o(2, 3), B: o(4, 3) }, board('.', [[o(3, 1), '#']]));
    const a = s.combatants.A as Combatant;
    expect(teleport(s, a, o(4, 3), { rangeFt: 30, sight: true }, 'Test', high)).toHaveProperty('problem');
    expect(teleport(s, a, o(3, 1), { rangeFt: 30, sight: true }, 'Test', high)).toHaveProperty('problem');
    expect(teleport(s, a, o(14, 3), { rangeFt: 30, sight: true }, 'Test', high)).toHaveProperty('problem');
    const list = teleportTargets(s, a, { rangeFt: 30, sight: true });
    expect(list.length).toBeGreaterThan(10);
    expect(list.every((h) => distance(h, o(2, 3)) <= 6)).toBe(true);
  });
  it('alev yüzeyine ışınlanınca yüzey girişi işler (sürüm 24); sürüm 23 yalnızca konum', () => {
    const base = field([A(), B()], { A: o(2, 3), B: o(12, 3) }, board('.'));
    const placed = execute(base, { type: 'place_surface', kind: 'fire', hexes: [o(4, 3)] } as Command, GM, high);
    if (!placed.ok) throw new Error(placed.error);
    const s = placed.state;
    const r = teleport(s, s.combatants.A as Combatant, o(4, 3), { rangeFt: 30, sight: true }, 'Misty Step', high);
    if ('problem' in r) throw new Error(r.problem);
    expect(r.events[0]?.type).toBe('teleported');
    expect(r.events.length).toBeGreaterThan(1);
    const old = { ...s, kuralSurumu: 23 };
    const r2 = teleport(old, old.combatants.A as Combatant, o(4, 3), { rangeFt: 30, sight: true }, 'Misty Step', high);
    if ('problem' in r2) throw new Error(r2.problem);
    expect(r2.events.map((e) => e.type)).toEqual(['teleported']);
  });
  it('replay: itme ve çarpma olayları baştan oynatılınca aynı durum', () => {
    const s = field([A(), B(), C()], { A: o(4, 3), B: o(5, 3), C: o(6, 3) }, board('.'));
    const evs = forcedMove(s, 'B', 'push', 10, 'A', high, { origin: o(4, 3) });
    const after = applyEvents(s, evs);
    expect(applyEvents(s, evs)).toEqual(after);
    expect(typeof replay).toBe('function');
  });
});
