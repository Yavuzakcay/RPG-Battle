/**
 * Tepki sistemi (Görev R1; SRD 5.2.1 "Reactions", "Opportunity Attacks"). Saf; saldırı, hareket, büyü ve düşme
 * modülleri tetik anında buradan karar ister.
 *
 * - Ekonomi tek yerde: `canReact` (ayakta, aksiyon yapabilir, tepkisi duruyor) ve `reactionUsed` (`reaction_used`
 *   olayı; hak kendi turunun başında yenilenir). Fırsat saldırısı, Deflect Attacks, Slow Fall ve bütün tepkiler bunu
 *   kullanır.
 * - Karar `askReaction` ile (`rules/reactionChoice.ts`): arayüzde oyuncuya sorulabilir ya da politikaya göre verilir;
 *   kancasız Rng'de (simülasyon, testler) burada hesaplanan kural tabanlı öneri (yapay zekâ) kullanılır.
 * - Tepkiler veriden (`Combatant.reactions`): sınıf özelliği (`data/class-features.json`), tepki büyüsü
 *   (`data/spells.json` `mechanics.reaction`), canavar tepkisi (`data/monster-reactions.json`).
 *
 * Döngüsel içe aktarmayı önlemek için saldırı yapan tepkiler (Riposte, Retaliation) saldırıyı çağıranın verdiği
 * fonksiyonla yapar (`Strikes`).
 */
import { damageProfile } from './common';
import { saveDice } from './effectDice';
import { resolveSave } from '../rules/attack';
import { autoFailsStrDexSave, isIncapacitated } from '../rules/conditions';
import { adjustDamage, halfDamage } from '../rules/damage';
import { rollDice, rollDie, rollTag, type Rng } from '../rules/dice';
import { distance } from '../rules/hex';
import { askReaction, type ReactionAnswer, type ReactionOption, type ReactionRequest, type ReactionTrigger } from '../rules/reactionChoice';
import { heightOf } from './cover';
import { damageEffects } from './damage-effects';
import { saveMode, timedCondition } from './durations';
import { canSee } from './maprules';
import { applyEvents } from './reduce';
import { mirrorImageHit } from './mind';
import { freeSpellResource } from '../rules/classFeatures';
import type { BattleEvent, BattleState, Combatant, ReactionSpec } from './types';

/** Fırsat saldırısının kimliği (her yaratıkta; SRD 5.2.1 Opportunity Attacks). */
export const OPPORTUNITY = 'opportunity-attack';

/** Tepki verebilir mi: ayakta, uyumuyor, aksiyon yapabilir ve bu tur (kendi turundan beri) tepkisi duruyor. */
export function canReact(c: Combatant | undefined): c is Combatant {
  // Görev B1: Slow'lanan yaratık tepki alamaz.
  return !!c && c.hp > 0 && !c.civilian && !c.asleep && !c.economy.reaction && !isIncapacitated(c.conditions) && !c.effects?.some((e) => e.noReactions)
    // Görev B2: dokunulamaz çağrı (Flaming Sphere, ruh sürüsü) tepki yapmaz.
    && !(c.summon?.intangible && !c.summon.gone);
}

/** Tepki harcandı (tek yer): havuzlu canavar tepkisinde kalan kullanım, Recharge'lı tepkide bekleme. */
export function reactionUsed(c: Combatant, spec: { id: string; name: string; pool?: string; uses?: number; recharge?: number; resource?: string; spell?: string },
  trigger: ReactionTrigger, sourceId?: string, extra: Partial<Extract<BattleEvent, { type: 'reaction_used' }>> = {}): BattleEvent {
  const res = resourceOf(c, spec);
  return {
    type: 'reaction_used', actorId: c.id, reaction: spec.id, name: spec.name, trigger,
    ...(sourceId ? { sourceId } : {}),
    ...(spec.pool ? { pool: { id: spec.pool, remaining: poolLeft(c, spec) - 1 } } : {}),
    ...(res ? { resource: { id: res, remaining: (c.resources[res] ?? 0) - 1 } } : {}),
    ...(spec.recharge ? { recharge: true } : {}),
    ...extra,
  };
}

