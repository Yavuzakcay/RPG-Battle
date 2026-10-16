/**
 * Sınıf özellikleri ve süren büyü etkileri (SRD 5.2.1):
 * - Silah saldırısı ve isabetteki ek hasar: Sneak Attack (haydut), Hunter's Mark (korucu).
 * - Fighter: Action Surge ve Second Wind.
 * - Konsantrasyonla süren etkiler: Spiritual Weapon'ın sonraki turlardaki saldırısı, Hunter's
 *   Mark'ın taşınması, Spirit Guardians yayılımı (girişte, tur sonunda, büyücü yürüyünce).
 * - Fırsat saldırısı: erişimden çıkan yaratığa tepkiyle tek yakın dövüş saldırısı.
 *
 * Haritasız savaşta konum yok: "yanında" ve "yayılımın içinde" aynı yükseklik bandı sayılır
 * (bkz. DECISIONS.md).
 */
import { getEnvironment, spells, type Spell } from '../data';
import { resolveAttack, resolveSave } from '../rules/attack';
import { attackSources, isAutoCritical, isIncapacitated } from '../rules/conditions';
import { adjustDamage, applyHealing, halfDamage } from '../rules/damage';
import { rollDice, type RollMode, type Rng } from '../rules/dice';
import { distance, neighbors, type Offset } from '../rules/hex';
import { combineModes, environmentSources, invertMode, underwaterSources } from '../rules/modes';
import { fail, finish, isTargetable, type CommandResult, type Failure } from './common';
import { heightOf } from './cover';
import { damageEffects } from './damage-effects';
import { turnKey } from './economy';
import { canSee, isUnderwater } from './maprules';
import { distance as hexDistance } from '../rules/hex';
import { monsterAttackEvents } from './monsters';
import { checkReach, optionReach, spellReach } from './range';
import { applyEvents } from './reduce';
import type { AttackOption, BattleEvent, BattleState, Combatant, ExtraDamage } from './types';

const profileOf = (t: Combatant) => ({ resistances: t.resistances, immunities: t.immunities, vulnerabilities: t.vulnerabilities });

/** Zar ifadesinin ortalaması ("2d6+3" → 10). */
function avg(dice: string | undefined): number {
  const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec((dice ?? '').replace(/\s/g, ''));
  return m ? Number(m[1]) * (Number(m[2]) + 1) / 2 + Number(m[3] ?? 0) : 0;
}

export const spellOf = (name: string | undefined): Spell | undefined => spells.find((s) => s.name === name);

/** Yaratığın en iyi yakın dövüş saldırısı (fırsat saldırısı için) ve erişimi (ft). */
export function meleeOf(c: Combatant): { option?: AttackOption; attackIndex?: number; reachFt: number } | null {
  const weapon = c.weaponOptions.filter((o) => !o.ranged && !o.spell).sort((a, b) => avg(b.damage) - avg(a.damage))[0];
  if (weapon) return { option: weapon, reachFt: weapon.reachFt ?? 5 };
  const best = c.attacks
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => !a.save && !a.ranged && a.damageDice && !a.recharge)
    .sort((x, y) => avg(y.a.damageDice) - avg(x.a.damageDice))[0];
  return best ? { attackIndex: best.i, reachFt: best.a.reachFt ?? 5 } : null;
}

/** Ayakta ve aksiyon yapabilen. */
const able = (c: Combatant) => c.hp > 0 && isTargetable(c) && !isIncapacitated(c.conditions);

/**
 * Sneak Attack'ın yandaş koşulu: hedefin 5 ft yakınında saldıranın Incapacitated olmayan bir
 * müttefiki. Haritasız savaşta: hedefle aynı yükseklikte, yakın dövüş saldırısı olan müttefik.
 */
function allyNextTo(state: BattleState, actor: Combatant, target: Combatant): boolean {
  return Object.values(state.combatants).some((c) => {
    if (c.id === actor.id || c.id === target.id || c.side !== actor.side || !able(c)) return false;
    if (state.map && c.pos && target.pos) return distance(c.pos, target.pos) <= 1;
    return !state.map && heightOf(state, c) === heightOf(state, target) && meleeOf(c) !== null;
  });
}

