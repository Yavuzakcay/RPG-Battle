/**
 * Kuyruk 19 (görev 4): Epic Boon feat'lerinin savaş etkileri (SRD 5.2.1); hepsi `featuresK19` Game Master anahtarına
 * bağlı. Durum bilmeyen zar yollarında anahtar savaşçıda `k19Traits` (reducer `syncAuras` yazar).
 * - Combat Prowess / Peerless Aim (`peerless-aim`): ıskalanan saldırı isabet olur; sonraki turunun başına dek bir kez
 *   (kaynak `peerlessAim`, kendi turunda dolar).
 * - Dimensional Travel / Blink Steps (`blink-steps`): Attack ya da Magic eyleminden sonra 30 ft ışınlanma (eylemsiz;
 *   kaynak `blinkSteps`, kendi turunda dolar).
 * - Fate / Improve Fate (`improve-fate`): 60 ft içindeki dostun başarısız D20 Testine +2d4, düşmanın başarılı D20 Testine
 *   −2d4 (yalnızca sonucu değiştirecekse; savaş başına bir, kaynak `improveFate`).
 * - Irresistible Offense (`overcome-defenses`): verdiği Bludgeoning/Piercing/Slashing hasarı direnci yok sayar; doğal
 *   20'de artırılan yetenek skoru kadar ek hasar (`boonScore`).
 * - Spell Recall / Free Casting (`free-casting`): 1–4. seviye slotla büyüde 1d4; slot seviyesine eşitse slot geri gelir.
 * - Night Spirit (`night-spirit`): loş ışık ya da karanlıkta bonus eylemle Invisible (eylem/bonus/tepkiyle biter),
 *   Psychic ve Radiant dışındaki hasarlara direnç.
 * - Truesight (`boon-truesight`): 60 ft Truesight.
 */
import { distance } from '../rules/hex';
import { hasDarkness, inShadowAt } from './maprules';
import { globalRule } from './ruleControl';
import { resourceLeft, type BattleEvent, type BattleState, type Combatant } from './types';

export const BOON_TURN_REFILL: Record<string, string> = { 'peerless-aim': 'peerlessAim', 'blink-steps': 'blinkSteps' };
const on = (state: BattleState) => !!globalRule(state, 'featuresK19');

/** Savaş başında boon kaynakları (Improve Fate inisiyatifte yenilenir). */
export function boonResources(traits: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [t, r] of Object.entries(BOON_TURN_REFILL)) if (traits.includes(t)) out[r] = 1;
  if (traits.includes('improve-fate')) out.improveFate = 1;
  return out;
}

/** Yaratık loş ışıkta ya da karanlıkta mı (karanlık/gece haritasında ışıksız altıgen). */
export function inShadow(state: BattleState, c: Combatant): boolean {
  if (!c.pos || !hasDarkness(state)) return false;
  // Kuyruk K67a (sürüm 51): loş ışık da gölge sayılır (`inShadowAt`).
  return inShadowAt(state, c.pos);
}

/** Night Spirit'in Shadowy Form direnci (Psychic ve Radiant dışı). */
export const SHADOW_RESIST = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'slashing', 'thunder'];
export function shadowyFormResist(state: BattleState, c: Combatant): string[] {
  return on(state) && c.traits?.includes('night-spirit') && c.hp > 0 && inShadow(state, c) ? SHADOW_RESIST : [];
}

/** Improve Fate: 60 ft içindeki (kendisi dahil) boon sahibi ve kaynağı kalmış; dost için ve düşman için ayrı. */
export function fateHolder(state: BattleState, c: Combatant, ally: boolean): string | undefined {
  if (!on(state) || !c.pos) return undefined;
  return Object.values(state.combatants).find((h) => h.hp > 0 && h.traits?.includes('improve-fate') && resourceLeft(h, 'improveFate') > 0
    && (ally ? h.side === c.side : h.side !== c.side) && !!h.pos && (h.id === c.id || distance(h.pos, c.pos as NonNullable<Combatant['pos']>) <= 12))?.id;
}

/** Free Casting: harcanan 1–4. seviye slot d4 tutarsa geri gelir. */
export function freeCastingEvents(state: BattleState, actorId: string, events: BattleEvent[], roll: () => number): BattleEvent[] {
  const a = state.combatants[actorId];
  if (!a || !on(state) || !a.traits?.includes('free-casting')) return [];
  const spent = events.find((e): e is Extract<BattleEvent, { type: 'slot_spent' }> => e.type === 'slot_spent' && e.actorId === actorId);
  if (!spent || spent.level > 4) return [];
  return roll() === spent.level ? [{ type: 'slot_created', actorId, level: spent.level }] : [];
}
