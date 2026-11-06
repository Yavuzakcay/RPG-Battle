/**
 * Görev P0: saldırı isabeti kancaları (döngüsel içe aktarma olmadan; ek paket yorumlayıcısı kaydeder,
 * `features.ts` `weaponAttackEvents` isabette çağırır). Kanca ek hasar (`extras`, hedefin tepkisinden önce hasara
 * eklenir) ve saldırı olayından sonra uygulanacak olaylar (`after`) döner. Kayıt yoksa etkisiz. Saf.
 */
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, ExtraDamage } from './types';

export interface HitContext {
  spell: boolean;
  melee: boolean;
  ranged: boolean;
  critical: boolean;
  advantage: boolean;
  weaponType: string;
}
/** `after`: saldırı olayı uygulanmış durumda üretilir (hedef düşmüş olabilir). */
export type HitAfter = (state: BattleState) => BattleEvent[];
export type HitHook = (state: BattleState, actor: Combatant, target: Combatant, ctx: HitContext, rng: Rng) => { extras: ExtraDamage[]; after: HitAfter[] } | null;
const HOOKS: HitHook[] = [];
export const registerHitHook = (h: HitHook): void => { if (!HOOKS.includes(h)) HOOKS.push(h); };

export function hitHookResults(state: BattleState, actor: Combatant, target: Combatant, ctx: HitContext, rng: Rng): { extras: ExtraDamage[]; after: HitAfter[] } | null {
  if (!HOOKS.length) return null;
  const extras: ExtraDamage[] = [];
  const after: HitAfter[] = [];
  for (const h of HOOKS) {
    const r = h(state, actor, target, ctx, rng);
    if (r) { extras.push(...r.extras); after.push(...r.after); }
  }
  return extras.length || after.length ? { extras, after } : null;
}
