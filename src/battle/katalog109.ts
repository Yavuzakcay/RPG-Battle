/**
 * Görev KATALOG-GUC-TAM (kural sürümü 109): katalog güçlerinin motor kancaları. Veri `data/katalog-gucler.json`
 * (`katalog109Data.ts`), etki alanları `ActiveEffect.k109` (`katalog109Types.ts`). Kodda canavar adıyla koşul yok.
 * - Cosmic Madness (`madAlly`): tur başında d6 ≤ N ise ilk saldırısını en yakın dostuna yapar (yakın dövüş erişimindeyse),
 *   eylemi harcanır.
 * - Yakın dövüşte karşı hasar (`meleeRetaliate`): isabet eden yakın dövüş saldırısının sahibine zar (Hydraxe asidi).
 * - Star Mark (`starMark`): görünmez olamaz (komut sonunda Invisible ve onu veren etki düşer); konsantrasyon bonusu yok
 *   (`damage-effects.ts`).
 * - Legendary Resistance'ın etki silmesi (`lrCleanse`): LR kullanan bir olumsuz durumu/etkiyi siler.
 * - Spell-Reflecting Crystal Shell (`reflectSpell`): hedef aldığı büyüde save'i geçen, büyüyü atıcısına seker (slotsuz yeniden yapım).
 * - Out-of-Time Storm (`negateOnce`): turda bir kez kendisine isabet eden saldırı iptal (tepkisiz); ikinci oyun `common.ts`.
 * 108 ve altında etkiler hiç oluşmaz (veri okunmaz), kancalar boş döner. Saf; `rng` enjekte.
 */
import { distance, type Offset } from '../rules/hex';
import { rollDie, rollTag, type Rng } from '../rules/dice';
import { isIncapacitated } from '../rules/conditions';
import { katalog109On } from './katalog109Surum';
import { registerAfterAttack, registerAllyHit, strikeApi, type HitContext } from './reactions';
import { gucOf } from './katalog109Data';
import { castWithoutAction } from './castHook';
import { applyEvents } from './reduce';
import { registerCommandEnd, registerTurnStart } from './turnHooks';
import { damageEffect } from './maprules';
import type { BattleEvent, BattleState, Combatant } from './types';

const fxOf = (c: Combatant) => (c.effects ?? []).map((e) => e.k109).filter((x): x is NonNullable<typeof x> => !!x);

/** Cosmic Madness: tur başı d6; tutarsa en yakın (erişimdeki) dosta bir saldırı, eylem harcanır. */
export function madnessEvents(state: BattleState, id: string, rng: Rng): BattleEvent[] {
  const c = state.combatants[id];
  if (!c || !katalog109On(state) || c.hp <= 0 || !c.pos || isIncapacitated(c.conditions)) return [];
  const n = Math.max(0, ...fxOf(c).map((f) => f.madAlly ?? 0));
  if (n <= 0) return [];
  const d = rollDie(6, rollTag(rng, { by: c.id, kind: 'percent' }));
  const note: BattleEvent = { type: 'map_note', text: `${c.name}: Cosmic Madness d6 = ${d}${d <= n ? ' → ilk saldırı en yakın dosta' : ''}.` };
  if (d > n) return [note];
  const api = strikeApi();
  const ally = Object.values(state.combatants).filter((o) => o.id !== c.id && o.side === c.side && o.hp > 0 && !!o.pos && !o.summon?.gone)
    .sort((x, y) => distance(x.pos as Offset, c.pos as Offset) - distance(y.pos as Offset, c.pos as Offset) || x.id.localeCompare(y.id))[0];
  if (!api || !ally || !api.can(state, c.id, ally.id)) return [note, { type: 'map_note', text: `${c.name}: erişimde dost yok, saldırı boşa gider.` }];
  return [note, ...api.strike(state, c.id, ally.id, rng), { type: 'action_used', actorId: c.id, kind: 'action', what: 'Cosmic Madness' }];
}

registerTurnStart(madnessEvents);

/** Yakın dövüşle isabet edene karşı hasar (hedefin `meleeRetaliate` etkisi; hedef ayakta olmasa da gövdesine dokunuldu). */
export function retaliateEvents(state: BattleState, attackerId: string, targetId: string, info: { melee: boolean; hit: boolean }, rng: Rng): BattleEvent[] {
  if (!katalog109On(state) || !info.melee || !info.hit) return [];
  const a = state.combatants[attackerId];
  const t = state.combatants[targetId];
  if (!a || !t || a.hp <= 0 || a.side === t.side) return [];
  const r = fxOf(t).find((f) => f.meleeRetaliate)?.meleeRetaliate;
  return r ? [damageEffect(a, 'katalog109', `${t.name}: dokunana ${r.type}`, { dice: r.dice, type: r.type }, rng)] : [];
}

