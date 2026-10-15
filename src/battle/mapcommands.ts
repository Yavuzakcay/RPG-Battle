/** Harita komutları: kapı (GM) ve bataktan çekme. Kuralları Adım 8b/8c'de. */
import type { Rng } from '../rules/dice';
import type { Offset } from '../rules/hex';
import { fail, type CommandResult } from './common';
import type { BattleState, Combatant } from './types';

export function executeGate(_state: BattleState, _at: Offset, _open: boolean, _isGm: boolean): CommandResult {
  return fail('Bu haritada kapı yok.');
}

export function executePull(_state: BattleState, _actor: Combatant, _targetId: string, _rng: Rng): CommandResult {
  return fail('Çekilecek batmış müttefik yok.');
}
