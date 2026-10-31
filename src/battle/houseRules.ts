/**
 * Görev K13B: ev kuralları (SRD 5.2.1 dışı). Her kural `data/ev-kurallari.json`'da ayrı bayrak; Game Master kurulumda
 * açıp kapatır (`BattleState.houseRules`). Bayrak verilmezse veri varsayılanı; `sefer: true` olanlar yalnızca haritanın
 * sefer bayrağıyla (`map.seferKurallari`) açılır. Saf.
 */
import data from '../../data/ev-kurallari.json';
import type { BattleState } from './types';

export interface HouseRuleDef { default: boolean; sefer?: boolean; tr: string; en: string }
export const HOUSE_RULES = data.rules as Record<string, HouseRuleDef>;
export type HouseRuleId = keyof typeof data.rules;
export const HOUSE_RULE_IDS = Object.keys(HOUSE_RULES) as HouseRuleId[];

/** Bayrağın bu savaşta etkin değeri (Game Master seçimi > haritanın sefer bayrağı > veri varsayılanı). */
export function houseRule(state: Pick<BattleState, 'houseRules' | 'map'>, id: HouseRuleId): boolean {
  const set = state.houseRules?.[id];
  if (set !== undefined) return set;
  const def = HOUSE_RULES[id];
  if (!def) return false;
  if (def.sefer) return !!state.map?.seferKurallari?.includes(id);
  return def.default;
}

/** Bir haritanın (sefer bayrağıyla) varsayılan değerleri: kurulum listesinin başlangıcı. */
export function houseRuleDefaults(seferKurallari: string[] = []): Record<HouseRuleId, boolean> {
  return Object.fromEntries(HOUSE_RULE_IDS.map((id) => [id, HOUSE_RULES[id]?.sefer ? seferKurallari.includes(id) : !!HOUSE_RULES[id]?.default])) as Record<HouseRuleId, boolean>;
}
