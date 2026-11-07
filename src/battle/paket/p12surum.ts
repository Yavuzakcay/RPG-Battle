/**
 * Kuyruk P12: kural sürümü kapısının TEK sabiti (bağımlılıksız; çekirdek modüller de buradan okur). P12 sürümü 45: G6 = 43
 * ve K61 = 44 kapıları ayrı (Kuyruk BP birleştirmesi, DECISIONS.md).
 */
import { ruleVersion } from '../ruleVersion';
import type { BattleState } from '../types';

export const P12_VERSION = 45;
export const p12On = (state: Pick<BattleState, 'kuralSurumu'>): boolean => ruleVersion(state) >= P12_VERSION;
