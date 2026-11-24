/**
 * Görev KARAR104 (kural sürümü 104): bekleyen kullanıcı kararlarının SRD 5.2.1'e göre kapatılması (DECISIONS.md "KARAR104").
 * Tek sabit; yaprak modül.
 * - A1 Storm of Vengeance 2–10. tur aşamaları (`zone.stages`, `stormStage.ts`).
 * - A3 boğulma (`noBreath`), A4 likantrop laneti işareti, A2 yapışma, A10 eşya ↔ silah bağı, A5 otomatik seçimlerin "Sor"a bağlanması.
 * 103 ve altı (eski kayıt, replay) aynen.
 */
import type { BattleState } from './types';

export const KARAR104_VERSION = 104;
export const karar104On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= KARAR104_VERSION;
