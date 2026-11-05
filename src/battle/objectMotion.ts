/**
 * Kuyruk K53 S3: nesne kaynağı ve nesne hareketi (GM anahtarı `objectMotion`, kural sürümü 24; `data/nesne-hareket.json`).
 * - Hareketli nesneler (varil, sandık, kaya…) ağırlık sınıfıyla (hafif/orta/ağır) itilir/çekilir (`forcedMoveObject`:
 *   `forcedMove` ile aynı kipler; mesafe × itmeCarpani, ağır itilmez) ve fırlatılır (`throwObject`: en çok firlatmaFt).
 * - Fırlatılan nesne hedef altıgendeki yaratığa çağıran özelliğin zarını tek kez verir (çarpma kuralıyla çift hasar yok);
 *   nesnenin kendisi de aynı hasarı alır (`damageObjectEvents`: yağ fıçısı kırılınca yağ yüzeyi, barut patlar…).
 * - `conjureDebris`: yakında hareketli nesne yoksa zemin türüne göre bir taş/enkaz belirir (`enkazZeminleri`).
 * Saf; `rng` enjekte.
 */
import data from '../../data/nesne-hareket.json';
import { applyEvents } from './reduce';
import { damageObjectEvents, makeObject } from './objects';
import { objectAt } from './objectData';
import { occupantAt, terrainAt } from './movement';
import { globalRule } from './ruleControl';
import { ruleVersion } from './ruleVersion';
import { hitEffect } from './maprules';
import { collisionDice, collisionOn, MOTION_VERSION, type ForcedMode, type ForcedOptions } from './motion';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { distance, neighbors, offsetToAxial, type Offset } from '../rules/hex';
import type { BattleEvent, BattleState, MapObject } from './types';

export const OBJECT_MOTION = data;
type Weight = keyof typeof data.agirlik;

export const objectMotionOn = (s: BattleState): boolean => ruleVersion(s) >= MOTION_VERSION && !!globalRule(s, 'objectMotion');
/** Nesnenin ağırlık sınıfı; hareketli değilse null. */
export const weightOf = (o: MapObject): Weight | null => ((data.hareketli as Record<string, Weight>)[o.kind] ?? null);
const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const same = (a: Offset, b: Offset) => a.col === b.col && a.row === b.row;
const objOf = (s: BattleState, id: string) => s.map?.objects?.find((o) => o.id === id && !o.carriedBy);

/** Nesne bu altıgene girebilir mi (harita içi, engel değil, başka nesne/yaratık yok). Lav: nesne yanar/yok olur. */
function objectStep(s: BattleState, h: Offset): 'ok' | 'lava' | 'blocked' | { creature: string } {
  const size = sizeOf(s);
  if (h.col < 0 || h.row < 0 || h.col >= size.cols || h.row >= size.rows) return 'blocked';
  const c = occupantAt(s, h);
  if (c) return { creature: c.id };
  if (objectAt(s, h)) return 'blocked';
  const t = terrainAt(s, h);
  if (t.movement === 'blocked') return 'blocked';
  if (t.movement === 'deadly') return 'lava';
  return 'ok';
}

function nextFor(at: Offset, mode: ForcedMode, o: ForcedOptions, size: { cols: number; rows: number }): Offset | null {
  const origin = o.origin ?? at;
  const d0 = distance(origin, at);
  const a0 = offsetToAxial(origin), a1 = offsetToAxial(at);
  const v = { q: a1.q - a0.q, r: a1.r - a0.r };
  const dot = (h: Offset) => { const a = offsetToAxial(h); const dq = a.q - a1.q, dr = a.r - a1.r; return dq * v.q + dr * v.r + (-dq - dr) * (-v.q - v.r); };
  const ns = neighbors(at, size);
  if (mode === 'push') return ns.filter((h) => distance(origin, h) > d0).sort((x, y) => dot(y) - dot(x))[0] ?? null;
  if (mode === 'pull') return d0 <= 1 ? null : ns.filter((h) => distance(origin, h) < d0).sort((x, y) => dot(x) - dot(y))[0] ?? null;
  if (mode === 'free') return o.to && !same(o.to, at) ? ns.sort((x, y) => distance(x, o.to as Offset) - distance(y, o.to as Offset))[0] ?? null : null;
  return ns.filter((h) => distance(origin, h) === d0)[0] ?? null;
}

/**
 * Nesneyi zorla hareket ettir (itme/çekme/yana/serbest). Mesafe ağırlıkla çarpılır (ağır nesne itilmez). Yaratığa
 * çarparsa nesne durur, yaratık çarpma kuralıyla yarıda kalan altıgen kadar 1d6 (en çok 3d6) alır. Lava giren nesne yok olur.
 */