/** Bu saldırıda Sneak Attack uygulanır mı (isabet ederse). */
export function canSneak(state: BattleState, actor: Combatant, target: Combatant, weapon: AttackOption | undefined, mode: RollMode): boolean {
  return !!weapon && !weapon.spell && (!!weapon.finesse || weapon.ranged) && actor.sneakAttackDice > 0
    && actor.sneakTurn !== turnKey(state)
    && (mode === 'advantage' || (mode !== 'disadvantage' && allyNextTo(state, actor, target)));
}

/**
 * İsabetteki ek hasarlar. Sneak Attack: turda bir kez, Finesse veya menzilli silahla, avantajla
 * ya da (dezavantaj yoksa) hedefin yanında müttefik varken; silahın hasar türünde. Hunter's
 * Mark: işaretli hedefe her saldırı isabetinde 1d6 force. Kritik vuruşta zarlar iki kat.
 */
export function hitExtras(
  state: BattleState, actor: Combatant, target: Combatant,
  hit: { mode: RollMode; critical: boolean; weapon?: AttackOption }, rng: Rng,
): { extras: ExtraDamage[]; sneakTurn?: string } {
  const extras: ExtraDamage[] = [];
  const add = (label: string, expr: string, type: string) => {
    const d = rollDice(expr, rng, hit.critical);
    const adj = adjustDamage(d.total, type, profileOf(target));
    extras.push({ label, rolls: d.rolls, raw: d.total, applied: adj.amount, type, note: adj.note });
  };
  let sneakTurn: string | undefined;
  const w = hit.weapon;
  if (w && canSneak(state, actor, target, w, hit.mode)) {
    add('Sneak Attack', `${actor.sneakAttackDice}d6`, w.damageType ?? '');
    sneakTurn = turnKey(state);
  }
  const c = actor.concentration;
  if (c && c.targetId === target.id && spellOf(c.spell)?.mechanics.kind === 'mark') {
    const m = spellOf(c.spell)?.mechanics;
    add(c.spell, m?.damage ?? '1d6', m?.damageType ?? 'force');
  }
  return { extras, ...(sneakTurn ? { sneakTurn } : {}) };
}

/** Silah saldırısı (Attack eylemi veya fırsat saldırısı). */
export function weaponAttackEvents(
  state: BattleState, actor: Combatant, target: Combatant, option: AttackOption, rng: Rng, opportunity = false,
): { ok: true; events: BattleEvent[] } | Failure {
  if (target.id === actor.id) return fail('Kendine saldıramazsın.');
  if (!isTargetable(target)) return fail('Hedef zaten düşmüş.');
  const reach = checkReach(state, actor, target, optionReach(option));
  if (!reach.ok) return reach;
  const env = getEnvironment(state.environmentId);
  const allyAlive = Object.values(state.combatants).some((c) => c.id !== actor.id && c.side === actor.side && c.hp > 0);
  // Su altında (derin suda) SRD'nin su altı kuralları ortamdan bağımsız işler.
  const beyond = !!option.range && !!actor.pos && !!target.pos && hexDistance(actor.pos, target.pos) * 5 > option.range[0];
  const water = isUnderwater(state, actor) ? underwaterSources(option.ranged, option.damageType, beyond) : { sources: [], autoMiss: false };
  const sources = [
    ...environmentSources(env, option.tag, { weapon: true, ranged: option.ranged }),
    ...attackSources({
      attackerConditions: actor.conditions, targetConditions: target.conditions,
      attackerHeight: heightOf(state, actor), targetHeight: heightOf(state, target),
      ranged: option.ranged, spell: option.spell, packTactics: actor.packTactics && allyAlive, targetAsleep: target.asleep === true,
    }),
    ...reach.sources,
    ...water.sources,
  ];
  const mode = combineModes(sources);
  const targetAc = target.ac + reach.cover;
  const rolled = resolveAttack(
    { attackBonus: option.attackBonus, targetAc, mode, damage: option.damage, autoCritical: isAutoCritical(target.conditions, option.ranged) },
    rng,
  );
  const result = water.autoMiss ? { ...rolled, hit: false, critical: false, damage: null } : rolled;
  const rawDamage = result.damage?.total ?? 0;
  const adjusted = result.hit ? adjustDamage(rawDamage, option.damageType, profileOf(target)) : { amount: 0, note: null };
  const bonus = result.hit ? hitExtras(state, actor, target, { mode, critical: result.critical, weapon: option }, rng) : { extras: [] };
  const total = adjusted.amount + bonus.extras.reduce((n, x) => n + x.applied, 0);
  const fx = damageEffects(target, total, option.damageType ?? '', result.critical, rng);
  return {
    ok: true,
    events: [{
      type: 'attack_resolved', actorId: actor.id, targetId: target.id, label: option.label, mode,
      reasons: sources.map((s) => s.reason), d20: result.d20.rolls, natural: result.d20.kept, total: result.total,
      targetAc, hit: result.hit, critical: result.critical, fumble: result.fumble,
      damageRolls: result.damage?.rolls ?? [], rawDamage, appliedDamage: total,
      damageType: option.damageType ?? '', damageNote: adjusted.note, targetHpAfter: fx.hpAfter, effects: fx.effects,
      ...(reach.cover ? { cover: reach.cover } : {}),
      ...(bonus.extras.length > 0 ? { extra: bonus.extras } : {}),
      ...(bonus.sneakTurn ? { sneakTurn: bonus.sneakTurn } : {}),
      ...(opportunity ? { opportunity: true } : {}),
    }],
  };
}

