/**
 * Görev B94 (kural sürümü 94): Bard, Druid, Paladin ve Ranger denetim düzeltmeleri (SRD 5.2.1; alt sınıflarda bizim
 * sürümümüz). Tek sabit; yaprak modül. Ayrıntı `harita/belgeler/{BARD,DRUID,PALADIN,RANGER}-DENETIM.md` ("B94"
 * satırları) ve DECISIONS.md. 93 ve altı (eski kayıt, replay) aynen.
 */
import type { BattleState } from './types';

export const B94_VERSION = 94;
export const b94On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= B94_VERSION;

/** Görev B94 (Horde Breaker): saldırı etiketinin silah kökü ("Javelin (fırlatma)" → "Javelin"). */
export const weaponBase = (label: string): string => label.replace(/\s*\(.*\)\s*$/, '');