const poolLeft = (c: Combatant, spec: { pool?: string; uses?: number }): number =>
  spec.pool ? c.reactionUses?.[spec.pool] ?? spec.uses ?? 0 : Infinity;

/**
 * Görev K3: tepkinin harcadığı kaynak: verideki `resource` (Giant Ancestry) ya da tepki büyüsünün slotsuz kullanımı
 * (Infernal Tiefling: Hellish Rebuke; slotsuz kullanım önce harcanır). Yoksa null.
 */
function resourceOf(c: Combatant, spec: { resource?: string; spell?: string; pool?: string }): string | null {
  if (spec.resource) return spec.resource;
  if (!spec.spell || spec.pool) return null;
  const id = freeSpellResource(spec.spell, c.resources);
  return id && (c.resources[id] ?? 0) > 0 ? id : null;
}

/** Büyü slotu gerektiren tepkide (havuzu olmayan) kullanılabilecek slot seviyeleri; slotsuz kullanım varsa boş. */
function slotLevels(c: Combatant, spec: ReactionSpec, min: number): number[] {
  if (!spec.spell || spec.pool || resourceOf(c, spec)) return [];
  return c.spellSlots.map((n, i) => (n > 0 && i + 1 >= min ? i + 1 : 0)).filter((l) => l > 0);
}

/** Tepkinin şu an kullanılabilirliği (havuz, Recharge, slot). */
function usable(c: Combatant, spec: ReactionSpec, minSlot = 1): boolean {
  if (spec.pool && poolLeft(c, spec) <= 0) return false;
  if (spec.recharge && c.reactionSpent?.includes(spec.id)) return false;
  if (spec.resource && (c.resources[spec.resource] ?? 0) <= 0) return false;
  if (spec.spell && !spec.pool && !resourceOf(c, spec) && slotLevels(c, spec, minSlot).length === 0) return false;
  return true;
}

const specsOf = (c: Combatant, kinds: ReactionSpec['kind'][]): ReactionSpec[] =>
  (c.reactions ?? []).filter((r) => kinds.includes(r.kind));

const slotChoice = (levels: number[]) => levels.map((l) => ({ id: String(l), label: `${l}` }));

/** Seçilen slotu harcar (seçim yoksa en düşük). */
function spendSlot(c: Combatant, spec: ReactionSpec, answer: ReactionAnswer, min: number): { events: BattleEvent[]; level: number } {
  const levels = slotLevels(c, spec, min);
  if (levels.length === 0) return { events: [], level: min };
  const level = Number(answer?.choice ?? levels[0]);
  return { events: [{ type: 'slot_spent', actorId: c.id, level, remaining: (c.spellSlots[level - 1] ?? 1) - 1 }], level };
}

/** Tepki seçeneği (slot gerekiyorsa slot seviyeleri seçim olarak). */
function option(c: Combatant, spec: ReactionSpec, min = 1): ReactionOption {
  const levels = slotLevels(c, spec, min);
  return { id: spec.id, name: spec.name, ...(levels.length > 1 ? { choices: slotChoice(levels) } : {}) };
}

/** Yanıt: seçenekte seçim varsa (slot) en düşüğü. */
function answerFor(o: ReactionOption): ReactionAnswer {
  return o.choices?.length ? { option: o.id, choice: o.choices[0]?.id } : { option: o.id };
}

/** Uzaklık (ft): haritada altıgen × 5; haritasızda aynı yükseklik 5 ft, değilse 30 ft sayılır. */
export function feetBetween(state: BattleState, a: Combatant, b: Combatant): number {
  if (state.map && a.pos && b.pos) return distance(a.pos, b.pos) * 5;
  return heightOf(state, a) === heightOf(state, b) ? 5 : 30;
}

const sees = (state: BattleState, a: Combatant, b: Combatant) => !b.hidden && canSee(state, a, b);

const profileOf = (c: Combatant) => damageProfile(c);

// ---------------------------------------------------------------- isabet (Shield, Parry, Uncanny Dodge, Deflect…)

export interface HitContext {
  attacker: Combatant;
  target: Combatant;
  label: string;
  total: number;
  ac: number;
  critical: boolean;
  melee: boolean;
  ranged: boolean;
  /** Hedefe uygulanacak hasar (direnç sonrası, ek hasarlar dahil). */
  damage: number;
  damageType: string;
}

