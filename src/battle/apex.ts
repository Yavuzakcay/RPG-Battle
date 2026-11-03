/**
 * Kuyruk 19 (görev 4–5): 11–20. seviye alt sınıf özellikleri (SRD 5.2.1), `use_feature` üzerinden; hepsi
 * `featuresK19` Game Master anahtarına bağlı (kapalıyken kullanılamaz):
 * - Intimidating Presence (Berserker 14; `fearAura`): bonus eylem, 30 ft içindeki seçilen yaratıklar WIS save
 *   (DC 8 + STR + PB) ya da 1 dakika Frightened (tur sonunda tekrar save). Kullanım yoksa bir Rage kullanımı harcanır.
 * - Holy Nimbus (Devotion 20; `nimbus`): bonus eylem, 10 dakika: 30 ft aura (Paladin'e bağlı alan) içinde turuna
 *   başlayan düşmana CHA + PB Radiant; parlak ışık; Fiend/Undead etkilerine save'ler avantajlı (`saveAdvVs`).
 * - Dragon Wings (Draconic 14; `wings`): bonus eylem, 1 saat uçuş hızı 60 ft; kullanım yoksa 3 Sorcery Point.
 * - Quivering Palm (Open Hand 17; `quiveringPalm`): bu tur Unarmed Strike isabeti alan hedefe 4 Focus ile titreşim;
 *   titreşen hedef varken yeniden kullanmak (eylem) titreşimi bitirir: CON save, başarısızsa 10d12 Force, başarıda yarısı.
 *   (SRD: Attack eyleminde bir saldırının yerine de olur; burada eylem.)
 * - Nature's Sanctuary (Land 14; `sanctuary`): eylem, Wild Shape kullanımı: 120 ft içindeki noktada 15 ft küp
 *   (yarıçap 1 altıgen) 1 dakika: içindeki dostlar yarım siperli ve Nature's Ward direncine sahip; küp varken
 *   yeniden kullanmak (bonus eylem, kaynak harcamaz) onu 60 ft taşır.
 */
import { distance, withinRange, type Offset } from '../rules/hex';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { resolveSave } from '../rules/attack';
import { adjustDamage } from '../rules/damage';
import type { Ability } from '../rules/abilities';
import { canSee } from './maprules';
import { fail, finish, isTargetable, type CommandResult, damageProfile } from './common';
import { damageEffects } from './damage-effects';
import { saveMode, timedCondition } from './durations';
import { saveDice } from './effectDice';
import { globalRule } from './ruleControl';
import { resourceLeft, type BattleEvent, type BattleState, type Combatant, type UsableFeature } from './types';

type Use = { feature: string; targetId?: string; to?: Offset };
export const APEX_KINDS = ['fearAura', 'nimbus', 'wings', 'quiveringPalm', 'sanctuary'] as const;
export const isApex = (f: UsableFeature): boolean => (APEX_KINDS as readonly string[]).includes(f.effect.kind);

const on = (state: BattleState) => !!globalRule(state, 'featuresK19');
const within = (state: BattleState, a: Combatant, b: Combatant, ft: number) =>
  !state.map || (!!a.pos && !!b.pos && distance(a.pos, b.pos) * 5 <= ft);

const fearTargets = (state: BattleState, actor: Combatant, ft: number) => Object.values(state.combatants)
  .filter((c) => c.side !== actor.side && !c.civilian && isTargetable(c) && c.hp > 0 && within(state, actor, c, ft) && (!state.map || canSee(state, actor, c)));

/** Titreşimi `actor`a ait hedefler. */
export const quiveringOf = (state: BattleState, actor: Combatant): Combatant[] =>
  Object.values(state.combatants).filter((c) => c.hp > 0 && (c.effects ?? []).some((e) => e.quivering && e.sourceId === actor.id));

const sanctuaryOf = (state: BattleState, actor: Combatant, key: string) =>
  state.map?.zones?.find((z) => z.casterId === actor.id && z.spellId === `feature:${key}`);

