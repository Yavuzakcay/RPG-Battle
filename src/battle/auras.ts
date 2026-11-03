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
/** Kuyruk 19 (11–20): durum bilmeyen yollarda `featuresK19` gereken işaretler (savaşçıda `k19Traits`). */
const K19_SYNC = ['peerless-skill', 'improved-primal-strike', 'improved-blessed-strikes', 'arcane-apotheosis'];
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

/** Kuyruk 19: Aura of Life: taşıyan ve menzilindeki dostlar için dirençler. */
export function auraResistOf(state: BattleState, c: Combatant): string[] {
  if (!c.pos) return [];
  const out = new Set<string>();
  for (const p of Object.values(state.combatants)) {
    if (p.side !== c.side || p.hp <= 0 || !p.pos) continue;
    for (const e of p.effects ?? []) if (e.auraLife && gap(state, p, c) * 5 <= e.auraLife.radiusFt) for (const r of e.auraLife.resist) out.add(r);
  }
  // Kuyruk 19 (11–20): Nature's Sanctuary: alandaki dostlara Nature's Ward direnci.
  for (const z of state.map?.zones ?? []) {
    if (z.side === c.side && z.spec?.resist?.length && z.hexes.some((h) => h.col === c.pos?.col && h.row === c.pos?.row)) for (const r of z.spec.resist) out.add(r);
  }
  return [...out].sort();
}

export function syncAuras(state: BattleState): BattleState {
  const on = !!globalRule(state, 'auraOfProtection');
  const charmOn = !!globalRule(state, 'countercharm');
  // Kuyruk 19 (karar 1): özellik işaretli savaşçıda Bardic Inspiration zarı ikinci şans listesinden düşmesin (kural sürümü 16).
  const inspireOn = !!globalRule(state, 'bardicInspirationFix');
  // Kuyruk 19 (11–20): devlet bilmeyen zar yollarında (ikinci şans) `featuresK19` anahtarı savaşçıda işaret olarak.
  const k19On = !!globalRule(state, 'featuresK19');
  const anyLife = Object.values(state.combatants).some((c) => c.effects?.some((e) => e.auraLife)) || !!state.map?.zones?.some((z) => z.spec?.resist?.length);
  let next = state;
  for (const c of Object.values(state.combatants)) {
    const want = on ? auraSaveOf(state, c) : 0;
    const by = charmOn ? countercharmOf(state, c) : undefined;
    const fix = inspireOn && !!c.traits?.length && (c.effects ?? []).some((e) => e.inspire);
    const life = anyLife ? auraResistOf(state, c) : [];
    const k19 = k19On && !!c.traits?.some((x) => K19_SYNC.includes(x));
    if ((c.auraSave ?? 0) === want && c.countercharmBy === by && !!c.inspireFix === fix && (c.auraResist ?? []).join() === life.join() && !!c.k19Traits === k19) continue;
    const { auraSave: _a, countercharmBy: _b, inspireFix: _c, auraResist: _d, k19Traits: _e, ...rest } = next.combatants[c.id] as Combatant;
    next = { ...next, combatants: { ...next.combatants, [c.id]: { ...rest, ...(want > 0 ? { auraSave: want } : {}), ...(by ? { countercharmBy: by } : {}),
      ...(fix ? { inspireFix: true } : {}), ...(life.length ? { auraResist: life } : {}), ...(k19 ? { k19Traits: true } : {}) } as Combatant } };
  }
  return next;
}
