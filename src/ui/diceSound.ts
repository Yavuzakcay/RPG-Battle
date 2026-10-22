/**
 * Zar sesleri için tetik noktası (Görev J3, S): "zar atıldı" (tepsi ya da animasyonsuzken savaş ekranı), "zar sekti"
 * (3D) ve "zar durdu" olaylarını yayınlar; ses motoru (`ui/audio/engine.ts`) `onDiceSound` ile dinleyip çalar.
 */
export type DiceSoundEvent =
  | { type: 'throw'; sides: number; count: number }
  | { type: 'bounce'; sides: number; strength: number }
  | { type: 'settle'; sides: number; crit: boolean; fumble: boolean };

const listeners = new Set<(e: DiceSoundEvent) => void>();

export function onDiceSound(fn: (e: DiceSoundEvent) => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function emitDiceSound(e: DiceSoundEvent): void {
  for (const fn of listeners) fn(e);
}
