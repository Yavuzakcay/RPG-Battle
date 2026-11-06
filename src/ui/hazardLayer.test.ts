// Kuyruk K58 G4: tehlike katmanı: fırsat saldırısı bölgesi, alev yayılımı, tehdit menzili, hareket; durum değişmez.
import { describe, expect, it } from 'vitest';
import { setup, sword } from '../battle/fixtures';
import type { BattleState, Combatant, SpellZone } from '../battle/types';
import { hazardHexes } from './hazardLayer';

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
