/** Görev B1 (kuyruk 14): büyüyü hedeften bağımsız olarak yapamama nedeni (motor, ritüel ve arayüz menüsü ortak). */
import type { Spell } from '../data';
import { silencedAt } from './zones';
import type { BattleState, Combatant } from './types';

/** Neden türü: `armor` eğitimsiz zırh (SRD 5.2.1 Armor Training: "can't cast spells"), `silence` Silence içinde sözlü büyü. */
export function castBarrierKind(state: BattleState, actor: Combatant, spell: Spell): 'armor' | 'silence' | null {
  if (actor.effects?.some((e) => e.noCast)) return 'armor';
  if (!spell.noVerbal && actor.pos && silencedAt(state, actor.pos)) return 'silence';
  return null;
}

/** Motorun hata metni (yoksa null). */
export function castBarrier(state: BattleState, actor: Combatant, spell: Spell): string | null {
  const kind = castBarrierKind(state, actor, spell);
  if (kind === 'armor') return `${actor.effects?.find((e) => e.noCast)?.name ?? 'Eğitimsiz zırh'}: büyü yapılamaz.`;
  if (kind === 'silence') return `${silencedAt(state, actor.pos!)?.name ?? 'Silence'}: sessizlikte sözlü (V) bileşenli büyü yapılamaz.`;
  return null;
}
