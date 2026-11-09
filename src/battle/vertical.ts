/**
 * Kuyruk K71a (kural sürümü 56+; `harita/belgeler/K71-PLAN.md` K1, K11, K12): dikey veri okuması. Engel tepesinin harf
 * tablosu (`data/dikey.json` `harfFt`), varyantın `dikey` ezmeleri (harf, altıgen engel, altıgen tavanı, tavan bölgesi)
 * ve katmanlı haritada zemin yüksekliği. Okuma yalnız buradan; çözücüler `cover.ts` `obstacleTopFt` (engel tepesi) ve
 * `altitude.ts` `ceilingFt(state, at)` (tavan). Sürüm 55 ve altında hiçbiri okunmaz. Saf.
 */
import dikeyData from '../../data/dikey.json';
import { maps, type MapDikey } from '../map/maps';
import type { Offset } from '../rules/hex';
import { heightAt, heightMoveRule, katmanOn, layerActive, levelFeet } from './heights';
import { bandOf, type Band } from './cells';
import { ruleVersion } from './ruleVersion';
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

// --- Kuyruk K71d (kural sürümü 59+): mutlak yükseklik --------------------------------------------------------------------

/**
 * Mutlak yükseklik (ft; tek işlev): altıgenin zemin/katman yüksekliği (`zeminFt`) + irtifa. İrtifa yaratığın kendi altıgeninin
 * zemininden ölçülür (uçan araziyi izler; üst sınır ve tavan da o zeminden). Katmansız haritada zemin 0: mutlak = irtifa.
 */
export function mutlakFt(state: Pick<BattleState, 'map' | 'kuralSurumu'>, c: Pick<Combatant, 'pos' | 'altitudeFt'>, at: Offset | null = c.pos, alt: number = c.altitudeFt ?? 0): number {
  return (at ? zeminFt(state, at) : 0) + alt;
}

/**
 * K9 (sürüm 59+): uzaklık zemin terimi açık mı: katmanlı harita ve Game Master `heightMove` anahtarı (katman fiziksel; kapalıyken
 * uçurum yürünür, uzaklıkta zemin terimi de yok).
 */
export const k9On = (state: Pick<BattleState, 'map' | 'kuralSurumu'>): boolean => katmanOn(state) && !!heightMoveRule(state);

/** K9 yüksekliği (ft): K9 açıkken mutlak yükseklik (`mutlakFt`), kapalıyken irtifa (eski davranış). */
export const k9Ft = (state: Pick<BattleState, 'map' | 'kuralSurumu'>, c: Pick<Combatant, 'pos' | 'altitudeFt'>, at: Offset | null = c.pos, alt: number = c.altitudeFt ?? 0): number =>
  (k9On(state) && at ? zeminFt(state, at) : 0) + alt;

/**
 * K9 mutlak bant: yaratığın `at`'teki (yoksa kendi yerindeki) K9 yüksekliğinde kapladığı düzeyler; K9 kapalıyken göreli bant
 * (eski davranış). Altıgenler arası uzaklık ve erişim bununla.
 */
export function absBand(state: Pick<BattleState, 'map' | 'kuralSurumu'>, c: Pick<Combatant, 'size' | 'pos' | 'altitudeFt'>, at: Offset | null = c.pos, alt: number = c.altitudeFt ?? 0): Band {
  return bandOf(c, k9Ft(state, c, at, alt));
}
