/**
 * Süren etkiler (Görev R2; SRD 5.2.1): savaşçının üzerindeki `effects` listesi. Etkiyi koyan büyüler `spells.ts`'te
 * (`kind: effect`, smite'ın `ongoing`'i); zar eklentileri `effectDice.ts`, geçici HP ve hasar azaltma
 * `damage-effects.ts`, bitişler (süre, konsantrasyon, ölüm, tek kullanım) reducer'da (`pruneEffects`).
 *
 * Burada etkili yaratığın tur başı: geçici HP (Heroism), süregelen hasar ve ardından kurtarma zarı (Searing Smite;
 * başarıda biter), Command (turunu kaybeder; Grovel önce yere düşer).
 */
import { resolveSave } from '../rules/attack';
import { adjustDamage } from '../rules/damage';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { damageEffects } from './damage-effects';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
import { applyEvents } from './reduce';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from './types';

const profileOf = (t: Combatant) => ({ resistances: t.resistances, immunities: t.immunities, vulnerabilities: t.vulnerabilities });

/** Etkinin süren hasarı: zar (dirençle), hasar uygulanır, sonra save; başarıda etki biter. */
function ongoingEvents(c: Combatant, e: ActiveEffect, rng: Rng): BattleEvent[] {
  const o = e.ongoing;
  if (!o) return [];
  const d = rollDice(o.dice, rollTag(rng, { kind: 'damage', by: e.sourceId }));
  const adj = adjustDamage(d.total, o.type, profileOf(c));
  const fx = damageEffects(c, adj.amount, o.type, false, rng);
  const after = { ...c, hp: fx.hpAfter };
  let save: Extract<BattleEvent, { type: 'effect_tick' }>['save'];
  if (fx.hpAfter > 0) {
    const r = resolveSave({ extra: saveDice(after), modifier: after.saves[o.save], dc: o.dc, mode: saveMode('normal', after, o.save) }, rollTag(rng, { by: c.id }));
    save = { ability: o.save, dc: o.dc, d20: r.d20?.rolls ?? [], total: r.total ?? 0, success: r.success, ...(r.extra ? { extra: r.extra } : {}) };
  }
  const events: BattleEvent[] = [{
    type: 'effect_tick', targetId: c.id, effectId: e.id, name: e.name, damageRolls: d.rolls, appliedDamage: adj.amount,
    damageType: o.type, targetHpAfter: fx.hpAfter, effects: fx.effects, ...(save ? { save } : {}),
  }];
  if (save?.success) events.push({ type: 'effect_ended', targetId: c.id, effectId: e.id, name: e.name, reason: 'save' });
  return events;
}

/**
 * Sırası gelen yaratığın etkileri (tur başı): geçici HP, süregelen hasar, Command. `skip`: turunu kaybeder (Command).
 */
export function effectTurnStartEvents(state: BattleState, id: string, rng: Rng): { events: BattleEvent[]; skip: boolean } {
  const c0 = state.combatants[id];
  if (!c0?.effects?.length || c0.hp <= 0) return { events: [], skip: false };
  const events: BattleEvent[] = [];
  let current = state;
  let skip = false;
  for (const e of c0.effects) {
    const c = current.combatants[id] as Combatant;
    if (c.hp <= 0) break;
    let evs: BattleEvent[] = [];
    if (e.tempHp && e.tempHp > 0) evs = [{ type: 'temp_hp', targetId: id, amount: e.tempHp, label: e.name }];
    if (e.ongoing) evs = ongoingEvents(c, e, rng);
    if (e.command) {
      evs = [{ type: 'turn_lost', actorId: id, label: e.name, command: e.command }, { type: 'effect_ended', targetId: id, effectId: e.id, name: e.name, reason: 'turn' }];
      skip = true;
    }
    events.push(...evs);
    current = applyEvents(current, evs);
  }
  return { events, skip };
}
