/**
 * Taşıma kapasitesi (Görev K5; SRD 5.2.1 "Carrying Capacity": Güç × 15 lb). Yük: giyilen zırh + kalkan + seçili silahlar
 * + eşyalar (paralar sayılmaz). Kural ayarı: kapalı, SRD sınırı (varsayılan; aşan karakter oluşturucuda eksik) ya da
 * kademeli (2014 SRD'nin isteğe bağlı kuralı: Güç × 5 üstü "Yüklü" hız −10 ft, Güç × 10 üstü "Ağır yüklü" hız −20 ft ve
 * STR/DEX/CON d20 testlerinde ve saldırılarda dezavantaj). Değerler `data/tasima.json`. Saf.
 * Görev Z2: boyut çarpanı (SRD tablosu; Small/Medium ×1, Large ×2…) ve "taşıma kapasitesinde bir boy büyük sayılır" tür
 * özellikleri (Goliath Powerful Build: Medium → Large, ×2). Sürükleme/kaldırma/itme sınırı taşımanın iki katı.
 */
import { armor, getRace, items, weapons } from '../data';
import carry from '../../data/tasima.json';
import { finalScores, type CharacterSheet } from './stats';

export type CarryRule = 'off' | 'srd' | 'tiered';
export const CARRY_RULES: CarryRule[] = ['off', 'srd', 'tiered'];
export const DEFAULT_CARRY_RULE: CarryRule = 'srd';
export type LoadLevel = 'ok' | 'encumbered' | 'heavy' | 'over';

/** Taşınan toplam ağırlık (lb). Bilinmeyen ad 0 sayılır (oluşturucu ayrıca uyarır). */
export function carriedWeight(sheet: Pick<CharacterSheet, 'armorName' | 'shield' | 'weapons' | 'itemNames'>): number {
  const ar = armor.find((a) => a.name === sheet.armorName)?.weight ?? 0;
  const sh = sheet.shield ? carry.shieldLb : 0;
  const ws = (sheet.weapons ?? []).reduce((n, w) => n + (weapons.find((x) => x.name === w.name)?.weight ?? 0), 0);
  const it = sheet.itemNames.reduce((n, name) => n + (items.find((x) => x.name === name)?.weight ?? 0), 0);
  return Math.round((ar + sh + ws + it) * 100) / 100;
}

export interface CarryLoad { weight: number; capacity: number; encumberedAt: number; heavyAt: number; level: LoadLevel; dragLimit: number; sizeMult: number }

/**
 * Taşıma kapasitesindeki boyut çarpanı: türün boyutu (ilk seçenek; Small ve Medium aynı), "bir boy büyük" özelliği varsa
 * bir üst boyut (`data/tasima.json` `sizeUp`, SRD tür özelliği kimliğiyle).
 */
export function carrySizeMult(raceId: string | undefined): number {
  let size = 'M';
  try { size = (raceId && getRace(raceId)?.sizes?.[0]) || 'M'; } catch { /* bilinmeyen tür: Orta */ }
  const order = carry.sizeOrder;
  let i = Math.max(0, order.indexOf(size));
  if (raceId && (carry.sizeUp as Record<string, string>)[raceId]) i = Math.min(order.length - 1, i + 1);
  return (carry.sizeCarry as Record<string, number>)[order[i]!] ?? 1;
}

/** Yük ve eşikler; `level` kurala göre (kapalıda hep `ok`; SRD'de yalnızca `over`; kademelide üçü ve `over`). */
export function carryLoad(sheet: CharacterSheet, rule: CarryRule): CarryLoad {
  let str = 10;
  try { str = finalScores(sheet).str; } catch { /* geçersiz geçmiş bonusu: varsayılan */ }
  const weight = carriedWeight(sheet);
  const sizeMult = carrySizeMult(sheet.raceId);
  const capacity = str * carry.capacityPerStr * sizeMult;
  const encumberedAt = str * carry.encumberedPerStr * sizeMult;
  const heavyAt = str * carry.heavyPerStr * sizeMult;
  const dragLimit = str * carry.dragPerStr * sizeMult;
  const level: LoadLevel = rule === 'off' ? 'ok'
    : weight > capacity ? 'over'
      : rule === 'tiered' && weight > heavyAt ? 'heavy'
        : rule === 'tiered' && weight > encumberedAt ? 'encumbered' : 'ok';
  return { weight, capacity, encumberedAt, heavyAt, level, dragLimit, sizeMult };
}

/** Kademeli yükün savaştaki hız cezası (ft). Kapasiteyi aşan ağır yüklü sayılır. */
export function carrySpeedPenalty(level: LoadLevel, rule: CarryRule): number {
  if (rule !== 'tiered') return 0;
  return level === 'encumbered' ? carry.encumberedSpeedFt : level === 'heavy' || level === 'over' ? carry.heavySpeedFt : 0;
}

/** Kademeli kuralda ağır yüklü (dezavantajlı) mı. */
export const heavilyLoaded = (level: LoadLevel, rule: CarryRule): boolean => rule === 'tiered' && (level === 'heavy' || level === 'over');
