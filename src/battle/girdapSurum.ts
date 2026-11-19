/**
 * Control Water girdabı (kural sürümü 84; Game Master anahtarı `controlWaterWhirlpool`, `data/kural-kontrol.json`). Tek sabit;
 * yaprak modül. Anahtar kapalıyken ya da 83 ve altında (eski kayıt, replay) Control Water eskisi gibi (`spellsK19` su girdabı).
 */
import { globalRule } from './ruleControl';
import type { BattleState } from './types';

export const GIRDAP_VERSION = 84;
/** Girdap savaşta açık mı (sürüm ≥ 84 ve anahtar açık; `globalRule` anahtarın `surum`'una da bakar). */
export const girdapOn = (s: Pick<BattleState, 'kuralSurumu' | 'map'>): boolean =>
  (s.kuralSurumu ?? 1) >= GIRDAP_VERSION && !!globalRule(s, 'controlWaterWhirlpool');
