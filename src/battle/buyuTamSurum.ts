/**
 * Gece kuyruğu Aşama 3 (kural sürümü 102, Görev BUYU-TAM): SRD 5.2.1 büyü tam taraması düzeltmeleri. Büyü verisinde `b102`
 * bloğu (mekaniğin üstüne yazılır; `spellVersion.ts` `mechanicsAt`, `spells.ts` `LATER`); ayrıntı
 * `harita/belgeler/BUYU-TAM-TARAMA.md`, DECISIONS.md "BUYU-TAM". Tek sabit; yaprak modül. 101 ve altı aynen.
 */
import type { BattleState } from './types';

export const BUYU_TAM_VERSION = 102;
export const buyuTamOn = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= BUYU_TAM_VERSION;
