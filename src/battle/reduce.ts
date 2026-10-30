/**
 * Olayları duruma uygular. Saf fonksiyondur: aynı olaylar aynı sırayla uygulanınca
 * her cihazda ve sunucuda tamamen aynı durum çıkar.
 */
import { isIncapacitated, speedZero } from '../rules/conditions';
import { directionTo, type Offset } from '../rules/hex';
import { defaultCivilianLook, withCivilianLook } from './civilianLooks';
import { slowFeet, tickMarks } from './marks';
import { wardedFrom } from './mind';
import { FRESH_ECONOMY, resourceLeft, type ActiveEffect, type BattleEvent, type BattleState, type Combatant, type DamageEffect } from './types';
import { effectSpeedZero, flySpeed } from './flight';
import { exhaustionSpeedFt } from '../rules/exhaustion';

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
  // Hızı 0 olan durumlar (Grappled, Restrained, Paralyzed, Petrified, Unconscious; Görev H).
  // Görev S1: uçuş hızı etkiden de gelir (Fly); bitkinlik seviye başına 5 ft düşürür.
  const fly = flySpeed(c);
  // Etkinin yürüme yasağı uçuşu durdurmaz (Görev B2: Gaseous Form yalnızca 10 ft uçar; Levitate'te uçuş yok).
  if (speedZero(c.conditions) || (effectSpeedZero(c) && fly === 0)) return 0;
  // Haste ×2, Slow ×0,5 (Görev S1; etkilerin çarpımı).
  const mult = (c.effects ?? []).reduce((m, e) => m * (e.speedMult ?? 1), 1);
  const bonus = (c.effects ?? []).reduce((n, e) => n + (e.speedFt ?? 0), 0);
  const ft = Math.floor(Math.max(0, (fly > 0 ? fly : c.speed) + bonus - slowFeet(c) - exhaustionSpeedFt(c.exhaustion)) * mult);
  return Math.floor(ft / 5) * (1 + c.economy.dashes);
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

/** Etkiyle bu duruma bağışık mı (Heroism: Frightened; Görev R2). */
const immuneTo = (c: Combatant, condition: string) => (c.effects ?? []).some((e) => e.immune?.includes(condition));

/**
 * Süren etkilerin bitişi (Görev R2): kaynağın o büyüdeki konsantrasyonu bittiyse, süresi geçtiyse (`until` < tur),
 * taşıyan öldüyse ya da düşman 0 HP'ye indiyse.
 */
/** Görev S1: biten etkilerin verdiği durumlar düşer (başka süren etki aynı durumu vermiyorsa). */
function dropGranted(conditions: string[], before: ActiveEffect[], after: ActiveEffect[]): string[] {
  const lost = before.filter((e) => !after.includes(e)).flatMap((e) => e.grants ?? []);
  if (lost.length === 0) return conditions;
  const still = new Set(after.flatMap((e) => e.grants ?? []));
  return conditions.filter((x) => !lost.includes(x) || still.has(x));
}

function pruneEffects(state: BattleState): BattleState {
  let next = state;
  for (const c of Object.values(state.combatants)) {
    if (!c.effects?.length) continue;
    const gone = c.life === 'dead' || (c.side === 'enemies' && c.hp <= 0 && !c.regenPending);
    const kept = gone ? [] : c.effects.filter((e) => {
      if (e.until !== undefined && e.until < state.round) return false;
      if (e.dropAtZero && c.hp <= 0) return false;
      if (e.concentration && state.combatants[e.sourceId]?.concentration?.spell !== e.concentration) return false;
      return true;
    });
    if (kept.length !== c.effects.length) {
      next = withCombatant(next, c.id, { effects: kept, conditions: dropGranted(c.conditions, c.effects, kept) });
      if (!gone) next = lethargyAfter(next, c, c.effects.filter((e) => !kept.includes(e)));
    }
  }
  return next;
}

