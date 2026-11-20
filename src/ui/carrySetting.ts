/** Taşıma yükü kuralı ayarı (Görev K5): Kapalı / SRD sınırı (varsayılan) / Kademeli; bu cihazda hatırlanır. */
import { CARRY_RULES, DEFAULT_CARRY_RULE, type CarryRule } from '../rules/carry';

import { roomOverlay } from '../oda/active';

const KEY = 'rpg-battle-tasima';

export function storedCarryRule(): CarryRule {
  const o = roomOverlay()?.tasima as CarryRule | undefined;
  if (o && CARRY_RULES.includes(o)) return o;
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
