/** Canavar saldırıları: şablondan gelen saldırılar, nefes (save), Recharge ve Multiattack. */
import { attackDice, saveDice } from './effectDice';
import { attackEffect, saveMode, timedCondition } from './durations';
import { riderConditionEvents } from './grapple';
import { riderExtras, riderOf, riderReplace } from './riders';
import { getEnvironment } from '../data';
import { extrasTotal, resolveAttack, resolveSave, rollExtras, type RolledExtra } from '../rules/attack';
import { attackSources, autoFailsStrDexSave, isAutoCritical } from '../rules/conditions';
import { adjustDamage, halfDamage } from '../rules/damage';
import { rollD20, rollDice, rollTag, type Rng } from '../rules/dice';
import { markSources } from './mastery';
import { combineModes, environmentSources, invertMode, underwaterSources } from '../rules/modes';
import { damageEffects } from './damage-effects';
import { fail, finish, isTargetable, type CommandResult, type Failure } from './common';
import { applyEvents } from './reduce';
import { checkReach, monsterAttackReach } from './range';
import { heightOf } from './cover';
import { isUnderwater } from './maprules';
import { distance, type Offset } from '../rules/hex';
import { executeMonsterArea, monsterAreaEvents } from './areaAttack';
import type { BattleEvent, BattleState, Combatant } from './types';
import { effectiveAc, wardSources } from './divine';
import { afterAttackReactions, hitReactions, type HitOutcome } from './reactions';

const profileOf = (t: Combatant) => ({
  resistances: t.resistances,
  immunities: t.immunities,
  vulnerabilities: t.vulnerabilities,
});

/** Tek bir canavar saldırısını çözer ve olaylarını döndürür. */
export function monsterAttackEvents(
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  index: number,
  rng: Rng,
): { ok: true; events: BattleEvent[] } | Failure {
  const atk = actor.attacks[index];
  if (!atk) return fail('Böyle bir saldırı yok.');
  if (atk.recharge && actor.rechargeUsed.includes(index)) return fail(`${atk.name} henüz şarj olmadı.`);
  const inReach = checkReach(state, actor, target, monsterAttackReach(atk));
  if (!inReach.ok) return { ok: false, error: `${atk.name}: ${inReach.error}` };

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
      { extra: saveDice(target), modifier: target.saves[atk.save.ability] + dexCover, dc: atk.save.dc, mode: saveMode(mode, target, atk.save.ability), autoFail },
      rollTag(rng, { by: target.id }),
    );
    const raw = atk.damageDice ? rollDice(atk.damageDice, rollTag(rng, { kind: 'damage', by: actor.id })) : { rolls: [] as number[], total: 0 };
    const amount = !save.success ? raw.total : atk.save.halfOnSave ? halfDamage(raw.total) : 0;
    const adj = amount > 0 ? adjustDamage(amount, atk.damageType, profileOf(target)) : { amount: 0, note: null };
    const fx = damageEffects(target, adj.amount, atk.damageType ?? '', false, rng);
    events.push({
      type: 'save_resolved', actorId: actor.id, targetId: target.id, label: atk.name,
      ability: atk.save.ability, dc: atk.save.dc, mode, reasons: reasons.map((r) => r.reason),
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: raw.rolls, rawDamage: raw.total, appliedDamage: adj.amount, damageType: atk.damageType ?? '',
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
  } else {
    const allyAlive = Object.values(state.combatants).some(
      (c) => c.id !== actor.id && c.side === actor.side && c.hp > 0,
    );
    const beyond = !!atk.range && !!actor.pos && !!target.pos && distance(actor.pos, target.pos) * 5 > atk.range[0];
    const water = isUnderwater(state, actor) ? underwaterSources(atk.ranged, atk.damageType, beyond) : { sources: [], autoMiss: false };
    const sources = [
      ...environmentSources(env, tag, { weapon: true, ranged: atk.ranged }),
      ...attackSources({
        attackerConditions: actor.conditions, targetConditions: target.conditions, attackerSide: actor.side,
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
    // Hedefin korumaları (Shield of Faith AC, Shining Smite, Protection from Evil and Good; Görev P-Paladin).
    sources.push(...wardSources(state, actor, target));
    const mode = combineModes(sources);
    const targetAc = effectiveAc(state, target) + inReach.cover;
    // Ek etkiler (rider, data/attack-riders.json): koşulu tutarsa hasar ifadesi değişir (Bloodied sürü, avantajlı Chimera).
    const spec = riderOf(actor.monsterId, atk.name);
    const swap = riderReplace(spec, mode, actor, target);
    const dmgDice = swap?.dice ?? atk.damageDice;
    const dmgType = swap?.type ?? atk.damageType;
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
        { attackBonus: atk.bonus, targetAc, mode, damage: dmgDice as string, autoCritical: isAutoCritical(target.conditions, atk.ranged), extra: attackDice(actor) },
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
    if (water.autoMiss) { hit = false; critical = false; rolls = []; raw = 0; }
    const adj = hit && raw > 0 ? adjustDamage(raw, dmgType, profileOf(target)) : { amount: 0, note: null };
    // İsabette ek hasarlar (her zaman olanlar ve koşulu tutanlar); kritikte zarlar ikiye katlanır.
    let extras = hit ? riderExtras(spec, { mode, critical, actor, target }, rollTag(rng, { kind: 'damage', by: actor.id })) : [];
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
      ...(atk.rider && hit ? { rider: atk.rider } : {}),
      ...(inReach.cover ? { cover: inReach.cover } : {}),
      ...(hr?.deflected ? { deflected: hr.deflected } : {}),
      ...(hr?.reacted ? { reacted: hr.reacted } : {}),
      ...(bonusDice?.length ? { bonusDice } : {}),
    });
    // Süreli etki (Wyvern zehri, Ghoul felci…): isabette, varsa hedefin kurtarma zarından sonra.
    const effect = attackEffect(actor.monsterId, atk.name);
    if (effect && hit && fx.hpAfter > 0) {
      let failed = true;
      if (effect.save) {
        const ab = effect.save.ability;
        const r = resolveSave({ extra: saveDice(target), modifier: target.saves[ab], dc: effect.save.dc, mode: saveMode('normal', target, ab),
          autoFail: (ab === 'str' || ab === 'dex') && autoFailsStrDexSave(target.conditions) }, rollTag(rng, { by: target.id }));
        events.push({ type: 'condition_save', targetId: target.id, condition: effect.condition ?? '', ability: ab, dc: effect.save.dc,
          d20: r.d20?.rolls ?? [], total: r.total ?? 0, success: r.success, ...(r.extra ? { bonusDice: r.extra } : {}) });
        failed = !r.success;
      }
      if (failed) events.push(timedCondition(state, target.id, effect, actor.id, `${actor.name}: ${atk.name}`));
    }
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
export function executeMultiattack(state: BattleState, actor: Combatant, targetId: string, rng: Rng): CommandResult {
  if (!actor.multiattack) return fail('Bu yaratığın Multiattack\'ı yok.');
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
      if (!r.ok) return r;
      events.push(...r.events);
      current = applyEvents(current, r.events);
    }
  }
  if (events.length === 0) return fail('Yapılacak saldırı yok.');
  return finish(state, events);
}
