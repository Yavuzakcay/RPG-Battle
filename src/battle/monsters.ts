/** Canavar saldırıları: şablondan gelen saldırılar, nefes (save), Recharge ve Multiattack. */
import { globalRule } from './ruleControl';
import { nonmagicalProfile } from './magicStrike';
import { ruleVersion } from './ruleVersion';
import { profileIn } from './zones';
import { sightConditions } from './sight';
import { attackDice, saveDice } from './effectDice';
import { attackEffect, saveMode, timedCondition } from './durations';
import { attackEffectEvents, riderConditionEvents } from './grapple';
import { riderExtras, riderOf, riderReplace } from './riders';
import { drainEvents } from './drain';
import { getEnvironment } from '../data';
import { extrasTotal, resolveAttack, resolveSave, rollExtras, type RolledExtra } from '../rules/attack';
import { attackSources, autoFailsStrDexSave, isAutoCritical } from '../rules/conditions';
import { adjustDamage, halfDamage } from '../rules/damage';
import { rollD20, rollDice, rollTag, type Rng } from '../rules/dice';
import { markSources } from './mastery';
import { combineModes, environmentSources, invertMode, underwaterSources } from '../rules/modes';
import { damageEffects } from './damage-effects';
import { fail, finish, isTargetable, withinFiveFt, type CommandResult, type Failure, damageProfile } from './common';
import { afterAttackMarks, elusiveFilter, saveDamage, traitSources } from './classTraits';
import { applyEvents } from './reduce';
import { damagePenalty } from './effects';
import { checkReach, monsterAttackReach } from './range';
import { heightOf } from './cover';
import { isUnderwater } from './maprules';
import { distance, type Offset } from '../rules/hex';
import { executeMonsterArea, monsterAreaEvents } from './areaAttack';
import type { BattleEvent, BattleState, Combatant, MultiStep } from './types';
import multiData from '../../data/multiattack.json';
import { a2AreaDamage, withA2Extras } from './ridersA2';
import { castWithoutAction } from './castHook';
import { effectiveAc, wardSources } from './divine';
import { afterAttackReactions, corrodeEvents, hitReactions, targetedHookReactions, targetedReactions, type HitOutcome } from './reactions';


