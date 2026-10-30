/**
 * Görev A4: tasma (hareket sınırı). Süreli etkide `leash: { centerId, radius }` (altıgen): yaratık merkezdeki
 * yaratıktan `radius` altıgenden daha uzağa kendi hareketiyle gidemez (zaten dışarıdaysa uzaklaşamaz, yaklaşabilir).
 * Merkez ölür ya da kaybolursa sınır kalkar. Kaynak veride: özellik etkisi `kind: 'leash'` (WIS save'li; dış içerikteki
 * Biat Yemini gibi alt sınıf özellikleri) ya da büyü etkisi `mechanics.effect.leash`. Yürüme maliyeti (`moveCostFn`),
 * atlama, yapay zekâ ve arayüz aynı denetimi kullanır. Saf modül.
 */
import { resolveSave } from '../rules/attack';
import { rollTag, type Rng } from '../rules/dice';
import { distance, type Offset } from '../rules/hex';
import { saveDice } from './effectDice';
import { saveMode } from './durations';
import { resourceLeft, type BattleEvent, type BattleState, type Combatant, type UsableFeature } from './types';

export const LEASH = 'leash';

/** Yaratığın şu anki tasması: merkezin konumu ve yarıçap (altıgen); yoksa null. En dar olan geçerli. */
export function leashOf(state: BattleState, c: Pick<Combatant, 'effects'>): { center: Offset; radius: number } | null {
  let best: { center: Offset; radius: number } | null = null;
  for (const e of c.effects ?? []) {
    if (!e.leash) continue;
    const m = state.combatants[e.leash.centerId];
    if (!m?.pos || m.life === 'dead' || m.summon?.gone) continue;
    if (!best || e.leash.radius < best.radius) best = { center: m.pos, radius: e.leash.radius };
  }
  return best;
}

/** Bu adım tasmayı aşar mı: hedef altıgen sınırın dışında ve merkeze öncekinden uzak. */
export function leashBlocks(leash: { center: Offset; radius: number } | null, h: Offset, prev: Offset): boolean {
  if (!leash) return false;
  const d = distance(h, leash.center);
  return d > leash.radius && d > distance(prev, leash.center);
}

/** Özelliğin hedefi uygun mu (`kind: 'leash'`): sorun yoksa null. */
export function leashProblem(state: BattleState, actor: Combatant, f: UsableFeature, targetId: string | undefined): string | null {
  const e = f.effect;
  if (e.kind !== 'leash') return null;
  if (!targetId) return 'Bir hedef seçmelisin.';
  const t = state.combatants[targetId];
  if (!t || t.side === actor.side || t.hp <= 0 || t.summon?.intangible) return 'Ayakta bir düşman seçmelisin.';
  if (state.map && actor.pos && t.pos && distance(actor.pos, t.pos) * 5 > e.rangeFt) return `${e.rangeFt} ft içinde olmalı.`;
  return null;
}

/** Özellik: hedef save atar; başarısızsa süreli tasma (merkez: kullanan). */
export function leashEvents(state: BattleState, actor: Combatant, f: UsableFeature, targetId: string, rng: Rng): BattleEvent[] {
  const e = f.effect;
  if (e.kind !== 'leash') return [];
  const t = state.combatants[targetId] as Combatant;
  const out: BattleEvent[] = [];
  if (f.resource) out.push({ type: 'feature_used', actorId: actor.id, feature: f.resource, remaining: resourceLeft(actor, f.resource) - 1 });
  const dc = actor.spellSaveDc ?? 8 + actor.proficiency + actor.modifiers.cha;
  const save = resolveSave({ extra: saveDice(t, e.save), modifier: t.saves[e.save], dc, mode: saveMode('normal', t, e.save) }, rollTag(rng, { by: t.id }));
  out.push({ type: 'save_resolved', actorId: actor.id, targetId: t.id, label: f.name, ability: e.save, dc, mode: 'normal', reasons: [],
    d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
    damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: t.hp, effects: [], conditionsAdded: [],
    ...(save.extra ? { bonusDice: save.extra } : {}) });
  if (!save.success) {
    out.push({ type: 'effect_added', targetId: t.id, effect: { id: `${LEASH}:${f.key}`, name: f.name, sourceId: actor.id, until: state.round + e.rounds - 1,
      leash: { centerId: actor.id, radius: Math.floor(e.radiusFt / 5) }, icon: '⛓' } });
  }
  return out;
}
