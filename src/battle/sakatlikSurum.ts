/**
 * Görev SAKATLIK-S1 (kural sürümü 111; kullanıcı kararı 2026-11-28, mekanik donmasına bilinçli istisna): kalıcı yaralanma
 * ev kuralı (`sakatlik`; `data/ev-kurallari.json`). Tek sabit; yaprak modül. 110 ve altı (eski kayıt, replay): sakatlık yok.
 * Kurallar ve tablo `harita/belgeler/SAKATLIK.md`, veri `data/sakatlik.json`, motor `src/battle/sakatlik.ts`.
 */
import type { BattleState } from './types';

export const SAKATLIK_VERSION = 111;
export const sakatlikSurumOn = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= SAKATLIK_VERSION;
