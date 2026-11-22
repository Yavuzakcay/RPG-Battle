/**
 * Gece kuyruğu Aşama 2 (kural sürümü 101, `karar101Surum.ts`): SRD 5.2.1 karar kalanlarının motor parçaları. Saf; React,
 * DOM ya da `localStorage` yok. Çağıranlar: `features.ts` / `monsters.ts` (Knocking Out), `damage-effects.ts` (Stone's
 * Endurance), `commands.ts` (yakalamayı bırak, kalkan tak/çıkar, iki el denetimi), `reduce.ts` (`syncKarar101`).
 */
import { askChoice } from '../rules/choice';
import { askReaction } from '../rules/reactionChoice';
import { isIncapacitated } from '../rules/conditions';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { weapons } from '../data';
import { karar101On } from './karar101Surum';
import type { AttackOption, BattleEvent, BattleState, Combatant, DamageEffect } from './types';

/** Goliath Stone's Endurance tepkisinin kimliği (create.ts 101+ `anyDamage`). */
export const STONE_ID = 'species:goliath/stones-endurance';

// ---------------------------------------------------------------- Knocking Out (SRD 5.2.1 s. 17, s. 186)

/** Bayıltma seçilince geçersiz kalan hasar sonuçları (0 HP'ye bağlı olanlar). */
const DROP_ON_KO: ReadonlySet<DamageEffect['kind']> = new Set(['dying', 'instant_death', 'death_save_failed', 'regen_pending']);

/**
 * SRD 5.2.1 s. 17 Knocking Out a Creature: "When you would reduce a creature to 0 Hit Points with a melee attack, you can
 * instead reduce the creature to 1 Hit Point and give it the Unconscious condition." Saldırana seçim istemi (`askChoice`,
 * tepki ayarının seçim yolu; öneri null: yapay zekâ ve kancasız Rng bayıltmaz). Seçilirse 1 HP + `knocked_out`.
 */
export function knockOutFx(
  state: BattleState, actor: Combatant, target: Combatant, melee: boolean,
  fx: { hpAfter: number; effects: DamageEffect[] }, rng: Rng,
): { hpAfter: number; effects: DamageEffect[] } {
  if (!karar101On(state) || !melee || fx.hpAfter !== 0 || target.hp <= 0 || target.id === actor.id) return fx;
  const pick = askChoice(rng, {
    actorId: actor.id, sourceId: target.id, label: `Knocking Out: ${target.name}`,
    options: [{ id: 'knockout', label: 'Bayılt: 1 HP + Unconscious' }], suggested: null,
  });
  if (pick !== 'knockout') return fx;
  return { hpAfter: 1, effects: [...fx.effects.filter((e) => !DROP_ON_KO.has(e.kind)), { kind: 'knocked_out', by: actor.id }] };
}

// ---------------------------------------------------------------- Stone's Endurance (SRD 5.2.1 s. 85)

/**
 * "When you take damage, you can take a Reaction to roll 1d12. Add your Constitution modifier to the number rolled and reduce
 * the damage by that total." 101+ savaşta tepki her hasarda (`anyDamage` işareti savaş başında). Tepki hakkı yerel denetimle
 * (`reactions.ts` `canReact`'in eşi: döngüsel içe aktarma olmasın). Öneri: kullan.
 */
export function stoneEnduranceFx(target: Combatant, applied: number, rng: Rng): Extract<DamageEffect, { kind: 'stone_endurance' }> | null {
  if (applied <= 0) return null;
  const spec = target.reactions?.find((r) => r.anyDamage && r.kind === 'reduce' && r.dice);
  if (!spec?.dice) return null;
  if (target.hp <= 0 || target.civilian || target.asleep || target.economy.reaction || target.reactionLocked
    || isIncapacitated(target.conditions) || target.effects?.some((e) => e.noReactions)) return null;
  if (spec.resource && (target.resources[spec.resource] ?? 0) <= 0) return null;
  const ans = askReaction(rng, {
    reactorId: target.id, trigger: 'damaged', info: { damage: applied, label: spec.name },
    options: [{ id: spec.id, name: spec.name }], suggested: { option: spec.id },
  });
  if (ans?.option !== spec.id) return null;
  const roll = Math.max(0, rollDice(spec.dice, rollTag(rng, { kind: 'damage', by: target.id })).total);
  return { kind: 'stone_endurance', reactionId: spec.id, name: spec.name, roll, amount: Math.min(applied, roll), ...(spec.resource ? { resource: spec.resource } : {}) };
}

// ---------------------------------------------------------------- yakalama ve eller (SRD 5.2.1 s. 182, s. 90)

/** Bu yaratığın tuttuğu (Grappled) yaratıklar. */
export const heldBy = (state: BattleState, actor: Combatant): Combatant[] =>
  Object.values(state.combatants).filter((c) => c.id !== actor.id && c.grapple?.by === actor.id && c.conditions.includes('Grappled'));

const weaponOf = (o: AttackOption) => (o.weaponId ? weapons.find((w) => w.id === o.weaponId) : undefined);

/**
 * SRD 5.2.1 s. 182 "One Grapple per Hand" + s. 90 Two-Handed "This weapon requires two hands when you attack with it": yakalama
 * tutan yaratık Two-Handed silahla saldıramaz (Lance binekte serbest: MB1 kuralı ayrı), Versatile silahı tek elle kullanır.
 * Sorun metni ya da (Versatile) tek elli seçenek döner; ilgisizse seçenek aynen.
 */
