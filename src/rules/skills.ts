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
/** Beceri kontrolünü yapan: beceri bonusları, yetenek değiştiricileri; Rage ve Primal Knowledge (savaşçıda). */
export interface SkillUser {
  skills: Partial<Record<Skill, number>>;
  modifiers: Record<Ability, number>;
  rage?: unknown;
  rageStrAdvantage?: boolean;
  primalSkills?: string[];
  /** Görev F: pasif özellik işaretleri (Remarkable Athlete: Athletics avantajı). */
  traits?: string[];
}

/** Normal bonus: yetkinlik varsa kayıtlı toplam, yoksa yetenek değiştiricisi. */
const plainBonus = (who: SkillUser, skill: Skill): number => who.skills[skill] ?? who.modifiers[SKILLS[skill].ability];

/** Primal Knowledge: Rage sürerken bu beceri STR ile yapılıyor mu (STR daha iyiyse). */
export function primalStrength(who: SkillUser, skill: Skill): boolean {
  if (!who.rage || !who.primalSkills?.includes(skill)) return false;
  const ab = SKILLS[skill].ability;
  return ab !== 'str' && who.modifiers.str > who.modifiers[ab];
}

export function skillBonus(who: SkillUser, skill: Skill): number {
  const normal = plainBonus(who, skill);
  // Primal Knowledge: aynı yetkinlikle, yetenek değiştiricisi yerine STR.
  return primalStrength(who, skill) ? normal - who.modifiers[SKILLS[skill].ability] + who.modifiers.str : normal;
}

/** Rage'in Strength avantajı bu kontrole geçerli mi (Athletics ya da Primal Knowledge ile STR'ye dönen beceri). */
export function strCheckAdvantage(who: SkillUser, skill: Skill): boolean {
  if (!who.rage || !who.rageStrAdvantage) return false;
  return SKILLS[skill].ability === 'str' || primalStrength(who, skill);
}

/** Kontrol kipi: verilen temel kip ve Rage'in Strength avantajı. */
export function checkMode(who: SkillUser, skill: Skill, base: 'normal' | 'advantage' | 'disadvantage' = 'normal'): 'normal' | 'advantage' | 'disadvantage' {
  // Remarkable Athlete (Champion; Görev F): STR (Athletics) kontrollerinde avantaj.
  const athlete = skill === 'athletics' && !!who.traits?.includes('remarkable-athlete');
  if (!strCheckAdvantage(who, skill) && !athlete) return base;
  return base === 'disadvantage' ? 'normal' : 'advantage';
}
