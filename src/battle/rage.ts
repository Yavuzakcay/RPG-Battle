/**
 * Barbarian savaş özellikleri (SRD 5.2.1; veriden: `data/class-features.json`): Rage, Reckless Attack, Frenzy.
 * - Rage: bonus eylem, ağır zırhla başlatılamaz; B/P/S direnci, STR saldırısına Rage hasarı, STR save ve Athletics
 *   avantajı, büyü ve konsantrasyon yok. Sonraki turunun sonuna dek sürer; o tur düşmana saldırı zarı atmak, düşmana
 *   save yaptırmak ya da bonus eylemle uzatmak onu bir tur daha sürdürür. Incapacitated olunca biter.
 * - Reckless Attack: turun ilk saldırısından önce; sonraki turunun başına dek STR saldırıları avantajlı, ona yapılan
 *   saldırılar avantajlı (işaret `reckless`).
 * - Frenzy: Rage sürerken Reckless Attack kullanıldıysa turunda STR saldırısıyla vurduğu ilk hedefe Rage hasarı kadar d6.
 */
import { resourceLeft, type AttackOption, type BattleEvent, type BattleState, type Combatant } from './types';
import { fail, finish, type CommandResult } from './common';
import { turnKey } from './economy';

/** Rage başlatılabilir mi (ya da uzatılabilir mi): sorun yoksa null. */
export function rageProblem(actor: Combatant): string | null {
  if (!actor.rageDamage && !actor.rageResist) return 'Rage özelliği yok.';
  if (actor.rage) return null; // uzatma
  if (actor.heavyArmor) return 'Ağır zırhla Rage başlatılamaz.';
  if (resourceLeft(actor, 'rage') <= 0) return 'Rage kalmadı.';
  return null;
}

/** Rage komutu (bonus eylem): başlatır ya da süren Rage'i uzatır. */
export function executeRage(state: BattleState, actor: Combatant): CommandResult {
  const why = rageProblem(actor);
  if (why) return fail(why);
  if (actor.rage) return finish(state, [{ type: 'rage_extended', actorId: actor.id }]);
  const added = (actor.rageResist ?? []).filter((r) => !actor.resistances.includes(r));
  const left = resourceLeft(actor, 'rage');
  return finish(state, [
    { type: 'feature_used', actorId: actor.id, feature: 'rage', remaining: left - 1 },
    { type: 'rage_started', actorId: actor.id, added },
  ]);
}

/** Reckless Attack ne zaman seçilebilir: sorun yoksa null. */
export function recklessProblem(actor: Combatant): string | null {
  if (!actor.canReckless) return 'Reckless Attack özelliği yok.';
  if (actor.economy.action || actor.economy.attacksLeft > 0) return 'Reckless Attack turun ilk saldırısından önce seçilir.';
  if ((actor.marks ?? []).some((m) => m.kind === 'reckless')) return 'Reckless Attack zaten etkin.';
  return null;
}

export function executeReckless(state: BattleState, actor: Combatant): CommandResult {
  const why = recklessProblem(actor);
  return why ? fail(why) : finish(state, [{ type: 'reckless_started', actorId: actor.id }]);
}

/** Saldırı STR ile mi (Rage hasarı, Reckless avantajı, Frenzy). */
export const usesStrength = (o: AttackOption): boolean => o.ability === 'str' && !o.spell;

/** Rage hasarı eklenmiş saldırı seçeneği (Rage sürerken STR saldırısı); değilse aynısı. */
export function withRageDamage(actor: Combatant, option: AttackOption): AttackOption {
  if (!actor.rage || !actor.rageDamage || !usesStrength(option)) return option;
  const m = /^(\d+d\d+)([+-]\d+)?$/.exec(option.damage.replace(/\s/g, ''));
  if (!m) return option;
  const bonus = Number(m[2] ?? 0) + actor.rageDamage;
  return { ...option, damage: `${m[1]}${bonus >= 0 ? '+' : ''}${bonus}` };
}

/** Frenzy uygulanır mı (isabette): Rage + kendi Reckless işareti, kendi turu, STR saldırısı, turda ilk. */
export function canFrenzy(state: BattleState, actor: Combatant, option: AttackOption | undefined): boolean {
  return !!option && !!actor.frenzy && !!actor.rage && !!actor.rageDamage && usesStrength(option)
    && (actor.marks ?? []).some((m) => m.kind === 'reckless' && m.by === actor.id)
    && state.order[state.turnIndex] === actor.id && actor.frenzyTurn !== turnKey(state);
}

/** Tur sonunda Rage sürer mi: bu tur uzatılmadıysa biter. */
export function rageTurnEndEvents(actor: Combatant): BattleEvent[] {
  return actor.rage && !actor.rage.refreshed ? [{ type: 'rage_ended', actorId: actor.id, reason: 'süresi doldu' }] : [];
}
