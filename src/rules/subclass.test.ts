/** Alt sınıf (Görev P-Paladin): motor varsayılan alt sınıf vermez, oluşturucu 3+ seviyede ister, eski kayıtlara atanır. */
import { describe, it, expect } from 'vitest';
import { blankCharacter, characterProblems, migrateSubclasses, needsSubclass, withSkills, type SavedCharacter } from './builder';
import { classKit, gainedFeatures } from './classFeatures';
import { combatantFromSheet } from '../battle';
import { PARTY_KINDS, partyAt } from '../sim/balance';

const fighter = (level: number, subclassId?: string): SavedCharacter => {
  const c = blankCharacter('f1');
  return withSkills({ ...c, classSkills: ['athletics', 'perception'], sheet: { ...c.sheet, name: 'Bor', level, armorName: 'Chain Mail', ...(subclassId ? { subclassId } : {}) } });
};

describe('alt sınıf', () => {
  it('alt sınıf boşsa motor alt sınıf özelliği vermez', () => {
    expect(gainedFeatures('barbarian', 3).some((f) => f.from === 'subclass')).toBe(false);
    expect(classKit('barbarian', 3).frenzy).toBe(false);
    expect(classKit('barbarian', 3, 'path-of-the-berserker').frenzy).toBe(true);
    const grum = { name: 'Grum', raceId: 'human', classId: 'barbarian', level: 3, armorName: 'Zırhsız', shield: false, itemNames: [],
      baseScores: { str: 15, dex: 14, con: 13, int: 8, wis: 12, cha: 10 } };
    expect(combatantFromSheet(grum, { id: 'g', ownerId: 'p' }).frenzy).toBeUndefined();
    expect(combatantFromSheet({ ...grum, subclassId: 'path-of-the-berserker' }, { id: 'g', ownerId: 'p' }).frenzy).toBe(true);
  });
  it('oluşturucu: 3. seviye ve üstünde alt sınıf zorunlu, altında gerekmez', () => {
    expect(needsSubclass({ classId: 'fighter', level: 2 })).toBe(false);
    expect(needsSubclass({ classId: 'fighter', level: 3 })).toBe(true);
    expect(characterProblems(fighter(2))).toEqual([]);
    expect(characterProblems(fighter(3)).join(' ')).toContain('Alt sınıf seçilmeli');
    expect(characterProblems(fighter(3, 'champion'))).toEqual([]);
  });
  it('eski kayıt: alt sınıfı boş 3+ karaktere SRD alt sınıfı atanır ve bildirilir; diğerleri değişmez', () => {
    const list = [fighter(5), fighter(2), fighter(4, 'champion')];
    const m = migrateSubclasses(list);
    expect(m.assigned).toEqual([{ name: 'Bor', subclass: 'Champion' }]);
    expect(m.list[0]?.sheet.subclassId).toBe('champion');
    expect(m.list[1]).toBe(list[1]);
    expect(m.list[2]).toBe(list[2]);
    expect(characterProblems(m.list[0] as SavedCharacter)).toEqual([]);
    // Değişiklik yoksa aynı liste.
    const same = [fighter(2)];
    expect(migrateSubclasses(same).list).toBe(same);
  });
  it('simülasyon partilerinde 3+ seviyede alt sınıf seçili', () => {
    for (const kind of Object.keys(PARTY_KINDS)) for (const level of [3, 5]) {
      for (const s of partyAt(level, kind)) expect(s.subclassId, `${kind} ${s.name}`).toBeTruthy();
    }
  });
});
