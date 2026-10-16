/** Komut işleyicilerinin ortak parçaları: yetki kontrolü, sıra, savaşın bitişi. */
import { isIncapacitated } from '../rules/conditions';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant, CommandContext } from './types';

export interface Failure {
  ok: false;
  error: string;
}
export type CommandResult = { ok: true; state: BattleState; events: BattleEvent[] } | Failure;

export const fail = (error: string): Failure => ({ ok: false, error });

/** Bu kişi bu savaşçıyı yönetebilir mi? GM yalnızca düşmanları, oyuncu yalnızca kendi karakterini. */
export function canControl(c: Combatant, ctx: CommandContext): boolean {
  if (c.side === 'enemies' || c.civilian) return ctx.isGm;
  return ctx.playerId !== null && c.ownerId === ctx.playerId;
}

export function currentActorId(state: BattleState): string {
  const id = state.order[state.turnIndex];
  if (!id) throw new Error('Sıra boş');
  return id;
}

/** Sıradaki ayakta yaratığı bulur; sıranın sonuna gelince tur sayısını artırır. */
export function nextActor(state: BattleState): { id: string; round: number } {
  const n = state.order.length;
  let index = state.turnIndex;
  let round = state.round;
  for (let step = 0; step < n; step++) {
    index += 1;
    if (index >= n) {
      index = 0;
      round += 1;
    }
    const id = state.order[index];
    const c = id ? state.combatants[id] : undefined;
    if (id && c && (c.hp > 0 || c.regenPending || c.life === 'dying')) return { id, round };
  }
  return { id: currentActorId(state), round };
}

/** Hayatta kalan masum sayısı (masumları koru). */
export function civiliansAlive(state: BattleState): number {
  return Object.values(state.combatants).filter((c) => c.civilian && c.hp > 0).length;
}

/**
 * Bir taraf tamamen düştüyse kazananı döndürür. Masumlar partiyi ayakta tutmaz. Masumların
 * ölümü bilgi amaçlıdır (GM hikâyede işler); yalnızca GM'in açtığı sıkı kuralda hayatta kalan
 * masum gerekenin altına düşünce düşmanlar kazanır.
 */
export function winnerOf(state: BattleState): 'party' | 'enemies' | null {
  // Uyuyan ejderha: uyanık düşmanlar yenilince parti kazanır (ejderha uyurken sıvışılır).
  const alive = (side: 'party' | 'enemies') =>
    Object.values(state.combatants).some((c) => c.side === side && !c.civilian && !c.asleep && (c.hp > 0 || c.regenPending));
  const objective = state.map?.objective;
  if (objective?.strict && civiliansAlive(state) < objective.needed) return 'enemies';
  if (!alive('enemies')) return 'party';
  if (!alive('party')) return 'enemies';
  return null;
}

/** Hedef alınabilir mi? Ayakta olan veya yenilenmeyi bekleyen yaratık. */
export function isTargetable(c: Combatant): boolean {
  return c.hp > 0 || c.regenPending || c.life === 'dying' || c.life === 'stable';
}

/** Sırası gelen, ayakta ve yönetebildiğin bir savaşçı mı? Aksiyon gerekiyorsa aksiyon yapabilmeli. */
export function checkActor(
  state: BattleState,
  actorId: string,
  ctx: CommandContext,
  needsAction: boolean,
  outOfTurn = false,
): { ok: true; actor: Combatant } | Failure {
  if (state.status !== 'active') return fail('Savaş bitti.');
  const actor = state.combatants[actorId];
  if (!actor) return fail('Savaşçı bulunamadı.');
  if (!canControl(actor, ctx)) return fail('Bu savaşçıyı yönetme yetkin yok.');
  if (!outOfTurn && currentActorId(state) !== actor.id) return fail('Sıra bu savaşçıda değil.');
  // Kendi turunda düşen (alev, tuzak) savaşçının turu yine bitirilebilir; başka bir şey yapamaz.
  if (actor.hp <= 0 && needsAction) return fail('Bu savaşçı ayakta değil.');
  if (needsAction && isIncapacitated(actor.conditions)) {
    return fail(`Aksiyon yapamaz: ${actor.conditions.join(', ')}`);
  }
  return { ok: true, actor };
}

/** Olayları uygular, savaş bittiyse "battle_finished" olayını da ekler. */
export function finish(state: BattleState, events: BattleEvent[]): CommandResult {
  let next = applyEvents(state, events);
  const winner = winnerOf(next);
  if (winner) {
    const done: BattleEvent = { type: 'battle_finished', winner };
    events.push(done);
    next = applyEvents(next, [done]);
  }
  return { ok: true, state: next, events };
}
