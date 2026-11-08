/**
 * Kuyruk K71b (sürüm 57+, K15; yeni taktik yok): Çeviklik tırmanıcısının duvar aşması yol bulmada.
 *
 * - **Yerde:** yalnız tırmanılabilir yüzeye bitişikken değerlendirilir (erken eleme). Duvarsız yol (yürüyüş maliyeti en yakın
 *   düşmanın yanına) yoksa ya da tırmanma yolunun beklenen maliyetinin en az iki katıysa tırmanmaya başlar. Beklenen maliyet:
 *   tırmanış (tepe / 5 × çarpan) + tepede öte yana geçiş + iniş + inişten düşmana yürüyüş + başarısızlığın beklenen kaybı
 *   ((1 / olasılık − 1) × çarpan). Olasılık 0 ise hiç denemez.
 * - **Duvarda:** üç seçenekten ucuzu: burada in; şimdiki irtifada duvar boyunca/üstünden ilerleyip in; tepeye çıkıp öte yana
 *   geçip in. Eşitlikte iner.
 * Alanlar tek çağrıda bir kez (düşmana yürüyüş alanı: çok kaynaklı, ters yönlü Dijkstra), duruma bağlı önbellek.
 */
import { neighbors, hexKey, findPath, type Offset } from '../../rules/hex';
import { ALT, altitudeOf, climbingAloft } from '../altitude';
import { climbOdds, dexClimber, holdSurface, surfacesNear } from '../climbing';
import { moveCostFn, occupantAt, terrainAt } from '../movement';
import { speedHexes } from '../reduce';
import type { BattleState, Combatant, Command } from '../types';

type Try = (state: BattleState, actor: Combatant, cmd: Command) => { ok: boolean };
type Cost = (h: Offset, prev: Offset) => number | null;

export const climbAiStats = { calls: 0, fields: 0 };

const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const standable = (s: BattleState, h: Offset, me: string): boolean => {
  const t = terrainAt(s, h);
  return t.movement !== 'blocked' && t.movement !== 'deadly' && !occupantAt(s, h, me);
};

/** Çok kaynaklı Dijkstra: her altıgenden düşman yanına yürüyüş maliyeti (ters yön: `cost(cur, n)`). */
function foeField(state: BattleState, actor: Combatant, foes: Combatant[], cost: Cost): Map<string, number> {
  climbAiStats.fields++;
  const size = sizeOf(state);
  const best = new Map<string, number>();
  const open: Array<{ hex: Offset; cost: number }> = [];
  for (const f of foes) {
    if (!f.pos) continue;
    for (const n of neighbors(f.pos, size)) {
      if (!standable(state, n, actor.id) && !(actor.pos && n.col === actor.pos.col && n.row === actor.pos.row)) continue;
      if (best.has(hexKey(n))) continue;
      best.set(hexKey(n), 0);
      open.push({ hex: n, cost: 0 });
    }
  }
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if ((open[i] as { cost: number }).cost < (open[bi] as { cost: number }).cost) bi = i;
    const cur = open.splice(bi, 1)[0] as { hex: Offset; cost: number };
    if (cur.cost > (best.get(hexKey(cur.hex)) ?? Infinity)) continue;
    for (const n of neighbors(cur.hex, size)) {
      const step = cost(cur.hex, n);
      if (step === null) continue;
      const c = cur.cost + step;
      if (c >= (best.get(hexKey(n)) ?? Infinity)) continue;
      best.set(hexKey(n), c);
      open.push({ hex: n, cost: c });
    }
  }
  return best;
}

/** İrtifada (duvarda) yürünebilen altıgenler ve maliyetleri; varış: durulabilen, boş altıgen. */
function aloftCosts(state: BattleState, actor: Combatant, alt: number): Map<string, number> {
  if (!actor.pos) return new Map();
  const me = { ...actor, altitudeFt: alt, climbing: true as const };
  const size = sizeOf(state);
  const cost = moveCostFn(state, me);
  const best = new Map<string, number>([[hexKey(actor.pos), 0]]);
  const open: Array<{ hex: Offset; cost: number }> = [{ hex: actor.pos, cost: 0 }];
  const cap = 24;
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if ((open[i] as { cost: number }).cost < (open[bi] as { cost: number }).cost) bi = i;
    const cur = open.splice(bi, 1)[0] as { hex: Offset; cost: number };
    if (cur.cost > (best.get(hexKey(cur.hex)) ?? Infinity)) continue;
    for (const n of neighbors(cur.hex, size)) {
      const step = cost(n, cur.hex);
      if (step === null) continue;
      const c = cur.cost + step;
      if (c > cap || c >= (best.get(hexKey(n)) ?? Infinity)) continue;
      best.set(hexKey(n), c);
      open.push({ hex: n, cost: c });
    }
  }
  return best;
}

const parse = (k: string): Offset => { const [col, row] = k.split(',').map(Number) as [number, number]; return { col, row }; };

interface Option { score: number; kind: 'down' | 'move' | 'up'; to?: Offset; toFt?: number }

const cache = new WeakMap<BattleState, Map<string, Command | null>>();

