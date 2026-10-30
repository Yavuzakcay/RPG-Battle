/**
 * Goliath Giant Ancestry (Görev K3; SRD 5.2.1, `species:goliath/giant-ancestry`): seçilen ata yeteneği yetkinlik bonusu
 * kadar kullanılır, uzun dinlenmede dolar (kaynak `giantAncestry`).
 * - Fire's Burn / Frost's Chill / Hill's Tumble: silah isabetinde (hasar verince) otomatik, turda bir kez: +1d10 Fire,
 *   +1d6 Cold ve hedefin hızı sonraki turunun başına dek −10 ft (Slow işareti), ya da Large ve daha küçük hedef Prone.
 * - Stone's Endurance ve Storm's Thunder tepkidir (`reactions.ts`: `reduce` ve `thunder`), Cloud's Jaunt bonus eylemle
 *   ışınlanma (`use_feature`, etki `teleport`). Saf.
 */
import { adjustDamage } from '../rules/damage';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { usedThisTurn } from './classTraits';
import { damageProfile } from './common';
import { turnKey } from './economy';
import { sizeRank } from './forced';
import { resourceLeft, type AttackOption, type BattleEvent, type BattleState, type Combatant, type ExtraDamage } from './types';

export const GIANT_RESOURCE = 'giantAncestry';
const TRAIT = 'giant-ancestry';
const HIT: Record<string, { label: string; dice?: string; type?: string }> = {
  fire: { label: "Fire's Burn", dice: '1d10', type: 'fire' },
  frost: { label: "Frost's Chill", dice: '1d6', type: 'cold' },
  hill: { label: "Hill's Tumble" },
};

export interface GiantHit {
  /** Ek hasar (Fire, Frost): isabet hasarına eklenir. */
  extra?: ExtraDamage;
  /** Saldırı olayından önce: kaynak harcanır. */
  before: BattleEvent[];
  traitTurns: Record<string, string>;
  /** Saldırı olayından sonra (hedef ayaktaysa): Slow işareti ya da Prone. */
  after: (s: BattleState) => BattleEvent[];
}

/** Silah isabetinde Giant Ancestry: kullanım kaldıysa ve bu tur kullanılmadıysa; yoksa null. */
export function giantHit(state: BattleState, actor: Combatant, target: Combatant, option: AttackOption, critical: boolean, rng: Rng): GiantHit | null {
  const spec = actor.giant ? HIT[actor.giant] : undefined;
  if (!spec || option.spell || resourceLeft(actor, GIANT_RESOURCE) <= 0 || usedThisTurn(state, actor, TRAIT)) return null;
  if (actor.giant === 'hill' && sizeRank(target.size) > sizeRank('L')) return null;
  const before: BattleEvent[] = [{ type: 'feature_used', actorId: actor.id, feature: GIANT_RESOURCE, remaining: resourceLeft(actor, GIANT_RESOURCE) - 1 }];
  let extra: ExtraDamage | undefined;
  if (spec.dice && spec.type) {
    const d = rollDice(spec.dice, rollTag(rng, { kind: 'damage', by: actor.id }), critical);
    const adj = adjustDamage(d.total, spec.type, damageProfile(target));
    extra = { label: spec.label, rolls: d.rolls, raw: d.total, applied: adj.amount, type: spec.type, note: adj.note };
  }
  const after = (s: BattleState): BattleEvent[] => {
    const t = s.combatants[target.id];
    if (!t || t.hp <= 0) return [];
    if (actor.giant === 'frost') return [{ type: 'mark_added', holderId: t.id, mark: { kind: 'slow', by: actor.id, end: 'turnStart', count: 1, feet: 10 }, label: spec.label }];
    if (actor.giant === 'hill' && !t.conditions.includes('Prone')) return [{ type: 'condition_changed', targetId: t.id, condition: 'Prone', present: true, reason: spec.label }];
    return [];
  };
  return { ...(extra ? { extra } : {}), before, traitTurns: { [TRAIT]: turnKey(state) }, after };
}
