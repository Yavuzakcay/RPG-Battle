/**
 * Kuyruk MB5 (kural sürümü 73): yapay zekâ binicisi ve büyük binek yardımcıları (saf; karar yapıştırıcısı `ai.ts`).
 * - Binici (`riding`) kendi yürümez: bineğin hareketiyle taşınır, yürüyüş/atlama adayı üretilmez (motor zaten reddederdi;
 *   eskiden her aday tek tek kuru çalıştırılıp reddediliyordu).
 * - Çok altıgenli yaratığın gövdesi sığmayan (dar geçit, gövde altıgeninde dost) çapalar aday sayılmaz.
 * Sabit değer yok (`data/yapay-zeka.json`'a yazılacak parametre çıkmadı).
 */
import type { Offset } from '../../rules/hex';
import { binekMb5On } from '../binekMb5Surum';
import { isMultiHex53 } from '../body';
import { bodyFitProblem } from '../movement';
import type { BattleState, Combatant } from '../types';

/** Binici yürüyüş/atlama yeri üretmez (bineğin hareketiyle taşınır). */
export const riderStays = (state: BattleState, actor: Combatant): boolean => binekMb5On(state) && !!actor.riding;

/** Çok altıgenli yaratığın (binicili ya da binicisiz) gövdesi `to` çapasına sığmıyor mu (sığmayan yer aday sayılmaz). */
export function bodyUnfit(state: BattleState, actor: Combatant, to: Offset): boolean {
  if (!binekMb5On(state) || !isMultiHex53(state, actor)) return false;
  return bodyFitProblem(state, actor, to, actor.rider ? [actor.rider] : []) !== null;
}