/** YZ tırmanma kararı (sürüm 57+; Çeviklik tırmanıcısı): komut ya da null. */
export function wallClimbCommand(state: BattleState, actor: Combatant, foes: Combatant[], tryCmd: Try): Command | null {
  if (!actor.pos || !state.map || !dexClimber(state, actor) || actor.summon) return null;
  const alt = altitudeOf(actor);
  const aloft = climbingAloft(actor);
  if (alt < 0 || (alt > 0 && !aloft)) return null;
  const near = surfacesNear(state, actor);
  if (!aloft && !near.length) return null;
  const live = foes.filter((f) => f.pos && f.hp > 0);
  if (!live.length) return null;
  const left = speedHexes(actor) - actor.movementUsed;
  if (left <= 0) return null;
  let m = cache.get(state);
  if (!m) { m = new Map(); cache.set(state, m); }
  const key = `${actor.id}|${alt}|${actor.movementUsed}`;
  if (m.has(key)) return m.get(key) ?? null;
  climbAiStats.calls++;
  const cmd = decide(state, actor, live, near, alt, aloft, left, tryCmd);
  m.set(key, cmd);
  return cmd;
}

function decide(state: BattleState, actor: Combatant, foes: Combatant[], near: ReturnType<typeof surfacesNear>, alt: number, aloft: boolean, left: number,
  tryCmd: Try): Command | null {
  const pos = actor.pos as Offset;
  const ground = foeField(state, actor, foes, moveCostFn(state, { ...actor, altitudeFt: 0, climbing: undefined }));
  const at = (h: Offset) => ground.get(hexKey(h)) ?? Infinity;
  const step = (h: Offset, a: number) => holdSurface(state, actor, h, a)?.carpan ?? 2;
  // Tepeye çıkıp öte yana geçme: en yüksek bitişik tepe (duvar boyu).
  const top = Math.max(alt, ...near.map((s) => s.topFt));
  const kTop = near.filter((s) => s.topFt >= top).sort((a, b) => a.carpan - b.carpan)[0]?.carpan ?? 2;
  const crossFrom = (a: number, climbCost: number): Option | null => {
    if (a <= 0) return null;
    let best: Option | null = null;
    for (const [k, c] of aloftCosts(state, actor, a)) {
      const h = parse(k);
      if (c === 0 || !standable(state, h, actor.id)) continue;
      const score = climbCost + c + (a / ALT.stepFt) * step(h, a) + at(h);
      if (!best || score < best.score) best = { score, kind: 'move', to: h };
    }
    return best;
  };
  if (!aloft) {
    // Yerde: duvarsız yol ile tırmanma yolunu karşılaştır (K15: duvarsız yol ≥ 2 × beklenen tırmanma).
    const easiest = [...near].sort((a, b) => a.dc - b.dc)[0];
    const p = easiest ? climbOdds(actor, easiest.dc) : 0;
    if (p <= 0) return null;
    const walk = at(pos);
    const cross = crossFrom(top, (top / ALT.stepFt) * kTop + (1 / p - 1) * kTop);
    if (!cross || !Number.isFinite(cross.score)) return null;
    if (Number.isFinite(walk) && walk < 2 * cross.score) return null;
    const toFt = Math.min(top, Math.floor(left / kTop) * ALT.stepFt);
    if (toFt <= 0) return null;
    const cmd: Command = { type: 'vertical_move', actorId: actor.id, toFt };
    return tryCmd(state, actor, cmd).ok ? cmd : null;
  }
  // Duvarda: in / ilerle / tepeye çık.
  const kHere = step(pos, alt);
  const opts: Option[] = [{ score: (alt / ALT.stepFt) * kHere + at(pos), kind: 'down' }];
  const move = crossFrom(alt, 0);
  if (move) opts.push(move);
  if (top > alt) {
    const up = crossFrom(top, ((top - alt) / ALT.stepFt) * kTop);
    if (up) opts.push({ ...up, kind: 'up', toFt: top });
  }
  const best = opts.reduce((a, b) => (b.score < a.score ? b : a));
  if (best.kind === 'down' || !Number.isFinite(best.score)) {
    const toFt = Math.max(0, alt - Math.floor(left / kHere) * ALT.stepFt);
    if (toFt >= alt) return null;
    const cmd: Command = { type: 'vertical_move', actorId: actor.id, toFt };
    return tryCmd(state, actor, cmd).ok ? cmd : null;
  }
  if (best.kind === 'up') {
    const toFt = Math.min(top, alt + Math.floor(left / kTop) * ALT.stepFt);
    if (toFt <= alt) return null;
    const cmd: Command = { type: 'vertical_move', actorId: actor.id, toFt };
    return tryCmd(state, actor, cmd).ok ? cmd : null;
  }
  // İlerle: yolu bütçeye kırp; engel tepesinde durulmaz (son durulabilen altıgen).
  const path = findPath(pos, best.to as Offset, sizeOf(state), moveCostFn(state, actor));
  if (!path) return null;
  const cost = moveCostFn(state, actor);
  let spent = 0;
  let end: Offset | null = null;
  let prev = pos;
  for (const h of path.path) {
    const c = cost(h, prev);
    if (c === null || spent + c > left) break;
    spent += c;
    if (standable(state, h, actor.id)) end = h;
    prev = h;
  }
  if (!end) return null;
  const cmd: Command = { type: 'move', actorId: actor.id, to: end };
  return tryCmd(state, actor, cmd).ok ? cmd : null;
}
