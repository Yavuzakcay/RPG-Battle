/**
 * Görev B95-B (kural sürümü 97): Barbarian, Fighter, Monk, Rogue denetim düzeltmeleri (harita/belgeler/{BARBARIAN,
 * FIGHTER,MONK,ROGUE}-DENETIM.md "Görev B95"), SRD 5.2.1'e hizalama; alt sınıflarda bizim sürüm. Tek sabit; yaprak modül.
 * 96 ve altı (eski kayıt, replay) eski davranışta. Ayrıntı ve SRD sayfa referansları DECISIONS.md "B95".
 */
import type { BattleState } from './types';

export const SINIF97_VERSION = 97;
export const sinif97On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= SINIF97_VERSION;
