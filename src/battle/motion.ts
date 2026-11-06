/**
 * Kuyruk K53 S1–S2: ortak hareket girişleri (kural sürümü 24).
 * - `teleport(...)`: tek ışınlanma girişi (menzil, görüş, boş/geçilebilir hedef; fırsat saldırısı yok). Sürüm 24+ ve GM
 *   anahtarı `teleportArrival` açıkken varışta yüzey/harita kuralı, aura (Spirit Guardians) ve büyü alanı kancaları çalışır
 *   (`arrivalEvents`); eski sürümde yalnızca konum (eski davranış).
 * - `forcedMove(...)`: tek zorla hareket girişi: itme (kaynaktan uzağa), çekme (kaynağa doğru), yana kaydırma, serbest
 *   doğrultu (hedef altıgene). Her 5 ft adım `pushOutcome` + `forcedMoveEvents` (lav, düşme, bataklık, yüzey, aura, alan).
 *   Çarpma (ev kuralı `carpmaHasari`, sürüm 24+): engel yüzünden yarıda kalan her altıgen için 1d6 kuvvet (en çok 3d6);
 *   çarpılan yaratık da yarıda kalan altıgen kadar 1d6 (en çok 3d6) alır (ayrı zar).
 * Saf; `rng` enjekte.
 */
import { applyEvents } from './reduce';
import { auraStepEvents } from './features';
import { zoneStepEvents } from './zones';
import { enterHexEvents, hitEffect } from './maprules';
import { forcedMoveEvents, pushOutcome } from './forced';
import { teleportEvent, teleportHexes, teleportProblem, type TeleportSpec } from './teleport';
import { globalRule } from './ruleControl';
import { houseRule } from './houseRules';
import { ruleVersion } from './ruleVersion';
import { occupantAt } from './movement';
import { rollTag, type Rng } from '../rules/dice';
import { resolveSave } from '../rules/attack';
import { saveDice } from './effectDice';
import { distance, neighbors, offsetToAxial, type Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant } from './types';
import motionData from '../../data/hareket.json';

export const MOTION = motionData;
export const MOTION_VERSION = motionData.surum;
const v24 = (s: BattleState) => ruleVersion(s) >= MOTION_VERSION;

/** Varış kancaları açık mı (sürüm 24+, GM anahtarı `teleportArrival`). */
export const arrivalOn = (s: BattleState): boolean => v24(s) && !!globalRule(s, 'teleportArrival');

/** Işınlanma seçenekleri (Kuyruk K53): `TeleportSpec` + fırsat saldırısı (her zaman hayır) + taşınan dost. */
export interface TeleportOptions extends TeleportSpec { carryId?: string }

/** Geçerli ışınlanma hedefleri (arayüz ve yapay zekâ). */
export const teleportTargets = (state: BattleState, actor: Combatant, opts: TeleportOptions): Offset[] => teleportHexes(state, actor, opts);

/** Varışta (ışınlanma sonrası durumda) altıgen kuralları, aura girişi ve büyü alanı girişi. */
export function arrivalEvents(after: BattleState, id: string, from: Offset, to: Offset, rng: Rng): BattleEvent[] {
  const out: BattleEvent[] = [];
  let cur = after;
  const push = (evs: BattleEvent[]) => { out.push(...evs); cur = applyEvents(cur, evs); };
  const me = cur.combatants[id];
  if (!me) return out;
  if (me.hp > 0 || me.regenPending) push(enterHexEvents(cur, me, to, rng).events);
  if ((cur.combatants[id]?.hp ?? 0) > 0) push(auraStepEvents(cur, id, from, to, rng));
  if ((cur.combatants[id]?.hp ?? 0) > 0) push(zoneStepEvents(cur, id, from, to, rng));
  return out;
}

/**
 * Işınlanma olaylarına (`teleported`) varış kancalarını ekler. `prior`: aynı komutta önceden üretilen olaylar (slot,
 * konsantrasyon…). Kancalar kapalıysa yalnızca `tele` döner (eski davranış).
 */
