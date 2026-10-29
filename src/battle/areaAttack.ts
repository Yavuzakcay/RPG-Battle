/**
 * Alan etkileri (Görev R4; SRD 5.2.1 "Area of Effect"): alan büyüleri, canavar nefesleri ve koni/çizgi saldırıları,
 * Dragonborn Breath Weapon ve Draconic Spirit'in nefesi aynı yoldan geçer.
 *
 * - `pickArea`: alanın altıgenleri (rules/area.ts), noktanın menzil ve görüş denetimi, alandaki yaratıklar (dost ateşi:
 *   `targets: all` alandaki herkes, `enemies` yalnızca düşmanlar) ve çıkıştan tam siper arkasında kalanların çıkarılması.
 * - `areaSaveEvents`: hasar bir kez atılır (SRD: bütün hedefler için aynı zar), her hedef ayrı save yapar (elle zarda
 *   her hedef için ayrı istek), başarıda yarım hasar; hasar alanın tepkisi (Hellish Rebuke) her hedeften sonra.
 */
import { saveDamage } from './classTraits';
import type { AreaSpec } from '../rules/area';
import { areaHexes } from '../rules/area';
import type { AttackArea } from '../rules/areaParse';
import { resolveSave } from '../rules/attack';
import { autoFailsStrDexSave } from '../rules/conditions';
import { adjustDamage, halfDamage } from '../rules/damage';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { distance, isInside, sameHex, type Offset } from '../rules/hex';
import { combineModes, environmentSources, invertMode } from '../rules/modes';
import { getEnvironment } from '../data';
import type { Cover } from '../map/terrain';
import { fail, finish, isTargetable, type CommandResult, type Failure, damageProfile, isIntangible } from './common';
import { coverFrom, sightBlockedBetween } from './cover';
import { damageEffects } from './damage-effects';
import { attackEffect, saveMode, timedCondition } from './durations';
import { saveDice } from './effectDice';
import { riderConditionEvents } from './grapple';
import { hexLabel, terrainAt } from './movement';
import { damagedReactions } from './reactions';
import { applyEvents } from './reduce';
import { riderOf } from './riders';
import type { BattleEvent, BattleState, Combatant } from './types';

export type AreaTargetSpec = AreaSpec & { targets: 'all' | 'enemies' };

export interface AreaPick {
  hexes: Offset[];
  /** Siper ve görüşün hesaplandığı çıkış (noktadan çıkan alanda nokta, diğerlerinde yaratığın altıgeni). */
  origin: Offset;
  reached: Array<{ c: Combatant; cover: Cover }>;
}

const sizeOf = (state: BattleState) => ({ cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 });

/**
 * Alanın kapladığı altıgenler ve etkilenenler. `aim`: noktadan çıkan alanda merkez, yaratıktan çıkanda yön (yaratığın
 * kendi altıgeni olamaz); yayılımda kullanılmaz. `rangeFt`: noktanın en çok uzaklığı.
 */
export function pickArea(state: BattleState, actor: Combatant, spec: AreaTargetSpec, rangeFt: number, aim: Offset | null, what = 'alan etkisi'): AreaPick | Failure {
  if (!state.map || !actor.pos) return fail('Alan etkisi yalnızca haritalı savaşta.');
  const size = sizeOf(state);
  if (spec.shape !== 'emanation') {
    if (!aim) return fail('Hedef altıgen seçmelisin.');
    // Yaratıktan çıkan alanda nişan yalnızca yön verir: harita dışında olabilir (yön okları; Görev R4).
    if (spec.origin === 'point' && !isInside(aim, size)) return fail('Hedef altıgen harita dışında.');
    if (spec.origin === 'self' && sameHex(aim, actor.pos)) return fail('Yön için başka bir altıgen seçmelisin.');
  }
  if (spec.origin === 'point' && aim) {
    const d = distance(actor.pos, aim);
    if (d * 5 > rangeFt) return fail(`Nokta menzil dışında: ${d} altıgen (${d * 5} ft), menzil ${rangeFt} ft.`);
    const t = terrainAt(state, aim);
    if (t.blocksSight || t.outOfBounds) return fail(`${hexLabel(aim)} noktasına ${what} yapılamaz (${t.name}).`);
    const wall = sightBlockedBetween(state, actor.pos, aim);
    if (wall) return fail(`Nokta görülemiyor: arada ${wall} var.`);
  }
  const origin = spec.origin === 'point' && aim ? aim : actor.pos;
  const hexes = areaHexes(spec, actor.pos, aim, size);
  const inArea = (c: Combatant) => c.pos !== null && hexes.some((h) => sameHex(h, c.pos as Offset));
  const reached = Object.values(state.combatants)
    .filter((c) => isTargetable(c) && !isIntangible(c) && inArea(c) && (spec.targets === 'all' || c.side !== actor.side))
    .map((c) => ({ c, lof: coverFrom(state, origin, c, [actor.id]) }))
    .filter((x) => !x.lof.blocked)
    .map((x) => ({ c: x.c, cover: x.lof.cover }));
  return { hexes, origin, reached };
}

