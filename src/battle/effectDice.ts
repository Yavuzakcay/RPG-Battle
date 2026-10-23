/**
 * Süren etkilerin zar eklentileri (Görev R2): savaşçının üzerindeki etkilerden saldırı, save ya da (beceri) kontrol
 * zarına eklenecek ±zarlar. Saf; zarlar `rules/attack.ts` `rollExtras` ile atılır.
 */
import type { ExtraDie } from '../rules/attack';
import type { Combatant } from './types';

function diceOn(c: Combatant | undefined, on: 'attack' | 'save' | 'check', skill?: string): ExtraDie[] {
  return (c?.effects ?? [])
    .filter((e) => e.dice?.on.includes(on) && (on !== 'check' || !e.dice.skill || e.dice.skill === skill))
    .map((e) => ({ label: e.name, die: e.dice?.die ?? '1d4', sign: e.dice?.sign ?? 1, effectId: e.id, holderId: c?.id ?? '',
      ...(e.dice?.single ? { single: true } : {}) }));
}

/** Saldırı zarına (Bless +1d4, Bane −1d4). */
export const attackDice = (c: Combatant | undefined): ExtraDie[] => diceOn(c, 'attack');
/** Kurtarma zarına (Bless, Bane). */
export const saveDice = (c: Combatant | undefined): ExtraDie[] => diceOn(c, 'save');
/** Yetenek kontrolüne (Guidance: seçilen beceri). */
export const checkDice = (c: Combatant | undefined, skill?: string): ExtraDie[] => diceOn(c, 'check', skill);
