/**
 * Görev GENEL96 (kural sürümü 96): genel savaş kuralları denetiminin (harita/belgeler/GENEL-SAVAS-DENETIM.md) sürümlü
 * düzeltmeleri, SRD 5.2.1'e hizalama. Tek sabit; yaprak modül. 95 ve altı (eski kayıt, replay) eski davranışta.
 * Ayrıntı ve SRD sayfa referansları DECISIONS.md "GENEL96" ve denetim belgesinde.
 */
import type { BattleState } from './types';

export const GENEL96_VERSION = 96;
export const genel96On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= GENEL96_VERSION;
