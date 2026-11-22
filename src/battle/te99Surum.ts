/**
 * Görev TE99 (kural sürümü 99): tür, feat ve eşya denetimi düzeltmeleri (SRD 5.2.1; harita/belgeler/TUR-FEAT-ESYA-DENETIM.md
 * "Düzeltme durumu"). Tek sabit; yaprak modül.
 * - Tür kaynakları (Relentless Endurance, Adrenaline Rush, Heroic Inspiration, Stonecunning, Draconic Flight, Large Form)
 *   savaş başında yeniden dolmaz: kayıtlı durumdaki değer kalır, dinlenme kuralı veride (`data/class-features.json`).
 * - Tür save avantajları (Dwarven Resilience, Fey Ancestry, Brave) bütün save yollarında (tek `saveMode` bağlamından).
 * - Kalkan + Two-Handed silah saldırısı yok; Mage Armor/Armor of Shadows tabanı kalkan ve eşya bonusunu yutmaz;
 *   eğitimsiz zırh inisiyatif ve Gizlen'de dezavantaj, saldırıda yalnız STR/DEX.
 * - Feat/eşya/silah hizalamaları (Savage Attacker, Blink Steps, Irresistible Offense, eşya bağları, iksirler, Nick, Loading,
 *   Push, doğaçlama silah, Alchemist's Fire, Thieves' Tools, Peerless Aim/Improve Fate/Heroic Inspiration kararı).
 * 98 ve altı (eski kayıt, replay) aynen. Ayrıntı DECISIONS.md "TE99".
 */
import type { BattleState } from './types';

export const TE99_VERSION = 99;
export const te99On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= TE99_VERSION;

/**
 * Görev TE99 (sürüm 99+, `te99` savaşçı işareti; SRD 5.2.1 s. 84–86 "Advantage on saving throws you make to avoid or end
 * the … condition"): save'in karşı koyduğu durumlar `resolveSave`'e de gider; böylece süren etkinin `saveAdvAgainst`'ı
 * (Dwarven Resilience, Fey Ancestry, Brave, Antitoxin) bütün save yollarında işler (tek çözücü: `effectDice` ikinci şansı).
 * 98 ve altında boş (eski davranış: yalnız büyü save'leri).
 */
export const saveVs = (t: { te99?: true } | undefined, conditions: ReadonlyArray<string | undefined>): { against?: string[] } => {
  if (!t?.te99) return {};
  const list = [...new Set(conditions.filter((c): c is string => !!c))];
  return list.length ? { against: list } : {};
};
