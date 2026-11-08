/**
 * Kuyruk A6: büyünün savaşın kural sürümündeki mekaniği (A4 `a4` sürüm 32+, A6 `a6` sürüm 35+, … Kuyruk S1 `s1` sürüm 40+ alanları üstüne yazılır).
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
  if (m.a7 && ruleVersion(state) >= 36) m = { ...m, ...m.a7, a7: undefined };
  if (m.a8 && ruleVersion(state) >= 37) m = { ...m, ...m.a8, a8: undefined };
  if (m.s1 && ruleVersion(state) >= 40) m = { ...m, ...m.s1, s1: undefined };
  if (m.s2 && ruleVersion(state) >= 41) m = { ...m, ...m.s2, s2: undefined };
  if (m.g6 && ruleVersion(state) >= 43) m = { ...m, ...m.g6, g6: undefined };
  if (m.k61 && ruleVersion(state) >= 44) m = { ...m, ...m.k61, k61: undefined };
  if (m.k62 && ruleVersion(state) >= 46) m = { ...m, ...m.k62, k62: undefined };
  if (m.k63 && ruleVersion(state) >= 47) m = { ...m, ...m.k63, k63: undefined };
  if (m.k64 && ruleVersion(state) >= 48) m = { ...m, ...m.k64, k64: undefined };
  if (m.k65 && ruleVersion(state) >= 49) m = { ...m, ...m.k65, k65: undefined };
  if (m.k66 && ruleVersion(state) >= 50) m = { ...m, ...m.k66, k66: undefined };
  if (m.k67 && ruleVersion(state) >= 51) m = { ...m, ...m.k67, k67: undefined };
  return m;
}

/** Kuyruk A6: sürüm 35+ savaşta büyünün sığmayan parçasının Game Master notu (yoksa null). */
export function sigmayanNote(state: Pick<BattleState, 'kuralSurumu'>, spell: Spell): string | null {
  if (ruleVersion(state) < 35) return null;
  const m = mechanicsAt(state, spell);
  return m.sigmayan ?? (m.gmNoted ? m.gmNote ?? null : null);
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
