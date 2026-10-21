/** Özel canavar CR tahmini (basitleştirilmiş; data/cr-tahmini.json). */
import { describe, it, expect } from 'vitest';
import { averageDamage, estimateCr } from './crEstimate';

describe('CR tahmini', () => {
  it('ortalama hasar', () => {
    expect([averageDamage('1d6+1'), averageDamage('2d8+3'), averageDamage('1d4')]).toEqual([4.5, 12, 2.5]);
  });
  it('savunma HP ve AC, saldırı hasar ve bonus; sonuç ortalamaya en yakın basamak', () => {
    // Varsayılan taslak: HP 15 (1/8), AC 12 (beklenen 13, fark −1 → basamak yok); 4,5 hasar (1/4), +3 (beklenen 3).
    expect(estimateCr({ hp: 15, ac: 12, attackBonus: 3, damage: '1d6+1' })).toEqual({ defensive: '1/8', offensive: '1/4', cr: '1/8' });
    // Ogre benzeri: HP 68 (1/2), AC 11 (−2 → bir basamak aşağı: 1/4); 13 hasar (CR 1), +6 (beklenen 3: +3 → bir basamak yukarı: 2).
    expect(estimateCr({ hp: 68, ac: 11, attackBonus: 6, damage: '2d8+4' })).toEqual({ defensive: '1/4', offensive: '2', cr: '1' });
    // Güçlü: HP 200 (CR 9), AC 18 (+2 → 10); 40 hasar (CR 6), +9 (beklenen 6: +3 → 7); ortalama 8,5 → 8.
    expect(estimateCr({ hp: 200, ac: 18, attackBonus: 9, damage: '6d10+7' })).toEqual({ defensive: '10', offensive: '7', cr: '8' });
  });
  it('uçlar: çok düşük 0, çok yüksek 30', () => {
    expect(estimateCr({ hp: 1, ac: 5, attackBonus: -5, damage: '1d2' }).cr).toBe('0');
    expect(estimateCr({ hp: 999, ac: 30, attackBonus: 20, damage: '40d12+40' }).cr).toBe('30');
  });
});
