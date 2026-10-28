/** Büyü slotu harcama ve konsantrasyon başlangıcı (büyüler ve çağırma büyüleri ortak kullanır). */
import type { Spell } from '../data';
import type { Offset } from '../rules/hex';
import { fail, type Failure } from './common';
import { freeCastResource, turnKey } from './economy';
import type { BattleEvent, BattleState, Combatant } from './types';


/**
 * Büyü seviyesine (veya istenen daha yüksek seviyeye) uygun ilk dolu slotu harcar. Ranger
 * Hunter's Mark'ı Favored Enemy kullanımıyla slotsuz yapar (büyü seviyesinde sayılır).
 */
export function spendSlot(actor: Combatant, level: number, wanted?: number, spellName = ''):
  { ok: true; slotLevel: number | null; events: BattleEvent[] } | Failure {
  if (level === 0) return { ok: true, slotLevel: null, events: [] };
  const free = freeCastResource(actor, spellName, wanted);
  if (free) {
    return {
      ok: true, slotLevel: level,
      events: [{ type: 'feature_used', actorId: actor.id, feature: free, remaining: (actor.resources[free] ?? 0) - 1 }],
    };
  }
  const from = Math.max(level, wanted ?? level);
  for (let i = from - 1; i < 9; i++) {
    if ((actor.spellSlots[i] ?? 0) > 0) {
      return {
        ok: true, slotLevel: i + 1,
        events: [{ type: 'slot_spent', actorId: actor.id, level: i + 1, remaining: (actor.spellSlots[i] ?? 1) - 1 }],
      };
    }
  }
  return fail('Uygun büyü slotu kalmadı.');
}

/** Konsantrasyon büyüsü başlıyor: önceki konsantrasyon biter (reducer). */
export function concentrationEvent(state: BattleState, actor: Combatant, spell: Spell, slotLevel: number | null,
  extra: { targetId?: string; pos?: Offset } = {}): BattleEvent[] {
  if (!spell.concentration) return [];
  return [{ type: 'concentration_started', actorId: actor.id, spell: spell.name, slotLevel: slotLevel ?? spell.level, turn: turnKey(state), ...extra }];
}
