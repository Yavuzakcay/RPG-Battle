/**
 * Görev WS87 (kural sürümü 87): Druid Wild Shape ve Polymorph düzeltmeleri (SRD 5.2.1 s.43 "Rules While Shape-Shifted",
 * s.153 Polymorph). Tek sabit; yaprak modül.
 * - Biçimin yüzme hızı (Game Master anahtarı `bicimYuzme`): biçimdeki yaratık suda biçimin yüzme hızını kullanır, çok derin
 *   suya girer (`swimSpeedAt` D1 verisi).
 * - Seviyede artık alınamayan ya da Beast olmayan seçili biçimler sayılmaz (kayıtta kalır).
 * - Aktarım: Wild Shape'te kurtarma yetkinliği korunur ve stat bloğundaki kurtarma yüksekse o kullanılır; Polymorph'ta
 *   INT/WIS/CHA ve kurtarmalar da biçimin stat bloğundan.
 * 86 ve altı (eski kayıt, replay): eski davranış.
 */
import { globalRule } from './ruleControl';
import type { BattleState } from './types';

export const WS87_VERSION = 87;
export const ws87On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= WS87_VERSION;
/** Biçimin yüzme hızı savaşta açık mı (sürüm ≥ 87 ve anahtar açık). */
export const bicimYuzmeOn = (s: Pick<BattleState, 'kuralSurumu' | 'map'>): boolean => ws87On(s) && !!globalRule(s, 'bicimYuzme');
