/**
 * Görev S2: harita nesneleri (docs/harita/SEFER-TASARIMI.md §2; veri `data/nesneler.json`, zemin etkisi `objectData.ts`).
 * - Game Master yerleştirir/kaldırır (`place_object`).
 * - Silahla saldırılır (`attack_object`: SRD nesne AC'si, isabette hasar; nesne Poison ve Psychic hasara bağışık).
 * - Alanlı hasar (büyü, nefes, patlama) alandaki nesnelere tam işler (nesneler save yapmaz).
 * - Yıkılınca:
 *   - yağ fıçısı yağ bırakır (sahibi + bitişik, en çok `oilSpill` altıgen); ateşle yıkılırsa alev;
 *   - mangal kendi altıgenine alev dökülür;
 *   - barut fıçısı ev kuralı `barutPatlama` açıksa patlar (DEX save, SRD tuzak ölçeği; çevredeki nesnelere de işler),
 *     kapalıysa yalnızca yıkılır.
 * - Ateş hasarı alan yanıcı fıçılar (yağ, barut) içeriğiyle tutuşur: yağ fıçısı hemen alev olur, barut fıçısı patlar
 *   (sadeleştirme; SRD "flammable objects … start burning").
 * - Kullanım (`object_use`, bitişik):
 *   - kapı aç/kapa (eylemsiz; içinde yaratık varken kapanmaz);
 *   - kilidi aç (eylem; DEX Sleight of Hand, DC `lockDc`);
 *   - masayı devir (eylem; yarım örtü);
 *   - mangalı bitişik altıgene dök (eylem; alev ve ateş tepkimesi).
 * Bütün sonuçlar olaylarda; zarlar rng'den (zar defteri, replay). Saf.
 */
import { resolveAttack, resolveSave } from '../rules/attack';
import { adjustDamage } from '../rules/damage';
import { rollD20, rollDice, rollTag, type Rng } from '../rules/dice';
import { distance, hexKey, neighbors, withinRange, type Offset } from '../rules/hex';
import { skillBonus } from '../rules/skills';
import { autoFailsStrDexSave } from '../rules/conditions';
import { damageProfile, fail, finish, isTargetable, type CommandResult } from './common';
import { damageEffects } from './damage-effects';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
import { saveDamage } from './classTraits';
import { applyEvents } from './reduce';
import { houseRule } from './houseRules';
import { OBJECTS, OBJECT_DATA, objectAt } from './objectData';
import { areaDamageOf, elementReactionEvents, surfaceEvent } from './surfaces';
import { terrainOf } from '../map/terrain';
import type { AttackOption, BattleEvent, BattleState, Combatant, MapObject, ObjectAction, ObjectKind, ObjectState } from './types';

const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const tileOf = (s: BattleState, h: Offset) => terrainOf(s.map?.tiles[h.row]?.[h.col] ?? '#');
const IMMUNE = new Set(['poison', 'psychic']);
const live = (s: BattleState, id: string) => s.map?.objects?.find((o) => o.id === id);

function newObjectId(state: BattleState, kind: ObjectKind): string {
  const used = new Set((state.map?.objects ?? []).map((o) => o.id));
  let n = 1;
  while (used.has(`${kind}:${n}`)) n++;
  return `${kind}:${n}`;
}

/** Yeni nesne (veri HP'si, varsayılan durum). */
export function makeObject(state: BattleState, kind: ObjectKind, at: Offset, stateOf?: ObjectState): MapObject {
  const def = OBJECTS[kind];
  const st = stateOf ?? def.defaultState;
  return { id: newObjectId(state, kind), kind, at, hp: def.hp, ...(st ? { state: st } : {}) };
}

