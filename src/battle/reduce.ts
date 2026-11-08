/**
 * Olayları duruma uygular. Saf fonksiyondur: aynı olaylar aynı sırayla uygulanınca
 * her cihazda ve sunucuda tamamen aynı durum çıkar.
 */
import { BOON_TURN_REFILL } from './boons';
import { syncRiders } from './mounted';
import { syncAuthority } from './authority';
import { spells } from '../data';
import { homeSide, syncAllegiance } from './allegiance';
import { POSSESS_FLOOR } from './possessionCore';
import { syncAuras } from './auras';
import { applyFloorChange } from './floorState';
import { globalRule } from './ruleControl';
import { applyPoolEvent, trackPools } from './hpPool';
import { isIncapacitated, speedZero } from '../rules/conditions';
import { directionTo, distance, isInside, neighbors, type Offset } from '../rules/hex';
import { terrainOf } from '../map/terrain';
import { defaultCivilianLook, withCivilianLook } from './civilianLooks';
import { slowFeet, tickMarks } from './marks';
import { wardedFrom } from './mind';
import { FRESH_ECONOMY, resourceLeft, type ActiveEffect, type BattleEvent, type BattleState, type Combatant, type ConditionTimer, type DamageEffect } from './types';
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
  // Kuyruk 19: Freedom of Movement: büyüler ve büyülü etkiler hızı düşüremez (büyüsüz Grappled yine durdurur).
  const free = !!c.effects?.some((e) => e.freeMove);
  if (speedZero(c.conditions) || (effectSpeedZero(c) && fly === 0 && !free)) return 0;
  // Kuyruk K68a (sürüm 52'de oluşan enkaz etkisi): uçuş hızı ve Freedom of Movement da aşamaz.
  if (c.effects?.some((e) => e.pinned)) return 0;
  // Haste ×2, Slow ×0,5 (Görev S1; etkilerin çarpımı).
  const mult0 = (c.effects ?? []).reduce((m, e) => m * (e.speedMult ?? 1), 1);
  const mult = free ? Math.max(1, mult0) : mult0;
  const bonus = (c.effects ?? []).reduce((n, e) => n + (free ? Math.max(0, e.speedFt ?? 0) : e.speedFt ?? 0), 0);
  const ft = Math.floor(Math.max(0, (fly > 0 ? fly : c.speed) + bonus - slowFeet(c) - exhaustionSpeedFt(c.exhaustion)) * mult);
  return Math.floor(ft / 5) * (1 + c.economy.dashes);
}

const sameAt = (a: Offset, b: Offset) => a.col === b.col && a.row === b.row;

function withCombatant(state: BattleState, id: string, patch: Partial<Combatant>): BattleState {
  const current = state.combatants[id];
  if (!current) throw new Error(`Savaşçı bulunamadı: ${id}`);
  return { ...state, combatants: { ...state.combatants, [id]: { ...current, ...patch } } };
}

/**
 * Kuyruk 19: Banishment'tan dönen yaratığın altıgeni doluysa en yakın boş altıgene (SRD 5.2.1); anahtar `spellsK19`.
 */
function unstack(state: BattleState, id: string): BattleState {
  const c = state.combatants[id];
  if (!c?.pos || !state.map || !globalRule(state, 'spellsK19')) return state;
  const taken = (h: Offset) => Object.values(state.combatants).some((o) => o.id !== id && o.hp > 0 && o.pos && o.pos.col === h.col && o.pos.row === h.row
    && !(o.effects ?? []).some((e) => e.ethereal));
  if (!taken(c.pos)) return state;
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const seen = new Set([`${c.pos.col},${c.pos.row}`]);
  let ring: Offset[] = [c.pos];
  while (ring.length) {
    const next: Offset[] = [];
    for (const h of ring) for (const n of neighbors(h, size)) {
      const k = `${n.col},${n.row}`;
      if (seen.has(k) || !isInside(n, size)) continue;
      seen.add(k);
      if (terrainOf(state.map.tiles[n.row]?.[n.col] ?? '#').movement === 'blocked') continue;
      if (!taken(n)) return withCombatant(state, id, { pos: n });
      next.push(n);
    }
    ring = next;
  }
  return state;
}

/**
 * Kuyruk 19: Dominate: büyücünün tepkisi harcanmışsa yönetilen yaratık tepki veremez (`reactionLocked`, türetilmiş).
 */