/** Tek bir canavar saldırısını çözer ve olaylarını döndürür. */
export function monsterAttackEvents(
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  index: number,
  rng: Rng,
  opportunity = false,
): { ok: true; events: BattleEvent[] } | Failure {
  const atk = actor.attacks[index];
  if (!atk) return fail('Böyle bir saldırı yok.');
  if (atk.recharge && actor.rechargeUsed.includes(index)) return fail(`${atk.name} henüz şarj olmadı.`);
  const inReach = checkReach(state, actor, target, monsterAttackReach(atk));
  if (!inReach.ok) return { ok: false, error: `${atk.name}: ${inReach.error}` };
  // Kuyruk 19 (srdK19): Rust Monster Antennae: metal silah aşınması (DEX save; `reactions.ts` `corrodeEvents`).
  if (globalRule(state, 'srdK19') && actor.monsterId === 'rust-monster' && atk.name === 'Antennae') {
    return { ok: true, events: corrodeEvents(actor, target, atk.save?.dc ?? 11, rng) };
  }
  // Kuyruk 19 (srdK19): Redirect Attack canavar saldırı zarlarında da (yer değiştiren dosta gider).
  if (!atk.save && !opportunity) {
    const tr = globalRule(state, 'srdK19') ? targetedReactions(state, actor, target, rng) : targetedHookReactions(state, actor, target, rng);
    const other = tr.targetId !== target.id ? applyEvents(state, tr.events) : null;
    const next = other?.combatants[tr.targetId];
    if (other && next) {
      const r = monsterAttackEvents(other, other.combatants[actor.id] as Combatant, next, index, rng, opportunity);
      return r.ok ? { ok: true, events: [...tr.events, ...r.events] } : r;
    }
    // Kuyruk P10 (sürüm 39): yer değiştirmeyen hedef alınma tepkisinin olayları (ek paket `avantajSifirla`) saldırıdan önce uygulanır.
    if (!other && tr.events.length && ruleVersion(state) >= 39) {
      const s2 = applyEvents(state, tr.events);
      const r = monsterAttackEvents(s2, s2.combatants[actor.id] as Combatant, s2.combatants[target.id] as Combatant, index, rng, opportunity);
      return r.ok ? { ok: true, events: [...tr.events, ...r.events] } : r;
    }
  }

  const env = getEnvironment(state.environmentId);
  const tag = `${actor.casterTag} ${atk.name} ${atk.text}`.toLowerCase();
  const events: BattleEvent[] = [];
  let hr: HitOutcome | null = null;
  let melee = !atk.ranged;
  let damageType = atk.damageType ?? '';

  if (atk.save) {
    // Nefes gibi: hedef save yapar, başarılıysa hasar yarıya iner (veya hiç olmaz).
    const reasons = environmentSources(env, tag);
    const mode = invertMode(combineModes(reasons));
    const autoFail =
      (atk.save.ability === 'str' || atk.save.ability === 'dex') && autoFailsStrDexSave(target.conditions);
    const dexCover = atk.save.ability === 'dex' ? inReach.cover : 0;
    const save = resolveSave(
      { extra: saveDice(target, atk.save.ability), modifier: target.saves[atk.save.ability] + dexCover, dc: atk.save.dc, mode: saveMode(mode, target, atk.save.ability, actor), autoFail },
      rollTag(rng, { by: target.id }),
    );
    // Kuyruk A2 (sürüm 30+): hasarsız save saldırısına veriden hasar (Yarı-Ejderha nefesi).
    const a2d = !atk.damageDice ? a2AreaDamage(state, actor.monsterId, atk.name) : undefined;
    const sDice = atk.damageDice ?? a2d?.dice;
    const sType = atk.damageType ?? a2d?.type;
    const raw = sDice ? rollDice(sDice, rollTag(rng, { kind: 'damage', by: actor.id })) : { rolls: [] as number[], total: 0 };
    const amount = saveDamage(target, atk.save.ability, save.success, raw.total, !!atk.save.halfOnSave);
    const adj = amount > 0 ? adjustDamage(amount, sType, profileIn(state, target)) : { amount: 0, note: null };
    const fx = damageEffects(target, adj.amount, sType ?? '', false, rng);
    events.push({
      type: 'save_resolved', actorId: actor.id, targetId: target.id, label: atk.name,
      ability: atk.save.ability, dc: atk.save.dc, mode, reasons: reasons.map((r) => r.reason),
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: raw.rolls, rawDamage: raw.total, appliedDamage: adj.amount, damageType: sType ?? '',
      damageNote: adj.note, targetHpAfter: fx.hpAfter, conditionsAdded: [], effects: fx.effects,
      ...(atk.rider ? { rider: atk.rider } : {}),
      ...(dexCover ? { cover: dexCover } : {}),
      ...(save.extra ? { bonusDice: save.extra } : {}),
    });
    // Süreli etki (Dreadful Glare, Stunning Screech…): save başarısızsa durum.
    const effect = attackEffect(actor.monsterId, atk.name);
    if (effect && !save.success && fx.hpAfter > 0) events.push(timedCondition(state, target.id, effect, actor.id, `${actor.name}: ${atk.name}`));
    // Rider durum etkileri (Prone, yakalama, süreli durumlar; attack-riders.json): save başarısızsa.
    if (!save.success) events.push(...riderConditionEvents(state, actor, { ...target, hp: fx.hpAfter }, riderOf(actor.monsterId, atk.name), atk.name, rng));
    // Kuyruk 19: kalıcı azalmalar (Life Drain save başarısızsa).
    if (!save.success) events.push(...drainEvents(state, actor, target, riderOf(actor.monsterId, atk.name), adj.amount, atk.damageType ?? '', [], atk.name, rng));
  } else {
    const allyAlive = Object.values(state.combatants).some(
      (c) => c.id !== actor.id && c.side === actor.side && c.hp > 0,
    );
    const beyond = !!atk.range && !!actor.pos && !!target.pos && distance(actor.pos, target.pos) * 5 > atk.range[0];
    const water = isUnderwater(state, actor) ? underwaterSources(atk.ranged, atk.damageType, beyond) : { sources: [], autoMiss: false };
    const sources = [
      ...environmentSources(env, tag, { weapon: true, ranged: atk.ranged }),
      ...attackSources({
        ...sightConditions(actor, target, state, !atk.ranged), attackerSide: actor.side,
        attackerHeight: heightOf(state, actor), targetHeight: heightOf(state, target), ranged: atk.ranged, spell: false,
        packTactics: actor.packTactics && allyAlive, targetAsleep: target.asleep === true,
      }),
      ...inReach.sources,
      ...water.sources,
    ];
    // Silah ustalığı işareti (Sap): bir sonraki saldırı zarı dezavantajlı, kullanılınca kalkar.
    const marks = markSources(actor, target);
    sources.push(...marks.sources);
    events.push(...marks.used);
    // Görev F: Escape the Horde (fırsat saldırısı dezavantajlı); Elusive hedefe avantaj yok.
    sources.push(...traitSources(state, actor, target, { opportunity }));
    // Hedefin korumaları (Shield of Faith AC, Shining Smite, Protection from Evil and Good; Görev P-Paladin).
    sources.push(...wardSources(state, actor, target, { melee: !atk.ranged }));
    const kept = [...elusiveFilter(target, sources)];
    sources.length = 0;
    sources.push(...kept);
    const mode = combineModes(sources);
    const k19i = !!globalRule(state, 'srdK19');
    const targetAc = effectiveAc(state, target) + inReach.cover + (atk.ranged && k19i ? Math.max(0, ...(target.effects ?? []).map((e) => e.acRanged ?? 0)) : 0);
    // Ek etkiler (rider, data/attack-riders.json): koşulu tutarsa hasar ifadesi değişir (Bloodied sürü, avantajlı Chimera).
    // Kuyruk A2 (sürüm 30+): veriden ek hasar (Kültist +1 nekrotik, Yarı-Ejderha pençesi).
    const spec = withA2Extras(state, riderOf(actor.monsterId, atk.name), actor.monsterId, atk.name);
    const swap = riderReplace(spec, mode, actor, target);
    const dmgDice = swap?.dice ?? atk.damageDice;
    const dmgType0 = swap?.type ?? atk.damageType;
    // Kuyruk 19: Investment of the Chain Master: BPS hasarı Necrotic ya da Radiant (hedefe en çok işleyen).
    const dmgType = actor.chainDamage && ['bludgeoning', 'piercing', 'slashing'].includes(dmgType0 ?? '')
      ? (['radiant', 'necrotic'] as const).reduce((a, b) => (adjustDamage(10, b, profileIn(state, target)).amount > adjustDamage(10, a, profileIn(state, target)).amount ? b : a), 'radiant' as string)
      : dmgType0;
    let d20: number[];
    let natural: number;
    let total: number;
    let hit: boolean;
    let critical: boolean;
    let fumble: boolean;
    let rolls: number[] = [];
    let raw = 0;
    let bonusDice: RolledExtra[] | undefined;
    if (atk.damageDice) {
      const res = resolveAttack(
        { attackBonus: atk.bonus, targetAc, mode, ...(k19i && target.effects?.some((e) => e.noCrit) ? { noCrit: true } : {}), damage: dmgDice as string, autoCritical: isAutoCritical(target.conditions, withinFiveFt(state, actor, target, !atk.ranged)), extra: attackDice(actor) },
        rollTag(rng, { by: actor.id }),
      );
      d20 = res.d20.rolls; natural = res.d20.kept; total = res.total; hit = res.hit; bonusDice = res.extra;
      critical = res.critical; fumble = res.fumble; rolls = res.damage?.rolls ?? []; raw = res.damage?.total ?? 0;
    } else {
      // Hasar zarı olmayan saldırı (Web gibi): yalnızca isabet belirlenir, etkisi elle uygulanır.
      const r = rollD20(mode, rollTag(rng, { kind: 'attack', by: actor.id, bonus: atk.bonus }));
      bonusDice = rollExtras(attackDice(actor), 'attack', rollTag(rng, { by: actor.id }));
      d20 = r.rolls; natural = r.kept; total = natural + atk.bonus + extrasTotal(bonusDice); fumble = natural === 1;
      hit = natural === 20 || (!fumble && total >= targetAc); critical = natural === 20;
    }
    // Su altında menzilli silahla normal menzil ötesine atış otomatik ıskalar (SRD 5.2.1).
    // CILA: rüzgâr duvarından geçen menzilli saldırı da otomatik ıskalar.
    if (water.autoMiss || inReach.autoMiss) { hit = false; critical = false; rolls = []; raw = 0; }
    // Görev B1: saldıranın hasar cezası (Ray of Enfeeblement; Reduce yalnızca silahta: canavar saldırısı silah sayılır).
    const penalty = hit && raw > 0 ? damagePenalty(actor, raw, true, rng) : null;
    if (penalty) raw = penalty.total;
    const adj = hit && raw > 0 ? adjustDamage(raw, dmgType, nonmagicalProfile(actor, target, dmgType, profileIn(state, target))) : { amount: 0, note: null };
    // İsabette ek hasarlar (her zaman olanlar ve koşulu tutanlar); kritikte zarlar ikiye katlanır.
    let extras = hit ? riderExtras(spec, { mode, critical, actor, target }, rollTag(rng, { kind: 'damage', by: actor.id })) : [];
    // Görev P7 (sürüm 34): süren etkinin isabet zarı (`hitDie`: Enlarge, paket çağrı güçlendirmesi) canavar saldırısında da.
    if (hit && ruleVersion(state) >= 34) for (const e of (actor.effects ?? []).filter((x) => x.hitDie)) {
      const d = rollDice(e.hitDie as string, rollTag(rng, { kind: 'damage', by: actor.id }), critical);
      const t = e.hitType ?? dmgType ?? '';
      const a = adjustDamage(d.total, t, nonmagicalProfile(actor, target, t, profileIn(state, target)));
      extras = [...extras, { label: e.name, rolls: d.rolls, raw: d.total, applied: a.amount, type: t, note: a.note }];
    }
    // Hedefin isabet tepkisi (Görev R1): Shield ıskalatabilir; Uncanny Dodge, Deflect Attacks hasarı azaltır.
    hr = hit ? hitReactions(state, {
      attacker: actor, target, label: atk.name, total, ac: targetAc, critical, melee: !atk.ranged, ranged: atk.ranged,
      damage: adj.amount + extras.reduce((n, x) => n + x.applied, 0), damageType: dmgType ?? '',
    }, rng) : null;
    if (hr) events.push(...hr.events);
    if (hr && !hr.hit) { hit = false; critical = false; rolls = []; raw = 0; extras = []; }
    const dealt = hit ? hr?.damage ?? 0 : 0;
    melee = !atk.ranged;
    damageType = dmgType ?? '';
    const fx = damageEffects(target, dealt, dmgType ?? '', critical, rng);
    events.push({
      type: 'attack_resolved', actorId: actor.id, targetId: target.id, label: atk.name, mode,
      reasons: sources.map((s) => s.reason), d20, natural, total, targetAc: hr?.ac ?? targetAc, hit, critical, fumble,
      damageRolls: rolls, rawDamage: raw, appliedDamage: dealt, damageType: dmgType ?? '',
      damageNote: hit ? adj.note : null, targetHpAfter: fx.hpAfter, effects: fx.effects,
      ...(extras.length > 0 ? { extra: extras } : {}),
      ...(hit && penalty?.note ? { penalty: penalty.note } : {}),
      ...(atk.rider && hit ? { rider: atk.rider } : {}),
      ...(inReach.cover ? { cover: inReach.cover } : {}), ...(inReach.autoMiss ? { autoMiss: inReach.autoMiss } : {}),
      ...(hr?.deflected ? { deflected: hr.deflected } : {}),
      ...(hr?.reacted ? { reacted: hr.reacted } : {}),
      ...(bonusDice?.length ? { bonusDice } : {}),
    });
    // Kuyruk 19: kalıcı azalmalar (HP maksimumu, yetenek puanı).
    if (hit) events.push(...drainEvents(state, actor, target, spec, dealt, dmgType ?? '', extras, atk.name, rng));
    // Kuyruk 19: Web Bolt: hız 0, saldıranın sonraki turunun başına dek.
    if (hit && spec?.speedZeroSource) events.push({ type: 'effect_added', targetId: target.id, effect: { id: `web:${actor.id}`, name: atk.name, sourceId: actor.id, speedZero: true, untilSourceTurn: true, until: state.round + 1 } });
    // Görev F: Multiattack Defense işareti (hedefe isabet eden bu tur diğer saldırılarında dezavantajlı).
    events.push(...afterAttackMarks(state, actor, target, hit));
    // Süreli etki (Wyvern zehri, Ghoul felci…): isabette, varsa hedefin kurtarma zarından sonra.
    if (hit) events.push(...attackEffectEvents(state, actor, { ...target, hp: fx.hpAfter }, actor.monsterId, atk.name, rng));
    // Rider durum etkileri (Prone, yakalama, hücum, süreli durumlar; attack-riders.json): isabette.
    if (hit) events.push(...riderConditionEvents(state, actor, { ...target, hp: fx.hpAfter }, spec, atk.name, rng));
  }
  if (atk.recharge) events.push({ type: 'recharge_used', actorId: actor.id, attackIndex: index });
  // Geri yöneltme, karşılık saldırısı ve hasar alanın tepkisi (Görev R1).
  const after = applyEvents(state, events);
  const dealt = target.hp - (after.combatants[target.id]?.hp ?? target.hp);
  events.push(...afterAttackReactions(after, actor.id, target.id, hr, { melee, damageType, dealt }, rng));
  return { ok: true, events };
}

