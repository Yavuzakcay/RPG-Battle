/** Jeton boyutu (JSON ölçekleri) ve çizim sırası. */
import { describe, it, expect } from 'vitest';
import sizes from '../../data/token-sizes.json';
import { drawOrder, overhang, tokenScale } from './tokenSize';

const t = (id: string, col: number, row: number, scale: number) => ({ id, pos: { col, row }, y: row * 100 + (col % 2) * 50, scale });

describe('jeton boyutu', () => {
  it('ölçekler JSON\'dan: Tiny 0.3, Small 0.5, Medium 1, Large 1.5, Huge 2, Gargantuan 3', () => {
    expect(sizes.scale).toEqual({ T: 0.3, S: 0.5, M: 1, L: 1.5, H: 2, G: 3 });
    expect((['T', 'S', 'M', 'L', 'H', 'G'] as const).map((size) => tokenScale({ side: 'enemies', size }))).toEqual([0.3, 0.5, 1, 1.5, 2, 3]);
  });
  it('oyuncu karakterleri ve masumlar Medium çizilir', () => {
    expect(tokenScale({ side: 'party', size: 'S' })).toBe(1);
    expect(tokenScale({ side: 'party', civilian: true, size: 'T' })).toBe(1);
  });
  it('taşma menzili: Large ve Huge 1 altıgen, Gargantuan 2', () => {
    expect([0.3, 1, 1.5, 2, 3].map(overhang)).toEqual([0, 0, 1, 1, 2]);
  });
});

describe('çizim sırası', () => {
  it('ekranda aşağıdaki jeton üstte (sonra çizilir)', () => {
    expect(drawOrder([t('alt', 4, 3, 1), t('ust', 4, 2, 1)]).map((x) => x.id)).toEqual(['ust', 'alt']);
  });
  it('büyük jeton yanındaki küçüğü örtmez: küçük, üstüne taşan büyükten sonra çizilir', () => {
    // Gargantuan (4,3) küçük jetonun (4,2) bir alt satırında: normalde üstte olurdu.
    const order = drawOrder([t('kucuk', 4, 2, 0.3), t('dev', 4, 3, 3), t('uzak', 10, 0, 1)]).map((x) => x.id);
    expect(order.indexOf('kucuk')).toBeGreaterThan(order.indexOf('dev'));
    expect(order.indexOf('uzak')).toBeLessThan(order.indexOf('dev'));
  });
  it('taşma menzili dışındaki küçük jeton normal sırada kalır', () => {
    const order = drawOrder([t('kucuk', 4, 0, 1), t('buyuk', 4, 3, 1.5)]).map((x) => x.id);
    expect(order).toEqual(['kucuk', 'buyuk']);
  });
});
