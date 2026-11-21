/**
 * Gece kuyruğu Aşama 2 (kural sürümü 101): KALAN100'den "karar gerekli / doğrulanmadı" kalanların SRD 5.2.1'e göre
 * kapatılması (DECISIONS.md "KARAR101"). Tek sabit; yaprak modül.
 * - Sürünme + zorlu arazi: ft başına toplam 3 ft (s. 179 Crawling "1 extra foot (2 extra feet in Difficult Terrain)").
 * - Knocking Out (s. 17, s. 186): yakın dövüşle 0 HP'ye düşüren saldıran 1 HP + Unconscious seçebilir (oyuncu istemi).
 * - Dash ve çoklu hız (s. 188 Speed, s. 180 Dash): Dash'in ek hareketi Dash anındaki hızdan sabitlenir.
 * - nightVision (gece görüşü) yeni savaşta varsayılan açık (`data/kural-kontrol.json` `acikSurum`).
 * - Yakalama tutarken Two-Handed silahla saldırı yok, Versatile tek elle; yakalamayı bırakma komutu (s. 182).
 * - High Jump koşusu "immediately before": araya başka iş girerse koşu sayılmaz (s. 183).
 * - Stone's Endurance her hasarda tepki (s. 85).
 * - Kalkan tak/çıkar Utilize eylemiyle (s. 92).
 * 100 ve altı (eski kayıt, replay) aynen.
 */
import type { BattleState, Combatant } from './types';

export const KARAR101_VERSION = 101;
export const karar101On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= KARAR101_VERSION;

/** Yürüme hızının Dash'li bütçesi (altıgen; binme/inme): 100- hız × (1 + Dash), 101+ hız + Dash eki (`economy.dashFt`). */
export function walkBudgetHexes(c: Pick<Combatant, 'speed' | 'economy'>): number {
  return c.economy.dashFt !== undefined ? Math.floor(c.speed / 5) + Math.floor(c.economy.dashFt / 5) : Math.floor(c.speed / 5) * (1 + c.economy.dashes);
}
