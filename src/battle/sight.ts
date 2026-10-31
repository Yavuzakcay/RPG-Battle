/**
 * Görev B4 (SRD 5.2.1): görünmezliğin saldırıdaki etkisi büyülerle değişir. Faerie Fire ve Starry Wisp'in işaretlediği
 * yaratık Invisible durumundan yararlanamaz (`revealed`); See Invisibility'li yaratık görünmezi görür (`seeInvisible`).
 * Saldırı bağlamına verilen durum listelerinden Invisible bu durumlarda çıkarılır (durumun kendisi kalır).
 */
import { withinFiveFt } from './common';
import { frightenedNow, srdConditions } from './ruleVersion';
import type { BattleState, Combatant } from './types';

const revealed = (c: Combatant) => c.effects?.some((e) => e.revealed) ?? false;
const seesInvisible = (c: Combatant) => c.effects?.some((e) => e.seeInvisible) ?? false;
const drop = (conds: string[]) => conds.filter((x) => x !== 'Invisible');

/**
 * Saldırı bağlamı için saldıranın ve hedefin durumları (görünmezlik görülüyorsa Invisible yok sayılır). Kuyruk 16 K16E
 * (kural sürümü 2, `state` verilince): korku kaynağı görüş hattında değilse saldıranın Frightened'ı sayılmaz; Prone
 * hedefe saldırı saldıranın 5 ft içinde olup olmamasına göre (`proneWithin5`; saldırı türüne bakılmaz).
 */
export function sightConditions(attacker: Combatant, target: Combatant, state?: BattleState, melee = true): { attackerConditions: string[]; targetConditions: string[]; proneWithin5?: boolean } {
  let attackerConditions = revealed(attacker) || seesInvisible(target) ? drop(attacker.conditions) : attacker.conditions;
  const targetConditions = revealed(target) || seesInvisible(attacker) ? drop(target.conditions) : target.conditions;
  if (!state || !srdConditions(state)) return { attackerConditions, targetConditions };
  if (attackerConditions.includes('Frightened') && !frightenedNow(state, attacker)) attackerConditions = attackerConditions.filter((x) => x !== 'Frightened');
  return { attackerConditions, targetConditions, ...(targetConditions.includes('Prone') ? { proneWithin5: withinFiveFt(state, attacker, target, melee) } : {}) };
}
