import { describe, it, expect } from 'vitest';
import {
  axialToOffset, directionTo, distance, findPath, hexKey, line, neighbors, offsetToAxial, ring, withinRange,
  type EnterCost, type Offset,
} from './hex';

const GRID = { cols: 15, rows: 7 };
const o = (col: number, row: number): Offset => ({ col, row });
const keys = (xs: Offset[]) => xs.map(hexKey).sort();
const all: Offset[] = [];
for (let row = 0; row < GRID.rows; row++) for (let col = 0; col < GRID.cols; col++) all.push(o(col, row));

describe('offset ↔ axial (odd-q)', () => {
  it('bilinen koordinatlar', () => {
    expect(offsetToAxial(o(0, 0))).toEqual({ q: 0, r: 0 });
    expect(offsetToAxial(o(1, 0))).toEqual({ q: 1, r: 0 });
    expect(offsetToAxial(o(2, 0))).toEqual({ q: 2, r: -1 });
    expect(offsetToAxial(o(3, 3))).toEqual({ q: 3, r: 2 });
    expect(offsetToAxial(o(14, 6))).toEqual({ q: 14, r: -1 });
    expect(axialToOffset({ q: 14, r: -7 })).toEqual(o(14, 0));
  });
  it('15×7 ızgaranın her altıgeni gidip geri döner', () => {
    for (const h of all) expect(axialToOffset(offsetToAxial(h))).toEqual(h);
  });
});

describe('mesafe', () => {
  it('15×7 köşeleri arası', () => {
    expect(distance(o(0, 0), o(14, 0))).toBe(14);
    expect(distance(o(0, 0), o(0, 6))).toBe(6);
    expect(distance(o(0, 0), o(14, 6))).toBe(14);
    expect(distance(o(14, 0), o(0, 6))).toBe(14);
    expect(distance(o(3, 3), o(3, 3))).toBe(0);
  });
  it('simetriktir ve komşular arası 1', () => {
    for (const h of all) {
      for (const n of neighbors(h, GRID)) expect(distance(h, n)).toBe(1);
    }
    expect(distance(o(2, 5), o(11, 1))).toBe(distance(o(11, 1), o(2, 5)));
  });
});

describe('komşular: tek ve çift sütun kayması', () => {
  it('tek sütun (0 tabanlı 1) aşağı kayık: yan sütunlarda aynı satır ve bir alt satır', () => {
    expect(keys(neighbors(o(1, 1)))).toEqual(keys([o(1, 0), o(1, 2), o(0, 1), o(0, 2), o(2, 1), o(2, 2)]));
  });
  it('çift sütun (0 tabanlı 2): yan sütunlarda bir üst satır ve aynı satır', () => {
    expect(keys(neighbors(o(2, 2)))).toEqual(keys([o(2, 1), o(2, 3), o(1, 1), o(1, 2), o(3, 1), o(3, 2)]));
  });
  it('köşelerde ızgara dışı komşular atılır', () => {
    expect(keys(neighbors(o(0, 0), GRID))).toEqual(keys([o(1, 0), o(0, 1)]));
    expect(keys(neighbors(o(14, 0), GRID))).toEqual(keys([o(13, 0), o(14, 1)]));
    expect(keys(neighbors(o(0, 6), GRID))).toEqual(keys([o(0, 5), o(1, 5), o(1, 6)]));
    expect(keys(neighbors(o(14, 6), GRID))).toEqual(keys([o(14, 5), o(13, 5), o(13, 6)]));
  });
});

describe('halka ve menzil', () => {
  it('halka 6k altıgen, hepsi tam k uzaklıkta', () => {
    for (const k of [1, 2, 3]) {
      const r = ring(o(7, 3), k);
      expect(r.length).toBe(6 * k);
      expect(new Set(r.map(hexKey)).size).toBe(6 * k);
      for (const h of r) expect(distance(o(7, 3), h)).toBe(k);
    }
    expect(ring(o(7, 3), 0)).toEqual([o(7, 3)]);
  });
  it('menzil 1 + 3k(k+1) altıgen; ızgara verilince dışarısı atılır', () => {
    expect(withinRange(o(7, 3), 2).length).toBe(19);
    expect(withinRange(o(7, 3), 3).length).toBe(37);
    const corner = withinRange(o(0, 0), 1, GRID);
    expect(keys(corner)).toEqual(keys([o(0, 0), o(1, 0), o(0, 1)]));
  });
});

