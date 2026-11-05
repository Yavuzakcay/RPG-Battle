/**
 * Kuyruk K54b: tur başı kancaları (döngüsel içe aktarma olmadan; imza modülleri kaydeder, `end_turn` çağırır). Kayıt
 * yoksa olay yok. Saf.
 */
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Command } from './types';

type TurnHook = (state: BattleState, id: string, rng: Rng) => BattleEvent[];
const START: TurnHook[] = [];
export const registerTurnStart = (h: TurnHook): void => { START.push(h); };
/** Sırası gelen savaşçının tur başı kanca olayları (sırayla uygulanır). */
export function turnStartHookEvents(state: BattleState, id: string, rng: Rng, apply: (s: BattleState, e: BattleEvent[]) => BattleState): BattleEvent[] {
  const out: BattleEvent[] = [];
  let cur = state;
  for (const h of START) {
    const evs = h(cur, id, rng);
    if (!evs.length) continue;
    out.push(...evs);
    cur = apply(cur, evs);
  }
  return out;
}

/** Komut sonu kancası: komutun öncesi, sonrası, olayları ve komutu (Ortak Şifa, Peşini Bırakmayan). */
type EndHook = (before: BattleState, next: BattleState, events: BattleEvent[], cmd: Command, rng: Rng) => BattleEvent[];
const END: EndHook[] = [];
export const registerCommandEnd = (h: EndHook): void => { END.push(h); };
export function commandEndHookEvents(before: BattleState, next: BattleState, events: BattleEvent[], cmd: Command, rng: Rng, apply: (s: BattleState, e: BattleEvent[]) => BattleState): BattleEvent[] {
  const out: BattleEvent[] = [];
  let cur = next;
  for (const h of END) {
    const evs = h(before, cur, [...events, ...out], cmd, rng);
    if (!evs.length) continue;
    out.push(...evs);
    cur = apply(cur, evs);
  }
  return out;
}
