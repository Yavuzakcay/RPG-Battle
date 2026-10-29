/** Karakterin silahından saldırı seçeneği üretir (saldırı bonusu, hasar zarı, hasar türü, etiket). */
import { armor, getClass, getRace, weapons, type Weapon } from '../data';
import { classKit } from '../rules/classFeatures';
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
  // Martial Arts (Görev P-Monk): zırhsız ve kalkansızken Monk silahında DEX ya da STR ve Martial Arts zarı (büyükse).
  const ma = use !== 'thrown' ? martialArtsFor(sheet, weapon) : null;
  // Finesse: STR veya DEX'in yükseği. Menzilli: DEX. Diğerleri: STR.
  const mod = weapon.finesse || ma
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
  const base = versatile ? weapon.versatileDamage as string : weapon.damage;
  const dice = ma && avgDie(ma) > avgDie(base) ? ma : base;
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
    ability: weapon.finesse || ma ? (d.modifiers.str >= d.modifiers.dex ? 'str' : 'dex') : weapon.ranged ? 'dex' : 'str',
    ...(mastery ? {
      mastery,
      weaponDamage: enchant === 0 ? dice : `${dice}+${enchant}`,
      masteryDc: 8 + mod + d.proficiency,
    } : {}),
    ...(minDie > 0 ? { minDie } : {}),
    ...(weapon.light ? { light: true } : {}),
    ...(twoHands ? { twoHands: true } : {}),
    ...(use === 'offhand' ? { offhand: true } : {}),
    ...(ma ? { martialArts: true } : {}),
  };
}

const avgDie = (dice: string): number => {
  const m = /^(\d+)d(\d+)/.exec(dice);
  return m ? Number(m[1]) * (Number(m[2]) + 1) / 2 : 0;
};

/** Martial Arts geçerli mi (zırh ve kalkan yok, özellik var): zarı; değilse null. */
function martialArtsDie(sheet: CharacterSheet): { die: string; simpleMelee: boolean; martialLight: boolean; bonusStrike: boolean } | null {
  const ma = classKit(sheet.classId, sheet.level, sheet.subclassId).martialArts;
  const unarmored = armor.find((a) => a.name === sheet.armorName)?.type === 'none' && !sheet.shield;
  return ma && unarmored ? ma : null;
}

/** Silah Monk silahıysa (basit yakın dövüş ya da Light martial yakın dövüş) Martial Arts zarı; değilse null. */
function martialArtsFor(sheet: CharacterSheet, weapon: Weapon): string | null {
  const ma = martialArtsDie(sheet);
  if (!ma || weapon.ranged) return null;
  const monk = (weapon.category === 'simple' && ma.simpleMelee) || (weapon.category === 'martial' && weapon.light && ma.martialLight);
  return monk ? ma.die : null;
}

/**
 * Unarmed Strike (SRD 5.2.1): herkes STR + yetkinlikle vurur, hasar 1 + STR bludgeoning (Görev F; en az 0). Martial
 * Arts geçerliyken (Görev P-Monk) zarı Martial Arts zarı, DEX ya da STR.
 */
export function unarmedStrikeOption(sheet: CharacterSheet): AttackOption | null {
  const ma = martialArtsDie(sheet);
  const d = deriveStats(sheet);
  if (!ma) {
    const str = d.modifiers.str;
    return {
      label: 'Unarmed Strike', attackBonus: str + d.proficiency, damage: String(Math.max(0, 1 + str)), damageType: 'bludgeoning',
      ranged: false, spell: false, reachFt: 5, tag: `${getRace(sheet.raceId).name} ${getClass(sheet.classId).name} unarmed bludgeoning`.toLowerCase(),
      weaponId: 'unarmed-strike', abilityMod: str, ability: 'str',
    };
  }
  const mod = Math.max(d.modifiers.str, d.modifiers.dex);
  const cls = getClass(sheet.classId);
  const race = getRace(sheet.raceId);
  return {
    label: 'Unarmed Strike', attackBonus: mod + d.proficiency, damage: mod === 0 ? ma.die : `${ma.die}${mod > 0 ? '+' : ''}${mod}`,
    damageType: 'bludgeoning', ranged: false, spell: false, reachFt: 5, tag: `${race.name} ${cls.name} unarmed bludgeoning`.toLowerCase(),
    weaponId: 'unarmed-strike', abilityMod: mod, ability: d.modifiers.str >= d.modifiers.dex ? 'str' : 'dex', martialArts: true,
  };
}

/** Martial Arts'ın bonus eylemle Unarmed Strike'ı var mı. */
export const hasBonusUnarmed = (sheet: CharacterSheet): boolean => martialArtsDie(sheet)?.bonusStrike === true;

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
