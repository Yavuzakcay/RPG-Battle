import { describe, it, expect } from 'vitest';
import { parseDice, rollDie, rollDice, rollD20, type Rng } from './dice';

/** Sırayla istediğimiz zar değerlerini üreten sahte rastgele üretici. */
function fixed(sides: number, values: number[]): Rng {
  let i = 0;
  return () => ((values[i++] ?? 1) - 0.5) / sides;
}

describe('parseDice', () => {
  it('basit ifadeleri ayrıştırır', () => {
    expect(parseDice('2d6+3')).toEqual({ count: 2, sides: 6, bonus: 3 });
    expect(parseDice('d20')).toEqual({ count: 1, sides: 20, bonus: 0 });
    expect(parseDice('1d8-1')).toEqual({ count: 1, sides: 8, bonus: -1 });
    expect(parseDice(' 3 D 10 + 2 ')).toEqual({ count: 3, sides: 10, bonus: 2 });
  });

  it('geçersiz ifadelerde hata verir', () => {
    expect(() => parseDice('abc')).toThrow();
    expect(() => parseDice('0d6')).toThrow();
    expect(() => parseDice('2d1')).toThrow();
    expect(() => parseDice('')).toThrow();
  });
});

describe('rollDie', () => {
  it('sınır değerleri doğru üretir', () => {
    expect(rollDie(6, () => 0)).toBe(1);
    expect(rollDie(6, () => 0.9999)).toBe(6);
    expect(rollDie(20, () => 0.5)).toBe(11);
  });

  it('gerçek rastgelelikte her zaman aralık içinde kalır', () => {
    for (let i = 0; i < 5000; i++) {
      const v = rollDie(20);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(20);
    }
  });
});

describe('rollDice', () => {
  it('zarları toplar ve bonusu ekler', () => {
    const r = rollDice('2d6+3', fixed(6, [4, 5]));
    expect(r.rolls).toEqual([4, 5]);
    expect(r.total).toBe(12);
  });

  it('negatif bonusu çıkarır', () => {
    expect(rollDice('1d8-1', fixed(8, [5])).total).toBe(4);
  });

  it('kritik vuruşta zar sayısını ikiye katlar, bonusu katlamaz', () => {
    const r = rollDice('2d6+3', fixed(6, [1, 2, 3, 4]), true);
    expect(r.rolls).toEqual([1, 2, 3, 4]);
    expect(r.total).toBe(13); // 1+2+3+4 = 10, +3 bonus
  });
});

describe('rollD20', () => {
  it('normalde tek zar atar', () => {
    const r = rollD20('normal', fixed(20, [14]));
    expect(r).toEqual({ rolls: [14], kept: 14, mode: 'normal' });
  });

  it('avantajda yüksek zarı sayar', () => {
    const r = rollD20('advantage', fixed(20, [4, 17]));
    expect(r.rolls).toEqual([4, 17]);
    expect(r.kept).toBe(17);
  });

  it('dezavantajda düşük zarı sayar', () => {
    const r = rollD20('disadvantage', fixed(20, [4, 17]));
    expect(r.kept).toBe(4);
  });
});
