/**
 * Olayları duruma uygular. Saf fonksiyondur: aynı olaylar aynı sırayla uygulanınca
 * her cihazda ve sunucuda tamamen aynı durum çıkar.
 */
import { isIncapacitated } from '../rules/conditions';
import { directionTo, type Offset } from '../rules/hex';
import { FRESH_ECONOMY, type BattleEvent, type BattleState, type Combatant, type DamageEffect } from './types';

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

/** Bir turdaki hareket bütçesi (altıgen): uçan yaratık uçuş hızını kullanır, Dash bir kat ekler. */
export function speedHexes(c: Combatant): number {
  return Math.floor((c.fly > 0 ? c.fly : c.speed) / 5) * (1 + c.economy.dashes);
}

const sameAt = (a: Offset, b: Offset) => a.col === b.col && a.row === b.row;

function withCombatant(state: BattleState, id: string, patch: Partial<Combatant>): BattleState {
  const current = state.combatants[id];
  if (!current) throw new Error(`Savaşçı bulunamadı: ${id}`);
  return { ...state, combatants: { ...state.combatants, [id]: { ...current, ...patch } } };
}

/** Konsantrasyonu bitirir: büyünün koyduğu durumlar kalkar. */
function endConcentration(state: BattleState, id: string): BattleState {
  const c = state.combatants[id];
  if (!c?.concentration) return state;
  let next = withCombatant(state, id, { concentration: null });
  for (const link of c.concentration.conditions ?? []) {
    const t = next.combatants[link.targetId];
    if (t) next = withCombatant(next, t.id, { conditions: t.conditions.filter((x) => x !== link.condition) });
  }
  return next;
}

/** Büyünün koyduğu durumu büyücünün konsantrasyonuna bağlar. */
function linkCondition(state: BattleState, casterId: string, spell: string, targetId: string, condition: string): BattleState {
  const c = state.combatants[casterId];
  if (!c?.concentration || c.concentration.spell !== spell) return state;
  const conditions = [...(c.concentration.conditions ?? []), { targetId, condition }];
  return withCombatant(state, casterId, { concentration: { ...c.concentration, conditions } });
}

/** 0 HP'ye düşen veya Incapacitated olan yaratığın konsantrasyonu biter (SRD 5.2.1). */
function dropBrokenConcentration(state: BattleState): BattleState {
  let next = state;
  for (const c of Object.values(state.combatants)) {
    if (c.concentration && (c.hp <= 0 || isIncapacitated(c.conditions))) next = endConcentration(next, c.id);
  }
  return next;
}

