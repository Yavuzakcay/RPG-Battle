/**
 * Görev KATALOG-GUC-TAM (kural sürümü 109): KATALOG-SIGMAYAN.md'de "sığmayan" ve "yaklaşık" yazılan katalog güçleri motorda.
 * Mekanik donmasına bilinçli istisna (kullanıcı, 2026-11-28; DECISIONS.md). Veri `data/katalog-gucler.json` (canavar kimliğine
 * göre), modül `katalog109.ts`. Tek sabit; yaprak modül. 108 ve altı (eski kayıt, replay) aynen: veri okunmaz.
 */
import type { BattleState } from './types';

export const KATALOG109_VERSION = 109;
export const katalog109On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= KATALOG109_VERSION;
