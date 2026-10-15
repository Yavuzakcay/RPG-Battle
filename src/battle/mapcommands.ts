/**
 * Harita komutları (Adım 8): bataktan çıkma ve çekme (`bog`), kapı (`gate`, GM).
 * Parametreler haritanın JSON'undan.
 */
import type { Rng } from '../rules/dice';
import { distance, type Offset } from '../rules/hex';
import { fail, type CommandResult } from './common';
import { checkEffect, nearestSolid, ruleObject, ruleOf, ruleNumber, ruleSkill, stuckInBog } from './maprules';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant } from './types';

/** Bataktan çıkış başarılıysa: en yakın sağlam altıgen, sayaç sıfır, kalıcı zehir başlar. */
function freed(state: BattleState, ev: Extract<BattleEvent, { type: 'map_effect' }>, who: Combatant, near?: Offset): string | null {
  if (!ev.roll?.success || !who.pos) return null;
  const to = nearestSolid(state, who.pos, who.id, near);
  if (!to) return 'Yakında çıkılacak sağlam ve boş altıgen yok.';
  ev.moveTo = to;
  ev.mapStatus = { sink: 0, lingeringPoison: ruleOf(state, 'bog')?.lingeringPoison !== undefined };
  return null;
}

export function executeEscape(state: BattleState, actor: Combatant, rng: Rng): CommandResult {
  const bog = ruleOf(state, 'bog');
  if (!bog || !stuckInBog(state, actor)) return fail('Batağa saplanmış değil.');
  const esc = ruleObject(bog, 'escape');
  const ev = checkEffect(actor, 'bog', 'bataktan çıkmaya çalışıyor', ruleSkill(esc.skill), ruleNumber(esc, 'dc'), rng);
  const problem = freed(state, ev, actor);
  if (problem) return fail(problem);
  return { ok: true, state: applyEvents(state, [ev]), events: [ev] };
}

export function executePull(state: BattleState, actor: Combatant, targetId: string, rng: Rng): CommandResult {
  const bog = ruleOf(state, 'bog');
  if (!bog) return fail('Bu haritada batak yok.');
  const target = state.combatants[targetId];
  if (!target || target.side !== actor.side || target.id === actor.id) return fail('Yalnızca bir müttefik çekilebilir.');
  if (!stuckInBog(state, target)) return fail(`${target.name} batağa saplanmış değil.`);
  if (!actor.pos || !target.pos || distance(actor.pos, target.pos) !== 1) return fail('Çekmek için bitişik olmalı.');
  const pull = ruleObject(bog, 'allyPull');
  const ev = checkEffect(actor, 'bog', `${target.name} adlı müttefiği çekiyor`, ruleSkill(pull.skill), ruleNumber(pull, 'dc'), rng);
  // Zar çekenin; sonuç (yer değiştirme, sayaç) çekilene uygulanır.
  const onTarget: Extract<BattleEvent, { type: 'map_effect' }> = { ...ev, targetId: target.id, text: `${actor.name} tarafından çekiliyor` };
  const problem = freed(state, onTarget, target, actor.pos);
  if (problem) return fail(problem);
  const events: BattleEvent[] = [onTarget];
  return { ok: true, state: applyEvents(state, events), events };
}

export function executeGate(_state: BattleState, _at: Offset, _open: boolean, _isGm: boolean): CommandResult {
  return fail('Bu haritada kapı yok.');
}
