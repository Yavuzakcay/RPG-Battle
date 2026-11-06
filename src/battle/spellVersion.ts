/**
 * Kuyruk A6: büyünün savaşın kural sürümündeki mekaniği (A4 `a4` sürüm 32+, A6 `a6` sürüm 35+ alanları üstüne yazılır).
 * Büyü yapımı (`castSpell`) kendi yolundan birleştirir; bu yardımcı yapım dışındaki okumalar içindir (tekrar maliyeti,
 * yapay zekâ, kart notu). Saf.
 */
import { spells } from '../data';
import type { Spell, SpellMechanics } from '../data/types';
import { ruleVersion } from './ruleVersion';
import type { BattleState, Combatant } from './types';

export function mechanicsAt(state: Pick<BattleState, 'kuralSurumu'>, spell: Spell): SpellMechanics {
  let m = spell.mechanics;
  if (m.a4 && ruleVersion(state) >= 32) m = { ...m, ...m.a4, a4: undefined };
  if (m.a6 && ruleVersion(state) >= 35) m = { ...m, ...m.a6, a6: undefined };
  return m;
}

/** Kuyruk A6: sürüm 35+ savaşta büyünün sığmayan parçasının Game Master notu (yoksa null). */
export function sigmayanNote(state: Pick<BattleState, 'kuralSurumu'>, spell: Spell): string | null {
  return ruleVersion(state) >= 35 ? mechanicsAt(state, spell).sigmayan ?? null : null;
}

/**
 * Kuyruk A6 (Produce Flame): konsantrasyonsuz elde tutulan büyü (`held` etkisi). Sürdürülen ("Büyüyü sürdür",
 * `spell_followup`) büyü: büyücünün konsantrasyon büyüsünün tekrarı yoksa elde tutulan büyü.
 */
export function heldFollow(state: Pick<BattleState, 'kuralSurumu'>, actor: Combatant): NonNullable<Combatant['concentration']> | undefined {
  const h = actor.effects?.find((e) => e.held)?.held;
  if (!h) return undefined;
  const conc = spells.find((s) => s.name === actor.concentration?.spell);
  if (conc && mechanicsAt(state, conc).repeat) return undefined;
  return { spell: h.spell, slotLevel: h.slotLevel ?? undefined, turn: '' } as NonNullable<Combatant['concentration']>;
}