function withEffects(state: BattleState, id: string, effects: DamageEffect[]): BattleState {
  let next = state;
  for (const e of effects) {
    if (e.kind === 'concentration' && !e.success) next = endConcentration(next, id);
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
  return dropBrokenConcentration(applyRaw(state, event));
}

function applyRaw(state: BattleState, event: BattleEvent): BattleState {
  switch (event.type) {
    case 'battle_started':
      return event.state;
    case 'attack_resolved': {
      const next = event.sneakTurn ? withCombatant(state, event.actorId, { sneakTurn: event.sneakTurn }) : state;
      return withEffects(withCombatant(next, event.targetId, { hp: event.targetHpAfter }), event.targetId, event.effects);
    }
    case 'height_changed':
      return event.moved ? withCombatant(state, event.actorId, { height: event.to }) : state;
    case 'turn_ended': {
      const next = { ...state, turnIndex: state.order.indexOf(event.nextActorId), round: event.round };
      return next.combatants[event.nextActorId]
        ? withCombatant(next, event.nextActorId, {
          movementUsed: 0, run: null,
          economy: { ...FRESH_ECONOMY, slotTurn: (next.combatants[event.nextActorId] as Combatant).economy.slotTurn },
        })
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
    case 'hide_attempted':
      return event.success ? withCombatant(state, event.actorId, { hidden: { dc: event.total } }) : state;
    case 'revealed':
      return withCombatant(state, event.actorId, { hidden: null });
    case 'skill_checked':
      return state;
    case 'action_used': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      const economy = { ...c.economy };
      if (event.kind !== 'attack') economy[event.kind] = true;
      if (event.attacksLeft !== undefined) economy.attacksLeft = event.attacksLeft;
      else if (event.kind === 'action') economy.attacksLeft = 0;
      if (event.slotTurn !== undefined) economy.slotTurn = event.slotTurn;
      return withCombatant(state, event.actorId, { economy });
    }
    case 'map_effect': {
      let next = state;
      if (event.hpAfter !== undefined) next = withCombatant(next, event.targetId, { hp: event.hpAfter });
      if (event.effects) next = withEffects(next, event.targetId, event.effects);
      const c = next.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      let conditions = c.conditions;
      if (event.addCondition && !conditions.includes(event.addCondition)) conditions = [...conditions, event.addCondition];
      if (event.removeCondition) conditions = conditions.filter((x) => x !== event.removeCondition);
      return withCombatant(next, event.targetId, {
        conditions,
        ...(event.mapStatus ? { mapStatus: { ...c.mapStatus, ...event.mapStatus } } : {}),
        ...(event.moveTo ? { pos: event.moveTo, run: null } : {}),
        ...(event.stopMovement ? { movementUsed: Math.max(c.movementUsed, speedHexes(c)) } : {}),
      });
    }
    case 'tile_changed': {
      if (!state.map) return state;
      const tiles = state.map.tiles.map((row, r) =>
        r === event.at.row ? row.slice(0, event.at.col) + event.to + row.slice(event.at.col + 1) : row);
      const left = state.map.lavaWarning?.hexes.filter((h) => !sameAt(h, event.at)) ?? [];
      const { lavaWarning, ...rest } = state.map;
      return {
        ...state,
        map: { ...rest, tiles, ...(lavaWarning && left.length > 0 ? { lavaWarning: { ...lavaWarning, hexes: left } } : {}) },
      };
    }
    case 'lava_warning':
      return state.map ? { ...state, map: { ...state.map, lavaWarning: { hexes: event.hexes, round: event.round } } } : state;
    case 'map_note': {
      if (!state.map) return state;
      const key = (o: Offset) => `${o.col},${o.row}`;
      const map = { ...state.map };
      if (event.trapFound) map.trapsFound = [...(map.trapsFound ?? []), key(event.trapFound)];
      if (event.trapSprung) map.trapsSprung = [...(map.trapsSprung ?? []), key(event.trapSprung)];
      if (event.gate) map.gates = { ...map.gates, [key(event.gate.at)]: { state: event.gate.state, hp: event.gate.hp } };
      return { ...state, map };
    }
    case 'dashed': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return withCombatant(state, event.actorId, { economy: { ...c.economy, dashes: c.economy.dashes + 1 } });
    }
    case 'disengaged': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return withCombatant(state, event.actorId, { economy: { ...c.economy, disengaged: true } });
    }
    case 'searched':
      return event.found.reduce((s, id) => withCombatant(s, id, { hidden: null }), state);
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
      let next = withCombatant(state, event.targetId, { hp: event.targetHpAfter, conditions });
      for (const x of event.conditionsAdded) next = linkCondition(next, event.actorId, event.label, event.targetId, x);
      const caster = next.combatants[event.actorId];
      if (event.aura && caster?.concentration) {
        const auraHits = { ...caster.concentration.auraHits, [event.targetId]: event.aura.turn };
        next = withCombatant(next, caster.id, { concentration: { ...caster.concentration, auraHits } });
      }
      return withEffects(next, event.targetId, event.effects);
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
      const next = withCombatant(state, event.targetId, { conditions });
      return event.present && event.sourceId
        ? linkCondition(next, event.sourceId, event.reason, event.targetId, event.condition)
        : next;
    }
    case 'feature_used': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      const resources = { ...c.resources, [event.feature]: event.remaining };
      // Action Surge: bir eylem daha (Attack eyleminden kalan saldırılar korunur).
      const economy = event.feature === 'actionSurge' ? { ...c.economy, action: false, surged: true } : c.economy;
      return withCombatant(state, event.actorId, { resources, economy });
    }
    case 'concentration_started': {
      const next = endConcentration(state, event.actorId);
      return withCombatant(next, event.actorId, {
        concentration: {
          spell: event.spell, slotLevel: event.slotLevel, turn: event.turn,
          ...(event.targetId ? { targetId: event.targetId } : {}), ...(event.pos ? { pos: event.pos } : {}),
        },
      });
    }
    case 'concentration_moved': {
      const c = state.combatants[event.actorId];
      if (!c?.concentration) return state;
      return withCombatant(state, event.actorId, {
        concentration: {
          ...c.concentration, ...(event.targetId ? { targetId: event.targetId } : {}), ...(event.pos ? { pos: event.pos } : {}),
        },
      });
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