function checkTarget(state: BattleState, actor: Combatant, targetId: string): Combatant | Failure {
  const target = state.combatants[targetId];
  if (!target) return fail('Hedef bulunamadı.');
  if (target.id === actor.id) return fail('Kendine saldıramazsın.');
  if (!isTargetable(target)) return fail('Hedef zaten düşmüş.');
  return target;
}

export function executeMonsterAttack(
  state: BattleState, actor: Combatant, targetId: string, attackIndex: number, rng: Rng, targetHex?: Offset,
): CommandResult {
  // Alanlı saldırı (nefes, koni, çizgi; Görev R4): haritalı savaşta alandaki herkes save yapar.
  if (state.map && actor.attacks[attackIndex]?.area) return executeMonsterArea(state, actor, attackIndex, targetHex ?? null, targetId || null, rng);
  const target = checkTarget(state, actor, targetId);
  if ('ok' in target) return target;
  const r = monsterAttackEvents(state, actor, target, attackIndex, rng);
  if (!r.ok) return r;
  return finish(state, r.events);
}

/** Multiattack: Recharge'sız tüm saldırılar, tekrar sayısı kadar sırayla. Hedef düşerse durur. */
/** Kuyruk 19: SRD Multiattack planı (`data/multiattack.json`, `scripts/k19-multiattack.py`). */
export interface MultiSpec {
  total: number; names?: string[]; max?: Record<string, number>; extra?: string[]; extraTwice?: boolean;
  replace?: Array<{ name?: string; spell?: string; level?: number; cost: number }>; heads?: boolean;
}
export function multiSpecOf(state: BattleState, actor: Combatant): MultiSpec | null {
  if (!actor.monsterId || !globalRule(state, 'srdK19')) return null;
  return ((multiData as Record<string, unknown>)[actor.monsterId] as MultiSpec | undefined) ?? null;
}
/** Hydra: Multiattack'taki ısırık sayısı baş sayısı kadar (Multiple Heads; savaşçıda `heads`). */
export const multiTotal = (spec: MultiSpec, actor: Combatant): number => (spec.heads ? actor.heads ?? spec.total : spec.total);

