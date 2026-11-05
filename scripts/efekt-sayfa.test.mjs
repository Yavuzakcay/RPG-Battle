// Görev E1: efekt sayfası kesim yardımcıları (parlaklık alfası, karanlık kesim, oluk koşuları).
import { describe, it, expect } from 'vitest';
import { cuts, gutterRuns, lumAlpha } from './efekt-sayfa.mjs';

describe('efekt sayfası kesimi', () => {
  it('parlaklık alfası: (max − 12) / 243, 0..1', () => {
    expect(lumAlpha(0, 0, 0)).toBe(0);
    expect(lumAlpha(12, 5, 3)).toBe(0);
    expect(lumAlpha(255, 0, 0)).toBe(1);
    expect(lumAlpha(10, 133, 20)).toBeCloseTo(121 / 243);
  });
  it('karanlık kesim beklenen sınıra en yakın karanlık çizgiden', () => {
    // 3 parça, sınırlar 30 ve 60 civarında karanlık (0), arası parlak; 28 ve 63'te boşluk.
    const p = Array.from({ length: 90 }, (_, i) => (i === 28 || i === 27 || i === 29 || i === 62 || i === 63 || i === 64 ? 0 : 200));
    expect(cuts(p, 3)).toEqual([[0, 28], [28, 63], [63, 90]]);
  });
  it('oluk: tek tonlu ince gri çizgi; kalın tek tonlu bant içerik sayılır', () => {
    const min = [30, 30, 5, 5, 5, ...Array(30).fill(4), 30, 30, ...Array(30).fill(4), 30];
    expect(gutterRuns(min)).toEqual([[2, 35], [37, 67]]);
    const band = [30, ...Array(25).fill(4), ...Array(20).fill(40), ...Array(25).fill(4), 30];
    const flat = band.map(() => 1);
    expect(gutterRuns(band, 15, flat)).toEqual([[1, 71]]);
  });
});