// ---------------------------------------------------------------- fırsat saldırısı

const withPos = (state: BattleState, id: string, pos: Offset | null): BattleState => {
  const c = state.combatants[id] as Combatant;
  return { ...state, combatants: { ...state.combatants, [id]: { ...c, pos } } };
};

/** Bu yaratık, savaşçının `from` → `to` hareketinde erişimden çıkıyor mu (haritalı savaş). */
function leavesReach(o: Combatant, reachFt: number, from: Offset, to: Offset): boolean {
  if (!o.pos) return false;
  const r = Math.max(1, Math.floor(reachFt / 5));
  return distance(o.pos, from) <= r && distance(o.pos, to) > r;
}

/**
 * Fırsat saldırıları (SRD 5.2.1 Opportunity Attacks): gördüğü bir yaratık erişiminden kendi
 * hareketiyle çıkarken, tepkisi duran ve aksiyon yapabilen her düşman, hareketten hemen önce
 * en iyi yakın dövüş saldırısıyla bir kez saldırır. Ayrılma (Disengage) yapan tetiklemez.
 * Haritalı savaşta `from` → `to` adımı; haritasızda yükseklik değiştirme (aynı banttaki düşmanlar).
 * Tepkiler otomatik kullanılır. `state` içinde hareket eden henüz `from`dadır.
 */
export function opportunityAttacks(
  state: BattleState, moverId: string, step: { from: Offset; to: Offset } | null, rng: Rng,
): BattleEvent[] {
  const mover0 = state.combatants[moverId];
  if (!mover0 || mover0.economy.disengaged || mover0.hp <= 0) return [];
  const events: BattleEvent[] = [];
  let current = state;
  for (const id of state.order) {
    const mover = current.combatants[moverId] as Combatant;
    if (mover.hp <= 0) break;
    const o = current.combatants[id];
    if (!o || o.side === mover.side || o.civilian || !able(o) || o.economy.reaction) continue;
    const melee = meleeOf(o);
    if (!melee) continue;
    if (step) {
      if (!leavesReach(o, melee.reachFt, step.from, step.to)) continue;
      if (mover.hidden || !canSee(current, o, mover)) continue;
    } else if (state.map || heightOf(current, o) !== heightOf(current, mover) || mover.hidden) {
      continue;
    }
    let r: { ok: true; events: BattleEvent[] } | Failure;
    if (melee.option) r = weaponAttackEvents(current, o, mover, melee.option, rng, true);
    else {
      r = monsterAttackEvents(current, o, mover, melee.attackIndex ?? 0, rng);
      if (r.ok) r = { ok: true, events: r.events.map((e) => (e.type === 'attack_resolved' ? { ...e, opportunity: true } : e)) };
    }
    if (!r.ok) continue;
    const spent: BattleEvent = { type: 'action_used', actorId: o.id, kind: 'reaction', what: 'Fırsat saldırısı' };
    events.push(...r.events, spent);
    current = applyEvents(current, [...r.events, spent]);
  }
  return events;
}

// ---------------------------------------------------------------- Spirit Guardians

