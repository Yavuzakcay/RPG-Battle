/**
 * Kuyruk G6: Beacon of Hope (SRD 5.2.1) iyileştirme zarlarında en yüksek değer. Büyü iyileştirmeleri bunu
 * `spells.ts` `healAmount`'ta zaten uyguluyordu; iksir ve sınıf/tür/yoldaş özellikleri de bu tek girişten geçer
 * (hedefte `maxHeal` etkisi varsa zar atılmaz). Kural sürümü 43 ve sonrası; eski savaşlarda zar atılır. Saf.
 */
import { parseDice, rollDice, rollTag, type Rng } from '../rules/dice';
import { ruleVersion } from './ruleVersion';
import type { BattleState, Combatant } from './types';

/** İyileştirme zarının toplamı: hedefte Beacon of Hope varsa en yüksek değer, yoksa atılan zar. */
export function healRoll(state: Pick<BattleState, 'kuralSurumu'>, target: Combatant, expr: string, rng: Rng, by: string): number {
  if (ruleVersion(state) >= 43 && target.effects?.some((e) => e.maxHeal)) {
    const d = parseDice(expr);
    return d.count * d.sides + d.bonus;
  }
  return rollDice(expr, rollTag(rng, { kind: 'heal', by })).total;
}