/** Planın SRD kurallarına uygunluğu (hata metni ya da null). */
export function multiPlanProblem(spec: MultiSpec, actor: Combatant, plan: MultiStep[]): string | null {
  let used = 0;
  const per: Record<string, number> = {};
  const extras: Record<string, number> = {};
  const repl = new Set<string>();
  for (const st of plan) {
    const r = spec.replace?.find((x) => (st.spell && x.spell === st.spell) || (st.attack && x.name === st.attack));
    if (st.attack && spec.names?.includes(st.attack) && !(r && repl.has(st.attack))) {
      per[st.attack] = (per[st.attack] ?? 0) + 1;
      if (spec.max?.[st.attack] !== undefined && per[st.attack]! > spec.max[st.attack]!) return `${st.attack} en çok ${spec.max[st.attack]} kez.`;
      used++;
      continue;
    }
    if (st.attack && spec.extra?.includes(st.attack)) {
      extras[st.attack] = (extras[st.attack] ?? 0) + 1;
      if (Object.values(extras).reduce((t, n) => t + n, 0) > (spec.extraTwice ? 2 : 1)) return 'Ek kullanım hakkı aşıldı.';
      continue;
    }
    if (r) {
      const key = r.spell ?? r.name ?? '';
      if (repl.has(key)) return `${key} bu Multiattack'ta bir kez.`;
      repl.add(key);
      used += r.cost;
      continue;
    }
    return `${st.attack ?? st.spell ?? '?'} bu yaratığın Multiattack'ında yok.`;
  }
  if (used > multiTotal(spec, actor)) return `Multiattack en çok ${multiTotal(spec, actor)} saldırı.`;
  return null;
}

