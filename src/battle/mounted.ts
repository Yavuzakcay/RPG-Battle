/**
 * Kuyruk 19 (görev 7, SRD 5.2.1 Mounted Combat; anahtar `srdK19`): binek.
 * - `mount`: bitişikteki gönüllü (aynı taraf) ve binicide en az bir boy büyük yaratığa binmek hızın yarısı kadar
 *   hareket harcar; binici bineğin altıgenine geçer (`riding`, bineğe `rider`).
 * - `dismount`: bitişik boş altıgene inmek hızın yarısı.
 * - Binici kendi yürüyemez (bineği taşır): reducer sonu `syncRiders` binicinin yerini bineğe eşitler (yürüyüş, itme,
 *   ışınlanma, atlama hepsi).
 * - Bağımsız binek (SRD "independent mount"): binek kendi sırasıyla oynar; kontrollü binek ayrımı yok.
 * - Binek Prone olur, düşer ya da Incapacitated olursa binici DEX save (DC 10); başarısızsa Prone; her durumda
 *   bitişik boş altıgene iner (komut sonu `riderCleanup`).
 */
import { resolveSave } from '../rules/attack';
import { isIncapacitated } from '../rules/conditions';
import { rollTag, type Rng } from '../rules/dice';
import { distance, neighbors, sameHex, type Offset } from '../rules/hex';
import { fail, finish, type CommandResult } from './common';
import { saveDice } from './effectDice';
import { saveMode } from './durations';
import { sizeRank } from './forced';
import { globalRule } from './ruleControl';
import type { BattleEvent, BattleState, Combatant } from './types';

const halfSpeed = (c: Combatant) => Math.ceil(c.speed / 10);
const occupied = (state: BattleState, h: Offset) => Object.values(state.combatants).some((o) => o.hp > 0 && !!o.pos && sameHex(o.pos, h) && !o.summon?.gone);

function freeNeighbor(state: BattleState, at: Offset): Offset | null {
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  return neighbors(at, size).find((h) => !occupied(state, h)) ?? null;
}

export function mountProblem(state: BattleState, actor: Combatant, mountId: string): string | null {
  if (!globalRule(state, 'srdK19')) return 'Binek kuralları bu kural sürümünde ya da Game Master ayarında kapalı.';
  if (actor.riding) return 'Zaten bir bineğin üstündesin.';
  const m = state.combatants[mountId];
  if (!m || m.hp <= 0 || m.id === actor.id) return 'Binek bulunamadı.';
  if (m.side !== actor.side) return 'Yalnızca gönüllü (dost) bir yaratığa binilir.';
  if (m.rider) return 'Bineğin üstünde zaten biri var.';
  if (sizeRank(m.size) <= sizeRank(actor.size)) return 'Binek senden en az bir boy büyük olmalı.';
  if (state.map && (!actor.pos || !m.pos || distance(actor.pos, m.pos) > 1)) return 'Bineğe bitişik olmalısın.';
  if (actor.movementUsed + halfSpeed(actor) > Math.floor(actor.speed / 5) * (1 + actor.economy.dashes)) return 'Binmek için hızının yarısı kadar hareketin kalmalı.';
  return null;
}

export function executeMount(state: BattleState, actor: Combatant, mountId: string): CommandResult {
  const why = mountProblem(state, actor, mountId);
  if (why) return fail(why);
  return finish(state, [{ type: 'mounted', actorId: actor.id, mountId, cost: halfSpeed(actor) }]);
}

export function executeDismount(state: BattleState, actor: Combatant, to?: Offset): CommandResult {
  if (!actor.riding) return fail('Bir bineğin üstünde değilsin.');
  const at = to ?? (actor.pos ? freeNeighbor(state, actor.pos) : null);
  if (!at || (actor.pos && distance(actor.pos, at) > 1) || occupied(state, at)) return fail('İnmek için bitişik boş bir altıgen seç.');
  if (actor.movementUsed + halfSpeed(actor) > Math.floor(actor.speed / 5) * (1 + actor.economy.dashes)) return fail('İnmek için hızının yarısı kadar hareketin kalmalı.');
  return finish(state, [{ type: 'dismounted', actorId: actor.id, at, cost: halfSpeed(actor) }]);
}

/** Reducer sonu: binici bineğin yerinde. */
export function syncRiders(state: BattleState): BattleState {
  let next = state;
  for (const c of Object.values(state.combatants)) {
    if (!c.riding) continue;
    const m = next.combatants[c.riding];
    if (m?.pos && (!c.pos || !sameHex(c.pos, m.pos))) next = { ...next, combatants: { ...next.combatants, [c.id]: { ...c, pos: m.pos } } };
  }
  return next;
}

/** Komut sonu: bineği düşen/Prone/Incapacitated olan binici DEX save (DC 10), başarısızsa Prone; bitişiğe iner. */
export function riderCleanup(state: BattleState, rng: Rng): BattleEvent[] {
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    if (!c.riding || c.hp <= 0) continue;
    const m = state.combatants[c.riding];
    const falls = !m || m.hp <= 0 || m.conditions.includes('Prone') || isIncapacitated(m.conditions) || !!m.summon?.gone;
    if (!falls) continue;
    const save = resolveSave({ extra: saveDice(c, 'dex'), modifier: c.saves.dex, dc: 10, mode: saveMode('normal', c, 'dex') }, rollTag(rng, { by: c.id }));
    out.push({ type: 'save_resolved', actorId: c.id, targetId: c.id, label: 'Binekten düşme', ability: 'dex', dc: 10, mode: 'normal', reasons: [],
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: c.hp, effects: [], conditionsAdded: save.success ? [] : ['Prone'] });
    const at = c.pos ? freeNeighbor(state, c.pos) ?? c.pos : c.pos;
    if (at) out.push({ type: 'dismounted', actorId: c.id, at, cost: 0 });
    if (!save.success) out.push({ type: 'condition_changed', targetId: c.id, condition: 'Prone', present: true, reason: 'Binekten düşme' });
  }
  return out;
}
