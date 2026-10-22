/**
 * Karakter formundan türetilen değerler: skorlar, AC, HP, hız, save'ler, büyü DC'si ve slotlar.
 * Saf fonksiyonlar: ekran veya depolama bilmez, aynı girdiye hep aynı sonucu verir.
 */
import { armor as armorList, getClass, getRace, items as itemList, spellSlots } from '../data';
import { ABILITIES, abilityModifier, proficiencyBonus, type Ability } from './abilities';
import { isSkill, skillTable, type Skill } from './skills';

export type Scores = Record<Ability, number>;

export interface CharacterSheet {
  name: string;
  raceId: string;
  classId: string;
  level: number;
  /** Geçmiş bonuslarından önceki ham skorlar. */
  baseScores: Scores;
  /**
   * Geçmişten (background) gelen bonuslar: bir skora +2 ve diğerine +1, ya da üç skora +1.
   * Not: Kuralda dağıtım yalnızca geçmişin belirlediği üç yetenek arasında yapılır;
   * geçmiş seçimi eklenince bu sınır da uygulanmalı.
   */
  backgroundBonuses?: Partial<Scores>;
  /** Türün miras/soy seçimi (Tiefling: abyssal/chthonic/infernal, Dragonborn: ejderha rengi). */
  lineageId?: string;
  /** Avatar dosya adı kuralı için (varsayılan erkek). */
  gender?: 'erkek' | 'kadin';
  /** `public/` altındaki avatar yolu; verilmezse `avatars/<ırk>-<sınıf>-<cinsiyet>.webp`. */
  avatar?: string;
  /** data/armor.json içindeki zırh adı ("Zırhsız" dahil). */
  armorName: string;
  shield: boolean;
  /** data/items.json içindeki item adları. */
  itemNames: string[];
  /** Bildiği veya hazırladığı büyüler (data/spells.json içindeki adlar). */
  spellNames?: string[];
  /**
   * Beceri yetkinlikleri (sınıf, geçmiş ve türden gelenlerin hepsi). Kaynakları ayrı tutulmuyor;
   * sınıf seçimlerinin kurala uygunluğu oluşturucuda denetlenir (`classSkillProblem`).
   */
  skills?: Skill[];
  /** Uzmanlık (Expertise): yetkinlik bonusu iki kat; yalnızca yetkin olunan becerilerde. */
  expertise?: Skill[];
  /** Taşıdığı silahlar (data/weapons.json adları), isteğe bağlı büyülü bonusla. */
  weapons?: Array<{ name: string; enchant?: number }>;
}

