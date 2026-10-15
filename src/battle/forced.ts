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
import { resolveSave } from '../rules/attack';
import { autoFailsStrDexSave } from '../rules/conditions';
import type { Rng } from '../rules/dice';
import { AXIAL_DIRECTIONS, axialToOffset, directionTo, distance, isInside, neighbors, offsetToAxial, type Offset } from '../rules/hex';
import { fail, finish, isTargetable, type CommandResult } from './common';
import { auraStepEvents } from './features';
import { enterHexEvents, fallEffect, isBog } from './maprules';
import { occupantAt, terrainAt } from './movement';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant } from './types';
import type { CreatureSize } from '../data/types';

/** Bir yükseklik seviyesi kaç ft (tırmanma 2 altıgen = 10 ft). */
export const LEVEL_FEET = 10;
/** Uçurum/yarık (`u`) derinliği. */
export const CHASM_FEET = 30;

const ORDER: CreatureSize[] = ['T', 'S', 'M', 'L', 'H', 'G'];
export const sizeRank = (s: CreatureSize) => ORDER.indexOf(s);

/** Shove DC'si: 8 + STR modifier + yetkinlik. */
export function shoveDc(c: Combatant): number {
  return 8 + c.modifiers.str + c.proficiency;
}

const sizeOf = (state: BattleState) => ({ cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 });
const flies = (c: Combatant) => c.fly > 0;

/** `from`dan `to`ya 5 ft itmenin sonucu: gidilecek altıgen ve ne olacağı, ya da engel. */
export type PushOutcome =
  | { ok: true; to: Offset; kind: 'move' | 'lava' | 'fall' | 'chasm' | 'bog'; fallFeet: number; note: string }
  | { ok: false; reason: string };

export function pushOutcome(state: BattleState, target: Combatant, from: Offset, to: Offset): PushOutcome {
  if (!isInside(to, sizeOf(state))) return { ok: false, reason: 'harita dışı' };
  const t = terrainAt(state, to);
  const here = terrainAt(state, from);
  const other = occupantAt(state, to, target.id);
  if (other) return { ok: false, reason: `arkada ${other.name} var` };
  if (t.char === 'u') {
    if (flies(target)) return { ok: true, to, kind: 'move', fallFeet: 0, note: `${t.name} (uçuyor)` };
    const feet = CHASM_FEET + here.height * LEVEL_FEET;
    return { ok: true, to, kind: 'chasm', fallFeet: feet, note: `Uçurum! ${feet} ft düşer (${Math.min(20, feet / 10)}d6)` };
  }
  if (t.movement === 'blocked') return { ok: false, reason: `arkada ${t.name.toLowerCase()}` };
  if (t.movement === 'deadly') {
    return flies(target) ? { ok: true, to, kind: 'move', fallFeet: 0, note: 'Lav (uçuyor, etkilenmez)' }
      : { ok: true, to, kind: 'lava', fallFeet: 0, note: 'Lav! Düşerse ölür' };
  }
  if (t.height > here.height) return { ok: false, reason: 'arkası daha yüksek zemin' };
  const drop = (here.height - t.height) * LEVEL_FEET;
  if (drop > 0 && !flies(target)) return { ok: true, to, kind: 'fall', fallFeet: drop, note: `${drop} ft düşer (${drop / 10}d6)` };
  if (isBog(state, to) && !flies(target)) return { ok: true, to, kind: 'bog', fallFeet: 0, note: 'Derin batak! Saplanır, zehirlenir, boğulabilir' };
  const extra = t.hazard ? `, ${t.name.toLowerCase()} (${t.hazard.damage} ${t.hazard.damageType})`
    : t.rule === 'bog' ? ', derin batak' : t.rule === 'ice' ? ', buz' : t.rule === 'deepWater' ? ', derin su' : '';
  return { ok: true, to, kind: 'move', fallFeet: 0, note: `5 ft itilir${extra}` };
}

/** Saldıranın hedefi iteceği altıgen: eksen yönünün devamı (bitişik değillerse null). */
export function shoveHex(attacker: Combatant, target: Combatant): Offset | null {
  if (!attacker.pos || !target.pos) return null;
  const dir = directionTo(attacker.pos, target.pos);
  if (dir === null || distance(attacker.pos, target.pos) !== 1) return null;
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
  if (out.kind === 'fall' || out.kind === 'chasm') push([fallEffect(current.combatants[targetId] as Combatant, out.fallFeet, rng)]);
  const me = current.combatants[targetId] as Combatant;
  if (me.hp > 0 || me.regenPending) push(enterHexEvents(current, me, out.to, rng).events);
  if ((current.combatants[targetId]?.hp ?? 0) > 0) push(auraStepEvents(current, targetId, target.pos, out.to, rng));
  return events;
}