/** Game Master: nesne yerleştir ya da kaldır (`kind` yok). Zar yok. */
export function executePlaceObject(state: BattleState, cmd: { kind?: ObjectKind; at: Offset; state?: ObjectState }, isGm: boolean): CommandResult {
  if (!isGm) return fail('Nesneyi yalnızca Game Master yerleştirir.');
  if (!state.map) return fail('Nesne yalnızca haritalı savaşta.');
  const size = sizeOf(state);
  const h = cmd.at;
  if (h.col < 0 || h.row < 0 || h.col >= size.cols || h.row >= size.rows) return fail('Harita dışı.');
  const here = objectAt(state, h);
  if (!cmd.kind) return here ? finish(state, [{ type: 'object_removed', objectId: here.id }]) : fail('Bu altıgende nesne yok.');
  if (!OBJECTS[cmd.kind]) return fail(`Bilinmeyen nesne: ${cmd.kind}`);
  const t = tileOf(state, h);
  if (t.movement === 'blocked' || t.movement === 'deadly' || t.outOfBounds) return fail(`${t.name} üstüne nesne konmaz.`);
  const events: BattleEvent[] = here ? [{ type: 'object_removed', objectId: here.id }] : [];
  const blocks = OBJECTS[cmd.kind].terrain.movement === 'blocked' && (cmd.state ?? OBJECTS[cmd.kind].defaultState) !== 'open';
  if (blocks && Object.values(state.combatants).some((c) => c.pos && hexKey(c.pos) === hexKey(h) && isTargetable(c))) return fail('Altıgende yaratık var.');
  events.push({ type: 'object_placed', object: makeObject(applyEvents(state, events), cmd.kind, h, cmd.state) });
  return finish(state, events);
}

/** Yağ dökülecek altıgenler: nesnenin altıgeni + bitişik, durulabilir altıgenler (sabit sıra). */
function spillHexes(state: BattleState, at: Offset): Offset[] {
  const out = [at];
  for (const n of neighbors(at, sizeOf(state))) {
    if (out.length >= OBJECT_DATA.oilSpill) break;
    const t = tileOf(state, n);
    if (t.movement !== 'blocked' && t.movement !== 'deadly' && !t.outOfBounds) out.push(n);
  }
  return out;
}

/** Barut patlaması: yarıçaptaki yerdeki yaratıklara DEX save (hasar bir kez), nesnelere tam hasar, ateş tepkimesi. */
function explosionEvents(state: BattleState, obj: MapObject, actorId: string, rng: Rng, depth: number): BattleEvent[] {
  const k = OBJECT_DATA.keg;
  const area = withinRange(obj.at, k.radiusHexes, sizeOf(state));
  const keys = new Set(area.map(hexKey));
  const label = `${OBJECTS[obj.kind].tr}: patlama`;
  const roll = rollDice(k.damage, rollTag(rng, { kind: 'damage', by: actorId }));
  const out: BattleEvent[] = [];
  let s = state;
  const push = (evs: BattleEvent[]) => { out.push(...evs); s = applyEvents(s, evs); };
  for (const c0 of Object.values(s.combatants)) {
    const c = s.combatants[c0.id] as Combatant;
    if (!c.pos || !keys.has(hexKey(c.pos)) || c.hp <= 0 || !isTargetable(c)) continue;
    const save = resolveSave({ extra: saveDice(c, 'dex'), modifier: c.saves.dex, dc: k.dc, mode: saveMode('normal', c, 'dex'), autoFail: autoFailsStrDexSave(c.conditions) }, rollTag(rng, { by: c.id }));
    const amount = saveDamage(c, 'dex', save.success, roll.total, k.half);
    const adj = amount > 0 ? adjustDamage(amount, k.damageType, damageProfile(c)) : { amount: 0, note: null };
    const fx = damageEffects(c, adj.amount, k.damageType, false, rng);
    push([{ type: 'save_resolved', actorId, targetId: c.id, label, ability: 'dex', dc: k.dc, mode: 'normal', reasons: [],
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: roll.rolls, rawDamage: roll.total, appliedDamage: adj.amount, damageType: k.damageType, damageNote: adj.note,
      targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: [], ...(save.extra ? { bonusDice: save.extra } : {}) }]);
  }
  push(elementReactionEvents(s, 'fire', area, actorId, label, rng, roll.total, k.dc));
  // Zincirleme: alandaki diğer nesneler patlamanın hasarını alır (derinlik sınırlı).
  if (depth < 3) for (const o of (s.map?.objects ?? []).filter((x) => x.id !== obj.id && keys.has(hexKey(x.at)))) push(damageObjectEvents(s, o, roll.total, k.damageType, actorId, label, rng, depth + 1));
  return out;
}

