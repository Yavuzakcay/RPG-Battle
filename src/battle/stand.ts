/**
 * Kuyruk K72 (kural sürümü 60+; `harita/belgeler/K72-DENETIM.md`): duruş yüzeyi. Sur tepesi (K5) ve çok katlı binanın
 * döşemesi tek kavram: altıgenin zemininden belli bir yükseklikte durulabilen yüzey.
 *
 * - **Zemin (0):** altıgen geçilmez ya da harita dışı değilse.
 * - **Sur tepesi:** geçilmez duvar harfi varyantın `dikey.surUstu` listesindeyse; yükseklik engel tepesi (`dikey.engel`
 *   altıgen ezmesi, yoksa harf tablosu `harfFt`).
 * - **Kat döşemesi:** `dikey.katlar[]` bölgesindeki altıgende `ft` (merdiven altıgeni dahil; delik ve çöken döşeme hariç).
 * Yaratık irtifası altıgeninin bir duruş yüksekliğine eşitse o yüzeyde durur (`standingOn`): havada değil, tırmanmıyor;
 * komut sonunda düşmez, Prone olsa da. Döşeme (merdiven ve delik dışı) dikey geçişi ve görüşü keser (`slabBetween`).
 * Kayıt biçimi aynı: kat ayrı alan değil, irtifadan (⚠ PLAN'daki `kat` alanından sapma). Saf; 59 ve altında boş.
 */
import { dikeyOf, engelEzme, harfFt } from './vertical';
import { k72On } from './heights';
import { terrainOf } from '../map/terrain';
import type { MapDikey, MapKat } from '../map/maps';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant } from './types';

type St = Pick<BattleState, 'map' | 'kuralSurumu'>;
const key = (h: Offset): string => `${h.col},${h.row}`;

interface KatTab {
  /** Durulan döşeme yükseklikleri (merdiven dahil, delik hariç). */
  floor: Map<string, Array<{ id: string; ft: number }>>;
  /** Kesen döşeme (merdiven ve delik hariç). */
  slab: Map<string, Array<{ id: string; ft: number }>>;
  /** Merdiven altıgeninin bağladığı döşemeler. */
  stairs: Map<string, number[]>;
}
const TAB = new WeakMap<MapDikey, KatTab>();
function tab(d: MapDikey): KatTab {
  let t = TAB.get(d);
  if (t) return t;
  t = { floor: new Map(), slab: new Map(), stairs: new Map() };
  const push = <V>(m: Map<string, V[]>, k: string, v: V) => { const l = m.get(k); if (l) l.push(v); else m.set(k, [v]); };
  for (const k of d.katlar ?? []) {
    const holes = new Set(k.delik ?? []);
    const stairs = new Set(k.merdiven ?? []);
    for (const h of new Set([...k.altigenler, ...stairs])) {
      if (holes.has(h)) continue;
      push(t.floor, h, { id: k.id, ft: k.ft });
      if (!stairs.has(h)) push(t.slab, h, { id: k.id, ft: k.ft });
      else push(t.stairs, h, k.ft);
    }
  }
  TAB.set(d, t);
  return t;
}

/** Sürüm 60+'da varyantın katları (yoksa boş). */
export function katlarOf(state: St): MapKat[] {
  if (!k72On(state)) return [];
  return dikeyOf(state)?.katlar ?? [];
}

const collapsed = (state: St, id: string, k: string): boolean => !!state.map?.katCokuk?.includes(`${id}|${k}`);

/** Altıgenin durulan döşeme yükseklikleri (ft; çöken hariç). */
export function floorsAt(state: St, h: Offset): number[] {
  const d = k72On(state) ? dikeyOf(state) : null;
  if (!d?.katlar?.length) return [];
  const k = key(h);
  return (tab(d).floor.get(k) ?? []).filter((f) => !collapsed(state, f.id, k)).map((f) => f.ft);
}

/** Altıgende dikey geçişi ve görüşü kesen döşemeler (ft; merdiven, delik ve çöken hariç). */
export function slabsAt(state: St, h: Offset): number[] {
  const d = k72On(state) ? dikeyOf(state) : null;
  if (!d?.katlar?.length) return [];
  const k = key(h);
  return (tab(d).slab.get(k) ?? []).filter((f) => !collapsed(state, f.id, k)).map((f) => f.ft);
}

