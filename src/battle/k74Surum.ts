/**
 * Kuyruk K74 (kural sürümü 75): (a) Truesight'ı bilmeyen beş motor yolu tek sorguya bağlandı (`sight.ts` `hiddenFrom`:
 * fırsat saldırısı görme, hareket algısı, Cleave, mastery ikinci hedef, ejderha Algısı); (b) Hallow (ve Magic Circle)
 * koruma alanı tek koruma gibi davranır: seçilen türden gelen yeni Charmed/Frightened alanda hiç tutmaz (zamanlı durum
 * yolu dahil; eskiden önce tutup sonra bastırılırdı ve alandan çıkınca geri gelirdi). Sürüm 76: `sinkMud` gerçek bedeli.
 * Sürüm 74 ve altında eski davranış (replay uyumu). Tek sabit; yaprak modül.
 */
import type { BattleState } from './types';

export const K74_VERSION = 75;
export const k74On = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= K74_VERSION;

export const K74_SINKMUD_VERSION = 76;
export const k74SinkMudOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= K74_SINKMUD_VERSION;
