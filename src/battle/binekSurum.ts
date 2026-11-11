/**
 * Kuyruk MB1 (kural sürümü 68; `harita/belgeler/BINEK-PLAN.md`, karar B19): binek çekirdek SRD kuralları. Binek
 * alt kuyruklarının sürüm numarası yalnız burada (birleştirmede çakışırsa tek yer değişir). Yaprak modül.
 */
import type { BattleState } from './types';

export const BINEK_VERSION = 68;
export const binekOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= BINEK_VERSION;

/**
 * Kuyruk MB3 (kural sürümü 69; `BINEK-PLAN.md` §12): binek dikey kuralları: iki ayrı düşme (B12), yürüyüş/uçuş/kat/kafes ve
 * ışınlanmada yığın boyu (B11), dikey hareket ve dalışta binicinin hücresi, binicili tırmanma (B14), havada binme/inme,
 * binicinin bandı = bineğin bandı (B6), kazma girişlerinin hepsi (B13).
 */
export const BINEK_MB3_VERSION = 69;
export const binekMb3On = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= BINEK_MB3_VERSION;
