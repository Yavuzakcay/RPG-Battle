import { describe, it, expect } from 'vitest';
import { deriveStats, finalScores, spellSlotsFor, type CharacterSheet } from './stats';

/** Kısa yoldan karakter formu kurar. */
function sheet(p: Partial<CharacterSheet> & Pick<CharacterSheet, 'raceId' | 'classId' | 'level' | 'baseScores'>): CharacterSheet {
  return { name: 'Test', armorName: 'Zırhsız', shield: false, itemNames: [], ...p };
}
const sc = (str: number, dex: number, con: number, int: number, wis: number, cha: number) =>
  ({ str, dex, con, int, wis, cha });

// Aşağıdaki beklenen değerler, çalışan prototipin hesapladığı sonuçlarla birebir aynıdır.

describe('deriveStats: prototiple uyum', () => {
  it('Wizard 5, Elf, zırhsız', () => {
    const d = deriveStats(sheet({
      raceId: 'elf', classId: 'wizard', level: 5, baseScores: sc(8, 14, 14, 16, 10, 10),
      backgroundBonuses: { dex: 2, int: 1 },
    }));
    expect(d.scores.dex).toBe(16);
    expect(d.scores.int).toBe(17);
    expect(d.ac).toBe(13);
    expect(d.maxHp).toBe(32);
    expect(d.speed).toBe(30);
    expect(d.initiative).toBe(3);
    expect(d.spellSaveDc).toBe(14);
    expect(d.spellAttack).toBe(6);
    expect(d.spellSlots).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
  });

  it('Fighter 5, Dwarf, Plate ve kalkan', () => {
    const d = deriveStats(sheet({
      raceId: 'dwarf', classId: 'fighter', level: 5, baseScores: sc(16, 12, 15, 8, 10, 8),
      backgroundBonuses: { con: 2, wis: 1 }, armorName: 'Plate Armor', shield: true,
    }));
    expect(d.scores.con).toBe(17);
    expect(d.ac).toBe(20);
    expect(d.maxHp).toBe(54); // Dwarven Toughness dahil
    expect(d.speed).toBe(30); // SRD 5.2.1: Dwarf hızı 30
    expect(d.spellSaveDc).toBe(null);
  });

  it('Barbarian 7, zırhsız: Unarmored Defense ve hız bonusu', () => {
    const d = deriveStats(sheet({ raceId: 'human', classId: 'barbarian', level: 7, baseScores: sc(18, 14, 16, 8, 10, 8) }));
    expect(d.ac).toBe(15); // 10 + DEX 2 + CON 3
    expect(d.maxHp).toBe(75);
    expect(d.speed).toBe(40);
  });

  it('Barbarian 5, ağır zırh: hız bonusu yok, Belt of Giant Strength skoru 21 yapar', () => {
    const d = deriveStats(sheet({
      raceId: 'orc', classId: 'barbarian', level: 5, baseScores: sc(16, 12, 16, 8, 10, 8),
      armorName: 'Chain Mail', itemNames: ['Belt of Hill Giant Strength'],
    }));
    expect(d.scores.str).toBe(21);
    expect(d.ac).toBe(16);
    expect(d.speed).toBe(30);
  });

  it('Monk 6, zırhsız: Unarmored Defense ve hareket bonusu', () => {
    const d = deriveStats(sheet({ raceId: 'human', classId: 'monk', level: 6, baseScores: sc(12, 16, 12, 10, 16, 8) }));
    expect(d.ac).toBe(16); // 10 + DEX 3 + WIS 3
    expect(d.maxHp).toBe(39);
    expect(d.speed).toBe(45);
  });

  it('Monk 2, Bracers of Defense ve Gauntlets of Ogre Power', () => {
    const d = deriveStats(sheet({
      raceId: 'human', classId: 'monk', level: 2, baseScores: sc(10, 14, 12, 10, 14, 8),
      itemNames: ['Bracers of Defense', 'Gauntlets of Ogre Power'],
    }));
    expect(d.scores.str).toBe(19);
    expect(d.ac).toBe(16);
    expect(d.speed).toBe(40);
  });

  it('Rogue 3, Halfling, itemlerden AC ve save bonusu', () => {
    const d = deriveStats(sheet({
      raceId: 'halfling', classId: 'rogue', level: 3, baseScores: sc(10, 16, 12, 12, 10, 14),
      backgroundBonuses: { dex: 1, cha: 2 }, armorName: 'Studded Leather Armor',
      itemNames: ['Ring of Protection', 'Cloak of Protection'],
    }));
    expect(d.scores.dex).toBe(17);
    expect(d.scores.cha).toBe(16);
    expect(d.ac).toBe(17); // 12 + DEX 3 + 2 item
    expect(d.maxHp).toBe(21);
    expect(d.saves.wis).toBe(2); // 0 modifier + 2 item bonusu, proficiency yok
    expect(d.saves.dex).toBe(7); // modifier 3 + item 2 + proficiency 2 (3. seviye)
  });

  it('Warlock 5, Tiefling: Pact Magic slotları', () => {
    const d = deriveStats(sheet({
      raceId: 'tiefling', classId: 'warlock', level: 5, baseScores: sc(8, 14, 14, 10, 10, 16),
      backgroundBonuses: { cha: 2, int: 1 }, armorName: 'Leather Armor',
    }));
    expect(d.scores.cha).toBe(18);
    expect(d.ac).toBe(13);
    expect(d.spellSaveDc).toBe(15);
    expect(d.spellAttack).toBe(7);
    expect(d.spellSlots).toEqual([0, 0, 2, 0, 0, 0, 0, 0, 0]);
  });

  it('Paladin 9, Orc: Amulet of Health, yarım büyücü slotları', () => {
    const d = deriveStats(sheet({
      raceId: 'orc', classId: 'paladin', level: 9, baseScores: sc(16, 10, 14, 8, 10, 14),
      armorName: 'Chain Mail', shield: true, itemNames: ['Amulet of Health'],
    }));
    expect(d.scores.con).toBe(19);
    expect(d.ac).toBe(18);
    expect(d.maxHp).toBe(94);
    expect(d.spellSaveDc).toBe(14);
    expect(d.spellSlots).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
  });
});

