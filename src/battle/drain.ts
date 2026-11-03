/**
 * Kuyruk 19: kalıcı azalmalar (SRD 5.2.1 canavar ek etkileri): HP maksimumu hasar kadar azalır (Specter, Wight, Wraith,
 * Vampire…), yetenek puanı zar kadar azalır (Shadow; 0'da ölür). Greater Restoration ikisini de kaldırır.
 * Anahtar `monsterDrain` (kural sürümü 16). Savaş sonunda karaktere yazılmaz (uzun dinlenmede biter; savaş dışı).
 */
import { applyHealing } from '../rules/damage';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import type { RiderSpec } from './riders';
import { globalRule } from './ruleControl';
import type { BattleEvent, BattleState, Combatant, ExtraDamage } from './types';

/** Hedefin tahmini yetenek puanı (değiştiriciden; savaşçıda puan tutulmaz): 10 + 2 × değiştirici. */
const scoreOf = (c: Combatant, ab: keyof Combatant['modifiers']) => 10 + 2 * (c.modifiers[ab] - (c.abilityLoss?.[ab]?.mod ?? 0)) - (c.abilityLoss?.[ab]?.amount ?? 0);

export function drainEvents(state: BattleState, actor: Combatant, target: Combatant, spec: RiderSpec | undefined,
  dealt: number, mainType: string, extras: ExtraDamage[], label: string, rng: Rng): BattleEvent[] {
  if (!spec || dealt <= 0 || !globalRule(state, 'monsterDrain') || target.civilian) return [];
  const out: BattleEvent[] = [];
  const dm = spec.drainMax;
  if (dm) {
    const extraSum = extras.reduce((n, x) => n + x.applied, 0);
    const amount = dm.type
      ? (mainType === dm.type ? Math.max(0, dealt - extraSum) : 0) + extras.filter((x) => x.type === dm.type).reduce((n, x) => n + x.applied, 0)
      : dealt;
    if (amount > 0) {
      out.push({ type: 'max_hp_drained', targetId: target.id, amount, label });
      if (dm.heal && actor.hp > 0 && actor.hp < actor.maxHp) {
        const hpAfter = applyHealing(actor.hp, actor.maxHp, amount);
        out.push({ type: 'healed', actorId: actor.id, targetId: actor.id, label, amount: hpAfter - actor.hp, targetHpAfter: hpAfter });
      }
    }
  }
  const ad = spec.abilityDrain;
  if (ad) {
    const n = rollDice(ad.dice, rollTag(rng, { kind: 'damage', by: actor.id })).total;
    const before = scoreOf(target, ad.ability);
    const after = Math.max(0, before - n);
    const modDelta = Math.floor((after - 10) / 2) - Math.floor((before - 10) / 2);
    out.push({ type: 'ability_drained', targetId: target.id, ability: ad.ability, amount: n, modDelta, dies: !!ad.deathAtZero && after === 0, label });
  }
  return out;
}
