/**
 * Karakter formundan türetilen değerler: skorlar, AC, HP, hız, save'ler, büyü DC'si ve slotlar.
 * Saf fonksiyonlar: ekran veya depolama bilmez, aynı girdiye hep aynı sonucu verir.
 */
import { armor as armorList, getClass, getRace, items as itemList, spellSlots } from '../data';
import { ABILITIES, abilityModifier, proficiencyBonus, type Ability } from './abilities';

export type Scores = Record<Ability, number>;

export interface CharacterSheet {
  name: string;
  raceId: string;
  classId: string;
  level: number;
  /** Irk bonuslarından önceki ham skorlar. */
  baseScores: Scores;
  /** Half-Elf için seçilen iki +1 bonus. */
  halfElfBonuses?: [Ability, Ability];
  /** data/armor.json içindeki zırh adı ("Zırhsız" dahil). */
  armorName: string;
  shield: boolean;
  /** data/items.json içindeki item adları. */
  itemNames: string[];
  /** Bildiği veya hazırladığı büyüler (data/spells.json içindeki adlar). */
  spellNames?: string[];
}

export interface DerivedStats {
  scores: Scores;
  modifiers: Scores;
  proficiency: number;
  ac: number;
  maxHp: number;
  speed: number;
  initiative: number;
  /** Her ability için save bonusu (proficiency ve item bonusları dahil). */
  saves: Scores;
  saveProficiencies: Ability[];
  spellSaveDc: number | null;
  spellAttack: number | null;
  /** 1.–9. seviye büyü slotları (9 elemanlı). */
  spellSlots: number[];
}

function findArmor(name: string) {
  const found = armorList.find((a) => a.name === name);
  if (!found) throw new Error(`Zırh bulunamadı: "${name}"`);
  return found;
}

function findItem(name: string) {
  const found = itemList.find((i) => i.name === name);
  if (!found) throw new Error(`Item bulunamadı: "${name}"`);
  return found;
}

/** Irk bonusları, Half-Elf seçimleri ve itemler uygulandıktan sonraki nihai skorlar. */
export function finalScores(sheet: CharacterSheet): Scores {
  const race = getRace(sheet.raceId);
  const s = {} as Scores;
  for (const a of ABILITIES) s[a] = sheet.baseScores[a] + (race.abilityBonuses[a] ?? 0);
  if (race.id === 'half-elf') {
    for (const a of sheet.halfElfBonuses ?? []) s[a] += 1;
  }
  for (const a of ABILITIES) s[a] = Math.min(20, s[a]);
  // "Skoru en az X yap" etkisi olan itemler (sınır 20'yi aşabilir).
  for (const name of sheet.itemNames) {
    const set = findItem(name).effects.setAbility;
    if (!set) continue;
    for (const a of ABILITIES) {
      const v = set[a];
      if (v !== undefined) s[a] = Math.max(s[a], v);
    }
  }
  return s;
}

/** Sınıfın büyü slotları (9 elemanlı dizi). Büyücü olmayanlarda hepsi 0. */
export function spellSlotsFor(classId: string, level: number): number[] {
  const slots = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const casting = getClass(classId).casting;
  if (!casting) return slots;
  if (casting.type === 'full') {
    (spellSlots.full[level - 1] ?? []).forEach((n, i) => { slots[i] = n; });
  } else if (casting.type === 'half') {
    const keys = Object.keys(spellSlots.half).map(Number).filter((k) => k <= level);
    if (keys.length > 0) {
      const best = spellSlots.half[String(Math.max(...keys))] ?? [];
      best.forEach((n, i) => { slots[i] = n; });
    }
  } else {
    // Pact Magic: tek bir seviyede birkaç slot.
    const count = level < 2 ? 1 : level < 11 ? 2 : level < 17 ? 3 : 4;
    const slotLevel = level < 3 ? 1 : level < 5 ? 2 : level < 7 ? 3 : level < 9 ? 4 : 5;
    slots[slotLevel - 1] = count;
  }
  return slots;
}

export function deriveStats(sheet: CharacterSheet): DerivedStats {
  const race = getRace(sheet.raceId);
  const cls = getClass(sheet.classId);
  const ar = findArmor(sheet.armorName);
  const level = sheet.level;

  const scores = finalScores(sheet);
  const modifiers = {} as Scores;
  for (const a of ABILITIES) modifiers[a] = abilityModifier(scores[a]);
  const prof = proficiencyBonus(level);

  const fx = sheet.itemNames.map((n) => findItem(n).effects);
  const sum = (pick: (e: (typeof fx)[number]) => number | undefined) =>
    fx.reduce((total, e) => total + (pick(e) ?? 0), 0);

  // AC
  let ac: number;
  if (ar.type === 'none') {
    ac = 10 + modifiers.dex;
    if (cls.id === 'barbarian') ac += modifiers.con;
    if (cls.id === 'monk' && !sheet.shield) ac += modifiers.wis;
  } else {
    const dexPart = ar.type === 'light' ? modifiers.dex : ar.type === 'medium' ? Math.min(modifiers.dex, 2) : 0;
    ac = ar.baseAc + dexPart;
  }
  if (sheet.shield) ac += 2;
  ac += sum((e) => e.acBonus);
  if (ar.type === 'none' && !sheet.shield) ac += sum((e) => e.unarmoredAcBonus);

  // HP
  const hd = cls.hitDie;
  const con = modifiers.con;
  const maxHp =
    Math.max(1, hd + con) +
    (level - 1) * Math.max(1, hd / 2 + 1 + con) +
    (race.id === 'hill-dwarf' ? level : 0);

  // Hız
  let speed = race.speed;
  if (cls.id === 'barbarian' && level >= 5 && ar.type !== 'heavy') speed += 10;
  if (cls.id === 'monk' && level >= 2 && ar.type === 'none' && !sheet.shield) {
    speed += 10 + 5 * [6, 10, 14, 18].filter((l) => level >= l).length;
  }

  // Save'ler
  const saveBonus = sum((e) => e.saveBonus);
  const saves = {} as Scores;
  for (const a of ABILITIES) {
    saves[a] = modifiers[a] + saveBonus + (cls.saves.includes(a) ? prof : 0);
  }

  const castMod = cls.casting ? modifiers[cls.casting.ability] : 0;
  return {
    scores,
    modifiers,
    proficiency: prof,
    ac,
    maxHp,
    speed,
    initiative: modifiers.dex,
    saves,
    saveProficiencies: cls.saves,
    spellSaveDc: cls.casting ? 8 + prof + castMod : null,
    spellAttack: cls.casting ? prof + castMod : null,
    spellSlots: spellSlotsFor(cls.id, level),
  };
}
