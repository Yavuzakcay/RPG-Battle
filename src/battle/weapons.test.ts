import { describe, it, expect } from 'vitest';
import { weaponAttackOption } from './weapons';
import type { CharacterSheet } from '../rules/stats';

const sheet = (p: Partial<CharacterSheet> & Pick<CharacterSheet, 'raceId' | 'classId' | 'level' | 'baseScores'>): CharacterSheet => ({
  name: 'Test', armorName: 'Zırhsız', shield: false, itemNames: [], ...p,
});
const sc = (str: number, dex: number, con: number, int: number, wis: number, cha: number) => ({ str, dex, con, int, wis, cha });

describe('weaponAttackOption', () => {
  it('Fighter: martial silah, büyülü bonus saldırı ve hasara eklenir', () => {
    const o = weaponAttackOption(sheet({ raceId: 'hill-dwarf', classId: 'fighter', level: 5, baseScores: sc(16, 12, 15, 8, 10, 8) }), 'Longsword', 1);
    expect(o.label).toBe('Longsword +1');
    expect(o.attackBonus).toBe(7); // STR 3 + proficiency 3 + 1
    expect(o.damage).toBe('1d8+4');
    expect(o.damageType).toBe('slashing');
    expect(o.ranged).toBe(false);
    expect(o.tag.includes('hill dwarf fighter longsword slashing')).toBe(true);
  });
  it('Wizard: martial silahta proficiency yok, simple silahta var', () => {
    const w = sheet({ raceId: 'high-elf', classId: 'wizard', level: 5, baseScores: sc(8, 14, 14, 16, 10, 10) });
    const sword = weaponAttackOption(w, 'Longsword');
    expect(sword.attackBonus).toBe(-1);
    expect(sword.damage).toBe('1d8-1');
    expect(weaponAttackOption(w, 'Quarterstaff').attackBonus).toBe(2); // -1 + 3
  });
  it('Rogue: finesse silah DEX kullanır, Rapier sınıfın ek proficiency\'si', () => {
    const r = sheet({ raceId: 'human', classId: 'rogue', level: 3, baseScores: sc(10, 16, 12, 12, 10, 14) });
    const o = weaponAttackOption(r, 'Rapier');
    expect(o.attackBonus).toBe(5); // DEX 3 + proficiency 2
    expect(o.damage).toBe('1d8+3');
  });
  it('Ranger: menzilli silah DEX kullanır ve ranged işaretlenir', () => {
    const o = weaponAttackOption(sheet({ raceId: 'human', classId: 'ranger', level: 5, baseScores: sc(10, 16, 12, 10, 14, 8) }), 'Longbow');
    expect(o.ranged).toBe(true);
    expect(o.attackBonus).toBe(6); // DEX 3 + proficiency 3
  });
  it('olmayan silahta hata verir', () => {
    expect(() => weaponAttackOption(sheet({ raceId: 'human', classId: 'fighter', level: 1, baseScores: sc(10, 10, 10, 10, 10, 10) }), 'Yok')).toThrow();
  });
});
