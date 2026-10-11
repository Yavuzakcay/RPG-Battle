import type { Ability } from '../rules/abilities';

export type Size = 'S' | 'M';

export interface Race {
  id: string;
  name: string;
  abilityBonuses: Partial<Record<Ability, number>>;
  speed: number;
  size: Size;
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
  extraWeapons: string[];
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
  ranged: boolean;
}

export interface Spell {
  name: string;
  level: number;
  classes: string[];
  text: string;
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
}

export interface Monster {
  id: string;
  name: string;
  ac: number;
  hp: number;
  speed: number;
  abilities: Record<Ability, number>;
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
