/**
 * Görev WS92 (yalnız görünüm): yutanın midesindeki yaratığın jetonu yutanın jetonunun üstünde küçük ve soluk çizilir
 * (konumu motor eşler: `battle/swallow92.ts` `syncSwallowed`). Kural yok.
 */
import { insideEffect } from '../battle/swallow92';
import type { Combatant } from '../battle/types';

export const SWALLOWED_SCALE = 0.5;

/** Midedeki jetonun ölçeği; değilse null. */
export function swallowedStack(c: Combatant): { scale: number; lift: number } | null {
  return insideEffect(c) ? { scale: SWALLOWED_SCALE, lift: 0 } : null;
}

/** Çizim sırası: midedeki jeton yutanından sonra (üstte). Kararlı. */
export function swallowedOnTop<T extends { c: Combatant }>(xs: T[]): T[] {
  const inside = xs.filter((x) => insideEffect(x.c));
  if (!inside.length) return xs;
  const rest = xs.filter((x) => !inside.includes(x));
  for (const r of inside) {
    const by = insideEffect(r.c)?.swallowedBy;
    const i = rest.findIndex((x) => x.c.id === by);
    if (i < 0) rest.push(r); else rest.splice(i + 1, 0, r);
  }
  return rest;
}
