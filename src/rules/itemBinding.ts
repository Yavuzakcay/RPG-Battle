/**
 * Görev KARAR104 (A10, kural sürümü 104; TE99 K-D2, KARAR101 5e): silah olan büyülü eşyanın bağlı olduğu silah. SRD 5.2.1 s. 253
 * Weapon +1/+2/+3 "You have a bonus to attack and damage rolls made with this magic weapon": bonus ve isabet eki yalnız o silahla.
 * Uygun silahlar `data/esya-silah-bagi.json` (SRD eşya türü satırından); karakterde `silahBagi` (eşya adı → silah adı), yoksa ya da
 * geçersizse ana silah (sayfadaki ilk uygun silah). Uygun silah taşımayan karakterde eşya hiçbir silaha bağlı değil. Saf.
 */
import data from '../../data/esya-silah-bagi.json';
import { items, weapons } from '../data';
import type { CharacterSheet } from './stats';

type Rule = 'any' | 'melee' | string[];
const RULES = (data as { esyalar: Record<string, Rule> }).esyalar;

/** Eşya (adıyla) bir silaha bağlanan türden mi. */
export const bindableItem = (itemName: string): boolean => {
  const id = items.find((i) => i.name === itemName)?.id;
  return !!id && RULES[id] !== undefined;
};

/** Eşyaya bağlanabilen silah kimlikleri (`data/weapons.json`). */
export function eligibleWeaponIds(itemName: string): string[] {
  const id = items.find((i) => i.name === itemName)?.id;
  const rule = id ? RULES[id] : undefined;
  if (!rule) return [];
  if (rule === 'any') return weapons.map((w) => w.id);
  if (rule === 'melee') return weapons.filter((w) => !w.ranged).map((w) => w.id);
  return [...rule];
}

/** Sayfadaki silahlardan eşyaya uygun olanlar (adlar, sayfa sırasıyla; tekrarsız). */
export function eligibleWeaponsOf(sheet: Pick<CharacterSheet, 'weapons'>, itemName: string): string[] {
  const ok = new Set(eligibleWeaponIds(itemName));
  const names = (sheet.weapons ?? []).map((w) => w.name).filter((n) => ok.has(weapons.find((w) => w.name === n)?.id ?? ''));
  return [...new Set(names)];
}

/** Eşyanın bağlı olduğu silahın adı: seçim geçerliyse o, yoksa ana silah (ilk uygun); uygun silah yoksa null. */
export function boundWeaponName(sheet: Pick<CharacterSheet, 'weapons' | 'silahBagi'>, itemName: string): string | null {
  const ok = eligibleWeaponsOf(sheet, itemName);
  const pick = sheet.silahBagi?.[itemName];
  return pick && ok.includes(pick) ? pick : ok[0] ?? null;
}

/** Bağlı silahın kimliği (`AttackOption.weaponId`), yoksa null. */
export function boundWeaponId(sheet: Pick<CharacterSheet, 'weapons' | 'silahBagi'>, itemName: string): string | null {
  const n = boundWeaponName(sheet, itemName);
  return n ? weapons.find((w) => w.name === n)?.id ?? null : null;
}
