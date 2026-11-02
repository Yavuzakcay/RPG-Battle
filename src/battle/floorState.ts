/**
 * Kuyruk 18 H4: kat değişiminin reducer tarafı. Kuyruk 19: `floors.ts`'ten ayrıldı; `floors.ts` `create.ts`'i içe
 * aktarır ve reducer'dan içe aktarılınca döngü oluyordu (`CURRENT_RULES` başlatılmadan okunuyordu: Game Master ekranı açılmıyordu).
 * Bu dosya yalnızca türleri içe aktarır.
 */
import type { BattleEvent, BattleState, Combatant } from './types';

/** Reducer: kat değişimi (etkin harita, saklanan katlar, savaşçılar, sıra). */
export function applyFloorChange(state: BattleState, e: Extract<BattleEvent, { type: 'floor_changed' }>): BattleState {
  const combatants: Record<string, Combatant> = { ...state.combatants };
  for (const m of e.moved) { const c = combatants[m.id]; if (c) combatants[m.id] = { ...c, pos: m.pos }; }
  for (const p of e.parked) { const c = combatants[p.id]; if (c) combatants[p.id] = { ...c, pos: null, offFloor: e.from, floorPos: p.pos }; }
  for (const id of e.restored) {
    const c = combatants[id];
    if (!c) continue;
    const { offFloor: _o, floorPos, ...rest } = c;
    combatants[id] = { ...rest, pos: floorPos ?? null } as Combatant;
  }
  const actor = combatants[e.actorId];
  if (actor) combatants[e.actorId] = { ...actor, movementUsed: Math.max(actor.movementUsed, e.hexesUsed) };
  // Yeni düşmanlar inisiyatiflerine göre sıraya girer (eşitlikte sonra).
  const order = [...state.order];
  for (const c of e.added) {
    combatants[c.id] = c;
    const at = order.findIndex((id) => (combatants[id]?.initiative ?? 0) < c.initiative);
    order.splice(at < 0 ? order.length : at, 0, c.id);
  }
  const current = state.order[state.turnIndex];
  const floors = { ...(state.floors ?? {}) };
  delete floors[e.to];
  floors[e.from] = e.prev;
  return { ...state, map: e.map, environmentId: e.environmentId, floors, combatants, order, turnIndex: Math.max(0, order.indexOf(current ?? '')) };
}

