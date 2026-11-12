/**
 * Kuyruk MB5 (kural sürümü 73; `harita/belgeler/BINEK-PLAN.md` §16): yapay zekâ binicisi ve büyük bineğin dar geçitlerden
 * kaçınması. Yalnız yapay zekâ kararı (yeni komut ya da olay yok); kural ve denge aynı. Sürüm 72 ve altında eski karar.
 * Parametreler `data/yapay-zeka.json` `binekMb5`. Yaprak modül.
 */
import type { BattleState } from './types';

export const BINEK_MB5_VERSION = 73;
export const binekMb5On = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= BINEK_MB5_VERSION;
