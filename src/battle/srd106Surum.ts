/**
 * Görev SRD-TAMAMLAMA-1 (kural sürümü 106): SRD 5.2.1 uyumunun küçük kalanları (DECISIONS.md "SRD-TAMAMLAMA-1"). Tek sabit; yaprak modül.
 * - Preserve Life (s. 38): Bloodied yaratıklar (taraf fark etmez; öneri yine dostlar) ve yaratık başına iyileştirme miktarı sorulur
 *   (`cleric.ts`; öneri eski otomatik dağıtım).
 * - Land's Aid (s. 46): iyileşen yaratık aynı eylemde hasar aldıysa iyileşme hasardan sonraki candan (`druid.ts`).
 * - Elixir of Health / Potion of Vitality (s. 220, 236): eşya yolunda durum temizleme (`cureOnCast`) ve Potion of Vitality'nin
 *   bütün Exhaustion seviyelerini kaldırması (`use.cureExhaustion`; `items.ts`).
 * 105 ve altı (eski kayıt, replay) aynen.
 */
import type { BattleState } from './types';

export const SRD106_VERSION = 106;
export const srd106On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= SRD106_VERSION;
