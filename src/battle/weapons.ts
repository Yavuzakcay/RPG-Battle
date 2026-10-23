/** Karakterin silahından saldırı seçeneği üretir (saldırı bonusu, hasar zarı, hasar türü, etiket). */
import { getClass, getRace, weapons } from '../data';
import { deriveStats, type CharacterSheet } from '../rules/stats';
import { featEffects, sheetFeats } from '../rules/advancement';
import { activeMasteries, masteryWorks, weaponMasteryId, weaponProficient } from '../rules/mastery';
import { offHandProblem, otherHandFree } from '../rules/hands';
import type { AttackOption } from './types';

/** Seçeneğin kullanımı: ana el (yakın dövüş ya da menzilli), fırlatma, yan el (Light ek saldırısı). */
type Use = 'main' | 'thrown' | 'offhand';

function optionFor(sheet: CharacterSheet, weaponName: string, enchant: number, use: Use): AttackOption {
  const weapon = weapons.find((w) => w.name === weaponName);
  if (!weapon) throw new Error(`Silah bulunamadı: "${weaponName}"`);
  const cls = getClass(sheet.classId);
  const race = getRace(sheet.raceId);
  const d = deriveStats(sheet);
  // Finesse: STR veya DEX'in yükseği. Menzilli: DEX. Diğerleri: STR.
  const mod = weapon.finesse
    ? Math.max(d.modifiers.str, d.modifiers.dex)
    : weapon.ranged
      ? d.modifiers.dex
      : d.modifiers.str;
  const proficient = weaponProficient(sheet.classId, weapon);
  const feats = featEffects(sheetFeats(sheet));
  const ranged = weapon.ranged || use === 'thrown';
  // Archery (Fighting Style): menzilli silahla saldırıya +2 (fırlatılan yakın dövüş silahı değil).
  const archery = weapon.ranged ? feats.rangedAttackBonus : 0;
  // Weapon Mastery: seçilen silahın SRD ustalığı (oyunda çalışıyorsa).
  const masteryId = activeMasteries(sheet).has(weapon.id) ? weaponMasteryId(weapon.id) : undefined;
  const mastery = masteryId && masteryWorks(masteryId) ? masteryId : undefined;
  // Versatile: diğer el boşsa (kalkan ve yan el silahı yok) yakın dövüşte iki elle, parantezdeki hasar zarı.
  const versatile = !ranged && use === 'main' && !!weapon.versatileDamage && otherHandFree(sheet);
  const dice = versatile ? weapon.versatileDamage as string : weapon.damage;
  // Great Weapon Fighting: iki elle tutulan yakın dövüş silahı (Two-Handed ya da iki elle Versatile).
  const twoHands = !ranged && (weapon.twoHanded === true || versatile);
  const minDie = twoHands ? feats.minDamageDie : 0;
  // Yan el (Light ek saldırısı): yetenek değiştiricisi hasara eklenmez (negatifse eklenir); Two-Weapon Fighting ekler.
  const dmgMod = use === 'offhand' && !feats.offhandModifier ? Math.min(0, mod) : mod;
  const bonus = dmgMod + enchant;
  const name = enchant > 0 ? `${weapon.name} +${enchant}` : weapon.name;
  return {
    label: use === 'thrown' ? `${name} (fırlatma)` : use === 'offhand' ? `${name} (yan el)` : name,
    attackBonus: mod + (proficient ? d.proficiency : 0) + enchant + archery,
    damage: bonus === 0 ? dice : `${dice}${bonus > 0 ? '+' : ''}${bonus}`,
    damageType: weapon.damageType,
    ranged,
    spell: false,
    ...(ranged && weapon.range
      ? { range: weapon.range }
      : { reachFt: weapon.reach ? 10 : 5 }),
    tag: `${race.name} ${cls.name} ${weapon.name} ${weapon.damageType}`.toLowerCase(),
    ...(weapon.finesse ? { finesse: true } : {}),
    weaponId: weapon.id,
    abilityMod: mod,
    // Saldırının yeteneği (Rage hasarı, Reckless Attack): Finesse'te yüksek olanı, eşitse STR.
    ability: weapon.finesse ? (d.modifiers.str >= d.modifiers.dex ? 'str' : 'dex') : weapon.ranged ? 'dex' : 'str',
    ...(mastery ? {
      mastery,
      weaponDamage: enchant === 0 ? dice : `${dice}+${enchant}`,
      masteryDc: 8 + mod + d.proficiency,
    } : {}),
    ...(minDie > 0 ? { minDie } : {}),
    ...(weapon.light ? { light: true } : {}),
    ...(twoHands ? { twoHands: true } : {}),
    ...(use === 'offhand' ? { offhand: true } : {}),
  };
}

export function weaponAttackOption(sheet: CharacterSheet, weaponName: string, enchant = 0): AttackOption {
  return optionFor(sheet, weaponName, enchant, 'main');
}

/**
 * Silahın bütün saldırı seçenekleri: kendisi ve fırlatılabiliyorsa fırlatma (aynı yetenek
 * modifier'ı, menzilli saldırı, silahın menzili; SRD 5.2.1 Thrown; tek elle, Versatile zarı değil).
 */
export function weaponAttackOptions(sheet: CharacterSheet, weaponName: string, enchant = 0): AttackOption[] {
  const base = optionFor(sheet, weaponName, enchant, 'main');
  const weapon = weapons.find((w) => w.name === weaponName);
  if (!weapon?.thrown || !weapon.range) return [base];
  return [base, optionFor(sheet, weaponName, enchant, 'thrown')];
}

/** Yan el saldırısı (Light ek saldırısı; Görev P1): geçerli yan el seçimi yoksa null. */
export function offHandAttackOption(sheet: CharacterSheet): AttackOption | null {
  if (!sheet.offHand || offHandProblem(sheet) !== null) return null;
  const w = (sheet.weapons ?? []).find((x) => x.name === sheet.offHand);
  return optionFor(sheet, sheet.offHand, w?.enchant ?? 0, 'offhand');
}
