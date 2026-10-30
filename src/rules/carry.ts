/**
 * Taşıma kapasitesi (Görev K5; SRD 5.2.1 "Carrying Capacity": Güç × 15 lb). Yük: giyilen zırh + kalkan + seçili silahlar
 * + eşyalar (paralar sayılmaz). Kural ayarı: kapalı, SRD sınırı (varsayılan; aşan karakter oluşturucuda eksik) ya da
 * kademeli (2014 SRD'nin isteğe bağlı kuralı: Güç × 5 üstü "Yüklü" hız −10 ft, Güç × 10 üstü "Ağır yüklü" hız −20 ft ve
 * STR/DEX/CON d20 testlerinde ve saldırılarda dezavantaj). Değerler `data/tasima.json`. Saf.
 */
import { armor, items, weapons } from '../data';
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

export interface CarryLoad { weight: number; capacity: number; encumberedAt: number; heavyAt: number; level: LoadLevel }

/** Yük ve eşikler; `level` kurala göre (kapalıda hep `ok`; SRD'de yalnızca `over`; kademelide üçü ve `over`). */
export function carryLoad(sheet: CharacterSheet, rule: CarryRule): CarryLoad {
  let str = 10;
  try { str = finalScores(sheet).str; } catch { /* geçersiz geçmiş bonusu: varsayılan */ }
  const weight = carriedWeight(sheet);
  const capacity = str * carry.capacityPerStr;
  const encumberedAt = str * carry.encumberedPerStr;
  const heavyAt = str * carry.heavyPerStr;
  const level: LoadLevel = rule === 'off' ? 'ok'
    : weight > capacity ? 'over'
      : rule === 'tiered' && weight > heavyAt ? 'heavy'
        : rule === 'tiered' && weight > encumberedAt ? 'encumbered' : 'ok';
  return { weight, capacity, encumberedAt, heavyAt, level };
}

/** Kademeli yükün savaştaki hız cezası (ft). Kapasiteyi aşan ağır yüklü sayılır. */
export function carrySpeedPenalty(level: LoadLevel, rule: CarryRule): number {
  if (rule !== 'tiered') return 0;
  return level === 'encumbered' ? carry.encumberedSpeedFt : level === 'heavy' || level === 'over' ? carry.heavySpeedFt : 0;
}

/** Kademeli kuralda ağır yüklü (dezavantajlı) mı. */
export const heavilyLoaded = (level: LoadLevel, rule: CarryRule): boolean => rule === 'tiered' && (level === 'heavy' || level === 'over');
