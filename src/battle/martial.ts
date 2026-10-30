/**
 * Dövüş sanatları (Görev P-Monk; SRD 5.2.1, veriden: `data/class-features.json`):
 * - Bonus eylemle Unarmed Strike (Martial Arts) ve Flurry of Blows'un vuruşları: yan el ek saldırısıyla aynı düzenek
 *   (`weaponAttackEvents`); eylem ekonomisi `economy.ts`'te (Flurry kalan vuruşu `economy.flurryLeft`).
 * - Focus ile bonus eylemler (`focus_action`): Flurry of Blows (iki Unarmed Strike), Patient Defense (Disengage + Dodge),
 *   Step of the Wind (Disengage + Dash).
 * - Stunning Strike: bu tur Monk silahı ya da Unarmed Strike ile vurulan hedefe, turda bir kez, 1 Focus; CON save.
 *   Başarısızsa saldıranın sonraki turunun başına dek Stunned; başarılıysa ona sonraki saldırı avantajlı (Yardım işareti).
 * - Open Hand Technique: Flurry vuruşu isabet ederse Addle (fırsat saldırısı yok), Push (STR save, 15 ft) ya da
 *   Topple (DEX save, Prone).
 * - Uncanny Metabolism (savaş başında), Deflect Attacks (isabette), Slow Fall (düşmede) ilgili modüllerden çağrılır.
 */
import { saveDice } from './effectDice';
import { resolveSave } from '../rules/attack';
import { autoFailsStrDexSave } from '../rules/conditions';
import { applyHealing } from '../rules/damage';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { fail, finish, isTargetable, type CommandResult } from './common';
import { helpMark, saveMode, timedCondition } from './durations';
import { weaponAttackEvents } from './features';
import { pushAwayEvents } from './forced';
import { stunningProblem } from './stunning';
export { stunningProblem } from './stunning';
import { applyEvents } from './reduce';
import { resourceLeft, type BattleEvent, type BattleState, type Combatant } from './types';

type Technique = 'addle' | 'push' | 'topple';

/** Bonus eylemle vuruş yapılabilir mi (Flurry kalanı ya da Martial Arts): sorun yoksa null. */
export function bonusStrikeProblem(actor: Combatant): string | null {
  if (!actor.bonusStrike) return 'Bonus eylemle Unarmed Strike yok (Martial Arts zırhsız ve kalkansızken).';
  return null;
}

/** Focus eylemi yapılabilir mi: sorun yoksa null. */
export function focusActionProblem(actor: Combatant, id: string): string | null {
  const a = (actor.focusActions ?? []).find((x) => x.id === id);
  if (!a) return 'Bu Focus eylemi yok.';
  if (resourceLeft(actor, a.resource) < 1) return 'Focus Point kalmadı.';
  if (a.strikes && !actor.bonusStrike) return 'Flurry of Blows için Unarmed Strike gerekir (zırhsız ve kalkansız).';
  return null;
}

/** DC (8 + yetenek + yetkinlik) ile hedefin save'i. */
function saveFor(target: Combatant, ability: 'str' | 'dex' | 'con', dc: number, rng: Rng) {
  return resolveSave({ extra: saveDice(target, ability), modifier: target.saves[ability], dc, mode: saveMode('normal', target, ability),
    autoFail: (ability === 'str' || ability === 'dex') && autoFailsStrDexSave(target.conditions) }, rollTag(rng, { by: target.id }));
}

/** Kaydın save olayı (hasarsız). */
function saveEvent(actor: Combatant, target: Combatant, label: string, ability: 'str' | 'dex' | 'con', dc: number,
  r: ReturnType<typeof resolveSave>, added: string[]): BattleEvent {
  return {
    type: 'save_resolved', actorId: actor.id, targetId: target.id, label, ability, dc, mode: 'normal', reasons: [],
    d20: r.d20?.rolls ?? [], natural: r.d20?.kept ?? null, total: r.total, success: r.success,
    damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: target.hp, effects: [], conditionsAdded: added,
    ...(r.extra ? { bonusDice: r.extra } : {}),
  };
}

/** Open Hand Technique: Flurry vuruşu isabet edince. */
function techniqueEvents(state: BattleState, actor: Combatant, targetId: string, technique: Technique, rng: Rng): BattleEvent[] {
  const target = state.combatants[targetId];
  const dc = actor.stunning?.dc ?? 8 + actor.modifiers.wis + actor.proficiency;
  if (!target || target.hp <= 0 || !isTargetable(target)) return [];
  if (technique === 'addle') {
    return [timedCondition(state, target.id, { condition: 'Addled', owner: 'target', end: 'turnStart' }, actor.id, 'Open Hand Technique (Addle)')];
  }
  if (technique === 'topple') {
    const r = saveFor(target, 'dex', dc, rng);
    const prone = !r.success && !target.conditions.includes('Prone');
    return [saveEvent(actor, target, 'Open Hand Technique (Topple)', 'dex', dc, r, prone ? ['Prone'] : []),
      ...(prone ? [{ type: 'condition_changed', targetId: target.id, condition: 'Prone', present: true, reason: 'Open Hand Technique' } as BattleEvent] : [])];
  }
  const r = saveFor(target, 'str', dc, rng);
  const out: BattleEvent[] = [saveEvent(actor, target, 'Open Hand Technique (Push)', 'str', dc, r, [])];
  if (!r.success && state.map && actor.pos) out.push(...pushAwayEvents(applyEvents(state, out), actor.pos, target.id, 15, actor.id, rng));
  return out;
}