/** Kaynak: önce özelliğin kendisi, yoksa alternatif (Rage kullanımı, Sorcery Point). */
function payment(actor: Combatant, f: UsableFeature): { resource: string; cost: number } | null {
  const e = f.effect;
  if (f.resource && resourceLeft(actor, f.resource) > 0) return { resource: f.resource, cost: 1 };
  const alt = (e.kind === 'fearAura' || e.kind === 'wings') ? e.altResource : undefined;
  const cost = e.kind === 'wings' ? e.altCost ?? 1 : 1;
  if (alt && resourceLeft(actor, alt) >= cost) return { resource: alt, cost };
  return null;
}

/**
 * Davranışın ekonomisi: Quivering Palm'ı tetiklemek eylem, işaretlemek eylemsiz; Nature's Sanctuary taşımak bonus.
 * `economy.ts` bunu sorar (yoksa özelliğin türü).
 */
export function apexCost(state: BattleState, actor: Combatant, f: UsableFeature): 'action' | 'bonus' | 'free' {
  const e = f.effect;
  if (e.kind === 'quiveringPalm') return quiveringOf(state, actor).length > 0 && !actor.economy.meleeHit?.martialArts ? 'action' : 'free';
  if (e.kind === 'sanctuary') return sanctuaryOf(state, actor, f.key) ? 'bonus' : 'action';
  return f.type;
}

export function apexProblem(state: BattleState, actor: Combatant, f: UsableFeature, cmd: Use): string | null {
  if (!on(state)) return `${f.name} bu kural sürümünde ya da Game Master ayarında kapalı.`;
  const e = f.effect;
  if (e.kind === 'fearAura') {
    if (!payment(actor, f)) return `${f.name}: kullanım kalmadı (Rage kullanımı da yok).`;
    return fearTargets(state, actor, e.rangeFt).length > 0 ? null : `${e.rangeFt} ft içinde görülen düşman yok.`;
  }
  if (e.kind === 'nimbus') return payment(actor, f) ? null : `${f.name}: kullanım kalmadı.`;
  if (e.kind === 'wings') {
    if (actor.effects?.some((x) => x.id === f.key)) return 'Kanatlar zaten açık.';
    return payment(actor, f) ? null : `${f.name}: kullanım kalmadı (3 Sorcery Point da yok).`;
  }
  if (e.kind === 'quiveringPalm') {
    const hit = actor.economy.meleeHit;
    if (hit?.martialArts) {
      if (resourceLeft(actor, f.resource ?? '') < e.cost) return `${e.cost} Focus gerekli.`;
      return null;
    }
    if (quiveringOf(state, actor).length > 0) return actor.economy.action ? 'Eylemin kalmadı.' : null;
    return 'Önce bu tur bir Unarmed Strike ile vurmalısın.';
  }
  if (e.kind === 'sanctuary') {
    if (!state.map) return 'Yalnızca haritalı savaşta.';
    const live = sanctuaryOf(state, actor, f.key);
    if (!cmd.to) return live ? null : 'Küpün merkezini seç.';
    if (live) {
      const from = live.center ?? live.hexes[0];
      if (from && distance(from, cmd.to) * 5 > e.moveFt) return `Küp en çok ${e.moveFt} ft taşınır.`;
      return null;
    }
    if (!actor.pos || distance(actor.pos, cmd.to) * 5 > e.rangeFt) return `Menzil ${e.rangeFt} ft.`;
    return payment(actor, f) ? null : `${f.name}: Wild Shape kullanımı kalmadı.`;
  }
  return null;
}

const spend = (actor: Combatant, p: { resource: string; cost: number }): BattleEvent =>
  ({ type: 'feature_used', actorId: actor.id, feature: p.resource, remaining: resourceLeft(actor, p.resource) - p.cost });

const sizeOf = (state: BattleState) => ({ cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 });

