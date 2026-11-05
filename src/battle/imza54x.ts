/**
 * Kuyruk K54: imza özel eylemlerinin doğrulaması ve yürütmesi (`ozel`; `imza.ts` çağırır). Altıgen hedefli ve iki
 * aşamalı (yaratık + altıgen) eylemler burada. Saf.
 */
import { byLevel } from './imzaCore';
import { mindObjectEvents, mindObjectProblem, hurlEvents } from './imza54';
import type { ImzaSpec } from './imza';
import type { Rng } from '../rules/dice';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant } from './types';

const rangeOf = (spec: ImzaSpec, c: Combatant): number => byLevel(spec.menzilSeviye, c.level) ?? spec.menzilFt ?? 30;

/** Hedef ve altıgen denetimi (hedef listesi geçerli olduktan sonra). */
export function k54Problem(state: BattleState, actor: Combatant, spec: ImzaSpec, _targets: Combatant[], to: Offset | undefined): string | null {
  if (spec.ozel === 'zihinNesne') return mindObjectProblem(state, actor, to, rangeOf(spec, actor), byLevel(spec.agirlikSeviye, actor.level) ?? ['hafif']);
  if (spec.hedefVeHex && !to) return 'Bir altıgen seç.';
  return null;
}

/** Özel eylemin olayları; özel değilse null; geçersizse neden. */
export function k54Special(state: BattleState, actor: Combatant, spec: ImzaSpec, _key: string, targets: Combatant[], to: Offset | undefined, dc: number,
  rng: Rng): BattleEvent[] | string | null {
  if (spec.ozel === 'zihinNesne' && to) return mindObjectEvents(state, actor, to, spec.mesafe ?? 10, rng);
  if (spec.ozel === 'firlat') {
    const t = targets[0];
    if (!t) return 'Hedef yok.';
    const dice = byLevel(spec.hasar?.zar, actor.level) ?? '3d6';
    return hurlEvents(state, actor, t, to, dice, spec.hasar?.tur ?? 'bludgeoning', dc, rng);
  }
  return null;
}