export interface HitOutcome {
  /** `attack_resolved`'dan önce yazılacak tepki olayları. */
  events: BattleEvent[];
  hit: boolean;
  ac: number;
  damage: number;
  reacted?: { name: string; ac?: number; reduced?: number };
  /** Deflect Attacks ile azaltılan (eski kayıt alanı). */
  deflected?: number;
  /** Deflect Attacks hasarı 0'a indirdi: geri yöneltme sorulabilir. */
  redirect?: boolean;
  /** Parry'nin karşılık saldırısı (Riposte): ıskalatınca. */
  counter?: string;
}

/** Bu isabete verilebilecek tepkiler ve yapay zekâ önerisi. */
function hitOptions(state: BattleState, ctx: HitContext): { specs: ReactionSpec[]; suggested: ReactionAnswer } {
  const t = ctx.target;
  const specs: ReactionSpec[] = [];
  for (const r of t.reactions ?? []) {
    if (!usable(t, r)) continue;
    if (r.melee && !ctx.melee) continue;
    if (r.ranged && !ctx.ranged) continue;
    // Kritik vuruş AC'yle ıskalatılamaz (doğal 20 her zaman isabet).
    if ((r.kind === 'shield' || r.kind === 'parry') && !ctx.critical) specs.push(r);
    else if (r.kind === 'halve' && ctx.damage > 0 && sees(state, t, ctx.attacker)) specs.push(r);
    else if (r.kind === 'resist' && ctx.damage > 0) specs.push(r);
    else if (r.kind === 'deflect' && t.deflect && ctx.damage > 0 && t.deflect.types.includes(ctx.damageType)) specs.push(r);
    else if (r.kind === 'reduce' && ctx.damage > 0 && (!r.types || r.types.includes(ctx.damageType))) specs.push(r);
  }
  // Öneri: ıskalatabilen AC tepkisi (bedavası önce), yoksa bedava azaltma, yoksa ağır isabette yarıya indirme.
  const turns = specs.filter((r) => (r.kind === 'parry' || r.kind === 'shield') && ctx.total < ctx.ac + (r.acBonus ?? 0))
    .sort((a, b) => (a.kind === 'parry' ? 0 : 1) - (b.kind === 'parry' ? 0 : 1));
  const free = specs.filter((r) => r.kind === 'deflect' || r.kind === 'reduce');
  const heavy = ctx.damage >= Math.max(5, Math.ceil(t.hp / 3)) || ctx.damage >= t.hp;
  const halves = specs.filter((r) => (r.kind === 'halve' || r.kind === 'resist') && heavy);
  const pick = turns[0] ?? free[0] ?? halves[0];
  return { specs, suggested: pick ? answerFor(option(t, pick)) : null };
}

/**
 * İsabet sonrası, hasar uygulanmadan önce hedefin tepkisi: AC artışı (Shield, Parry; isabet yeniden hesaplanır,
 * kritik değişmez), hasarı yarıya indirme (Uncanny Dodge), direnç (Superior Hunter's Defense), azaltma (Deflect
 * Attacks, Deflect Missile). Hasar zarları atılmış olarak sorulur (oyuncu hasarı görerek karar verir).
 */