export function executeApex(state: BattleState, actor: Combatant, f: UsableFeature, cmd: Use, rng?: Rng): CommandResult {
  const why = apexProblem(state, actor, f, cmd);
  if (why) return fail(why);
  const e = f.effect;
  const events: BattleEvent[] = [];
  if (e.kind === 'fearAura') {
    if (!rng) return fail('Zar gerekli.');
    events.push(spend(actor, payment(actor, f) as { resource: string; cost: number }));
    const dc = 8 + actor.modifiers[e.dcAbility] + actor.proficiency;
    for (const t of fearTargets(state, actor, e.rangeFt)) {
      const save = resolveSave({ extra: saveDice(t, e.save), modifier: t.saves[e.save], dc, mode: saveMode('normal', t, e.save, actor) }, rollTag(rng, { by: t.id }));
      events.push({
        type: 'save_resolved', actorId: actor.id, targetId: t.id, label: f.name, ability: e.save, dc, mode: 'normal', reasons: [],
        d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
        damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: t.hp, effects: [], conditionsAdded: [],
        ...(save.extra ? { bonusDice: save.extra } : {}),
      });
      if (!save.success) {
        events.push({ type: 'effect_added', targetId: t.id, effect: {
          id: `${f.key}-${actor.id}`, name: f.name, sourceId: actor.id, until: state.round + e.rounds - 1, grants: [e.condition],
          repeatSave: { ability: e.save as Ability, dc }, icon: '😱',
        } });
      }
    }
    return finish(state, events);
  }
  if (e.kind === 'nimbus') {
    events.push(spend(actor, payment(actor, f) as { resource: string; cost: number }));
    const until = state.round + e.rounds - 1;
    events.push({ type: 'effect_added', targetId: actor.id, effect: {
      id: f.key, name: f.name, sourceId: actor.id, until, saveAdvVs: e.types, light: e.light, icon: '☀',
    } });
    if (state.map && actor.pos) {
      events.push({ type: 'zone_created', zone: {
        id: `feature:${f.key}:${actor.id}:${state.round}`, spellId: `feature:${f.key}`, name: f.name, casterId: actor.id, side: actor.side,
        dc: 0, slotLevel: 0, hexes: [], anchorId: actor.id, radius: Math.round(e.radiusFt / 5), until,
        damage: String(Math.max(0, actor.modifiers.cha + actor.proficiency)),
        spec: { on: ['start'], targets: 'enemies', damageType: 'radiant', color: '#ffe680', icon: '☀' },
      } });
    }
    return finish(state, events);
  }
  if (e.kind === 'wings') {
    events.push(spend(actor, payment(actor, f) as { resource: string; cost: number }));
    events.push({ type: 'effect_added', targetId: actor.id, effect: { id: f.key, name: f.name, sourceId: actor.id, until: state.round + e.rounds - 1, fly: e.flyFt, icon: '🐉' } });
    return finish(state, events);
  }
  if (e.kind === 'quiveringPalm') {
    const hit = actor.economy.meleeHit;
    if (hit?.martialArts) {
      const t = state.combatants[hit.targetId];
      if (!t || t.hp <= 0) return fail('Hedef bulunamadı.');
      const dc = actor.stunning?.dc ?? 8 + actor.proficiency + actor.modifiers.wis;
      events.push({ type: 'feature_used', actorId: actor.id, feature: f.resource as string, remaining: resourceLeft(actor, f.resource as string) - e.cost });
      // Başka hedefteki eski titreşim biter (SRD: aynı anda tek titreşim).
      for (const o of quiveringOf(state, actor)) for (const x of o.effects ?? []) if (x.quivering && x.sourceId === actor.id) events.push({ type: 'effect_ended', targetId: o.id, effectId: x.id, name: f.name, reason: 'used' });
      events.push({ type: 'effect_added', targetId: t.id, effect: { id: `${f.key}-${actor.id}`, name: f.name, sourceId: actor.id, quivering: { dc, dice: e.dice, type: e.damageType }, icon: '〰' } });
      return finish(state, events);
    }
    if (!rng) return fail('Zar gerekli.');
    for (const t of quiveringOf(state, actor)) {
      const fx0 = (t.effects ?? []).find((x) => x.quivering && x.sourceId === actor.id);
      const q = fx0?.quivering;
      if (!fx0 || !q) continue;
      events.push({ type: 'effect_ended', targetId: t.id, effectId: fx0.id, name: f.name, reason: 'used' });
      const save = resolveSave({ extra: saveDice(t, e.save), modifier: t.saves[e.save], dc: q.dc, mode: saveMode('normal', t, e.save, actor) }, rollTag(rng, { by: t.id }));
      const d = rollDice(q.dice, rollTag(rng, { kind: 'damage', by: actor.id }));
      const raw = save.success ? Math.floor(d.total / 2) : d.total;
      const adj = adjustDamage(raw, q.type, damageProfile(t));
      const fx = damageEffects(t, adj.amount, q.type, false, rng);
      events.push({
        type: 'save_resolved', actorId: actor.id, targetId: t.id, label: f.name, ability: e.save, dc: q.dc, mode: 'normal', reasons: [],
        d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
        damageRolls: d.rolls, rawDamage: d.total, appliedDamage: adj.amount, damageType: q.type, damageNote: adj.note,
        targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: [], ...(save.extra ? { bonusDice: save.extra } : {}),
      });
    }
    return finish(state, events);
  }
  if (e.kind === 'sanctuary') {
    const to = cmd.to as Offset;
    const hexes = withinRange(to, e.radius, sizeOf(state));
    const live = sanctuaryOf(state, actor, f.key);
    if (live) {
      events.push({ type: 'zone_moved', zoneId: live.id, hexes, center: to });
      return finish(state, events);
    }
    events.push(spend(actor, payment(actor, f) as { resource: string; cost: number }));
    events.push({ type: 'zone_created', zone: {
      id: `feature:${f.key}:${actor.id}:${state.round}`, spellId: `feature:${f.key}`, name: f.name, casterId: actor.id, side: actor.side,
      dc: 0, slotLevel: 0, hexes, center: to, until: state.round + e.rounds - 1,
      spec: { coverFor: 'allies', resist: wardOf(actor), color: '#5fbf5f', icon: '🌿' },
    } });
    return finish(state, events);
  }
  return fail('Bilinmeyen özellik.');
}

