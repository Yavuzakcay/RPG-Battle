/**
 * Hazırla (Ready) eylemi (kural sürümü 90; SRD 5.2.1 s.186–187): tek sabit, yaprak modül. 89 ve altı (eski kayıt, replay)
 * aynen: `ready` komutu reddedilir, kancalar hiçbir şey yapmaz.
 */
import type { BattleState } from './types';

export const READY_VERSION = 90;
export const readyOn = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= READY_VERSION;