export function hitReactions(state: BattleState, ctx: HitContext, rng: Rng): HitOutcome {
  const t = ctx.target;
  const none: HitOutcome = { events: [], hit: true, ac: ctx.ac, damage: ctx.damage };
  // Görev B3: Mirror Image (tepki değil): isabet bir kopyaya gelebilir.
  const mirror = mirrorImageHit(t, ctx.attacker, rng);
  if (mirror.blocked) return { events: mirror.events, hit: false, ac: ctx.ac, damage: 0, reacted: { name: 'Mirror Image' } };
  if (!canReact(t) || t.side === ctx.attacker.side) return none;
  const { specs, suggested } = hitOptions(state, ctx);
  if (specs.length === 0) return none;
  const req: ReactionRequest = {
    reactorId: t.id, trigger: 'hit', sourceId: ctx.attacker.id,
    info: { label: ctx.label, total: ctx.total, ac: ctx.ac, damage: ctx.damage },
    options: specs.map((s) => option(t, s)), suggested,
  };
  const answer = askReaction(rng, req);
  const spec = answer ? specs.find((s) => s.id === answer.option) : undefined;
  if (!spec) return none;
  const events: BattleEvent[] = [];
  if (spec.kind === 'shield' || spec.kind === 'parry') {
    const bonus = spec.acBonus ?? 0;
    const slot = spendSlot(t, spec, answer, 1);
    events.push(...slot.events);
    const mark = spec.kind === 'shield' ? { kind: 'shield' as const, by: t.id, ac: bonus, end: 'turnStart' as const, count: 1 } : undefined;
    events.push(reactionUsed(t, spec, 'hit', ctx.attacker.id, mark ? { mark } : {}));
    const ac = ctx.ac + bonus;
    const hit = ctx.critical || ctx.total >= ac;
    return { events, hit, ac, damage: hit ? ctx.damage : 0, reacted: { name: spec.name, ac: bonus },
      ...(!hit && spec.counterAttack ? { counter: spec.counterAttack } : {}) };
  }
  events.push(reactionUsed(t, spec, 'hit', ctx.attacker.id));
  let reduced = 0;
  let deflected: number | undefined;
  let redirect = false;
  if (spec.kind === 'halve' || spec.kind === 'resist') reduced = ctx.damage - halfDamage(ctx.damage);
  if (spec.kind === 'deflect' && t.deflect) {
    const roll = rollDice(t.deflect.dice, rollTag(rng, { kind: 'damage', by: t.id })).total + t.deflect.bonus;
    reduced = Math.min(ctx.damage, roll);
    deflected = reduced;
    redirect = reduced >= ctx.damage && !!t.deflect.redirect;
  }
  if (spec.kind === 'reduce' && spec.dice) {
    reduced = Math.min(ctx.damage, rollDice(spec.dice, rollTag(rng, { kind: 'damage', by: t.id })).total);
  }
  return {
    events, hit: true, ac: ctx.ac, damage: ctx.damage - reduced, reacted: { name: spec.name, reduced },
    ...(deflected !== undefined ? { deflected } : {}), ...(redirect ? { redirect: true } : {}),
  };
}

/**
 * İsabet tepkisinin ve hasarın ardından: Deflect Attacks'in geri yöneltmesi, Riposte'un karşılık saldırısı, hasar
 * alanın tepkisi (Hellish Rebuke, Retaliation). `state` saldırı olayları uygulanmış durum.
 */
export function afterAttackReactions(state: BattleState, attackerId: string, targetId: string, outcome: HitOutcome | null,
  info: { melee: boolean; damageType: string; dealt: number }, rng: Rng): BattleEvent[] {
  const events: BattleEvent[] = [];
  let current = state;
  const add = (evs: BattleEvent[]) => { events.push(...evs); current = applyEvents(current, evs); };
  if (outcome?.redirect) add(redirectEvents(current, targetId, attackerId, info.melee, info.damageType, rng));
  if (outcome?.counter && strikes && strikes.can(current, targetId, attackerId)) add(strikes.strike(current, targetId, attackerId, rng, outcome.counter));
  if (info.dealt > 0) add(damagedReactions(current, targetId, attackerId, rng));
  return events;
}

/**
 * Deflect Attacks'in geri yöneltmesi (SRD 5.2.1): hasar 0'a indiyse 1 Focus ile yakın dövüşte 5 ft, menzillide 60 ft
 * içindeki görülen bir yaratık DEX save yapar; başarısızsa iki Martial Arts zarı + DEX, saldırının hasar türünde.
 */
