/**
 * Kuyruk K73c (kural sürümü 64+): sürüm kapısı. Yaprak modül (yalnız tür içe aktarır): dikey, gövde ve bitişiklik modülleri
 * buradan okur (döngü yok).
 */
import type { BattleState } from './types';

export const K73C_VERSION = 64;
export const k73cOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= K73C_VERSION;
