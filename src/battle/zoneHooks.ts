/**
 * Alan kancalarının kayıt defteri (yaprak modül: yalnız tür içe aktarır). Kayıt, modül değerlendirilirken çağrılır
 * (`girdap.ts`: `registerZoneStartPull(...)`); defter `zones.ts`'te dururken döngüsel içe aktarmada (zones → … → spells →
 * girdap → zones) zones.ts henüz değerlendirilmemişse kayıt işlevi tanımsızdı (K71d modül başlatma testi; DECISIONS.md).
 */
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant } from './types';

/** Tur başı çekme kancası (Control Water girdabı `girdap.ts`). */
export type StartPull = (state: BattleState, c: Combatant, rng: Rng) => BattleEvent[];
const START_PULL: StartPull[] = [];
export function registerZoneStartPull(h: StartPull): void { START_PULL.push(h); }
export const zoneStartPulls = (): readonly StartPull[] => START_PULL;
