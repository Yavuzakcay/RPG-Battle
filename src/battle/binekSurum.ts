/**
 * Kuyruk MB1 (kural sürümü 68; `harita/belgeler/BINEK-PLAN.md`, karar B19): binek çekirdek SRD kuralları. Binek
 * alt kuyruklarının sürüm numarası yalnız burada (birleştirmede çakışırsa tek yer değişir). Yaprak modül.
 */
import type { BattleState } from './types';

export const BINEK_VERSION = 68;
export const binekOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= BINEK_VERSION;
