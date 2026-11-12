/**
 * Kuyruk A2: canavar saldırı eklerinin bağlanması (yalnız veri bağlama; yeni mekanik yok). Kural sürümü 30+ (`ridersA2On`);
 * eski kayıt ve replay eski davranışla oynar. Veri `data/canavar-ekleri-a2.json` (anahtar `<canavar>:<saldırı>`).
 * Mevcut sistemlere bağlanır: süreli durum sayacı (`makeTimer`: saveEnds, escalate, wakeOnDamage, dot), K53 zorla hareket
 * (`forcedMove`, çarpma ev kuralı `carpmaHasari` kendiliğinden), süren etkiler (`slowed`, `noReactions`, `speedMult`,
 * `speedFt`, `damagePenalty`, `repeatSave`, `grants`, `sourceTurnDamage`, `ongoing`, `noHeal`, `firstRoll`…), yutma yolu
 * (`swallowedBy`, monsterAbilities.ts) ve Corrosive Form cezası (`corroded`). Çağrı yeri `riderConditionEvents` (isabet,
 * tek hedefli save ve alan save'i yolları) ve hasar eklentisi için `withA2Extras`/`a2AreaDamage`. Saf.
 */
import data from '../../data/canavar-ekleri-a2.json';
import type { Ability } from '../rules/abilities';
import { distance, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import { resolveSave } from '../rules/attack';
import { rollTag } from '../rules/dice';
import { autoFailsStrDexSave } from '../rules/conditions';
import { saveDice } from './effectDice';
import { makeTimer, saveMode, type Spec } from './durations';
import { fitsSize } from './grapple';
import { damageEffect } from './maprules';
import { forcedMove } from './motion';
import { applyEvents } from './reduce';
import { ruleVersion } from './ruleVersion';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from './types';

/** A2 eklerinin kural sürümü. */
export const RIDERS_A2_VERSION = 30;
export const ridersA2On = (s: Pick<BattleState, 'kuralSurumu'>): boolean => ruleVersion(s) >= RIDERS_A2_VERSION;

type Part = { dice: string; type: string };
type Duration = 'ownTurnEnd' | 'sourceTurnStart' | 'grapple' | `rounds:${number}`;
type EffectSpec = Partial<ActiveEffect> & { name: string; sure: Duration; unique?: boolean; replaceOwn?: boolean };
export interface A2Spec {
  conditions?: Array<Spec & { condition: string }>;
  conditionSave?: { ability: Ability; dc: number };
  push?: { mode: 'push' | 'pull'; ft: number; maxSize?: string; adjacent?: boolean };
  effect?: EffectSpec;
  self?: EffectSpec;
  extra?: Part[];
  areaDamage?: Part;
  kill?: { hpAtMost: number; dies?: boolean; else?: Part & { dice2?: string; type2?: string } };
  zeroHp?: { dies?: boolean; stable?: boolean; conditions?: Array<Spec & { condition: string }> };
  swallow?: { dice: string; type: string; escapeDamage: number; escapeDc: number; maxSize?: string; grappledOnly?: boolean; escapeCheck?: number };
  corrode?: { armor?: boolean; weapon?: boolean };
  tur: string;
  not_?: string;
  kalan?: string;
}
export const A2_RIDERS = (data as unknown as { ekler: Record<string, A2Spec> }).ekler;

export function a2Of(state: Pick<BattleState, 'kuralSurumu'>, monsterId: string | undefined, attackName: string): A2Spec | undefined {
  return monsterId && ridersA2On(state) ? A2_RIDERS[`${monsterId}:${attackName}`] : undefined;
}

/** İsabette ek hasar (rider `extra`'sına eklenir); sürüm 30 altında aynen döner. */
export function withA2Extras<T extends { extra?: Part[] }>(state: Pick<BattleState, 'kuralSurumu'>, spec: T | undefined, monsterId: string | undefined, attackName: string): T | undefined {
  const a = a2Of(state, monsterId, attackName);
  if (!a?.extra?.length) return spec;
  return { ...(spec ?? ({ status: 'uygulandı' } as unknown as T)), extra: [...(spec?.extra ?? []), ...a.extra] };
}

/** Hasarsız save saldırısına hasar (Yarı-Ejderha nefesi). */
export const a2AreaDamage = (state: Pick<BattleState, 'kuralSurumu'>, monsterId: string | undefined, attackName: string): Part | undefined =>
  a2Of(state, monsterId, attackName)?.areaDamage;

const PARTY_LIKE = (c: Combatant) => !c.monsterId || c.side === 'party';

/** Süren etki: süre ifadesi `sure` → bitiş alanları. */
function effectOf(state: BattleState, actor: Combatant, attackName: string, spec: EffectSpec, idFor: string): ActiveEffect {
  const { sure, unique: _u, replaceOwn: _r, ...rest } = spec;
  const dur: Partial<ActiveEffect> = sure === 'ownTurnEnd' ? { untilOwnTurnEnd: true, until: state.round + 2 }
    : sure === 'sourceTurnStart' ? { untilSourceTurn: true, until: state.round + 2 }
      : sure === 'grapple' ? { whileGrappledBy: actor.id, until: state.round + 14400 }
        : { until: state.round + Number(sure.slice(7)) };
  return { ...rest, id: idFor, sourceId: actor.id, ...dur, name: `${actor.name}: ${spec.name ?? attackName}` } as ActiveEffect;
}

function saveFails(target: Combatant, save: { ability: Ability; dc: number }, rng: Rng, out: BattleEvent[], condition: string): boolean {
  const r = resolveSave({ extra: saveDice(target, save.ability), modifier: target.saves[save.ability], dc: save.dc, mode: saveMode('normal', target, save.ability, undefined, { against: [condition] }),
    autoFail: (save.ability === 'str' || save.ability === 'dex') && autoFailsStrDexSave(target.conditions) }, rollTag(rng, { by: target.id }));
  out.push({ type: 'condition_save', targetId: target.id, condition, ability: save.ability, dc: save.dc, d20: r.d20?.rolls ?? [], total: r.total ?? 0, success: r.success, ...(r.extra ? { bonusDice: r.extra } : {}) });
  return !r.success;
}

/** Zırhlı mı (yaklaşım: canavar giydiği zırh sayılmaz; karakterde AC > 10 + DEX). */
const armored = (c: Combatant): boolean => PARTY_LIKE(c) && c.ac > 10 + (c.modifiers?.dex ?? 0);

/**
 * Saldırının A2 ekleri (isabette ya da save başarısızken; `target` saldırı sonrası HP'siyle). `riderConditionEvents`
 * çağırır (0 HP'de de: `zeroHp`).
 */
export function a2Events(state: BattleState, actor: Combatant, target: Combatant, attackName: string, rng: Rng, monsterId: string | undefined = actor.monsterId): BattleEvent[] {
  const a = a2Of(state, monsterId, attackName);
  if (!a) return [];
  const out: BattleEvent[] = [];
  const label = `${actor.name}: ${attackName}`;
  const key = `a2:${monsterId}:${attackName}:${actor.id}`;
  // 0 HP'de tetiklenen (bu saldırı düşürdüyse): ölüm ya da Stable + durumlar.
  if (target.hp <= 0) {
    const z = a.zeroHp;
    if (!z || target.life === 'dead') return out;
    if (z.dies) { out.push({ type: 'hp_adjusted', targetId: target.id, hpAfter: 0, life: 'dead' }); return out; }
    if (z.stable && PARTY_LIKE(target)) out.push({ type: 'life_restored', targetId: target.id, hpAfter: 0, life: 'stable', label });
    for (const c of z.conditions ?? []) {
      out.push({ type: 'condition_changed', targetId: target.id, condition: c.condition, present: true, reason: label, sourceId: actor.id,
        timer: makeTimer(state, c, c.condition, actor.id, target.id, label) });
    }
    return out;
  }
  // HP eşiği (save başarısızken): eşik altındaysa ölür / 0 HP; değilse hasar.
  if (a.kill) {
    if (target.hp <= a.kill.hpAtMost) {
      out.push({ type: 'hp_adjusted', targetId: target.id, hpAfter: 0, life: a.kill.dies || !PARTY_LIKE(target) ? 'dead' : 'dying' });
      return out;
    }
    const e = a.kill.else;
    if (e) {
      const ev = damageEffect(target, 'a2', label, { dice: e.dice, type: e.type }, rng);
      out.push(ev);
      if (e.dice2) out.push(damageEffect(applyEvents(state, [ev]).combatants[target.id] as Combatant, 'a2', label, { dice: e.dice2, type: e.type2 ?? e.type }, rng));
    }
  }
  // Süreli durumlar (sayaç; isteğe bağlı önce save).
  if (a.conditions?.length) {
    const ok = !a.conditionSave || saveFails(target, a.conditionSave, rng, out, a.conditions[0]!.condition);
    if (ok) {
      for (const c of a.conditions) {
        out.push({ type: 'condition_changed', targetId: target.id, condition: c.condition, present: true, reason: label, sourceId: actor.id,
          timer: makeTimer(state, c, c.condition, actor.id, target.id, label) });
      }
    }
  }
  // Süren etki (hedef) ve saldıranın kendine etkisi.
  if (a.effect && !(a.effect.unique && target.effects?.some((e) => e.id.startsWith(`a2:${monsterId}:${attackName}:`) || e.name.endsWith(`: ${a.effect?.name}`)))) {
    if (a.effect.replaceOwn) {
      for (const o of Object.values(state.combatants)) {
        const prev = o.effects?.find((e) => e.id === key);
        if (prev && o.id !== target.id) out.push({ type: 'effect_ended', targetId: o.id, effectId: prev.id, name: prev.name, reason: 'expired' });
      }
    }
    out.push({ type: 'effect_added', targetId: target.id, effect: effectOf(state, actor, attackName, a.effect, key) });
  }
  if (a.self) out.push({ type: 'effect_added', targetId: actor.id, effect: effectOf(state, actor, attackName, a.self, `${key}:self`) });
  // Yutma (yutma yolu; yalnızca boyut ve gerekiyorsa yakaladığı hedef).
  if (a.swallow && fitsSize(target, a.swallow.maxSize) && (!a.swallow.grappledOnly || target.grapple?.by === actor.id) && !target.effects?.some((e) => e.swallowedBy)) {
    const s = a.swallow;
    if (target.grapple) out.push({ type: 'grapple_ended', targetId: target.id, reason: label });
    out.push({ type: 'effect_added', targetId: target.id, effect: { id: `swallow:${actor.id}:${target.id}`, name: `${attackName} (${actor.name})`, sourceId: actor.id, swallowedBy: actor.id,
      grants: ['Blinded', 'Restrained'], until: state.round + 6000, swallow: { dice: s.dice, type: s.type, escapeDamage: s.escapeDamage, escapeDc: s.escapeDc },
      ...(s.escapeCheck ? { escapeCheck: { dc: s.escapeCheck } } : {}) } as ActiveEffect });
  }
  // Aşındırma: zırh AC −1 (AC 10'a dek) ya da silah saldırısı −1 (−5'e dek; Corrosive Form yolu).
  if (a.corrode) {
    if (a.corrode.armor && armored(target)) {
      const id = `a2:corrode-armor:${target.id}`;
      const cur = target.effects?.find((e) => e.id === id)?.ac ?? 0;
      if (target.ac + cur > 10) out.push({ type: 'effect_added', targetId: target.id, effect: { id, name: 'Aşınmış zırh', sourceId: actor.id, ac: cur - 1, until: state.round + 14400 } });
    } else if (a.corrode.weapon) {
      const w = target.attacks?.[0];
      const wkey = (w as { weaponId?: string } | undefined)?.weaponId ?? w?.name;
      if (wkey) {
        const cur = target.effects?.find((e) => e.id === `corrode:${target.id}`)?.corroded ?? {};
        out.push({ type: 'effect_added', targetId: target.id, effect: { id: `corrode:${target.id}`, name: 'Paslanmış silah', sourceId: actor.id, until: 1e9, corroded: { ...cur, [wkey]: Math.min(5, (cur[wkey] ?? 0) + 1) } } });
      }
    }
  }
  // İtme/çekme (K53 forcedMove; çarpma ev kuralı kendiliğinden). Çekmede `adjacent`: bitişiğe dek.
  if (a.push && fitsSize(target, a.push.maxSize) && target.pos && actor.pos) {
    const cur = applyEvents(state, out);
    const p = a.push;
    const feet = p.adjacent ? Math.max(0, (distance(actor.pos, target.pos as Offset) - 1) * 5) : p.ft;
    if (feet > 0) out.push(...forcedMove(cur, target.id, p.mode, feet, actor.id, rng, { origin: actor.pos }));
  }
  return out;
}
