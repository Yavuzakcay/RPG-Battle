/** Taşıma yükü kuralı ayarı (Görev K5): Kapalı / SRD sınırı (varsayılan) / Kademeli; bu cihazda hatırlanır. */
import { CARRY_RULES, DEFAULT_CARRY_RULE, type CarryRule } from '../rules/carry';

const KEY = 'rpg-battle-tasima';

export function storedCarryRule(): CarryRule {
  try {
    const v = localStorage.getItem(KEY) as CarryRule | null;
    return v && CARRY_RULES.includes(v) ? v : DEFAULT_CARRY_RULE;
  } catch {
    return DEFAULT_CARRY_RULE;
  }
}

export function saveCarryRule(rule: CarryRule): void {
  try { localStorage.setItem(KEY, rule); } catch { /* yalnızca bu oturumda */ }
}