export function withArrival(state: BattleState, prior: BattleEvent[], tele: BattleEvent[], rng: Rng | undefined): BattleEvent[] {
  // Zarsız çağrı (önizleme) ya da kapalı anahtar: yalnızca konum (eski davranış).
  if (!rng || !arrivalOn(state)) return tele;
  const out: BattleEvent[] = [];
  let cur = applyEvents(state, prior);
  for (const ev of tele) {
    out.push(ev);
    cur = applyEvents(cur, [ev]);
    if (ev.type !== 'teleported') continue;
    const arr = arrivalEvents(cur, ev.actorId, ev.from, ev.to, rng);
    out.push(...arr);
    cur = applyEvents(cur, arr);
  }
  return out;
}

/** Tek ışınlanma girişi: doğrular ve olayları (varış kancalarıyla) üretir; geçersizse neden. */
export function teleport(state: BattleState, actor: Combatant, to: Offset, opts: TeleportOptions, label: string, rng: Rng, prior: BattleEvent[] = []): { problem: string } | { events: BattleEvent[] } {
  const why = teleportProblem(state, actor, to, opts);
  if (why) return { problem: why };
  return { events: withArrival(state, prior, [teleportEvent(actor, to, label)], rng) };
}

export type ForcedMode = 'push' | 'pull' | 'slide' | 'free';
export interface ForcedOptions {
  /** Kaynak noktası (itme/çekme/yana). */
  origin?: Offset;
  /** Serbest doğrultuda hedef altıgen. */
  to?: Offset;
  /** Yana kaydırmada yön: 1 saat yönü, −1 ters (varsayılan 1). */
  side?: 1 | -1;
  /** Çarpma hasarını kapat (çağıran özellik kendi hasarını veriyorsa). */
  noCollision?: boolean;
}

/** Çarpma kuralı açık mı (sürüm 24+, ev kuralı `carpmaHasari`). */
export const collisionOn = (s: BattleState): boolean => v24(s) && houseRule(s, 'carpmaHasari');

const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });

/** Bir adımın aday altıgeni (moda göre); yoksa null (doğal duruş: çekmede kaynağa bitişik, serbestte hedefte). */
function nextHex(state: BattleState, here: Offset, mode: ForcedMode, o: ForcedOptions): Offset | null | 'edge' {
  const size = sizeOf(state);
  const origin = o.origin ?? here;
  const a0 = offsetToAxial(origin), a1 = offsetToAxial(here);
  const v = { q: a1.q - a0.q, r: a1.r - a0.r };
  const dot = (h: Offset) => {
    const a = offsetToAxial(h);
    const dq = a.q - a1.q, dr = a.r - a1.r;
    return dq * v.q + dr * v.r + (-dq - dr) * (-v.q - v.r);
  };
  const d0 = distance(origin, here);
  if (mode === 'push') {
    const best = neighbors(here, size).filter((h) => distance(origin, h) > d0).sort((x, y) => dot(y) - dot(x))[0];
    // Haritanın kenarında uzaklaşacak altıgen kalmadıysa kenara çarpar (duvar sayılır).
    return best ?? (onEdge(here, size) ? 'edge' : null);
  }
  if (mode === 'pull') {
    if (d0 <= 1) return null;
    return neighbors(here, size).filter((h) => distance(origin, h) < d0).sort((x, y) => dot(x) - dot(y))[0] ?? null;
  }
  if (mode === 'slide') {
    const ring = neighbors(here, size).filter((h) => distance(origin, h) === d0);
    if (!ring.length) return null;
    const ang = (h: Offset) => { const a = offsetToAxial(h); return Math.atan2(a.r - a0.r + (a.q - a0.q) / 2, a.q - a0.q); };
    const cur = ang(here);
    const side = o.side ?? 1;
    return ring.sort((x, y) => side * (((ang(x) - cur + 2 * Math.PI) % (2 * Math.PI)) - ((ang(y) - cur + 2 * Math.PI) % (2 * Math.PI))))[0] ?? null;
  }
  // free
  if (!o.to || (o.to.col === here.col && o.to.row === here.row)) return null;
  const goal = o.to;
  return neighbors(here, size).sort((x, y) => distance(x, goal) - distance(y, goal))[0] ?? null;
}
const onEdge = (h: Offset, size: { cols: number; rows: number }) => h.col === 0 || h.row === 0 || h.col === size.cols - 1 || h.row === size.rows - 1;

