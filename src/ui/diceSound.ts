/**
 * Zar sesleri için tetik noktası (Görev J3): animasyon "zar sekti" ve "zar durdu" olaylarını yayınlar; ses sistemi
 * sonra `onDiceSound` ile dinleyip çalar. Şimdilik dinleyen yok.
 */
export type DiceSoundEvent =
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