/**
 * Bonus eylemle Unarmed Strike: Flurry of Blows'un kalan vuruşu varsa onu (Open Hand Technique uygulanır), yoksa
 * Martial Arts'ın bonus vuruşu. Eylem ekonomisi `economy.ts`'te.
 */
export function executeBonusStrike(state: BattleState, actor: Combatant, targetId: string, technique: Technique | undefined, rng: Rng): CommandResult {
  const why = bonusStrikeProblem(actor);
  if (why) return fail(why);
  const target = state.combatants[targetId];
  if (!target) return fail('Hedef bulunamadı.');
  if (target.side === actor.side) return fail('Dostuna saldıramazsın.');
  const flurry = (actor.economy.flurryLeft ?? 0) > 0;
  const r = weaponAttackEvents(state, actor, target, { ...actor.bonusStrike as NonNullable<Combatant['bonusStrike']>, label: flurry ? 'Flurry of Blows' : 'Unarmed Strike (bonus)' }, rng);
  if (!r.ok) return r;
  const events = [...r.events];
  const hit = events.some((e) => e.type === 'attack_resolved' && e.actorId === actor.id && e.targetId === targetId && e.hit);
  const options = actor.openHand ?? [];
  if (flurry && hit && options.length > 0) {
    const t: Technique = technique && options.includes(technique) ? technique : (options.includes('topple') ? 'topple' : options[0] as Technique);
    events.push(...techniqueEvents(applyEvents(state, events), actor, targetId, t, rng));
  }
  return finish(state, events);
}

/** Focus eylemi: kaynak harcar; eylemler (Disengage, Dodge, Dash) hemen, Flurry vuruşları sonra (`bonus_strike`). */
export function executeFocusAction(state: BattleState, actor: Combatant, id: string): CommandResult {
  const why = focusActionProblem(actor, id);
  if (why) return fail(why);
  const a = (actor.focusActions ?? []).find((x) => x.id === id) as NonNullable<Combatant['focusActions']>[number];
  const events: BattleEvent[] = [{ type: 'feature_used', actorId: actor.id, feature: a.resource, remaining: resourceLeft(actor, a.resource) - 1 }];
  for (const act of a.actions ?? []) {
    if (act === 'disengage') events.push({ type: 'disengaged', actorId: actor.id });
    if (act === 'dash') events.push({ type: 'dashed', actorId: actor.id });
    if (act === 'dodge') events.push(timedCondition(state, actor.id, { condition: 'Dodge', owner: 'target', end: 'turnStart' }, actor.id, a.name));
  }
  return finish(state, events);
}

/** Stunning Strike (eylemsiz; ekonomi `stunUsed`). */
export function executeStunningStrike(state: BattleState, actor: Combatant, targetId: string, rng: Rng): CommandResult {
  const why = stunningProblem(actor, targetId);
  if (why) return fail(why);
  const s = actor.stunning as NonNullable<Combatant['stunning']>;
  const target = state.combatants[targetId];
  if (!target || target.hp <= 0 || !isTargetable(target)) return fail('Hedef ayakta değil.');
  const ability = s.save as 'str' | 'dex' | 'con';
  const r = saveFor(target, ability, s.dc, rng);
  const events: BattleEvent[] = [
    { type: 'feature_used', actorId: actor.id, feature: s.resource, remaining: resourceLeft(actor, s.resource) - 1 },
    saveEvent(actor, target, 'Stunning Strike', ability, s.dc, r, r.success ? [] : [s.condition]),
  ];
  if (!r.success) {
    events.push(timedCondition(state, target.id, { condition: s.condition, owner: 'source', end: 'turnStart' }, actor.id, 'Stunning Strike'));
  } else if (!target.conditions.includes(helpMark(actor.side))) {
    // Başarılı save: saldıranın sonraki turunun başına dek ona sonraki saldırı avantajlı (Yardım işaretiyle aynı).
    events.push(timedCondition(state, target.id, { condition: helpMark(actor.side), owner: 'source', end: 'turnStart' }, actor.id, 'Stunning Strike'));
  }
  return finish(state, events);
}

/** Uncanny Metabolism (inisiyatif atılınca): kaynak eksikse ya da yaralıysa doldurur ve iyileştirir. */
export function metabolismEvents(c: Combatant, rng: Rng): BattleEvent[] {
  const m = c.metabolism;
  if (!m || resourceLeft(c, m.resource) <= 0 || c.hp <= 0) return [];
  const max = m.max;
  if (resourceLeft(c, m.refill) >= max && c.hp >= c.maxHp) return [];
  const roll = rollDice(m.die, rollTag(rng, { kind: 'heal', by: c.id }));
  const hpAfter = applyHealing(c.hp, c.maxHp, roll.total + c.level);
  return [
    { type: 'feature_used', actorId: c.id, feature: m.resource, remaining: resourceLeft(c, m.resource) - 1 },
    { type: 'feature_used', actorId: c.id, feature: m.refill, remaining: max },
    { type: 'healed', actorId: c.id, targetId: c.id, label: 'Uncanny Metabolism', amount: hpAfter - c.hp, targetHpAfter: hpAfter },
  ];
}