export function forcedMoveObject(state: BattleState, objectId: string, mode: ForcedMode, feet: number, by: string, rng: Rng, o: ForcedOptions = {}): BattleEvent[] {
  if (!objectMotionOn(state)) return [];
  const obj = objOf(state, objectId);
  const w = obj ? weightOf(obj) : null;
  if (!obj || !w) return [];
  const steps = Math.floor(Math.floor(feet / 5) * data.agirlik[w].itmeCarpani);
  const out: BattleEvent[] = [];
  let cur = state;
  let at = obj.at;
  for (let i = 0; i < steps; i++) {
    const nx = nextFor(at, mode, o, sizeOf(cur));
    if (!nx) break;
    const r = objectStep(cur, nx);
    if (r === 'ok') {
      const ev: BattleEvent = { type: 'object_changed', objectId, label: `${by}: itildi`, at: nx };
      out.push(ev); cur = applyEvents(cur, [ev]); at = nx; continue;
    }
    if (r === 'lava') { const ev: BattleEvent = { type: 'object_destroyed', objectId, label: 'lava düştü' }; out.push(ev); cur = applyEvents(cur, [ev]); break; }
    if (typeof r === 'object' && !o.noCollision && collisionOn(cur)) {
      const dice = collisionDice(steps - i);
      const c = cur.combatants[r.creature];
      if (dice && c) { const ev = hitEffect(c, 'carpmaHasari', 'nesne çarptı', { damage: dice, damageType: 'force' }, rng); out.push(ev); cur = applyEvents(cur, [ev]); }
    }
    break;
  }
  return out;
}

/** Fırlatma mesafesi (ft) ağırlığa göre; hareketli değilse 0. */
export const throwRangeFt = (o: MapObject): number => { const w = weightOf(o); return w ? data.agirlik[w].firlatmaFt : 0; };

/**
 * Nesneyi fırlat: `from` (fırlatanın yeri) ile hedef arası en çok `throwRangeFt`. Hedefte yaratık varsa zar (`hit`, yoksa
 * 3d6 kuvvet) bir kez atılır; yaratık hasarı alır, nesne de aynı hasarı (kırılabilir) ve yaratığın yanındaki boş altıgene
 * düşer. Hedef boşsa nesne oraya iner. Geçersizse neden.
 */
export function throwObject(state: BattleState, from: Offset, objectId: string, to: Offset, by: string, rng: Rng, hit?: { dice: string; type: string }): { problem: string } | { events: BattleEvent[] } {
  if (!objectMotionOn(state)) return { problem: 'Nesne hareketi kapalı.' };
  const obj = objOf(state, objectId);
  if (!obj) return { problem: 'Nesne yok.' };
  const range = throwRangeFt(obj);
  if (!range) return { problem: 'Bu nesne fırlatılamaz.' };
  if (distance(from, to) * 5 > range) return { problem: `En çok ${range} ft fırlatılabilir.` };
  const target = occupantAt(state, to);
  if (!target) {
    const st = objectStep(state, to);
    if (st === 'blocked') return { problem: 'Hedef altıgen dolu.' };
    if (st === 'lava') return { events: [{ type: 'object_destroyed', objectId, label: 'lava düştü' }] };
    return { events: [{ type: 'object_changed', objectId, label: `${by}: fırlattı`, at: to }] };
  }
  const h = hit ?? { dice: data.firlatmaHasari.zar, type: data.firlatmaHasari.tur };
  const d = rollDice(h.dice, rollTag(rng, { kind: 'damage', by }));
  const events: BattleEvent[] = [hitEffect(target, 'objectThrow', `${obj.kind} fırlatıldı`, { damage: `${d.total}`, damageType: h.type }, rng)];
  let cur = applyEvents(state, events);
  const land = neighbors(to, sizeOf(cur)).filter((n) => objectStep(cur, n) === 'ok').sort((x, y) => distance(x, from) - distance(y, from))[0];
  if (land) { const ev: BattleEvent = { type: 'object_changed', objectId, label: `${by}: fırlattı`, at: land }; events.push(ev); cur = applyEvents(cur, [ev]); }
  const moved = cur.map?.objects?.find((x) => x.id === objectId);
  if (moved) events.push(...damageObjectEvents(cur, moved, d.total, h.type, by, 'fırlatma', rng));
  return { events };
}

/**
 * Enkaz çağır: `near` çevresinde (yarıçap 1) hareketli nesne varsa onu döner; yoksa boş komşu altıgende zemin türünün
 * enkazı (taş) belirir (`object_placed`). Uygun boş altıgen yoksa null.
 */
export function conjureDebris(state: BattleState, near: Offset): { objectId: string; events: BattleEvent[]; label: { tr: string; en: string } } | null {
  if (!objectMotionOn(state)) return null;
  const size = sizeOf(state);
  const ring = [near, ...neighbors(near, size)];
  for (const h of ring) { const o = objectAt(state, h); if (o && weightOf(o)) return { objectId: o.id, events: [], label: { tr: o.kind, en: o.kind } }; }
  const spot = ring.find((h) => objectStep(state, h) === 'ok');
  if (!spot) return null;
  const ch = state.map?.tiles[near.row]?.[near.col] ?? '.';
  const label = (data.enkazZeminleri as Record<string, { tr: string; en: string }>)[ch] ?? { tr: 'taş', en: 'stone' };
  const obj = makeObject(state, 'rock', spot);
  return { objectId: obj.id, events: [{ type: 'object_placed', object: obj }], label };
}
