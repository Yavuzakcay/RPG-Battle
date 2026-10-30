/**
 * Görev F: Fighter, Rogue ve Ranger'ın (ve Champion, Thief, Hunter alt sınıflarının) pasif özellik kancaları. Özellik
 * savaşçıda `traits` işaretiyle (veriden: `data/class-features.json` ve `data/subclasses.json` `trait`); kodda sınıf adı
 * yok. Saf; saldırı, save ve hareket kodu buradan sorar. SRD 5.2.1.
 */
import { resolveSave } from '../rules/attack';
import { autoFailsStrDexSave, isIncapacitated } from '../rules/conditions';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { distance } from '../rules/hex';
import type { ModeSource } from '../rules/modes';
import { adjustDamage, halfDamage } from '../rules/damage';
import { spells } from '../data';
import { saveDice } from './effectDice';
import { saveMode, timedCondition } from './durations';
import { turnKey } from './economy';
import { damageEffects } from './damage-effects';
import { sizeRank } from './forced';
import type { AttackOption, BattleEvent, BattleState, Combatant, CunningOption, MasteryMark } from './types';

export const hasTrait = (c: Pick<Combatant, 'traits'> | undefined, trait: string): boolean => !!c?.traits?.includes(trait);
/** Bu tur kullanıldı mı (turda bir kez özellikler). */
export const usedThisTurn = (state: BattleState, c: Combatant, trait: string): boolean => c.traitTurns?.[trait] === turnKey(state);

// ------------------------------------------------------------------ saldırı zarı

/**
 * Saldırana ve hedefe bağlı kaynaklar: Steady Aim (bu turki sonraki saldırı avantajlı), Precise Hunter (kendi Hunter's
 * Mark'ının hedefine avantaj), Escape the Horde (hedefe fırsat saldırısı dezavantajlı).
 */
export function traitSources(state: BattleState, actor: Combatant, target: Combatant, opts: { opportunity?: boolean } = {}): ModeSource[] {
  const out: ModeSource[] = [];
  if (actor.steadyAim && actor.steadyAim === turnKey(state)) out.push({ effect: 'advantage', reason: 'Steady Aim' });
  const c = actor.concentration;
  if (hasTrait(actor, 'precise-hunter') && c && c.targetId === target.id && spells.find((s) => s.name === c.spell)?.mechanics.kind === 'mark') {
    out.push({ effect: 'advantage', reason: 'Precise Hunter' });
  }
  if (opts.opportunity && hasTrait(target, 'escape-the-horde')) out.push({ effect: 'disadvantage', reason: 'Escape the Horde' });
  return out;
}

/** Elusive (SRD: Incapacitated değilken ona yapılan saldırı zarı avantajlı olamaz): avantaj kaynakları düşer. */
export function elusiveFilter(target: Combatant, sources: ModeSource[]): ModeSource[] {
  if (!hasTrait(target, 'elusive') || isIncapacitated(target.conditions)) return sources;
  return sources.filter((s) => s.effect !== 'advantage');
}

/**
 * Saldırıdan sonra özellik işaretleri: Studied Attacks (ıskalayan, o yaratığa bir sonraki saldırısında avantaj; sonraki
 * turunun sonuna dek) ve Multiattack Defense (isabet eden, bu tur aynı hedefe diğer saldırılarında dezavantaj).
 */
export function afterAttackMarks(state: BattleState, actor: Combatant, target: Combatant, hit: boolean): BattleEvent[] {
  const out: BattleEvent[] = [];
  const mine = state.order[state.turnIndex] === actor.id;
  if (!hit && hasTrait(actor, 'studied-attacks')) {
    const mark: MasteryMark = { kind: 'studied', by: actor.id, targetId: target.id, end: 'turnEnd', count: mine ? 2 : 1 };
    out.push({ type: 'mark_added', holderId: actor.id, mark, label: 'Studied Attacks' });
  }
  if (hit && hasTrait(target, 'multiattack-defense') && !(target.marks ?? []).some((m) => m.kind === 'mdefense' && m.targetId === actor.id)) {
    const mark: MasteryMark = { kind: 'mdefense', by: actor.id, targetId: actor.id, end: 'turnEnd', count: 1 };
    out.push({ type: 'mark_added', holderId: target.id, mark, label: 'Multiattack Defense' });
  }
  return out;
}

// ------------------------------------------------------------------ save

/**
 * Evasion: DEX save'i yarım hasarlı etkide başarı hiç hasar, başarısızlık yarı hasar (Incapacitated değilken).
 * Döner: hasar çarpanı (1, 0,5 ya da 0).
 */