/** Alanlı save etkisinin verisi (büyü dışı: canavar nefesi, Dragonborn, Draconic Spirit). */
export interface AreaSave {
  label: string;
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  dc: number;
  damageDice?: string;
  damageType?: string;
  halfOnSave: boolean;
  /** Canavar saldırısı: süreli etki ve rider durumları (save başarısızsa; data/condition-effects.json, attack-riders.json). */
  monster?: { attackName: string };
}

const profileOf = damageProfile;

/** Alandaki her hedefin save'i ve hasarı (hasar bir kez atılır); `area_used` olayıyla başlar. */
export function areaSaveEvents(state: BattleState, actor: Combatant, pick: AreaPick, spec: AreaTargetSpec, save: AreaSave, rng: Rng,
  aim: Offset | null): BattleEvent[] {
  const env = getEnvironment(state.environmentId);
  const reasons = environmentSources(env, `${actor.casterTag} ${save.label}`.toLowerCase());
  const mode = invertMode(combineModes(reasons));
  const events: BattleEvent[] = [{
    type: 'area_used', actorId: actor.id, label: save.label, shape: spec.shape, sizeFt: spec.sizeFt,
    ...(spec.widthFt && spec.widthFt !== 5 ? { widthFt: spec.widthFt } : {}),
    ...(aim ? { aim } : {}), hexes: pick.hexes, targetIds: pick.reached.map((x) => x.c.id),
  }];
  const damage = save.damageDice && pick.reached.length > 0
    ? rollDice(save.damageDice, rollTag(rng, { kind: 'damage', by: actor.id })) : { rolls: [] as number[], total: 0 };
  let current = applyEvents(state, events);
  for (const { c, cover } of pick.reached) {
    const t = current.combatants[c.id];
    if (!t || !isTargetable(t)) continue;
    const autoFail = (save.ability === 'str' || save.ability === 'dex') && autoFailsStrDexSave(t.conditions);
    const dexCover = save.ability === 'dex' ? cover : 0;
    const r = resolveSave({ extra: saveDice(t), modifier: t.saves[save.ability] + dexCover, dc: save.dc, mode: saveMode(mode, t, save.ability), autoFail },
      rollTag(rng, { by: t.id }));
    const amount = saveDamage(t, save.ability, r.success, damage.total, !!save.halfOnSave);
    const adj = amount > 0 ? adjustDamage(amount, save.damageType, profileOf(t)) : { amount: 0, note: null };
    const fx = damageEffects(t, adj.amount, save.damageType ?? '', false, rng);
    const ev: BattleEvent = {
      type: 'save_resolved', actorId: actor.id, targetId: t.id, label: save.label,
      ability: save.ability, dc: save.dc, mode, reasons: reasons.map((x) => x.reason),
      d20: r.d20?.rolls ?? [], natural: r.d20?.kept ?? null, total: r.total, success: r.success,
      damageRolls: damage.rolls, rawDamage: damage.total, appliedDamage: adj.amount, damageType: save.damageType ?? '',
      damageNote: adj.note, targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: [],
      ...(dexCover === 2 || dexCover === 5 ? { cover: dexCover } : {}),
      ...(r.extra ? { bonusDice: r.extra } : {}),
    };
    const local: BattleEvent[] = [ev];
    if (save.monster && !r.success) {
      // Canavar saldırısının süreli etkisi ve rider durumları (save başarısızsa; tek hedefli yolla aynı).
      const effect = attackEffect(actor.monsterId, save.monster.attackName);
      if (effect && fx.hpAfter > 0) local.push(timedCondition(current, t.id, effect, actor.id, `${actor.name}: ${save.label}`));
      local.push(...riderConditionEvents(current, actor, { ...t, hp: fx.hpAfter }, riderOf(actor.monsterId, save.monster.attackName), save.monster.attackName, rng));
    }
    events.push(...local);
    current = applyEvents(current, local);
    // Hasar alanın tepkisi (Hellish Rebuke; Görev R1).
    if (adj.amount > 0) {
      const back = damagedReactions(current, t.id, actor.id, rng);
      events.push(...back);
      current = applyEvents(current, back);
    }
  }
  return events;
}

