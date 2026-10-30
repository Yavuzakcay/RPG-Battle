/** Görev A6: ayak izi geometrisi (sabit şekiller, en yakın altıgen mesafesi, sığma). */
import { describe, expect, it } from 'vitest';
import { SHAPES, distanceToHex, fits, footprint, footprintDistance, hexCount } from './footprint';
import { distance, hexKey, neighbors, type Offset } from './hex';

const o = (col: number, row: number): Offset => ({ col, row });
const G = { cols: 15, rows: 7 };

describe('ayak izi', () => {
  it('altıgen sayıları: T/S/M 1, L 3, H 7, G 19; ilki çapa; altıgenler benzersiz ve birbirine bağlı', () => {
    expect((['T', 'S', 'M', 'L', 'H', 'G'] as const).map(hexCount)).toEqual([1, 1, 1, 3, 7, 19]);
    for (const size of ['L', 'H', 'G'] as const) for (const anchor of [o(6, 3), o(7, 3)]) {
      const fp = footprint(anchor, size);
      expect(fp[0]).toEqual(anchor);
      expect(new Set(fp.map(hexKey)).size).toBe(fp.length);
      // Bağlılık: her altıgen kümedeki bir başkasına bitişik.
      for (const h of fp.slice(1)) expect(fp.some((x) => distance(x, h) === 1)).toBe(true);
    }
  });
  it('Large üçgen: çapa ve iki komşusu birbirine bitişik; Huge çapanın komşuları; Gargantuan yarıçap 2', () => {
    const l = footprint(o(6, 3), 'L');
    expect(distance(l[1]!, l[2]!)).toBe(1);
    expect(footprint(o(6, 3), 'H').slice(1).map(hexKey).sort()).toEqual(neighbors(o(6, 3)).map(hexKey).sort());
    expect(footprint(o(6, 3), 'G').every((h) => distance(h, o(6, 3)) <= 2)).toBe(true);
    expect(SHAPES.M).toHaveLength(1);
  });
  it('mesafe en yakın iki altıgen arası; tek altıgenlide distance ile aynı', () => {
    expect(footprintDistance([o(2, 2)], [o(5, 2)])).toBe(distance(o(2, 2), o(5, 2)));
    const huge = footprint(o(7, 3), 'H');
    expect(footprintDistance(huge, [o(9, 3)])).toBe(1);
    expect(distanceToHex(huge, o(7, 3))).toBe(0);
    expect(footprintDistance(footprint(o(3, 3), 'L'), footprint(o(6, 3), 'L'))).toBe(2);
  });
  it('sığma: harita içinde ve her altıgen uygun', () => {
    expect(fits(o(0, 0), 'H', G)).toBe(false);
    expect(fits(o(1, 1), 'H', G)).toBe(true);
    expect(fits(o(13, 5), 'L', G)).toBe(true);
    expect(fits(o(14, 5), 'L', G)).toBe(false);
    expect(fits(o(5, 3), 'L', G, (h) => h.col !== 6)).toBe(false);
  });
});
