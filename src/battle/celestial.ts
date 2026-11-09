/**
 * Kuyruk K20: Celestial (Düşmüş) oynanabilir ırkı, EV KURALI (SRD 5.2.1 dışı; `data/celestial.json`, ev kuralı
 * `celestialIrki`, varsayılan kapalı; kural sürümü 18+). Karanlık görüş ve ışıltı/ölümsüz direnci tür verisinde (eski
 * davranış, kural kapalıyken de). Kural açıkken savaş başında (`withCelestial`):
 * - Işık Hilesi: Light küçük hilesi bilinenlere eklenir (slotsuz).
 * - Şifa Eli (`ev:celestial/healing-touch`, eylem): dokunulan dost PB × d4 iyileşir; kaynak `celestialHeal` (uzun dinlenme).
 * - Göksel Uyanış (`ev:celestial/awakening`, bonus eylem, 3. seviye, 10 tur; kaynak `celestialAwakening`): seçilen biçim
 *   (karakterde `celestialAwakening`): her biçimde kendi turunda bir kez saldırı isabetine +PB (`celestialStrike`).
 *   Parlayan Ruh: 10 ft ışık; turunun sonunda 10 ft içindeki düşmanlara PB ışıltı (`celestialAura`).
 *   Gece Gözyaşı: uyanınca 10 ft içindeki düşmanlar WIS save (DC 8 + PB + CHA) ya da sonraki turunun başına dek Frightened.
 *   Kırık Kanat: yalnızca kendi turunda süzülme (yürüme hızının yarısı uçuş; `glide`), tur sonunda yere iner. Kuyruk U1a
 *   (sürüm 61+): 13. seviyeden normal uçuş (yürüme hızı, ana etkide `fly`, zorunlu iniş yok; `data/celestial.json` `ucus`).
 * Saf.
 */
export { AWAKENING_OPTIONS, CELESTIAL } from '../rules/celestialData';
import { healRoll } from './healMax';
import { u1aOn, ucusAt, ucusHiz } from './flightPrim';
import { gap } from './body';
import { damageProfile, fail, finish, isTargetable, type CommandResult } from './common';
import { resolveSave } from '../rules/attack';
import { adjustDamage, applyHealing } from '../rules/damage';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import type { Ability } from '../rules/abilities';
import { damageEffects } from './damage-effects';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
import { canSee } from './maprules';
import { AWAKENING_OPTIONS, CELESTIAL, type AwakeningOption as Option } from '../rules/celestialData';
import { resourceLeft, type ActiveEffect, type BattleEvent, type BattleState, type Combatant, type UsableFeature } from './types';

export const HEAL_KEY = 'ev:celestial/healing-touch';
export const AWAKEN_KEY = 'ev:celestial/awakening';
const GLIDE_ID = 'ev:celestial/glide';
/** Kural sürümü: Celestial mekaniği bu sürümden (eski savaş/replay eski davranış). */
export const CELESTIAL_VERSION = 18;
/** Kuyruk K49: bu sürümden beri Celestial kalıcı ırk (ev kuralı değil). */
export const CELESTIAL_PERMANENT = 22;

/** Kural bu savaşta açık mı (ev kuralı + kural sürümü). */
export const celestialOn = (state: Pick<BattleState, 'houseRules' | 'map' | 'kuralSurumu'>): boolean =>
  (state.kuralSurumu ?? 1) >= CELESTIAL_PERMANENT
  // Kuyruk K49: sürüm 22'den beri kalıcı ırk (her zaman açık); 18–21 kayıtlarında eski ev kuralı (`celestialIrki`, varsayılan kapalı).
  || ((state.kuralSurumu ?? 1) >= CELESTIAL_VERSION && state.houseRules?.celestialIrki === true);

const num = (expr: string | undefined, pb: number): number => (expr === 'pb' ? pb : Number(expr ?? 0));
const optionOf = (key: string | undefined): Option => CELESTIAL.awakening.secenekler[key ?? ''] ?? (CELESTIAL.awakening.secenekler[CELESTIAL.awakening.default] as Option);

/** Karakterin Celestial özellikleri (oluşturulurken; kural kapalıysa savaş başında `withCelestial` kaldırır). */
export function celestialFeatures(raceId: string, level: number, awakening: string | undefined): UsableFeature[] {
  if (raceId !== 'celestial') return [];
  const name = (id: string) => CELESTIAL.ozellikler.find((o) => o.id === id)?.tr ?? id;
  const out: UsableFeature[] = [{ key: HEAL_KEY, name: name('healing-touch'), type: 'action', resource: CELESTIAL.healingTouch.resource, effect: { kind: 'celestialHeal' } }];
  if (level >= CELESTIAL.awakening.minLevel) {
    const option = AWAKENING_OPTIONS.includes(awakening ?? '') ? awakening as string : CELESTIAL.awakening.default;
    out.push({ key: AWAKEN_KEY, name: `${name('awakening')}: ${optionOf(option).tr}`, type: 'bonus', resource: CELESTIAL.awakening.resource, effect: { kind: 'celestialAwakening', option } });
  }
  return out;
}

