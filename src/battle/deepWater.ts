/**
 * Kuyruk 24d: çok derin su (harita bağımsız Game Master mekaniği `deepWaterLimit`, kural sürümü 5; `data/derin-su.json`).
 * Derin su altıgeninin (zemin kuralı `deepWater`) en yakın kara altıgenine (derin olmayan, geçilebilir) altıgen uzaklığı
 * eşiği (`threshold`, 3) aşarsa "çok derin": yalnızca yüzme hızı olan (SRD listesi), suda yürüyen (süren etki) ve uçan/havada
 * duran girebilir. Eşik içinde mevcut derin su kuralı (yüzme) aynen. Uzaklık zemin satırlarına göre bir kez hesaplanır ve
 * önbellekte durur (`tile_changed` yeni satır dizisi üretir: yeniden hesaplanır). Yol bulma ve yapay zekâ `moveCostFn`
 * üstünden aynı kuralı kullanır. Saf.
 */
import data from '../../data/derin-su.json';
import { neighbors, type Offset } from '../rules/hex';
import { terrainOf } from '../map/terrain';
import { globalRule } from './ruleControl';
import { isAirborne } from './flight';
import type { BattleState, Combatant } from './types';

const SWIMMERS = new Set<string>(data.swimmers);
const WATER_WALK = new Set<string>(data.waterWalkEffects);
const cache = new WeakMap<readonly string[], Int16Array>();

const isDeep = (ch: string) => terrainOf(ch).rule === 'deepWater';
const isLand = (ch: string) => { const t = terrainOf(ch); return !isDeep(ch) && t.movement !== 'blocked' && t.movement !== 'deadly' && !t.outOfBounds; };

/** Her altıgenin en yakın karaya altıgen uzaklığı (kara 0; kara yoksa çok büyük). Önbellekli. */
export function shoreDistances(tiles: readonly string[]): Int16Array {
  const hit = cache.get(tiles);
  if (hit) return hit;
  const rows = tiles.length, cols = tiles[0]?.length ?? 0;
  const dist = new Int16Array(rows * cols).fill(32000);
  const queue: Offset[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (isLand(tiles[r]?.[c] ?? '#')) { dist[r * cols + c] = 0; queue.push({ col: c, row: r }); }
  for (let i = 0; i < queue.length; i++) {
    const h = queue[i] as Offset;
    const d = dist[h.row * cols + h.col] as number;
    for (const n of neighbors(h, { cols, rows })) {
      const k = n.row * cols + n.col;
      if ((dist[k] as number) > d + 1) { dist[k] = d + 1; queue.push(n); }
    }
  }
  cache.set(tiles, dist);
  return dist;
}

/** Altıgen çok derin mi (eşik verilerek; mekanik denetimi yok). */
export function veryDeepAt(tiles: readonly string[], h: Offset, threshold: number): boolean {
  const ch = tiles[h.row]?.[h.col];
  if (ch === undefined || !isDeep(ch)) return false;
  return (shoreDistances(tiles)[h.row * (tiles[0]?.length ?? 0) + h.col] as number) > threshold;
}

/** Mekanik açıksa eşik; değilse null. */
export function deepThreshold(state: BattleState): number | null {
  const r = globalRule(state, 'deepWaterLimit');
  return r ? (typeof r.threshold === 'number' ? r.threshold : 3) : null;
}

/**
 * Kuyruk 19: Water Walk (SRD 5.2.1): sıvı yüzeyinde zararsız katı zeminmiş gibi yürür. Anahtar `waterWalk` (sürüm 16):
 * sığ su/çamur, derin su ve derin batak normal zemin maliyetinde; batma ve batağa saplanma yok.
 */
export function waterWalks(state: Pick<BattleState, 'map' | 'kuralSurumu'>, c: Pick<Combatant, 'effects'>): boolean {
  return !!c.effects?.some((e) => e.waterWalk || WATER_WALK.has(e.id)) && !!globalRule(state, 'waterWalk');
}
/** Sıvı zemin mi (Water Walk'un üstünde yürüdüğü): sığ su/çamur, derin su, derin batak, nehir. */
export const isLiquidTile = (t: { char: string; rule?: string }): boolean => t.rule === 'deepWater' || t.rule === 'bog' || t.char === 'n' || t.char === 'R';

/** Çok derin suya girebilir mi: uçan/havada, yüzme hızı olan, suda yürüyen. */
export function canEnterVeryDeep(c: Combatant): boolean {
  return isAirborne(c) || (!!c.monsterId && SWIMMERS.has(c.monsterId)) || !!c.effects?.some((e) => WATER_WALK.has(e.id));
}

/** Yol bulma: bu yaratık için çok derin su altıgeni geçilmez mi (mekanik kapalıysa hep false). */
export function deepWaterBlocks(state: BattleState, actor: Combatant): (h: Offset) => boolean {
  const limit = deepThreshold(state);
  const tiles = state.map?.tiles;
  if (limit === null || !tiles || canEnterVeryDeep(actor)) return () => false;
  return (h) => veryDeepAt(tiles, h, limit);
}
