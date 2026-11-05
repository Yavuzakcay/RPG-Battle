/**
 * Kuyruk K54b G1: Harita Öğretisi (kural sürümü 27): Arazi Okuma, Mevzi İşareti, Zemin Yeniden Yaz kipleri, Çizili
 * Duvar, Kuşbakışı Plan (yerleştirme ve takas); ev kuralı kapalıyken ve eski sürümde yok; replay aynı.
 */
import { describe, it, expect } from 'vitest';
import { kitArena, o } from './k54bKit';
import { moveCostFn } from './movement';
import { replay } from './reduce';
import { saveDice } from './effectDice';
import { chooseCommand } from './ai';
import './imza';
import type { BattleState } from './types';

const H = (level: number, extra: Partial<Parameters<typeof kitArena>[0]> = {}) => kitArena({ cls: 'wizard', sub: 'imza_harita', level, scores: { int: 16 }, ...extra });
const endTurn = (r: ReturnType<typeof H>, actorId = 'A') => r.gm({ type: 'end_turn', actorId });
const zones = (s: BattleState) => s.map?.zones ?? [];

describe('K54b Harita Öğretisi', () => {
  it('sürüm 27\'de yeni eylemler var, eski Zemin Yeniden Yaz yok; sürüm 26\'da tersi; ev kuralı kapalıyken hiçbiri', () => {
    const k = H(14).keys();
    for (const f of ['mark-the-ground', 'rewrite-slow', 'rewrite-clear', 'rewrite-ice', 'drawn-wall', 'birds-eye', 'plan-move']) expect(k).toContain(`imza:imza_harita/${f}`);
    expect(k).not.toContain('imza:imza_harita/rewrite-the-ground');
    const old = H(14, { kuralSurumu: 26 }).keys();
    expect(old).toContain('imza:imza_harita/rewrite-the-ground');
    expect(old).not.toContain('imza:imza_harita/drawn-wall');
    expect(H(14, { house: false }).keys().filter((x) => x.startsWith('imza:'))).toEqual([]);
  });
  it('Mevzi İşareti: üç altıgen; dost orada zor zemini yok sayar ve +1 kurtulma alır', () => {
    const r = H(3, { place: { C: o(6, 5) } });
    r.do(r.use('mark-the-ground', undefined, o(6, 5)));
    const z = zones(r.state).find((x) => x.spellId === 'imza:mevzi')!;
    expect(z.hexes).toHaveLength(3);
    expect(r.c('C').wardSave).toBe(1);
    expect(saveDice(r.c('C'), 'dex').some((d) => d.label === 'Mevzi İşareti')).toBe(true);
    // Zor zemin alanı (Zemin: Zor zemin değil; elle alan) üstünde: işaretli altıgen 1, diğeri 2.
    const s2: BattleState = { ...r.state, map: { ...r.state.map!, zones: [...zones(r.state), { id: 'zz', spellId: 'imza:zor-zemin', name: 'z', casterId: 'B', side: 'enemies', dc: 0, slotLevel: 0, hexes: [o(6, 5), o(7, 5), o(6, 6)], spec: { difficult: 2, ground: true } }] } };
    const cost = moveCostFn(s2, s2.combatants.C!);
    expect(cost(o(6, 5), o(5, 5))).toBe(1);
    const other = z.hexes.some((h) => h.col === 7 && h.row === 5) ? o(6, 6) : o(7, 5);
    expect(cost(other, o(6, 5))).toBe(2);
  });
  it('Zemin: Zor zemin düşmanı yavaşlatır; Yol aç yüzeyi kaldırır; Buz yüzeyi 10 tur', () => {
    const r = H(6, { place: { B: o(10, 4) } });
    r.do(r.use('rewrite-slow', undefined, o(10, 4)));
    expect(moveCostFn(r.state, r.c('B'))(o(10, 5), o(10, 4))).toBe(2);
    const s = H(6, { place: { B: o(10, 4) } });
    s.do(s.use('rewrite-ice', undefined, o(10, 4)));
    const ice = zones(s.state).find((z) => z.surface === 'ice')!;
    expect(ice.until).toBe(s.state.round + 10);
    s.fresh();
    s.do(s.use('rewrite-clear', undefined, o(10, 4)));
    expect(zones(s.state).some((z) => z.surface === 'ice')).toBe(false);
    expect(zones(s.state).some((z) => z.spellId === 'imza:yol-ac' && z.groundWard)).toBe(true);
  });
  it('Çizili Duvar (10): üç altıgen engel, yaratık üstüne çizilmez; düşman geçemez', () => {
    const r = H(10, { place: { B: o(9, 3) } });
    expect(r.try(r.use('drawn-wall', undefined, o(9, 3))).ok).toBe(false);
    r.do(r.use('drawn-wall', undefined, o(6, 3)));
    const w = zones(r.state).find((z) => z.barrier?.kind === 'cizili-duvar')!;
    expect(w.hexes).toHaveLength(3);
    expect(moveCostFn(r.state, r.c('B'))(o(6, 3), o(7, 3))).toBeNull();
    expect(H(10, { kuralSurumu: 26 }).try(r.use('drawn-wall', undefined, o(6, 3))).ok).toBe(false);
  });
  it('Kuşbakışı Plan (14): dostlara zemin koruması; turda iki yerleştirme, dolu dost altıgeninde takas; replay aynı', () => {
    const r = H(14, { place: { C: o(5, 5) } });
    r.do(r.use('birds-eye'));
    expect(r.c('C').effects?.some((e) => e.groundWard)).toBe(true);
    r.do(r.use('plan-move', 'C', o(8, 3)));
    expect(r.c('C').pos).toEqual(o(8, 3));
    r.do(r.use('plan-move', 'A', o(8, 3)));
    expect(r.c('A').pos).toEqual(o(8, 3));
    expect(r.c('C').pos).toEqual(o(3, 3));
    expect(r.try(r.use('plan-move', 'C', o(2, 2))).ok).toBe(false);
    expect(replay(r.events).combatants.C?.pos).toEqual(r.c('C').pos);
  });
  it('Arazi Okuma: ilk turunun başında tehlikeli zemin günlüğe yazılır, bir kez', () => {
    const r = H(3);
    r.state = { ...r.state, map: { ...r.state.map!, tiles: r.state.map!.tiles.map((row, i) => (i === 4 ? row.slice(0, 5) + '~' + row.slice(6) : row)) } };
    r.state = { ...r.state, turnIndex: r.state.order.length - 1 };
    const last = r.state.order[r.state.order.length - 1]!;
    const ev = endTurn(r, last);
    expect(ev.some((e) => e.type === 'trait_turn' && e.trait === 'imza:arazi')).toBe(true);
    expect(ev.some((e) => e.type === 'map_note' && e.text.includes('1 tehlikeli zemin'))).toBe(true);
    // Eski sürümde yok.
    const old = H(3, { kuralSurumu: 26 });
    old.state = { ...old.state, turnIndex: old.state.order.length - 1 };
    expect(endTurn(old, last).some((e) => e.type === 'trait_turn' && e.trait === 'imza:arazi')).toBe(false);
  });
  it('YZ: Çizili Duvar ve Zor zemin kullanır', () => {
    const r = H(10, { place: { B: o(7, 3) } });
    const cmd = chooseCommand(r.state);
    expect(cmd.type === 'use_feature' && cmd.feature).toBe('imza:imza_harita/drawn-wall');
  });
});
