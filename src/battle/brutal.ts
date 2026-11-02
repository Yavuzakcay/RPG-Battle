/**
 * Kuyruk 18 H3: Barbarian 9 Brutal Strike (SRD 5.2.1). Reckless Attack kullanılan turda, Barbarian kendi turunda bir
 * STR saldırısında avantajdan vazgeçebilir (saldırı dezavantajlı olmamalı). İsabette silahın hasar türünde +1d10 ve bir
 * etki: Forceful Blow (hedef 15 ft itilir; Barbarian'ın ona doğru yarım hız hareketi yok, yaklaşık) ya da Hamstring
 * Blow (hedefin hızı Barbarian'ın sonraki turunun başına dek −15 ft). Turda bir kez (`traitTurns['brutal-strike']`).
 * Game Master anahtarı `brutalStrike` (global, kural sürümü 14).
 */
import { adjustDamage } from '../rules/damage';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { pushAwayEvents } from './forced';
import { globalRule } from './ruleControl';
import { usedThisTurn } from './classTraits';
import type { AttackOption, BattleEvent, BattleState, Combatant, ExtraDamage } from './types';

export type BrutalBlow = 'forceful' | 'hamstring';

/** Bu saldırıda Brutal Strike seçilebilir mi (avantaj kaldırma ve dezavantaj denetimi çağıranda). */
export function brutalReady(state: BattleState, actor: Combatant, option: AttackOption): boolean {
  return !!actor.traits?.includes('brutal-strike') && !!globalRule(state, 'brutalStrike') && option.ability === 'str' && !option.spell
    && (actor.marks ?? []).some((m) => m.kind === 'reckless') && !usedThisTurn(state, actor, 'brutal-strike')
    && state.order[state.turnIndex] === actor.id;
}

export function brutalExtra(target: Combatant, type: string, critical: boolean, rng: Rng, profile: Parameters<typeof adjustDamage>[2]): ExtraDamage {
  const d = rollDice(critical ? '2d10' : '1d10', rollTag(rng, { kind: 'damage' }));
  const adj = adjustDamage(d.total, type, profile);
  void target;
  return { label: 'Brutal Strike', rolls: d.rolls, raw: d.total, applied: adj.amount, type, note: adj.note };
}

export function brutalAfterEvents(state: BattleState, actor: Combatant, target: Combatant, blow: BrutalBlow, rng: Rng): BattleEvent[] {
  if (target.hp <= 0) return [];
  if (blow === 'forceful') return actor.pos ? pushAwayEvents(state, actor.pos, target.id, 15, actor.id, rng) : [];
  return [{ type: 'effect_added', targetId: target.id, effect: {
    id: `brutal-${actor.id}-${state.round}`, name: 'Hamstring Blow', sourceId: actor.id, speedFt: -15, untilSourceTurn: true, until: state.round + 1,
  } }];
}
