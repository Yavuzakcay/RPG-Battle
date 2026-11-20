/**
 * Mekanik matris B02 (kural sürümü 83): "a creature (that) you can see" isteyen büyüler (data/gorme-gerekir.json).
 * SRD 5.2.1 Invisible: "You aren't affected by any effect that requires its target to be seen unless the effect's
 * creator can somehow see you." Seçilen hedef görülmezse büyü yapılamaz; alan büyüsünde görülmeyen yaratık etkilenmez.
 */
import data from '../../data/gorme-gerekir.json';
import { matrisOn } from './matrisSurum';
import { canSeeTarget } from './sight';
import type { BattleState, Combatant } from './types';
import type { Spell } from '../data';

const HEDEF = new Set(data.hedef);
const BIRINCIL = new Set(data.birincil);
const ALAN = new Set(data.alan);
const srdId = (spell: Pick<Spell, 'id'> & { srd?: string }): string => spell.srd?.replace(/^spells:/, '') || spell.id;

/** Seçilen hedeflerden görülmeyen varsa gerekçe (yoksa null). Sürüm 82 ve altı: denetim yok. */
export function unseenTargetProblem(state: BattleState, actor: Combatant, spell: Pick<Spell, 'id' | 'name'> & { srd?: string }, cmd: { targetId?: string; targetIds?: string[] }): string | null {
  if (!matrisOn(state)) return null;
  const id = srdId(spell);
  const ids = HEDEF.has(id) ? [cmd.targetId, ...(cmd.targetIds ?? [])] : BIRINCIL.has(id) ? [cmd.targetId] : [];
  for (const t of ids) {
    const c = t ? state.combatants[t] : undefined;
    if (c && !canSeeTarget(state, actor, c)) return `${spell.name}: hedefi görmen gerekir; ${c.name} görülmüyor.`;
  }
  return null;
}

/** Alan büyüsünde görülmeyen yaratık etkilenmez mi (sürüm 83+, `alan` listesi). */
export const areaNeedsSight = (state: BattleState, spell: Pick<Spell, 'id'> & { srd?: string }): boolean => matrisOn(state) && ALAN.has(srdId(spell));
