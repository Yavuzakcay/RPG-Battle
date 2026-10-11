import { describe, it, expect } from 'vitest';
import { abilityModifier, proficiencyBonus } from './abilities';

describe('abilityModifier', () => {
  it('D&D tablosuyla uyuşur', () => {
    const table: Array<[number, number]> = [
      [1, -5], [3, -4], [8, -1], [9, -1], [10, 0], [11, 0],
      [12, 1], [14, 2], [16, 3], [18, 4], [20, 5], [30, 10],
    ];
    for (const [score, mod] of table) {
      expect(abilityModifier(score)).toBe(mod);
    }
  });
});

describe('proficiencyBonus', () => {
  it('seviyeye göre doğru bonusu verir', () => {
    const table: Array<[number, number]> = [
      [1, 2], [4, 2], [5, 3], [8, 3], [9, 4], [12, 4], [13, 5], [16, 5], [17, 6], [20, 6],
    ];
    for (const [level, bonus] of table) {
      expect(proficiencyBonus(level)).toBe(bonus);
    }
  });

  it('geçersiz seviyelerde hata verir', () => {
    expect(() => proficiencyBonus(0)).toThrow();
    expect(() => proficiencyBonus(21)).toThrow();
    expect(() => proficiencyBonus(2.5)).toThrow();
  });
});