/** Merdiven altıgeninin bağladığı döşeme yükseklikleri (zemin 0 her zaman bağlı; boşsa merdiven değil). */
export function stairsAt(state: St, h: Offset): number[] {
  const d = k72On(state) ? dikeyOf(state) : null;
  if (!d?.katlar?.length) return [];
  return tab(d).stairs.get(key(h)) ?? [];
}

// Sur tepesi önbelleği: zemin harfleri dizisi başına (harf değişince yeni dizi gelir), altıgen → tepe.
const TOPS = new WeakMap<string[], Map<string, number | null>>();
/** Sur tepesi (ft): geçilmez, `surUstu` harfli, tepesi bilinen duvar; değilse null. */
export function surTop(state: St, h: Offset): number | null {
  const d = k72On(state) ? dikeyOf(state) : null;
  if (!d?.surUstu?.length || !state.map) return null;
  let m = TOPS.get(state.map.tiles);
  if (!m) { m = new Map(); TOPS.set(state.map.tiles, m); }
  const k = key(h);
  const hit = m.get(k);
  if (hit !== undefined) return hit;
  const v = surTopRaw(state, d, h);
  m.set(k, v);
  return v;
}
function surTopRaw(state: St, d: MapDikey, h: Offset): number | null {
  const ch = state.map?.tiles[h.row]?.[h.col];
  if (!ch || !d.surUstu?.includes(ch)) return null;
  const t = terrainOf(ch);
  if (t.movement !== 'blocked' || t.outOfBounds) return null;
  const ez = engelEzme(state, h);
  const top = ez !== undefined ? ez : harfFt(state, ch);
  return top && Number.isFinite(top) && top > 0 ? top : null;
}

/** Altıgenin duruş yükseklikleri (ft, artan): zemin, sur tepesi, döşemeler. Sürüm 59 ve altında boş. */
export function standHeights(state: St, h: Offset): number[] {
  if (!k72On(state) || !state.map) return [];
  const ch = state.map.tiles[h.row]?.[h.col];
  if (ch === undefined) return [];
  const t = terrainOf(ch);
  const out: number[] = [];
  if (!t.outOfBounds && t.movement !== 'blocked') out.push(0);
  const top = surTop(state, h);
  if (top !== null) out.push(top);
  for (const f of floorsAt(state, h)) if (!out.includes(f)) out.push(f);
  return out.sort((a, b) => a - b);
}

/** Haritada duruş yüzeyi verisi (sur üstü ya da kat) var mı (60+). */
export function hasStandData(state: St): boolean {
  if (!k72On(state)) return false;
  const d = dikeyOf(state);
  return !!d && (!!d.surUstu?.length || !!d.katlar?.length);
}

/** Yaratık zeminin üstündeki bir duruş yüzeyinde mi (irtifa > 0 ve altıgeninin duruş yüksekliği). */
export function standingOn(state: St, c: Pick<Combatant, 'pos' | 'altitudeFt'>): boolean {
  const a = c.altitudeFt ?? 0;
  if (a <= 0 || !c.pos || !hasStandData(state)) return false;
  return standHeights(state, c.pos).includes(a);
}

/** Yaratığın durduğu yükseklik: yerde 0, duruş yüzeyinde irtifa; havada/duvarda tutunurken null. */
export function standAlt(state: St, c: Pick<Combatant, 'pos' | 'altitudeFt'>): number | null {
  const a = c.altitudeFt ?? 0;
  if (a === 0) return 0;
  return standingOn(state, c) ? a : null;
}

/** Düşenin iniş yüksekliği: `h`'de `fromFt`'in altındaki en yüksek duruş yüzeyi (yoksa 0). */
export function landingFt(state: St, h: Offset, fromFt: number): number {
  const below = standHeights(state, h).filter((x) => x < fromFt && x > 0);
  return below.length ? Math.max(...below) : 0;
}

/** `h`'de `a` ile `b` yükseklikleri arasında döşeme var mı (iki taraf ayrı). */
export function slabBetween(state: St, h: Offset, a: number, b: number): boolean {
  if (a === b) return false;
  for (const f of slabsAt(state, h)) if ((a < f) !== (b < f)) return true;
  return false;
}

/** `alt` yüksekliğinin üstündeki en alçak döşeme (alt katın tavanı; yoksa null). */
export function slabAbove(state: St, h: Offset, alt: number): number | null {
  let low: number | null = null;
  for (const f of slabsAt(state, h)) if (f > alt && (low === null || f < low)) low = f;
  return low;
}
