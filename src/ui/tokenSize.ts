/**
 * Jeton boyutu ve çizim sırası (görsel; mekanik olarak her yaratık tek altıgen).
 * Ölçekler `data/token-sizes.json`: boyut sınıfı → hex genişliği çarpanı (1 = Medium).
 */
import sizes from '../../data/token-sizes.json';
import { distance, type Offset } from '../rules/hex';
import type { Combatant } from '../battle/types';

type Size = Combatant['size'];
const SCALE = sizes.scale as Record<Size, number>;

/** Jetonun görsel ölçeği: oyuncu karakterleri (ve masumlar) Medium, canavarlar boyut sınıfından. */
export function tokenScale(c: { side: Combatant['side']; size: Size; civilian?: boolean }): number {
  const size: Size = c.side === 'party' ? (sizes.player as Size) : c.size;
  return SCALE[size] ?? 1;
}

/** Büyük jetonun komşu altıgenlere taşma menzili (altıgen): 1.5 ve 2 → 1, 3 → 2. */
export const overhang = (scale: number) => Math.max(0, Math.ceil(scale - 1));

export interface DrawToken { id: string; pos: Offset; y: number; scale: number }

/**
 * Çizim sırası: ekranda daha aşağıdaki (merkezi daha büyük y) jeton üstte. Ancak daha büyük bir
 * jeton küçüğün üstüne taşıyorsa (taşma menzilinde ve ondan sonra çiziliyorsa) küçük olan o büyük
 * jetondan sonra çizilir; böylece küçük jeton hiçbir zaman büyüğün altında kaybolmaz.
 */
export function drawOrder<T extends DrawToken>(tokens: readonly T[]): T[] {
  const base = [...tokens].sort((a, b) => a.y - b.y || a.pos.col - b.pos.col);
  const key = base.map((s, i) => {
    let k = i;
    base.forEach((b, j) => {
      if (j > i && b.scale > s.scale && distance(b.pos, s.pos) <= overhang(b.scale)) k = Math.max(k, j + 0.5);
    });
    return k;
  });
  return base.map((t, i) => ({ t, k: key[i] as number, i })).sort((a, b) => a.k - b.k || a.i - b.i).map((x) => x.t);
}
