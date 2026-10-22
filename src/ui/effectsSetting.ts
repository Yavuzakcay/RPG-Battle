/**
 * Harita efektleri ayarları (Görev M): Açık/Kapalı ve yoğunluk (düşük/orta/yüksek), bu cihazda hatırlanır. Çizim
 * katmanı (`EffectsLayer`) ayrı, tembel parça; bu küçük modül savaş ekranının menüsü için.
 */
import { useState } from 'react';
import type { EffectDensity } from '../map/effects';

const ON_KEY = 'rpg-battle-effects';
const DENSITY_KEY = 'rpg-battle-effects-density';

/** Sistemde "hareketi azalt" açık mı. */
export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Efekt tercihi (bu cihazda hatırlanır); "hareketi azalt" açıksa varsayılan kapalı. */
export function useEffectsSetting(): [boolean, (on: boolean) => void] {
  const reduce = reducedMotion();
  const [on, setOn] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(ON_KEY);
      return v === null ? !reduce : v === 'on';
    } catch {
      return !reduce;
    }
  });
  const set = (v: boolean) => {
    setOn(v);
    try { localStorage.setItem(ON_KEY, v ? 'on' : 'off'); } catch { /* yalnızca bu oturumda */ }
  };
  return [on, set];
}

const NEXT: Record<EffectDensity, EffectDensity> = { low: 'medium', medium: 'high', high: 'low' };

export function storedDensity(): EffectDensity {
  try {
    const v = localStorage.getItem(DENSITY_KEY);
    return v === 'low' || v === 'high' ? v : 'medium';
  } catch {
    return 'medium';
  }
}

/** Yoğunluk: düşük → orta → yüksek (varsayılan orta). */
export function useEffectsDensity(): [EffectDensity, () => void] {
  const [d, setD] = useState<EffectDensity>(storedDensity);
  const cycle = () => setD((x) => {
    const n = NEXT[x];
    try { localStorage.setItem(DENSITY_KEY, n); } catch { /* yalnızca bu oturumda */ }
    return n;
  });
  return [d, cycle];
}