/** Nature's Ward direnci: Land türü işaretinden (Arid fire, Polar cold, Temperate lightning, Tropical poison). */
function wardOf(actor: Combatant): string[] {
  const land: Record<string, string> = { 'land-arid': 'fire', 'land-polar': 'cold', 'land-temperate': 'lightning', 'land-tropical': 'poison' };
  const t = (actor.traits ?? []).map((x) => land[x]).find(Boolean);
  return t ? [t] : ['fire', 'cold', 'lightning', 'poison'].filter((x) => actor.resistances.includes(x)).slice(0, 1);
}

/**
 * Hurl Through Hell (Fiend 14): saldırı isabetinde (uzun dinlenmede bir; kaynak `hurlThroughHell`) hedef CHA save
 * (büyü DC'si); başarısızsa Fiend değilse 8d10 Psychic ve büyücünün sonraki turunun sonuna dek Incapacitated
 * (SRD: cehennemde savrulur; burada yerinde Incapacitated). Yapay zekâ ve oyuncu için kendiliğinden (öneri: hep).
 */
export function hurlEvents(state: BattleState, actor: Combatant, target: Combatant, rng: Rng): BattleEvent[] {
  if (!on(state) || !actor.traits?.includes('hurl-through-hell') || target.hp <= 0 || resourceLeft(actor, 'hurlThroughHell') <= 0) return [];
  const dc = actor.spellSaveDc ?? 8 + actor.proficiency + actor.modifiers.cha;
  const events: BattleEvent[] = [{ type: 'feature_used', actorId: actor.id, feature: 'hurlThroughHell', remaining: resourceLeft(actor, 'hurlThroughHell') - 1 }];
  const save = resolveSave({ extra: saveDice(target, 'cha'), modifier: target.saves.cha, dc, mode: saveMode('normal', target, 'cha', actor) }, rollTag(rng, { by: target.id }));
  const fiend = target.creatureType?.toLowerCase() === 'fiend';
  const d = !save.success && !fiend ? rollDice('8d10', rollTag(rng, { kind: 'damage', by: actor.id })) : { rolls: [] as number[], total: 0 };
  const adj = d.total > 0 ? adjustDamage(d.total, 'psychic', damageProfile(target)) : { amount: 0, note: null };
  const fx = damageEffects(target, adj.amount, 'psychic', false, rng);
  events.push({
    type: 'save_resolved', actorId: actor.id, targetId: target.id, label: 'Hurl Through Hell', ability: 'cha', dc, mode: 'normal', reasons: [],
    d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
    damageRolls: d.rolls, rawDamage: d.total, appliedDamage: adj.amount, damageType: 'psychic', damageNote: adj.note,
    targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: [], ...(save.extra ? { bonusDice: save.extra } : {}),
  });
  if (!save.success && fx.hpAfter > 0) events.push(timedCondition(state, target.id, { condition: 'Incapacitated', owner: 'source', end: 'turnEnd' }, actor.id, 'Hurl Through Hell'));
  return events;
}

