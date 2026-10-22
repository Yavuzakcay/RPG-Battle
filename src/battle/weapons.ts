/** Karakterin silahından saldırı seçeneği üretir (saldırı bonusu, hasar zarı, hasar türü, etiket). */
import { getClass, getRace, weapons } from '../data';
import { deriveStats, type CharacterSheet } from '../rules/stats';
import { featEffects, sheetFeats } from '../rules/advancement';
import { activeMasteries, masteryWorks, weaponMasteryId, weaponProficient } from '../rules/mastery';
import type { AttackOption } from './types';

export function weaponAttackOption(sheet: CharacterSheet, weaponName: string, enchant = 0): AttackOption {
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
  const bonus = mod + enchant;
  const feats = featEffects(sheetFeats(sheet));
  // Archery (Fighting Style): menzilli silahla saldırıya +2 (fırlatılan yakın dövüş silahı değil).
  const archery = weapon.ranged ? feats.rangedAttackBonus : 0;
  // Weapon Mastery: seçilen silahın SRD ustalığı (oyunda çalışıyorsa).
  const masteryId = activeMasteries(sheet).has(weapon.id) ? weaponMasteryId(weapon.id) : undefined;
  const mastery = masteryId && masteryWorks(masteryId) ? masteryId : undefined;
  // Great Weapon Fighting: iki elle tutulan yakın dövüş silahı (Two-Handed ya da kalkansız Versatile).
  const twoHands = !weapon.ranged && (weapon.twoHanded === true || (!!weapon.versatileDamage && !sheet.shield));
  const minDie = twoHands ? feats.minDamageDie : 0;
  return {
    label: enchant > 0 ? `${weapon.name} +${enchant}` : weapon.name,
    attackBonus: mod + (proficient ? d.proficiency : 0) + enchant + archery,
    damage: bonus === 0 ? weapon.damage : `${weapon.damage}${bonus > 0 ? '+' : ''}${bonus}`,
    damageType: weapon.damageType,
    ranged: weapon.ranged,
    spell: false,
    ...(weapon.ranged && weapon.range
      ? { range: weapon.range }
      : { reachFt: weapon.reach ? 10 : 5 }),
    tag: `${race.name} ${cls.name} ${weapon.name} ${weapon.damageType}`.toLowerCase(),
    ...(weapon.finesse ? { finesse: true } : {}),
    weaponId: weapon.id,
    abilityMod: mod,
    ...(mastery ? {
      mastery,
      weaponDamage: enchant === 0 ? weapon.damage : `${weapon.damage}+${enchant}`,
      masteryDc: 8 + mod + d.proficiency,
    } : {}),
    ...(minDie > 0 ? { minDie } : {}),
  };
}

/**
 * Silahın bütün saldırı seçenekleri: kendisi ve fırlatılabiliyorsa fırlatma (aynı yetenek
 * modifier'ı, menzilli saldırı, silahın menzili; SRD 5.2.1 Thrown).
 */
export function weaponAttackOptions(sheet: CharacterSheet, weaponName: string, enchant = 0): AttackOption[] {
  const base = weaponAttackOption(sheet, weaponName, enchant);
  const weapon = weapons.find((w) => w.name === weaponName);
  if (!weapon?.thrown || !weapon.range) return [base];
  // Fırlatma menzilli saldırıdır: iki elle yakın dövüş (Great Weapon Fighting) geçerli değil.
  const { reachFt: _reach, minDie: _min, ...rest } = base;
  return [base, { ...rest, label: `${base.label} (fırlatma)`, ranged: true, range: weapon.range }];
}
