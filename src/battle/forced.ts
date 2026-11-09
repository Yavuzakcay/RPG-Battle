/**
 * Zorunlu hareket ve itme (SRD 5.2.1). Shove (Rules Glossary, Unarmed Strike, s. 191): hedef STR
 * ya da DEX save'i (kendisi seçer: yüksek olanı), DC = 8 + saldıranın STR modifier'ı + yetkinlik;
 * başarısızsa saldıran 5 ft itmeyi ya da Prone'u seçer. Hedef en çok bir boyut büyük olabilir.
 * Attack eylemindeki bir saldırının yerine geçer.
 *
 * Haritada itme yönü saldıranın altıgeninden hedefinkine giden eksen yönünün devamıdır. Engel
 * (geçilmez zemin, kapalı kapı, başka yaratık, harita dışı, daha yüksek zemin) varsa itilmez;
 * yalnızca Prone kalır. Zorunlu hareket fırsat saldırısı tetiklemez. İtilen altıgene girmiş
 * sayılır: lavda ölür (uçan hariç), alev, buz, batak ve tuzak kuralları çalışır, yayılıma
 * (Spirit Guardians) girer. Daha alçak altıgene itilen her 10 ft (yükseklik seviyesi) için 1d6
 * düşer (SRD Falling, s. 182); uçuruma/yarığa (`u`) itilen 30 ft dibine düşer.
 */
import { moverBand } from './cells';
import { fall } from './fall';
import { climbOn } from './climbing';
import { knowsWhere } from './sight';
import { heightDelta, heightFallRule, isRamp, layerActive, levelFeet } from './heights';
import { saveDice } from './effectDice';
import { saveMode } from './durations';
import { resolveSave } from '../rules/attack';
import { autoFailsStrDexSave } from '../rules/conditions';
import { rollTag, type Rng } from '../rules/dice';
import { AXIAL_DIRECTIONS, axialToOffset, directionTo, distance, isInside, neighbors, offsetToAxial, type Offset } from '../rules/hex';
import { fail, finish, isTargetable, type CommandResult } from './common';
import { auraStepEvents } from './features';
import { zoneStepEvents } from './zones';
import { enterHexEvents, fallEffect, hitEffect, isBog, ruleOf } from './maprules';
import { fallReactions } from './reactions';
import { hexLabel, occupantAt, terrainAt } from './movement';
import { bodyAt, bodyOf, gap, isMultiHex } from './body';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant } from './types';
import type { CreatureSize } from '../data/types';
import { isAirborne } from './flight';
import { globalRule } from './ruleControl';
import { ruleVersion } from './ruleVersion';
import { fissureDepthAt } from './altitude';
import { collisionDice, collisionOn, forcedMove, MOTION } from './motion';

/** Bir yükseklik seviyesi kaç ft (tırmanma 2 altıgen = 10 ft). */
export const LEVEL_FEET = 10;
/** Uçurum/yarık (`u`) derinliği. */
export const CHASM_FEET = 30;

const ORDER: CreatureSize[] = ['T', 'S', 'M', 'L', 'H', 'G'];
export const sizeRank = (s: CreatureSize) => ORDER.indexOf(s);

/** Shove DC'si: 8 + STR modifier + yetkinlik. */
export function shoveDc(c: Combatant, state?: BattleState): number {
  // Kuyruk 19 (featuresK19): Martial Arts geçerliyken (Monk zırhsız, kalkansız) STR yerine DEX seçilebilir.
  const dex = state && !!globalRule(state, 'featuresK19') && !!c.bonusStrike ? c.modifiers.dex : -99;
  return 8 + Math.max(c.modifiers.str, dex) + c.proficiency;
}

const sizeOf = (state: BattleState) => ({ cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 });
const flies = (c: Combatant) => isAirborne(c);

/** `from`dan `to`ya 5 ft itmenin sonucu: gidilecek altıgen ve ne olacağı, ya da engel. */
export type PushOutcome =
  | {
      ok: true; to: Offset; kind: 'move' | 'lava' | 'fall' | 'chasm' | 'bog' | 'stairwell' | 'tumble'; fallFeet: number; note: string;
      /** Merdiven boşluğuna düşen aynı odada buraya (en yakın alçak basamak) yerleşir. */
      land?: Offset;
      /** Kuyruk K68a (sürüm 52): Earthquake yarığına düşen: iniş irtifası −derinlik (ft). */
      fissureFt?: number;
    }
  | { ok: false; reason: string };

