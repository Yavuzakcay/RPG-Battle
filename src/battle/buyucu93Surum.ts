/**
 * Görev B93 (kural sürümü 93): Cleric, Sorcerer, Wizard ve Warlock denetim düzeltmeleri (SRD 5.2.1 uyumu). Tek sabit;
 * yaprak modül. Ayrıntı `harita/belgeler/{CLERIC,SORCERER,WIZARD,WARLOCK}-DENETIM.md` ("B93" satırları) ve DECISIONS.md.
 * - Ortak: Empowered Evocation (+INT) ve Elemental Affinity (+CHA) büyünün tek hasar zarına/ışınına (`oneDieBonus.ts`);
 *   Empowered Spell otomatik isabetli büyüde (Magic Missile) de, büyü başına en çok CHA zar; Divine Strike / Primal Strike
 *   yalnız kendi turunda.
 * - Cleric, Wizard, Warlock, Sorcerer satırları ilgili modüllerde `buyucu93On` ile.
 * 92 ve altı (eski kayıt, replay) aynen.
 */
import type { BattleState } from './types';

export const BUYUCU93_VERSION = 93;
export const buyucu93On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= BUYUCU93_VERSION;
