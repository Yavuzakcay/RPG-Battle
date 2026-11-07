/**
 * Kuyruk P12: kural sürümü kapısının TEK sabiti (bağımlılıksız; çekirdek modüller de buradan okur). G6 ile aynı sürümü
 * alırsa birleştirmede yalnız bu satır ve `data/kural-surumu.json` `surum` bir artırılır (DECISIONS.md).
 */
import { ruleVersion } from '../ruleVersion';
import type { BattleState } from '../types';

export const P12_VERSION = 43;
export const p12On = (state: Pick<BattleState, 'kuralSurumu'>): boolean => ruleVersion(state) >= P12_VERSION;
