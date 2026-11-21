/**
 * Gece kuyruğu Aşama 4 (kural sürümü 103, Görev KAPSAM103): canavar verisi SRD stat bloğu uyumu ve sınıf açıkları
 * (DECISIONS.md "KAPSAM103"). Tek sabit; yaprak modül.
 * - Canavar inisiyatifi stat bloğundaki "Initiative +X" (`data/monsters.json` `initiative`; özel canavarda DEX).
 * - Eksik yetenekler: Cloud Giant Misty Step, Gold Dragon Weakening Breath, Sphinx Weight of Years (efsanevi eylem).
 * 102 ve altı (eski kayıt, replay) aynen.
 */
import type { BattleState } from './types';

export const KAPSAM103_VERSION = 103;
export const kapsam103On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= KAPSAM103_VERSION;
