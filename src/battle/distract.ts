/**
 * Kuyruk 41b: Dikkat dağıt (eylem; hapishane ve sızma görevleri). Menzildeki bir altıgene ses çıkarılır (taş, kase atmak);
 * oraya yakın, uyanık ve aklı başında düşmanlar bir sonraki turlarının sonuna dek pasif Algıda ceza alır (SRD 5.2.1: pasif
 * değere dezavantaj −5). Gizlenme (`passivePerception`) ve uyuyan grup alarmı aynı değeri kullanır. Sayılar
 * `data/stealth.json` `distract`.
 */
import stealthJson from '../../data/stealth.json';
import { distance, type Offset } from '../rules/hex';
import { isIncapacitated } from '../rules/conditions';
import { fail, finish, type CommandResult } from './common';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from './types';

const D = (stealthJson as unknown as { distract: { rangeHexes: number; radiusHexes: number; penalty: number } }).distract;

/** Dikkat dağıtılabilecek altıgen mi (sorun yoksa null). */
export function distractProblem(state: BattleState, actor: Combatant, at: Offset): string | null {
  if (!state.map || !actor.pos) return 'Dikkat dağıtmak için harita gerekir.';
  if (distance(actor.pos, at) > D.rangeHexes) return `En çok ${D.rangeHexes * 5} ft uzağa.`;
  return null;
}

/** Sesten etkilenen düşmanlar (uyanık, aklı başında, altıgene yakın). */
export function distractTargets(state: BattleState, actor: Combatant, at: Offset): Combatant[] {
  return Object.values(state.combatants).filter((c) => c.side !== actor.side && !c.civilian && c.hp > 0 && !c.asleep && !!c.pos
    && !isIncapacitated(c.conditions) && distance(c.pos, at) <= D.radiusHexes);
}

export function executeDistract(state: BattleState, actor: Combatant, at: Offset): CommandResult {
  const why = distractProblem(state, actor, at);
  if (why) return fail(why);
  const hit = distractTargets(state, actor, at);
  const events: BattleEvent[] = [{ type: 'distracted', actorId: actor.id, at, targetIds: hit.map((c) => c.id) }];
  for (const c of hit) {
    const effect: ActiveEffect = { id: `distract:${actor.id}:${state.round}:${c.id}`, name: 'Dikkati dağıldı', sourceId: actor.id, untilOwnTurnEnd: true, perceptionPenalty: D.penalty };
    events.push({ type: 'effect_added', targetId: c.id, effect });
  }
  return finish(state, events);
}