export function redirectEvents(state: BattleState, reactorId: string, attackerId: string, melee: boolean, damageType: string, rng: Rng): BattleEvent[] {
  const m = state.combatants[reactorId];
  const r = m?.deflect?.redirect;
  if (!m || !r || m.hp <= 0 || (m.resources[r.resource] ?? 0) <= 0) return [];
  const reach = melee ? 5 : 60;
  const targets = Object.values(state.combatants).filter((c) => c.side !== m.side && c.hp > 0 && !c.civilian
    && feetBetween(state, m, c) <= reach && sees(state, m, c));
  if (targets.length === 0) return [];
  const attacker = targets.find((c) => c.id === attackerId);
  const req: ReactionRequest = {
    reactorId: m.id, trigger: 'redirect', sourceId: attackerId,
    options: [{ id: 'monk:deflect-attacks', name: 'Deflect Attacks', choices: targets.map((c) => ({ id: c.id, label: c.name })) }],
    suggested: { option: 'monk:deflect-attacks', choice: (attacker ?? targets[0] as Combatant).id },
  };
  const answer = askReaction(rng, req);
  const target = answer?.choice ? state.combatants[answer.choice] : undefined;
  if (!target) return [];
  const events: BattleEvent[] = [{ type: 'feature_used', actorId: m.id, feature: r.resource, remaining: (m.resources[r.resource] ?? 1) - 1 }];
  events.push(saveDamage(m, target, 'Deflect Attacks', r.save, r.dc, `${r.dice}+${m.modifiers.dex}`, damageType, false, rng));
  return events;
}

/** Save'li hasar (Hellish Rebuke, geri yöneltme): başarısızsa tam, `halfOnSave` ise başarıda yarısı. */
function saveDamage(actor: Combatant, target: Combatant, label: string, ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha',
  dc: number, dice: string, damageType: string, halfOnSave: boolean, rng: Rng): BattleEvent {
  const save = resolveSave({ extra: saveDice(target, ability), modifier: target.saves[ability], dc, mode: saveMode('normal', target, ability),
    autoFail: (ability === 'str' || ability === 'dex') && autoFailsStrDexSave(target.conditions) }, rollTag(rng, { by: target.id }));
  const d = rollDice(dice, rollTag(rng, { kind: 'damage', by: actor.id }));
  const amount = !save.success ? d.total : halfOnSave ? halfDamage(d.total) : 0;
  const adj = amount > 0 ? adjustDamage(amount, damageType, profileOf(target)) : { amount: 0, note: null };
  const fx = damageEffects(target, adj.amount, damageType, false, rng);
  return {
    type: 'save_resolved', actorId: actor.id, targetId: target.id, label, ability, dc, mode: 'normal', reasons: [],
    d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
    damageRolls: d.rolls, rawDamage: d.total, appliedDamage: adj.amount, damageType, damageNote: adj.note,
    targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: [], ...(save.extra ? { bonusDice: save.extra } : {}),
  };
}

// ---------------------------------------------------------------- hedef alınma (Redirect Attack, Shield / Magic Missile)

/**
 * Saldırı zarından önce hedefin tepkisi. Redirect Attack (Goblin Boss): yanındaki Small/Medium bir dostuyla yer
 * değiştirir, saldırı ona gider. `spell` verilirse (Magic Missile): o büyüyü kesen tepki (Shield, `blocks`).
 */
export function targetedReactions(state: BattleState, attacker: Combatant, target: Combatant, rng: Rng, spell?: { srd: string; name: string }):
  { events: BattleEvent[]; targetId: string; blocked?: boolean } {
  const none = { events: [], targetId: target.id };
  if (!canReact(target) || target.side === attacker.side) return none;
  if (spell) {
    const shield = specsOf(target, ['shield']).find((s) => usable(target, s) && s.blocks?.includes(spell.srd));
    if (!shield) return none;
    const o = option(target, shield);
    const answer = askReaction(rng, { reactorId: target.id, trigger: 'targeted', sourceId: attacker.id, info: { label: spell.name },
      options: [o], suggested: answerFor(o) });
    if (!answer) return none;
    const slot = spendSlot(target, shield, answer, 1);
    const mark = { kind: 'shield' as const, by: target.id, ac: shield.acBonus ?? 5, end: 'turnStart' as const, count: 1 };
    return { events: [...slot.events, reactionUsed(target, shield, 'targeted', attacker.id, { mark })], targetId: target.id, blocked: true };
  }
  const spec = specsOf(target, ['redirectAttack']).find((s) => usable(target, s));
  if (!spec) return none;
  const allies = Object.values(state.combatants).filter((c) => c.id !== target.id && c.id !== attacker.id && c.side === target.side
    && c.hp > 0 && !c.civilian && (c.size === 'S' || c.size === 'M') && feetBetween(state, target, c) <= 5 && (!state.map || !!c.pos));
  if (allies.length === 0) return none;
  const best = [...allies].sort((a, b) => b.hp - a.hp)[0] as Combatant;
  const answer = askReaction(rng, { reactorId: target.id, trigger: 'targeted', sourceId: attacker.id,
    options: [{ id: spec.id, name: spec.name, choices: allies.map((c) => ({ id: c.id, label: c.name })) }],
    suggested: { option: spec.id, choice: best.id } });
  const ally = answer?.choice ? state.combatants[answer.choice] : undefined;
  if (!ally) return none;
  return { events: [reactionUsed(target, spec, 'targeted', attacker.id), { type: 'swapped', actorId: target.id, otherId: ally.id }], targetId: ally.id };
}

