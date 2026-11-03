/**
 * Kuyruk 19 (SRD canavar yetenekleri): Aura of Authority (Hobgoblin Captain): 10 ft içindeki dostlar ve kendisi saldırı
 * ve save'lerde avantajlı (kaptan Incapacitated değilken). Reducer sonunda türetilir (`authorityAdv`), save yolları okur.
 */
import { distance, type Offset } from '../rules/hex';
import { isIncapacitated } from '../rules/conditions';
import type { BattleState, Combatant } from './types';

export function syncAuthority(state: BattleState): BattleState {
  const holders = Object.values(state.combatants).filter((h) => h.effects?.some((e) => e.authority !== undefined));
  const had = Object.values(state.combatants).some((c) => c.authorityAdv);
  if (!holders.length && !had) return state;
  let next = state;
  for (const c of Object.values(state.combatants)) {
    const want = !!c.pos && holders.some((h) => h.side === c.side && h.hp > 0 && !!h.pos && !isIncapacitated(h.conditions)
      && h.effects!.some((e) => e.authority !== undefined && distance(h.pos as Offset, c.pos as Offset) * 5 <= (e.authority ?? 0)));
    if (!!c.authorityAdv === want) continue;
    const { authorityAdv: _x, ...rest } = c;
    next = { ...next, combatants: { ...next.combatants, [c.id]: { ...rest, ...(want ? { authorityAdv: true } : {}) } as Combatant } };
  }
  return next;
}
