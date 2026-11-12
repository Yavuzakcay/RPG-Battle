// Kuyruk K58 G4: tehlike katmanı: fırsat saldırısı bölgesi, alev yayılımı, tehdit menzili, hareket; durum değişmez.
import { describe, expect, it } from 'vitest';
import { setup, sword } from '../battle/fixtures';
import type { BattleState, Combatant, SpellZone } from '../battle/types';
import { startBattle } from '../battle/create';
import { mk } from '../battle/fixtures';
import { hazardHexes, mudHexes } from './hazardLayer';

const at = (s: BattleState, id: string, col: number, row: number): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), pos: { col, row } } } });
const zone = (id: string, surface: SpellZone['surface'], hexes: Array<[number, number]>): SpellZone =>
  ({ id, spellId: id, name: id, casterId: 'B', side: 'enemies', dc: 10, slotLevel: 0, hexes: hexes.map(([col, row]) => ({ col, row })), surface }) as SpellZone;

describe('tehlike katmanı', () => {
  it('fırsat saldırısı bölgesi düşmanın erişimi; dostunki yok; tehdit menzili hız + erişim', () => {
    let s = setup('Düz', { B: { weaponOptions: [sword], speed: 30 } });
    s = at(at(at(s, 'A', 2, 3), 'B', 6, 3), 'C', 9, 3);
    const m = hazardHexes(s, { actorId: 'A', threatId: 'B' });
    expect(m.get('5,3')).toContain('oa');
    expect(m.get('10,3') ?? []).not.toContain('oa');
    expect(m.get('2,3')).toContain('threat');
    expect(m.get('14,3') ?? []).not.toContain('threat');
  });
  it('alev yanındaki yağ: alev yayılabilir; hareket menzili', () => {
    let s = setup('Düz');
    s = { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), zones: [zone('f', 'fire', [[4, 4]]), zone('o', 'oil', [[5, 4], [9, 9]])] } };
    const m = hazardHexes(s, { movable: ['1,1'] });
    expect(m.get('4,4')).toContain('surface');
    expect(m.get('5,4')).toContain('fireSpread');
    expect(m.get('9,9') ?? []).not.toContain('fireSpread');
    expect(m.get('1,1')).toContain('move');
  });
});

describe('tehlike katmanı: çamur zemini (Bataklık tanısı)', () => {
  const swamp = (id: string, toggles?: Record<string, boolean>): BattleState =>
    startBattle('bk1', 'dag', [mk('A', { ownerId: 'p1' }), mk('B', { side: 'enemies' })], () => 0.5, { map: { id, ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
  it('Cadının Kampı: çamur (n) altıgenleri "mud"; kural kapalıysa ve çamursuz haritada yok; durum değişmez', () => {
    const s = swamp('batak-kamp');
    const m = hazardHexes(s, {});
    expect(m.get('1,4')).toContain('mud');
    expect(m.get('0,0') ?? []).not.toContain('mud');
    expect(mudHexes(s).length).toBe(15);
    const off = swamp('batak-kamp', { sinkMud: false, leeches: false });
    expect(mudHexes(off)).toEqual([]);
    expect(mudHexes(swamp('kale'))).toEqual([]);
    expect(hazardHexes(s, {})).toEqual(m);
  });
});
