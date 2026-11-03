/**
 * Kuyruk 19: Arcane Hand (SRD 5.2.1) tam hâli (anahtar `spellsK19`, kural sürümü 16). El kendi turunda oynamaz: sahibi
 * bonus eylemle 60 ft taşır (`summon_move`) ve ardından bir etki seçer (`hand`): Clenched Fist (yakın büyü saldırısı,
 * 5d8 Force), Forceful Hand (STR save, 5 + 5 × değiştirici ft itme, el hedefle gider), Grasping Hand (DEX save, Grappled,
 * kaçış DC = büyü DC'si), crush (yakaladığına 4d6 + değiştirici Bludgeoning; bonus eylem, taşımasız) ya da Interposing
 * Hand (sahibine elin altıgeninden gelen ya da içinden geçen etkilere yarım siper; altıgen düşmanlara zorlu arazi).
 * El yer kaplamaz (`noSpace`).
 */
import { adjustDamage } from '../rules/damage';
import { resolveSave } from '../rules/attack';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { distance, line, sameHex, type Offset } from '../rules/hex';
import { damageProfile } from './common';
import { damageEffects } from './damage-effects';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
import { pushAwayEvents } from './forced';
import { strikeApi } from './reactions';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant } from './types';

export type HandEffect = 'fist' | 'force' | 'grasp' | 'crush' | 'interpose';
export const HAND_EFFECTS: HandEffect[] = ['fist', 'force', 'grasp', 'crush', 'interpose'];
const INTERPOSE = 'arcane-hand:interpose';

export const isHand = (c: Combatant | undefined) => !!c?.summon && c.summon.spellId === 'arcane-hand' && !!c.summon.hand;

/** Elin etkisi; hedef gerekenlerde `targetId` (elin 5 ft içinde). Hata metni ya da olaylar. */
export function handEffectEvents(state: BattleState, owner: Combatant, hand: Combatant, effect: HandEffect, targetId: string | undefined, rng: Rng): BattleEvent[] | string {
  const out: BattleEvent[] = [];
  // Önceki Interposing kalkar (her kullanımda tek etki).
  if ((hand.effects ?? []).some((e) => e.id === INTERPOSE)) out.push({ type: 'effect_ended', targetId: hand.id, effectId: INTERPOSE, name: 'Interposing Hand', reason: 'expired' });
  if (effect === 'interpose') {
    out.push({ type: 'effect_added', targetId: hand.id, effect: { id: INTERPOSE, name: 'Interposing Hand', sourceId: owner.id, interpose: true, icon: '✋' } });
    return out;
  }
  const t = targetId ? state.combatants[targetId] : undefined;
  if (!t?.pos || !hand.pos || t.hp <= 0) return 'Elin hedefi yok.';
  if (distance(t.pos, hand.pos) > 1) return 'Hedef elin 5 ft içinde olmalı.';
  const dc = owner.spellSaveDc ?? 10;
  const mod = owner.spellMod;
  if (effect === 'fist') {
    const api = strikeApi();
    return api ? [...out, ...api.strike(state, hand.id, t.id, rng, 'Clenched Fist')] : 'Saldırı yok.';
  }
  if (t.size === 'G') return 'Gargantuan yaratık etkilenmez.';
  if (effect === 'crush') {
    if (t.grapple?.by !== hand.id) return 'El bu yaratığı yakalamıyor.';
    const d = rollDice(`4d6${mod ? `+${mod}` : ''}`, rollTag(rng, { kind: 'damage', by: owner.id }));
    const adj = adjustDamage(d.total, 'bludgeoning', damageProfile(t));
    const fx = damageEffects(t, adj.amount, 'bludgeoning', false, rng);
    return [...out, { type: 'effect_tick', targetId: t.id, effectId: 'spells:arcane-hand', name: 'Grasping Hand: ezme', damageRolls: d.rolls, appliedDamage: adj.amount, damageType: 'bludgeoning', targetHpAfter: fx.hpAfter, effects: fx.effects }];
  }
  const ability = effect === 'force' ? 'str' : 'dex';
  const r = resolveSave({ extra: saveDice(t, ability), modifier: t.saves[ability], dc, mode: saveMode('normal', t, ability) }, rollTag(rng, { by: t.id }));
  out.push({ type: 'map_note', text: `${t.name}: ${ability.toUpperCase()} save ${r.total}/${dc} — ${r.success ? 'direndi' : effect === 'force' ? 'itildi' : 'yakalandı'}` });
  if (r.success) return out;
  if (effect === 'grasp') {
    out.push({ type: 'grappled', targetId: t.id, by: hand.id, escapeDc: dc, restrained: false, label: 'Grasping Hand' });
    return out;
  }
  const pushed = pushAwayEvents(applyEvents(state, out), hand.pos, t.id, 5 + 5 * Math.max(0, mod), hand.id, rng);
  out.push(...pushed);
  // El hedefle gider: hedefin son adımının çıktığı altıgen.
  const last = [...pushed].reverse().find((e) => e.type === 'pushed' && e.targetId === t.id) as Extract<BattleEvent, { type: 'pushed' }> | undefined;
  if (last && !sameHex(last.from, hand.pos)) out.push({ type: 'pushed', targetId: hand.id, from: hand.pos, to: last.from, by: hand.id });
  return out;
}

/** Interposing Hand: sahibine, elin altıgeninden gelen ya da içinden geçen etkilere yarım siper. */
export function interposeCover(state: BattleState, origin: Offset, target: Combatant): boolean {
  if (!target.pos) return false;
  return Object.values(state.combatants).some((h) => h.pos && h.hp > 0 && h.summon?.by === target.id && (h.effects ?? []).some((e) => e.interpose)
    && (sameHex(h.pos, origin) || line(origin, target.pos as Offset).slice(1, -1).some((x) => sameHex(x, h.pos as Offset))));
}

/** Interposing Hand: elin altıgeni sahibinin düşmanlarına zorlu arazi. */
export function interposeCost(state: BattleState, mover: Combatant, h: Offset): number {
  return Object.values(state.combatants).some((c) => c.pos && sameHex(c.pos, h) && c.hp > 0 && c.side !== mover.side && (c.effects ?? []).some((e) => e.interpose)) ? 2 : 1;
}
