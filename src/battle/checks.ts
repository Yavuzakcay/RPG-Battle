/**
 * Beceri kontrolü: d20 + beceri bonusu, DC'ye karşı. GM komutuyla istenir; harita kuralları
 * (Adım 8: bataklıkta Athletics, tuzakta Perception) aynı yardımcıyı kullanır.
 */
import { rollD20, rollTag, type Rng } from '../rules/dice';
import { skillBonus, type Skill } from '../rules/skills';
import { fail, type CommandResult } from './common';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant } from './types';

/** Kontrolün olayı. Ağır zırh Stealth'te dezavantaj verir. */
export function rollSkillCheck(c: Combatant, skill: Skill, dc: number, rng: Rng, reason?: string): BattleEvent {
  const mode = skill === 'stealth' && c.stealthDisadvantage ? 'disadvantage' : 'normal';
  const roll = rollD20(mode, rollTag(rng, { kind: 'check', by: c.id, bonus: skillBonus(c, skill) }));
  const total = roll.kept + skillBonus(c, skill);
  return {
    type: 'skill_checked', actorId: c.id, skill, mode, d20: roll.rolls, natural: roll.kept, total, dc,
    success: total >= dc, ...(reason ? { reason } : {}),
  };
}

/** GM bir savaşçıdan beceri kontrolü ister (sıra beklemez). */
export function executeSkillCheck(state: BattleState, actorId: string, skill: Skill, dc: number, isGm: boolean, rng: Rng): CommandResult {
  if (!isGm) return fail('Beceri kontrolünü yalnızca GM ister.');
  if (state.status !== 'active') return fail('Savaş sürmüyor.');
  const c = state.combatants[actorId];
  if (!c) return fail('Savaşçı bulunamadı.');
  if (!Number.isInteger(dc) || dc < 1 || dc > 40) return fail('Geçersiz DC.');
  const events = [rollSkillCheck(c, skill, dc, rng)];
  return { ok: true, state: applyEvents(state, events), events };
}
