/**
 * Kuyruk 19 (Görev 4–5): 11–20. seviye sınıf özelliklerinin savaş başı ve tur kancaları (SRD 5.2.1).
 * - Persistent Rage (Barbarian 15): inisiyatif atılınca Rage kullanımları dolar (uzun dinlenmede bir kez, kaynak
 *   `persistentRage`); Rage her tur uzatılmadan sürer (Unconscious ya da ağır zırhla biter; `rageTurnEndEvents`).
 * - Perfect Focus (Monk 15): inisiyatifte Uncanny Metabolism kullanılmadıysa Focus 3 ya da azsa 4'e çıkar.
 * - Superior Defense (Monk 18): tur başında 3 Focus ile 1 dakika Force dışında bütün hasara direnç (`superior_defense`).
 */
import { fail, finish, type CommandResult } from './common';
import { resourceLeft, type BattleEvent, type BattleState, type Combatant } from './types';

const DAMAGE_TYPES = ['acid', 'bludgeoning', 'cold', 'fire', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];

/** Savaş başı: Persistent Rage ve Perfect Focus (Uncanny Metabolism olaylarından sonra). */
export function capstoneStartEvents(c: Combatant, metabolized: boolean): BattleEvent[] {
  const out: BattleEvent[] = [];
  const caps = c.resourceCaps ?? {};
  if (c.traits?.includes('persistent-rage') && resourceLeft(c, 'persistentRage') > 0 && (caps.rage ?? 0) > resourceLeft(c, 'rage')) {
    out.push({ type: 'feature_used', actorId: c.id, feature: 'rage', remaining: caps.rage as number },
      { type: 'feature_used', actorId: c.id, feature: 'persistentRage', remaining: resourceLeft(c, 'persistentRage') - 1 });
  }
  if (c.traits?.includes('perfect-focus') && !metabolized && resourceLeft(c, 'focus') <= 3) {
    out.push({ type: 'feature_used', actorId: c.id, feature: 'focus', remaining: 4 });
  }
  return out;
}

/** Superior Defense: tur başında (henüz bir şey yapılmamışken) 3 Focus. */
export function executeSuperiorDefense(state: BattleState, actor: Combatant): CommandResult {
  if (!actor.traits?.includes('superior-defense')) return fail('Superior Defense yok.');
  if (resourceLeft(actor, 'focus') < 3) return fail('3 Focus gerekir.');
  if (actor.economy.action || actor.economy.bonus || actor.movementUsed > 0) return fail('Superior Defense turun başında kullanılır.');
  if (actor.effects?.some((e) => e.id === 'superior-defense')) return fail('Zaten etkin.');
  return finish(state, [
    { type: 'feature_used', actorId: actor.id, feature: 'focus', remaining: resourceLeft(actor, 'focus') - 3 },
    { type: 'effect_added', targetId: actor.id, effect: { id: 'superior-defense', name: 'Superior Defense', sourceId: actor.id, until: state.round + 10,
      resist: DAMAGE_TYPES, breakOnIncapacitated: true, icon: '🛡' } },
  ]);
}