// ---------------------------------------------------------------- hasar alınca (Hellish Rebuke, Retaliation)

/**
 * Saldırı yapan tepkilerin (Retaliation, Riposte) saldırısı. Silah ve canavar saldırısı modülleri bu modülü içe
 * aktardığından saldırı fonksiyonu yüklenirken bir kez kaydedilir (`features.ts`); döngüsel içe aktarma yok.
 */
export interface Strikes {
  /** Saldıran hedefe yakın dövüşle erişiyor mu. */
  can: (state: BattleState, attackerId: string, targetId: string) => boolean;
  /** Yakın dövüş saldırısı (`attack` verilirse o adlı canavar saldırısı). */
  strike: (state: BattleState, attackerId: string, targetId: string, rng: Rng, attack?: string) => BattleEvent[];
}
let strikes: Strikes | null = null;
export const registerStrikes = (s: Strikes): void => { strikes = s; };

/**
 * Hasar alan yaratığın tepkisi (hasar uygulandıktan sonra, ayaktaysa): Hellish Rebuke (60 ft içindeki, gördüğü
 * hasar verene DEX save, 2d10 fire + slot başına 1d10) ya da Retaliation (5 ft içindekine bir yakın dövüş saldırısı).
 */
export function damagedReactions(state: BattleState, victimId: string, sourceId: string, rng: Rng): BattleEvent[] {
  const v = state.combatants[victimId];
  const src = state.combatants[sourceId];
  if (!canReact(v) || !src || src.hp <= 0 || src.side === v.side) return [];
  const specs: ReactionSpec[] = [];
  for (const r of specsOf(v, ['rebuke', 'retaliate', 'thunder'])) {
    if (!usable(v, r)) continue;
    const d = feetBetween(state, v, src);
    if ((r.kind === 'rebuke' || r.kind === 'thunder') && d <= (r.rangeFt ?? 60) && sees(state, v, src)) specs.push(r);
    if (r.kind === 'retaliate' && d <= 5 && strikes?.can(state, v.id, src.id)) specs.push(r);
  }
  if (specs.length === 0) return [];
  const options = specs.map((s) => option(v, s));
  const answer = askReaction(rng, { reactorId: v.id, trigger: 'damaged', sourceId: src.id, options, suggested: answerFor(options[0] as ReactionOption) });
  const spec = answer ? specs.find((s) => s.id === answer.option) : undefined;
  if (!spec) return [];
  const events: BattleEvent[] = [];
  if (spec.kind === 'rebuke') {
    const slot = spendSlot(v, spec, answer, 1);
    events.push(...slot.events, reactionUsed(v, spec, 'damaged', src.id));
    const extra = Math.max(0, slot.level - 1);
    const dc = spec.dc ?? v.spellSaveDc ?? 10;
    events.push(saveDamage(v, src, spec.name, spec.save ?? 'dex', dc, `${2 + extra}d10`, 'fire', true, rng));
    return events;
  }
  // Görev K3: Storm's Thunder: hasar verene zar kadar hasar (saldırı ya da save yok).
  if (spec.kind === 'thunder') {
    events.push(reactionUsed(v, spec, 'damaged', src.id));
    const type = spec.damageType ?? 'thunder';
    const d = rollDice(spec.dice ?? '1d8', rollTag(rng, { kind: 'damage', by: v.id }));
    const adj = adjustDamage(d.total, type, damageProfile(src));
    const fx = damageEffects(src, adj.amount, type, false, rng);
    events.push({ type: 'extra_damage', actorId: v.id, targetId: src.id, label: spec.name, rolls: d.rolls, raw: d.total, applied: adj.amount,
      damageType: type, damageNote: adj.note, targetHpAfter: fx.hpAfter, effects: fx.effects });
    return events;
  }
  events.push(reactionUsed(v, spec, 'damaged', src.id));
  const after = applyEvents(state, events);
  events.push(...(strikes?.strike(after, v.id, src.id, rng) ?? []));
  return events;
}

