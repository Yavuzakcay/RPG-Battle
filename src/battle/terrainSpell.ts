/**
 * Kuyruk K56: arazi × büyü (kural sürümü 33, Game Master anahtarı `araziBuyuEtkisi`, varsayılan açık). Zemin türünden
 * arazi etiketleri (`data/zemin-etiketleri.json`); büyünün element dokunuşu (ateş, soğuk) değdiği altıgende etikete
 * göre yüzey bırakır (`data/arazi-buyu-etkileri.json`: kuru ot tutuşur, sığ su donar, kar erir, sıcak zemin buhar
 * salar). Hasar zarlarına dokunmaz. K55 altıgen etki çözücüsünde (`hexResolver.ts`) büyü × yüzey adımından sonra, aura
 * adımından önce çalışır; oluşan yüzey çözücünün zincirine girer. Aynı katmanda zaten yüzey olan altıgen atlanır.
 * Saf; zar atmaz.
 */
import tagData from '../../data/zemin-etiketleri.json';
import table from '../../data/arazi-buyu-etkileri.json';
import { hexKey, neighbors, type Offset } from '../rules/hex';
import { globalRule } from './ruleControl';
import { surfaceEvent } from './surfaces';
import type { BattleEvent, BattleState, SpellZone, SurfaceKind } from './types';

export interface TerrainRow { id: string; element: string; hepsi: string[]; haric?: string[]; yuzey: SurfaceKind; sure: number; yayilma: number; tr: string; en: string }
export const TERRAIN_ROWS = table.satirlar as TerrainRow[];
const TAGS = tagData.zemin as Record<string, string[]>;
export const TERRAIN_VERSION = 33;

/** Altıgenin zemin harfi (haritada yoksa boş). */
const charAt = (s: BattleState, h: Offset): string => s.map?.tiles[h.row]?.[h.col] ?? '';
/** Altıgenin arazi etiketleri (zemin türünden). */
export const terrainTags = (s: BattleState, h: Offset): string[] => TAGS[charAt(s, h)] ?? [];
/** Zemin harfinin etiketleri (bilgi kartı). */
export const tagsOfChar = (ch: string): string[] => TAGS[ch] ?? [];

/** Bu savaşta açık mı (sürüm 33+, anahtar açık). */
export const terrainSpellOn = (s: BattleState): boolean => !!globalRule(s, 'araziBuyuEtkisi');

const matches = (row: TerrainRow, tags: string[]) => row.hepsi.every((t) => tags.includes(t)) && !(row.haric ?? []).some((t) => tags.includes(t));
/** Altıgen için ilk eşleşen satır. */
export function terrainRowFor(s: BattleState, element: string, h: Offset): TerrainRow | null {
  const tags = terrainTags(s, h);
  if (!tags.length) return null;
  return TERRAIN_ROWS.find((r) => r.element === element && matches(r, tags)) ?? null;
}

const layerOf = (k: SurfaceKind) => (k === 'steam' || k === 'poison' ? 'gaz' : 'zemin');
const occupied = (s: BattleState, h: Offset, layer: string) => (s.map?.zones ?? [])
  .some((z: SpellZone) => !!z.surface && layerOf(z.surface) === layer && z.hexes.some((x) => hexKey(x) === hexKey(h)));

/**
 * Element dokunuşunun arazi etkileri: satır başına yüzey (altıgenler + yayılma halkaları), günlükte satır başına
 * tek `surface_reacted` (`row: arazi:<id>`). Dönen olaylar çözücüde uygulanır.
 */
export function terrainSpellEvents(s: BattleState, element: string, hexes: Offset[], actorId: string, side: SpellZone['side'], label: string): BattleEvent[] {
  if (!s.map || !terrainSpellOn(s)) return [];
  const byRow = new Map<string, { row: TerrainRow; hexes: Offset[] }>();
  const seen = new Set<string>();
  const add = (row: TerrainRow, h: Offset) => {
    const k = hexKey(h);
    if (seen.has(k) || occupied(s, h, layerOf(row.yuzey))) return;
    seen.add(k);
    const g = byRow.get(row.id) ?? { row, hexes: [] };
    g.hexes.push(h);
    byRow.set(row.id, g);
  };
  for (const h of hexes) { const row = terrainRowFor(s, element, h); if (row) add(row, h); }
  // Yayılma: aynı satıra uyan komşu zeminler (halka halka).
  for (const g of [...byRow.values()]) {
    let ring = g.hexes;
    for (let i = 0; i < g.row.yayilma; i++) {
      const next: Offset[] = [];
      for (const h of ring) for (const n of neighbors(h)) {
        if (n.col < 0 || n.row < 0 || n.row >= (s.map.tiles.length) || n.col >= (s.map.tiles[0]?.length ?? 0)) continue;
        if (seen.has(hexKey(n)) || terrainRowFor(s, element, n)?.id !== g.row.id) continue;
        const before = g.hexes.length; add(g.row, n); if (g.hexes.length > before) next.push(n);
      }
      ring = next;
    }
  }
  const out: BattleEvent[] = [];
  let cur = s;
  for (const { row, hexes: hs } of byRow.values()) {
    if (!hs.length) continue;
    const ev = surfaceEvent(cur, row.yuzey, hs, actorId, side);
    if (ev.type === 'zone_created') ev.zone.until = s.round + row.sure - 1;
    out.push({ type: 'surface_reacted', reaction: 'terrain', hexes: hs, sourceId: actorId, label, row: `arazi:${row.id}` }, ev);
    // Aynı komutta birden çok satır: kimlik çakışmasın.
    cur = { ...cur, map: { ...cur.map!, zones: [...(cur.map?.zones ?? []), (ev as Extract<BattleEvent, { type: 'zone_created' }>).zone] } };
  }
  return out;
}

/**
 * Yapay zekâ için basit sezgi: komutun arazi etkisi (alev, buhar, buz) bu tarafın bir yaratığının altıgeninde ya da
 * bitişiğinde yüzey bırakıyor mu (dostu yakacak/kör edecek/kaydıracak alanı seçme).
 */
export function terrainEndangersSide(state: BattleState, events: BattleEvent[], side: string): boolean {
  const near = new Set<string>();
  for (const c of Object.values(state.combatants)) {
    if (c.side !== side || c.hp <= 0 || !c.pos) continue;
    near.add(hexKey(c.pos));
    for (const n of neighbors(c.pos)) near.add(hexKey(n));
  }
  return events.some((e) => e.type === 'surface_reacted' && e.reaction === 'terrain' && e.hexes.some((h) => near.has(hexKey(h))));
}
