/**
 * Olayları duruma uygular. Saf fonksiyondur: aynı olaylar aynı sırayla uygulanınca
 * her cihazda ve sunucuda tamamen aynı durum çıkar.
 */
import { isIncapacitated } from '../rules/conditions';
import { directionTo, type Offset } from '../rules/hex';
import { defaultCivilianLook, withCivilianLook } from './civilianLooks';
import { slowFeet, tickMarks } from './marks';
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

/**
 * Bir turdaki hareket bütçesi (altıgen): uçan yaratık uçuş hızını kullanır, Dash bir kat ekler. Slow ustalığı hızı
 * 10 ft azaltır (Dash azalmış hızı ekler).
 */
export function speedHexes(c: Combatant): number {
  return Math.floor(Math.max(0, (c.fly > 0 ? c.fly : c.speed) - slowFeet(c)) / 5) * (1 + c.economy.dashes);
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
  return pruneTimers(dropBrokenRage(dropBrokenConcentration(applyRaw(state, event))));
}

/** Rage'i bitirir: Rage'in eklediği dirençler kalkar. */
function endRage(state: BattleState, id: string): BattleState {
  const c = state.combatants[id];
  if (!c?.rage) return state;
  const added = new Set(c.rage.added);
  return withCombatant(state, id, { rage: null, resistances: c.resistances.filter((r) => !added.has(r)) });
}

/** Incapacitated olan ya da 0 HP'ye düşen yaratığın Rage'i biter (SRD 5.2.1). */
function dropBrokenRage(state: BattleState): BattleState {
  let next = state;
  for (const c of Object.values(state.combatants)) {
    if (c.rage && (c.hp <= 0 || isIncapacitated(c.conditions))) next = endRage(next, c.id);
  }
  return next;
}

/** Saldıran Rage'deyse ve hedef düşmansa Rage bu tur uzamış sayılır (saldırı zarı ya da save yaptırma). */
function refreshRage(state: BattleState, actorId: string, targetId: string): BattleState {
  const a = state.combatants[actorId];
  const t = state.combatants[targetId];
  if (!a?.rage || a.rage.refreshed || !t || t.side === a.side) return state;
  return withCombatant(state, actorId, { rage: { ...a.rage, refreshed: true } });
}

/** Durumu kalkan (konsantrasyon bitti, iyileşti, Burning söndü…) süreli durumun sayacı da düşer. */
function pruneTimers(state: BattleState): BattleState {
  let next = state;
  for (const c of Object.values(state.combatants)) {
    const timers = c.conditionTimers;
    if (!timers?.length) continue;
    const kept = timers.filter((t) => c.conditions.includes(t.condition));
    if (kept.length !== timers.length) next = withCombatant(next, c.id, { conditionTimers: kept });
  }
  return next;
}

