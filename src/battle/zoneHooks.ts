/**
 * Alanların tur başı çekme kancaları (Control Water girdabı, `girdap.ts` kaydeder; `zones.ts` `zoneTurnEvents` çağırır). Yaprak
 * modül (yalnız tür içe aktarır): döngüsel içe aktarmada kayıt, `zones.ts` ilklenmeden de güvenle çalışır. Saf.
 */
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant } from './types';

export type StartPull = (state: BattleState, c: Combatant, rng: Rng) => BattleEvent[];
export const START_PULL: StartPull[] = [];
export const registerZoneStartPull = (h: StartPull): void => { START_PULL.push(h); };
