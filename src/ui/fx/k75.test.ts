/**
 * Kuyruk K75 (yalnız görünüm): Control Water girdabı, Delayed Blast Fireball boncuğu ve taşkın/su değişimi dokuları.
 * Gerçek motor → beklenen sprite; zemin değişimi (`tile_changed`) su dokusuna yansır; replay aynı.
 */
import { describe, expect, it } from 'vitest';
import { applyEvents, execute } from '../../battle';
import { P1 } from '../../battle/fixtures';
import type { BattleState } from '../../battle/types';
import { spells } from '../../data';
import { seededRng } from '../../rules/dice';
import { field } from './e2Verify';
import { FX, B, groundFx, waterHexes } from './fxPlan';

const spell = (id: string) => spells.find((s) => s.id === id)!;
const Z = (B as unknown as { zemin: Record<string, string> }).zemin;

describe('K75: zemin bağlamaları', () => {
  it('Control Water girdap alanı ve boncuk alanı bağlı sprite\'lar mevcut', () => {
    expect(Z['control-water']).toBe('zemin-girdap');
    expect(Z['delayed-blast-fireball']).toBe('zemin-lav');
    for (const n of [Z['control-water'], Z['delayed-blast-fireball']]) expect(FX[n!], n).toBeTruthy();
  });
  it('Delayed Blast Fireball boncuğu zemin yaması çizer', () => {
    const sp = spell('delayed-blast-fireball');
    const s = field(sp);
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: sp.name, slotLevel: 7, targetHex: { col: 5, row: 5 } }, P1, seededRng(3));
    if (!r.ok) throw new Error(r.error);
    const after = applyEvents(s, r.events);
    expect(after.map?.zones?.some((z) => z.bead)).toBe(true);
    expect(groundFx(after).patches.some((p) => p.sprite.id === 'zemin-lav')).toBe(true);
  });
  it('girdap alanı (zone.spellId control-water) yama çizer; taşkın/yarılma alanı (`:terrain`) yama çizmez', () => {
    const base = field(spell('control-water'));
    const hexes = [{ col: 5, row: 5 }, { col: 6, row: 5 }];
    const withZone = (spellId: string): BattleState => ({ ...base, map: { ...base.map!, zones: [{ id: 'z1', spellId, name: 'Control Water', casterId: 'A', side: 'party', dc: 13, slotLevel: 4, hexes }] } as never });
    expect(groundFx(withZone('control-water')).patches.some((p) => p.sprite.id === 'zemin-girdap')).toBe(true);
    expect(groundFx(withZone('control-water:terrain')).patches.some((p) => p.sprite.id === 'zemin-girdap')).toBe(false);
  });
});

describe('K75: su dokusu zemin değişimini izler (Control Water flood/part, flashFlood)', () => {
  it('tile_changed ile yeni su altıgeni doku listesine girer, kuruyan çıkar', () => {
    const base = field(spell('control-water'));
    const tiles = base.map!.tiles.map((row, r) => (r === 5 ? row.slice(0, 4) + 'ww' + row.slice(6) : row));
    const s0: BattleState = { ...base, map: { ...base.map!, tiles } };
    const before = waterHexes(s0).length;
    const wet = applyEvents(s0, [{ type: 'tile_changed', at: { col: 7, row: 5 }, to: 'w' }]);
    expect(waterHexes(wet).length).toBe(before + 1);
    const dry = applyEvents(wet, [{ type: 'tile_changed', at: { col: 4, row: 5 }, to: '.' }]);
    expect(waterHexes(dry).length).toBe(before);
  });
});
