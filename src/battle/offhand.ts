/**
 * Light özelliğinin ek saldırısı (yan el; Görev P1, SRD 5.2.1): Attack eylemiyle Light bir silahla saldıran, aynı tur
 * yan elindeki farklı Light silahla bir ek saldırı yapar. Bonus eylemdir; yan el silahında Nick varsa Attack eyleminin
 * içinde yapılır (bonus eylem boş kalır). Turda bir kez. Yetenek değiştiricisi hasara eklenmez (negatifse eklenir);
 * Two-Weapon Fighting ekler (seçenek karakter kurulurken hesaplanır: `offHandAttackOption`).
 */
import { fail, finish, type CommandResult } from './common';
import { offhandProblem } from './economy';
import { weaponAttackEvents } from './features';
import type { BattleState, Combatant } from './types';
import type { Rng } from '../rules/dice';

export { offhandProblem } from './economy';

export function executeOffhandAttack(state: BattleState, actor: Combatant, targetId: string, rng: Rng): CommandResult {
  const why = offhandProblem(actor);
  if (why) return fail(why);
  const target = state.combatants[targetId];
  if (!target) return fail('Hedef bulunamadı.');
  const r = weaponAttackEvents(state, actor, target, actor.offHandOption as NonNullable<Combatant['offHandOption']>, rng);
  if (!r.ok) return r;
  return finish(state, r.events);
}
