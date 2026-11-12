/**
 * Kuyruk K71a (kural sürümü 56+; `harita/belgeler/K71-PLAN.md` K1, K11, K12): dikey veri okuması. Engel tepesinin harf
 * tablosu (`data/dikey.json` `harfFt`), varyantın `dikey` ezmeleri (harf, altıgen engel, altıgen tavanı, tavan bölgesi)
 * ve katmanlı haritada zemin yüksekliği. Okuma yalnız buradan; çözücüler `cover.ts` `obstacleTopFt` (engel tepesi) ve
 * `altitude.ts` `ceilingFt(state, at)` (tavan). Sürüm 55 ve altında hiçbiri okunmaz. Saf.
 */
import dikeyData from '../../data/dikey.json';
import { maps, type MapDikey } from '../map/maps';
import type { Offset } from '../rules/hex';
import { heightAt, heightMoveRule, k72On, katmanOn, layerActive, levelFeet } from './heights';
import { bandOf, type Band } from './cells';
import { ruleVersion } from './ruleVersion';
import { k73cOn } from './k73cSurum';
import { body64At, footSize } from './bodyLeaf';
import { bandSizeOf } from './riderCore';
import type { BattleState, Combatant } from './types';

/** Kuyruk K71a: dikey modelin kural sürümü. */
export const DIKEY_VERSION = 56;
export const dikeyOn = (state: Pick<BattleState, 'kuralSurumu'>): boolean => ruleVersion(state) >= DIKEY_VERSION;

const HARF = dikeyData.harfFt as Record<string, number>;
const VARIANT = new Map<string, MapDikey | null>();

/** Varyantın dikey ezmeleri: durumdaki ezme (test, Game Master) önce, yoksa harita verisi (önbellekli). */
export function dikeyOf(state: Pick<BattleState, 'map'>): MapDikey | null {
  const m = state.map;
  if (!m) return null;
  if (m.dikey) return m.dikey;
  const key = `${m.id}\u0000${m.variantId}`;
  let v = VARIANT.get(key);
  if (v === undefined) {
    const def = maps.find((x) => x.id === m.id);
    v = (def?.variants.find((x) => x.id === m.variantId) ?? def?.variants[0])?.dikey ?? null;
    VARIANT.set(key, v);
  }
  return v;
}

const key = (h: Offset): string => `${h.col},${h.row}`;

/** Zemin harfinin engel yüksekliği (ft): haritanın `harfFt` ezmesi, yoksa `data/dikey.json`; tabloda yoksa undefined. */
export function harfFt(state: Pick<BattleState, 'map'>, ch: string | undefined): number | undefined {
  if (!ch) return undefined;
  return dikeyOf(state)?.harfFt?.[ch] ?? HARF[ch];
}

/** Altıgenin engel ezmesi: sayı (ft), null (tam engel) ya da ezme yoksa undefined. */
export function engelEzme(state: Pick<BattleState, 'map'>, h: Offset): number | null | undefined {
  const e = dikeyOf(state)?.engel;
  if (!e) return undefined;
  const k = key(h);
  return k in e ? (e[k] ?? null) : undefined;
}

const ODA = new WeakMap<MapDikey, Map<string, number>>();
/** Kuyruk K72: varyantın oda tavanı tablosu (altıgen → ft; dikey nesnesi başına önbellek). */
function odaTablo(d: MapDikey): Map<string, number> {
  let m = ODA.get(d);
  if (!m) {
    m = new Map();
    for (const o of d.odalar ?? []) for (const k of o.altigenler) if (!m.has(k)) m.set(k, o.ft);
    ODA.set(d, m);
  }
  return m;
}

/**
 * Altıgenin tavan ezmesi: sayı (ft), null (açık gök: `tavan` 0) ya da ezme yoksa undefined (varyant `tavanFt` geçerli).
 * Kuyruk K72 (sürüm 60+): altıgen `tavan` ezmesinden sonra oda tavanı (`dikey.odalar`), sonra `tavanBolge`.
 */
export function tavanEzme(state: Pick<BattleState, 'map' | 'kuralSurumu'>, h: Offset): number | null | undefined {
  const d = dikeyOf(state);
  if (!d) return undefined;
  const t = d.tavan?.[key(h)];
  if (t !== undefined) return t > 0 ? t : null;
  if (d.odalar?.length && k72On(state)) {
    const o = odaTablo(d).get(key(h));
    if (o !== undefined) return o;
  }
  for (const b of d.tavanBolge ?? []) {
    const [c0, r0, c1, r1] = b.dikdortgen;
    if (h.col >= c0 && h.col <= c1 && h.row >= r0 && h.row <= r1) return b.ft;
  }
  return undefined;
}

