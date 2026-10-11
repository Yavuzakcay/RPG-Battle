/** Ability skorları ve seviyeye bağlı temel hesaplar. */

export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export const ABILITIES: readonly Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/** Skordan modifier: (skor - 10) / 2, aşağı yuvarlanır. */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** Seviyeye göre proficiency bonus (1–4: +2, 5–8: +3, ... 17–20: +6). */
export function proficiencyBonus(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new Error(`Seviye 1 ile 20 arasında olmalı: ${level}`);
  }
  return 2 + Math.floor((level - 1) / 4);
}