// ---------------------------------------------------------------- büyü yapılırken (Counterspell)

/**
 * Counterspell (SRD 5.2.1): 60 ft içinde büyü yapan gördüğü yaratığı durdurmaya çalışır; büyücü CON save yapar,
 * başarısızsa büyü boşa gider (eylemi harcanır, slotu harcanmaz). Canavarlarda Protective Magic havuzuyla.
 */
export function counterspellCheck(state: BattleState, caster: Combatant, spellName: string, spellLevel: number, rng: Rng):
  { countered: boolean; events: BattleEvent[] } {
  const events: BattleEvent[] = [];
  let current = state;
  for (const id of state.order) {
    const r = current.combatants[id];
    if (!canReact(r) || r.side === caster.side) continue;
    const spec = specsOf(r, ['counterspell']).find((s) => usable(r, s, 3));
    if (!spec || feetBetween(current, r, caster) > (spec.rangeFt ?? 60) || !sees(current, r, caster)) continue;
    const o = option(r, spec, 3);
    // Öneri: slotlu büyüleri durdur (cantrip'e değmez).
    const answer = askReaction(rng, { reactorId: r.id, trigger: 'cast', sourceId: caster.id, info: { spell: spellName, level: spellLevel },
      options: [o], suggested: spellLevel >= 1 ? answerFor(o) : null });
    if (!answer) continue;
    const slot = spendSlot(r, spec, answer, 3);
    events.push(...slot.events, reactionUsed(r, spec, 'cast', caster.id));
    const ability = spec.save ?? 'con';
    const dc = spec.dc ?? r.spellSaveDc ?? 10;
    const save = resolveSave({ extra: saveDice(caster, ability), modifier: caster.saves[ability], dc, mode: saveMode('normal', caster, ability) }, rollTag(rng, { by: caster.id }));
    events.push({
      type: 'save_resolved', actorId: r.id, targetId: caster.id, label: spec.name, ability, dc, mode: 'normal', reasons: [],
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: caster.hp, effects: [], conditionsAdded: [],
      ...(save.extra ? { bonusDice: save.extra } : {}),
    });
    if (!save.success) return { countered: true, events };
    current = applyEvents(current, events.slice(-3));
  }
  return { countered: false, events };
}

// ---------------------------------------------------------------- düşme (Slow Fall, Feather Fall)

/**
 * Düşme hasarından önce: düşen Slow Fall (hasar 5 × Monk seviyesi azalır) ya da Feather Fall yapabilir; yapmazsa
 * 60 ft içindeki, düşeni gören dostlar Feather Fall yapabilir (hasar yok).
 */
export function fallReactions(state: BattleState, fallerId: string, feet: number, rng: Rng): { events: BattleEvent[]; reduce: number; negate: boolean; name?: string } {
  const f = state.combatants[fallerId];
  const none = { events: [], reduce: 0, negate: false };
  if (!f || feet < 10) return none;
  const candidates = [f, ...state.order.map((id) => state.combatants[id] as Combatant).filter((c) => c && c.id !== f.id && c.side === f.side)];
  for (const r of candidates) {
    if (!canReact(r)) continue;
    const specs = (r.reactions ?? []).filter((s) => usable(r, s) && (
      (s.kind === 'slowFall' && r.id === f.id && (f.fallReduction ?? 0) > 0)
      || (s.kind === 'featherFall' && (r.id === f.id || (feetBetween(state, r, f) <= (s.rangeFt ?? 60) && sees(state, r, f))))));
    if (specs.length === 0) continue;
    const options = specs.map((s) => option(r, s));
    // Öneri: bedava Slow Fall, yoksa Feather Fall (yalnızca 20 ft ve üstü düşmede slot harcanır).
    const pick = specs.find((s) => s.kind === 'slowFall') ?? (feet >= 20 ? specs[0] : undefined);
    const answer = askReaction(rng, { reactorId: r.id, trigger: 'fall', sourceId: f.id, info: { feet },
      options, suggested: pick ? answerFor(option(r, pick)) : null });
    const spec = answer ? specs.find((s) => s.id === answer.option) : undefined;
    if (!spec) continue;
    const slot = spendSlot(r, spec, answer, 1);
    const events = [...slot.events, reactionUsed(r, spec, 'fall', f.id)];
    if (spec.kind === 'slowFall') return { events, reduce: f.fallReduction ?? 0, negate: false, name: spec.name };
    return { events, reduce: 0, negate: true, name: spec.name };
  }
  return none;
}

