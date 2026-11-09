/** Kuyruk K73e (kural sürümü 65): YZ kazma ve dalış kararı (yalnız yapay zekâ; kural motoru 64 ile aynı). Yaprak modül. */
import type { BattleState } from './types';

export const K73E_VERSION = 65;
export const k73eOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= K73E_VERSION;
