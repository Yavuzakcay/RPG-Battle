/**
 * Beceriler (SRD 5.2.1, "Playing the Game" → Skills tablosu). Beceri kontrolü = d20 + ilgili
 * ability modifier'ı, yetkinlik varsa + proficiency bonus, uzmanlık (Expertise) varsa iki katı.
 * Saf fonksiyonlar: savaşı bilmez.
 */
import type { Ability } from './abilities';

export type Skill =
  | 'acrobatics' | 'animalHandling' | 'arcana' | 'athletics' | 'deception' | 'history'
  | 'insight' | 'intimidation' | 'investigation' | 'medicine' | 'nature' | 'perception'
  | 'performance' | 'persuasion' | 'religion' | 'sleightOfHand' | 'stealth' | 'survival';

/** Her becerinin ability'si ve SRD'deki adı. */
export const SKILLS: Record<Skill, { ability: Ability; name: string }> = {
  acrobatics: { ability: 'dex', name: 'Acrobatics' },
  animalHandling: { ability: 'wis', name: 'Animal Handling' },
  arcana: { ability: 'int', name: 'Arcana' },
  athletics: { ability: 'str', name: 'Athletics' },
  deception: { ability: 'cha', name: 'Deception' },
  history: { ability: 'int', name: 'History' },
  insight: { ability: 'wis', name: 'Insight' },
  intimidation: { ability: 'cha', name: 'Intimidation' },
  investigation: { ability: 'int', name: 'Investigation' },
  medicine: { ability: 'wis', name: 'Medicine' },
  nature: { ability: 'int', name: 'Nature' },
  perception: { ability: 'wis', name: 'Perception' },
  performance: { ability: 'cha', name: 'Performance' },
  persuasion: { ability: 'cha', name: 'Persuasion' },
  religion: { ability: 'int', name: 'Religion' },
  sleightOfHand: { ability: 'dex', name: 'Sleight of Hand' },
  stealth: { ability: 'dex', name: 'Stealth' },
  survival: { ability: 'wis', name: 'Survival' },
};

export const SKILL_IDS = Object.keys(SKILLS) as Skill[];

export const isSkill = (s: string): s is Skill => s in SKILLS;

/** "Dexterity (Stealth)" biçiminde kısa ad: "DEX (Stealth)". */
export const skillLabel = (s: Skill) => `${SKILLS[s].ability.toUpperCase()} (${SKILLS[s].name})`;

/**
 * Yetkin olunan becerilerin bonusları (ability modifier + proficiency, uzmanlıkta 2 × proficiency).
 * Yetkin olunmayanlar listede yoktur: onların bonusu ability modifier'ıdır.
 */
export function skillTable(
  modifiers: Record<Ability, number>,
  proficiency: number,
  proficient: readonly Skill[],
  expertise: readonly Skill[] = [],
): Partial<Record<Skill, number>> {
  const out: Partial<Record<Skill, number>> = {};
  for (const s of proficient) {
    out[s] = modifiers[SKILLS[s].ability] + proficiency * (expertise.includes(s) ? 2 : 1);
  }
  return out;
}

/** Bir becerinin bonusu: tabloda varsa o, yoksa ability modifier'ı. */
export function skillBonus(
  who: { skills: Partial<Record<Skill, number>>; modifiers: Record<Ability, number> },
  skill: Skill,
): number {
  return who.skills[skill] ?? who.modifiers[SKILLS[skill].ability];
}
