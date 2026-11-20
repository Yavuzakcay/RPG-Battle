/**
 * Görev B94 (A2): "Incapacitated olunca ya da ölünce biten/duran etki" kalıbının tek yardımcısı (yaprak modül). SRD 5.2.1:
 * Turn Undead (s. 37), Nature's Sanctuary (s. 46) "ends early if you have the Incapacitated condition or die"; Aura of
 * Protection (s. 55) ve ona bağlı Holy Nimbus (s. 57) Incapacitated iken etkisiz. 0 HP (Unconscious) da düşmüş sayılır. Saf.
 */
import { isIncapacitated } from '../rules/conditions';
import type { Combatant } from './types';

/** Kaynak yok, ölü, 0 HP ya da Incapacitated (onu içeren durumlar dahil). */
export const sourceDown = (c: Pick<Combatant, 'hp' | 'conditions' | 'life'> | undefined): boolean =>
  !c || c.life === 'dead' || c.hp <= 0 || isIncapacitated(c.conditions);