export function evasionFactor(target: Combatant, ability: string, success: boolean, halfOnSave: boolean): number | null {
  if (ability !== 'dex' || !halfOnSave || !hasTrait(target, 'evasion') || isIncapacitated(target.conditions)) return null;
  return success ? 0 : 0.5;
}

/** Save'li hasar: başarısız tam, başarılı yarım ya da yok; Evasion'da (DEX, yarım hasarlı) başarılı 0, başarısız yarım. */
export function saveDamage(target: Combatant, ability: string, success: boolean, raw: number, halfOnSave: boolean): number {
  const ev = evasionFactor(target, ability, success, halfOnSave);
  if (ev !== null) return ev === 0 ? 0 : halfDamage(raw);
  return !success ? raw : halfOnSave ? halfDamage(raw) : 0;
}

// ------------------------------------------------------------------ Cunning Strike

/** Seçenekler: Sneak Attack zarından düşülen sayı, save, gereken özellik (SRD 5.2.1). */
export const CUNNING: Record<CunningOption, { dice: number; save?: 'dex' | 'con'; trait: string }> = {
  trip: { dice: 1, save: 'dex', trait: 'cunning-strike' },
  withdraw: { dice: 1, trait: 'cunning-strike' },
  daze: { dice: 2, save: 'con', trait: 'devious-strikes' },
  'knock-out': { dice: 6, save: 'con', trait: 'devious-strikes' },
  obscure: { dice: 3, save: 'dex', trait: 'devious-strikes' },
};

/** Savaşçının seçebildiği Cunning Strike seçenekleri ve aynı anda en çok kaç tane (Improved Cunning Strike: 2). */
export function cunningOptions(actor: Combatant): { options: CunningOption[]; max: number } {
  const options = (Object.keys(CUNNING) as CunningOption[]).filter((o) => hasTrait(actor, CUNNING[o].trait));
  return { options, max: options.length === 0 ? 0 : hasTrait(actor, 'improved-cunning-strike') ? 2 : 1 };
}

/** Seçim geçerli mi (Sneak Attack zarı yetiyor mu); sorun yoksa null. */
export function cunningProblem(actor: Combatant, picks: CunningOption[]): string | null {
  if (picks.length === 0) return null;
  const { options, max } = cunningOptions(actor);
  if (max === 0) return 'Cunning Strike yok.';
  if (picks.length > max) return `En çok ${max} Cunning Strike seçeneği.`;
  if (new Set(picks).size !== picks.length) return 'Aynı seçenek iki kez seçilemez.';
  if (picks.some((p) => !options.includes(p))) return 'Bu Cunning Strike seçeneği yok.';
  if (picks.reduce((n, p) => n + CUNNING[p].dice, 0) > actor.sneakAttackDice) return 'Sneak Attack zarı yetmiyor.';
  return null;
}
export const cunningCost = (picks: CunningOption[] | undefined): number => (picks ?? []).reduce((n, p) => n + CUNNING[p].dice, 0);

/**
 * Cunning Strike etkileri (Sneak Attack isabetinden sonra; DC 8 + DEX + yetkinlik). Trip: Large ya da küçükse DEX save,
 * başarısızsa Prone. Withdraw: tur sonuna dek fırsat saldırısı tetiklemez (SRD: hemen yarı hızla; yaklaşık). Daze: CON,
 * başarısızsa sonraki turunun sonuna dek Dazed (yaklaşık: bonus eylem ve tepki yok). Knock Out: CON, başarısızsa
 * Unconscious; her tur sonunda CON save ile biter (1 dakika). Obscure: DEX, başarısızsa sonraki turunun sonuna dek Blinded.
 */