/** Planı adım adım yürütür (her adım ayrı hedef; saldıran düşerse durur). */
function executeMultiPlan(state: BattleState, actor: Combatant, targetId: string, plan: MultiStep[], spec: MultiSpec, rng: Rng): CommandResult {
  const bad = multiPlanProblem(spec, actor, plan);
  if (bad) return fail(bad);
  const events: BattleEvent[] = [];
  let current = state;
  for (const st of plan) {
    const me = current.combatants[actor.id] as Combatant;
    if (me.hp <= 0) break;
    const tId = st.targetId ?? targetId;
    if (st.spell) {
      const r = spec.replace?.find((x) => x.spell === st.spell);
      const evs = castWithoutAction(current, me, st.spell, { ...(st.targetHex ? { targetHex: st.targetHex } : { targetId: tId }) }, rng, { ...(r?.level ? { level: r.level } : {}) });
      if (!evs) return fail(`${st.spell} yapılamadı.`);
      events.push(...evs); current = applyEvents(current, evs);
      continue;
    }
    const i = me.attacks.findIndex((a) => a.name === st.attack);
    const atk = me.attacks[i];
    if (!atk) return fail(`${st.attack} saldırısı yok.`);
    const t = current.combatants[tId];
    if (!atk.area && (!t || !isTargetable(t) || (t.hp <= 0 && !t.regenPending))) continue;
    const r = current.map && atk.area ? monsterAreaEvents(current, me, i, st.targetHex ?? t?.pos ?? null, st.targetHex ? null : tId, rng) : monsterAttackEvents(current, me, t as Combatant, i, rng);
    // K59 (duman bulgusu): önceki adımın sonucu (tepkiyle ışınlanma, itme) hedefi erişim/görüş dışına çıkardıysa bu adım
    // atlanır (ölü hedefteki gibi); eskiden bütün komut reddediliyor, canavar eylemini kaybediyordu. Reddedilen komut olay
    // üretmediği için kayıtlı savaşların baştan oynatılması değişmez.
    if (!r.ok && events.length > 0) continue;
    if (!r.ok) return r;
    events.push(...r.events); current = applyEvents(current, r.events);
  }
  if (events.length === 0) return fail('Yapılacak saldırı yok.');
  return finish(state, events);
}

