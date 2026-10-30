/**
 * Görev B4 (SRD 5.2.1): görünmezliğin saldırıdaki etkisi büyülerle değişir. Faerie Fire ve Starry Wisp'in işaretlediği
 * yaratık Invisible durumundan yararlanamaz (`revealed`); See Invisibility'li yaratık görünmezi görür (`seeInvisible`).
 * Saldırı bağlamına verilen durum listelerinden Invisible bu durumlarda çıkarılır (durumun kendisi kalır).
 */
import type { Combatant } from './types';

const revealed = (c: Combatant) => c.effects?.some((e) => e.revealed) ?? false;
const seesInvisible = (c: Combatant) => c.effects?.some((e) => e.seeInvisible) ?? false;
const drop = (conds: string[]) => conds.filter((x) => x !== 'Invisible');

/** Saldırı bağlamı için saldıranın ve hedefin durumları (görünmezlik görülüyorsa Invisible yok sayılır). */
export function sightConditions(attacker: Combatant, target: Combatant): { attackerConditions: string[]; targetConditions: string[] } {
  return {
    attackerConditions: revealed(attacker) || seesInvisible(target) ? drop(attacker.conditions) : attacker.conditions,
    targetConditions: revealed(target) || seesInvisible(attacker) ? drop(target.conditions) : target.conditions,
  };
}