/** Haritada altıgen başına tavan verisi var mı (görüşte çatı denetimi yalnız o zaman; K72: oda tavanı yalnız 60+). */
export const hasHexCeilings = (state: Pick<BattleState, 'map' | 'kuralSurumu'>): boolean => {
  const d = dikeyOf(state);
  return !!d && (!!d.tavanBolge?.length || Object.keys(d.tavan ?? {}).length > 0 || (!!d.odalar?.length && k72On(state)));
};

/** Altıgenin zemin yüksekliği (ft): katmanlı haritada seviye × `levelFt`, diğerlerinde 0 (sürüm 56+). */
export function zeminFt(state: Pick<BattleState, 'map' | 'kuralSurumu'>, h: Offset): number {
  if (!dikeyOn(state) || !layerActive(state)) return 0;
  return heightAt(state, h) * levelFeet(state);
}

// --- Kuyruk K71d (kural sürümü 59+): mutlak yükseklik --------------------------------------------------------------------

/**
 * Mutlak yükseklik (ft; tek işlev): altıgenin zemin/katman yüksekliği (`zeminFt`) + irtifa. İrtifa yaratığın kendi altıgeninin
 * zemininden ölçülür (uçan araziyi izler; üst sınır ve tavan da o zeminden). Katmansız haritada zemin 0: mutlak = irtifa.
 */
export function mutlakFt(state: Pick<BattleState, 'map' | 'kuralSurumu'>, c: Pick<Combatant, 'pos' | 'altitudeFt'> & { size?: Combatant['size'] }, at: Offset | null = c.pos, alt: number = c.altitudeFt ?? 0): number {
  return (at ? bodyZeminFt(state, c, at) : 0) + alt;
}

/**
 * Kuyruk K73c (sürüm 64+, Görev 5; tek tanım): yaratığın gövdesinin zemini (ft). Çok altıgenli gövde (K69 `isMultiHex53`)
 * farklı zeminli altıgenlere yayılınca en yüksek ayak altı: gövde en yüksek basamağın üstünde durur, irtifası oradan ölçülür.
 * Mutlak yükseklik, K9 uzaklık/erişim (`absBand`, `adjacent3D`), K8 yüksek zemin ve YZ zemin ölçüsü bundan. Tek altıgenlide,
 * bayrak kapalıyken ve 63 ve altında çapanın zemini (`zeminFt`).
 */
export function bodyZeminFt(state: Pick<BattleState, 'map' | 'kuralSurumu'>, c: { size?: Combatant['size']; riding?: string }, at: Offset): number {
  const st = state as Parameters<typeof body64At>[0];
  const foot = body64At(st, footSize(st, c), at);
  if (!foot) return zeminFt(state, at);
  let top = -Infinity;
  for (const h of foot) top = Math.max(top, zeminFt(state, h));
  return Number.isFinite(top) ? top : zeminFt(state, at);
}

/**
 * K9 (sürüm 59+): uzaklık zemin terimi açık mı: katmanlı harita ve Game Master `heightMove` anahtarı (katman fiziksel; kapalıyken
 * uçurum yürünür, uzaklıkta zemin terimi de yok).
 */
export const k9On = (state: Pick<BattleState, 'map' | 'kuralSurumu'>): boolean => katmanOn(state) && !!heightMoveRule(state);

/** K9 yüksekliği (ft): K9 açıkken mutlak yükseklik (`mutlakFt`), kapalıyken irtifa (eski davranış). */
export const k9Ft = (state: Pick<BattleState, 'map' | 'kuralSurumu'>, c: Pick<Combatant, 'pos' | 'altitudeFt'> & { size?: Combatant['size'] }, at: Offset | null = c.pos, alt: number = c.altitudeFt ?? 0): number =>
  (k9On(state) && at ? bodyZeminFt(state, c, at) : 0) + alt;

/**
 * K9 mutlak bant: yaratığın `at`'teki (yoksa kendi yerindeki) K9 yüksekliğinde kapladığı düzeyler; K9 kapalıyken göreli bant
 * (eski davranış). Altıgenler arası uzaklık ve erişim bununla.
 */
export function absBand(state: Pick<BattleState, 'map' | 'kuralSurumu'>, c: Pick<Combatant, 'size' | 'pos' | 'altitudeFt'>, at: Offset | null = c.pos, alt: number = c.altitudeFt ?? 0): Band {
  // Kuyruk MB3 (69+, B6 ⚠): bineğinin üstündeki binicinin bandı bineğin bandı (boy bineğin boyutundan).
  return bandOf((c as Partial<Combatant>).riding ? { size: bandSizeOf(state, c) } : c, k9Ft(state, c, at, alt));
}