/** Yıkılan nesnenin olayları ve sonuçları (yağ, alev, patlama). */
function destroyEvents(state: BattleState, obj: MapObject, damageType: string, actorId: string, label: string, rng: Rng, depth: number): BattleEvent[] {
  const def = OBJECTS[obj.kind];
  const out: BattleEvent[] = [{ type: 'object_destroyed', objectId: obj.id, label: `${def.tr} (${label})` }];
  let s = applyEvents(state, out);
  const side = state.combatants[actorId]?.side ?? 'enemies';
  if (def.explodes && houseRule(state, 'barutPatlama')) {
    out.push(...explosionEvents(s, obj, actorId, rng, depth));
    return out;
  }
  const onBreak = def.onBreak === 'oil' && damageType === 'fire' ? 'fire' : def.onBreak;
  if (onBreak === 'oil') {
    out.push(surfaceEvent(s, 'oil', spillHexes(s, obj.at), actorId, side));
  } else if (onBreak === 'fire') {
    const hexes = def.onBreak === 'oil' ? spillHexes(s, obj.at) : [obj.at];
    const lit = surfaceEvent(s, 'fire', hexes, actorId, side);
    out.push(lit);
    s = applyEvents(s, [lit]);
    out.push(...elementReactionEvents(s, 'fire', hexes, actorId, label, rng));
  }
  return out;
}

/** Nesneye hasar (bağışıklık, HP); 0'da yıkılır. Yanıcı fıçı ateşle hemen tutuşur. */
export function damageObjectEvents(state: BattleState, obj: MapObject, damage: number, damageType: string, actorId: string, label: string,
  rng: Rng, depth = 0, roll?: { d20: number; total: number; ac: number; hit: boolean }): BattleEvent[] {
  const def = OBJECTS[obj.kind];
  const amount = IMMUNE.has(damageType) ? 0 : Math.max(0, damage);
  const ignites = damageType === 'fire' && amount > 0 && !!def.flammable && (def.onBreak === 'oil' || !!def.explodes);
  const hpAfter = ignites ? 0 : Math.max(0, obj.hp - amount);
  const ev: BattleEvent = { type: 'object_damaged', objectId: obj.id, actorId, label, damage: amount, damageType, hpAfter, ...(roll ? { roll } : {}) };
  const out: BattleEvent[] = [ev];
  if (hpAfter === 0 && (amount > 0 || ignites)) out.push(...destroyEvents(applyEvents(state, [ev]), { ...obj, hp: 0 }, damageType, actorId, label, rng, depth));
  return out;
}

/** Silahla nesneye saldırı (SRD: nesne AC'si; erişim/menzil). */
export function executeAttackObject(state: BattleState, actor: Combatant, objectId: string, option: AttackOption, rng: Rng): CommandResult {
  const obj = live(state, objectId);
  if (!obj) return fail('Nesne yok.');
  if (!actor.pos) return fail('Konum yok.');
  const d = distance(actor.pos, obj.at);
  if (option.ranged) {
    if (d * 5 > (option.range?.[1] ?? Infinity)) return fail(`Nesne menzil dışında (${d * 5} ft).`);
  } else if (d * 5 > (option.reachFt ?? 5)) return fail(`Nesne erişim dışında (${d * 5} ft).`);
  const def = OBJECTS[obj.kind];
  const r = resolveAttack({ attackBonus: option.attackBonus, targetAc: def.ac, mode: 'normal', damage: option.damage, autoCritical: false }, rollTag(rng, { by: actor.id }));
  const dealt = r.hit ? r.damage?.total ?? 0 : 0;
  const roll = { d20: r.d20.kept, total: r.total, ac: def.ac, hit: r.hit };
  return finish(state, damageObjectEvents(state, obj, dealt, option.damageType ?? 'bludgeoning', actor.id, `${actor.name}: ${option.label}`, rng, 0, roll));
}

