/** Deflect Attacks (Görev P-Monk; veriden): isabette tepkiyle hasar azaltma. Saf; saldırı modüllerinden çağrılır. */
import { rollDice, rollTag, type Rng } from '../rules/dice';
import type { Combatant } from './types';

/** Deflect Attacks: B/P/S hasarlı isabette tepkiyle azaltma miktarı (zar + DEX + seviye); uygulanmıyorsa 0. */
export function deflectAmount(target: Combatant, damageType: string | undefined, rng: Rng): number {
  const d = target.deflect;
  if (!d || target.economy.reaction || target.hp <= 0 || !damageType || !d.types.includes(damageType)) return 0;
  return rollDice(d.dice, rollTag(rng, { kind: 'damage', by: target.id })).total + d.bonus;
}
