/**
 * Görev A6: çok altıgenli boyut (ayak izi). Saf geometri; savaş motoru `BattleState.multiHex` açıkken kullanır
 * (docs/harita/COKLU-ALTIGEN.md). Şekiller sabit (döndürme yok), çapa altıgenine göre eksenel (axial) göreli konumlar:
 * - Tiny, Small, Medium: 1 altıgen (çapa).
 * - Large: 3 altıgen üçgen: çapa + doğu (q+1) + güneydoğu-altı (r+1); çapa sol üst köşe.
 * - Huge: 7 altıgen çiçek: çapa (orta) + 6 komşu.
 * - Gargantuan: 19 altıgen: çapa (orta) + 2 halka.
 */
import { axialDistance, axialToOffset, distance, isInside, offsetToAxial, type Axial, type GridSize, type Offset } from './hex';

export type FootprintSize = 'T' | 'S' | 'M' | 'L' | 'H' | 'G';

const ring = (radius: number): Axial[] => {
  const out: Axial[] = [];
  for (let q = -radius; q <= radius; q++) for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) out.push({ q, r });
  return out;
};

/** Boyuta göre şekil (çapaya göre eksenel ofsetler; ilki her zaman çapa). */
export const SHAPES: Record<FootprintSize, readonly Axial[]> = {
  T: [{ q: 0, r: 0 }],
  S: [{ q: 0, r: 0 }],
  M: [{ q: 0, r: 0 }],
  L: [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 0, r: 1 }],
  H: [{ q: 0, r: 0 }, ...ring(1).filter((a) => a.q !== 0 || a.r !== 0)],
  G: [{ q: 0, r: 0 }, ...ring(2).filter((a) => a.q !== 0 || a.r !== 0)],
};

/** Kaç altıgen kaplar. */
export const hexCount = (size: FootprintSize): number => SHAPES[size].length;

/** Çapası `anchor` olan yaratığın kapladığı altıgenler (ilki çapa). */
export function footprint(anchor: Offset, size: FootprintSize): Offset[] {
  const a = offsetToAxial(anchor);
  return SHAPES[size].map((d) => axialToOffset({ q: a.q + d.q, r: a.r + d.r }));
}

/** İki ayak izi arasındaki mesafe (altıgen): en yakın iki altıgen arası. Tek altıgenlilerde `distance` ile aynı. */
export function footprintDistance(a: readonly Offset[], b: readonly Offset[]): number {
  if (a.length === 1 && b.length === 1) return distance(a[0] as Offset, b[0] as Offset);
  let best = Infinity;
  for (const x of a) {
    const ax = offsetToAxial(x);
    for (const y of b) best = Math.min(best, axialDistance(ax, offsetToAxial(y)));
  }
  return best;
}

/** Ayak izi bir noktaya ne kadar uzak (en yakın altıgeni). */
export const distanceToHex = (fp: readonly Offset[], h: Offset): number => footprintDistance(fp, [h]);

/** Ayak izi haritaya sığıyor mu ve her altıgeni `ok` mu. */
export function fits(anchor: Offset, size: FootprintSize, grid: GridSize, ok: (h: Offset) => boolean = () => true): boolean {
  return footprint(anchor, size).every((h) => isInside(h, grid) && ok(h));
}
