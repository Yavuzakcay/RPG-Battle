/**
 * Görev WARLOCK (SRD 5.2.1; veriden, kodda sınıf adı yok): Eldritch Smite (`eldritch_smite` komutu, `eldritch-smite`
 * işareti) ve Dark One's Blessing (`dark-ones-blessing` işareti; her komutun sonunda). Saf.
 */
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { distance } from '../rules/hex';
import { adjustDamage } from '../rules/damage';
import { fail, finish, type CommandResult } from './common';
import { turnKey } from './economy';
import { damageEffects } from './damage-effects';
import { usedThisTurn } from './classTraits';
import type { BattleEvent, BattleState, Combatant } from './types';

/** Eldritch Smite'ın sorunu (null: yapılabilir). */
export function eldritchSmiteProblem(state: BattleState, actor: Combatant): string | null {
  if (!actor.traits?.includes('eldritch-smite')) return 'Eldritch Smite yok.';
  const hit = actor.economy.meleeHit;
  if (!hit?.pact) return 'Bu tur pact silahıyla isabet yok.';
  if (usedThisTurn(state, actor, 'eldritch-smite')) return 'Eldritch Smite turda bir kez.';
  if (!actor.spellSlots.some((n) => n > 0)) return 'Pact Magic slotu yok.';
  const t = state.combatants[hit.targetId];
  if (!t || t.hp <= 0) return 'Hedef ayakta değil.';
  return null;
}

/**
 * Eldritch Smite: pact silahı isabetinden sonra (bu tur) Pact slotu harcanır: 1d8 + slot seviyesi kadar d8 Force
 * (kritikte zarlar iki katı); hedef Huge ya da küçükse Prone. Eylem harcamaz.
 */
export function executeEldritchSmite(state: BattleState, actor: Combatant, rng: Rng): CommandResult {
  const why = eldritchSmiteProblem(state, actor);
  if (why) return fail(why);
  const hit = actor.economy.meleeHit as NonNullable<Combatant['economy']['meleeHit']>;
  const t = state.combatants[hit.targetId] as Combatant;
  const level = actor.spellSlots.reduce((best, n, i) => (n > 0 ? i + 1 : best), 0);
  const dice = (1 + level) * (hit.critical ? 2 : 1);
  const d = rollDice(`${dice}d8`, rollTag(rng, { kind: 'damage', by: actor.id }));
  const adj = adjustDamage(d.total, 'force', t);
  const fx = damageEffects(t, adj.amount, 'force', false, rng);
  const events: BattleEvent[] = [
    { type: 'slot_spent', actorId: actor.id, level, remaining: (actor.spellSlots[level - 1] ?? 1) - 1 },
    { type: 'extra_damage', actorId: actor.id, targetId: t.id, label: 'Eldritch Smite', rolls: d.rolls, raw: d.total, applied: adj.amount,
      damageType: 'force', damageNote: adj.note, targetHpAfter: fx.hpAfter, effects: fx.effects, traitTurns: { 'eldritch-smite': turnKey(state) } },
  ];
  if (fx.hpAfter > 0 && t.size !== 'G' && !t.conditions.includes('Prone')) {
    events.push({ type: 'condition_changed', targetId: t.id, condition: 'Prone', present: true, reason: 'Eldritch Smite', sourceId: actor.id });
  }
  return finish(state, events);
}

/**
 * Dark One's Blessing (Fiend): bir düşman 0 HP'ye düşünce, düşüren işaretli Warlock'sa ya da düşman onun 10 ft
 * içindeyse CHA + Warlock seviyesi (en az 1) geçici HP. Komutun sonunda, önceki ve sonraki durumu karşılaştırarak.
 */
export function blessingEvents(before: BattleState, after: BattleState, actorId: string | undefined): BattleEvent[] {
  const out: BattleEvent[] = [];
  const holders = Object.values(after.combatants).filter((c) => c.traits?.includes('dark-ones-blessing') && c.hp > 0);
  if (!holders.length) return out;
  const fallen = Object.values(after.combatants).filter((c) => c.hp <= 0 && (before.combatants[c.id]?.hp ?? 0) > 0 && !c.civilian);
  for (const w of holders) {
    const near = (c: Combatant) => !after.map || (!!c.pos && !!w.pos && distance(c.pos, w.pos) <= 2);
    if (!fallen.some((c) => c.side !== w.side && (actorId === w.id || near(c)))) continue;
    const amount = Math.max(1, w.modifiers.cha + w.level);
    if ((w.tempHp ?? 0) < amount) out.push({ type: 'temp_hp', targetId: w.id, amount, label: "Dark One's Blessing" });
  }
  return out;
}
