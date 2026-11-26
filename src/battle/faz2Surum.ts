/**
 * Görev KATALOG-F0 (kural sürümü 107): yarı can fazı (Faz 2). Mekanik donmasına bilinçli istisna (kullanıcı, 2026-11-26;
 * DECISIONS.md). Canavar kaydında `faz2` bloğu olan yaratık can eşiğin altına inince komut sonunda bir kez `phase_changed`.
 * Tek sabit; yaprak modül. 106 ve altı (eski kayıt, replay) aynen: blok kopyalanmaz, kanca çalışmaz.
 */
import type { BattleState } from './types';

export const FAZ2_VERSION = 107;
export const faz2On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= FAZ2_VERSION;
