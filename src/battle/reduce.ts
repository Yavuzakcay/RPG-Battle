/**
 * Olayları duruma uygular. Saf fonksiyondur: aynı olaylar aynı sırayla uygulanınca
 * her cihazda ve sunucuda tamamen aynı durum çıkar.
 */
import type { BattleEvent, BattleState, Combatant } from './types';

function withCombatant(state: BattleState, id: string, patch: Partial<Combatant>): BattleState {
  const current = state.combatants[id];
  if (!current) throw new Error(`Savaşçı bulunamadı: ${id}`);
  return { ...state, combatants: { ...state.combatants, [id]: { ...current, ...patch } } };
}

export function applyEvent(state: BattleState, event: BattleEvent): BattleState {
  switch (event.type) {
    case 'battle_started':
      return event.state;
    case 'attack_resolved':
      return withCombatant(state, event.targetId, { hp: event.targetHpAfter });
    case 'height_changed':
      return event.moved ? withCombatant(state, event.actorId, { height: event.to }) : state;
    case 'turn_ended':
      return { ...state, turnIndex: state.order.indexOf(event.nextActorId), round: event.round };
    case 'battle_finished':
      return { ...state, status: 'finished', winner: event.winner };
  }
}

export function applyEvents(state: BattleState, events: BattleEvent[]): BattleState {
  return events.reduce(applyEvent, state);
}

/** Verilen ilk durumdan başlayıp tüm olayları uygulayarak durumu yeniden kurar. */
export function replay(events: BattleEvent[]): BattleState {
  const first = events[0];
  if (!first || first.type !== 'battle_started') {
    throw new Error('İlk olay battle_started olmalı');
  }
  return applyEvents(first.state, events.slice(1));
}
