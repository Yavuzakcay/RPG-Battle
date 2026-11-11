/**
 * Kuyruk K62-ACIK (kural sürümü 67): K62–K67 açık maddeleri. Magic Circle ve Hallow koruma alanının SRD kolları: seçilen
 * tür alana isteyerek (büyüsüz yollarla) giremez, ters Magic Circle'dan çıkamaz; Magic Circle'a ışınlanarak girmek (tersinde
 * çıkmak) önce CHA save ister. Yaprak modül.
 */
import type { BattleState } from './types';

export const K62ACIK_VERSION = 67;
export const k62acikOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= K62ACIK_VERSION;
