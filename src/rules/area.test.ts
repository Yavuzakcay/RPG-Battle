import { describe, it, expect } from 'vitest';
import { areaHexes, stepToward, type AreaSpec } from './area';
import { distance, hexKey, isInside, sameHex, type Offset } from './hex';

const BIG = { cols: 50, rows: 50 };
const o = (col: number, row: number): Offset => ({ col, row });
const C = o(20, 20);
const spec = (shape: AreaSpec['shape'], sizeFt: number, origin: AreaSpec['origin']): AreaSpec => ({ shape, sizeFt, origin });
const unique = (xs: Offset[]) => new Set(xs.map(hexKey)).size === xs.length;

describe('noktadan çıkan alanlar', () => {
  it('küre: yarıçap / 5 altıgen (5 ft → 7, 10 ft → 19, 20 ft → 61)', () => {
    expect(areaHexes(spec('sphere', 5, 'point'), o(0, 0), C, BIG).length).toBe(7);
    expect(areaHexes(spec('sphere', 10, 'point'), o(0, 0), C, BIG).length).toBe(19);
    expect(areaHexes(spec('sphere', 20, 'point'), o(0, 0), C, BIG).length).toBe(61);
  });
  it('küp: kenar / 10 yarıçaplı öbek (20 ft → 19, 30 ft → 37)', () => {
    expect(areaHexes(spec('cube', 20, 'point'), o(0, 0), C, BIG).length).toBe(19);
    expect(areaHexes(spec('cube', 30, 'point'), o(0, 0), C, BIG).length).toBe(37);
  });
  it('ızgara dışına taşan altıgenler atılır', () => {
    const hexes = areaHexes(spec('sphere', 20, 'point'), o(0, 0), o(0, 0), { cols: 15, rows: 7 });
    expect(hexes.every((h) => isInside(h, { cols: 15, rows: 7 }))).toBe(true);
    expect(hexes.length).toBeLessThan(61);
  });
});

describe('büyücüden çıkan alanlar', () => {
  it('koni 15 ft (SRD: genişlik = uzaklık): 1 + 1 + 3 = 5 altıgen; büyücü dahil değil, hedef yönünde', () => {
    const hexes = areaHexes(spec('cone', 15, 'self'), C, o(20, 23), BIG);
    expect(hexes.length).toBe(5);
    expect(unique(hexes)).toBe(true);
    expect(hexes.some((h) => sameHex(h, C))).toBe(false);
    for (const h of hexes) {
      expect(distance(C, h)).toBeLessThanOrEqual(3);
      expect(h.row).toBeGreaterThan(C.row - 1); // aşağı yönde
    }
    expect(hexes.filter((h) => distance(C, h) === 1).length).toBe(1);
  });
  it('koni alanı her yönde ideale yakın (½ × L², altıgen ≈ 21,65 ft²): 15 ft ≈ 5, 30 ft ≈ 21, 60 ft ≈ 83', () => {
    const aims = [o(20, 30), o(26, 20), o(27, 24), o(14, 17), o(12, 20), o(20, 10)];
    for (const [ft, lo, hi] of [[15, 5, 6], [30, 17, 22], [60, 78, 88]] as const) {
      for (const aim of aims) {
        const n = areaHexes(spec('cone', ft, 'self'), C, aim, BIG).length;
        expect(n).toBeGreaterThanOrEqual(lo);
        expect(n).toBeLessThanOrEqual(hi);
      }
    }
  });
  it('koni 30 ft daha uzun ve daha geniş', () => {
    expect(areaHexes(spec('cone', 30, 'self'), C, o(20, 26), BIG).length).toBeGreaterThan(7);
  });
  it('çizgi 100 ft: 20 altıgen, kesintisiz, büyücünün yanından başlar', () => {
    const hexes = areaHexes(spec('line', 100, 'self'), o(5, 25), o(10, 25), BIG);
    expect(hexes.length).toBe(20);
    expect(distance(o(5, 25), hexes[0] as Offset)).toBe(1);
    for (let i = 1; i < hexes.length; i++) expect(distance(hexes[i - 1] as Offset, hexes[i] as Offset)).toBe(1);
  });
  it('çizgi genişliği: 10 ft genişlikli 90 ft çizgi iki paralel şerit (≈ 36 altıgen), çıkış dahil değil', () => {
    const narrow = areaHexes({ shape: 'line', sizeFt: 90, origin: 'self' }, C, o(20, 40), BIG);
    const wide = areaHexes({ shape: 'line', sizeFt: 90, origin: 'self', widthFt: 10 }, C, o(20, 40), BIG);
    expect(narrow.length).toBe(18);
    expect(wide.length).toBeGreaterThanOrEqual(35);
    expect(wide.length).toBeLessThanOrEqual(36);
    expect(unique(wide)).toBe(true);
    expect(wide.some((h) => sameHex(h, C))).toBe(false);
    for (const h of narrow) expect(wide.some((w) => sameHex(w, h))).toBe(true);
    const diag = areaHexes({ shape: 'line', sizeFt: 60, origin: 'self', widthFt: 10 }, C, o(30, 26), BIG);
    expect(diag.length).toBeGreaterThanOrEqual(23);
    expect(diag.length).toBeLessThanOrEqual(24);
  });
  it('büyücüden çıkan küp 15 ft: hedef yönünde 7 altıgenlik öbek, büyücü dahil değil', () => {
    const aim = o(20, 25);
    const hexes = areaHexes(spec('cube', 15, 'self'), C, aim, BIG);
    expect(hexes.length).toBe(7);
    expect(hexes.some((h) => sameHex(h, C))).toBe(false);
    expect(hexes.some((h) => sameHex(h, stepToward(C, aim, 2)))).toBe(true);
    for (const h of hexes) expect(distance(C, h)).toBeLessThanOrEqual(3);
  });
  it('yayılım 15 ft: büyücünün çevresinde 3 halka (36 altıgen), büyücü dahil değil', () => {
    const hexes = areaHexes(spec('emanation', 15, 'self'), C, null, BIG);
    expect(hexes.length).toBe(36);
    expect(hexes.some((h) => sameHex(h, C))).toBe(false);
  });
  it('yön için büyücünün kendi altıgeni seçilemez; nokta verilmezse alan boş', () => {
    expect(areaHexes(spec('cone', 15, 'self'), C, C, BIG)).toEqual([]);
    expect(areaHexes(spec('sphere', 20, 'point'), C, null, BIG)).toEqual([]);
  });
});
