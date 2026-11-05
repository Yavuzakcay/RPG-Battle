/**
 * Kuyruk K54: imza alt sınıfların eksik özellikleri (kural sürümü 25, `data/imza.json` `surumK54`). K53 ortak sistemleri
 * üstüne: zorla hareket kipleri (`forcedMove`), nesne itme/fırlatma/enkaz (`objectMotion`), ışınlanma (`teleport`),
 * geçici engel (`barriers`), aura (`auraCore`). Eski sürüm savaşta (23–24) bu dosyanın hiçbir yolu çalışmaz; K50
 * davranışı aynen kalır. Saf.
 */
import data from '../../data/imza.json';
import { ruleVersion } from './ruleVersion';
import { imzaOn, byLevel } from './imzaCore';
import { forcedMove } from './motion';
import { conjureDebris, forcedMoveObject, throwObject, weightOf } from './objectMotion';
import { objectAt } from './objectData';
import { applyEvents } from './reduce';
import { saveDice } from './effectDice';
import { saveMode } from './durations';
import { canReact, reactionUsed, registerAfterAttack, strikeApi } from './reactions';
import { askReaction } from '../rules/reactionChoice';
import { resolveSave } from '../rules/attack';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { distance, type Offset } from '../rules/hex';
import { resourceLeft, type BattleEvent, type BattleState, type Combatant } from './types';

export const K54_VERSION = (data as { surumK54?: number }).surumK54 ?? 25;
/** K54 özellikleri bu savaşta mı (sürüm 25+ ve alt sınıfın ev kuralı açık). */
export const k54 = (state: BattleState, sub?: string): boolean => ruleVersion(state) >= K54_VERSION && (!sub || imzaOn(state, sub));
const SIZE = ['T', 'S', 'M', 'L', 'H', 'G'];
const sizeOk = (t: Combatant, max?: string) => !max || SIZE.indexOf(t.size ?? 'M') <= SIZE.indexOf(max);

/** Zihin Gücü (yaratık): STR kurtulması başarısızsa kipe göre `mesafe` ft; serbest kipte `to` altıgenine doğru. */
export function mindMoveEvents(state: BattleState, actor: Combatant, t: Combatant, spec: { kip?: string; mesafe?: number; boyutEnCok?: string }, failed: boolean,
  to: Offset | undefined, rng: Rng): BattleEvent[] {
  if (!failed || !actor.pos || !t.pos || !sizeOk(t, spec.boyutEnCok)) return [];
  const kip = (spec.kip ?? 'push') as 'push' | 'pull' | 'slide' | 'free';
  return forcedMove(state, t.id, kip, spec.mesafe ?? 10, actor.id, rng, kip === 'free' ? { to } : { origin: actor.pos });
}

/** Zihin Gücü (nesne): `to` altıgenindeki hareketli nesne Monk'tan uzağa (ağırlık sınırı seviyeye göre). */
export function mindObjectProblem(state: BattleState, actor: Combatant, to: Offset | undefined, range: number, allowed: string[]): string | null {
  if (!to) return 'Nesnenin altıgenini seç.';
  const o = objectAt(state, to);
  if (!o) return 'Orada nesne yok.';
  const w = weightOf(o);
  if (!w || !allowed.includes(w)) return 'Bu nesne zihinle taşınamayacak kadar ağır ya da sabit.';
  if (actor.pos && distance(actor.pos, to) * 5 > range) return `${range} ft içinde olmalı.`;
  return null;
}
export function mindObjectEvents(state: BattleState, actor: Combatant, to: Offset, feet: number, rng: Rng): BattleEvent[] {
  const o = objectAt(state, to);
  if (!o || !actor.pos) return [];
  return forcedMoveObject(state, o.id, 'push', feet, actor.id, rng, { origin: actor.pos });
}

/**
 * Zihin Gücü: Fırlat: `to` altıgenindeki nesne (yoksa zemin enkazı) hedefe fırlatılır; hedef DEX kurtulması (başarıda
 * yarı). Tek zar (çarpma hasarı eklenmez).
 */
export function hurlEvents(state: BattleState, actor: Combatant, target: Combatant, to: Offset | undefined, dice: string, type: string, dc: number, rng: Rng): BattleEvent[] | string {
  if (!to || !target.pos) return 'Fırlatılacak nesnenin altıgenini seç.';
  let cur = state;
  const events: BattleEvent[] = [];
  let obj = objectAt(cur, to);
  if (!obj || !weightOf(obj)) {
    const d = conjureDebris(cur, to);
    if (!d) return 'Orada fırlatılacak bir şey yok.';
    events.push(...d.events);
    cur = applyEvents(cur, d.events);
    obj = cur.map?.objects?.find((x) => x.id === d.objectId);
  }
  if (!obj) return 'Nesne yok.';
  const sv = resolveSave({ extra: saveDice(target, 'dex'), modifier: target.saves.dex, dc, mode: saveMode('normal', target, 'dex', actor) }, rollTag(rng, { by: target.id }));
  events.push({ type: 'map_note', text: `${target.name}: DEX save ${sv.total}/${dc} — ${sv.success ? 'yarı hasar' : 'tam isabet'}` });
  const roll = rollDice(dice, rollTag(rng, { kind: 'damage', by: actor.id }));
  const amount = sv.success ? Math.floor(roll.total / 2) : roll.total;
  // Monk telekinezisi: menzil nesnenin ağırlığından değil özellikten (60 ft); fırlatma çizgisi nesneden hedefe.
  const r = throwObject(cur, obj.at, obj.id, target.pos, actor.id, rng, { dice: String(amount), type }, 1e6);
  if ('problem' in r) return r.problem;
  return [...events, ...r.events];
}

/**
 * Sabır (Yaşlı Bilge 3): sana yakın dövüşte iskalayan düşmana tepkiyle silahsız saldırı. Önce ücretsiz kullanım
 * (`imzaSabir`), sonra 1 Odak.
 */
export function patienceEvents(state: BattleState, monkId: string, attackerId: string, rng: Rng): BattleEvent[] {
  const m = state.combatants[monkId];
  const a = state.combatants[attackerId];
  if (!m || !a || !canReact(m) || m.imza !== 'imza_bilge' || m.level < 3 || !k54(state, m.imza)) return [];
  const free = resourceLeft(m, 'imzaSabir') > 0;
  if (!free && resourceLeft(m, 'focus') < 1) return [];
  const api = strikeApi();
  if (!api || !api.can(state, m.id, a.id)) return [];
  const ans = askReaction(rng, { reactorId: m.id, trigger: 'miss', sourceId: a.id, info: { label: 'Sabır' }, options: [{ id: 'imza-sabir', name: 'Sabır' }], suggested: { option: 'imza-sabir' } });
  if (ans?.option !== 'imza-sabir') return [];
  const res = free ? 'imzaSabir' : 'focus';
  const pre: BattleEvent[] = [{ type: 'feature_used', actorId: m.id, feature: res, remaining: resourceLeft(m, res) - 1 },
    reactionUsed(m, { id: 'imza-sabir', name: 'Sabır' }, 'miss', a.id)];
  return [...pre, ...api.strike(applyEvents(state, pre), m.id, a.id, rng, 'Unarmed Strike')];
}

registerAfterAttack((state, attackerId, targetId, info, rng) => (!info.hit && info.melee ? patienceEvents(state, targetId, attackerId, rng) : []));

export { byLevel };