/** Kuyruk K61 (sürüm 44): tepki bağı yalnız Dominate'te (`reactionLink`); sürüm 43 ve öncesinde her taraf değiştirme bağlar. */
const linksReaction = (state: BattleState, e: { reactionLink?: boolean }) => !!e.reactionLink || (state.kuralSurumu ?? 1) < 44;
function syncDominatedReactions(state: BattleState): BattleState {
  let next = state;
  for (const c of Object.values(state.combatants)) {
    const dom = c.hp > 0 ? (c.effects ?? []).find((e) => e.dominate && linksReaction(state, e)) : undefined;
    const lock = !!dom && globalRule(state, 'spellsK19') && !!state.combatants[dom.sourceId]?.economy.reaction;
    if (!!c.reactionLocked !== lock) next = withCombatant(next, c.id, { reactionLocked: lock || undefined });
  }
  return next;
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
const immuneTo = (c: Combatant, condition: string, state?: BattleState) => (c.effects ?? []).some((e) => e.immune?.includes(condition))
  // Kuyruk 18 H3: Nature's Ward (Circle of the Land 10): Poisoned bağışıklığı (anahtar naturesWard, kural sürümü 14).
  || (condition === 'Poisoned' && !!c.traits?.includes('natures-ward') && !!state && !!globalRule(state, 'naturesWard'));

/**
 * Süren etkilerin bitişi (Görev R2): kaynağın o büyüdeki konsantrasyonu bittiyse, süresi geçtiyse (`until` < tur),
 * taşıyan öldüyse ya da düşman 0 HP'ye indiyse.
 */
/** Görev S1: biten etkilerin verdiği durumlar düşer (başka süren etki aynı durumu vermiyorsa). */
function dropGranted(conditions0: string[], before: ActiveEffect[], after: ActiveEffect[], timers?: ConditionTimer[], round = 0): string[] {
  const conditions = restoreSuppressed(conditions0, before, after, timers, round);
  const lost = before.filter((e) => !after.includes(e)).flatMap((e) => e.grants ?? []);
  if (lost.length === 0) return conditions;
  const still = new Set(after.flatMap((e) => e.grants ?? []));
  return conditions.filter((x) => !lost.includes(x) || still.has(x));
}

/**
 * Kuyruk S1 (Calm Emotions, `suppressed`): biten bastırma etkisinin altındaki durumlar geri yazılır: süresiz olan her
 * zaman, süreli olan sayacı hâlâ duruyorsa (bastırma süresi sayaçtan düşer), bir etkiden gelen o etki sürüyorsa.
 */
function restoreSuppressed(conditions: string[], before: ActiveEffect[], after: ActiveEffect[], _timers?: ConditionTimer[], round = 0): string[] {
  const out = [...conditions];
  for (const s of suppressedBack(before, after, round)) if (!out.includes(s.condition)) out.push(s.condition);
  return out;
}

/** Kuyruk S1: biten bastırma etkilerinden geri gelecek durumlar (süreli olanın kalan sayacıyla). */
function suppressedBack(before: ActiveEffect[], after: ActiveEffect[], round: number): Array<{ condition: string; timer?: ConditionTimer }> {
  const ended = before.filter((e) => e.suppressed?.length && !after.some((x) => x.id === e.id));
  const out: Array<{ condition: string; timer?: ConditionTimer }> = [];
  for (const e of ended) for (const s of e.suppressed ?? []) {
    if (s.by && !after.some((x) => x.id === s.by)) continue;
    if (s.timer) {
      const left = s.timer.count - Math.max(0, round - (s.round ?? round));
      if (left <= 0) continue;
      out.push({ condition: s.condition, timer: { ...s.timer, count: left } });
    } else out.push({ condition: s.condition });
  }
  return out;
}

/** Kuyruk S1: withCombatant yaması (bastırılan süreli durum geri gelirse sayaç da). */
function suppressTimers(c: Combatant, before: ActiveEffect[], after: ActiveEffect[], round: number): { conditionTimers?: ConditionTimer[] } {
  const t = timersBack(c.conditionTimers, before, after, round);
  return t === c.conditionTimers ? {} : { conditionTimers: t };
}

/** Kuyruk S1: geri gelen süreli durumların sayaçları. */
function timersBack(timers: ConditionTimer[] | undefined, before: ActiveEffect[], after: ActiveEffect[], round: number): ConditionTimer[] | undefined {
  const back = suppressedBack(before, after, round).flatMap((x) => (x.timer ? [x.timer] : []));
  if (!back.length) return timers;
  return [...(timers ?? []).filter((t) => !back.some((b) => b.condition === t.condition)), ...back];
}

function pruneEffects(state: BattleState): BattleState {
  let next = state;
  const exile: string[] = [];
  for (const c of Object.values(state.combatants)) {
    if (!c.effects?.length) continue;
    const gone = c.life === 'dead' || (homeSide(c) === 'enemies' && c.hp <= 0 && !c.regenPending);
    const kept = gone ? [] : c.effects.filter((e) => {
      if (e.until !== undefined && e.until < state.round) { if (e.banishForever) exile.push(c.id); return false; }
      if (e.dropAtZero && c.hp <= 0) return false;
      // Kuyruk A2: yakalamaya bağlı etki yakalama bitince biter.
      if (e.whileGrappledBy && c.grapple?.by !== e.whileGrappledBy) return false;
      // Kuyruk 19: Incapacitated olunca biten etki (Superior Defense).
      if (e.breakOnIncapacitated && c.conditions.some((x) => ['Incapacitated', 'Stunned', 'Paralyzed', 'Unconscious', 'Petrified'].includes(x))) return false;
      if (e.concentration && state.combatants[e.sourceId]?.concentration?.spell !== e.concentration) return false;
      return true;
    });
    if (kept.length !== c.effects.length) {
      next = withCombatant(next, c.id, { effects: kept, conditions: dropGranted(c.conditions, c.effects, kept, c.conditionTimers, state.round), ...suppressTimers(c, c.effects, kept, state.round) });
      if (!gone) next = lethargyAfter(next, c, c.effects.filter((e) => !kept.includes(e)));
    }
  }
  // Kuyruk 19: Banishment'tan dönen (sürgün olmayan) yaratık dolu altıgende kalmaz.
  for (const c of Object.values(state.combatants)) {
    if (!exile.includes(c.id) && (c.effects ?? []).some((e) => e.banished) && !(next.combatants[c.id]?.effects ?? []).some((e) => e.banished)) next = unstack(next, c.id);
  }
  // Kuyruk 19: Banishment tam sürdü: yerli olmayan yaratık geri dönmez (savaştan çıkar).
  for (const id of exile) next = withCombatant(next, id, { hp: 0, pos: null, life: 'dead', conditions: [], concentration: null, effects: [], tempHp: 0, exiled: true });
  return next;
}

/** Tek kullanımlık zar eklentisi kullanıldıysa etkisi biter (olaydaki `bonusDice`). */
function consumeSingles(state: BattleState, event: BattleEvent): BattleState {
  const dice = 'bonusDice' in event ? event.bonusDice
    : event.type === 'effect_tick' ? event.save?.extra : undefined;
  let next = state;
  // Kuyruk 43: Legendary Resistance kilidi boss'un kendi turu başlayınca kalkar.
  if (event.type === 'turn_ended' && next.combatants[event.nextActorId]?.lrLock) next = withCombatant(next, event.nextActorId, { lrLock: false });
  // Kuyruk 19: Staggering Blow (sonraki save) ve Sundering Blow (başka yaratığın sonraki saldırısı) tek kullanımlık.
  if ((event.type === 'save_resolved' || event.type === 'condition_save') && next.combatants[event.targetId]?.effects?.some((e) => e.saveDisAll)) {
    next = dropEffects(next, event.targetId, (e) => !!e.saveDisAll);
  }
  // Kuyruk K54c: ilk zar etkisi (Yıldız Falı, Ölümsüz Taht) atılınca biter.
  if (event.type === 'attack_resolved' && next.combatants[event.actorId]?.effects?.some((e) => e.firstRoll?.on.includes('attack'))) {
    next = dropEffects(next, event.actorId, (e) => !!e.firstRoll?.on.includes('attack'));
  }
  if ((event.type === 'save_resolved' || event.type === 'condition_save') && next.combatants[event.targetId]?.effects?.some((e) => e.firstRoll?.on.includes('save'))) {
    next = dropEffects(next, event.targetId, (e) => !!e.firstRoll?.on.includes('save'));
  }
  if (event.type === 'attack_resolved' && next.combatants[event.targetId]?.effects?.some((e) => e.consumeOnAttacked && e.sourceId !== event.actorId)) {
    next = dropEffects(next, event.targetId, (e) => !!e.consumeOnAttacked && e.sourceId !== event.actorId);
  }
  for (const x of dice ?? []) {
    // Kuyruk P11: başarısız ilham zarı Bard'a döner.
    if (x.refund) {
      const h = next.combatants[x.refund.holderId];
      if (h) next = withCombatant(next, h.id, { resources: { ...h.resources, [x.refund.resource]: resourceLeft(h, x.refund.resource) + 1 } });
    }
    // Kuyruk 18 H3: Countercharm sahibinin tepkisini harcar.
    // Görev P6: ek paket girişleri (zar mührü, zorla sonuç) tepki + kaynak + tek kullanımlık etkiyi birlikte tüketir.
    const pk = !!x.effectId?.startsWith('pk-');
    if (x.reaction && x.holderId) {
      const h = next.combatants[x.holderId];
      // Kuyruk 19: Burst of Ingenuity tepki havuzunu da azaltır.
      if (h) next = withCombatant(next, h.id, { economy: { ...h.economy, reaction: true }, ...(x.pool ? { reactionUses: { ...h.reactionUses, [x.pool.id]: x.pool.remaining } } : {}) });
      if (!pk) continue;
    }
    // Görev F: ikinci şansın kaynağı (Indomitable, Stroke of Luck, Tactical Mind → Second Wind).
    if (x.resource && x.holderId) {
      const h = next.combatants[x.holderId];
      if (h) next = withCombatant(next, h.id, { resources: { ...h.resources, [x.resource]: Math.max(0, resourceLeft(h, x.resource) - 1) }, ...(x.resource === 'legendaryResistance' ? { lrLock: true } : {}) });
      if (!pk) continue;
    }
    if (pk && !x.single) continue;
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
    // Kuyruk 41b: Death Ward kullanıldı, biter.
    if (e.kind === 'death_ward') {
      // Kuyruk 19: Gift of the Protectors: tetiklenince bütün adlar silinir, uzun dinlenmeye dek yok.
      const gift = next.combatants[id]?.effects?.find((x) => x.id === e.effectId)?.giftOf;
      if (gift) {
        for (const o of Object.values(next.combatants)) if (o.effects?.some((x) => x.giftOf === gift)) next = dropEffects(next, o.id, (x) => x.giftOf === gift);
        const w = next.combatants[gift];
        if (w) next = withCombatant(next, gift, { resources: { ...w.resources, 'protectors-gift': 0 } });
      } else next = dropEffects(next, id, (x) => x.id === e.effectId);
    }
    if (e.kind === 'trait_fx') {
      const h = next.combatants[id];
      if (h && e.headsFire) next = withCombatant(next, id, { headsFire: true });
      else if (h && Object.keys(e.effect).length) next = withCombatant(next, id, { effects: [...(h.effects ?? []).filter((x) => x.id !== `srd19:${id}:fx:${e.name}`),
        { ...e.effect, id: `srd19:${id}:fx:${e.name}`, name: e.name, sourceId: id, until: next.round + 1 } as ActiveEffect] });
    }
    if (e.kind === 'relentless_endurance') {
      const h = next.combatants[id];
      if (h) next = withCombatant(next, id, { resources: { ...h.resources, relentlessEndurance: 0 } });
    }
    if (e.kind === 'relentless_rage') {
      const h = next.combatants[id];
      if (h) next = withCombatant(next, id, { resources: { ...h.resources, relentlessRage: Math.max(0, (h.resources.relentlessRage ?? 10) - 1) } });
    }
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
  return syncAuthority(syncRiders(syncDominatedReactions(syncAuras(syncAllegiance(trackPools(state, pruneZones(pruneEffects(pruneTimers(dropBrokenRage(dropBrokenConcentration(consumeSingles(breakOnAct(dropOnDamage(state, markDeaths(state, applyRaw(state, event)), event), event), event)))))), event))))));
}

/**
 * Görev B2: biten büyü alanları kalkar: süre doldu, büyücünün konsantrasyonu bitti (ya da büyücü öldü/kayboldu), alanın
 * bağlı olduğu yaratık (Flaming Sphere, ruh sürüsü) kayboldu.
 */
function pruneZones(state: BattleState): BattleState {
  const zones = state.map?.zones;
  if (!zones?.length) return state;
  const permanent: string[] = [];
  const kept = zones.filter((z) => {
    // Kuyruk 19: Wall of Stone: konsantrasyon tam süre sürdüyse duvar kalıcı (süre ve konsantrasyon bağı düşer).
    if (z.until !== undefined && z.until < state.round && z.concentration && state.combatants[z.casterId]?.concentration?.spell === z.concentration
      && spells.find((s) => s.id === z.spellId)?.mechanics.zone?.permanent && globalRule(state, 'spellsK19')) { permanent.push(z.id); return true; }
    if (z.until !== undefined && z.until < state.round) return false;
    const caster = state.combatants[z.casterId];
    if (z.concentration && caster?.concentration?.spell !== z.concentration) return false;
    if (z.anchorId) {
      const a = state.combatants[z.anchorId];
      if (!a || a.summon?.gone || a.hp <= 0 || !a.pos) return false;
    }
    return true;
  });
  const fixed = permanent.length ? kept.map((z) => (permanent.includes(z.id) ? { ...z, until: undefined, concentration: undefined } : z)) : kept;
  return kept.length === zones.length && !permanent.length ? state : { ...state, map: { ...(state.map as NonNullable<BattleState['map']>), zones: fixed } };
}

/** Görev B3: savaşçının bazı etkilerini kaldırır (verdiği durumlar da düşer). */
function dropEffects(state: BattleState, id: string, drop: (e: ActiveEffect) => boolean): BattleState {
  const c = state.combatants[id];
  if (!c?.effects?.some(drop)) return state;
  const kept = c.effects.filter((e) => !drop(e));
  return withCombatant(state, id, { effects: kept, conditions: dropGranted(c.conditions, c.effects, kept, c.conditionTimers, state.round), ...suppressTimers(c, c.effects, kept, state.round) });
}

/**
 * Görev K2c: olayın hasarını veren yaratık (saldıran, save'i isteyen büyücü, süregelen etkinin ya da büyü alanının
 * sahibi); harita, ortam ve kaynağı belirsiz hasarda undefined.
 */
function damageSourceId(before: BattleState, event: BattleEvent): string | undefined {
  switch (event.type) {
    case 'attack_resolved': case 'save_resolved': case 'extra_damage': return event.actorId;
    case 'effect_tick': return before.combatants[event.targetId]?.effects?.find((e) => e.id === event.effectId)?.sourceId;
    case 'zone_triggered': return before.map?.zones?.find((z) => z.id === event.zoneId)?.casterId;
    default: return undefined;
  }
}

/**
 * Görev B3: hasar alan (HP'si düşen) savaşçıda hasarla biten etkiler kalkar (Hypnotic Pattern…). Görev K2c:
 * `casterSide` etkiler (Charm Person, Animal Friendship) yalnızca hasarı koyanın tarafından biri verdiyse.
 */
function dropOnDamage(before: BattleState, after: BattleState, event: BattleEvent): BattleState {
  let next = after;
  const source = damageSourceId(before, event);
  const sourceSide = source ? before.combatants[source]?.side : undefined;
  const breaks = (e: ActiveEffect) => e.breakOnDamage === true
    || (e.breakOnDamage === 'casterSide' && sourceSide !== undefined && sourceSide === before.combatants[e.sourceId]?.side);
  for (const c of Object.values(after.combatants)) {
    const was = before.combatants[c.id];
    if (!was || c.hp >= was.hp) continue;
    if (c.effects?.some(breaks)) next = dropEffects(next, c.id, breaks);
    // Kuyruk A6 (sürüm 35): kayıtsızlık (Calm Emotions) kendisi ya da yanındaki (30 ft, görüş: harita yaklaşığı) dostu
    // hasar alınca biter.
    for (const o of Object.values(next.combatants)) {
      if (!o.effects?.some((e) => e.indifferentTo)) continue;
      const near = o.id === c.id || (o.side === c.side && !!o.pos && !!c.pos && distance(o.pos, c.pos) <= 6);
      if (near) next = dropEffects(next, o.id, (e) => !!e.indifferentTo);
    }
    // Görev WIZARD (Sleep): hasar alan uyanır (hasarla biten süreli durumlar).
    const cur = next.combatants[c.id] as Combatant;
    const woke = (cur.conditionTimers ?? []).filter((t) => t.wakeOnDamage);
    if (woke.length && cur.hp > 0) {
      next = withCombatant(next, c.id, {
        conditionTimers: (cur.conditionTimers ?? []).filter((t) => !t.wakeOnDamage),
        conditions: cur.conditions.filter((x) => !woke.some((t) => t.condition === x)),
      });
    }
  }
  // Kuyruk A6 (sürüm 35): hasar veren (Invisibility "deals damage") etkisi biter.
  const dealer = source ? next.combatants[source] : undefined;
  if (dealer?.effects?.some((e) => e.breakOnDamageDealt) && Object.values(after.combatants).some((c) => c.hp < (before.combatants[c.id]?.hp ?? c.hp))) {
    next = dropEffects(next, dealer.id, (e) => !!e.breakOnDamageDealt);
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
/** Kuyruk 19 (Epic Boon): Peerless Aim ve Blink Steps kendi turunun başında dolar. */
function boonRefill(c: Combatant): Record<string, number> | null {
  const out: Record<string, number> = {};
  for (const [t, r] of Object.entries(BOON_TURN_REFILL)) if (c.traits?.includes(t) && resourceLeft(c, r) < 1) out[r] = 1;
  return Object.keys(out).length ? out : null;
}

function breakOnAct(state: BattleState, event: BattleEvent): BattleState {
  // Kuyruk 19 (Merge with Shadows): eylem, bonus eylem ya da tepki.
  const anyId = event.type === 'action_used' && event.kind !== 'attack' ? event.actorId : event.type === 'reaction_used' ? event.actorId : null;
  if (anyId && state.combatants[anyId]?.effects?.some((e) => e.breakOnAnyAct)) {
    const c0 = state.combatants[anyId] as Combatant;
    const kept0 = (c0.effects ?? []).filter((e) => !e.breakOnAnyAct);
    state = withCombatant(state, c0.id, { effects: kept0, conditions: dropGranted(c0.conditions, c0.effects ?? [], kept0, c0.conditionTimers, state.round), ...suppressTimers(c0, c0.effects ?? [], kept0, state.round) });
  }
  const id = event.type === 'attack_resolved' || event.type === 'spell_cast' ? event.actorId : null;
  const c = id ? state.combatants[id] : undefined;
  // Görev B1: tek saldırılık dezavantaj (Ray of Enfeeblement başarılı save) ilk saldırıdan sonra biter.
  const single = (e: ActiveEffect) => event.type === 'attack_resolved' && !!e.attackDis?.single;
  if (!c?.effects?.some((e) => e.breakOnAct || single(e))) return state;
  const kept = c.effects.filter((e) => !e.breakOnAct && !single(e));
  return withCombatant(state, c.id, { effects: kept, conditions: dropGranted(c.conditions, c.effects, kept, c.conditionTimers, state.round), ...suppressTimers(c, c.effects, kept, state.round) });
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
      // Kuyruk 19 (SRD Ammunition): cephane azalır.
      if (event.ammo) {
        const sh = state.combatants[event.actorId];
        if (sh?.ammo) state = withCombatant(state, sh.id, { ammo: { ...sh.ammo, [event.ammo]: Math.max(0, (sh.ammo[event.ammo] ?? 0) - 1) } });
      }
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
        next = withCombatant(next, hitter.id, { economy: { ...hitter.economy, meleeHit: { targetId: event.targetId, critical: event.critical, ...(event.martialArts ? { martialArts: true } : {}), ...(event.pact ? { pact: true } : {}) } } });
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
      // Kuyruk 19 (11–20): Thief's Reflexes: yansıma turunda sıra kaldığı yerden sürer.
      if (event.reflex !== undefined) next = { ...next, reflexResume: event.reflex, reflexDone: [...(state.reflexDone ?? []), event.nextActorId] };
      else if (state.reflexResume !== undefined) { const { reflexResume: _r, ...rest } = next; next = rest as BattleState; }
      // Rage: biten turun uzatması harcandı; sonraki turunda yeniden uzatılmalı.
      const ender = next.combatants[event.actorId];
      if (ender?.rage?.refreshed) next = withCombatant(next, ender.id, { rage: { ...ender.rage, refreshed: false } });
      // Kuyruk 19 (11–20): "geçerli turun sonuna dek" süren etkiler (Superior Hunter's Defense) biten turla biter.
      for (const c of Object.values(next.combatants)) {
        if (c.effects?.some((e) => e.turnEndOf === event.actorId)) next = withCombatant(next, c.id, { effects: c.effects.filter((e) => e.turnEndOf !== event.actorId) });
      }
      // Kuyruk 19 (Time Stop): ek tur harcandı; bitince kalkar.
      if (next.timeStop && event.actorId === next.timeStop.actorId && event.nextActorId === next.timeStop.actorId) {
        next = { ...next, timeStop: { ...next.timeStop, left: next.timeStop.left - 1 }, timeStopTurn: (next.timeStopTurn ?? 0) + 1 };
      } else if (next.timeStop || next.timeStopTurn) {
        const { timeStop: _t, timeStopTurn: _n, ...rest } = next;
        next = (next.timeStop && event.nextActorId === next.timeStop.actorId ? { ...rest, timeStop: next.timeStop } : rest) as BattleState;
      }
      // Kuyruk 19 (Marilith Reactive): her turda bir tepki.
      for (const c of Object.values(next.combatants)) {
        if ((c.traits?.includes('reactive') || c.effects?.some((e) => e.pkReactive)) && c.economy.reaction) next = withCombatant(next, c.id, { economy: { ...c.economy, reaction: false } });
      }
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
      const nx = next.combatants[event.nextActorId];
      // Kuyruk 18 H3: Heroic Warrior (Champion 10): tur başında Heroic Inspiration yoksa gelir (anahtar heroicWarrior).
      const heroic = nx?.traits?.includes('heroic-warrior') && globalRule(next, 'heroicWarrior') && resourceLeft(nx, 'heroicInspiration') < 1;
      return nx
        ? withCombatant(next, event.nextActorId, {
          movementUsed: 0, run: null,
          economy: { ...FRESH_ECONOMY, slotTurn: nx.economy.slotTurn },
          ...(heroic || boonRefill(nx) ? { resources: { ...nx.resources, ...(heroic ? { heroicInspiration: 1 } : {}), ...boonRefill(nx) } } : {}),
        })
        : next;
    }
    case 'placed':
      return withCombatant(state, event.actorId, { pos: event.at });
    case 'dice_rolled':
    case 'distracted':
      return state;
    case 'moral_changed': return withCombatant(state, event.targetId, { moral: event.moral });
    case 'item_used': {
      const c = state.combatants[event.actorId];
      if (!c) return state;
      return withCombatant(state, c.id, { consumables: { ...(c.consumables ?? {}), [event.itemId]: event.left } });
    }
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
      let moved = withCombatant(state, event.actorId, event.free
        ? { pos: last ?? c.pos, run, economy: { ...c.economy, shiftLeft: Math.max(0, (c.economy.shiftLeft ?? 0) - event.cost) } }
        : { pos: last ?? c.pos, movementUsed: c.movementUsed + event.cost, run });
      // Kuyruk 19: Resilient Sphere: taşınan küre taşıyanın bir arkasındaki altıgende kalır.
      const behind = event.path.length > 1 ? event.path[event.path.length - 2] : c.pos;
      for (const o of Object.values(state.combatants)) {
        if (behind && o.hp > 0 && (o.effects ?? []).some((e) => e.sealed && e.carriedBy === c.id)) moved = withCombatant(moved, o.id, { pos: behind });
      }
      return moved;
    }
    case 'jumped': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return withCombatant(state, event.actorId, {
        pos: event.to, movementUsed: c.movementUsed + event.cost, run: null,
        ...(event.traitTurns ? { traitTurns: { ...c.traitTurns, ...event.traitTurns } } : {}),
      });
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
      if (event.pactOnly) economy.pactOnly = true;
      if (event.extraBonus) economy.bonusExtraUsed = (economy.bonusExtraUsed ?? 0) + 1;
      if (event.packMoved) economy.packMoved = true;
      if (event.fleet) economy.fleetUsed = true;
      if (event.apotheosis) economy.apotheosisUsed = true;
      if (event.loadingFired) economy.loadingFired = true;
      // Yeni eylem (Attack): önceki eylemin Loading atışı sayılmaz.
      if (event.kind === 'action' && !event.loadingFired) economy.loadingFired = false;
      // Kuyruk A6: önce alınan Haste eylemi kullanıldı: asıl eylem geri gelir (kısıtsız).
      if (event.kind === 'action' && economy.hasteFirst) { economy.action = false; economy.attacksLeft = 0; economy.hasted = false; economy.hasteFirst = false; }
      return withCombatant(state, event.actorId, { economy });
    }
    case 'summon_steered': {
      const c = state.combatants[event.summonId];
      return c ? withCombatant(state, c.id, { movementUsed: 0, run: null }) : state;
    }
    case 'haste_action': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      // Kuyruk K54c: Ferman'ın ek eylemi bir kez.
      const once = (c.effects ?? []).some((e) => e.extraActionOnce);
      // Kuyruk A6: önce alınan ek eylem (asıl eylem sonra geri gelir; `hasteFirst`).
      if (event.first) return withCombatant(state, c.id, { economy: { ...c.economy, hasted: true, hasteUsed: true, hasteFirst: true },
        ...(once ? { effects: (c.effects ?? []).filter((e) => !e.extraActionOnce) } : {}) });
      return withCombatant(state, c.id, { economy: { ...c.economy, action: false, attacksLeft: 0, hasted: true, hasteUsed: true },
        ...(once ? { effects: (c.effects ?? []).filter((e) => !e.extraActionOnce) } : {}) });
    }
    case 'reaction_used': {
      // Tepki hakkı harcanır (Görev R1): kendi turunun başında yenilenir (turn_ended).
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      const next = withCombatant(state, c.id, {
        economy: { ...c.economy, reaction: true },
        ...(event.mark ? { marks: [...(c.marks ?? []).filter((m) => m.kind !== event.mark?.kind), event.mark] } : {}),
        ...(event.pool ? { reactionUses: { ...c.reactionUses, [event.pool.id]: event.pool.remaining } } : {}),
        ...(event.resource ? { resources: { ...c.resources, [event.resource.id]: event.resource.remaining } } : {}),
        ...(event.recharge ? { reactionSpent: [...(c.reactionSpent ?? []).filter((x) => x !== event.reaction), event.reaction] } : {}),
      });
      // Kuyruk 19: Dominate: yönetilen yaratığın tepkisi büyücünün tepkisini de harcar (SRD 5.2.1).
      const dom = (c.effects ?? []).find((e) => e.dominate && linksReaction(state, e));
      const owner = dom && globalRule(state, 'spellsK19') ? next.combatants[dom.sourceId] : undefined;
      return owner ? withCombatant(next, owner.id, { economy: { ...owner.economy, reaction: true } }) : next;
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
      let next = withCombatant(state, c.id, { effects: kept, conditions: dropGranted(c.conditions, c.effects ?? [], kept, c.conditionTimers, state.round), ...suppressTimers(c, c.effects ?? [], kept, state.round) });
      if ((c.effects ?? []).some((e) => e.id === event.effectId && e.banished)) next = unstack(next, c.id);
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
    case 'sanctuary_save': {
      // Kuyruk A6 (sürüm 35): başarısızsa saldıran bu turda o korunanı yeniden hedefleyemez (`retarget`: tur anahtarı).
      const a = state.combatants[event.actorId];
      if (!event.retarget || event.success || !a) return state;
      const prev = a.sanctuaryLost?.turn === event.retarget ? a.sanctuaryLost.ids : [];
      return withCombatant(state, a.id, { sanctuaryLost: { turn: event.retarget, ids: [...prev, event.targetId] } });
    }
    case 'curse_save':
      return state;
    case 'bond_damage':
      return withEffects(withCombatant(state, event.targetId, { hp: event.targetHpAfter }), event.targetId, event.effects);
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
    case 'buff_removed': {
      const c = state.combatants[event.targetId];
      return c ? withCombatant(state, c.id, { buffs: (c.buffs ?? []).filter((b) => b.source !== event.source) }) : state;
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
    case 'legendary_used': {
      const c = state.combatants[event.actorId];
      if (!c) return state;
      return { ...state, combatants: { ...state.combatants, [c.id]: { ...c, legendaryLeft: event.left, legendaryUsed: [...(c.legendaryUsed ?? []), event.actionId] } } };
    }
    case 'legendary_refresh': {
      const c = state.combatants[event.actorId];
      if (!c) return state;
      return { ...state, combatants: { ...state.combatants, [c.id]: { ...c, legendaryLeft: event.left, legendaryUsed: [] } } };
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
      if (event.hornRound !== undefined) map.hornRound = event.hornRound;
      if (event.avalancheRound !== undefined) map.avalancheRound = event.avalancheRound;
      if (event.floodRound !== undefined) map.floodRound = event.floodRound;
      if (event.crackIce) map.crackedIce = [...(map.crackedIce ?? []), key(event.crackIce)];
      const flags = event.flag && !(state.flags ?? []).includes(event.flag) ? { flags: [...(state.flags ?? []), event.flag] } : {};
      return { ...state, map, ...flags };
    }
    case 'dashed': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return withCombatant(state, event.actorId, { economy: { ...c.economy, dashes: c.economy.dashes + 1 } });
    }
    case 'initiative_swapped': {
      const a = state.combatants[event.actorId];
      const b = state.combatants[event.allyId];
      if (!a || !b) return state;
      const order = state.order.map((id) => (id === a.id ? b.id : id === b.id ? a.id : id));
      return { ...withCombatant(withCombatant(state, a.id, { initiative: b.initiative }), b.id, { initiative: a.initiative }), order };
    }
    case 'shift_granted': {
      const c = state.combatants[event.actorId];
      if (!c) return state;
      return withCombatant(state, event.actorId, { economy: { ...c.economy, shiftLeft: event.hexes } });
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
    case 'shape_changed': {
      // Görev DRUID: Wild Shape: biçimin değerleri uygulanır, eskileri `prev`te; bırakınca geri gelir.
      const c = state.combatants[event.actorId];
      if (!c) return state;
      const base = c.shape?.prev ?? { ac: c.ac, speed: c.speed, fly: c.fly, size: c.size, modifiers: c.modifiers, saves: c.saves,
        weaponOptions: c.weaponOptions, attacksPerAction: c.attacksPerAction, avatar: c.avatar,
        // Kuyruk 18 H2: Polymorph canavar saldırılarını da değiştirir.
        ...(event.stats?.attacks ? { attacks: c.attacks, multiattack: c.multiattack } : {}) };
      if (!event.stats) {
        // Kuyruk K48: Örümcek Biçimi bitince biçim canı (geçici HP) da gider.
        const { shape: _s, ...rest0 } = c;
        const rest = c.shape?.spider ? { ...rest0, tempHp: 0 } : rest0;
        return withCombatant({ ...state, combatants: { ...state.combatants, [c.id]: rest as Combatant } }, c.id, base);
      }
      const s = event.stats;
      return withCombatant(state, c.id, { shape: { ...s, prev: base }, ac: s.ac, speed: s.speed, fly: s.fly, size: s.size, modifiers: s.modifiers,
        saves: s.saves, weaponOptions: s.weaponOptions, attacksPerAction: s.attacksPerAction, avatar: s.avatar,
        ...(s.attacks ? { attacks: s.attacks, multiattack: !!s.multiattack } : {}) });
    }
    case 'trait_turn': {
      const c = state.combatants[event.actorId];
      return c ? withCombatant(state, c.id, { traitTurns: { ...c.traitTurns, [event.trait]: event.key } }) : state;
    }
    case 'slot_created': {
      const c = state.combatants[event.actorId];
      if (!c) return state;
      const slots = [...c.spellSlots];
      slots[event.level - 1] = (slots[event.level - 1] ?? 0) + 1;
      return withCombatant(state, event.actorId, { spellSlots: slots });
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
      const conditions = [...c.conditions, ...event.conditionsAdded.filter((x) => !c.conditions.includes(x) && !immuneTo(c, x, state) && !wardedFrom(state, c.id, event.actorId, x))];
      let next = withCombatant(state, event.targetId, { hp: event.targetHpAfter, conditions });
      for (const x of event.conditionsAdded) next = linkCondition(next, event.actorId, event.label, event.targetId, x);
      const caster = next.combatants[event.actorId];
      if (event.aura && caster?.concentration) {
        const auraHits = { ...caster.concentration.auraHits, [event.targetId]: event.aura.turn };
        next = withCombatant(next, caster.id, { concentration: { ...caster.concentration, auraHits } });
      }
      return withEffects(next, event.targetId, event.effects);
    }
    case 'summons_commanded': {
      const c = state.combatants[event.actorId];
      return c ? withCombatant(state, c.id, { economy: { ...c.economy, summonCommand: true } }) : state;
    }
    case 'exiled': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      return withCombatant(state, c.id, { hp: 0, pos: null, life: 'dead', conditions: [], concentration: null, effects: [], tempHp: 0, exiled: true });
    }
    case 'concentration_ended':
      return endConcentration(state, event.actorId);
    case 'max_hp_drained': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      const maxHp = Math.max(0, c.maxHp - event.amount);
      if (maxHp === 0) return withCombatant(state, c.id, { maxHp, hp: 0, life: 'dead', concentration: null, maxHpLoss: (c.maxHpLoss ?? 0) + event.amount });
      return withCombatant(state, c.id, { maxHp, hp: Math.min(c.hp, maxHp), maxHpLoss: (c.maxHpLoss ?? 0) + event.amount });
    }
    case 'ability_drained': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      const prev = c.abilityLoss?.[event.ability] ?? { amount: 0, mod: 0 };
      const ab = event.ability;
      const patch: Partial<Combatant> = {
        abilityLoss: { ...c.abilityLoss, [ab]: { amount: prev.amount + event.amount, mod: prev.mod + event.modDelta } },
        modifiers: { ...c.modifiers, [ab]: c.modifiers[ab] + event.modDelta }, saves: { ...c.saves, [ab]: c.saves[ab] + event.modDelta },
      };
      return withCombatant(state, c.id, event.dies ? { ...patch, hp: 0, life: 'dead', concentration: null } : patch);
    }
    case 'drain_restored': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      if (event.what === 'maxHp') return withCombatant(state, c.id, { maxHp: c.maxHp + (c.maxHpLoss ?? 0), maxHpLoss: undefined });
      const loss = c.abilityLoss?.[event.what];
      if (!loss) return state;
      const ab = event.what;
      const rest = { ...c.abilityLoss }; delete rest[ab];
      return withCombatant(state, c.id, { abilityLoss: Object.keys(rest).length ? rest : undefined,
        modifiers: { ...c.modifiers, [ab]: c.modifiers[ab] - loss.mod }, saves: { ...c.saves, [ab]: c.saves[ab] - loss.mod } });
    }
    case 'hit_die_spent': {
      const c = state.combatants[event.actorId];
      return c?.hitDice ? withCombatant(state, event.actorId, { hitDice: { ...c.hitDice, left: event.left } }) : state;
    }
    case 'healed': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      // Kuyruk 19 (Swarm, Mucus Cloud): HP kazanamaz.
      if ((c.effects?.some((e) => e.noHeal) || c.auraNoHeal) && event.targetHpAfter > c.hp) return state;
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
      if (event.present && !has && immuneTo(c, event.condition, state)) return state;
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
        ...(event.pounce ? { movementUsed: c.movementUsed - event.pounce } : {}),
        ...(event.cleared?.length ? { conditions: c.conditions.filter((x) => !event.cleared?.includes(x)) } : {}),
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
    case 'surface_reacted': {
      // Kuyruk K55: zincirle çalışan ikililer turda bir kez (çözücü okur).
      if (!event.pairs?.length) return state;
      const turn = `${state.round}:${state.turnIndex}`;
      const prev = state.hexReacted?.turn === turn ? state.hexReacted.keys : [];
      return { ...state, hexReacted: { turn, keys: [...prev, ...event.pairs] } };
    }
    case 'object_placed':
      return state.map ? { ...state, map: { ...state.map, objects: [...(state.map.objects ?? []).filter((o) => o.id !== event.object.id), event.object] } } : state;
    case 'object_removed':
    case 'object_destroyed':
      return state.map ? { ...state, map: { ...state.map, objects: (state.map.objects ?? []).filter((o) => o.id !== event.objectId) } } : state;
    case 'object_damaged':
      return state.map ? { ...state, map: { ...state.map, objects: (state.map.objects ?? []).map((o) => (o.id === event.objectId ? { ...o, hp: event.hpAfter } : o)) } } : state;
    case 'object_changed':
      if (!state.map || (!event.state && event.carriedBy === undefined && !event.at && !event.found && event.light === undefined && event.outlined === undefined
        && event.altitudeFt === undefined && event.levitatedBy === undefined && event.resized === undefined && event.hp === undefined)) return state;
      return { ...state, map: { ...state.map, objects: (state.map.objects ?? []).map((o) => {
        if (o.id !== event.objectId) return o;
        // Görev S3: taşıma (retrieve): `carriedBy` null bırakır, `at` düştüğü yer.
        const { carriedBy: _c, ...rest0 } = o;
        // Kuyruk A7: nesne ışığı (Light, Continual Flame); null kaldırır.
        const { light: _l, lightSpell: _ls, lightBy: _lb, ...bare } = rest0;
        const rest = event.light === undefined ? rest0 : event.light === null ? bare : { ...bare, light: event.light.r, lightSpell: event.light.spell, lightBy: event.light.by };
        const carried = event.carriedBy === undefined ? o.carriedBy : event.carriedBy ?? undefined;
        const base = { ...rest, ...(event.state ? { state: event.state } : {}), ...(event.at ? { at: event.at } : {}), ...(carried ? { carriedBy: carried } : {}), ...(event.found ? { found: true } : {}), ...(event.outlined !== undefined ? { outlined: event.outlined } : {}),
          ...(event.altitudeFt !== undefined ? { altitudeFt: event.altitudeFt } : {}), ...(event.hp !== undefined ? { hp: event.hp } : {}) };
        // Kuyruk S2: Levitate ve boyut büyüsü (null kaldırır).
        const { levitatedBy: _lv, ...noLev } = base;
        const lev = event.levitatedBy === undefined ? base : event.levitatedBy === null ? noLev : { ...base, levitatedBy: event.levitatedBy };
        const { resized: _rz, resizedBy: _rb, baseHp: _bh, ...noSize } = lev;
        return event.resized === undefined ? lev : event.resized === null ? noSize : { ...lev, resized: event.resized, resizedBy: event.resizedBy, baseHp: lev.baseHp ?? o.hp };
      }) }, ...(((): Partial<BattleState> => {
        // Kuyruk 36: doğaçlama silah taşıyanın silah seçeneklerine eklenir.
        const who = event.arm && event.carriedBy ? state.combatants[event.carriedBy] : undefined;
        return who && event.arm ? { combatants: { ...state.combatants, [who.id]: { ...who, weaponOptions: [...(who.weaponOptions ?? []), event.arm] } } } : {};
      })()) };
    case 'groups_formed': {
      // Görev S4: grup üyeleri: uyuyan `asleep`, habersiz `unaware`.
      const groups = (state.groups ?? []).map((g) => ({ ...g, members: event.members[g.id] ?? [] }));
      const combatants = { ...state.combatants };
      for (const g of groups) for (const id of g.members) {
        const c = combatants[id];
        if (c) combatants[id] = { ...c, group: g.id, ...(g.state === 'asleep' ? { asleep: true } : {}), ...(g.state === 'calm' ? { unaware: true } : {}) };
      }
      return { ...state, groups, combatants };
    }
    case 'patrol_moved':
      return { ...state, groups: (state.groups ?? []).map((g) => (g.id === event.groupId ? { ...g, routeIndex: event.index, waitUntil: event.waitUntil } : g)) };
    case 'group_alarmed': {
      const combatants = { ...state.combatants };
      const g0 = state.groups?.find((g) => g.id === event.groupId);
      for (const id of g0?.members ?? []) {
        const c = combatants[id];
        if (!c) continue;
        const { unaware: _u, ...rest } = c;
        combatants[id] = { ...rest, asleep: false, ...(event.initiatives[id] !== undefined ? { initiative: event.initiatives[id] as number } : {}) };
      }
      return {
        ...state, combatants, order: [...event.order], turnIndex: event.turnIndex, alarmRound: state.alarmRound ?? event.round,
        groups: (state.groups ?? []).map((g) => (g.id === event.groupId ? { ...g, state: 'alarmed' as const, alarmedRound: event.round } : g)),
      };
    }
    case 'goal_changed':
      return state.goals ? { ...state, goals: { ...state.goals, status: { ...state.goals.status, [event.goalId]: event.status } } } : state;
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
    case 'explore_step': {
      const c = state.combatants[event.actorId];
      return c ? { ...state, combatants: { ...state.combatants, [c.id]: { ...c, movementUsed: 0, economy: { ...c.economy, dashes: 0 } } } } : state;
    }
    case 'floor_changed':
      return applyFloorChange(state, event);
    case 'zone_moved':
      return state.map ? { ...state, map: { ...state.map, zones: (state.map.zones ?? []).map((z) => (z.id === event.zoneId ? { ...z, hexes: event.hexes, ...(event.until !== undefined ? { until: event.until } : {}), ...(event.center ? { center: event.center } : {}) } : z)) } } : state;
    case 'zone_triggered':
      return state.map ? { ...state, map: { ...state.map, zones: (state.map.zones ?? []).map((z) => (z.id === event.zoneId
        ? { ...z, hits: { ...Object.fromEntries(Object.entries(z.hits ?? {}).filter(([, t]) => t === event.turn)), [event.targetId]: event.turn } } : z)) } } : state;
    case 'zone_panel_damaged': {
      const k = `${event.hex.col},${event.hex.row}`;
      return state.map ? { ...state, map: { ...state.map, zones: (state.map.zones ?? []).map((z) => (z.id === event.zoneId ? { ...z, panelDamage: { ...z.panelDamage, [k]: (z.panelDamage?.[k] ?? 0) + event.amount } } : z)) } } : state;
    }
    case 'zone_dealt':
      return state.map ? { ...state, map: { ...state.map, zones: (state.map.zones ?? []).map((z) => (z.id === event.zoneId ? { ...z, dealt: (z.dealt ?? 0) + event.amount } : z)) } } : state;
    case 'zone_ended': {
      if (!state.map) return state;
      // Kuyruk 19: dönüştürülen zemin (Control Water) alan bitince eski hâline döner.
      const gone = (state.map.zones ?? []).find((z) => z.id === event.zoneId);
      let tiles = state.map.tiles;
      for (const r of gone?.restore ?? []) tiles = tiles.map((row, i) => (i === r.at.row ? row.slice(0, r.at.col) + r.ch + row.slice(r.at.col + 1) : row));
      return { ...state, map: { ...state.map, tiles, zones: (state.map.zones ?? []).filter((z) => z.id !== event.zoneId) } };
    }
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
    case 'mounted': {
      const c = state.combatants[event.actorId];
      const m = state.combatants[event.mountId];
      if (!c || !m) return state;
      const s1 = withCombatant(state, c.id, { riding: m.id, pos: m.pos, movementUsed: c.movementUsed + event.cost });
      return withCombatant(s1, m.id, { rider: c.id });
    }
    case 'dismounted': {
      const c = state.combatants[event.actorId];
      if (!c) return state;
      const { riding: mid, ...rest } = c;
      let s1: BattleState = { ...state, combatants: { ...state.combatants, [c.id]: { ...rest, pos: event.at, movementUsed: c.movementUsed + event.cost } as Combatant } };
      const m = mid ? s1.combatants[mid] : undefined;
      if (m) { const { rider: _r, ...mr } = m; s1 = { ...s1, combatants: { ...s1.combatants, [m.id]: mr as Combatant } }; }
      return s1;
    }
    case 'teleported': {
      const c = state.combatants[event.actorId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.actorId}`);
      return withCombatant(state, c.id, { pos: event.to, ...(event.cost ? { movementUsed: c.movementUsed + event.cost } : {}),
        ...(event.stride ? { economy: { ...c.economy, treeStride: true } } : {}) });
    }
    case 'ability_recharge': {
      const c = state.combatants[event.actorId];
      if (!c) return state;
      const have = c.abilityRecharge ?? [];
      if (event.used) return withCombatant(state, event.actorId, { abilityRecharge: have.includes(event.abilityId) ? have : [...have, event.abilityId] });
      return event.recharged ? withCombatant(state, event.actorId, { abilityRecharge: have.filter((x) => x !== event.abilityId) }) : state;
    }
    case 'time_stop':
      return { ...state, timeStop: { actorId: event.actorId, left: event.turns } };
    case 'time_stop_ended': {
      const { timeStop: _t, ...rest } = state;
      return rest as BattleState;
    }
    case 'heads_changed':
      return withCombatant(state, event.actorId, { heads: event.heads, headsLost: event.lost, headsFire: event.fire, headsTurnHp: event.turnHp });
    case 'burst_done':
      return withCombatant(state, event.actorId, { burstDone: true });
    case 'ai_role_set': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      const { aiRole: _old, ...rest } = c;
      void _old;
      return { ...state, combatants: { ...state.combatants, [c.id]: event.role ? { ...rest, aiRole: event.role } : rest } };
    }
    case 'exhaustion_changed': {
      const c = state.combatants[event.targetId];
      if (!c) throw new Error(`Savaşçı bulunamadı: ${event.targetId}`);
      // SRD 5.2.1: 6. seviyede ölür.
      if (event.level >= 6) return withCombatant(state, c.id, { exhaustion: event.level, hp: 0, life: 'dead', concentration: null });
      return withCombatant(state, c.id, { exhaustion: event.level });
    }
    case 'item_dropped': {
      const c = state.combatants[event.actorId];
      if (!c) return state;
      const next = withCombatant(state, c.id, { dropped: [...new Set([...(c.dropped ?? []), event.item])], weaponOptions: c.weaponOptions.filter((o) => o.weaponId !== event.item) });
      if (!event.objectId || !event.at || !next.map) return next;
      return { ...next, map: { ...next.map, objects: [...(next.map.objects ?? []), { id: event.objectId, kind: 'droppedItem', at: event.at, hp: 5, item: event.item, options: event.options ?? [] }] } };
    }
    case 'item_picked': {
      const c = state.combatants[event.actorId];
      const o = state.map?.objects?.find((x) => x.id === event.objectId);
      if (!c || !o || !state.map) return state;
      const next = withCombatant(state, c.id, { dropped: (c.dropped ?? []).filter((x) => x !== o.item), weaponOptions: [...c.weaponOptions, ...(o.options ?? [])],
        economy: event.bond ? c.economy : { ...c.economy, interacted: true } });
      return { ...next, map: { ...(next.map as NonNullable<BattleState['map']>), objects: (next.map?.objects ?? []).filter((x) => x.id !== o.id) } };
    }
    case 'zone_spotted':
      return state.map ? { ...state, map: { ...state.map, zones: (state.map.zones ?? []).map((z) => (z.id === event.zoneId ? { ...z, seenBy: [...new Set([...(z.seenBy ?? []), ...event.by])] } : z)) } } : state;
    case 'altitude_changed': {
      if (event.objectId) {
        return state.map ? { ...state, map: { ...state.map, objects: (state.map.objects ?? []).map((o) => (o.id === event.objectId
          ? (event.altitudeFt > 0 ? { ...o, altitudeFt: event.altitudeFt } : (({ altitudeFt: _a, ...rest }) => rest)(o)) : o)) } } : state;
      }
      const c = event.targetId ? state.combatants[event.targetId] : undefined;
      if (!c) return state;
      const prev = c.vertTurn && c.vertTurn.turn === event.turn ? c.vertTurn.ft : 0;
      // Kuyruk K68b: tırmanma işareti tırmanma olayıyla gelir, irtifa 0'a (ya da altına) inince kalkar.
      const climbing = event.altitudeFt > 0 && (event.climb || c.climbing) ? { climbing: true as const } : {};
      const base = c.climbing && !climbing.climbing ? { ...state, combatants: { ...state.combatants, [c.id]: (({ climbing: _c, ...rest }) => rest)(c) } } : state;
      return withCombatant(base, c.id, { altitudeFt: event.altitudeFt, altitudeGentle: event.altitudeFt > 0 ? (event.gentle ?? c.altitudeGentle ?? false) : false, ...climbing, ...(event.cost ? { movementUsed: c.movementUsed + event.cost } : {}),
        ...(event.turn ? { vertTurn: { turn: event.turn, ft: prev + (event.moved ?? 0) } } : {}) });
    }
    case 'retreated': {
      let next = state;
      for (const id of event.ids) {
        const c = next.combatants[id];
        if (c) next = withCombatant(next, id, { pos: null, offFloor: 'duzlem', floorPos: c.pos ?? undefined });
      }
      return next;
    }
    case 'possessed': {
      // Kuyruk K64a (sürüm 48): bedene etki (Incapacitated: ev sahibi kontrolü kaybeder), ele geçiren haritadan çekilir.
      const h = state.combatants[event.hostId];
      const g = state.combatants[event.possessorId];
      if (!h || !g) return state;
      const effect: ActiveEffect = { id: `possess:${g.id}`, name: event.label, sourceId: g.id, possessed: true, until: event.until,
        ...(event.incap ? { grants: ['Incapacitated'] } : {}) };
      const next = applyRaw(state, { type: 'effect_added', targetId: h.id, effect });
      return withCombatant(next, g.id, { pos: null, offFloor: POSSESS_FLOOR, floorPos: g.pos ?? undefined, possessing: h.id });
    }
    case 'possession_ended': {
      let next = state;
      const h = next.combatants[event.hostId];
      if (h) {
        if ((h.effects ?? []).some((e) => e.id === `possess:${event.possessorId}`)) {
          next = applyRaw(next, { type: 'effect_ended', targetId: h.id, effectId: `possess:${event.possessorId}`, name: event.label, reason: 'dispelled' });
        }
        const h2 = next.combatants[h.id] as Combatant;
        next = withCombatant(next, h.id, { possessionImmune: [...new Set([...(h2.possessionImmune ?? []), event.possessorId])] });
      }
      const g = next.combatants[event.possessorId];
      if (g?.possessing) {
        const { offFloor: _o, floorPos, possessing: _p, ...rest } = g;
        // Kuyruk K64b: sürgün edilen (Dismissal) ele geçiren haritaya dönmez.
        next = { ...next, combatants: { ...next.combatants, [g.id]: { ...rest, pos: g.exiled ? null : event.to ?? floorPos ?? null } as Combatant } };
      }
      return next;
    }
    case 'possession_resisted': {
      const h = state.combatants[event.hostId];
      return h ? withCombatant(state, h.id, { possessionImmune: [...new Set([...(h.possessionImmune ?? []), event.possessorId])] }) : state;
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
    case 'hp_pool_created': case 'hp_pool_synced':
      return applyPoolEvent(state, event);
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
