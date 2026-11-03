/**
 * Kuyruk 19: Death Ward (SRD 5.2.1): hasarsız anında ölüm (6. Exhaustion seviyesi) etkisi hedefte boşa çıkar ve büyü biter.
 * 0 HP'ye düşme yolu `damage-effects.ts`'te. Anahtar `spellsK19` (kural sürümü 16).
 */
import { globalRule } from './ruleControl';
import type { BattleEvent, BattleState, Combatant } from './types';

/** Exhaustion artışı olayı; 6'ya çıkacak ve Death Ward varsa artış yerine büyünün bitişi. */
export function exhaustionGain(state: BattleState, c: Combatant, level: number, reason: string): BattleEvent[] {
  const ward = level >= 6 ? (c.effects ?? []).find((e) => e.deathWard) : undefined;
  if (ward && globalRule(state, 'spellsK19')) {
    return [{ type: 'map_note', text: `${c.name}: Death Ward ölümcül bitkinliği boşa çıkardı, büyü bitti.` }, { type: 'effect_ended', targetId: c.id, effectId: ward.id, name: ward.name ?? 'Death Ward', reason: 'used' }];
  }
  return [{ type: 'exhaustion_changed', targetId: c.id, level, reason }];
}
