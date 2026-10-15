import { describe, it, expect } from 'vitest';
import {
  POINT_BUY_BUDGET, backgroundPattern, blankCharacter, characterProblems, maxSpellLevel, pointBuyCost, spellOptions,
  suggestedScores, usesStandardArray, withSkills, type SavedCharacter,
} from './builder';

const fighter = (patch: Partial<SavedCharacter['sheet']> = {}, extra: Partial<SavedCharacter> = {}): SavedCharacter => {
  const b = blankCharacter('x');
  return { ...b, classSkills: ['athletics', 'perception'], ...extra, sheet: { ...b.sheet, name: 'Bor', ...patch } };
};

describe('skorlar', () => {
  it('standart dizi: altı değer bir kez', () => {
    expect(usesStandardArray(suggestedScores('wizard'))).toBe(true);
    expect(suggestedScores('wizard').int).toBe(15);
    expect(usesStandardArray({ str: 15, dex: 15, con: 13, int: 12, wis: 10, cha: 8 })).toBe(false);
  });
  it('point buy: 27 puan, 8–15, 14 ve 15 pahalı', () => {
    expect(pointBuyCost({ str: 15, dex: 15, con: 15, int: 8, wis: 8, cha: 8 })).toBe(27);
    expect(pointBuyCost({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 })).toBe(27);
    expect(pointBuyCost({ str: 16, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })).toBe(null);
    expect(POINT_BUY_BUDGET).toBe(27);
  });
  it('geçmiş bonusu kalıbı', () => {
    expect(backgroundPattern({ str: 2, con: 1 })).toBe('2-1');
    expect(backgroundPattern({ str: 1, dex: 1, con: 1 })).toBe('1-1-1');
    expect(backgroundPattern({})).toBe('none');
    expect(backgroundPattern({ str: 2, con: 2 })).toBe('invalid');
  });
});

describe('büyüler', () => {
  it('en yüksek slot seviyesine kadar sınıf listesindeki büyüler', () => {
    expect(maxSpellLevel('wizard', 5)).toBe(3);
    expect(maxSpellLevel('fighter', 5)).toBe(0);
    expect(spellOptions('wizard', 1)).toContain('Magic Missile');
    expect(spellOptions('wizard', 1)).not.toContain('Fireball');
    expect(spellOptions('wizard', 5)).toContain('Fireball');
    expect(spellOptions('fighter', 5)).toEqual([]);
  });
});

describe('form denetimi', () => {
  it('geçerli savaşçı sorunsuz; beceri listesi sınıf + diğerleri', () => {
    const c = withSkills(fighter({}, { otherSkills: ['intimidation', 'survival'] }));
    expect(characterProblems(c)).toEqual([]);
    expect(c.sheet.skills).toEqual(['athletics', 'perception', 'intimidation', 'survival']);
  });
  it('sorunları sayar: ad, skor, beceri, miras, büyü', () => {
    expect(characterProblems(fighter({ name: ' ' }))).toContain('Ad boş olamaz.');
    expect(characterProblems(fighter({ baseScores: { str: 15, dex: 15, con: 13, int: 12, wis: 10, cha: 8 } })).join()).toContain('Standart dizi');
    expect(characterProblems(fighter({ baseScores: { str: 15, dex: 15, con: 15, int: 10, wis: 8, cha: 8 } }, { method: 'pointBuy' })).join()).toContain('29 puan');
    expect(characterProblems(fighter({}, { classSkills: ['stealth', 'athletics'] })).join()).toContain('Sınıf listesinde yok');
    expect(characterProblems(fighter({ raceId: 'tiefling' })).join()).toContain('miras seçilmeli');
    expect(characterProblems(fighter({ spellNames: ['Fireball'] })).join()).toContain('Fireball bu sınıf ve seviyede seçilemez.');
    expect(characterProblems(fighter({ backgroundBonuses: { str: 2, dex: 2 } })).join()).toContain('Geçersiz geçmiş bonusu');
  });
});
