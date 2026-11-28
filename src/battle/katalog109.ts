/**
 * Görev KATALOG-GUC-TAM (kural sürümü 109): katalog güçlerinin motor kancaları. Veri `data/katalog-gucler.json`
 * (`katalog109Data.ts`), etki alanları `ActiveEffect.k109` (`katalog109Types.ts`). Kodda canavar adıyla koşul yok.
 * - Cosmic Madness (`madAlly`): tur başında d6 ≤ N ise ilk saldırısını en yakın dostuna yapar (yakın dövüş erişimindeyse),
 *   eylemi harcanır.
 * - Yakın dövüşte karşı hasar (`meleeRetaliate`): isabet eden yakın dövüş saldırısının sahibine zar (Hydraxe asidi).
 * - Star Mark (`starMark`): görünmez olamaz (komut sonunda Invisible ve onu veren etki düşer); konsantrasyon bonusu yok
 *   (`damage-effects.ts`).
 * 108 ve altında etkiler hiç oluşmaz (veri okunmaz), kancalar boş döner. Saf; `rng` enjekte.
 */
import { distance, type Offset } from '../rules/hex';
import { rollDie, rollTag, type Rng } from '../rules/dice';
import { isIncapacitated } from '../rules/conditions';
import { katalog109On } from './katalog109Surum';
import { registerAfterAttack, strikeApi } from './reactions';
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
