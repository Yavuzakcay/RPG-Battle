/**
 * Silah ustalığı (Weapon Mastery, SRD 5.2.1): hangi silahın hangi ustalığı taşıdığı SRD silah tablosundan
 * (`data/srd/weapons.json`), kaç silah seçilebileceği ve kısıtı sınıf tablosundan (`classKit().weaponMastery`),
 * ustalığın oyunda çalışıp çalışmadığı `data/class-features.json` "masteries"ten. Kodda sınıf adıyla koşul yok.
 * Saf fonksiyonlar; veri `loadClassData()` ile yüklenmiş olmalı.
 */
import { classData, getClass, weapons, type MasteryId, type MasteryMechanic, type SrdMastery, type Weapon } from '../data';
import { classKit, optionTraining } from './classFeatures';
import type { CharacterSheet } from './stats';

/** Sınıf bu silahta yetkin mi (Simple hep; Martial sınıfa ya da Finesse/Light özelliğine göre). */
export function weaponProficient(classId: string, weapon: Weapon, choices?: Record<string, string>): boolean {
  const cls = getClass(classId);
  return weapon.category === 'simple' || cls.weaponProficiency === 'martial'
    || cls.martialWeaponProperties.some((p) => weapon[p]) || optionTraining(classId, choices).martialWeapons;
}

/** Silahın SRD ustalığı (silah kimliği `data/weapons.json` = `data/srd/weapons.json`). */
export function weaponMasteryId(weaponId: string): MasteryId | undefined {
  const m = classData.srdWeapons.find((w) => w.id === weaponId)?.mastery;
  return m ? (m.toLowerCase() as MasteryId) : undefined;
}

/** Ustalığın SRD metni ve oyundaki mekaniği. */
export const masteryText = (id: MasteryId): SrdMastery | undefined => classData.masteries.find((m) => m.id === id);
export const masteryMechanic = (id: MasteryId): MasteryMechanic | undefined => classData.mechanics.masteries[id];
/** Ustalık oyunda çalışıyor mu (missing değil). */
export const masteryWorks = (id: MasteryId): boolean => {
  const m = masteryMechanic(id);
  return !!m && m.status !== 'missing';
};

/** Karakterin ustalık hakkı (sınıf ve seviyeden); yoksa null. */
export const masteryRight = (sheet: CharacterSheet) => classKit(sheet.classId, sheet.level, sheet.subclassId).weaponMastery;

/** Ustalık için seçilebilecek silahlar: yetkin olunan (ve sınıf kısıtı varsa yakın dövüş) silahlar. */
export function masteryOptions(sheet: CharacterSheet): Weapon[] {
  const right = masteryRight(sheet);
  if (!right) return [];
  return weapons.filter((w) => weaponProficient(sheet.classId, w, sheet.featureChoices) && (!right.melee || !w.ranged) && !!weaponMasteryId(w.id));
}

/** Seçim sorunları: hak yok, fazla seçim, uygun olmayan silah. Boşsa geçerli. */
export function masteryProblems(sheet: CharacterSheet): string[] {
  const chosen = sheet.weaponMasteries ?? [];
  if (chosen.length === 0) return [];
  const right = masteryRight(sheet);
  if (!right) return ['Bu sınıfın silah ustalığı yok.'];
  const out: string[] = [];
  if (chosen.length > right.count) out.push(`En çok ${right.count} silah seçilebilir.`);
  if (new Set(chosen).size !== chosen.length) out.push('Aynı silah iki kez seçilmiş.');
  const ok = new Set(masteryOptions(sheet).map((w) => w.id));
  for (const id of chosen) if (!ok.has(id)) out.push(`${id}: bu silahın ustalığı seçilemez.`);
  return out;
}

/** Savaşta geçerli ustalıklar: geçerli seçimler (sınırı aşan fazlası sayılmaz). */
export function activeMasteries(sheet: CharacterSheet): Set<string> {
  const right = masteryRight(sheet);
  if (!right) return new Set();
  const ok = new Set(masteryOptions(sheet).map((w) => w.id));
  return new Set((sheet.weaponMasteries ?? []).filter((id) => ok.has(id)).slice(0, right.count));
}

/** Uzun dinlenmede kaç seçim değiştirilebilir (Barbarian/Fighter: 1; diğerleri: hepsi). */
export function masterySwapLimit(sheet: CharacterSheet): number {
  const right = masteryRight(sheet);
  if (!right) return 0;
  return right.swap === 'all' ? right.count : right.swap;
}

/** Uzun dinlenmedeki değişiklik kurala uygun mu: eskide olmayan yeni seçim sayısı sınırı aşmamalı. */
export function masterySwapProblem(sheet: CharacterSheet, next: string[]): string | null {
  const before = new Set(sheet.weaponMasteries ?? []);
  const changed = next.filter((id) => !before.has(id)).length;
  const limit = masterySwapLimit(sheet);
  if (changed > limit) return `Uzun dinlenmede en çok ${limit} silah seçimi değişebilir.`;
  return masteryProblems({ ...sheet, weaponMasteries: next })[0] ?? null;
}
