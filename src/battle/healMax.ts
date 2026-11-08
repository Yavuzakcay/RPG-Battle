/**
 * Kuyruk G6 / K70: Beacon of Hope (SRD 5.2.1: "regains the maximum number of Hit Points possible from any healing")
 * iyileştirme zarlarında en yüksek değer: TEK yardımcı. Hedefte `maxHeal` etkisi varsa zar atılmaz.
 * - Büyü iyileştirmesi (`spells.ts` `healAmount`): Görev B1'den beri her sürümde.
 * - İksir, sınıf/tür/yoldaş özellikleri, alan iyileştirmesi (`healRoll`): kural sürümü 43+.
 * - Kuyruk K70 (sürüm 54+): Uncanny Metabolism, paket iyileştirme zarı (`paket/p11.ts`), paket `iyilestirme` ilkeli,
 *   Lifedrinker.
 * Saf.
 */
import { parseDice, rollDice, rollTag, type Rng } from '../rules/dice';
import { ruleVersion } from './ruleVersion';
import type { BattleState, Combatant } from './types';

/** Kuyruk K70: Beacon kuralının yeni bağlandığı yolların sürümü. */
export const BEACON_K70_VERSION = 54;

/** Zar ifadesinin en yüksek değeri ("2d8+3" → 19). */
export function diceMaxOf(expr: string): number {
  const d = parseDice(expr);
  return d.count * d.sides + d.bonus;
}

/**
 * Beacon of Hope etkisi altındaki hedefin iyileştirme zarı için en yüksek değer; etki yoksa ya da savaşın sürümü
 * `minVersion`'dan eskiyse null (çağıran zarı kendi yolundan atar).
 */
export function beaconMax(state: Pick<BattleState, 'kuralSurumu'> | undefined, target: Pick<Combatant, 'effects'> | undefined, expr: string, minVersion: number): number | null {
  if (minVersion > 0 && (!state || ruleVersion(state) < minVersion)) return null;
  return target?.effects?.some((e) => e.maxHeal) ? diceMaxOf(expr) : null;
}

/** İyileştirme zarının toplamı: hedefte Beacon of Hope varsa en yüksek değer, yoksa atılan zar (sürüm 43+). */
export function healRoll(state: Pick<BattleState, 'kuralSurumu'>, target: Combatant, expr: string, rng: Rng, by: string, minVersion = 43): number {
  return beaconMax(state, target, expr, minVersion) ?? rollDice(expr, rollTag(rng, { kind: 'heal', by })).total;
}