/** Yayılımı olan büyünün yarıçapı (altıgen); yoksa null. */
function auraRadius(c: Combatant): number | null {
  const spell = spellOf(c.concentration?.spell);
  if (spell?.mechanics.lingering !== 'aura') return null;
  return Math.floor((spell.area?.sizeFt ?? 15) / 5);
}

/** Bu yaratığı etkileyen yayılımların büyücüleri (büyücünün düşmanları etkilenir). */
export function hostileAuras(state: BattleState, victim: Combatant): Combatant[] {
  return Object.values(state.combatants).filter((c) => c.side !== victim.side && c.hp > 0 && auraRadius(c) !== null);
}

/** Yaratık (verilen yerde) büyücünün yayılımının içinde mi. Haritasız: aynı yükseklik. */
export function inAura(state: BattleState, caster: Combatant, victimAt: Offset | null, victim: Combatant, casterAt = caster.pos): boolean {
  const r = auraRadius(caster);
  if (r === null) return false;
  if (!state.map) return heightOf(state, caster) === heightOf(state, victim);
  return !!victimAt && !!casterAt && distance(victimAt, casterAt) <= r;
}

/** Yayılımın içinden geçmek: hız yarıya iner (altıgen maliyeti iki katı). */
export function auraSlows(state: BattleState, mover: Combatant): (h: Offset) => boolean {
  const casters = state.map ? hostileAuras(state, mover).filter((c) => c.pos) : [];
  return (h) => casters.some((c) => inAura(state, c, h, mover));
}

/**
 * Yayılım save'i: WIS, başarısızsa 3d8 radiant (slot seviyesi 3'ün üstündeki her seviye +1d8),
 * başarılıysa yarısı. Yaratık turda yalnızca bir kez save yapar.
 */
export function auraSave(state: BattleState, caster: Combatant, victim: Combatant, rng: Rng): BattleEvent | null {
  const conc = caster.concentration;
  const spell = spellOf(conc?.spell);
  const turn = turnKey(state);
  if (!conc || !spell || !isTargetable(victim) || victim.hp <= 0 || conc.auraHits?.[victim.id] === turn) return null;
  const m = spell.mechanics;
  const ability = m.save ?? 'wis';
  const env = getEnvironment(state.environmentId);
  const reasons = environmentSources(env, `${caster.casterTag} ${spell.name} ${spell.text}`.toLowerCase());
  const mode = invertMode(combineModes(reasons));
  const save = resolveSave({ modifier: victim.saves[ability], dc: caster.spellSaveDc ?? 0, mode }, rng);
  const base = /^(\d+)d(\d+)$/.exec(m.damage ?? '3d8');
  const count = Number(base?.[1] ?? 3) + (m.upcastDice ? Math.max(0, conc.slotLevel - spell.level) : 0);
  const dmg = rollDice(`${count}d${base?.[2] ?? 8}`, rng);
  const amount = save.success ? (m.halfOnSave ? halfDamage(dmg.total) : 0) : dmg.total;
  const adj = amount > 0 ? adjustDamage(amount, m.damageType, profileOf(victim)) : { amount: 0, note: null };
  const fx = damageEffects(victim, adj.amount, m.damageType ?? '', false, rng);
  return {
    type: 'save_resolved', actorId: caster.id, targetId: victim.id, label: spell.name, ability, dc: caster.spellSaveDc ?? 0,
    mode, reasons: reasons.map((r) => r.reason), d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null,
    total: save.total, success: save.success, damageRolls: dmg.rolls, rawDamage: dmg.total, appliedDamage: adj.amount,
    damageType: m.damageType ?? '', damageNote: adj.note, targetHpAfter: fx.hpAfter, conditionsAdded: [], effects: fx.effects,
    aura: { casterId: caster.id, turn },
  };
}

/** Olayları sırayla üretip uygular (her biri önceki durumu görür). */
function chain(state: BattleState, make: Array<(s: BattleState) => BattleEvent | null>): { state: BattleState; events: BattleEvent[] } {
  let current = state;
  const events: BattleEvent[] = [];
  for (const f of make) {
    const e = f(current);
    if (!e) continue;
    events.push(e);
    current = applyEvents(current, [e]);
  }
  return { state: current, events };
}

/**
 * Yürüyüşün bir adımında yayılım: yürüyen bir yayılıma girerse save; yürüyen büyücüyse
 * yayılımı yeni giren düşmanlar save yapar. `state` içinde yürüyen artık `to`dadır.
 */