export function cunningEvents(state: BattleState, actor: Combatant, target: Combatant, picks: CunningOption[], rng: Rng): BattleEvent[] {
  const out: BattleEvent[] = [];
  const dc = 8 + actor.modifiers.dex + actor.proficiency;
  for (const p of picks) {
    const def = CUNNING[p];
    const label = `Cunning Strike: ${p === 'knock-out' ? 'Knock Out' : p[0]?.toUpperCase() + p.slice(1)}`;
    if (p === 'withdraw') { out.push({ type: 'disengaged', actorId: actor.id }); continue; }
    if (p === 'trip' && sizeRank(target.size) > sizeRank('L')) continue;
    if (target.hp <= 0) continue;
    const ab = def.save as 'dex' | 'con';
    const r = resolveSave({ extra: saveDice(target, ab), modifier: target.saves[ab], dc, mode: saveMode('normal', target, ab),
      autoFail: ab === 'dex' && autoFailsStrDexSave(target.conditions) }, rollTag(rng, { by: target.id }));
    const condition = { trip: 'Prone', daze: 'Dazed', 'knock-out': 'Unconscious', obscure: 'Blinded' }[p as Exclude<CunningOption, 'withdraw'>];
    out.push({ type: 'condition_save', targetId: target.id, condition, ability: ab, dc, d20: r.d20?.rolls ?? [], total: r.total ?? 0, success: r.success,
      ...(r.extra ? { bonusDice: r.extra } : {}) });
    if (r.success || target.conditions.includes(condition)) continue;
    if (p === 'trip') out.push({ type: 'condition_changed', targetId: target.id, condition, present: true, reason: label, sourceId: actor.id });
    else if (p === 'knock-out') out.push(timedCondition(state, target.id, { condition, saveEnds: { ability: 'con', dc }, maxRounds: 10 }, actor.id, label));
    else out.push(timedCondition(state, target.id, { condition, owner: 'target', end: 'turnEnd' }, actor.id, label));
  }
  return out;
}

// ------------------------------------------------------------------ Hunter

/** Superior Hunter's Prey: Hunter's Mark hasarı, ilk hedefin 30 ft yakınındaki (görünen) başka bir düşmana; turda bir kez. */
export function superiorPreyEvents(state: BattleState, actor: Combatant, first: Combatant, mark: { raw: number; rolls: number[]; type: string }, rng: Rng): BattleEvent[] {
  if (!hasTrait(actor, 'superior-hunters-prey') || usedThisTurn(state, actor, 'superior-hunters-prey') || mark.raw <= 0) return [];
  const second = Object.values(state.combatants)
    .filter((c) => c.id !== first.id && c.side !== actor.side && !c.civilian && c.hp > 0 && !c.hidden && !c.summon?.gone)
    .filter((c) => (state.map ? !!c.pos && !!first.pos && distance(c.pos, first.pos) <= 6 : true))
    .sort((a, b) => a.hp - b.hp)[0];
  if (!second) return [];
  const adj = adjustDamage(mark.raw, mark.type, second);
  const fx = damageEffects(second, adj.amount, mark.type, false, rng);
  return [{
    type: 'extra_damage', actorId: actor.id, targetId: second.id, label: "Superior Hunter's Prey", rolls: mark.rolls, raw: mark.raw,
    applied: adj.amount, damageType: mark.type, damageNote: adj.note, targetHpAfter: fx.hpAfter, effects: fx.effects,
    traitTurns: { 'superior-hunters-prey': turnKey(state) },
  }];
}

/** Colossus Slayer: turda bir kez, HP'si tam olmayan hedefe silah isabetinde 1d8 (silahın türünde). */
export function colossusDice(state: BattleState, actor: Combatant, target: Combatant, weapon: AttackOption | undefined): string | null {
  if (!weapon || weapon.spell || !hasTrait(actor, 'colossus-slayer') || usedThisTurn(state, actor, 'colossus-slayer')) return null;
  return target.hp < target.maxHp ? '1d8' : null;
}

/** Foe Slayer: Hunter's Mark zarı d6 yerine d10. */
export const markDie = (actor: Combatant, expr: string): string => (hasTrait(actor, 'foe-slayer') ? expr.replace(/d6\b/, 'd10') : expr);

/** Horde Breaker'ın hedefi olabilir mi: bu tur saldırılan bir yaratığın 5 ft yakınında, ondan farklı. */
export function hordeProblem(state: BattleState, actor: Combatant, target: Combatant): string | null {
  if (!hasTrait(actor, 'horde-breaker')) return 'Horde Breaker yok.';
  if (usedThisTurn(state, actor, 'horde-breaker')) return 'Horde Breaker bu tur kullanıldı.';
  const first = actor.economy.lastTargetId ? state.combatants[actor.economy.lastTargetId] : undefined;
  if (!first) return 'Önce bu tur bir yaratığa silahla saldırmalısın.';
  if (first.id === target.id) return 'Horde Breaker başka bir yaratığa yapılır.';
  if (state.map && (!first.pos || !target.pos || distance(first.pos, target.pos) > 1)) return `${target.name}, ${first.name}'in 5 ft yakınında değil.`;
  return null;
}

/** Rng'siz yardımcı (testler): bir zar ifadesinin ortalaması. */
export const avgDice = (expr: string, rng: Rng): number => rollDice(expr, rng).total;
