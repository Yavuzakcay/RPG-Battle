/**
 * Kuyruk 19: Telekinesis (SRD 5.2.1) tam hâli (anahtar `spellsK19`; kural sürümü 16).
 * - Yaratık (Huge ya da küçük): STR save; başarısızsa seçilen altıgene (hedefin 30 ft içinde, büyünün 60 ft menzilinde)
 *   taşınır ya da havaya kaldırılır (uçuyor sayılır); büyücünün sonraki turunun sonuna dek Restrained. Havadaki yaratık
 *   o tur sonunda yeniden seçilmezse düşer (30 ft düşme). Hedef değişince eski hedef bırakılır.
 * - Nesne: taşınmayan nesne kendiliğinden 30 ft taşınır; taşınıyorsa taşıyan STR save, başarısızsa nesne alınıp taşınır.
 * Sonraki turlarda Magic eylemiyle (`spell_followup`, hedef + `targetHex`/`choice: 'lift'`).
 */
import { resolveSave } from '../rules/attack';
import { autoFailsStrDexSave } from '../rules/conditions';
import { rollTag, type Rng } from '../rules/dice';
import { distance, type Offset } from '../rules/hex';
import { fail, finish, type CommandResult } from './common';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
import { fallEffect } from './maprules';
import { pushAwayEvents } from './forced';
import { hexLabel, occupantAt, placeProblem } from './movement';
import { checkReach, spellReach } from './range';
import { fallReactions } from './reactions';
import { applyEvents } from './reduce';
import { globalRule } from './ruleControl';
import { concentrationEvent, spendSlot } from './slots';
import { turnKey } from './economy';
import type { BattleEvent, BattleState, Combatant } from './types';
import type { Spell } from '../data/types';

const ID = 'spells:telekinesis';
export const telekinesisOn = (state: BattleState, spell: Spell | undefined) => !!spell?.mechanics.telekinesis && globalRule(state, 'spellsK19');

