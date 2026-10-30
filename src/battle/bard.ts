/**
 * Görev BARD (SRD 5.2.1; veriden, kodda sınıf adı yok): Bardic Inspiration (`inspire` etki türü; zar dostta süren
 * etkinin `inspire` alanı, başarısız D20 Testinde `effectDice` ikinci şans yolunda atılır ve etki biter), Font of
 * Inspiration (`font-of-inspiration`: kullanım yoksa slot), Superior Inspiration (`superior-inspiration`: savaş başı).
 * Cutting Words tepkisi `reactions.ts`'te. Saf.
 */
import { distance } from '../rules/hex';
import { resourceLeft, type BattleEvent, type BattleState, type Combatant, type UsableFeature } from './types';

export const INSPIRATION = 'bard:bardic-inspiration';

/** Bardic Inspiration zarı (savaşçının `inspire` özelliğinden; yoksa null). */
export const inspirationDie = (c: Combatant): string | null => {
  const f = (c.features ?? []).find((x) => x.effect.kind === 'inspire');
  return f && f.effect.kind === 'inspire' ? f.effect.die ?? null : null;
};

/** Ödeme: kullanım, yoksa Font of Inspiration ile en düşük slot. */
function payment(actor: Combatant, f: UsableFeature): BattleEvent | null {
  if (f.resource && resourceLeft(actor, f.resource) > 0) {
    return { type: 'feature_used', actorId: actor.id, feature: f.resource, remaining: resourceLeft(actor, f.resource) - 1 };
  }
  if (!actor.traits?.includes('font-of-inspiration')) return null;
  const i = actor.spellSlots.findIndex((n) => n > 0);
  return i < 0 ? null : { type: 'slot_spent', actorId: actor.id, level: i + 1, remaining: (actor.spellSlots[i] ?? 1) - 1 };
}

export function inspireProblem(state: BattleState, actor: Combatant, f: UsableFeature, targetId: string | undefined): string | null {
  const e = f.effect;
  if (e.kind !== 'inspire') return null;
  if (!payment(actor, f)) return `${f.name}: kullanım kalmadı.`;
  if (!targetId) return 'Bir dost seçmelisin.';
  const t = state.combatants[targetId];
  if (!t || t.id === actor.id) return 'Kendinden başka bir dost seçmelisin.';
  if (t.side !== actor.side || t.hp <= 0) return 'Ayakta bir dost seçmelisin.';
  if (state.map && actor.pos && t.pos && distance(actor.pos, t.pos) * 5 > e.rangeFt) return `${e.rangeFt} ft içinde olmalı.`;
  if (t.effects?.some((x) => x.inspire)) return `${t.name} zaten bir Bardic Inspiration zarı taşıyor.`;
  return null;
}

export function inspireEvents(state: BattleState, actor: Combatant, f: UsableFeature, targetId: string): BattleEvent[] {
  const e = f.effect;
  if (e.kind !== 'inspire') return [];
  const pay = payment(actor, f) as BattleEvent;
  return [pay, { type: 'effect_added', targetId, effect: { id: INSPIRATION, name: f.name, sourceId: actor.id, until: state.round + e.rounds - 1,
    inspire: e.die ?? '1d6', icon: '🎵' } }];
}

/** Superior Inspiration: savaş başında (inisiyatifte) kullanım en az 2'ye tamamlanır. */
export function superiorInspirationEvents(c: Combatant): BattleEvent[] {
  if (!c.traits?.includes('superior-inspiration')) return [];
  const f = (c.features ?? []).find((x) => x.effect.kind === 'inspire');
  if (!f?.resource || resourceLeft(c, f.resource) >= 2) return [];
  return [{ type: 'feature_used', actorId: c.id, feature: f.resource, remaining: 2 }];
}
