/** Görev SD8: Dark Elf ten paleti koyu mor-gri; D (varsayılan) duraklarında koyu #4A4577, orta #7B72A8, açık #A79BC7. */
import { describe, expect, it } from 'vitest';
import { paletteTint, lineageTint } from '../battle/avatar';
import { labToRgb } from './color';
import soy from '../../data/soy-renkleri.json';

const hex = (s: number[]) => '#' + labToRgb(s[0]!, s[1]!, s[2]!).map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
const dist = (a: string, b: string) => Math.hypot(...[1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)));
const grad = (k: string) => (paletteTint('elf', 'drow', k)!.to as { gradient: number[][] }).gradient;

describe('SD8: Dark Elf mor-gri', () => {
  it('varsayılan palet D; D duraklarında istenen üç renk (±6 RGB)', () => {
    expect((soy.races.elf as { drowPalet: string }).drowPalet).toBe('D');
    expect((lineageTint('elf', 'drow')!.to as { gradient: number[][] }).gradient).toEqual(grad('D'));
    const g = grad('D');
    // Drow yoğunluğu Tenhausser'a çekildi (alt soy görünüm kararı): ton mor-mavi kalır, açıklık aralığı dar (en açık durak ≤ 56, pastel yok).
    for (const s of g) {
      const h = ((Math.atan2(s[2]!, s[1]!) * 180) / Math.PI + 360) % 360;
      expect(s[1]!).toBeGreaterThan(0); expect(s[2]!).toBeLessThan(0);
      expect(h).toBeGreaterThan(285); expect(h).toBeLessThan(310);
    }
    expect(Math.max(...g.map((s) => s[0]!))).toBeLessThanOrEqual(56);
    expect(hex(g[3]!)).toMatch(/^#[0-9A-F]{6}$/); expect(dist(hex(g[3]!), '#7B72A8')).toBeGreaterThan(0);
  });
  it('A, D\'den açık; B koyu; C lavantaya (daha mor: a büyük, b daha eksi); dördü de 7 durak', () => {
    const mean = (k: string) => grad(k).reduce((n, s) => n + s[0]!, 0) / grad(k).length;
    expect(mean('A')).toBeGreaterThan(mean('D')); expect(mean('B')).toBeLessThan(mean('D'));
    expect(grad('C')[3]![1]!).toBeGreaterThan(grad('D')[3]![1]!);
    for (const k of ['A', 'B', 'C', 'D']) expect(grad(k).length).toBe(7);
  });
});
