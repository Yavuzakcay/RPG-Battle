/**
 * Görev OYUNCU-HEDEF-DOST (yalnız arayüz): karşı taraf hedefi. Komut olduğu gibi yapılabiliyorsa `plain`, yalnız `crossSide`
 * bayrağıyla yapılabiliyorsa `cross` (düşman için tanımlı eylem dosta, dost için tanımlı eylem düşmana), hiç yapılamıyorsa null.
 * Motorda zarsız denenir. Zararlı komutlar (dost hedefte onay istenir) `HOSTILE_COMMANDS`.
 */
import { execute, type BattleState, type Command } from '../battle';
import { contextFor } from './session';

export const HOSTILE_COMMANDS = new Set<Command['type']>(['attack', 'monster_attack', 'multiattack', 'bonus_strike', 'offhand_attack', 'shove', 'grapple', 'monster_ability']);

export function crossProbe(state: BattleState, actorId: string, cmd: Command): 'plain' | 'cross' | null {
  const ctx = contextFor(state, actorId);
  if (execute(state, cmd, ctx, () => 0.5).ok) return 'plain';
  return execute(state, { ...cmd, crossSide: true } as Command, ctx, () => 0.5).ok ? 'cross' : null;
}
