/**
 * Görev D1 (kural sürümü 86): SRD 5.2.1 veri düzeltmeleri (harita/belgeler/SRD-VERI-DOGRULAMA.md). Tek sabit; yaprak modül.
 * Veri dosyaları SRD değerlerini tutar; 85 ve altı (eski kayıt, replay, `--kural-surumu 85` simülasyonu) eski değerleri
 * `data/srd-duzeltme.json` katmanından okur (`src/battle/srdD1.ts`).
 */
import type { BattleState } from './types';

export const SRD_D1_VERSION = 86;
export const srdD1On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= SRD_D1_VERSION;
