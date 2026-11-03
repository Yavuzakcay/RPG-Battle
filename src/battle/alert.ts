/**
 * Kuyruk 19 (anahtar `featuresK19`): Alert feat'inin Initiative Swap'ı (SRD 5.2.1): inisiyatif atıldıktan hemen sonra
 * gönüllü bir dostla inisiyatif değiş tokuşu (ikisi de Incapacitated değil). Oyunda: 1. turda, ikisi de henüz sırasını
 * oynamamışken (sıradaki yeri şimdiki sıradan önce değil); şimdiki sıradaysa henüz hiçbir şey yapmamış olmalı. Sıra dışı
 * komut (`initiative_swap`), eylem harcamaz; savaşta bir kez.
 */
import { fail, finish, type CommandResult } from './common';
import { featuresOn } from './shift';
import { isIncapacitated } from '../rules/conditions';
import type { BattleState, Combatant } from './types';

const untouched = (state: BattleState, c: Combatant) => {
  const i = state.order.indexOf(c.id);
  if (i < state.turnIndex) return false;
  if (i > state.turnIndex) return true;
  const e = c.economy;
  return !e.action && !e.bonus && c.movementUsed === 0;
};

export function swapProblem(state: BattleState, actor: Combatant, allyId: string): string | null {
  if (!featuresOn(state) || !actor.traits?.includes('alert')) return 'Initiative Swap yok (Alert).';
  if (state.round !== 1) return 'Initiative Swap yalnızca inisiyatif atıldıktan hemen sonra (1. tur).';
  if (actor.traitTurns?.['initiative-swap']) return 'Initiative Swap bu savaşta kullanıldı.';
  const ally = state.combatants[allyId];
  if (!ally || ally.id === actor.id || ally.side !== actor.side || ally.civilian || ally.summon) return 'Gönüllü bir dost seç.';
  if (isIncapacitated(actor.conditions) || isIncapacitated(ally.conditions)) return 'Incapacitated iken değiş tokuş olmaz.';
  if (!untouched(state, actor) || !untouched(state, ally)) return 'İkisi de henüz sırasını oynamamış olmalı.';
  return null;
}

export function executeInitiativeSwap(state: BattleState, actor: Combatant, allyId: string): CommandResult {
  const why = swapProblem(state, actor, allyId);
  if (why) return fail(why);
  return finish(state, [{ type: 'initiative_swapped', actorId: actor.id, allyId },
    { type: 'trait_turn', actorId: actor.id, trait: 'initiative-swap', key: 'used' }]);
}