export function pushOutcome(state: BattleState, target: Combatant, from: Offset, to: Offset): PushOutcome {
  if (!isInside(to, sizeOf(state))) return { ok: false, reason: 'harita dışı' };
  // Kuyruk 43: çok altıgenli gövde (bayrak açık): itildiği yerde gövdenin her altıgeni harita içinde, boş ve geçilebilir
  // olmalı (çarpma gövdeye); zemin sonucu (lav, düşme) çapanın altıgeninden.
  if (isMultiHex(state, target)) {
    // Kuyruk K69 (sürüm 53): gövdenin herhangi bir altıgeni açık yarığa denk gelirse gövde yarığa düşer (tek düşme, derinlik
    // kadar; çapa en yakın yarık altıgenine: K66 madde 14 yaklaşımı); herhangi bir altıgeni lavsa lav (uçan hariç).
    const k69 = ruleVersion(state) >= 53;
    let pit: Offset | null = null;
    let lava = false;
    for (const h of bodyAt(state, target, to)) {
      if (!isInside(h, sizeOf(state))) return { ok: false, reason: 'harita dışı' };
      const o = occupantAt(state, h, target.id, moverBand(state, target));
      if (o) return { ok: false, reason: `arkada ${o.name} var` };
      const th = terrainAt(state, h);
      if (k69 && th.char === 'u' && !flies(target) && fissureDepthAt(state, h) > 0) { if (!pit || distance(h, to) < distance(pit, to)) pit = h; continue; }
      if (th.movement === 'blocked') return { ok: false, reason: `arkada ${th.name.toLowerCase()}` };
      if (k69 && th.movement === 'deadly' && !flies(target)) lava = true;
    }
    if (pit) {
      const depth = fissureDepthAt(state, pit);
      return { ok: true, to: pit, kind: 'fall', fallFeet: depth, fissureFt: depth, note: `Gövde yarığa düşer: ${depth} ft (${Math.min(20, depth / 10)}d6)` };
    }
    if (lava) return { ok: true, to, kind: 'lava', fallFeet: 0, note: 'Gövde lava girdi! Düşerse ölür' };
  }
  const t = terrainAt(state, to);
  const here = terrainAt(state, from);
  const other = occupantAt(state, to, target.id, moverBand(state, target));
  if (other) return { ok: false, reason: `arkada ${other.name} var` };
  const well = ruleOf(state, 'stairwellFall');
  if (well && t.char === (well.terrain ?? 'u') && !flies(target)) {
    const land = nearestFree(state, target, to, (well.landOn as string | undefined) ?? 'l');
    if (land) return { ok: true, to, kind: 'stairwell', fallFeet: 0, land, note: `Merdiven boşluğu! ${String(well.damage)} + Prone, ${hexLabel(land)} basamağına düşer` };
  }
  if (t.char === 'u') {
    if (flies(target)) return { ok: true, to, kind: 'move', fallFeet: 0, note: `${t.name} (uçuyor)` };
    // Kuyruk K68a (sürüm 52): açık Earthquake yarığına itilen tek düşme, yarığın derinliği kadar; eksi irtifada kalır
    // (sürüm 50–51: sabit 30 ft uçurum düşmesi ve komut sonunda ikinci kez yarık düşmesi; eski kayıtlar aynen).
    const depth = ruleVersion(state) >= 52 ? fissureDepthAt(state, to) : 0;
    if (depth > 0) return { ok: true, to, kind: 'fall', fallFeet: depth, fissureFt: depth, note: `Yarığa düşer: ${depth} ft (${Math.min(20, depth / 10)}d6)` };
    const feet = CHASM_FEET + here.height * LEVEL_FEET;
    return { ok: true, to, kind: 'chasm', fallFeet: feet, note: `Uçurum! ${feet} ft düşer (${Math.min(20, feet / 10)}d6)` };
  }
  if (t.movement === 'blocked') return { ok: false, reason: `arkada ${t.name.toLowerCase()}` };
  if (t.movement === 'deadly') {
    return flies(target) ? { ok: true, to, kind: 'move', fallFeet: 0, note: 'Lav (uçuyor, etkilenmez)' }
      : { ok: true, to, kind: 'lava', fallFeet: 0, note: 'Lav! Düşerse ölür' };
  }
  // Kuyruk 26: yükseklik katmanı: seviyeler katmandan; rampadan rampaya düşme yok; düşme hasarı Game Master anahtarıyla;
  // derin suya düşen hasar almaz (yüzme kuralı geçerli).
  if (layerActive(state)) {
    const up = heightDelta(state, from, to);
    const ramp = isRamp(state, to) || isRamp(state, from);
    if (up > 0 && !ramp) return { ok: false, reason: 'arkası daha yüksek zemin' };
    if (up < 0 && !ramp && !flies(target) && heightFallRule(state) && t.rule !== 'deepWater') {
      const feet = -up * levelFeet(state);
      return { ok: true, to, kind: 'fall', fallFeet: feet, note: `${feet} ft düşer (${Math.min(20, Math.floor(feet / 10))}d6)` };
    }
    if (isBog(state, to) && !flies(target)) return { ok: true, to, kind: 'bog', fallFeet: 0, note: 'Derin batak! Saplanır, zehirlenir, boğulabilir' };
    return { ok: true, to, kind: 'move', fallFeet: 0, note: '5 ft itilir' };
  }
  // Basamaklar (merdiven): yukarı basamağa itilebilir, aşağı basamak düşme değil yuvarlanma.
  const stairs = t.stairs === true || here.stairs === true;
  if (t.height > here.height && !t.stairs) return { ok: false, reason: 'arkası daha yüksek zemin' };
  const drop = (here.height - t.height) * LEVEL_FEET;
  if (drop > 0 && !flies(target) && stairs) {
    const tumble = ruleOf(state, 'stairShove');
    if (tumble) return { ok: true, to, kind: 'tumble', fallFeet: 0, note: `Basamaktan yuvarlanır: ${String(tumble.damage)} + Prone` };
  } else if (drop > 0 && !flies(target)) {
    return { ok: true, to, kind: 'fall', fallFeet: drop, note: `${drop} ft düşer (${drop / 10}d6)` };
  }
  if (isBog(state, to) && !flies(target)) return { ok: true, to, kind: 'bog', fallFeet: 0, note: 'Derin batak! Saplanır, zehirlenir, boğulabilir' };
  const extra = t.hazard ? `, ${t.name.toLowerCase()} (${t.hazard.damage} ${t.hazard.damageType})`
    : t.rule === 'bog' ? ', derin batak' : t.rule === 'ice' ? ', buz' : t.rule === 'deepWater' ? ', derin su' : '';
  return { ok: true, to, kind: 'move', fallFeet: 0, note: `5 ft itilir${extra}` };
}

