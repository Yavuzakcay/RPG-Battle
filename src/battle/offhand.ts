/**
 * Light özelliğinin ek saldırısı (yan el; Görev P1, SRD 5.2.1): Attack eylemiyle Light bir silahla saldıran, aynı tur
 * yan elindeki farklı Light silahla bir ek saldırı yapar. Bonus eylemdir; yan el silahında Nick varsa Attack eyleminin
 * içinde yapılır (bonus eylem boş kalır). Turda bir kez. Yetenek değiştiricisi hasara eklenmez (negatifse eklenir);
 * Two-Weapon Fighting ekler (seçenek karakter kurulurken hesaplanır: `offHandAttackOption`).
 */
import { fail, finish, type CommandResult } from './common';
import { offhandProblem } from './economy';
import { weaponAttackEvents } from './features';
import type { BattleState, Combatant, CunningOption } from './types';
import { cunningProblem } from './classTraits';
import { sinif97On } from './sinif97Surum';
import type { Rng } from '../rules/dice';

export { offhandProblem } from './economy';

export function executeOffhandAttack(state: BattleState, actor: Combatant, targetId: string, rng: Rng, cunning?: CunningOption[]): CommandResult {
  const why = offhandProblem(actor);
  if (why) return fail(why);
  const target = state.combatants[targetId];
  if (!target) return fail('Hedef bulunamadı.');
  // Görev B95-B (97+, SRD 5.2.1 s. 63 Cunning Strike "When you deal Sneak Attack damage"): yan el saldırısında da seçilir.
  const picks = sinif97On(state) ? cunning ?? [] : [];
  const bad = cunningProblem(actor, picks);
  if (bad) return fail(bad);
  const r = weaponAttackEvents(state, actor, target, actor.offHandOption as NonNullable<Combatant['offHandOption']>, rng, false, false, picks.length ? { cunning: picks } : {});
  if (!r.ok) return r;
  return finish(state, r.events);
}
