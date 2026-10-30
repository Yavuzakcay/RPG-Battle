/**
 * Süreli durumlar (`Combatant.conditionTimers`), Kaçın (Dodge) ve Yardım (Help).
 *
 * Süre türleri: belirli tur sayısı; "sahibinin sonraki turunun başına / sonuna dek";
 * "save ends" (hedef her kendi turunun sonunda kurtarma zarı atar); süresiz (sayaçsız durum).
 * Sayaçlar tur başı/sonu kancalarında (`timerEvents`) işler; biten durum `condition_ended` olayı üretir.
 * Saldırı ve büyü etkilerinin süreleri `data/condition-effects.json`'da.
 */
import { saveDice } from './effectDice';
import effectsJson from '../../data/condition-effects.json';
import type { Ability } from '../rules/abilities';
import { resolveSave } from '../rules/attack';
import { rollTag, type Rng, type RollMode } from '../rules/dice';
import { autoFailsStrDexSave, isIncapacitated } from '../rules/conditions';
import { distance } from '../rules/hex';
import { fail, finish, isTargetable, type CommandResult } from './common';
import type { BattleEvent, BattleState, Combatant, ConditionTimer } from './types';
import { damageEffect } from './maprules';

export const DODGE = 'Dodge';
/** Yardım işareti hedef düşmanda durur: `Help:<yardım eden taraf>`. */
export const helpMark = (side: Combatant['side']) => `Help:${side}`;
export const isMarker = (condition: string) => condition === DODGE || condition.startsWith('Help:');

export interface Spec {
  condition?: string;
  owner?: 'source' | 'target';
  end?: 'turnStart' | 'turnEnd';
  rounds?: number;
  save?: { ability: Ability; dc: number };
  saveEnds?: boolean | { ability: Ability; dc: number };
  ability?: Ability;
  maxRounds?: number;
  /** Durum sürerken hedefin her tur başı hasarı. */
  dot?: { dice: string; type: string };
}
const EFFECTS = effectsJson as unknown as { attacks: Record<string, Spec>; spells: Record<string, Spec> };

/** Canavar saldırısının süreli etkisi (yoksa undefined). */
export const attackEffect = (monsterId: string | undefined, attackName: string): Spec | undefined =>
  monsterId ? EFFECTS.attacks[`${monsterId}:${attackName}`] : undefined;
export const spellEffect = (spellName: string): Spec | undefined => EFFECTS.spells[spellName];
export const supportedAttackEffects = () => Object.keys(EFFECTS.attacks);
export const supportedSpellEffects = () => Object.keys(EFFECTS.spells);

const currentActor = (state: BattleState) => state.order[state.turnIndex];

/**
 * Süre tanımından sayaç. "Sonraki turunun sonuna dek": sahibi şu an sıradaysa bu turun sonu sayılmaz
 * (count 2), değilse ilk tur sonunda biter (count 1). "Başına dek" her zaman bir sonraki tur başı.
 */
export function makeTimer(
  state: BattleState, spec: Spec, condition: string, sourceId: string | undefined, targetId: string, label: string,
  save?: { ability: Ability; dc: number },
): ConditionTimer {
  if (spec.saveEnds) {
    const s = typeof spec.saveEnds === 'object' ? spec.saveEnds : save;
    return { condition, ownerId: targetId, end: 'turnEnd', count: spec.maxRounds ?? 10, label, ...(sourceId ? { sourceId } : {}), ...(s ? { save: s } : {}), ...(spec.dot ? { dot: spec.dot } : {}) };
  }
  const ownerId = spec.owner === 'source' && sourceId ? sourceId : targetId;
  const end = spec.end ?? 'turnEnd';
  const count = spec.rounds ?? (end === 'turnEnd' && currentActor(state) === ownerId ? 2 : 1);
  return { condition, ownerId, end, count, label, ...(sourceId ? { sourceId } : {}), ...(spec.dot ? { dot: spec.dot } : {}) };
}

/** Süreli durum uygulama olayı. */
export function timedCondition(
  state: BattleState, targetId: string, spec: Spec, sourceId: string | undefined, label: string,
  save?: { ability: Ability; dc: number },
): BattleEvent {
  const condition = spec.condition ?? '';
  return { type: 'condition_changed', targetId, condition, present: true, reason: label, ...(sourceId ? { sourceId } : {}),
    timer: makeTimer(state, spec, condition, sourceId, targetId, label, save) };
}

/**
 * Bir savaşçının tur başı ya da sonu: sahibi o olan sayaçlar işler. "Save ends" ise hedef kurtarma
 * zarı atar (başarıda biter); değilse sayaç azalır, 0'a inince durum biter.
 */
export function timerEvents(state: BattleState, ownerId: string, end: ConditionTimer['end'], rng: Rng): BattleEvent[] {
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    for (const t of c.conditionTimers ?? []) {
      if (t.ownerId !== ownerId || t.end !== end) continue;
      if (t.save && c.hp > 0) {
        const r = resolveSave({ extra: saveDice(c, t.save.ability), modifier: c.saves[t.save.ability], dc: t.save.dc, mode: saveMode('normal', c, t.save.ability),
          autoFail: (t.save.ability === 'str' || t.save.ability === 'dex') && autoFailsStrDexSave(c.conditions) }, rollTag(rng, { by: c.id }));
        out.push({ type: 'condition_save', targetId: c.id, condition: t.condition, ability: t.save.ability, dc: t.save.dc,
          d20: r.d20?.rolls ?? [], total: r.total ?? 0, success: r.success, ...(r.extra ? { bonusDice: r.extra } : {}) });
        if (r.success) { out.push({ type: 'condition_ended', targetId: c.id, condition: t.condition, reason: 'kurtarma zarı başarılı' }); continue; }
      }
      out.push(t.count <= 1
        ? { type: 'condition_ended', targetId: c.id, condition: t.condition, reason: 'süre doldu' }
        : { type: 'condition_timer', targetId: c.id, condition: t.condition, count: t.count - 1 });
    }
  }
  return out;
}