/** Star Mark taşıyan görünmez olamaz: Invisible durumu ve onu veren süren etkiler düşer. */
export function starMarkEvents(state: BattleState): BattleEvent[] {
  if (!katalog109On(state)) return [];
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    if (!fxOf(c).some((f) => f.starMark)) continue;
    if (c.conditions.includes('Invisible')) out.push({ type: 'map_effect', rule: 'katalog109', targetId: c.id, text: `${c.name}: Star Mark (görünmez olamaz)`, removeCondition: 'Invisible' });
    for (const e of c.effects ?? []) if (e.grants?.includes('Invisible')) out.push({ type: 'effect_ended', targetId: c.id, effectId: e.id, name: e.name, reason: 'dispelled' });
  }
  return out;
}

registerAfterAttack((s, a, t, info, rng) => retaliateEvents(s, a, t, info, rng));
registerCommandEnd((_b, next) => starMarkEvents(next));

const NEGATIVE = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Paralyzed', 'Poisoned', 'Prone', 'Restrained', 'Stunned'];

/** LR kullanan (`bonusDice` kaynağı legendaryResistance) `lrCleanse` sahibinin bir olumsuz durumunu/etkisini siler. */
export function lrCleanseEvents(next: BattleState, events: BattleEvent[]): BattleEvent[] {
  if (!katalog109On(next)) return [];
  const users = new Set<string>();
  for (const e of events) {
    const dice = (e as { bonusDice?: Array<{ resource?: string; holderId?: string }> }).bonusDice;
    for (const d of dice ?? []) if (d.resource === 'legendaryResistance' && d.holderId) users.add(d.holderId);
  }
  const out: BattleEvent[] = [];
  for (const id of users) {
    const c = next.combatants[id];
    if (!c || c.hp <= 0 || !gucOf(next, c.monsterId)?.lrCleanse) continue;
    const fx = (c.effects ?? []).find((e) => e.sourceId !== c.id && (e.grants?.some((g) => NEGATIVE.includes(g)) || (e.dice?.sign ?? 1) < 0 || (e.ac ?? 0) < 0));
    const cond = c.conditions.find((x) => NEGATIVE.includes(x));
    if (fx) out.push({ type: 'effect_ended', targetId: c.id, effectId: fx.id, name: fx.name, reason: 'dispelled' });
    else if (cond) out.push({ type: 'map_effect', rule: 'katalog109', targetId: c.id, text: `${c.name}: Legendary Resistance (${cond} silindi)`, removeCondition: cond });
  }
  return out;
}

/** Crystal Shell: büyünün hedefi `reflectSpell` taşıyıp save'i geçtiyse aynı büyü atıcının kendisine (slotsuz) yapılır. */
export function reflectEvents(next: BattleState, events: BattleEvent[], rng: Rng): BattleEvent[] {
  if (!katalog109On(next)) return [];
  const out: BattleEvent[] = [];
  let cur = next;
  for (const [i, e] of events.entries()) {
    if (e.type !== 'spell_cast' || !e.targetId || e.countered) continue;
    const t = cur.combatants[e.targetId];
    const caster = cur.combatants[e.actorId];
    if (!t || !caster || caster.id === t.id || caster.hp <= 0 || !fxOf(t).some((f) => f.reflectSpell)) continue;
    const saved = events.slice(i + 1).find((x) => (x.type === 'save_resolved' && x.targetId === t.id) || (x.type === 'map_effect' && x.targetId === t.id && !!x.roll));
    const ok = saved?.type === 'save_resolved' ? saved.success : saved?.type === 'map_effect' ? !!saved.roll?.success : false;
    if (!ok) continue;
    const evs = castWithoutAction(cur, caster, e.label, { targetId: caster.id }, rng, { ...(e.slotLevel ? { level: e.slotLevel } : {}) });
    if (!evs?.length) continue;
    const back = [{ type: 'map_note', text: `${t.name}: Spell-Reflecting Crystal Shell (${e.label} ${caster.name}'a sekti).` } as BattleEvent, ...evs];
    out.push(...back);
    cur = applyEvents(cur, back);
  }
  return out;
}

/** Out-of-Time Storm: turda bir kez isabeti iptal eder (tepki harcanmaz). */
export function negateHit(state: BattleState, ctx: HitContext): { events: BattleEvent[]; name: string } | null {
  if (!katalog109On(state) || !fxOf(ctx.target).some((f) => f.negateOnce)) return null;
  const mark = 'k109:negate';
  const key = `r${state.round}`;
  if (ctx.target.traitTurns?.[mark] === key) return null;
  return { events: [{ type: 'trait_turn', actorId: ctx.target.id, trait: mark, key }, { type: 'map_note', text: `${ctx.target.name}: Out-of-Time Storm (${ctx.label} iptal).` }], name: 'Out-of-Time Storm' };
}

registerCommandEnd((_b, next, events, _cmd, rng) => [...lrCleanseEvents(next, events), ...reflectEvents(next, events, rng)]);
registerAllyHit((s, ctx) => negateHit(s, ctx));
