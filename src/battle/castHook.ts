/**
 * Kuyruk 19: başka modüllerin (efsanevi eylemler `boss.ts`, Multiattack planı `monsters.ts`) eylem harcamadan büyü
 * yapması için büyü yolu kaydı (commands.ts kaydeder; spells.ts ile döngüsel içe aktarma olmasın).
 */
import type { Rng } from '../rules/dice';
import type { CommandResult } from './common';
import { FRESH_ECONOMY } from './types';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

type Cast = Extract<Command, { type: 'cast_spell' }>;
let caster: ((s: BattleState, a: Combatant, cmd: Cast, rng: Rng) => CommandResult) | null = null;
export const registerLegendaryCaster = (f: typeof caster): void => { caster = f; };

/**
 * Büyüyü eylem harcamadan yapar: canavarın Spellcasting'inden (slotsuz, verilen seviyede, verilen DC). Ekonomi olayları
 * (`action_used`) ayıklanır. Başarısızsa null.
 */
export function castWithoutAction(s: BattleState, b: Combatant, spell: string, cmd: Omit<Cast, 'type' | 'actorId' | 'spellName'>, rng: Rng,
  opts: { level?: number; dc?: number } = {}): BattleEvent[] | null {
  if (!caster) return null;
  const a: Combatant = { ...b, economy: FRESH_ECONOMY, spellNames: [...new Set([...b.spellNames, spell])], atWill: { ...(b.atWill ?? {}), [spell]: 'any' },
    castLevels: { ...(b.castLevels ?? {}), ...(opts.level ? { [spell]: opts.level } : {}) }, spellSaveDc: opts.dc ?? b.spellSaveDc ?? 15,
    spellAttack: b.spellAttack ?? (opts.dc ?? b.spellSaveDc ?? 15) - 8 };
  const r = caster({ ...s, combatants: { ...s.combatants, [b.id]: a } }, a, { type: 'cast_spell', actorId: b.id, spellName: spell, ...cmd }, rng);
  return r.ok ? r.events.filter((e) => !(e.type === 'action_used' && e.actorId === b.id)) : null;
}
