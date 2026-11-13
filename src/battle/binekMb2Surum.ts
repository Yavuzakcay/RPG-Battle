/**
 * Kuyruk MB2 (kural sürümü 74; `harita/belgeler/BINEK-PLAN.md` §17, kararlar B2, B4-A, B5, B7): kontrollü binek turu. Binek
 * kontrollüyse kendi turu yoktur, binicinin turunda ve binicinin kararıyla hareket eder; yalnız Dash, Disengage ve Dodge yapar.
 * Sürüm 73 ve altında bütün binekler bağımsız (eski davranış). Tek sabit; yaprak modül.
 */
import type { BattleState } from './types';

export const BINEK_MB2_VERSION = 74;
export const binekMb2On = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= BINEK_MB2_VERSION;