/** Canavarın alanlı saldırısının verisi. */
export function monsterAreaOf(actor: Combatant, index: number): { spec: AttackArea; save: AreaSave } | null {
  const atk = actor.attacks[index];
  if (!atk?.area || !atk.save) return null;
  return {
    spec: atk.area,
    save: { label: atk.name, ability: atk.save.ability, dc: atk.save.dc, halfOnSave: atk.save.halfOnSave,
      ...(atk.damageDice ? { damageDice: atk.damageDice } : {}), ...(atk.damageType ? { damageType: atk.damageType } : {}),
      monster: { attackName: atk.name } },
  };
}

/**
 * Canavarın alanlı saldırısı (nefes, koni, çizgi, yayılım…). `aim` verilmezse `targetId`'nin altıgeni; `targetId`
 * verildiyse alanda olmalı. Recharge harcanır.
 */
export function monsterAreaEvents(state: BattleState, actor: Combatant, index: number, aim: Offset | null, targetId: string | null,
  rng: Rng): { ok: true; events: BattleEvent[] } | Failure {
  const area = monsterAreaOf(actor, index);
  const atk = actor.attacks[index];
  if (!area || !atk) return fail('Bu saldırının alanı yok.');
  if (atk.recharge && actor.rechargeUsed.includes(index)) return fail(`${atk.name} henüz şarj olmadı.`);
  const target = targetId ? state.combatants[targetId] : undefined;
  const pick = pickArea(state, actor, area.spec, area.spec.rangeFt ?? 0, aim ?? target?.pos ?? null);
  if ('ok' in pick) return pick;
  if (target && !pick.reached.some((x) => x.c.id === target.id)) return fail(`${target.name} alanın dışında ya da tam siper arkasında.`);
  const events = areaSaveEvents(state, actor, pick, area.spec, area.save, rng, aim ?? target?.pos ?? null);
  if (atk.recharge) events.push({ type: 'recharge_used', actorId: actor.id, attackIndex: index });
  return { ok: true, events };
}

export function executeMonsterArea(state: BattleState, actor: Combatant, index: number, aim: Offset | null, targetId: string | null, rng: Rng): CommandResult {
  const r = monsterAreaEvents(state, actor, index, aim, targetId, rng);
  return r.ok ? finish(state, r.events) : r;
}

/**
 * Yapay zekâ (Görev R4): alanın en iyi hedef altıgeni. Yaratıktan çıkan koni/çizgide alanın boyu kadar uzaklıktaki her
 * altıgen yön olarak denenir. Noktadan çıkan alanda (küre, küp) varsayılan olarak yalnızca görünen düşmanların
 * altıgenleri denenir (eski davranış); `anyPoint: true` menzildeki her altıgeni dener ("akıllı hedefleme"; kapalı:
 * partinin Fireball'unu denge dışı güçlendirdi, Kale 5. seviye %80 → %97; DECISIONS.md). En çok görünen düşmanı
 * kapsayan, dost (kendi tarafı, masumlar) vurmayan seçilir; eşitlikte daha az altıgen, sonra sabit sıra. Dost vurmayan
 * yoksa en iyi skor (düşman − 2 × dost) ile döner (çağıran karar verir).
 */
