/**
 * Kuyruk 19: Resilient Sphere (SRD 5.2.1): içerideki yaratık eylemle küreyi hızının yarısı kadar yuvarlar; küre ağırlıksız,
 * bitişikteki bir yaratık onu kaldırıp taşıyabilir (taşıyan yürüdükçe küre ardında; bırakınca olduğu yerde). Anahtar `spellsK19`.
 */
import { costsFrom, distance, hexKey, type Offset } from '../rules/hex';
import { fail, finish, type CommandResult } from './common';
import { moveCostFn, occupantAt, speedHexes } from './movement';
import { globalRule } from './ruleControl';
import type { BattleState, Combatant } from './types';

const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const sealedOf = (c: Combatant | undefined) => c?.effects?.find((e) => e.sealed);

export function executeSphereRoll(state: BattleState, actor: Combatant, to: Offset): CommandResult {
  if (!globalRule(state, 'spellsK19')) return fail('Küreyi yuvarlamak bu kural sürümünde yok.');
  const e = sealedOf(actor);
  if (!e || !actor.pos) return fail('Kürenin içinde değilsin.');
  if (e.carriedBy) return fail('Küre taşınıyor.');
  const budget = Math.floor(speedHexes({ ...actor, effects: (actor.effects ?? []).filter((x) => !x.sealed) }) / 2);
  const costs = costsFrom(actor.pos, sizeOf(state), moveCostFn(state, { ...actor, effects: (actor.effects ?? []).filter((x) => !x.sealed) }), budget);
  if (!costs.has(hexKey(to)) || occupantAt(state, to, actor.id)) return fail(`Küre oraya yuvarlanamaz (en çok ${budget * 5} ft).`);
  return finish(state, [{ type: 'action_used', actorId: actor.id, kind: 'action', what: 'Küreyi yuvarla' }, { type: 'pushed', targetId: actor.id, from: actor.pos, to, by: actor.id }]);
}

export function executeSphereCarry(state: BattleState, actor: Combatant, targetId: string, drop: boolean): CommandResult {
  if (!globalRule(state, 'spellsK19')) return fail('Küreyi taşımak bu kural sürümünde yok.');
  const t = state.combatants[targetId];
  const e = sealedOf(t);
  if (!t || !e || !t.pos || !actor.pos) return fail('Hedef bir kürenin içinde değil.');
  if (drop) {
    if (e.carriedBy !== actor.id) return fail('Bu küreyi taşımıyorsun.');
    const { carriedBy: _c, ...rest } = e;
    return finish(state, [{ type: 'effect_added', targetId: t.id, effect: rest }]);
  }
  if (distance(actor.pos, t.pos) > 1) return fail('Küre bitişikte olmalı.');
  if (e.carriedBy) return fail('Küre zaten taşınıyor.');
  if (sealedOf(actor)) return fail('Kürenin içinden taşıyamazsın.');
  return finish(state, [{ type: 'effect_added', targetId: t.id, effect: { ...e, carriedBy: actor.id } }]);
}
