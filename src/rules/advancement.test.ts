import { describe, expect, it } from 'vitest';
import srdFeats from '../../data/srd/feats.json';
import { classData } from '../data';
import { advancementSlots, allFeats, featOptions, originFeats, type Advancement } from './advancement';
import { blankCharacter, characterProblems, withSkills, type SavedCharacter } from './builder';
import { deriveStats, finalScores, type CharacterSheet } from './stats';
import { weaponAttackOption } from '../battle/weapons';

/** Standart dizili 8. seviye Human Fighter (oluşturucu kurallarına uyar). */
function fighter(p: Partial<CharacterSheet> = {}, level = 8): SavedCharacter {
  const c = blankCharacter('f1');
  return withSkills({
    ...c, classSkills: ['athletics', 'perception'],
    sheet: { ...c.sheet, name: 'Bor', level, armorName: 'Chain Mail', weapons: [{ name: 'Longsword' }, { name: 'Longbow' }], ...p },
  });
}

describe('SRD feat listesi', () => {
  it('17 feat, dört kategori, her birinin oyundaki durumu tanımlı', () => {
    expect(srdFeats.feats).toHaveLength(17);
    expect([...new Set(allFeats().map((f) => f.category))]).toEqual(['Origin', 'General', 'Fighting Style', 'Epic Boon']);
    for (const f of allFeats()) expect(classData.mechanics.feats[f.id], f.id).toBeDefined();
    expect(originFeats().map((f) => f.name)).toEqual(['Alert', 'Magic Initiate', 'Savage Attacker', 'Skilled']);
  });
});

describe('seviye yuvaları (SRD tablosundan)', () => {
  it('Fighter: 1. seviye Fighting Style, ASI 4/6/8/12/14/16, 19 Epic Boon', () => {
    const slots = advancementSlots('fighter', 20);
    expect(slots.filter((s) => s.kind === 'asi').map((s) => s.level)).toEqual([4, 6, 8, 12, 14, 16]);
    expect(slots.filter((s) => s.kind === 'style').map((s) => s.level)).toEqual([1]);
    expect(slots.filter((s) => s.kind === 'epic').map((s) => s.level)).toEqual([19]);
  });
  it('Rogue 10. seviyede ek ASI; Wizard 4/8/12/16; seviyenin üstündekiler yok', () => {
    expect(advancementSlots('rogue', 20).filter((s) => s.kind === 'asi').map((s) => s.level)).toEqual([4, 8, 10, 12, 16]);
    expect(advancementSlots('wizard', 9).map((s) => s.level)).toEqual([4, 8]);
    expect(advancementSlots('paladin', 2).map((s) => `${s.level}:${s.kind}`)).toEqual(['2:style']);
  });
  it('ön koşul: Grappler Güç ya da Çeviklik 13 ister; Epic Boon 19. seviye', () => {
    const asi = { level: 4, kind: 'asi' as const, category: 'General' };
    const weak = { scores: { str: 10, dex: 12, con: 10, int: 10, wis: 10, cha: 10 }, casterClass: false };
    const strong = { ...weak, scores: { ...weak.scores, str: 13 } };
    expect(featOptions(asi, weak).map((f) => f.id)).toEqual(['ability-score-improvement']);
    expect(featOptions(asi, strong).map((f) => f.id)).toEqual(['ability-score-improvement', 'grappler']);
    const epic = { level: 19, kind: 'epic' as const, category: 'Epic Boon' };
    expect(featOptions(epic, strong).map((f) => f.id)).not.toContain('boon-of-spell-recall');
    expect(featOptions(epic, { ...strong, casterClass: true }).map((f) => f.id)).toContain('boon-of-spell-recall');
  });
});

describe('ASI ve feat etkileri', () => {
  const asi = (level: number, abilities: Advancement['abilities']): Advancement => ({ level, featId: 'ability-score-improvement', abilities });
  it('ASI +2 ya da +1/+1 skorlara eklenir, 20\'yi geçmez; boş yuva skoru değiştirmez', () => {
    const base = finalScores(fighter().sheet);
    expect(finalScores(fighter({ advancements: [asi(4, { str: 2 })] }).sheet).str).toBe(base.str + 2);
    expect(finalScores(fighter({ advancements: [asi(4, { str: 1, con: 1 })] }).sheet).con).toBe(base.con + 1);
    const capped = fighter({ baseScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }, backgroundBonuses: { str: 2, con: 1 },
      advancements: [asi(4, { str: 2 }), asi(8, { str: 2 })] });
    expect(finalScores(capped.sheet).str).toBe(20);
    expect(characterProblems(fighter())).toEqual([]);
  });
  it('kurala aykırı dağıtım ve yanlış yuva sorun olur', () => {
    expect(characterProblems(fighter({ advancements: [asi(4, { str: 1 })] })).join(' ')).toContain('ASI');
    expect(characterProblems(fighter({ advancements: [{ level: 5, featId: 'grappler', abilities: { str: 1 } }] })).join(' ')).toContain('yuva yok');
    expect(characterProblems(fighter({ advancements: [{ level: 4, featId: 'archery' }] })).join(' ')).toContain('alınamaz');
    expect(characterProblems(fighter({ originFeat: 'grappler' })).join(' ')).toContain('köken');
  });
  it('Alert inisiyatife yetkinlik, Defense zırhla +1 AC, Archery menzilli silaha +2', () => {
    const plain = deriveStats(fighter().sheet);
    const alert = deriveStats(fighter({ originFeat: 'alert' }).sheet);
    expect(alert.initiative).toBe(plain.initiative + plain.proficiency);
    const def = deriveStats(fighter({ advancements: [{ level: 1, featId: 'defense' }] }).sheet);
    expect(def.ac).toBe(plain.ac + 1);
    const archer = fighter({ advancements: [{ level: 1, featId: 'archery' }] }).sheet;
    expect(weaponAttackOption(archer, 'Longbow').attackBonus).toBe(weaponAttackOption(fighter().sheet, 'Longbow').attackBonus + 2);
    expect(weaponAttackOption(archer, 'Longsword').attackBonus).toBe(weaponAttackOption(fighter().sheet, 'Longsword').attackBonus);
  });
  it('Skilled 3 beceri daha seçtirir', () => {
    const many = (p: Partial<CharacterSheet>) => withSkills({ ...fighter(p), otherSkills: ['arcana', 'history', 'insight', 'stealth', 'nature'] });
    expect(characterProblems(many({})).join(' ')).toContain('en çok 3');
    expect(characterProblems(many({ originFeat: 'skilled' }))).toEqual([]);
  });
});

describe('uzmanlık (Expertise) hakkı', () => {
  it('Rogue 1. seviyede 2 beceri; fazlası sorun; Fighter\'da hiç', () => {
    const c = blankCharacter('r1');
    const rogue = (expertise: CharacterSheet['expertise']) => withSkills({
      ...c, classSkills: ['stealth', 'perception', 'acrobatics', 'deception'],
      sheet: { ...c.sheet, name: 'Sela', classId: 'rogue', level: 1, expertise },
    });
    expect(characterProblems(rogue(['stealth', 'perception']))).toEqual([]);
    expect(characterProblems(rogue(['stealth', 'perception', 'acrobatics'])).join(' ')).toContain('Uzmanlık');
    expect(characterProblems(withSkills({ ...fighter(), sheet: { ...fighter().sheet, expertise: ['athletics'] } })).join(' ')).toContain('Uzmanlık');
  });
});
