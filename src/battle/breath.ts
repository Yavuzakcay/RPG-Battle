/**
 * Kuyruk A7 (Dragon's Breath): büyüyle verilen nefes. Süren etkide `breath` (BreathSpec; DC büyücününki, kaynak yok)
 * taşıyan yaratık Magic eylemiyle (ekonomi: eylem) 15 ft koni nefes verir. Kendi nefesi (Dragonborn) kullanım kalmışsa
 * önce o. Saf.
 */
import type { BreathSpec, Combatant } from './types';

export const spellBreathOf = (c: Pick<Combatant, 'effects'>): BreathSpec | undefined => c.effects?.find((e) => e.breath)?.breath;

/** Kullanılacak nefes ve büyüden mi geldiği. */
export function breathOf(c: Pick<Combatant, 'breath' | 'resources' | 'effects'>): { spec: BreathSpec; spell: boolean } | null {
  if (c.breath && (c.resources[c.breath.resource] ?? 0) > 0) return { spec: c.breath, spell: false };
  const s = spellBreathOf(c);
  if (s) return { spec: s, spell: true };
  return c.breath ? { spec: c.breath, spell: false } : null;
}