export function executeMultiattack(state: BattleState, actor: Combatant, targetId: string, rng: Rng, plan?: MultiStep[]): CommandResult {
  if (!actor.multiattack) return fail('Bu yaratığın Multiattack\'ı yok.');
  const spec = plan?.length ? multiSpecOf(state, actor) : null;
  if (spec && plan) return executeMultiPlan(state, actor, targetId, plan, spec, rng);
  const first = checkTarget(state, actor, targetId);
  if ('ok' in first) return first;
  const events: BattleEvent[] = [];
  let current = state;
  for (let i = 0; i < actor.attacks.length; i++) {
    const atk = actor.attacks[i];
    if (!atk || atk.recharge) continue;
    for (let k = 0; k < atk.repeat; k++) {
      const t = current.combatants[targetId];
      // Tepkiyle (Hellish Rebuke, Retaliation) düşen saldıran devam edemez.
      if ((current.combatants[actor.id]?.hp ?? 0) <= 0) break;
      if (!t || !isTargetable(t) || (t.hp <= 0 && !t.regenPending)) break;
      const r = current.map && atk.area
        ? monsterAreaEvents(current, current.combatants[actor.id] as Combatant, i, t.pos, null, rng)
        : monsterAttackEvents(current, current.combatants[actor.id] as Combatant, t, i, rng);
      // K60 (duman bulgusu, plan yolundaki K59 düzeltmesinin eşi): önceki saldırının sonucu hedefi erişim dışına
      // çıkardıysa kalan saldırılar atlanır; bütün komut reddedilmez.
      if (!r.ok && events.length > 0) break;
      if (!r.ok) return r;
      events.push(...r.events);
      current = applyEvents(current, r.events);
    }
  }
  if (events.length === 0) return fail('Yapılacak saldırı yok.');
  return finish(state, events);
}