describe('çizgi (görüş hattı)', () => {
  it('uçları içerir, ardışık altıgenler komşudur, uzunluk mesafe + 1', () => {
    const pairs: Array<[Offset, Offset]> = [[o(0, 0), o(14, 0)], [o(0, 6), o(14, 0)], [o(2, 5), o(11, 1)], [o(3, 3), o(3, 0)]];
    for (const [a, b] of pairs) {
      const l = line(a, b);
      expect(l[0]).toEqual(a);
      expect(l[l.length - 1]).toEqual(b);
      expect(l.length).toBe(distance(a, b) + 1);
      for (let i = 1; i < l.length; i++) expect(distance(l[i - 1] as Offset, l[i] as Offset)).toBe(1);
    }
  });
  it('aynı altıgen tek elemanlı çizgi verir ve sonuç her seferinde aynıdır', () => {
    expect(line(o(4, 4), o(4, 4))).toEqual([o(4, 4)]);
    expect(line(o(0, 0), o(3, 3))).toEqual(line(o(0, 0), o(3, 3)));
  });
});

describe('yön', () => {
  it('düz eksendeki hedefin yönünü verir, değilse null', () => {
    expect(directionTo(o(3, 3), o(3, 0))).toBe(2); // yukarı: (0,-1)
    expect(directionTo(o(3, 3), o(6, 5))).toBe(0); // axial (1,0) yönünde 3 adım
    expect(directionTo(o(3, 3), o(6, 3))).toBe(null); // aynı satır düz eksen değil
    expect(directionTo(o(3, 3), o(5, 0))).toBe(null);
    expect(directionTo(o(3, 3), o(3, 3))).toBe(null);
  });
});

describe('yol bulma', () => {
  const open: EnterCost = () => 1;
  it('açık zeminde en kısa yol mesafeye eşit, başlangıç yolda yok', () => {
    const r = findPath(o(0, 0), o(14, 6), GRID, open);
    expect(r?.cost).toBe(14);
    expect(r?.path.length).toBe(14);
    expect(r?.path[r.path.length - 1]).toEqual(o(14, 6));
    expect(findPath(o(5, 5), o(5, 5), GRID, open)).toEqual({ path: [], cost: 0 });
  });
  it('zorlu zemin 2 harcar; ucuzsa dolaşır', () => {
    // (1,0)..(1,5) zorlu: sütun 1'i geçmek 2'ye mal olur, (1,6) açık ama uzak.
    const rough: EnterCost = (h) => (h.col === 1 && h.row <= 5 ? 2 : 1);
    const r = findPath(o(0, 0), o(2, 0), GRID, rough);
    expect(r?.cost).toBe(3);
    // Hedef zorlu zeminse ona girmek de 2 harcar.
    expect(findPath(o(0, 0), o(1, 0), GRID, rough)?.cost).toBe(2);
  });
  it('engel geçilmez, etrafından dolaşılır; kapalıysa yol yok', () => {
    const wall: EnterCost = (h) => (h.col === 7 && h.row !== 6 ? null : 1);
    const around = findPath(o(6, 0), o(8, 0), GRID, wall);
    expect(around).not.toBe(null);
    expect(around?.path.some((h) => h.col === 7 && h.row !== 6)).toBe(false);
    const closed: EnterCost = (h) => (h.col === 7 ? null : 1);
    expect(findPath(o(6, 0), o(8, 0), GRID, closed)).toBe(null);
    expect(findPath(o(6, 0), o(7, 3), GRID, closed)).toBe(null); // hedefin kendisi engel
  });
  it('bütçeyi aşan yol bulunmaz', () => {
    expect(findPath(o(0, 0), o(6, 0), GRID, open, 6)?.cost).toBe(6);
    expect(findPath(o(0, 0), o(7, 0), GRID, open, 6)).toBe(null);
  });
  it('ızgara dışı başlangıç veya hedef reddedilir', () => {
    expect(findPath(o(0, 0), o(15, 0), GRID, open)).toBe(null);
    expect(findPath(o(-1, 0), o(1, 0), GRID, open)).toBe(null);
  });
});
