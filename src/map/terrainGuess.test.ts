/** Kuyruk 21 D1: görselden zemin önerisi çekirdeği (renk kümeleme, palet eşleme, elle düzeltme). */
import { describe, expect, it } from 'vitest';
import { applyCorrections, kmeans, nearestTerrain, suggestTiles, type Rgb } from './terrainGuess';

const palette: Record<string, Rgb[]> = { '#': [[5, 5, 5]], '.': [[120, 90, 60]], '~': [[240, 120, 20]] };

describe('harita-zemin çekirdeği', () => {
  it('k-means belirlenimci ve ayrık renkleri ayırır', () => {
    const pts: Rgb[] = [[0, 0, 0], [10, 5, 5], [250, 120, 10], [240, 130, 30], [120, 80, 60], [130, 95, 55]];
    const a = kmeans(pts, 3), b = kmeans(pts, 3);
    expect(a).toEqual(b);
    expect(new Set(a.labels).size).toBe(3);
    expect(a.labels[0]).toBe(a.labels[1]);
    expect(a.labels[2]).toBe(a.labels[3]);
  });
  it('küme merkezi en yakın palet harfine gider; öneri satırları ızgara boyutunda', () => {
    expect(nearestTerrain([230, 110, 30], palette)).toBe('~');
    const colors: Rgb[] = [[3, 3, 3], [125, 90, 62], [245, 125, 25], [8, 6, 4], [118, 88, 58], [235, 118, 18]];
    expect(suggestTiles(colors, 3, 2, palette, 3)).toEqual(['#.~', '#.~']);
  });
  it('boşluk eşiği: koyu altıgen kümelemeye girmeden #, koyu zemin zemin kalır', () => {
    const dark: Record<string, Rgb[]> = { '#': [[0, 0, 0]], '.': [[30, 28, 30]], '~': [[240, 120, 20]] };
    const colors: Rgb[] = [[2, 1, 3], [32, 29, 31], [28, 26, 30], [1, 0, 2]];
    expect(suggestTiles(colors, 2, 2, dark, 2, 10)).toEqual(['#.', '.#']);
  });
  it('elle düzeltme 1 tabanlı: satır, dikdörtgen, hücre sırasıyla; hatalı girdi reddedilir', () => {
    const t = applyCorrections(['....', '....', '....'], { satirlar: { 1: '####' }, bolgeler: [{ col0: 2, row0: 2, col1: 3, row1: 3, zemin: '~' }], hucreler: [{ col: 3, row: 3, zemin: 'p' }] });
    expect(t).toEqual(['####', '.~~.', '.~p.']);
    expect(() => applyCorrections(['..'], { hucreler: [{ col: 3, row: 1, zemin: '.' }] })).toThrow(/harita dışında/);
    expect(() => applyCorrections(['..'], { satirlar: { 1: '...' } })).toThrow(/2 olmalı/);
    expect(() => applyCorrections(['..'], { hucreler: [{ col: 1, row: 1, zemin: 'ab' }] })).toThrow(/tek harf/);
  });
});
