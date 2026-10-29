/**
 * Uçuş (Görev S1): yaratığın kendi uçuş hızı (`fly`, canavar ve çağrı verisinden) ya da süren etkiden gelen uçuş
 * (Fly: uçuş hızı; Levitate: havada ama yürüyemez). Yükseklik modeli (`height`, Adım 8) ayrı kalır; uçan birim
 * zorlu araziyi ve yer seviyesindeki zemin etkilerini yok sayar, engelin içinden geçemez. Uçuş bitince düşme hasarı
 * yok (DECISIONS.md). Saf.
 */
import type { Combatant } from './types';

/** Uçuş hızı (ft): kendi uçuş hızı ya da etkilerden en büyüğü. */
export function flySpeed(c: Pick<Combatant, 'fly' | 'effects'>): number {
  let ft = c.fly;
  for (const e of c.effects ?? []) if (e.fly && e.fly > ft) ft = e.fly;
  return ft;
}

/** Havada mı (uçuş hızı var ya da Levitate gibi bir etkiyle süzülüyor). */
export const isAirborne = (c: Pick<Combatant, 'fly' | 'effects'>): boolean =>
  flySpeed(c) > 0 || !!c.effects?.some((e) => e.airborne);

/** Etki yürümeyi engelliyor mu (Levitate: yalnızca itilip çekilerek yer değiştirir). */
export const effectSpeedZero = (c: Pick<Combatant, 'effects'>): boolean => !!c.effects?.some((e) => e.speedZero);