function applyRaw(state: BattleState, event: BattleEvent): BattleState {
  switch (event.type) {
    case 'battle_started':
      return withCivilianLooks(event.state);
    case 'attack_resolved': {
      let next = event.sneakTurn ? withCombatant(state, event.actorId, { sneakTurn: event.sneakTurn }) : state;
      if (event.frenzyTurn) next = withCombatant(next, event.actorId, { frenzyTurn: event.frenzyTurn });
      next = refreshRage(next, event.actorId, event.targetId);
      // Yakın dövüş silah isabeti: bu tur smite büyüleri bu hedefe yapılabilir.
      const hitter = next.combatants[event.actorId];
      if (event.melee && event.hit && hitter) next = withCombatant(next, hitter.id, { economy: { ...hitter.economy, meleeHit: { targetId: event.targetId, critical: event.critical } } });
      // Yardım (Help): saldıranın tarafına ait işaret ilk saldırıda kullanılır ve kalkar.
      const side = state.combatants[event.actorId]?.side;
      const target = next.combatants[event.targetId];
      const mark = side ? `Help:${side}` : '';
      if (target && side && target.conditions.includes(mark)) {
        next = withCombatant(next, target.id, { conditions: target.conditions.filter((x) => x !== mark) });
      }
      return withEffects(withCombatant(next, event.targetId, { hp: event.targetHpAfter }), event.targetId, event.effects);
    }
    case 'height_changed':
      return event.moved ? withCombatant(state, event.actorId, { height: event.to }) : state;
    case 'turn_ended': {
      let next: BattleState = { ...state, turnIndex: state.order.indexOf(event.nextActorId), round: event.round };
      // Rage: biten turun uzatması harcandı; sonraki turunda yeniden uzatılmalı.
      const ender = next.combatants[event.actorId];
      if (ender?.rage?.refreshed) next = withCombatant(next, ender.id, { rage: { ...ender.rage, refreshed: false } });
      // Ustalık işaretleri: biten turun sonu ve başlayan turun başı sayılır.
      for (const c of Object.values(next.combatants)) {
        if (!c.marks?.length) continue;
        // Koyanı ölen işaret de kalkar (turu bir daha gelmez).
        const marks = tickMarks(c.marks, event.actorId, event.nextActorId)?.filter((m) => next.combatants[m.by]?.life !== 'dead');
        if (marks?.length !== c.marks.length || marks.some((m, i) => m !== c.marks?.[i])) next = withCombatant(next, c.id, { marks: marks ?? [] });
      }
      return next.combatants[event.nextActorId]
        ? withCombatant(next, event.nextActorId, {
          movementUsed: 0, run: null,
          economy: { ...FRESH_ECONOMY, slotTurn: (next.combatants[event.nextActorId] as Combatant).economy.slotTurn },
        })
        : next;
    }
    case 'placed':
      return withCombatant(state, event.actorId, { pos: event.at });
    case 'dice_rolled':
      return state;
    case 'civilian_art': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return { ...state, combatants: { ...state.combatants, [c.id]: withCivilianLook(c, event.gorselId) } };
    }
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
      if (event.light) economy.lightAttack = true;
      if (event.offhand) economy.offhandUsed = true;
      return withCombatant(state, event.actorId, { economy });
    }
    case 'buff_added': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      return withCombatant(state, c.id, { buffs: [...(c.buffs ?? []).filter((b) => b.source !== event.buff.source), event.buff] });
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
      // Süreli durum: sayaç eklenir (aynı durumun eski sayacının yerine).
      const timers = (c.conditionTimers ?? []).filter((t) => t.condition !== event.condition);
      const next = withCombatant(state, event.targetId, { conditions, ...(event.present && event.timer ? { conditionTimers: [...timers, event.timer] } : {}) });
      return event.present && event.sourceId
        ? linkCondition(next, event.sourceId, event.reason, event.targetId, event.condition)
        : next;
    }
    case 'shove_resolved': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      const next = refreshRage(state, event.actorId, event.targetId);
      return !event.success && event.effect === 'prone' && !c.conditions.includes('Prone')
        ? withCombatant(next, event.targetId, { conditions: [...c.conditions, 'Prone'] })
        : next;
    }
    case 'rage_started': {
      const c = endConcentration(state, event.actorId).combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return withCombatant(endConcentration(state, event.actorId), event.actorId, {
        rage: { refreshed: true, added: event.added }, resistances: [...c.resistances, ...event.added.filter((r) => !c.resistances.includes(r))],
      });
    }
    case 'rage_extended': {
      const c = state.combatants[event.actorId];
      return c?.rage ? withCombatant(state, event.actorId, { rage: { ...c.rage, refreshed: true } }) : state;
    }
    case 'rage_ended':
      return endRage(state, event.actorId);
    case 'reckless_started': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      const marks = (c.marks ?? []).filter((m) => m.kind !== 'reckless');
      return withCombatant(state, event.actorId, { marks: [...marks, { kind: 'reckless', by: c.id, end: 'turnStart', count: 1 }] });
    }
    case 'jump_check':
      return state;
    case 'pushed':
      return withCombatant(state, event.targetId, { pos: event.to, run: null });
    case 'mastery_applied': {
      let next = state;
      if (event.mark) {
        const holder = next.combatants[event.mark.holderId];
        const m = event.mark.mark;
        if (!holder) throw new Error(`Savaşçı bulunamadı: ${event.mark.holderId}`);
        // Aynı kişinin aynı türden (Vex'te aynı hedefe) işareti yenilenir.
        const kept = (holder.marks ?? []).filter((x) => !(x.kind === m.kind && x.by === m.by && x.targetId === m.targetId));
        next = withCombatant(next, holder.id, { marks: [...kept, m] });
      }
      if (event.turn) next = withCombatant(next, event.actorId, { cleaveTurn: event.turn });
      if (event.save) next = refreshRage(next, event.actorId, event.targetId);
      if (event.hpAfter !== undefined) next = withEffects(withCombatant(next, event.targetId, { hp: event.hpAfter }), event.targetId, event.effects ?? []);
      return next;
    }
    case 'mastery_mark_used': {
      const c = state.combatants[event.holderId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.holderId}`);
      const marks = (c.marks ?? []).filter((m) => !(m.kind === event.kind && m.by === event.by && m.targetId === event.targetId));
      return withCombatant(state, c.id, { marks });
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
    case 'dragon_woke':
      return withCombatant(state, event.actorId, { asleep: false });
    case 'condition_timer': {
      const c = state.combatants[event.targetId];
      if (!c) return state;
      return withCombatant(state, c.id, { conditionTimers: (c.conditionTimers ?? []).map((t) => (t.condition === event.condition ? { ...t, count: event.count } : t)) });
    }
    case 'condition_save':
      return state;
    case 'stood_up': {
      const c = state.combatants[event.actorId];
      if (!c) return state;
      return withCombatant(state, c.id, { conditions: c.conditions.filter((x) => x !== 'Prone'), movementUsed: c.movementUsed + event.cost });
    }
    case 'grappled': {
      const c = state.combatants[event.targetId];
      if (!c) return state;
      const add = ['Grappled', ...(event.restrained ? ['Restrained'] : [])].filter((x) => !c.conditions.includes(x));
      return withCombatant(state, c.id, { conditions: [...c.conditions, ...add], grapple: { by: event.by, escapeDc: event.escapeDc, restrained: event.restrained } });
    }
    case 'grapple_ended': {
      const c = state.combatants[event.targetId];
      if (!c) return state;
      const drop = ['Grappled', ...(c.grapple?.restrained ? ['Restrained'] : [])];
      const { grapple: _g, ...rest } = c;
      return { ...state, combatants: { ...state.combatants, [c.id]: { ...rest, conditions: c.conditions.filter((x) => !drop.includes(x)) } } };
    }
    case 'grapple_escape':
      return state;
    case 'condition_ended': {
      const c = state.combatants[event.targetId];
      if (!c) return state;
      return withCombatant(state, c.id, {
        conditions: c.conditions.filter((x) => x !== event.condition),
        conditionTimers: (c.conditionTimers ?? []).filter((t) => t.condition !== event.condition),
      });
    }
    case 'dragon_perception':
      return state;
    case 'rouse_roll':
      return withCombatant(state, event.actorId, { rouseTurn: event.turn, rouseHit: event.success });
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

/**
 * `gorselId` alanı olmayan masumlar (Görev F ek'ten önceki kayıtlar) tohumlu varsayılan görünüme düşer;
 * baştan oynatma aynı sonucu verir.
 */
function withCivilianLooks(state: BattleState): BattleState {
  const missing = Object.values(state.combatants).filter((c) => c.civilian && !c.gorselId);
  if (missing.length === 0) return state;
  const combatants = { ...state.combatants };
  for (const c of missing) combatants[c.id] = withCivilianLook(c, defaultCivilianLook(Number(c.id.replace(/\D/g, '')) || 1));
  return { ...state, combatants };
}
