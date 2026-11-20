/**
 * GENEL96 (kural sürümü 96) saldırı bağlamı yardımcıları: Yardım işaretinin yardım edene işlememesi (A13/F19) ve Kaçın'ın
 * görülmeyen saldırana ya da etkiden gelen hız 0'da işlememesi (A10/A11). Saf; 95 ve altı eski bağlamı verir.
 */
import { effectSpeedZero } from './flight';
import { genel96On } from './genel96Surum';
import type { BattleState, Combatant } from './types';

/**
 * SRD 5.2.1 s. 182–183 Help "… one of your allies has Advantage …": hedefteki Yardım işaretlerinin hepsi saldıranın
 * kendisinden geldiyse saldıran yararlanmaz (`attackerSide` verilmez; işaret de kalkmaz).
 */
export function helpOnlySelf(state: BattleState, attacker: Pick<Combatant, 'id' | 'side'>, target: Pick<Combatant, 'conditions' | 'conditionTimers'>): boolean {
  if (!genel96On(state)) return false;
  const mark = `Help:${attacker.side}`;
  if (!target.conditions.includes(mark)) return false;
  const src = (target.conditionTimers ?? []).filter((t) => t.condition === mark).map((t) => t.sourceId);
  return src.length > 0 && src.every((s) => s === attacker.id);
}

/**
 * Saldırı bağlamının sürüm 96 alanları: `attackerSide` (Yardım) ve `dodgeVoid` (SRD 5.2.1 s. 181 Dodge: "if you can see
 * the attacker"; "You lose these benefits if you have the Incapacitated condition or if your Speed is 0": kaçınan Blinded
 * ya da etkiden hız 0). Görünmez saldıran eski koşulla zaten dışarıda.
 */
export function attackCtx96(state: BattleState, attacker: Combatant, target: Combatant): { attackerSide?: string; dodgeVoid?: boolean } {
  const side = helpOnlySelf(state, attacker, target) ? {} : { attackerSide: attacker.side };
  if (!genel96On(state) || !target.conditions.includes('Dodge')) return side;
  return target.conditions.includes('Blinded') || effectSpeedZero(target) ? { ...side, dodgeVoid: true } : side;
}