// ------------------------------------------------------------------ Overchannel (Evoker 14)

const OVER_RES = 'overchannel';
const OVER_MAX = 10;

/** Overchannel denetimi: Wizard büyüsü, 1–5. seviye slot, hasar veren; sorun yoksa null. */
export function overchannelProblem(state: BattleState, actor: Combatant, spell: { level: number; classes?: string[]; mechanics: { damage?: string } }, slotLevel: number, free?: boolean): string | null {
  if (!on(state)) return 'Overchannel bu kural sürümünde ya da Game Master ayarında kapalı.';
  if (!actor.traits?.includes('overchannel')) return 'Overchannel yok.';
  if (!spell.classes?.includes('Wiz')) return 'Overchannel yalnızca Wizard büyülerinde.';
  if (spell.level < 1 || slotLevel > 5 || free) return 'Overchannel 1–5. seviye slotla yapılan büyüde.';
  if (!spell.mechanics.damage) return 'Overchannel hasar veren büyüde.';
  return null;
}

/**
 * Overchannel zar kancası: bu büyücünün hasar zarları en yüksek yüzle gelir (manuel zar istenmez); diğer zarlar
 * (save, saldırı) olduğu gibi (varsa üst kancaya, yoksa Rng'den).
 */
export function overchannelRng(rng: Rng, actorId: string): Rng {
  const parent = (rng as Rng & { dice?: (r: { sides: number; count: number; kind?: string; by?: string }) => number[] }).dice;
  const wrapped = (() => rng()) as Rng & { dice?: unknown; react?: unknown };
  wrapped.dice = (req: { sides: number; count: number; kind?: string; by?: string }) => {
    if (req.kind === 'damage' && req.by === actorId) return Array.from({ length: req.count }, () => req.sides);
    if (parent) return parent(req);
    return Array.from({ length: req.count }, () => Math.floor(rng() * req.sides) + 1);
  };
  const react = (rng as Rng & { react?: unknown }).react;
  if (react) wrapped.react = react;
  return wrapped;
}

/** Kullanım kaydı ve ikinci kullanımdan sonra nekrotik bedel (direnç ve bağışıklık yok sayılır). */
export function overchannelAfter(state: BattleState, actor: Combatant, slotLevel: number, rng: Rng): BattleEvent[] {
  const left = resourceLeft(actor, OVER_RES);
  const n = OVER_MAX - left + 1;
  const events: BattleEvent[] = [{ type: 'feature_used', actorId: actor.id, feature: OVER_RES, remaining: Math.max(0, left - 1) }];
  if (n >= 2 && actor.hp > 0) {
    const d = rollDice(`${n * slotLevel}d12`, rollTag(rng, { kind: 'damage', by: actor.id }));
    const fx = damageEffects(actor, d.total, 'necrotic', false, rng);
    events.push({ type: 'effect_tick', targetId: actor.id, effectId: OVER_RES, name: 'Overchannel', damageRolls: d.rolls, appliedDamage: d.total,
      damageType: 'necrotic', targetHpAfter: fx.hpAfter, effects: fx.effects });
  }
  return events;
}