export function bestAim(state: BattleState, actor: Combatant, spec: AreaTargetSpec, rangeFt: number,
  sees: (c: Combatant) => boolean = () => true, opts: { anyPoint?: boolean } = {}): { aim: Offset | null; foes: number; allies: number } | null {
  if (!state.map || !actor.pos) return null;
  const size = sizeOf(state);
  const count = (pick: AreaPick) => {
    let foes = 0;
    let allies = 0;
    for (const { c } of pick.reached) {
      if (c.side === actor.side || c.civilian) allies += c.id === actor.id ? 0 : 1;
      else if (c.hp > 0 && sees(c)) foes += 1;
    }
    return { foes, allies };
  };
  if (spec.shape === 'emanation') {
    const pick = pickArea(state, actor, spec, rangeFt, null);
    return 'ok' in pick ? null : { aim: null, ...count(pick) };
  }
  let best: { aim: Offset; foes: number; allies: number; n: number } | null = null;
  const foeHexes = spec.origin === 'point' && !opts.anyPoint
    ? new Set(Object.values(state.combatants).filter((c) => c.pos && c.side !== actor.side && !c.civilian && c.hp > 0 && sees(c))
      .map((c) => `${(c.pos as Offset).col},${(c.pos as Offset).row}`))
    : null;
  for (let row = 0; row < size.rows; row++) {
    for (let col = 0; col < size.cols; col++) {
      const aim = { col, row };
      if (foeHexes && !foeHexes.has(`${col},${row}`)) continue;
      if (sameHex(aim, actor.pos)) continue;
      if (spec.origin === 'point' && distance(actor.pos, aim) * 5 > rangeFt) continue;
      // Yaratıktan çıkan alanda yön için yalnızca alanın boyu kadar uzaklıktaki (ya da kenardaki) altıgenler yeter.
      if (spec.origin === 'self' && distance(actor.pos, aim) > Math.max(1, Math.floor(spec.sizeFt / 5))) continue;
      const pick = pickArea(state, actor, spec, rangeFt, aim);
      if ('ok' in pick) continue;
      const c = count(pick);
      const score = (x: { foes: number; allies: number }) => (x.allies === 0 ? 1000 : 0) + x.foes * 10 - x.allies * 20;
      if (!best || score(c) > score(best) || (score(c) === score(best) && pick.hexes.length < best.n)) best = { aim, ...c, n: pick.hexes.length };
    }
  }
  return best ? { aim: best.aim, foes: best.foes, allies: best.allies } : null;
}

/**
 * Dragonborn Breath Weapon (Görev R4; SRD 5.2.1 tür özelliği): Attack eyleminin bir saldırısının yerine (ekonomi
 * `economy.ts`), 15 ft koni ya da 30 ft × 5 ft çizgi, DEX save (DC 8 + CON + yetkinlik), başarıda yarım hasar; kullanım
 * kaynaktan (yetkinlik bonusu kadar, uzun dinlenmede dolar).
 */
export function executeBreathWeapon(state: BattleState, actor: Combatant, shape: 'cone' | 'line', aim: Offset, rng: Rng): CommandResult {
  const b = actor.breath;
  if (!b) return fail('Bu karakterin nefes silahı yok.');
  const left = actor.resources[b.resource] ?? 0;
  if (left <= 0) return fail('Breath Weapon kullanımı kalmadı (uzun dinlenmede dolar).');
  const s = b.shapes.find((x) => x.shape === shape);
  if (!s) return fail(`Bu şekil yok: ${shape}.`);
  const spec: AreaTargetSpec = { shape: s.shape, sizeFt: s.sizeFt, origin: 'self', targets: 'all', ...(s.widthFt ? { widthFt: s.widthFt } : {}) };
  const pick = pickArea(state, actor, spec, 0, aim);
  if ('ok' in pick) return pick;
  const used: BattleEvent = { type: 'feature_used', actorId: actor.id, feature: b.resource, remaining: left - 1 };
  const events = [used, ...areaSaveEvents(applyEvents(state, [used]), actor, pick, spec,
    { label: 'Breath Weapon', ability: b.save, dc: b.dc, damageDice: b.dice, damageType: b.damageType, halfOnSave: true }, rng, aim)];
  return finish(state, events);
}
