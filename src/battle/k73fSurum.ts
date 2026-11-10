/**
 * Kuyruk K73f (kural sürümü 66): su ve atlama kalanları: batık/yer altındaki atlamada varış hücresi denetimi, yüzme hızı
 * olan 17 canavarın yüzücü listesine eklenmesi, YZ yer altında uzaklaşma. Yaprak modül.
 */
import type { BattleState } from './types';

export const K73F_VERSION = 66;
export const k73fOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= K73F_VERSION;
