/** Görev OD1: düşman HP görünürlüğü (yalnız arayüz; savaş mantığı ve kayıt aynı). Saf yardımcılar. */
import type { HpVis } from './active';

export type HpBand = 'full' | 'hurt' | 'bloodied' | 'dying' | 'down';

/** Etiket kademesi: sağlam > %75, yaralı > %50, ağır yaralı > %25, ölmek üzere, yere düştü (0). */
export function hpBand(hp: number, max: number): HpBand {
  if (hp <= 0) return 'down';
  const f = hp / Math.max(1, max);
  return f > 0.75 ? 'full' : f > 0.5 ? 'hurt' : f > 0.25 ? 'bloodied' : 'dying';
}

/** Çubuk doluluğu (0–1): gizlide yok (null), etikette kademe ortası, yüzde ve tamda gerçek oran. */
export function hpBarFraction(hp: number, max: number, mode: HpVis): number | null {
  const f = Math.max(0, hp / Math.max(1, max));
  if (mode === 'gizli') return null;
  if (mode === 'etiket') return ({ full: 1, hurt: 0.75, bloodied: 0.5, dying: 0.25, down: 0 } as Record<HpBand, number>)[hpBand(hp, max)];
  return f;
}

/** Yüzde (yuvarlak, 5'in katı değil; gerçek). */
export const hpPercent = (hp: number, max: number): number => Math.max(0, Math.round((hp / Math.max(1, max)) * 100));