/** Tek kullanımlık zar eklentisi kullanıldıysa etkisi biter (olaydaki `bonusDice`). */
function consumeSingles(state: BattleState, event: BattleEvent): BattleState {
  const dice = 'bonusDice' in event ? event.bonusDice
    : event.type === 'effect_tick' ? event.save?.extra : undefined;
  let next = state;
  for (const x of dice ?? []) {
    // Görev F: ikinci şansın kaynağı (Indomitable, Stroke of Luck, Tactical Mind → Second Wind).
    if (x.resource && x.holderId) {
      const h = next.combatants[x.holderId];
      if (h) next = withCombatant(next, h.id, { resources: { ...h.resources, [x.resource]: Math.max(0, resourceLeft(h, x.resource) - 1) } });
      continue;
    }
    if (!x.single || !x.holderId) continue;
    const c = next.combatants[x.holderId];
    if (c?.effects) next = withCombatant(next, c.id, { effects: c.effects.filter((e) => e.id !== x.effectId) });
  }
  return next;
}

function withEffects(state: BattleState, id: string, effects: DamageEffect[]): BattleState {
  let next = state;
  for (const e of effects) {
    // Geçici HP hasarı karşıladı; hasar azaltma etkisi bu tur kullanıldı (Görev R2).
    if (e.kind === 'temp_absorbed') next = withCombatant(next, id, { tempHp: e.left });
    if (e.kind === 'reduced') {
      const h = next.combatants[id];
      if (h?.effects) next = withCombatant(next, id, { effects: h.effects.map((x) => (x.id === e.effectId && x.reduce ? { ...x, reduce: { ...x.reduce, spent: true } } : x)) });
    }
    if (e.kind === 'concentration' && !e.success) next = endConcentration(next, id);
    // Görev B3: hasarla yeniden save başarılı (Hideous Laughter): etki ve verdiği durumlar biter.
    if (e.kind === 'effect_save' && e.success) next = dropEffects(next, id, (x) => x.id === e.effectId);
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
  return pruneZones(pruneEffects(pruneTimers(dropBrokenRage(dropBrokenConcentration(consumeSingles(breakOnAct(dropOnDamage(state, markDeaths(state, applyRaw(state, event))), event), event))))));
}

/**
 * Görev B2: biten büyü alanları kalkar: süre doldu, büyücünün konsantrasyonu bitti (ya da büyücü öldü/kayboldu), alanın
 * bağlı olduğu yaratık (Flaming Sphere, ruh sürüsü) kayboldu.
 */
function pruneZones(state: BattleState): BattleState {
  const zones = state.map?.zones;
  if (!zones?.length) return state;
  const kept = zones.filter((z) => {
    if (z.until !== undefined && z.until < state.round) return false;
    const caster = state.combatants[z.casterId];
    if (z.concentration && caster?.concentration?.spell !== z.concentration) return false;
    if (z.anchorId) {
      const a = state.combatants[z.anchorId];
      if (!a || a.summon?.gone || a.hp <= 0 || !a.pos) return false;
    }
    return true;
  });
  return kept.length === zones.length ? state : { ...state, map: { ...(state.map as NonNullable<BattleState['map']>), zones: kept } };
}

/** Görev B3: savaşçının bazı etkilerini kaldırır (verdiği durumlar da düşer). */
function dropEffects(state: BattleState, id: string, drop: (e: ActiveEffect) => boolean): BattleState {
  const c = state.combatants[id];
  if (!c?.effects?.some(drop)) return state;
  const kept = c.effects.filter((e) => !drop(e));
  return withCombatant(state, id, { effects: kept, conditions: dropGranted(c.conditions, c.effects, kept) });
}

/** Görev B3: hasar alan (HP'si düşen) savaşçıda hasarla biten etkiler kalkar (Charm Person, Hypnotic Pattern…). */
function dropOnDamage(before: BattleState, after: BattleState): BattleState {
  let next = after;
  for (const c of Object.values(after.combatants)) {
    const was = before.combatants[c.id];
    if (!was || c.hp >= was.hp || !c.effects?.some((e) => e.breakOnDamage)) continue;
    next = dropEffects(next, c.id, (e) => !!e.breakOnDamage);
  }
  return next;
}

/** Görev B1: ölen savaşçının öldüğü tur (Revivify'ın "son bir dakika" denetimi; 10 tur = 1 dakika). */
function markDeaths(before: BattleState, after: BattleState): BattleState {
  let next = after;
  for (const c of Object.values(after.combatants)) {
    if (c.life === 'dead' && before.combatants[c.id]?.life !== 'dead') next = withCombatant(next, c.id, { diedRound: after.round });
    else if (c.life !== 'dead' && c.diedRound !== undefined) next = withCombatant(next, c.id, { diedRound: undefined });
  }
  return next;
}

/**
 * Görev B1: Haste bitince uyuşukluk (SRD: sonraki turunun sonuna dek Incapacitated ve hız 0): bir turluk etki
 * (Incapacitated verir, hız 0). Ölen ya da düşmüş yaratığa uygulanmaz.
 */
function lethargyAfter(state: BattleState, c: Combatant, lost: ActiveEffect[]): BattleState {
  const h = lost.find((e) => e.lethargy);
  if (!h || c.hp <= 0 || c.life === 'dead') return state;
  const cur = state.combatants[c.id] as Combatant;
  const effect: ActiveEffect = { id: `${h.id}/lethargy`, name: `${h.name}: uyuşukluk`, sourceId: h.sourceId, until: state.round + 1, speedZero: true, grants: ['Incapacitated'] };
  const grants = cur.conditions.includes('Incapacitated') ? [] : ['Incapacitated'];
  return withCombatant(state, c.id, { effects: [...(cur.effects ?? []), effect], conditions: [...cur.conditions, ...grants] });
}

/** Görev S1: saldıran ya da büyü yapanın "eylemle biter" etkileri (Invisibility) kalkar. */
function breakOnAct(state: BattleState, event: BattleEvent): BattleState {
  const id = event.type === 'attack_resolved' || event.type === 'spell_cast' ? event.actorId : null;
  const c = id ? state.combatants[id] : undefined;
  // Görev B1: tek saldırılık dezavantaj (Ray of Enfeeblement başarılı save) ilk saldırıdan sonra biter.
  const single = (e: ActiveEffect) => event.type === 'attack_resolved' && !!e.attackDis?.single;
  if (!c?.effects?.some((e) => e.breakOnAct || single(e))) return state;
  const kept = c.effects.filter((e) => !e.breakOnAct && !single(e));
  return withCombatant(state, c.id, { effects: kept, conditions: dropGranted(c.conditions, c.effects, kept) });
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
      // Görev F: turda bir kez özellikler, Steady Aim harcandı, Horde Breaker için son hedef.
      const att = next.combatants[event.actorId];
      if (att && (event.traitTurns || event.steadyAim || !event.opportunity)) {
        next = withCombatant(next, att.id, {
          ...(event.traitTurns ? { traitTurns: { ...att.traitTurns, ...event.traitTurns } } : {}),
          ...(event.steadyAim ? { steadyAim: undefined } : {}),
          ...(!event.opportunity && state.order[state.turnIndex] === att.id ? { economy: { ...att.economy, lastTargetId: event.targetId } } : {}),
        });
      }
      next = refreshRage(next, event.actorId, event.targetId);
      // Yakın dövüş silah isabeti: bu tur smite büyüleri bu hedefe yapılabilir.
      const hitter = next.combatants[event.actorId];
      if (event.melee && event.hit && hitter) {
        next = withCombatant(next, hitter.id, { economy: { ...hitter.economy, meleeHit: { targetId: event.targetId, critical: event.critical, ...(event.martialArts ? { martialArts: true } : {}) } } });
      }
      // Deflect Attacks: tepki harcandı.
      const deflector = next.combatants[event.targetId];
      if (event.deflected && deflector) next = withCombatant(next, deflector.id, { economy: { ...deflector.economy, reaction: true } });
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
      // Turda bir hasar azaltma (Resistance; Görev R2): her tur geçişinde yeniden kullanılabilir.
      for (const c of Object.values(next.combatants)) {
        if (c.effects?.some((e) => e.reduce?.spent)) next = withCombatant(next, c.id, { effects: c.effects.map((e) => (e.reduce?.spent ? { ...e, reduce: { ...e.reduce, spent: false } } : e)) });
      }
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
      if (event.flurryLeft !== undefined) economy.flurryLeft = event.flurryLeft;
      if (event.stunUsed) economy.stunUsed = true;
      return withCombatant(state, event.actorId, { economy });
    }
    case 'summon_steered': {
      const c = state.combatants[event.summonId];
      return c ? withCombatant(state, c.id, { movementUsed: 0, run: null }) : state;
    }
    case 'haste_action': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return withCombatant(state, c.id, { economy: { ...c.economy, action: false, attacksLeft: 0, hasted: true, hasteUsed: true } });
    }
    case 'reaction_used': {
      // Tepki hakkı harcanır (Görev R1): kendi turunun başında yenilenir (turn_ended).
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return withCombatant(state, c.id, {
        economy: { ...c.economy, reaction: true },
        ...(event.mark ? { marks: [...(c.marks ?? []).filter((m) => m.kind !== event.mark?.kind), event.mark] } : {}),
        ...(event.pool ? { reactionUses: { ...c.reactionUses, [event.pool.id]: event.pool.remaining } } : {}),
        ...(event.recharge ? { reactionSpent: [...(c.reactionSpent ?? []).filter((x) => x !== event.reaction), event.reaction] } : {}),
      });
    }
    case 'effect_added': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      // Görev B3: Protection from Evil and Good: korunan türlerden gelen Charmed/Frightened veren etki tutmaz.
      if ((event.effect.grants ?? []).some((g) => wardedFrom(state, c.id, event.effect.sourceId, g))) return state;
      const effects = [...(c.effects ?? []).filter((e) => e.id !== event.effect.id), event.effect];
      // Görev S1: etkinin verdiği durumlar (Invisibility → Invisible) etki sürdükçe.
      const grants = (event.effect.grants ?? []).filter((g) => !c.conditions.includes(g));
      return withCombatant(state, c.id, { effects, ...(grants.length ? { conditions: [...c.conditions, ...grants] } : {}) });
    }
    case 'effect_ended': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      const kept = (c.effects ?? []).filter((e) => e.id !== event.effectId);
      const next = withCombatant(state, c.id, { effects: kept, conditions: dropGranted(c.conditions, c.effects ?? [], kept) });
      return lethargyAfter(next, c, (c.effects ?? []).filter((e) => !kept.includes(e)));
    }
    case 'temp_hp': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      return withCombatant(state, c.id, { tempHp: Math.max(c.tempHp ?? 0, event.amount) });
    }
    case 'hp_boosted': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      return withCombatant(state, c.id, { maxHp: c.maxHp + event.amount, hp: c.hp + event.amount });
    }
    case 'effect_tick':
      return withEffects(withCombatant(state, event.targetId, { hp: event.targetHpAfter }), event.targetId, event.effects);
    case 'turn_lost': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return event.command === 'grovel' && !c.conditions.includes('Prone') ? withCombatant(state, c.id, { conditions: [...c.conditions, 'Prone'] }) : state;
    }
    case 'reaction_recharged': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return event.recharged ? withCombatant(state, c.id, { reactionSpent: (c.reactionSpent ?? []).filter((x) => x !== event.reaction) }) : state;
    }
    case 'swapped': {
      const a = state.combatants[event.actorId];
      const b = state.combatants[event.otherId];
      if (!a || !b) throw new Error('Savaşçı bulunamadı');
      return withCombatant(withCombatant(state, a.id, { pos: b.pos, height: b.height }), b.id, { pos: a.pos, height: a.height });
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
      const conditions = [...c.conditions, ...event.conditionsAdded.filter((x) => !c.conditions.includes(x) && !immuneTo(c, x) && !wardedFrom(state, c.id, event.actorId, x))];
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
      // Bağışıklık (Heroism: Frightened): durum eklenmez.
      if (event.present && !has && immuneTo(c, event.condition)) return state;
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
    case 'mark_added': {
      const holder = state.combatants[event.holderId];
      if (!holder) throw new Error(`Savaşçı bulunamadı: ${event.holderId}`);
      const m = event.mark;
      const kept = (holder.marks ?? []).filter((x) => !(x.kind === m.kind && x.by === m.by && x.targetId === m.targetId));
      return withCombatant(state, holder.id, { marks: [...kept, m] });
    }
    case 'steady_aim_used': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      // Hız 0: bu tur hareket kalmaz (Dash dahil; tur başında sıfırlanır).
      return withCombatant(state, c.id, { steadyAim: event.turn, movementUsed: Math.max(c.movementUsed, 999) });
    }
    case 'extra_damage': {
      const c = state.combatants[event.actorId];
      const next = c && event.traitTurns ? withCombatant(state, c.id, { traitTurns: { ...c.traitTurns, ...event.traitTurns } }) : state;
      return withEffects(withCombatant(next, event.targetId, { hp: event.targetHpAfter }), event.targetId, event.effects);
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
    case 'area_used':
      return state;
    case 'summoned': {
      // Çağrılan yaratık (Görev R3): savaşçılara ve sıraya girer. Savaş sürerken sıradaki yeri şimdikinden önceyse
      // sıra göstergesi kayar (sırası gelen değişmez).
      const order = [...state.order];
      order.splice(event.index, 0, event.combatant.id);
      const shift = state.status === 'active' && event.index <= state.turnIndex ? 1 : 0;
      return { ...state, order, turnIndex: state.turnIndex + shift, combatants: { ...state.combatants, [event.combatant.id]: event.combatant } };
    }
    case 'zone_created':
      return state.map ? { ...state, map: { ...state.map, zones: [...(state.map.zones ?? []).filter((z) => z.id !== event.zone.id), event.zone] } } : state;
    case 'zone_moved':
      return state.map ? { ...state, map: { ...state.map, zones: (state.map.zones ?? []).map((z) => (z.id === event.zoneId ? { ...z, hexes: event.hexes } : z)) } } : state;
    case 'zone_triggered':
      return state.map ? { ...state, map: { ...state.map, zones: (state.map.zones ?? []).map((z) => (z.id === event.zoneId
        ? { ...z, hits: { ...Object.fromEntries(Object.entries(z.hits ?? {}).filter(([, t]) => t === event.turn)), [event.targetId]: event.turn } } : z)) } } : state;
    case 'zone_ended':
      return state.map ? { ...state, map: { ...state.map, zones: (state.map.zones ?? []).filter((z) => z.id !== event.zoneId) } } : state;
    case 'summon_vanished': {
      // Kaybolan yaratık savaşçılarda kalır (günlük adları), sırada atlanır (0 HP, ölü), haritadan kalkar.
      const c = state.combatants[event.actorId];
      if (!c) return state;
      return withCombatant(state, c.id, {
        hp: 0, pos: null, life: 'dead', conditions: [], concentration: null, effects: [], tempHp: 0,
        ...(c.summon ? { summon: { ...c.summon, gone: true } } : {}),
      });
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
    case 'life_restored': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      // Stabil: 0 HP, baygın kalır, ölüm save'i atmaz. Diriltme: 1 HP, ayakta.
      return withCombatant(state, c.id, {
        hp: event.hpAfter, life: event.life, deathSaves: { successes: 0, failures: 0 },
        conditions: event.life === 'alive' ? c.conditions.filter((x) => x !== 'Unconscious') : c.conditions,
      });
    }
    case 'teleported':
      return withCombatant(state, event.actorId, { pos: event.to });
    case 'exhaustion_changed': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      // SRD 5.2.1: 6. seviyede ölür.
      if (event.level >= 6) return withCombatant(state, c.id, { exhaustion: event.level, hp: 0, life: 'dead', concentration: null });
      return withCombatant(state, c.id, { exhaustion: event.level });
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