/**
 * Bir noktadan uzağa itme (Thunderwave 10 ft gibi): her 5 ft'te hedefin, çıkış noktasından en
 * uzak komşusuna (eşitse eksen sırasıyla ilki); engelde durur.
 */
export function pushAwayEvents(state: BattleState, origin: Offset, targetId: string, feet: number, by: string, rng: Rng): BattleEvent[] {
  const events: BattleEvent[] = [];
  let current = state;
  for (let step = 0; step < Math.floor(feet / 5); step++) {
    const t = current.combatants[targetId];
    if (!t?.pos || t.hp <= 0 || t.life === 'dead') break;
    const here = t.pos;
    const d0 = distance(origin, here);
    // İtme doğrultusu: çıkış noktasından hedefe giden vektöre en uygun (küp koordinatında iç
    // çarpımı en büyük) ve uzaklaşan komşu; düz doğrultuda eksenin devamı.
    const a0 = offsetToAxial(origin);
    const a1 = offsetToAxial(here);
    const v = { q: a1.q - a0.q, r: a1.r - a0.r };
    const dot = (h: Offset) => {
      const a = offsetToAxial(h);
      const dq = a.q - a1.q;
      const dr = a.r - a1.r;
      return dq * v.q + dr * v.r + (-dq - dr) * (-v.q - v.r);
    };
    const best = neighbors(here, sizeOf(current))
      .filter((h) => distance(origin, h) > d0)
      .sort((x, y) => dot(y) - dot(x))[0];
    const out = best ? pushOutcome(current, t, here, best) : null;
    const next = best && out?.ok ? { h: best, out } : null;
    if (!next || !next.out.ok) break;
    const evs = forcedMoveEvents(current, targetId, next.out, by, rng);
    events.push(...evs);
    current = applyEvents(current, evs);
    if (next.out.kind !== 'move') break;
  }
  return events;
}

/** Shove komutu. Haritasız savaşta konum yok: yalnızca Prone uygulanır. */
export function executeShove(state: BattleState, actor: Combatant, targetId: string, wanted: 'push' | 'prone', rng: Rng): CommandResult {
  const target = state.combatants[targetId];
  if (!target) return fail('Hedef bulunamadı.');
  if (target.id === actor.id) return fail('Kendini itemezsin.');
  if (!isTargetable(target) || target.hp <= 0) return fail('Hedef ayakta değil.');
  if (target.hidden && target.side !== actor.side) return fail(`${target.name} gizlenmiş: hedef alınamaz.`);
  if (sizeRank(target.size) > sizeRank(actor.size) + 1) return fail(`${target.name} itilemeyecek kadar büyük (en çok bir boyut büyük olabilir).`);
  const effect: 'push' | 'prone' = state.map ? wanted : 'prone';
  let out: PushOutcome | null = null;
  if (state.map) {
    if (!actor.pos || !target.pos || distance(actor.pos, target.pos) !== 1) return fail('İtmek için hedef bitişik olmalı (5 ft).');
    if (effect === 'push') {
      const to = shoveHex(actor, target);
      out = to ? pushOutcome(state, target, target.pos, to) : { ok: false, reason: 'yön yok' };
      if (!out.ok) return fail(`İtilemez (${out.reason}); yalnızca yere düşürülebilir.`);
    }
  }
  // Hedef yüksek olan save'i seçer.
  const ability: 'str' | 'dex' = target.saves.str >= target.saves.dex ? 'str' : 'dex';
  const dc = shoveDc(actor);
  const save = resolveSave({ modifier: target.saves[ability], dc, mode: 'normal', autoFail: autoFailsStrDexSave(target.conditions) }, rng);
  const events: BattleEvent[] = [{
    type: 'shove_resolved', actorId: actor.id, targetId, ability, dc, d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null,
    total: save.total, success: save.success, effect, ...(out?.ok ? { to: out.to } : {}),
  }];
  if (!save.success && effect === 'push' && out?.ok) events.push(...forcedMoveEvents(applyEvents(state, events), targetId, out, actor.id, rng));
  return finish(state, events);
}