/** Savaş başı: kural açıksa Light eklenir; kapalıysa Celestial özellikleri kaldırılır (eski davranış). */
export function withCelestial(state: BattleState): BattleState {
  const on = celestialOn(state);
  const combatants: Record<string, Combatant> = {};
  let changed = false;
  for (const [id, c] of Object.entries(state.combatants)) {
    const has = (c.features ?? []).some((f) => f.key.startsWith('ev:celestial/'));
    if (!has) { combatants[id] = c; continue; }
    changed = true;
    combatants[id] = on
      ? { ...c, spellNames: c.spellNames.includes(CELESTIAL.lightSpell) ? c.spellNames : [...c.spellNames, CELESTIAL.lightSpell] }
      : { ...c, features: (c.features ?? []).filter((f) => !f.key.startsWith('ev:celestial/')) };
  }
  return changed ? { ...state, combatants } : state;
}

const touching = (state: BattleState, a: Combatant, b: Combatant) => a.id === b.id || !state.map || (!!a.pos && !!b.pos && gap(state, a, b) <= 1);
const near = (state: BattleState, a: Combatant, b: Combatant, ft: number) => !state.map || (!!a.pos && !!b.pos && gap(state, a, b) * 5 <= ft);
const foesNear = (state: BattleState, actor: Combatant, ft: number) => Object.values(state.combatants)
  .filter((c) => c.side !== actor.side && !c.civilian && c.hp > 0 && isTargetable(c) && near(state, actor, c, ft));

export function celestialProblem(state: BattleState, actor: Combatant, f: UsableFeature, targetId?: string): string | null {
  if (!celestialOn(state)) return `${f.name}: Celestial ev kuralı kapalı.`;
  if (f.resource && resourceLeft(actor, f.resource) <= 0) return `${f.name}: kullanım kalmadı (uzun dinlenmede yenilenir).`;
  if (f.effect.kind === 'celestialHeal') {
    const t = targetId ? state.combatants[targetId] : actor;
    if (!t) return 'Hedef bulunamadı.';
    if (t.side !== actor.side) return 'Yalnızca kendine ya da bir dostuna.';
    if (t.life === 'dead') return `${t.name} iyileştirilemez.`;
    if (t.hp >= t.maxHp) return `${t.name} zaten tam sağlıklı.`;
    if (CELESTIAL.healingTouch.touch && !touching(state, actor, t)) return 'Dokunmak için bitişik olmalısın.';
    return null;
  }
  if (actor.effects?.some((e) => e.id === AWAKEN_KEY)) return `${f.name} zaten etkin.`;
  return null;
}

