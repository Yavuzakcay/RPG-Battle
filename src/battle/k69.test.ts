/**
 * Kuyruk K69 (kural sürümü 53): çok altıgenli yaratıkların kalanları. Yalnız `multiHex` açıkken ve sürüm 53'te değişir;
 * kapalıyken ya da sürüm 52'de eski davranış (sayaç `bodyStats` ile hızlı yol). `run` replay'i denetler.
 */
import { describe, expect, it } from 'vitest';
import { footprint, hexCount } from '../rules/footprint';
import { gargantuanTooBig } from '../app/setup';
import { t } from '../i18n';

describe('K69 sınırlar', () => {
  it('ayak izi şekilleri A6 ile aynı: Large 3, Huge 7, Gargantuan 19 (K69 isteği Large 4; A6 esas alındı)', () => {
    expect([hexCount('M'), hexCount('L'), hexCount('H'), hexCount('G')]).toEqual([1, 3, 7, 19]);
    expect(footprint({ col: 5, row: 5 }, 'G')).toHaveLength(19);
  });
  it('Gargantuan çok altıgen açıkken 15×7 haritada seçilemez (neden satırı TR/EN); 21×11 ve bayrak kapalı serbest', () => {
    const garg = [{ monster: { size: 'G' as const } }];
    expect(gargantuanTooBig({ cols: 15, rows: 7 }, garg, true)).toBe(true);
    expect(gargantuanTooBig({ cols: 21, rows: 11 }, garg, true)).toBe(false);
    expect(gargantuanTooBig({ cols: 31, rows: 17 }, garg, true)).toBe(false);
    expect(gargantuanTooBig({ cols: 15, rows: 7 }, garg, false)).toBe(false);
    expect(gargantuanTooBig({ cols: 15, rows: 7 }, [{ monster: { size: 'H' as const } }], true)).toBe(false);
    expect(t().gm.multiHex.gargantuanSmall).toMatch(/21×11/);
  });
});