// ---------------------------------------------------------------- tur başı (Unnerving Gaze), Recharge

/**
 * Sırası gelen yaratık, onu gören bir düşmanın `gaze` tepkisi menzilindeyse (Chain Devil, 30 ft): WIS save; başarısızsa
 * turunun sonuna dek durum (Frightened), başarılıysa o tepkiye bağışık (`Immune:<tepki>:<sahibi>`).
 */
export function turnStartReactions(state: BattleState, actorId: string, rng: Rng): BattleEvent[] {
  const a = state.combatants[actorId];
  if (!a || a.hp <= 0) return [];
  const events: BattleEvent[] = [];
  for (const id of state.order) {
    const r = state.combatants[id];
    if (!canReact(r) || r.side === a.side) continue;
    const spec = specsOf(r, ['gaze']).find((s) => usable(r, s));
    if (!spec || a.conditions.includes(`Immune:${spec.id}:${r.id}`)) continue;
    if (feetBetween(state, r, a) > (spec.rangeFt ?? 30) || !sees(state, r, a) || !sees(state, a, r)) continue;
    const o = { id: spec.id, name: spec.name };
    if (!askReaction(rng, { reactorId: r.id, trigger: 'turnStart', sourceId: a.id, options: [o], suggested: { option: o.id } })) continue;
    events.push(reactionUsed(r, spec, 'turnStart', a.id));
    const ability = spec.save ?? 'wis';
    const dc = spec.dc ?? 10;
    const save = resolveSave({ extra: saveDice(a, ability), modifier: a.saves[ability], dc, mode: saveMode('normal', a, ability) }, rollTag(rng, { by: a.id }));
    const condition = spec.condition ?? 'Frightened';
    const added = !save.success && !a.conditions.includes(condition) ? [condition] : [];
    events.push({
      type: 'save_resolved', actorId: r.id, targetId: a.id, label: spec.name, ability, dc, mode: 'normal', reasons: [],
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: a.hp, effects: [], conditionsAdded: added,
      ...(save.extra ? { bonusDice: save.extra } : {}),
    });
    if (added.length) events.push(timedCondition(state, a.id, { condition, owner: 'target', end: 'turnEnd' }, r.id, spec.name));
    else if (save.success) events.push({ type: 'condition_changed', targetId: a.id, condition: `Immune:${spec.id}:${r.id}`, present: true, reason: spec.name });
    break;
  }
  return events;
}

/** Recharge'lı tepkilerin tur başı zarı (Deflect Missile, Recharge 5–6). */
export function reactionRechargeEvents(c: Combatant, rng: Rng): BattleEvent[] {
  return (c.reactionSpent ?? []).map((id) => {
    const need = c.reactions?.find((r) => r.id === id)?.recharge ?? 6;
    const d6 = rollDie(6, rollTag(rng, { kind: 'recharge', by: c.id }));
    return { type: 'reaction_recharged', actorId: c.id, reaction: id, d6, recharged: d6 >= need } as BattleEvent;
  });
}

// ---------------------------------------------------------------- fırsat saldırısı kararı

/** Fırsat saldırısı yapılsın mı (oyuncuya sorulabilir; öneri: her zaman). */
export function askOpportunity(o: Combatant, moverId: string, rng: Rng): boolean {
  const opt = { id: OPPORTUNITY, name: 'Opportunity Attack' };
  return askReaction(rng, { reactorId: o.id, trigger: 'leave', sourceId: moverId, options: [opt], suggested: { option: OPPORTUNITY } }) !== null;
}
