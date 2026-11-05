/**
 * Kuyruk K50: imza alt sınıf çekirdeği (ağır bağımlılık yok; reducer sonu `syncAuras` buradan okur): kural açık mı
 * ve Taht Varlığı aurası (İmparator; içindeki dostlara WIS kurtulma bonusu). Saf.
 */
import data from '../../data/imza.json';
import { gap } from './body';
import { houseRule, type HouseRuleId } from './houseRules';
import { isIncapacitated } from '../rules/conditions';
import type { Ability } from '../rules/abilities';
import type { BattleState, Combatant } from './types';

interface Pasif { sinif: string; ozellik: string; seviye: number; etki: Record<string, unknown> }
interface AltSinif { id: string; evKurali: string | null }
const SUBS = data.altSiniflar as unknown as AltSinif[];
const PASIF = data.pasifler as unknown as Pasif[];
/** Eski kayıt kimliği (dış paketin "Barış Alanı") → imza kimliği. */
export const imzaId = (id: string | undefined): string | undefined => (id ? (data.eskiKimlik as Record<string, string>)[id] ?? id : undefined);
export const isImza = (id: string | undefined): boolean => !!id && SUBS.some((s) => s.id === imzaId(id));

/** Alt sınıf bu savaşta çalışır mı (sürüm 23+ ve ev kuralı; Birlik Manastırı'nda kural yok). */
export function imzaOn(state: Pick<BattleState, 'houseRules' | 'map' | 'kuralSurumu'>, sinif: string | undefined): boolean {
  const sub = SUBS.find((s) => s.id === imzaId(sinif));
  if (!sub || (state.kuralSurumu ?? 1) < data.surum) return false;
  return sub.evKurali === null || houseRule(state, sub.evKurali as HouseRuleId);
}

/** Seviyeye göre tablo değeri (`{"3": x, "11": y}`). */
export function byLevel<T>(table: Record<string, T> | undefined, level: number): T | undefined {
  return Object.entries(table ?? {}).filter(([l]) => level >= Number(l)).sort((a, b) => Number(b[0]) - Number(a[0]))[0]?.[1];
}
export const imzaPasifler = (c: Combatant): Pasif[] => PASIF.filter((p) => p.sinif === c.imza && c.level >= p.seviye);

/** Taht Varlığı: auranın içindeki dostlara WIS kurtulma bonusu (sahibinin seviyesine göre). */
export function imzaAuraBonus(state: BattleState, c: Combatant, ability: Ability | undefined): number {
  if (!ability) return 0;
  let best = 0;
  for (const o of Object.values(state.combatants)) {
    if (o.side !== c.side || !o.imza || o.hp <= 0 || isIncapacitated(o.conditions) || !imzaOn(state, o.imza)) continue;
    for (const p of imzaPasifler(o)) {
      const a = p.etki.aura as { yaricapFt: Record<string, number>; save: Record<string, number>; yetenekler: string[] } | undefined;
      if (!a || !a.yetenekler.includes(ability)) continue;
      const ft = byLevel(a.yaricapFt, o.level) ?? 0;
      if (state.map && o.pos && c.pos && gap(state, o, c) * 5 > ft) continue;
      best = Math.max(best, byLevel(a.save, o.level) ?? 0);
    }
  }
  return best;
}
