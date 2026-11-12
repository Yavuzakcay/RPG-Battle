/**
 * Görev SD4: oluşturucu sorun metinleri `strings.ts` / `strings.en.ts` `issues` bölümünde (kural modüllerinde gömülü
 * Türkçe yok); arayüz diline göre değişir, Türkçe metinler eskisiyle aynı.
 */
import { describe, expect, it } from 'vitest';
import { blankCharacter, characterIssues } from './builder';
import { masteryProblems } from './mastery';
import { offHandOptionProblem } from './hands';
import { classSkillProblem } from './stats';
import { setLang } from '../i18n';
import { STRINGS_TR } from '../i18n/strings';
import { en } from '../i18n/strings.en';

const SRC = import.meta.glob('./{builder,advancement,invocations,mastery,hands,backgrounds}.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('SD4 sorun metinleri', () => {
  it('Türkçe metinler değişmedi; İngilizce arayüzde aynı sorunlar İngilizce', () => {
    const blank = blankCharacter('x');
    setLang('tr');
    const trTexts = characterIssues(blank).map((x) => x.text);
    expect(trTexts).toContain('Ad boş olamaz.');
    expect(trTexts.some((x) => x.startsWith('Sınıf becerileri:'))).toBe(true);
    setLang('en');
    try {
      const enTexts = characterIssues(blank).map((x) => x.text);
      expect(enTexts).toContain('Name cannot be empty.');
      expect(enTexts.some((x) => x.startsWith('Class skills:'))).toBe(true);
      expect(classSkillProblem('fighter', [])).toMatch(/Pick 2 skills/);
      expect(offHandOptionProblem({ weapons: [], shield: false }, 'Dagger')).toBe(en.issues.handNotCarried);
      expect(masteryProblems({ ...blank.sheet, classId: 'wizard', weaponMasteries: ['dagger'] })[0]).toBe(en.issues.masteryNone);
    } finally { setLang('tr'); }
    expect(STRINGS_TR.issues.nameEmpty).toBe('Ad boş olamaz.');
  });
  it('kural modüllerinde gömülü Türkçe sorun metni kalmadı', () => {
    expect(Object.keys(SRC).length).toBe(6);
    for (const [f, src] of Object.entries(SRC)) {
      const bad = src.split('\n').filter((l: string) => /\b(push|return)\s*\(?\s*[`'][^`']*[çğıöşüÇĞİÖŞÜ][^`']*[`']/.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l));
      expect(bad, f).toEqual([]);
    }
  });
});
