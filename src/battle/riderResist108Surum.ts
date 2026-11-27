/**
 * Görev KATALOG-ON-HAZIRLIK (kural sürümü 108): canavar saldırısının ek hasarı (`riderExtras`: rider `extra`/`conditional`/hücum)
 * hedefin direncini kurtarmalı hasarla aynı tek yoldan okur (`profileIn(state, hedef, false, saldıran)`: kalıcı direnç + süren
 * etkiden gelen direnç (Protection from Energy, Absorb Elements, paket `direnc`…), aura direnci, Petrified, Mind Blank bağışıklığı,
 * Silence). 107 ve altı (eski kayıt, replay): yalnız kalıcı `resistances/immunities/vulnerabilities` (eski davranış).
 * Tek sabit; yaprak modül. Tanı: harita/belgeler/DENGE.md "Tanı: çok zor üç boss…".
 */
import type { BattleState } from './types';

export const RIDER_RESIST_VERSION = 108;
export const riderResist108On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= RIDER_RESIST_VERSION;
