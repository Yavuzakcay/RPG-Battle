/**
 * Kuyruk K64a (kural sürümü 48): ele geçirmenin döngüsüz çekirdeği (yalnızca türler). `common.ts` (checkActor,
 * winnerOf), `allegiance.ts` ve yapay zekâ buradan okur; kurallar `possession.ts`.
 */
import type { ActiveEffect, Combatant } from './types';

/** Ele geçirenin `offFloor` değeri (haritadan çekilmiş: hedef alınmaz, sırada atlanır, alan ve doluluk dışı). */
export const POSSESS_FLOOR = 'beden';

/** Bedendeki ele geçirme etkisi (yoksa undefined). */
export const possessedEffect = (c: Pick<Combatant, 'effects'> | undefined): ActiveEffect | undefined => c?.effects?.find((e) => e.possessed);

/** Ele geçirilmiş beden mi (canlı)? */
export const isPossessedBody = (c: Pick<Combatant, 'effects' | 'hp'>): boolean => c.hp > 0 && !!possessedEffect(c);

/**
 * Eylem denetiminde sayılan durumlar: ele geçirmenin verdiği Incapacitated ev sahibinin kendisi içindir; bedeni
 * ele geçiren yönetir (SRD 5.2.1 "The ghost now controls the body"). Başka bir kaynak (etki, süreli durum) da
 * Incapacitated veriyorsa ya da durum ele geçirmeden önce vardıysa (etki o zaman durum vermez) düşülmez.
 */
export function controlConditions(c: Pick<Combatant, 'conditions' | 'effects' | 'conditionTimers'>): string[] {
  const p = possessedEffect(c);
  if (!p?.grants?.includes('Incapacitated')) return c.conditions;
  const other = (c.effects ?? []).some((e) => e !== p && e.grants?.includes('Incapacitated'))
    || (c.conditionTimers ?? []).some((t) => t.condition === 'Incapacitated');
  return other ? c.conditions : c.conditions.filter((x) => x !== 'Incapacitated');
}
