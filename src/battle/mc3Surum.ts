/**
 * Görev MC3 (kural sürümü 105; SRD 5.2.1 s. 25–26): çoklu sınıflı oyuncu savaşçısı. Tek sabit; yaprak modül.
 * - Ortak Spellcasting yuvası ve ayrı Pact Magic havuzu (`Combatant.pactSlots`, `cast_spell.pact`, `slot_spent.pact`).
 * - Hazırlanan büyünün sınıfı ve sınıf başına büyü DC'si/saldırısı (`spellByClass`, `spellClassOf`).
 * Kural sürümü 104 KARAR104'ün (DECISIONS.md MC2, MC3-BIRLESTIR); savaş kaydı 27 (26 KARAR104). 104 ve altında çoklu sınıflı sayfa savaşa eski davranışla girer
 * (ilk sınıf + toplam seviye; MC öncesiyle aynı), eski kayıt ve replay aynen.
 */
import type { BattleState } from './types';

export const MC3_VERSION = 105;
export const mc3On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= MC3_VERSION;
