import type { Ability } from '../rules/abilities';

export type Size = 'S' | 'M';

/** Türün alt seçeneği: Tiefling mirası, Dragonborn ejderha türü gibi. */
export interface Lineage {
  id: string;
  name: string;
  /** Bu seçimden gelen hasar dirençleri. */
  resistances: string[];
}

/** SRD 5.2.1 türü (species). Ability bonusları türden değil, geçmişten (background) gelir. */
export interface Race {
  id: string;
  name: string;
  /** Seçilebilir boyutlar. */
  sizes: Size[];
  speed: number;
  /** Darkvision menzili (ft), yoksa 0. */
  darkvision: number;
  /** Türden gelen hasar dirençleri. */
  resistances: string[];
  /** Seviye başına ek HP (Dwarven Toughness). */
  hpPerLevel?: number;
  /** Seçilebilir miras/soy; karakter formunda lineageId ile seçilir. */
  lineages?: Lineage[];
  /** Seçim yapılmamışsa kullanılan miras (oluşturucu ekranı gelene kadar geçici). */
  defaultLineage?: string;
  traits: string;
}

export type CastingType = 'full' | 'half' | 'pact';

export interface CharacterClass {
  id: string;
  name: string;
  hitDie: 6 | 8 | 10 | 12;
  saves: Ability[];
  casting: { type: CastingType; ability: Ability } | null;
  /** Standart diziyi (15, 14, 13, 12, 10, 8) dağıtırken kullanılan ability sırası. */
  abilityPriority: Ability[];
  /** Büyü listesi kodu (spells.json içindeki "classes" alanıyla eşleşir). */
  spellCode: string | null;
  weaponProficiency: 'simple' | 'martial';
  /** Simple sınıfların proficient olduğu martial silah özellikleri (Rogue: finesse/light, Monk: light). */
  martialWeaponProperties: Array<'finesse' | 'light'>;
}

export type ArmorType = 'none' | 'light' | 'medium' | 'heavy';

export interface Armor {
  name: string;
  baseAc: number;
  type: ArmorType;
}

export type DamageType = 'slashing' | 'piercing' | 'bludgeoning';

export interface Weapon {
  name: string;
  damage: string;
  versatileDamage?: string;
  damageType: DamageType;
  category: 'simple' | 'martial';
  finesse: boolean;
  light: boolean;
  ranged: boolean;
}

export interface SpellMechanics {
  kind: 'attack' | 'save' | 'auto' | 'heal' | 'sleep' | 'utility';
  /** Hasar veya iyileştirme zarı (örneğin "8d6"). */
  damage?: string;
  damageType?: string;
  /** Büyü yapma ability modifier'ını ekle (Cure Wounds gibi). */
  addCastingMod?: boolean;
  /** Hedefin yapacağı save. */
  save?: Ability;
  /** Save başarılıysa hasar yarıya iner (cantrip'lerde hasar hiç olmaz). */
  halfOnSave?: boolean;
  /** Tek seferde kaç dart veya ışın. */
  rays?: number;
  /** Işın sayısı karakter seviyesiyle artar (Eldritch Blast). */
  raysByLevel?: boolean;
  /** Cantrip zar sayısı 5., 11. ve 17. seviyede artar. */
  scalesWithLevel?: boolean;
  /** Save başarısızsa uygulanan durumlar. */
  conditions?: string[];
}

export interface Spell {
  name: string;
  level: number;
  classes: string[];
  text: string;
  mechanics: SpellMechanics;
}

export interface ItemEffects {
  acBonus?: number;
  saveBonus?: number;
  /** Zırhsız ve kalkansızken ek AC (Bracers of Defense gibi). */
  unarmoredAcBonus?: number;
  /** Skoru en az bu değere çeker (Gauntlets of Ogre Power gibi). */
  setAbility?: Partial<Record<Ability, number>>;
}

export interface Item {
  name: string;
  attunement: boolean;
  text: string;
  effects: ItemEffects;
}

export type EnvironmentCategory = 'spell' | 'race' | 'class' | 'weapon';

export interface EnvironmentRule {
  category: EnvironmentCategory;
  keywords: string[];
  effect: 'advantage' | 'disadvantage';
  note: string;
}

export interface Environment {
  id: string;
  name: string;
  description: string;
  rules: EnvironmentRule[];
}

export interface MonsterAttack {
  name: string;
  bonus: number;
  damage: string;
  /** Recharge değeri (5 = "Recharge 5-6"). */
  recharge?: number;
  /** Multiattack sırasında kaç kez kullanılacağı (0 = hiç). */
  repeat?: number;
  /** Hasar zarı ("2d6+4"), metinden ayrıştırılmış. Yoksa saldırı hasar vermez (Web gibi). */
  damageDice?: string;
  damageType?: string;
  /** Saldırı zarı yerine hedefin save'i ile çözülen saldırılar (nefes gibi). */
  save?: { ability: Ability; dc: number; halfOnSave: boolean };
  /** Ek etki metni; elle uygulanır (zehir, felç gibi). */
  rider?: string;
  ranged?: boolean;
}

export interface Monster {
  id: string;
  name: string;
  ac: number;
  hp: number;
  speed: number;
  abilities: Record<Ability, number>;
  /** Modifier'dan farklı olan save bonusları (stat bloğundaki SAVE sütunu). */
  saves?: Partial<Record<Ability, number>>;
  cr: string;
  attacks: MonsterAttack[];
  traits: string;
  packTactics?: boolean;
  undeadFortitude?: boolean;
  multiattack?: boolean;
  regeneration?: number;
  resistances?: string[];
  immunities?: string[];
  vulnerabilities?: string[];
}

export interface SpellSlotTables {
  /** Seviye 1–20 için, 1. ile 9. seviye büyü slot sayıları. */
  full: number[][];
  /** Anahtar: seviye. Paladin ve Ranger için. */
  half: Record<string, number[]>;
}

export interface ConditionList {
  all: string[];
  incapacitating: string[];
}