/** `from`a en yakın, boş `char` altıgeni (eşitse satır, sütun sırası). */
function nearestFree(state: BattleState, target: Combatant, from: Offset, char: string): Offset | null {
  let best: Offset | null = null;
  state.map?.tiles.forEach((row, r) => [...row].forEach((ch, col) => {
    const h = { col, row: r };
    if (ch !== char || occupantAt(state, h, target.id)) return;
    if (!best || distance(from, h) < distance(from, best)) best = h;
  }));
  return best;
}

/** Saldıranın hedefi iteceği altıgen: eksen yönünün devamı (bitişik değillerse null). */
export function shoveHex(attacker: Combatant, target: Combatant, state?: Pick<BattleState, 'multiHex' | 'multiHexMax'>): Offset | null {
  if (!attacker.pos || !target.pos) return null;
  // Kuyruk 43: çok altıgenli hedefte yön saldıranın bitişiğindeki gövde altıgenine doğru; çapa o yönde kayar.
  const near = state && isMultiHex(state, target) ? bodyOf(state, target).find((h) => distance(attacker.pos as Offset, h) === 1) : target.pos;
  if (!near) return null;
  const dir = directionTo(attacker.pos, near);
  if (dir === null || distance(attacker.pos, near) !== 1) return null;
  const step = AXIAL_DIRECTIONS[dir] as { q: number; r: number };
  const a = offsetToAxial(target.pos);
  return axialToOffset({ q: a.q + step.q, r: a.r + step.r });
}

