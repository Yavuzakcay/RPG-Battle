/**
 * Mekanik matris düzeltmeleri (kural sürümü 83; harita/belgeler/MEKANIK-MATRIS.md). Tek sabit; yaprak modül (yalnız tür bağı).
 * Sonucu değiştiren her matris düzeltmesi bu kapıyla açılır; 82 ve altı (eski kayıt ve replay) aynen.
 * Durum bilmeyen yollar (`saveMode`) için `syncAuras` savaşçıya `srd83` işaretini yazar (K19 `k19Traits` deseni).
 */
import type { BattleState } from './types';

export const MATRIS_VERSION = 83;
export const matrisOn = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= MATRIS_VERSION;