export function auraStepEvents(state: BattleState, moverId: string, from: Offset | null, to: Offset | null, rng: Rng,
  heightFrom?: number): BattleEvent[] {
  const mover = state.combatants[moverId];
  if (!mover) return [];
  const makers: Array<(s: BattleState) => BattleEvent | null> = [];
  const beforeIn = (caster: Combatant) => (state.map
    ? inAura(state, caster, from, mover)
    : heightFrom === heightOf(state, caster));
  for (const caster of hostileAuras(state, mover)) {
    if (inAura(state, caster, to, mover) && !beforeIn(caster)) {
      makers.push((s) => auraSave(s, s.combatants[caster.id] as Combatant, s.combatants[moverId] as Combatant, rng));
    }
  }
  if (auraRadius(mover) !== null) {
    for (const v of Object.values(state.combatants)) {
      if (v.side === mover.side || !isTargetable(v) || v.hp <= 0) continue;
      const nowIn = inAura(state, mover, v.pos, v, to);
      const wasIn = state.map ? inAura(state, mover, v.pos, v, from) : heightFrom === heightOf(state, v);
      if (nowIn && !wasIn) makers.push((s) => auraSave(s, s.combatants[moverId] as Combatant, s.combatants[v.id] as Combatant, rng));
    }
  }
  return chain(state, makers).events;
}

/** Turunu yayılımın içinde bitiren yaratık save yapar. */
export function auraTurnEndEvents(state: BattleState, actor: Combatant, rng: Rng): BattleEvent[] {
  const makers = hostileAuras(state, actor)
    .filter((caster) => inAura(state, caster, actor.pos, actor))
    .map((caster) => (s: BattleState) => auraSave(s, s.combatants[caster.id] as Combatant, s.combatants[actor.id] as Combatant, rng));
  return chain(state, makers).events;
}

// ---------------------------------------------------------------- Fighter

/** Action Surge: eylemini kullandıktan sonra bir eylem daha (turda bir kez). */
export function executeActionSurge(state: BattleState, actor: Combatant): CommandResult {
  if (actor.resources.actionSurge <= 0) return fail('Action Surge kalmadı.');
  if (actor.economy.surged) return fail('Action Surge bu tur kullanıldı.');
  if (!actor.economy.action || actor.economy.attacksLeft > 0) return fail('Önce eylemini kullanmalısın.');
  const events: BattleEvent[] = [{ type: 'feature_used', actorId: actor.id, feature: 'actionSurge', remaining: actor.resources.actionSurge - 1 }];
  return { ok: true, state: applyEvents(state, events), events };
}

/** Second Wind: bonus eylem, 1d10 + savaşçı seviyesi HP. */
export function executeSecondWind(state: BattleState, actor: Combatant, rng: Rng): CommandResult {
  if (actor.resources.secondWind <= 0) return fail('Second Wind kalmadı.');
  const roll = rollDice(`1d10+${actor.level}`, rng);
  const hpAfter = applyHealing(actor.hp, actor.maxHp, roll.total);
  const events: BattleEvent[] = [
    { type: 'feature_used', actorId: actor.id, feature: 'secondWind', remaining: actor.resources.secondWind - 1 },
    { type: 'healed', actorId: actor.id, targetId: actor.id, label: 'Second Wind', amount: hpAfter - actor.hp, targetHpAfter: hpAfter },
  ];
  return { ok: true, state: applyEvents(state, events), events };
}

// ---------------------------------------------------------------- konsantrasyonu sürdürme

/** Spiritual Weapon gücünün hedefin yanında duracağı altıgen: eski yerine en yakın komşu. */
export function weaponHexNear(state: BattleState, target: Combatant, from: Offset | null | undefined): Offset | undefined {
  if (!state.map || !target.pos) return undefined;
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const around = neighbors(target.pos, size);
  if (!from) return around[0];
  return [...around].sort((a, b) => distance(a, from) - distance(b, from))[0];
}

/**
 * Bonus eylemle konsantrasyon büyüsünü sürdürür (yapıldığı turdan sonraki turlarda):
 * Spiritual Weapon: güç 20 ft (4 altıgen) uçup yanındaki yaratığa yakın dövüş büyü saldırısı
 * yapar (1d8 + büyü modifier'ı force, slot seviyesi 2'nin üstündeki her seviye +1d8).
 * Hunter's Mark: işaretli hedef 0 HP'ye düştüyse işaret menzildeki yeni hedefe taşınır.
 */