/** Nesne kullanımı (bitişik). */
export function executeObjectUse(state: BattleState, actor: Combatant, objectId: string, action: ObjectAction, to: Offset | undefined, rng: Rng): CommandResult {
  const obj = live(state, objectId);
  if (!obj) return fail('Nesne yok.');
  if (!actor.pos || distance(actor.pos, obj.at) > 1) return fail('Nesneye bitişik olmalısın.');
  const def = OBJECTS[obj.kind];
  const name = `${actor.name}: ${def.tr}`;
  if (obj.kind === 'door') {
    if (action === 'open') {
      if (obj.state === 'open') return fail('Kapı zaten açık.');
      if (obj.state === 'locked') return fail('Kapı kilitli.');
      return finish(state, [{ type: 'object_changed', objectId: obj.id, state: 'open', label: `${name} açıldı` }]);
    }
    if (action === 'close') {
      if (obj.state !== 'open') return fail('Kapı zaten kapalı.');
      if (Object.values(state.combatants).some((c) => c.pos && hexKey(c.pos) === hexKey(obj.at) && isTargetable(c))) return fail('Kapının altıgeninde yaratık var.');
      return finish(state, [{ type: 'object_changed', objectId: obj.id, state: 'closed', label: `${name} kapandı` }]);
    }
    if (action === 'unlock') {
      if (obj.state !== 'locked') return fail('Kapı kilitli değil.');
      const dc = obj.lockDc ?? OBJECT_DATA.lockDc;
      const bonus = skillBonus(actor, 'sleightOfHand');
      const d = rollD20('normal', rollTag(rng, { by: actor.id, kind: 'check' }));
      const total = d.kept + bonus;
      const success = total >= dc;
      return finish(state, [{ type: 'object_changed', objectId: obj.id, ...(success ? { state: 'closed' as const } : {}), label: success ? `${name} kilidi açıldı` : `${name} kilidi açılamadı`,
        check: { d20: d.kept, total, dc, success } }]);
    }
  }
  if (obj.kind === 'table' && action === 'tip') {
    if (obj.state === 'tipped') return fail('Masa zaten devrik.');
    return finish(state, [{ type: 'object_changed', objectId: obj.id, state: 'tipped', label: `${name} devrildi (yarım örtü)` }]);
  }
  if (obj.kind === 'brazier' && action === 'knock') {
    if (obj.state === 'tipped') return fail('Mangal zaten devrik.');
    if (!to || distance(to, obj.at) !== 1) return fail('Kor bitişik bir altıgene dökülür.');
    const t = tileOf(state, to);
    if (t.movement === 'blocked' || t.outOfBounds) return fail('Oraya dökülmez.');
    const events: BattleEvent[] = [{ type: 'object_changed', objectId: obj.id, state: 'tipped', label: `${name} devrildi, kor döküldü` }];
    const lit = surfaceEvent(applyEvents(state, events), 'fire', [to], actor.id, actor.side);
    events.push(lit);
    events.push(...elementReactionEvents(applyEvents(state, events), 'fire', [to], actor.id, def.tr, rng));
    return finish(state, events);
  }
  return fail('Bu nesneyle bu yapılamaz.');
}

/**
 * Komutun sonunda alanlı hasarın nesnelere işlemesi (`execute`): büyü alanı ve alanlı saldırı/nefes. Zar atılmadıysa
 * (alanda yaratık yok) hasar zarı burada atılır.
 */
export function objectAreaEvents(next: BattleState, events: BattleEvent[], rng: Rng): BattleEvent[] {
  if (!next.map?.objects?.length) return [];
  const out: BattleEvent[] = [];
  let s = next;
  for (const hit of areaDamageOf(events)) {
    const keys = new Set(hit.hexes.map(hexKey));
    const targets = (s.map?.objects ?? []).filter((o) => keys.has(hexKey(o.at)));
    if (!targets.length) continue;
    const raw = hit.damage ?? (hit.dice ? rollDice(hit.dice, rollTag(rng, { kind: 'damage', by: hit.actorId })).total : 0);
    for (const o0 of targets) {
      const o = live(s, o0.id);
      if (!o) continue;
      const evs = damageObjectEvents(s, o, raw, hit.damageType, hit.actorId, hit.label, rng);
      out.push(...evs);
      s = applyEvents(s, evs);
    }
  }
  return out;
}

/** Yapay zekâ: altıgenin nesne riski (patlayacak barut fıçısının yanı; ev kuralı kapalıysa yok). */
export function objectRisk(state: BattleState, h: Offset): number {
  const list = state.map?.objects;
  if (!list?.length) return 0;
  let r = 0;
  for (const o of list) {
    const def = OBJECTS[o.kind];
    if (!def.aiRisk) continue;
    if (def.explodes && !houseRule(state, 'barutPatlama')) continue;
    if (distance(o.at, h) <= (def.explodes ? OBJECT_DATA.keg.radiusHexes : 0)) r = Math.max(r, def.aiRisk);
  }
  return r;
}

/** Görev S2: haritanın hazır nesneleri (savaş başında; kimlik tür + sıra). */
export function presetObjects(list: Array<{ kind: string; at: Offset; state?: string; lockDc?: number }>): MapObject[] {
  const n: Record<string, number> = {};
  return list.filter((o) => OBJECTS[o.kind as ObjectKind]).map((o) => {
    const kind = o.kind as ObjectKind;
    n[kind] = (n[kind] ?? 0) + 1;
    const st = (o.state as ObjectState | undefined) ?? OBJECTS[kind].defaultState;
    return { id: `${kind}:${n[kind]}`, kind, at: o.at, hp: OBJECTS[kind].hp, ...(st ? { state: st } : {}), ...(o.lockDc ? { lockDc: o.lockDc } : {}) };
  });
}