describe('finalScores', () => {
  it('tür ability bonusu vermez, geçmiş bonusu +2/+1 veya +1/+1/+1 olur', () => {
    const base = { raceId: 'goliath', classId: 'fighter', level: 1, baseScores: sc(15, 14, 13, 12, 10, 8) };
    expect(finalScores(sheet(base))).toEqual(sc(15, 14, 13, 12, 10, 8));
    expect(finalScores(sheet({ ...base, backgroundBonuses: { str: 1, dex: 1, con: 1 } })).con).toBe(14);
    expect(() => finalScores(sheet({ ...base, backgroundBonuses: { str: 2, dex: 2 } }))).toThrow();
    expect(() => finalScores(sheet({ ...base, backgroundBonuses: { str: 3 } }))).toThrow();
  });
  it('skorları 20 ile sınırlar ama itemler sınırı aşabilir', () => {
    const s = finalScores(sheet({ raceId: 'human', classId: 'fighter', level: 1, baseScores: sc(20, 10, 10, 10, 10, 10) }));
    expect(s.str).toBe(20);
  });
});

describe('spellSlotsFor', () => {
  it('büyücü olmayan sınıfların slotu yok', () => {
    expect(spellSlotsFor('fighter', 20)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });
  it('SRD 5.2.1: Ranger ve Paladin 1. seviyede 2 slotla başlar', () => {
    expect(spellSlotsFor('ranger', 1)[0]).toBe(2);
    expect(spellSlotsFor('paladin', 1)[0]).toBe(2);
    expect(spellSlotsFor('ranger', 3)[0]).toBe(3);
  });
  it('Wizard 20. seviye tablosu', () => {
    expect(spellSlotsFor('wizard', 20)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
  });
});