export function executeFollowup(state: BattleState, actor: Combatant, targetId: string, rng: Rng): CommandResult {
  const conc = actor.concentration;
  const spell = spellOf(conc?.spell);
  if (!conc || !spell) return fail('Sürdürülecek bir konsantrasyon büyüsü yok.');
  const target = state.combatants[targetId];
  if (!target) return fail('Hedef bulunamadı.');
  if (target.id === actor.id) return fail('Kendini hedefleyemezsin.');
  if (!isTargetable(target) || target.hp <= 0) return fail('Hedef ayakta değil.');
  if (target.hidden && target.side !== actor.side) return fail(`${target.name} gizlenmiş: hedef alınamaz, önce Ara ile bulunmalı.`);

  if (spell.mechanics.kind === 'mark') {
    const marked = conc.targetId ? state.combatants[conc.targetId] : undefined;
    if (marked && marked.hp > 0) return fail(`İşaret yalnızca işaretli hedef (${marked.name}) 0 HP'ye düşünce taşınır.`);
    const r = checkReach(state, actor, target, spellReach(spell));
    if (!r.ok) return r;
    const events: BattleEvent[] = [{ type: 'concentration_moved', actorId: actor.id, targetId: target.id }];
    return { ok: true, state: applyEvents(state, events), events };
  }

  if (spell.mechanics.lingering !== 'weapon') return fail(`${spell.name} bonus eylemle sürdürülmez.`);
  if (conc.turn === turnKey(state)) return fail(`${spell.name} sonraki turlarda sürdürülür.`);
  if (state.map && conc.pos && target.pos && distance(conc.pos, target.pos) > 5) {
    return fail(`Hedef güce uzak: güç 20 ft uçup yanındakine saldırır (${distance(conc.pos, target.pos)} altıgen).`);
  }
  const m = spell.mechanics;
  const env = getEnvironment(state.environmentId);
  const sources = [
    ...environmentSources(env, `${actor.casterTag} ${spell.name} ${spell.text}`.toLowerCase()),
    ...attackSources({
      attackerConditions: actor.conditions, targetConditions: target.conditions,
      attackerHeight: heightOf(state, target), targetHeight: heightOf(state, target), ranged: false, spell: true,
      targetAsleep: target.asleep === true,
    }),
  ];
  const mode = combineModes(sources);
  const count = 1 + Math.max(0, conc.slotLevel - spell.level);
  const expr = `${count}d8${actor.spellMod >= 0 ? '+' : ''}${actor.spellMod}`;
  const res = resolveAttack(
    { attackBonus: actor.spellAttack ?? 0, targetAc: target.ac, mode, damage: expr, autoCritical: isAutoCritical(target.conditions, false) },
    rng,
  );
  const raw = res.damage?.total ?? 0;
  const adj = res.hit ? adjustDamage(raw, m.damageType, profileOf(target)) : { amount: 0, note: null };
  const bonus = res.hit ? hitExtras(state, actor, target, { mode, critical: res.critical }, rng) : { extras: [] };
  const total = adj.amount + bonus.extras.reduce((n, x) => n + x.applied, 0);
  const fx = damageEffects(target, total, m.damageType ?? '', res.critical, rng);
  const pos = weaponHexNear(state, target, conc.pos);
  const events: BattleEvent[] = [
    ...(pos ? [{ type: 'concentration_moved', actorId: actor.id, pos } as BattleEvent] : []),
    {
      type: 'attack_resolved', actorId: actor.id, targetId: target.id, label: spell.name, mode,
      reasons: sources.map((s) => s.reason), d20: res.d20.rolls, natural: res.d20.kept, total: res.total,
      targetAc: target.ac, hit: res.hit, critical: res.critical, fumble: res.fumble, damageRolls: res.damage?.rolls ?? [],
      rawDamage: raw, appliedDamage: total, damageType: m.damageType ?? '', damageNote: adj.note,
      targetHpAfter: fx.hpAfter, effects: fx.effects, ...(bonus.extras.length > 0 ? { extra: bonus.extras } : {}),
    },
  ];
  return finish(state, events);
}

export { withPos };