export function executeCelestial(state: BattleState, actor: Combatant, f: UsableFeature, targetId: string | undefined, rng?: Rng): CommandResult {
  const why = celestialProblem(state, actor, f, targetId);
  if (why) return fail(why);
  if (!rng) return fail('Zar gerekli.');
  const pb = actor.proficiency;
  const events: BattleEvent[] = [{ type: 'feature_used', actorId: actor.id, feature: f.resource as string, remaining: resourceLeft(actor, f.resource as string) - 1 }];
  if (f.effect.kind === 'celestialHeal') {
    const t = state.combatants[targetId ?? actor.id] as Combatant;
    const d = { total: healRoll(state, t, `${num(CELESTIAL.healingTouch.count, pb)}${CELESTIAL.healingTouch.die}`, rng, actor.id) };
    events.push({ type: 'healed', actorId: actor.id, targetId: t.id, label: f.name, amount: d.total, targetHpAfter: applyHealing(t.hp, t.maxHp, d.total) });
    return finish(state, events);
  }
  if (f.effect.kind !== 'celestialAwakening') return fail('Bilinmeyen özellik.');
  const o = optionOf(f.effect.option);
  const until = state.round + CELESTIAL.awakening.rounds - 1;
  const base: ActiveEffect = { id: AWAKEN_KEY, name: f.name, sourceId: actor.id, until, icon: o.icon,
    celestialStrike: { bonus: num(CELESTIAL.awakening.bonus, pb), type: o.strikeType } };
  if (o.lightFt) base.light = Math.round(o.lightFt / 5);
  if (o.auraDamage) base.celestialAura = { radiusFt: o.radiusFt ?? 10, damage: num(o.auraDamage, pb), type: o.auraType ?? 'radiant' };
  // Kuyruk U1a (sürüm 61+): Kırık Kanat `ucus` parametreleriyle (13. seviyeden normal uçuş, zorunlu iniş yok); 60 ve altı
  // `flyFraction` (yarı hız, tur sonunda iniş). 3–12. seviyede iki yol aynı değeri verir.
  if (o.ucus && u1aOn(state)) {
    const q = ucusAt(o.ucus, actor.level);
    const ft = ucusHiz(q, actor.speed, () => actor.speed);
    if (q.zorunluInis === true) base.glide = ft; else base.fly = ft;
  } else if (o.flyFraction) base.glide = Math.floor((actor.speed * o.flyFraction) / 5) * 5;
  events.push({ type: 'effect_added', targetId: actor.id, effect: base });
  if (base.glide) events.push(glideOn(actor, base.glide, until));
  if (o.condition && o.save) {
    const ability = o.save as Ability;
    const dc = 8 + pb + actor.modifiers[(o.dcAbility ?? 'cha') as Ability];
    for (const t of foesNear(state, actor, o.radiusFt ?? 10).filter((x) => !state.map || canSee(state, actor, x))) {
      const save = resolveSave({ extra: saveDice(t, ability), modifier: t.saves[ability], dc, mode: saveMode('normal', t, ability, actor) }, rollTag(rng, { by: t.id }));
      events.push({
        type: 'save_resolved', actorId: actor.id, targetId: t.id, label: f.name, ability, dc, mode: 'normal', reasons: [],
        d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
        damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: t.hp, effects: [], conditionsAdded: [],
        ...(save.extra ? { bonusDice: save.extra } : {}),
      });
      if (!save.success) events.push({ type: 'effect_added', targetId: t.id, effect: { id: `${AWAKEN_KEY}:fear:${actor.id}`, name: o.tr, sourceId: actor.id, grants: [o.condition], untilSourceTurn: true, icon: o.icon } });
    }
  }
  return finish(state, events);
}

/** Kırık Kanat: yalnızca kendi turunda süren uçuş alt etkisi. */
const glideOn = (actor: Combatant, ft: number, until: number): BattleEvent =>
  ({ type: 'effect_added', targetId: actor.id, effect: { id: GLIDE_ID, name: 'Kırık Kanat', sourceId: actor.id, until, fly: ft, icon: '🪶' } });

/** Tur başı: Kırık Kanat etkinse süzülme açılır. */
export function celestialTurnStartEvents(state: BattleState, id: string): BattleEvent[] {
  const c = state.combatants[id];
  const e = c?.effects?.find((x) => x.id === AWAKEN_KEY && x.glide);
  if (!c || !e?.glide || c.effects?.some((x) => x.id === GLIDE_ID)) return [];
  return [glideOn(c, e.glide, e.until ?? state.round)];
}

/** Tur sonu: süzülen yere iner; Parlayan Ruh 10 ft içindeki düşmanlara PB ışıltı verir. */
export function celestialTurnEndEvents(state: BattleState, id: string, rng: Rng): BattleEvent[] {
  const c = state.combatants[id];
  if (!c) return [];
  const events: BattleEvent[] = [];
  if (c.effects?.some((x) => x.id === GLIDE_ID)) events.push({ type: 'effect_ended', targetId: id, effectId: GLIDE_ID, name: 'Kırık Kanat', reason: 'turn' });
  const aura = c.hp > 0 ? c.effects?.find((x) => x.celestialAura) : undefined;
  if (aura?.celestialAura) {
    const a = aura.celestialAura;
    for (const t of foesNear(state, c, a.radiusFt)) {
      const adj = adjustDamage(a.damage, a.type, damageProfile(t));
      const fx = damageEffects(t, adj.amount, a.type, false, rng);
      events.push({ type: 'effect_tick', targetId: t.id, effectId: aura.id, name: aura.name, damageRolls: [], appliedDamage: adj.amount, damageType: a.type, targetHpAfter: fx.hpAfter, effects: fx.effects });
    }
  }
  return events;
}

/** Kendi turunda bir kez saldırı isabetine ek hasar (Göksel Uyanış; `traitTurns['celestial-strike']`). */
export function celestialStrikeOf(state: BattleState, actor: Combatant): { bonus: number; type: string } | null {
  const e = actor.effects?.find((x) => x.celestialStrike);
  if (!e?.celestialStrike || state.order[state.turnIndex] !== actor.id) return null;
  return e.celestialStrike;
}
