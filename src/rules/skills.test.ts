import { describe, it, expect } from 'vitest';
import { classes } from '../data';
import { SKILLS, SKILL_IDS, skillBonus, skillTable } from './skills';
import { classSkillProblem, deriveStats, type CharacterSheet } from './stats';

const base: CharacterSheet = {
  name: 'T', raceId: 'human', classId: 'rogue', level: 1,
  baseScores: { str: 10, dex: 16, con: 12, int: 10, wis: 14, cha: 8 },
  armorName: 'Zırhsız', shield: false, itemNames: [],
};

describe('beceri tablosu', () => {
  it('18 SRD becerisi, her biri bir ability\'ye bağlı', () => {
    expect(SKILL_IDS).toHaveLength(18);
    expect(SKILLS.stealth.ability).toBe('dex');
    expect(SKILLS.perception.ability).toBe('wis');
    expect(SKILLS.athletics.ability).toBe('str');
  });
  it('yetkinlik + proficiency, uzmanlık iki kat; yetkin olunmayanda ability modifier', () => {
    const mods = { str: 0, dex: 3, con: 1, int: 0, wis: 2, cha: -1 };
    const t = skillTable(mods, 2, ['stealth', 'perception'], ['stealth']);
    expect(t).toEqual({ stealth: 7, perception: 4 });
    expect(skillBonus({ skills: t, modifiers: mods }, 'athletics')).toBe(0);
    expect(skillBonus({ skills: t, modifiers: mods }, 'stealth')).toBe(7);
  });
});

describe('karakter formu', () => {
  it('becerileri türetir ve hatalı listeyi reddeder', () => {
    const d = deriveStats({ ...base, skills: ['stealth', 'perception'], expertise: ['stealth'] });
    expect(d.skills).toEqual({ stealth: 7, perception: 4 });
    expect(() => deriveStats({ ...base, skills: ['uçmak' as never] })).toThrow('Bilinmeyen beceri');
    expect(() => deriveStats({ ...base, skills: ['stealth', 'stealth'] })).toThrow('iki kez');
    expect(() => deriveStats({ ...base, skills: ['stealth'], expertise: ['perception'] })).toThrow('Uzmanlık');
  });
  it('sınıf seçimi SRD listesine göre denetlenir', () => {
    expect(classes.every((c) => c.skillChoices.count >= 2)).toBe(true);
    expect(classSkillProblem('fighter', ['athletics', 'perception'])).toBeNull();
    expect(classSkillProblem('fighter', ['athletics'])).toContain('2 beceri');
    expect(classSkillProblem('fighter', ['athletics', 'stealth'])).toContain('stealth');
    expect(classSkillProblem('bard', ['stealth', 'arcana', 'medicine'])).toBeNull();
    expect(classSkillProblem('rogue', ['stealth', 'perception', 'acrobatics', 'deception'])).toBeNull();
  });
});
