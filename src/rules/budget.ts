/** Kuyruk 38: karşılaşma XP bütçesi (SRD 5.2.1, `data/butce.json`). Saf. */
import data from '../../data/butce.json';

export type EncounterDifficulty = 'low' | 'moderate' | 'high';
const COL: Record<EncounterDifficulty, 0 | 1 | 2> = { low: 0, moderate: 1, high: 2 };
const TABLE = (data as unknown as { seviyeler: Record<string, [number, number, number]> }).seviyeler;

/** Karakter başına bütçe (seviye 1–20 dışında en yakın uç). */
export function budgetPerCharacter(level: number, difficulty: EncounterDifficulty): number {
  const lv = Math.min(20, Math.max(1, Math.round(level)));
  return TABLE[String(lv)]?.[COL[difficulty]] ?? 0;
}
/** Partinin karşılaşma bütçesi: seviyelerin karakter başına bütçelerinin toplamı (karışık seviyeli parti). */
export const encounterBudget = (levels: number[], difficulty: EncounterDifficulty): number =>
  levels.reduce((sum, lv) => sum + budgetPerCharacter(lv, difficulty), 0);