export interface DerivedStats {
  scores: Scores;
  modifiers: Scores;
  proficiency: number;
  ac: number;
  /**
   * AC'nin bileşenleri (özet ekranı için): `base` zırhsız 10, `armor` zırhın taban AC'si, `dex`/`con`/`wis`
   * yetenek katkısı, `shield` kalkan, `item` eşya bonusları (`name` eşyanın adı).
   */
  acParts: Array<{ kind: 'base' | 'armor' | 'dex' | 'con' | 'wis' | 'shield' | 'item'; value: number; name?: string }>;
  /** Zırhın Güç şartı karşılanmadı: hız 10 ft azaldı (SRD 5.2.1). */
  armorStrengthShort?: number;
  maxHp: number;
  speed: number;
  initiative: number;
  /** Her ability için save bonusu (proficiency ve item bonusları dahil). */
  saves: Scores;
  saveProficiencies: Ability[];
  /** Yetkin olunan becerilerin bonusları; listede olmayanın bonusu ability modifier'ıdır. */
  skills: Partial<Record<Skill, number>>;
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

/** Geçmiş bonusu SRD 5.2.1 kalıbına uyuyor mu: +2/+1 veya +1/+1/+1. */
function checkBackgroundBonuses(bonuses: Partial<Scores>): void {
  const values = Object.values(bonuses).filter((v) => v !== 0).sort();
  const key = values.join(',');
  if (values.length > 0 && key !== '1,2' && key !== '1,1,1') {
    throw new Error(`Geçersiz geçmiş bonusu: ${JSON.stringify(bonuses)} (+2/+1 veya +1/+1/+1 olmalı)`);
  }
}

/** Geçmiş bonusları ve itemler uygulandıktan sonraki nihai skorlar. */
export function finalScores(sheet: CharacterSheet): Scores {
  const bonuses = sheet.backgroundBonuses ?? {};
  checkBackgroundBonuses(bonuses);
  const s = {} as Scores;
  for (const a of ABILITIES) s[a] = Math.min(20, sheet.baseScores[a] + (bonuses[a] ?? 0));
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

/** Türden ve seçilen mirastan gelen hasar dirençleri. */
export function raceResistances(sheet: Pick<CharacterSheet, 'raceId' | 'lineageId'>): string[] {
  const race = getRace(sheet.raceId);
  const lineageId = sheet.lineageId ?? race.defaultLineage;
  if (lineageId === undefined) return [...race.resistances];
  const lineage = race.lineages?.find((l) => l.id === lineageId);
  if (!lineage) throw new Error(`${race.name} için miras bulunamadı: "${lineageId}"`);
  return [...new Set([...race.resistances, ...lineage.resistances])];
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

/** Beceri listeleri geçerli mi: bilinen adlar, tekrar yok, uzmanlık yalnızca yetkin olunanlarda. */
function checkSkills(sheet: CharacterSheet): void {
  const skills = sheet.skills ?? [];
  const expertise = sheet.expertise ?? [];
  for (const s of [...skills, ...expertise]) if (!isSkill(s)) throw new Error(`Bilinmeyen beceri: "${s}"`);
  if (new Set(skills).size !== skills.length) throw new Error('Beceri yetkinliği iki kez yazılmış.');
  const bad = expertise.filter((s) => !skills.includes(s));
  if (bad.length > 0) throw new Error(`Uzmanlık yalnızca yetkin olunan beceride olur: ${bad.join(', ')}`);
}

/**
 * Sınıfın 1. seviye beceri seçimi kurala uygun mu (oluşturucu için). Sorun yoksa null.
 * `chosen` yalnızca sınıftan seçilenlerdir (geçmiş ve tür becerileri ayrı).
 */
export function classSkillProblem(classId: string, chosen: readonly Skill[]): string | null {
  const { count, from } = getClass(classId).skillChoices;
  if (chosen.length !== count) return `${count} beceri seçilmeli (${chosen.length} seçildi).`;
  if (new Set(chosen).size !== chosen.length) return 'Aynı beceri iki kez seçilmiş.';
  if (from !== 'any') {
    const bad = chosen.filter((s) => !from.includes(s));
    if (bad.length > 0) return `Sınıf listesinde yok: ${bad.join(', ')}`;
  }
  return null;
}

export function deriveStats(sheet: CharacterSheet): DerivedStats {
  checkSkills(sheet);
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

  // AC (bileşenleriyle)
  const acParts: DerivedStats['acParts'] = [];
  if (ar.type === 'none') {
    acParts.push({ kind: 'base', value: 10 }, { kind: 'dex', value: modifiers.dex });
    if (cls.id === 'barbarian') acParts.push({ kind: 'con', value: modifiers.con });
    if (cls.id === 'monk' && !sheet.shield) acParts.push({ kind: 'wis', value: modifiers.wis });
  } else {
    acParts.push({ kind: 'armor', value: ar.baseAc, name: ar.name });
    const dexPart = ar.type === 'light' ? modifiers.dex : ar.type === 'medium' ? Math.min(modifiers.dex, 2) : 0;
    if (ar.type !== 'heavy') acParts.push({ kind: 'dex', value: dexPart });
  }
  if (sheet.shield) acParts.push({ kind: 'shield', value: 2 });
  for (const n of sheet.itemNames) {
    const e = findItem(n).effects;
    const v = (e.acBonus ?? 0) + (ar.type === 'none' && !sheet.shield ? (e.unarmoredAcBonus ?? 0) : 0);
    if (v) acParts.push({ kind: 'item', value: v, name: n });
  }
  const ac = acParts.reduce((n, p) => n + p.value, 0);

  // HP
  const hd = cls.hitDie;
  const con = modifiers.con;
  const maxHp =
    Math.max(1, hd + con) +
    (level - 1) * Math.max(1, hd / 2 + 1 + con) +
    (race.hpPerLevel ?? 0) * level;

  // Hız; zırhın Güç şartı karşılanmazsa −10 ft (SRD 5.2.1 Armor: Strength).
  let speed = race.speed;
  const armorStrengthShort = ar.strength !== undefined && scores.str < ar.strength ? ar.strength : undefined;
  if (armorStrengthShort !== undefined) speed -= 10;
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
    acParts,
    ...(armorStrengthShort !== undefined ? { armorStrengthShort } : {}),
    maxHp,
    speed,
    initiative: modifiers.dex,
    saves,
    saveProficiencies: cls.saves,
    skills: skillTable(modifiers, prof, sheet.skills ?? [], sheet.expertise ?? []),
    spellSaveDc: cls.casting ? 8 + prof + castMod : null,
    spellAttack: cls.casting ? prof + castMod : null,
    spellSlots: spellSlotsFor(cls.id, level),
  };
}
