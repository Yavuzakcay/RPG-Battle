/**
 * Kuyruk 30 D2: suda yüzey azalması (harita bağımsız Game Master mekaniği `waterSurfaceDecay`, kural sürümü 10,
 * varsayılan açık). Her yeni tur başında, su altıgenlerindeki (`data/yuzeyler.json` `waterTiles`):
 * - Gres (Grease), yağ ve kaygan yüzeyin sudaki altıgenlerinin yarısı (en az `shrink`, varsayılan 1) kaybolur; kıyıya
 *   (su olmayan zemine) en yakın olanlar önce. Tipik gres 2–3 turda sudan tamamen gider.
 * - Alev ve yanan ağ (yanan yağ/gres dahil) sudaki altıgenlerde bir sonraki tur başında söner.
 * Karadaki altıgenler değişmez; alanın bütün altıgenleri giderse alan biter. Bağlı (yürüyen) alanlara dokunulmaz.
 * Olaylar `zone_moved` ve `zone_ended`. Saf.
 */
import { distance, type Offset } from '../rules/hex';
import { globalRule } from './ruleControl';
import { GREASE_SPELL } from './ignite';
import surfaceData from '../../data/yuzeyler.json';
import type { BattleEvent, BattleState, SpellZone } from './types';

const WATER = new Set<string>((surfaceData as { waterTiles: string[] }).waterTiles);
const SLICK = new Set(['oil', 'slick']);
const FIRE = new Set(['fire', 'burningWeb']);
const num = (v: unknown, d: number): number => (typeof v === 'number' ? v : d);

const kindOf = (z: SpellZone): 'slick' | 'fire' | null =>
  z.surface && SLICK.has(z.surface) ? 'slick' : z.surface && FIRE.has(z.surface) ? 'fire' : z.spellId === GREASE_SPELL ? 'slick' : null;

export function waterDecayEvents(state: BattleState): BattleEvent[] {
  const r = globalRule(state, 'waterSurfaceDecay');
  if (!r || !state.map) return [];
  const tiles = state.map.tiles;
  const isWater = (h: Offset) => WATER.has(tiles[h.row]?.[h.col] ?? '#');
  const shore: Offset[] = [];
  tiles.forEach((row, r0) => [...row].forEach((ch, col) => { if (!WATER.has(ch)) shore.push({ col, row: r0 }); }));
  const toShore = (h: Offset) => shore.reduce((m, s) => Math.min(m, distance(h, s)), 99);
  const out: BattleEvent[] = [];
  for (const z of state.map.zones ?? []) {
    const kind = kindOf(z);
    if (!kind || z.anchorId) continue;
    const wet = z.hexes.filter(isWater);
    if (!wet.length) continue;
    let drop: Offset[];
    if (kind === 'fire') drop = wet;
    else {
      const n = Math.max(num(r.shrink, 1), Math.ceil(wet.length / 2));
      drop = [...wet].sort((a, b) => toShore(a) - toShore(b) || a.row - b.row || a.col - b.col).slice(0, n);
    }
    const keep = z.hexes.filter((h) => !drop.some((d) => d.col === h.col && d.row === h.row));
    out.push(keep.length ? { type: 'zone_moved', zoneId: z.id, hexes: keep } : { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'expired' });
  }
  return out;
}