/** Zorunlu hareketin olayları: itilme, lav, düşme, girilen altıgenin kuralları ve yayılım. */
export function forcedMoveEvents(state: BattleState, targetId: string, out: Extract<PushOutcome, { ok: true }>, by: string, rng: Rng): BattleEvent[] {
  const target = state.combatants[targetId];
  if (!target?.pos) return [];
  const events: BattleEvent[] = [{ type: 'pushed', targetId, from: target.pos, to: out.to, by }];
  let current = applyEvents(state, events);
  const push = (evs: BattleEvent[]) => { events.push(...evs); current = applyEvents(current, evs); };
  if (out.kind === 'lava') {
    push([{ type: 'fell_into_lava', actorId: targetId, at: out.to }]);
    return events;
  }
  if ((out.kind === 'fall' || out.kind === 'chasm') && climbOn(current)) {
    // Kuyruk K71b (sürüm 57+): tek düşme işlevi (yarıkta irtifa eksi derinlik).
    push(fall(current, targetId, out.fallFeet, out.fissureFt ? 'yarik' : 'itme', rng, { at: out.to, ...(out.fissureFt ? { altitudeTo: -out.fissureFt, label: `yarığa düştü (${out.fissureFt} ft)` } : {}) }));
  } else if (out.kind === 'fall' || out.kind === 'chasm') {
    // Düşme tepkisi (Slow Fall, Feather Fall; Görev R1) hasardan önce.
    const fr = fallReactions(current, targetId, out.fallFeet, rng);
    push(fr.events);
    push([fallEffect(current.combatants[targetId] as Combatant, out.fallFeet, rng, fr)]);
    if (out.fissureFt) push([{ type: 'altitude_changed', targetId, altitudeFt: -out.fissureFt, label: `yarığa düştü (${out.fissureFt} ft)` }]);
  }
  if (out.kind === 'tumble' || out.kind === 'stairwell') {
    const rule = ruleOf(current, out.kind === 'tumble' ? 'stairShove' : 'stairwellFall');
    const hit = { damage: String(rule?.damage ?? '1d4'), damageType: String(rule?.damageType ?? 'bludgeoning'), ...(rule?.prone === false ? {} : { condition: 'Prone' }) };
    const ev = hitEffect(current.combatants[targetId] as Combatant, out.kind === 'tumble' ? 'stairShove' : 'stairwellFall',
      out.kind === 'tumble' ? 'basamaktan yuvarlandı' : 'merdiven boşluğuna düştü', hit, rng);
    if (out.land) ev.moveTo = out.land;
    push([ev]);
  }
  const at = out.land ?? out.to;
  const me = current.combatants[targetId] as Combatant;
  if (me.hp > 0 || me.regenPending) push(enterHexEvents(current, me, at, rng).events);
  if ((current.combatants[targetId]?.hp ?? 0) > 0) push(auraStepEvents(current, targetId, target.pos, at, rng));
  // Görev B2: büyü alanlarına itilmek (girince, Spike Growth).
  if ((current.combatants[targetId]?.hp ?? 0) > 0) push(zoneStepEvents(current, targetId, target.pos, at, rng));
  return events;
}

/**
 * Bir noktadan uzağa itme (Thunderwave 10 ft gibi): her 5 ft'te hedefin, çıkış noktasından en
 * uzak komşusuna (eşitse eksen sırasıyla ilki); engelde durur.
 */
export function pushAwayEvents(state: BattleState, origin: Offset, targetId: string, feet: number, by: string, rng: Rng): BattleEvent[] {
  // Kuyruk K53: tek zorla hareket girişi (`motion.ts` `forcedMove`, itme kipi); sürüm 24+ çarpma kuralı orada.
  return forcedMove(state, targetId, 'push', feet, by, rng, { origin });
}

/**
 * Kuyruk 19 (anahtar `featuresK19`): oyuncunun Grapple'ı (SRD 5.2.1 Unarmed Strike seçeneği): Attack eyleminde bir saldırının
 * yerine; hedef en çok bir boyut büyük ve erişimde (bitişik); hedef STR ya da DEX save (yüksek olanı) DC 8 + STR (Martial
 * Arts'ta DEX) + yetkinlik; başarısızsa Grappled, kaçış DC'si aynı. Ekonomisi Shove ile aynı (`economy.ts`).
 */
export function executeGrapple(state: BattleState, actor: Combatant, targetId: string, rng: Rng): CommandResult {
  if (!globalRule(state, 'featuresK19')) return fail('Grapple bu kural sürümünde yok.');
  const target = state.combatants[targetId];
  if (!target) return fail('Hedef bulunamadı.');
  if (target.id === actor.id) return fail('Kendini yakalayamazsın.');
  if (!isTargetable(target) || target.hp <= 0) return fail('Hedef ayakta değil.');
  if (target.hidden && target.side !== actor.side && !knowsWhere(state, actor, target)) return fail(`${target.name} gizlenmiş: hedef alınamaz.`);
  if (target.conditions.includes('Grappled') && target.grapple?.by === actor.id) return fail(`${target.name} zaten yakalı.`);
  if (sizeRank(target.size) > sizeRank(actor.size) + 1) return fail(`${target.name} yakalanamayacak kadar büyük (en çok bir boyut büyük olabilir).`);
  if (state.map && (!actor.pos || !target.pos || gap(state, actor, target) !== 1)) return fail('Yakalamak için hedef bitişik olmalı (5 ft).');
  const ability: 'str' | 'dex' = target.saves.str >= target.saves.dex ? 'str' : 'dex';
  const dc = shoveDc(actor, state);
  const save = resolveSave({ extra: saveDice(target, ability), modifier: target.saves[ability], dc, mode: saveMode('normal', target, ability), autoFail: autoFailsStrDexSave(target.conditions) }, rollTag(rng, { by: target.id }));
  const events: BattleEvent[] = [{ type: 'condition_save', targetId, condition: 'Grappled', ability, dc, d20: save.d20?.rolls ?? [], total: save.total ?? 0, success: save.success,
    ...(save.extra ? { bonusDice: save.extra } : {}) }];
  if (!save.success) events.push({ type: 'grappled', targetId, by: actor.id, escapeDc: dc, restrained: false, label: 'Grapple' });
  return finish(state, events);
}