export function executeTelekinesis(state: BattleState, actor: Combatant, spell: Spell, o: { targetId?: string; dest?: Offset; lift?: boolean; slotLevel?: number; free?: boolean }, rng: Rng, repeat: boolean): CommandResult {
  if (!state.map || !actor.pos) return fail('Telekinesis yalnızca haritalı savaşta.');
  if (repeat && actor.concentration?.turn === turnKey(state)) return fail(`${spell.name} sonraki turlarda yeniden kullanılır.`);
  const range = Math.floor(spell.rangeFt / 5);
  const destOk = (from: Offset, d: Offset, who?: string): string | null => {
    if (distance(from, d) > 6) return `${hexLabel(d)} 30 ft'ten uzak.`;
    if (distance(actor.pos as Offset, d) > range) return `${hexLabel(d)} büyü menzili dışında.`;
    const p = placeProblem(state, d);
    if (p) return p;
    if (who !== undefined && occupantAt(state, d, who)) return `${hexLabel(d)} dolu.`;
    return null;
  };
  // Hedef verilmezse altıgendeki yaratık (yapay zekâ ve eski arayüz: hedef altıgen), varış seçilmezse büyücüden 30 ft uzağa.
  const tid = o.targetId ?? (o.dest ? occupantAt(state, o.dest, actor.id)?.id : undefined);
  if (!o.targetId && tid) o = { ...o, targetId: tid, dest: undefined };
  const obj = o.targetId ? state.map.objects?.find((x) => x.id === o.targetId) : undefined;
  const t = o.targetId ? state.combatants[o.targetId] : undefined;
  if (!obj && !t) return fail('Hedef seçmelisin (yaratık ya da nesne).');
  const slot = repeat ? { ok: true as const, slotLevel: null, events: [] as BattleEvent[] } : spendSlot(actor, spell.level, o.slotLevel, spell.name, o.free);
  if (!slot.ok) return slot;
  const events: BattleEvent[] = [...slot.events, ...(repeat ? [] : concentrationEvent(state, actor, spell, slot.slotLevel))];
  // Önceki hedef bırakılır (havadaysa düşer).
  for (const c of Object.values(state.combatants)) {
    const e = c.effects?.find((x) => x.id === ID && x.sourceId === actor.id);
    if (e && c.id !== t?.id) events.push(...releaseEvents(applyEvents(state, events), c.id, rng));
  }
  if (obj) {
    if (!obj.at || distance(actor.pos, obj.at) > range) return fail(`${obj.kind}: büyü menzili dışında.`);
    if (!o.dest) return fail('Nesnenin taşınacağı altıgeni seç.');
    const why = destOk(obj.at, o.dest);
    if (why) return fail(why);
    events.push({ type: 'spell_cast', actorId: actor.id, targetId: null, label: repeat ? `${spell.name} (yeniden)` : spell.name, slotLevel: slot.slotLevel, note: `${obj.kind} → ${hexLabel(o.dest)}` });
    const carrier = obj.carriedBy ? state.combatants[obj.carriedBy] : undefined;
    if (carrier) {
      const r = resolveSave({ extra: saveDice(carrier, 'str'), modifier: carrier.saves.str, dc: actor.spellSaveDc ?? 10, mode: saveMode('normal', carrier, 'str') }, rollTag(rng, { by: carrier.id }));
      events.push({ type: 'map_note', text: `${carrier.name}: STR save ${r.total}/${actor.spellSaveDc ?? 10} — ${r.success ? 'nesneyi bırakmadı' : 'nesne elinden alındı'}` });
      if (r.success) return finish(state, events);
    }
    events.push({ type: 'object_changed', objectId: obj.id, label: spell.name, at: o.dest, ...(carrier ? { carriedBy: null } : {}) });
    return finish(state, events);
  }
  const target = t as Combatant;
  if (target.size === 'G') return fail(`${spell.name}: Gargantuan yaratık taşınamaz.`);
  if (target.id === actor.id) return fail('Kendini hedefleyemezsin.');
  const reach = checkReach(state, actor, target, spellReach(spell, actor));
  if (!reach.ok) return reach;
  if (!o.lift && o.dest) { const why = destOk(target.pos as Offset, o.dest, target.id); if (why) return fail(why); }
  events.push({ type: 'spell_cast', actorId: actor.id, targetId: target.id, label: repeat ? `${spell.name} (yeniden)` : spell.name, slotLevel: slot.slotLevel, note: target.name });
  const dc = actor.spellSaveDc ?? 10;
  const r = resolveSave({ extra: saveDice(target, 'str'), modifier: target.saves.str, dc, mode: saveMode('normal', target, 'str'), autoFail: autoFailsStrDexSave(target.conditions) }, rollTag(rng, { by: target.id }));
  events.push({ type: 'map_note', text: `${target.name}: STR save ${r.total}/${dc} — ${r.success ? 'direndi' : o.lift ? 'havaya kaldırıldı' : 'taşındı'}` });
  if (r.success) return finish(state, events);
  if (!o.lift && o.dest && target.pos) events.push({ type: 'pushed', targetId: target.id, from: target.pos, to: o.dest, by: actor.id });
  else if (!o.lift) events.push(...pushAwayEvents(applyEvents(state, events), actor.pos, target.id, 30, actor.id, rng));
  events.push({ type: 'effect_added', targetId: target.id, effect: { id: ID, name: spell.name, sourceId: actor.id, concentration: spell.name, grants: ['Restrained'],
    untilSourceTurnEnd: state.round, ...(o.lift ? { airborne: true, tkFallFt: 30 } : {}), icon: '🌀' } });
  return finish(state, events);
}

/** Bırakılan hedef: etki biter, havadaysa düşer (SRD düşme; Feather Fall/Slow Fall tepkileri). */
function releaseEvents(state: BattleState, id: string, rng: Rng): BattleEvent[] {
  const c = state.combatants[id];
  const e = c?.effects?.find((x) => x.id === ID);
  if (!c || !e) return [];
  const out: BattleEvent[] = [{ type: 'effect_ended', targetId: id, effectId: ID, name: e.name, reason: 'expired' }];
  if (e.tkFallFt && c.hp > 0) {
    const after = applyEvents(state, out);
    const fr = fallReactions(after, id, e.tkFallFt, rng);
    out.push(...fr.events, fallEffect(after.combatants[id] as Combatant, e.tkFallFt, rng, fr));
  }
  return out;
}

/** Büyücünün tur sonu: önceki turda tutulan hedef bırakılır (bu tur yeniden seçilmediyse). */
export function telekinesisTurnEndEvents(state: BattleState, casterId: string, rng: Rng): BattleEvent[] {
  const out: BattleEvent[] = [];
  let s = state;
  for (const c of Object.values(state.combatants)) {
    const e = c.effects?.find((x) => x.id === ID && x.sourceId === casterId);
    if (!e || e.untilSourceTurnEnd === undefined || state.round <= e.untilSourceTurnEnd) continue;
    const evs = releaseEvents(s, c.id, rng);
    out.push(...evs);
    s = applyEvents(s, evs);
  }
  return out;
}
