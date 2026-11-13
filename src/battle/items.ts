/**
 * Savaşta sarf eşyası (SRD 5.2.1; veri `data/items.json` `use`). Envanter savaşçıda `consumables` (adet); olay
 * `item_used` adedi azaltır. Türler:
 * - `heal` (Kuyruk 43): iksir, bonus eylem, kendine ya da 5 ft içindeki dosta iyileşme.
 * - `effect` (Kuyruk 19): içilen/uygulanan iksir ya da Antitoxin: süreli etki, geçici HP ya da (Potion of Poison) hasar.
 * - `throw` (Kuyruk 19): Attack eyleminde bir saldırının yerine fırlatma (Acid, Alchemist's Fire, Holy Water, Net):
 *   hedef save (DC 8 + DEX + PB ya da sabit), hasar/durum, yanma (`ongoing`), ağdan kurtulma (`escapeCheck`).
 * - `coat` (Kuyruk 19): Basic Poison: sonraki isabetlere ek hasar (1 dakika ya da hasar verene dek).
 * Kuyruk 19 eklentileri `srdK19` Game Master anahtarına bağlı.
 */
import { healRoll } from './healMax';
import { items } from '../data';
import { resolveSave } from '../rules/attack';
import { adjustDamage } from '../rules/damage';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { distance } from '../rules/hex';
import { damageProfile, fail, finish, isTargetable, type CommandResult } from './common';
import { damageEffects } from './damage-effects';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
import { globalRule } from './ruleControl';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from './types';

/** Kullanılabilecek sarf eşyaları (adı, adedi). */
export function consumablesOf(c: Combatant): Array<{ id: string; name: string; count: number }> {
  return Object.entries(c.consumables ?? {}).filter(([, n]) => n > 0)
    .map(([id, count]) => ({ id, name: items.find((i) => i.id === id)?.name ?? id, count }));
}

/** Eşya bu hedefe kullanılabilir mi (sorun yoksa null). */
export function useItemProblem(state: BattleState, actor: Combatant, itemId: string, targetId: string): string | null {
  const it = items.find((i) => i.id === itemId);
  if (!it?.use) return 'Bu eşya savaşta kullanılmaz.';
  if ((actor.consumables?.[itemId] ?? 0) <= 0) return `${it.name} kalmadı.`;
  const u = it.use;
  if (u.kind !== 'heal' && !globalRule(state, 'srdK19')) return `${it.name} bu kural sürümünde ya da Game Master ayarında kullanılmaz.`;
  const t = state.combatants[targetId];
  if (!t || t.life === 'dead' || t.summon?.gone) return 'Hedef yok.';
  if (u.kind === 'throw') {
    if (t.side === actor.side) return 'Fırlatma bir düşmana.';
    if (!isTargetable(t)) return 'Hedef alınamaz.';
    if (state.map && (!t.pos || !actor.pos || distance(t.pos, actor.pos) * 5 > u.rangeFt)) return `Hedef ${u.rangeFt} ft içinde olmalı.`;
    return null;
  }
  if (u.kind === 'coat') return t.id === actor.id ? null : 'Silahını zehirlemek için kendini seç.';
  if (t.side !== actor.side) return 'Yalnızca kendine ya da bir dosta.';
  if (t.id !== actor.id && state.map && (!t.pos || !actor.pos || distance(t.pos, actor.pos) * 5 > u.reachFt)) return `Hedef ${u.reachFt} ft içinde olmalı.`;
  return null;
}