/** Kuyruk 19: Grappler (Punch and Grab) bu saldırıda kullanılabilir mi: Unarmed Strike, Attack eylemi, turda bir kez. */
export function punchAndGrabReady(state: BattleState, actor: Combatant, option: { weaponId?: string }): boolean {
  return !!globalRule(state, 'featuresK19') && !!actor.traits?.includes('grappler') && option.weaponId === 'unarmed-strike'
    && actor.traitTurns?.['punch-and-grab'] !== `${state.round}:${state.turnIndex}`;
}

/** Shove komutu. Haritasız savaşta konum yok: yalnızca Prone uygulanır. */
export function executeShove(state: BattleState, actor: Combatant, targetId: string, wanted: 'push' | 'prone', rng: Rng): CommandResult {
  const target = state.combatants[targetId];
  if (!target) return fail('Hedef bulunamadı.');
  if (target.id === actor.id) return fail('Kendini itemezsin.');
  if (!isTargetable(target) || target.hp <= 0) return fail('Hedef ayakta değil.');
  if (target.hidden && target.side !== actor.side && !knowsWhere(state, actor, target)) return fail(`${target.name} gizlenmiş: hedef alınamaz.`);
  if (sizeRank(target.size) > sizeRank(actor.size) + 1) return fail(`${target.name} itilemeyecek kadar büyük (en çok bir boyut büyük olabilir).`);
  const effect: 'push' | 'prone' = state.map ? wanted : 'prone';
  let out: PushOutcome | null = null;
  // Kuyruk K53 (sürüm 24, ev kuralı carpmaHasari): itme engelde kalırsa hedef çarpar (1d6; engel yaratıksa o da 1d6).
  let slam: Offset | null = null;
  if (state.map) {
    if (!actor.pos || !target.pos || gap(state, actor, target) !== 1) return fail('İtmek için hedef bitişik olmalı (5 ft).');
    if (effect === 'push') {
      const to = shoveHex(actor, target, state);
      out = to ? pushOutcome(state, target, target.pos, to) : { ok: false, reason: 'yön yok' };
      if (!out.ok && to && collisionOn(state)) slam = to;
      else if (!out.ok) return fail(`İtilemez (${out.reason}); yalnızca yere düşürülebilir.`);
    }
  }
  // Hedef yüksek olan save'i seçer.
  const ability: 'str' | 'dex' = target.saves.str >= target.saves.dex ? 'str' : 'dex';
  const dc = shoveDc(actor, state);
  const save = resolveSave({ extra: saveDice(target, ability), modifier: target.saves[ability], dc, mode: saveMode('normal', target, ability), autoFail: autoFailsStrDexSave(target.conditions) }, rollTag(rng, { by: target.id }));
  const events: BattleEvent[] = [{
    type: 'shove_resolved', actorId: actor.id, targetId, ability, dc, d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null,
    total: save.total, success: save.success, effect, ...(out?.ok ? { to: out.to } : {}), ...(save.extra ? { bonusDice: save.extra } : {}),
  }];
  if (!save.success && effect === 'push' && out?.ok) events.push(...forcedMoveEvents(applyEvents(state, events), targetId, out, actor.id, rng));
  if (!save.success && slam) {
    const dice = collisionDice(1) as string;
    events.push(hitEffect(target, 'carpmaHasari', MOTION.carpma.metin.tr, { damage: dice, damageType: MOTION.carpma.tur }, rng));
    const blocker = occupantAt(state, slam, undefined, moverBand(state, target));
    if (blocker && blocker.id !== target.id && blocker.hp > 0) events.push(hitEffect(blocker, 'carpmaHasari', MOTION.carpma.metinCarpilan.tr, { damage: dice, damageType: MOTION.carpma.tur }, rng));
  }
  return finish(state, events);
}