/** Kaçın etkin mi: durumu var, etkisiz (incapacitated) değil ve hızı 0 değil (Grappled/Restrained). */
export function dodgeActive(conds: string[]): boolean {
  return conds.includes(DODGE) && !isIncapacitated(conds) && !conds.some((x) => x === 'Grappled' || x === 'Restrained');
}

/** Kurtarma zarını yapan: durumları, avantajlı save'leri (Danger Sense) ve Rage (STR avantajı). */
export type SaveSubject = { conditions: string[]; saveAdvantage?: Ability[]; rage?: unknown; rageStrAdvantage?: boolean; effects?: Array<{ saveAdv?: Ability[]; saveDis?: Ability[] }> };

/**
 * Kurtarma zarı kipi: Kaçın etkinse DEX save'leri avantajlı; Danger Sense gibi avantajlı save'ler (Incapacitated
 * değilken); Rage sürerken STR save'leri avantajlı. Eski çağrılar yalnızca durum listesi verebilir.
 */
export function saveMode(base: RollMode, who: string[] | SaveSubject, ability: Ability): RollMode {
  const s: SaveSubject = Array.isArray(who) ? { conditions: who } : who;
  const adv = (ability === 'dex' && dodgeActive(s.conditions))
    || (!!s.saveAdvantage?.includes(ability) && !isIncapacitated(s.conditions))
    || (ability === 'str' && !!s.rage && s.rageStrAdvantage === true)
    // Görev B1: süren etkilerin save avantajı (Haste DEX, Beacon of Hope WIS, Gaseous Form, Enlarge STR).
    || !!s.effects?.some((e) => e.saveAdv?.includes(ability));
  // Görev B1: süren etkinin save dezavantajı (Reduce, Ray of Enfeeblement: STR).
  const dis = !!s.effects?.some((e) => e.saveDis?.includes(ability));
  // Avantaj ve dezavantaj (tabanla birlikte) birbirini götürür (SRD).
  const anyAdv = base === 'advantage' || adv, anyDis = base === 'disadvantage' || dis;
  return anyAdv && anyDis ? 'normal' : anyAdv ? 'advantage' : anyDis ? 'disadvantage' : 'normal';
}

/** Kaçın: eylem; sonraki turunun başına dek. */
export function executeDodge(state: BattleState, actor: Combatant): CommandResult {
  const spec: Spec = { condition: DODGE, owner: 'target', end: 'turnStart' };
  return finish(state, [timedCondition(state, actor.id, spec, actor.id, 'Kaçın')]);
}

/** Yardım: eylem; bitişik düşmana karşı tarafının ilk saldırısı avantajlı, sonraki turunun başına dek. */
export function executeHelp(state: BattleState, actor: Combatant, targetId: string): CommandResult {
  const target = state.combatants[targetId];
  if (!target || !isTargetable(target)) return fail('Hedef bulunamadı.');
  if (target.side === actor.side) return fail('Yardım için bitişik bir düşman seç.');
  // Haritasız savaşta mesafe yok (yakın dövüş menzilinde sayılır).
  if (state.map && (!actor.pos || !target.pos || distance(actor.pos, target.pos) > 1)) return fail('Hedef düşman bitişik olmalı.');
  const spec: Spec = { condition: helpMark(actor.side), owner: 'source', end: 'turnStart' };
  return finish(state, [timedCondition(state, target.id, spec, actor.id, `${actor.name}: Yardım`)]);
}

/**
 * Büyüyle eklenen durumların süresi ("save ends": hedef her tur sonunda büyünün yeteneği — ya da
 * tanımdaki `ability` — ve büyücünün DC'siyle kurtarma zarı atar). Konsantrasyon bağı ayrıca sürer.
 */
export function spellTimerEvents(
  state: BattleState, spellName: string, targetId: string, added: string[], ability: Ability, dc: number,
): BattleEvent[] {
  const spec = spellEffect(spellName);
  if (!spec || added.length === 0) return [];
  const save = { ability: spec.ability ?? ability, dc };
  return added.map((condition) => ({
    type: 'condition_changed', targetId, condition, present: true, reason: spellName,
    timer: makeTimer(state, { ...spec, saveEnds: true }, condition, undefined, targetId, spellName, save),
  }));
}

/** Süren durum hasarı: savaşçının tur başında, üzerindeki her `dot`'lu süreli durum için. */
export function dotEvents(state: BattleState, combatantId: string, rng: Rng): BattleEvent[] {
  const c = state.combatants[combatantId];
  if (!c || c.hp <= 0) return [];
  const out: BattleEvent[] = [];
  let cur = c;
  for (const t of c.conditionTimers ?? []) {
    if (!t.dot || cur.hp <= 0) continue;
    const ev = damageEffect(cur, 'condition', `${t.label}: ${t.condition}`, { dice: t.dot.dice, type: t.dot.type }, rng);
    out.push(ev);
    if (ev.type === 'map_effect' && ev.hpAfter !== undefined) cur = { ...cur, hp: ev.hpAfter };
  }
  return out;
}