export function executeUseItem(state: BattleState, actor: Combatant, itemId: string, targetId: string, rng: Rng): CommandResult {
  const why = useItemProblem(state, actor, itemId, targetId);
  if (why) return fail(why);
  const it = items.find((i) => i.id === itemId)!;
  const u = it.use!;
  const t = state.combatants[targetId] as Combatant;
  const events: BattleEvent[] = [{ type: 'item_used', actorId: actor.id, itemId, name: it.name, targetId, left: (actor.consumables?.[itemId] ?? 1) - 1 }];
  if (u.kind === 'heal') {
    const roll = { total: healRoll(state, t, u.dice, rng, actor.id) };
    const amount = Math.max(0, Math.min(roll.total, t.maxHp - t.hp));
    events.push({ type: 'healed', actorId: actor.id, targetId, label: it.name, amount, targetHpAfter: t.hp + amount });
    return finish(state, events);
  }
  if (u.kind === 'coat') {
    events.push({ type: 'effect_added', targetId: actor.id, effect: { id: `item:${itemId}`, name: it.name, sourceId: actor.id, until: state.round + u.rounds - 1,
      coated: { dice: u.dice, type: u.damageType }, icon: '🧪' } });
    return finish(state, events);
  }
  if (u.kind === 'effect') {
    if (u.damage) {
      // Potion of Poison: içen CON save (başarıda yarı) ve Poisoned.
      const save = u.save ? resolveSave({ extra: saveDice(t, u.save.ability), modifier: t.saves[u.save.ability], dc: u.save.dc, mode: saveMode('normal', t, u.save.ability) }, rollTag(rng, { by: t.id })) : null;
      const d = rollDice(u.damage, rollTag(rng, { kind: 'damage' }));
      const raw = save?.success ? Math.floor(d.total / 2) : d.total;
      const adj = adjustDamage(raw, u.damageType, damageProfile(t));
      const fx = damageEffects(t, adj.amount, u.damageType ?? '', false, rng);
      events.push({ type: 'effect_tick', targetId: t.id, effectId: `item:${itemId}`, name: it.name, damageRolls: d.rolls, appliedDamage: adj.amount, damageType: u.damageType ?? '', targetHpAfter: fx.hpAfter, effects: fx.effects });
      if (save?.success) return finish(state, events);
    }
    if (u.tempHp) events.push({ type: 'temp_hp', targetId: t.id, amount: rollDice(u.tempHp, rollTag(rng, { by: actor.id, kind: 'heal' })).total, label: it.name });
    if (u.effect) {
      events.push({ type: 'effect_added', targetId: t.id, effect: { ...(u.effect as Partial<ActiveEffect>), id: `item:${itemId}`, name: it.name, sourceId: actor.id, until: state.round + u.rounds - 1 } });
    }
    return finish(state, events);
  }
  // Fırlatma: save'li hasar/durum.
  const dc = u.dc ?? 8 + actor.modifiers.dex + actor.proficiency;
  const save = resolveSave({ extra: saveDice(t, u.save), modifier: t.saves[u.save], dc, mode: saveMode('normal', t, u.save, actor, { ...(u.damageType ? { damage: u.damageType } : {}), ...(u.grants?.length ? { against: u.grants } : {}), genis: true }) }, rollTag(rng, { by: t.id }));
  const typeOk = !u.vs || u.vs.includes((t.creatureType ?? '').toLowerCase());
  const d = !save.success && u.damage && typeOk ? rollDice(u.damage, rollTag(rng, { kind: 'damage', by: actor.id })) : { rolls: [] as number[], total: 0 };
  const adj = d.total > 0 ? adjustDamage(d.total, u.damageType, damageProfile(t)) : { amount: 0, note: null };
  const fx = damageEffects(t, adj.amount, u.damageType ?? '', false, rng);
  events.push({
    type: 'save_resolved', actorId: actor.id, targetId: t.id, label: it.name, ability: u.save, dc, mode: 'normal', reasons: [],
    d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
    damageRolls: d.rolls, rawDamage: d.total, appliedDamage: adj.amount, damageType: u.damageType ?? '', damageNote: adj.note,
    targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: [], ...(save.extra ? { bonusDice: save.extra } : {}),
  });
  if (!save.success && fx.hpAfter > 0 && (u.grants?.length || u.burning)) {
    events.push({ type: 'effect_added', targetId: t.id, effect: { id: `item:${itemId}:${actor.id}`, name: it.name, sourceId: actor.id,
      ...(u.grants?.length ? { grants: u.grants } : {}), ...(u.escapeDc ? { escapeCheck: { dc: u.escapeDc } } : {}),
      // Yanma (SRD 5.2.1 Burning): tur başında hasar; DEX save (DC 10) ile söner.
      ...(u.burning ? { ongoing: { dice: u.burning, type: 'fire', save: 'dex', dc: 10 } } : {}), icon: u.burning ? '🔥' : '🕸' } });
  }
  return finish(state, events);
}
