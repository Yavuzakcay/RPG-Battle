/**
 * Kuyruk K71a (kural sürümü 56+; `harita/belgeler/K71-PLAN.md` K1, K11, K12): dikey veri okuması. Engel tepesinin harf
 * tablosu (`data/dikey.json` `harfFt`), varyantın `dikey` ezmeleri (harf, altıgen engel, altıgen tavanı, tavan bölgesi)
 * ve katmanlı haritada zemin yüksekliği. Okuma yalnız buradan; çözücüler `cover.ts` `obstacleTopFt` (engel tepesi) ve
 * `altitude.ts` `ceilingFt(state, at)` (tavan). Sürüm 55 ve altında hiçbiri okunmaz. Saf.
 */
import dikeyData from '../../data/dikey.json';
import { maps, type MapDikey } from '../map/maps';
import type { Offset } from '../rules/hex';
import { heightAt, layerActive, levelFeet } from './heights';
import { ruleVersion } from './ruleVersion';
import type { BattleState } from './types';

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

/** Altıgenin tavan ezmesi: sayı (ft), null (açık gök: `tavan` 0) ya da ezme yoksa undefined (varyant `tavanFt` geçerli). */
export function tavanEzme(state: Pick<BattleState, 'map'>, h: Offset): number | null | undefined {
  const d = dikeyOf(state);
  if (!d) return undefined;
  const t = d.tavan?.[key(h)];
  if (t !== undefined) return t > 0 ? t : null;
  for (const b of d.tavanBolge ?? []) {
    const [c0, r0, c1, r1] = b.dikdortgen;
    if (h.col >= c0 && h.col <= c1 && h.row >= r0 && h.row <= r1) return b.ft;
  }
  return undefined;
}

/** Haritada altıgen başına tavan verisi var mı (görüşte çatı denetimi yalnız o zaman). */
export const hasHexCeilings = (state: Pick<BattleState, 'map'>): boolean => {
  const d = dikeyOf(state);
  return !!d && (!!d.tavanBolge?.length || Object.keys(d.tavan ?? {}).length > 0);
};

/** Altıgenin zemin yüksekliği (ft): katmanlı haritada seviye × `levelFt`, diğerlerinde 0 (sürüm 56+). */
export function zeminFt(state: Pick<BattleState, 'map' | 'kuralSurumu'>, h: Offset): number {
  if (!dikeyOn(state) || !layerActive(state)) return 0;
  return heightAt(state, h) * levelFeet(state);
}
