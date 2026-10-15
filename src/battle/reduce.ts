/**
 * Olayları duruma uygular. Saf fonksiyondur: aynı olaylar aynı sırayla uygulanınca
 * her cihazda ve sunucuda tamamen aynı durum çıkar.
 */
import { directionTo, type Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, DamageEffect } from './types';

/** Yürüyüşün sonundaki düz koşuyu bulur; önceki koşu aynı yönde sürüyorsa üstüne ekler. */
function runAfter(start: Offset, path: Offset[], before: Combatant['run']): Combatant['run'] {
  let run = before;
  let prev = start;
  for (const step of path) {
    const dir = directionTo(prev, step);
    run = dir === null ? null : run && run.dir === dir ? { dir, hexes: run.hexes + 1 } : { dir, hexes: 1 };
    prev = step;
  }
  return run;
}

function withCombatant(state: BattleState, id: string, patch: Partial<Combatant>): BattleState {
  const current = state.combatants[id];
  if (!current) throw new Error(`Savaşçı bulunamadı: ${id}`);
  return { ...state, combatants: { ...state.combatants, [id]: { ...current, ...patch } } };
}

function withEffects(state: BattleState, id: string, effects: DamageEffect[]): BattleState {
  let next = state;
  for (const e of effects) {
    if (e.kind === 'regen_blocked') next = withCombatant(next, id, { regenBlocked: true });
    if (e.kind === 'regen_pending') next = withCombatant(next, id, { regenPending: true });
    const c = next.combatants[id];
    if (!c) continue;
    const unconscious = c.conditions.includes('Unconscious') ? c.conditions : [...c.conditions, 'Unconscious'];
    if (e.kind === 'dying') {
      next = withCombatant(next, id, { life: 'dying', deathSaves: { successes: 0, failures: 0 }, conditions: unconscious });
    }
    if (e.kind === 'instant_death') next = withCombatant(next, id, { life: 'dead', conditions: unconscious });
    if (e.kind === 'death_save_failed') {
      next = withCombatant(next, id, {
        life: e.died ? 'dead' : 'dying',
        deathSaves: { successes: c.deathSaves.successes, failures: e.failures },
        conditions: unconscious,
      });
    }
  }
  return next;
}

export function applyEvent(state: BattleState, event: BattleEvent): BattleState {
  switch (event.type) {
    case 'battle_started':
      return event.state;
    case 'attack_resolved':
      return withEffects(withCombatant(state, event.targetId, { hp: event.targetHpAfter }), event.targetId, event.effects);
    case 'height_changed':
      return event.moved ? withCombatant(state, event.actorId, { height: event.to }) : state;
    case 'turn_ended': {
      const next = { ...state, turnIndex: state.order.indexOf(event.nextActorId), round: event.round };
      return next.combatants[event.nextActorId]
        ? withCombatant(next, event.nextActorId, { movementUsed: 0, run: null })
        : next;
    }
    case 'placed':
      return withCombatant(state, event.actorId, { pos: event.at });
    case 'combat_started':
      return { ...state, status: 'active' };
    case 'moved': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      const last = event.path[event.path.length - 1];
      const run = c.pos ? runAfter(c.pos, event.path, c.run) : null;
      return withCombatant(state, event.actorId, { pos: last ?? c.pos, movementUsed: c.movementUsed + event.cost, run });
    }
    case 'jumped': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return withCombatant(state, event.actorId, { pos: event.to, movementUsed: c.movementUsed + event.cost, run: null });
    }
    case 'fell_into_lava': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return withCombatant(state, event.actorId, {
        pos: event.at, hp: 0, life: 'dead', regenPending: false, deathSaves: { successes: 0, failures: 0 },
      });
    }
    case 'slot_spent': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      const slots = [...c.spellSlots];
      slots[event.level - 1] = event.remaining;
      return withCombatant(state, event.actorId, { spellSlots: slots });
    }
    case 'save_resolved': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      const conditions = [...c.conditions, ...event.conditionsAdded.filter((x) => !c.conditions.includes(x))];
      return withEffects(
        withCombatant(state, event.targetId, { hp: event.targetHpAfter, conditions }),
        event.targetId,
        event.effects,
      );
    }
    case 'healed': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      // 0 HP'deki karakter iyileşince ayağa kalkar.
      if (c.hp === 0 && event.targetHpAfter > 0 && (c.life === 'dying' || c.life === 'stable')) {
        return withCombatant(state, event.targetId, {
          hp: event.targetHpAfter, life: 'alive', deathSaves: { successes: 0, failures: 0 },
          conditions: c.conditions.filter((x) => x !== 'Unconscious'),
        });
      }
      return withCombatant(state, event.targetId, { hp: event.targetHpAfter });
    }
    case 'death_save': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      if (event.outcome === 'revived') {
        return withCombatant(state, event.actorId, {
          hp: 1, life: 'alive', deathSaves: { successes: 0, failures: 0 },
          conditions: c.conditions.filter((x) => x !== 'Unconscious'),
        });
      }
      return withCombatant(state, event.actorId, {
        deathSaves: { successes: event.successes, failures: event.failures },
        life: event.outcome === 'dead' ? 'dead' : event.outcome === 'stable' ? 'stable' : 'dying',
      });
    }
    case 'stabilized':
      return event.success
        ? withCombatant(state, event.targetId, { life: 'stable', deathSaves: { successes: 0, failures: 0 } })
        : state;
    case 'condition_changed': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      const has = c.conditions.includes(event.condition);
      const conditions = event.present
        ? has ? c.conditions : [...c.conditions, event.condition]
        : c.conditions.filter((x) => x !== event.condition);
      return withCombatant(state, event.targetId, { conditions });
    }
    case 'spell_cast':
      return state;
    case 'recharge_used': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return withCombatant(state, event.actorId, {
        rechargeUsed: c.rechargeUsed.includes(event.attackIndex) ? c.rechargeUsed : [...c.rechargeUsed, event.attackIndex],
      });
    }
    case 'recharge_rolled': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return event.recharged
        ? withCombatant(state, event.actorId, { rechargeUsed: c.rechargeUsed.filter((i) => i !== event.attackIndex) })
        : state;
    }
    case 'regeneration':
      return withCombatant(state, event.actorId, { hp: event.hpAfter, regenPending: false, regenBlocked: false });
    case 'hp_adjusted': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      const without = c.conditions.filter((x) => x !== 'Unconscious');
      if (event.life === 'alive') {
        return withCombatant(state, event.targetId, {
          hp: event.hpAfter, life: 'alive', deathSaves: { successes: 0, failures: 0 }, conditions: without,
        });
      }
      return withCombatant(state, event.targetId, {
        hp: event.hpAfter, life: event.life, deathSaves: { successes: 0, failures: 0 },
        conditions: event.life === 'dying' ? [...without, 'Unconscious'] : c.conditions,
      });
    }
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
