/**
 * Kuyruk K73b (kural sürümü 63+; `harita/belgeler/K73B-DENETIM.md`): 3B bitişiklik ve uzaklık, tek işlev.
 *
 * - `gap3D`: iki yaratık arası uzaklık (altıgen; 1 = 5 ft) = max(yatay gövde aralığı `gap`, dikey bant aralığı). Bant K71c
 *   hücre bandı, K71d mutlak yükseklik (`absBand`: katmanlı haritada zemin + irtifa); büyük yaratık boyu kadar düzey kaplar
 *   (Large 2, Huge 3, Gargantuan 4), bu yüzden K71c büyük yaratık kuralı kendiliğinden korunur.
 * - `adjacent3D`: 5 ft içinde = `gap3D ≤ 1`. Aynı altıgende üst üste (yatay 0) duranlar da bitişiktir.
 * - Ayıranlar (uzaklık sonsuz): kat döşemesi (K72 `slabBetween`: iki yaratık döşemenin iki yanında, kendi altıgenlerinde
 *   döşeme) ve Forcecage kutusu (bir uç kutunun içinde, öbürü dışında). Altıgen ızgarasında iki komşu altıgen arasında duvar
 *   olmaz (duvar altıgen kaplar); duvar üstündeki ile dibindeki dikey aralıkla ayrılır.
 *
 * Yaprak modül: yalnız gövde, hücre, dikey ve duruş modüllerini içe aktarır (savaş modüllerine döngü yok).
 */
import { auraGap, gap } from './body';
import { bandGap } from './cells';
import { absBand } from './vertical';
import { katlarOf, slabBetween } from './stand';
import { k73cOn } from './k73cSurum';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant } from './types';

export const K73B_VERSION = 63;
export const k73bOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= K73B_VERSION;

type Body = Pick<Combatant, 'size' | 'pos' | 'altitudeFt'> & { burrowed?: true };
type St = Pick<BattleState, 'map' | 'kuralSurumu' | 'multiHex' | 'multiHexMax'>;

/** İki yaratık arasında kat döşemesi var mı (biri döşemenin altında, öbürü üstünde; iki altıgenden birinde döşeme). */
export function slabSeparates(state: St, a: Body, b: Body): boolean {
  if (!a.pos || !b.pos || !katlarOf(state).length) return false;
  const x = a.altitudeFt ?? 0, y = b.altitudeFt ?? 0;
  return slabBetween(state, a.pos, x, y) || slabBetween(state, b.pos, x, y);
}

const inZone = (hexes: readonly Offset[], h: Offset) => hexes.some((x) => x.col === h.col && x.row === h.row);

/** Forcecage kutusu iki yaratığı ayırıyor mu (bir uç içeride, öbürü dışarıda). Kafes (parmaklık) ayırmaz. */
export function boxSeparates(state: St, a: Body, b: Body): boolean {
  if (!a.pos || !b.pos) return false;
  for (const z of state.map?.zones ?? []) {
    if (z.cage !== 'box') continue;
    if (inZone(z.hexes, a.pos) !== inZone(z.hexes, b.pos)) return true;
  }
  return false;
}

/** Ayrılmışlar mı (döşeme ya da kutu): bitişiklik, aura ve erişim yok. */
export const separated = (state: St, a: Body, b: Body): boolean => slabSeparates(state, a, b) || boxSeparates(state, a, b);

/**
 * 3B uzaklık (altıgen): max(yatay gövde aralığı, dikey bant aralığı); ayrılmışsa sonsuz. `horiz` verilirse yatay ölçü
 * olarak o kullanılır (aura: K69 çapa → ayak izi ölçüsü).
 */
export function gap3D(state: St, a: Body, b: Body, horiz?: number): number {
  if (!a.pos || !b.pos) return Infinity;
  if (separated(state, a, b)) return Infinity;
  // Kuyruk K73c (sürüm 64+): yalnız biri yer altındaysa (kazarak) bitişiklik, aura ve tepki menzili yok.
  if (k73cOn(state) && !!a.burrowed !== !!b.burrowed) return Infinity;
  const h = horiz ?? gap(state, a, b);
  return Math.max(h, bandGap(absBand(state, a), absBand(state, b)));
}

/** 5 ft içinde mi (3B; sürüm 63+). */
export const adjacent3D = (state: St, a: Body, b: Body): boolean => gap3D(state, a, b) <= 1;

/**
 * Aura uzaklığı (altıgen): sürüm 63+'da 3B (dikey bant aralığı; döşeme ve kutu keser: SRD 5.2.1 Emanation bir alan etkisidir,
 * tam siper noktaları alandan çıkarır), öncesinde 2B `auraGap` (K69 çapa → ayak izi ölçüsü aynen).
 */
export function auraDist(state: St, owner: Body, c: Body): number {
  const flat = auraGap(state, owner, c);
  return k73bOn(state) ? gap3D(state, owner, c, flat) : flat;
}

/** Menzil uzaklığı (altıgen; Countercharm gibi "N ft içinde" kuralları): 63+'da 3B, öncesinde 2B `gap`. */
export function rangeGap(state: St, a: Body, b: Body): number {
  return k73bOn(state) ? gap3D(state, a, b) : gap(state, a, b);
}

// --- Kuyruk K73c (kural sürümü 64+) ------------------------------------------------------------------------------------

export { K73C_VERSION, k73cOn } from './k73cSurum';

/**
 * Kuyruk K73c (sürüm 64+): paket/imza auraları ve tepki menzilleri için uzaklık (altıgen): 64+'da 3B (`gap3D`: dikey bant
 * aralığı, döşeme ve kutu keser), öncesinde 2B `gap` (63 ve altı aynen).
 */
export function gap64(state: St, a: Body, b: Body): number {
  return k73cOn(state) ? gap3D(state, a, b) : gap(state, a, b);
}

/** 5 ft içinde mi: 64+'da 3B (`adjacent3D`), öncesinde 2B yatay bitişiklik (`gap ≤ 1`). */
export const near5v64 = (state: St, a: Body, b: Body): boolean => (k73cOn(state) ? adjacent3D(state, a, b) : gap(state, a, b) <= 1);
