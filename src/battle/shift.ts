/**
 * Kuyruk 19 (anahtar `featuresK19`, kural sürümü 16): "hemen yarı hızla fırsat saldırısı almadan hareket" (SRD 5.2.1
 * Tactical Shift, Cunning Strike Withdraw). Eskiden yaklaşık olarak tur sonuna dek Disengage idi; şimdi ayrı bir bütçe
 * (`economy.shiftLeft`, altıgen) açılır ve `shift_move` komutu hareket hakkından düşmeden, fırsat saldırısı tetiklemeden
 * yürür. Bütçe tur bitince (ekonomi yenilenince) kaybolur.
 */
import { costsFrom, hexKey, type Offset } from '../rules/hex';
import { fail, finish, type CommandResult } from './common';
import { executeMove, moveCostFn } from './movement';
import { speedHexes } from './reduce';
import { globalRule } from './ruleControl';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant } from './types';

export const featuresOn = (state: BattleState) => !!globalRule(state, 'featuresK19');

/** Yarı hız kadar serbest kayma hakkı (anahtar kapalıyken eski yaklaşım: Disengage). */
export function shiftGrant(state: BattleState, actor: Combatant): BattleEvent {
  if (!featuresOn(state)) return { type: 'disengaged', actorId: actor.id };
  return { type: 'shift_granted', actorId: actor.id, hexes: Math.floor(speedHexes(actor) / 2) };
}

/** Serbest kaymayla gidilebilecek altıgenler. */
export function shiftHexes(state: BattleState, actor: Combatant): Offset[] {
  const left = actor.economy.shiftLeft ?? 0;
  if (!actor.pos || left <= 0 || !state.map) return [];
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const out: Offset[] = [];
  for (const [key, cost] of costsFrom(actor.pos, size, moveCostFn(state, actor), left)) {
    if (cost === 0) continue;
    const [col, row] = key.split(',').map(Number) as [number, number];
    out.push({ col, row });
  }
  return out;
}

export function executeShiftMove(state: BattleState, actor: Combatant, to: Offset, rng: Rng): CommandResult {
  const left = actor.economy.shiftLeft ?? 0;
  if (!featuresOn(state) || left <= 0) return fail('Serbest kayma hakkın yok.');
  if (!shiftHexes(state, actor).some((h) => hexKey(h) === hexKey(to))) return fail(`En çok ${left * 5} ft kayabilirsin.`);
  // Geçici durum: hareket hakkı yerine kayma bütçesi, fırsat saldırısı yok.
  const temp: Combatant = { ...actor, movementUsed: Math.max(0, speedHexes(actor) - left), economy: { ...actor.economy, disengaged: true } };
  const r = executeMove({ ...state, combatants: { ...state.combatants, [actor.id]: temp } }, temp, to, rng);
  if (!r.ok) return r;
  const events = r.events.map((e) => (e.type === 'moved' && e.actorId === actor.id ? { ...e, free: true } : e));
  return finish(state, events);
}
