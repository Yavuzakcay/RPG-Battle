/**
 * Kuyruk 18 H3: Paladin Aura of Protection'ın dostlara uzanması (SRD 5.2.1). Paladin ve 10 ft (18. seviyede Aura
 * Expansion: 30 ft) içindeki dostları save'lerine Paladin'in CHA değiştiricisini (en az +1) ekler; Paladin Incapacitated
 * iken aura etkisiz. Birden çok Paladin'de yalnızca en büyüğü. Paladin'in kendi bonusu sheet'ten (Kuyruk 39, `saves`
 * içinde); burada yalnızca fark yazılır. Tek yer: reducer sonrası `syncAuras` her savaşçıya `auraSave` yazar,
 * `saveDice` (bütün save'lerin ortak eklentisi) sabit eklenti olarak okur. Game Master anahtarı `auraOfProtection`
 * (global, kural sürümü 14); kapalıyken yalnızca Paladin'in kendi bonusu.
 */
import { isIncapacitated } from '../rules/conditions';
import { gap } from './body';
import { globalRule } from './ruleControl';
import type { BattleState, Combatant } from './types';

const TRAIT = 'aura-of-protection';
const radiusOf = (p: Combatant): number => ((p.level ?? 0) >= 18 ? 6 : 2);
const bonusOf = (p: Combatant): number => Math.max(1, p.modifiers.cha);

/** Savaşçının bu durumdaki aura bonusu (kendi bonusu sheet'te sayılan Paladin için yalnızca fazlası). */
export function auraSaveOf(state: BattleState, c: Combatant): number {
  if (c.hp <= 0 || !c.pos) return 0;
  let best = 0;
  for (const p of Object.values(state.combatants)) {
    if (p.id === c.id || p.side !== c.side || p.hp <= 0 || !p.pos || !p.traits?.includes(TRAIT) || isIncapacitated(p.conditions)) continue;
    if (gap(state, p, c) > radiusOf(p)) continue;
    best = Math.max(best, bonusOf(p));
  }
  const own = c.traits?.includes(TRAIT) ? bonusOf(c) : 0;
  return Math.max(0, best - own);
}

/**
 * Kuyruk 18 H3: Countercharm (Bard 7): 30 ft içindeki (kendisi dahil) Bard; tepkisi hazır, Incapacitated değil.
 * Anahtar `countercharm` (global, kural sürümü 14).
 */
export function countercharmOf(state: BattleState, c: Combatant): string | undefined {
  if (c.hp <= 0 || !c.pos) return undefined;
  return Object.values(state.combatants).find((b) => b.side === c.side && b.hp > 0 && !!b.pos && b.traits?.includes('countercharm')
    && !b.economy.reaction && !isIncapacitated(b.conditions) && (b.id === c.id || gap(state, b, c) <= 6))?.id;
}

export function syncAuras(state: BattleState): BattleState {
  const on = !!globalRule(state, 'auraOfProtection');
  const charmOn = !!globalRule(state, 'countercharm');
  let next = state;
  for (const c of Object.values(state.combatants)) {
    const want = on ? auraSaveOf(state, c) : 0;
    const by = charmOn ? countercharmOf(state, c) : undefined;
    if ((c.auraSave ?? 0) === want && c.countercharmBy === by) continue;
    const { auraSave: _a, countercharmBy: _b, ...rest } = next.combatants[c.id] as Combatant;
    next = { ...next, combatants: { ...next.combatants, [c.id]: { ...rest, ...(want > 0 ? { auraSave: want } : {}), ...(by ? { countercharmBy: by } : {}) } as Combatant } };
  }
  return next;
}
