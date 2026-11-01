/**
 * Kuyruk 42: 12 geçmiş (SRD'nin 4'ü + 8 özgün). Kural yapısı, beceri kapsamı ve çökme duman testi.
 */
import { describe, expect, it } from 'vitest';
import { backgrounds, backgroundById, backgroundSkills, bonusesOf, originFeatOf } from './backgrounds';
import { blankCharacter, characterIssues, newCharacter, suggestedScores } from './builder';
import { combatantFromSheet } from '../battle/create';
import { classes, races } from '../data';
import { SKILLS, type Skill } from './skills';

const ORIGIN = ['alert', 'magic-initiate', 'savage-attacker', 'skilled'];

describe('Kuyruk 42: geçmişler', () => {
  it('12 geçmiş; SRD\'nin 4\'ü aynı, 8 özgün; her birinde 3 yetenek, SRD köken feat\'i, 2 beceri, alet, TR/EN tanım', () => {
    expect(backgrounds.length).toBe(12);
    expect(backgrounds.filter((b) => !b.ozgun).map((b) => b.id)).toEqual(['acolyte', 'criminal', 'sage', 'soldier']);
    for (const b of backgrounds) {
      expect(new Set(b.abilities).size, b.id).toBe(3);
      expect(ORIGIN, b.id).toContain(b.feat);
      if (b.feat === 'magic-initiate') expect(['cleric', 'druid', 'wizard'], b.id).toContain(b.featList);
      expect(b.skills.length, b.id).toBe(2);
      for (const s of b.skills) expect(SKILLS[s as Skill], `${b.id}:${s}`).toBeTruthy();
      expect(b.tool.tr && b.tool.en && b.summary.tr && b.summary.en && b.name.tr && b.name.en, b.id).toBeTruthy();
    }
  });
  it('18 becerinin her biri en az bir geçmişte', () => {
    const covered = new Set(backgrounds.flatMap((b) => b.skills));
    expect([...Object.keys(SKILLS)].filter((s) => !covered.has(s as Skill))).toEqual([]);
  });
  it('ASI kuralı (SRD 5.2.1): yalnızca geçmişin üç yeteneği; +2/+1 ya da +1/+1/+1', () => {
    for (const b of backgrounds) {
      const [a, c, d] = b.abilities;
      expect(bonusesOf({ backgroundId: b.id, backgroundBonuses: { [a!]: 2, [c!]: 1 } }), b.id).toEqual({ [a!]: 2, [c!]: 1 });
      expect(bonusesOf({ backgroundId: b.id, backgroundBonuses: { [a!]: 1, [c!]: 1, [d!]: 1 } }), b.id).toEqual({ [a!]: 1, [c!]: 1, [d!]: 1 });
    }
  });
  it('eski kayıt: geçmiş yoksa eskisi gibi; yeni karakter Soldier', () => {
    expect(blankCharacter('x').sheet.backgroundId).toBeUndefined();
    expect(newCharacter('x').sheet.backgroundId).toBe('soldier');
    expect(backgroundById(undefined)).toBeUndefined();
  });
  it('duman testi: 12 geçmiş × 12 sınıf × 2 seviye (288 ≥ 180 kombinasyon; ırklar dönerek) çökmez, köken feat\'i kilitli', () => {
    let n = 0;
    for (const b of backgrounds) {
      for (const [ci, cls] of classes.entries()) {
        for (const level of [1, 5]) {
          const base = newCharacter(`k42-${b.id}-${cls.id}-${level}`);
          const race = races[(ci + n) % races.length]!;
          const [a, c] = b.abilities;
          const sheet = { ...base.sheet, classId: cls.id, raceId: race.id, level, backgroundId: b.id, baseScores: suggestedScores(cls.id), backgroundBonuses: { [a!]: 2, [c!]: 1 } };
          const saved = { ...base, sheet };
          expect(() => characterIssues(saved), `${b.id}/${cls.id}/${level}`).not.toThrow();
          expect(originFeatOf(sheet), b.id).toBe(b.feat);
          expect(backgroundSkills(sheet)).toEqual(b.skills);
          const c0 = combatantFromSheet(sheet, { id: 'A', ownerId: 'p1' });
          expect(c0.maxHp, `${b.id}/${cls.id}/${level}`).toBeGreaterThan(0);
          n++;
        }
      }
    }
    expect(n).toBeGreaterThanOrEqual(180);
  });
});
