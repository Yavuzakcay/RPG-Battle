/**
 * Görev B4 (SRD 5.2.1): görünmezliğin saldırıdaki etkisi büyülerle değişir. Faerie Fire ve Starry Wisp'in işaretlediği
 * yaratık Invisible durumundan yararlanamaz (`revealed`); See Invisibility'li yaratık görünmezi görür (`seeInvisible`).
 * Saldırı bağlamına verilen durum listelerinden Invisible bu durumlarda çıkarılır (durumun kendisi kalır).
 */
import { withinFiveFt } from './common';
import { frightenedNow, srdConditions } from './ruleVersion';
import { globalRule } from './ruleControl';
import { distance } from '../rules/hex';
import type { BattleState, Combatant } from './types';

const revealed = (c: Combatant) => c.effects?.some((e) => e.revealed) ?? false;
const seesInvisible = (c: Combatant) => c.effects?.some((e) => e.seeInvisible) ?? false;

/**
 * Kuyruk 19: özel duyular (SRD 5.2.1): Blindsight ve Truesight menzili içinde görme gerektiren her şey (görünmez yaratık,
 * karanlık, büyülü karanlık) görülür. Anahtar `specialSenses` (sürüm 16). Tremorsense yeri belirler ama "görmez".
 */
export function senseSees(state: Pick<BattleState, 'map' | 'kuralSurumu'> | undefined, observer: Combatant, target: Combatant): boolean {
  if (!state || !observer.senses || !observer.pos || !target.pos || !globalRule(state, 'specialSenses')) return false;
  const ft = Math.max(observer.senses.blindsight ?? 0, observer.senses.truesight ?? 0);
  return ft > 0 && distance(observer.pos, target.pos) * 5 <= ft;
}
const drop = (conds: string[]) => conds.filter((x) => x !== 'Invisible');

/**
 * Saldırı bağlamı için saldıranın ve hedefin durumları (görünmezlik görülüyorsa Invisible yok sayılır). Kuyruk 16 K16E
 * (kural sürümü 2, `state` verilince): korku kaynağı görüş hattında değilse saldıranın Frightened'ı sayılmaz; Prone
 * hedefe saldırı saldıranın 5 ft içinde olup olmamasına göre (`proneWithin5`; saldırı türüne bakılmaz).
 */
export function sightConditions(attacker: Combatant, target: Combatant, state?: BattleState, melee = true): { attackerConditions: string[]; targetConditions: string[]; proneWithin5?: boolean } {
  let attackerConditions = revealed(attacker) || seesInvisible(target) || senseSees(state, target, attacker) ? drop(attacker.conditions) : attacker.conditions;
  const targetConditions = revealed(target) || seesInvisible(attacker) || senseSees(state, attacker, target) ? drop(target.conditions) : target.conditions;
  if (!state || !srdConditions(state)) return { attackerConditions, targetConditions };
  if (attackerConditions.includes('Frightened') && !frightenedNow(state, attacker)) attackerConditions = attackerConditions.filter((x) => x !== 'Frightened');
  return { attackerConditions, targetConditions, ...(targetConditions.includes('Prone') ? { proneWithin5: withinFiveFt(state, attacker, target, melee) } : {}) };
}