export function grappleHands(state: BattleState, actor: Combatant, option: AttackOption): { ok: AttackOption } | { problem: string } {
  if (!karar101On(state) || option.spell || option.beast || option.offhand) return { ok: option };
  const w = weaponOf(option);
  if (!w) return { ok: option };
  if (!heldBy(state, actor).length) return { ok: option };
  const thrown = /\(fırlatma\)$/.test(option.label);
  if (w.twoHanded && !w.twoHandedUnlessMounted && !thrown) return { problem: `${option.label}: yakalama tutarken iki elli silah kullanılamaz (önce yakalamayı bırak).` };
  // Versatile iki elle tutuluyorsa tek ele düşer: zar tek elli, Great Weapon Fighting yok.
  if (option.twoHands && !w.twoHanded && w.versatileDamage && option.damage.startsWith(w.versatileDamage)) {
    const { minDie: _m, twoHands: _t, ...rest } = option;
    return { ok: { ...rest, damage: w.damage + option.damage.slice(w.versatileDamage.length),
      ...(option.weaponDamage?.startsWith(w.versatileDamage) ? { weaponDamage: w.damage + option.weaponDamage.slice(w.versatileDamage.length) } : {}) } };
  }
  return { ok: option };
}

/** "You can release the creature at any time (no action required)": eylemsiz bırakma (olay `grapple_ended` `released`). */
export function releaseGrappleEvents(state: BattleState, actor: Combatant, targetId: string): { ok: true; events: BattleEvent[] } | { ok: false; error: string } {
  if (!karar101On(state)) return { ok: false, error: 'Yakalamayı bırakma 101+ savaşta.' };
  const t = state.combatants[targetId];
  if (!t || t.grapple?.by !== actor.id || !t.conditions.includes('Grappled')) return { ok: false, error: 'Bu yaratığı tutmuyorsun.' };
  return { ok: true, events: [{ type: 'grapple_ended', targetId, reason: 'released' }] };
}

// ---------------------------------------------------------------- kalkan tak/çıkar (SRD 5.2.1 s. 92)

/**
 * SRD 5.2.1 s. 92 Shield "Utilize Action to Don or Doff": eylem (Utilize). Kalkan karakterde kalır (savaş sonunda donanım
 * değişmez). Sorun ya da olay.
 */
export function shieldToggleProblem(state: BattleState, actor: Combatant): string | null {
  if (!karar101On(state) || actor.shieldAc === undefined) return 'Takıp çıkarılacak kalkan yok.';
  if (actor.economy.action) return 'Eylem kullanıldı (kalkan tak/çıkar Utilize eylemi).';
  // Kalkan takmak için boş el: yan el silahı ya da tutulan yakalama varsa yok.
  if (actor.shieldOff && (actor.offHandOption || heldBy(state, actor).length > 0)) return 'Kalkanı takmak için boş el gerekir.';
  return null;
}

// ---------------------------------------------------------------- Dropping Prone (SRD 5.2.1 s. 14)

/**
 * "On your turn, you can give yourself the Prone condition without using an action or any of your Speed, but you can't do so if
 * your Speed is 0." Yapay zekâ kullanmaz. Sorun ya da olay.
 */
export function dropProneEvents(state: BattleState, actor: Combatant, speedHexes: number): { ok: true; events: BattleEvent[] } | { ok: false; error: string } {
  if (!karar101On(state)) return { ok: false, error: 'Yere yatma komutu 101+ savaşta.' };
  if (actor.conditions.includes('Prone')) return { ok: false, error: 'Zaten yerde (Prone).' };
  if (speedHexes <= 0) return { ok: false, error: 'Hızı 0: yere yatamaz.' };
  return { ok: true, events: [{ type: 'condition_changed', targetId: actor.id, condition: 'Prone', present: true, reason: 'drop_prone' }] };
}

// ---------------------------------------------------------------- reducer eşlemesi

/**
 * Reducer sonu (101+ olayla oluşan alanlar): (1) bayıltılan HP kazanınca Unconscious biter (SRD "remains Unconscious until it
 * regains any Hit Points"); (2) High Jump koşusu: yürüyüş (`moved`, yerde) kesintisiz altıgenleri sayar, yaratığın başka her
 * olayı sıfırlar ("immediately before").
 */
export function syncKarar101(prev: BattleState, next: BattleState, event: BattleEvent): BattleState {
  if (!karar101On(next)) return next;
  let out = next;
  for (const [id, c] of Object.entries(next.combatants)) {
    const b = prev.combatants[id];
    if (c.knockedOut && b && c.hp > b.hp) {
      const { knockedOut: _k, ...rest } = c;
      out = { ...out, combatants: { ...out.combatants, [id]: { ...rest, conditions: c.conditions.filter((x) => x !== 'Unconscious') } } };
    }
  }
  const actorId = (event as { actorId?: string }).actorId;
  if (!actorId || event.type === 'dice_rolled') return out;
  const a = out.combatants[actorId];
  if (!a) return out;
  if (event.type === 'moved') {
    const walked = !a.fly && !a.effects?.some((e) => e.fly || e.airborne) && !a.climbing && (a.altitudeFt ?? 0) === 0;
    const streak = walked ? (a.walkStreak ?? 0) + event.path.length : 0;
    if ((a.walkStreak ?? 0) === streak) return out;
    return { ...out, combatants: { ...out.combatants, [actorId]: { ...a, walkStreak: streak } } };
  }
  if (!a.walkStreak) return out;
  const { walkStreak: _w, ...rest } = a;
  return { ...out, combatants: { ...out.combatants, [actorId]: rest } };
}