/** Çarpma hasarı: yarıda kalan altıgen sayısı kadar 1d6 (en çok 3d6), kuvvet. */
export function collisionDice(remaining: number): string | null {
  const n = Math.min(MOTION.carpma.enCokZar, Math.max(0, remaining));
  return n > 0 ? `${n}${MOTION.carpma.zar}` : null;
}

/** P11: itmeye direnç kurtulması (DC: kaynağın büyü DC'si ya da 8 + yeterlilik + STR). Başarıda olaylar (not), değilse null. */
function pushResist(state: BattleState, targetId: string, by: string, rng: Rng): BattleEvent[] | null {
  const t = state.combatants[targetId];
  const src = state.combatants[by];
  if (ruleVersion(state) < 42 || !t?.effects?.some((e) => e.pkPushResist) || !src || src.id === t.id) return null;
  const dc = src.spellSaveDc ?? 8 + src.proficiency + Math.max(0, src.modifiers.str);
  const r = resolveSave({ extra: saveDice(t, 'str'), modifier: t.saves.str, dc, mode: 'advantage' }, rollTag(rng, { by: t.id }));
  return r.success ? [{ type: 'map_note', text: `${t.name}: zorla harekete direndi (STR ${r.total} / DC ${dc})` }] : null;
}

/**
 * Tek zorla hareket girişi. `feet` 5'in katı; her adım ayrı `pushed` + varış kuralları. Adım engelde kalırsa (duvar, nesne,
 * yaratık, harita kenarı) hareket biter ve çarpma kuralı açıksa hasar uygulanır. Lav/düşme gibi adımdan sonra durur.
 */
export function forcedMove(state: BattleState, targetId: string, mode: ForcedMode, feet: number, by: string, rng: Rng, o: ForcedOptions = {}): BattleEvent[] {
  // Kuyruk P11 (sürüm 42+, paket `koruma.itmeDirenci`): yaratığın yol açtığı zorla harekete avantajlı STR kurtulması (başarıda kımıldamaz).
  const res = pushResist(state, targetId, by, rng);
  if (res) return res;
  const events: BattleEvent[] = [];
  let current = state;
  const total = Math.floor(feet / 5);
  for (let step = 0; step < total; step++) {
    const t = current.combatants[targetId];
    if (!t?.pos || t.hp <= 0 || t.life === 'dead') break;
    const here = t.pos;
    const nx = nextHex(current, here, mode, o);
    if (nx === null) break;
    const out = nx === 'edge' ? null : pushOutcome(current, t, here, nx);
    if (!out || !out.ok) {
      if (!o.noCollision && collisionOn(current)) {
        const dice = collisionDice(total - step);
        if (dice) {
          const hit = { damage: dice, damageType: MOTION.carpma.tur };
          const evs: BattleEvent[] = [hitEffect(t, 'carpmaHasari', MOTION.carpma.metin.tr, hit, rng)];
          const blocker = nx !== 'edge' ? occupantAt(current, nx) : null;
          if (blocker && blocker.id !== t.id && blocker.hp > 0) evs.push(hitEffect(blocker, 'carpmaHasari', MOTION.carpma.metinCarpilan.tr, hit, rng));
          events.push(...evs);
          current = applyEvents(current, evs);
        }
      }
      break;
    }
    const evs = forcedMoveEvents(current, targetId, out, by, rng);
    events.push(...evs);
    current = applyEvents(current, evs);
    if (out.kind !== 'move') break;
  }
  return events;
}
