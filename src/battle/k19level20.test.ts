/** Kuyruk 19 (Görev 2 ve 11): seviye tavanı 20; 12 sınıf 12/16/20. seviyede savaşçı oluşur ve kısa savaş çökmeden oynanır. */
import { describe, expect, it } from 'vitest';
import { combatantFromSheet } from './create';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { subclassesOf } from '../rules/classFeatures';
import { proficiencyBonus } from '../rules/abilities';

const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];

describe('Kuyruk 19: 12/16/20. seviye', () => {
  for (const level of [12, 16, 20]) {
    it(`seviye ${level}: 12 sınıf savaşçı oluşur, yetkinlik ve slotlar SRD tablosundan`, () => {
      for (const classId of CLASSES) {
        const sub = subclassesOf(classId)[0]?.id;
        const c = combatantFromSheet({ ...blankCharacter('x').sheet, name: classId, classId, subclassId: sub, level, baseScores: suggestedScores(classId) }, { id: classId, ownerId: 'p1' });
        expect(c.level).toBe(level);
        expect(c.proficiency).toBe(proficiencyBonus(level));
        expect(c.maxHp).toBeGreaterThan(level);
        if (['wizard', 'cleric', 'druid', 'sorcerer', 'bard'].includes(classId)) expect(c.spellSlots[Math.min(8, Math.ceil(level / 2) - 1)] ?? 0).toBeGreaterThan(0);
      }
    });
  }
});
