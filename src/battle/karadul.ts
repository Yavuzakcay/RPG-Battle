/**
 * Kuyruk K48 Adım C: Karadul Çemberi (özgün Druid alt sınıfı), EV KURALI (`data/karadul.json`; ev kuralı
 * `karadulCemberi`, varsayılan kapalı; kural sürümü `surum`). Wild Shape alt sınıf seçilince düşer (`replaces`,
 * `gainedFeatures`); savaşta (kural açıkken) yerine:
 * - Büyüleyici Bakış (`ev:karadul/gaze`, eylem; 6+ bonus eylem): menzildeki insansı/canavar WIS save ya da Charmed
 *   (`charm`: büyüleyene saldıramaz; büyüleyenin tarafı saldırır ya da zarar verirse biter). En çok CHA kadar hedef.
 * - Örümcek Biçimi (`ev:karadul/spider`, bonus eylem; gir/bırak): SRD canavar verisinden biçim (`shape_changed`,
 *   `spider`), biçim canı = canavarın HP'si (geçici HP; bitince geri döner), AC canavarın. Skor takası STR↔CHA,
 *   CON↔WIS (insan biçimindeki skorlardan; save'ler yetkinlikle aynı); ısırık = yeterlilik + max(STR, DEX).
 * - Karadul Zehri, Tatlı Tuzak, Ağ Duyusu, Son Öpücük: saldırı kancaları (`features.ts`).
 * Alt sınıf DC'si 8 + yeterlilik + insan biçimindeki CHA. Kural kapalıyken özellikler savaşta yok. Saf.
 */
import data from '../../data/karadul.json';
import creatureTypes from '../../data/canavar-turleri.json';
import { getMonster, type Monster } from '../data';
import { gap64 } from './adjacency';
import { fail, finish, type CommandResult } from './common';
import { houseRule } from './houseRules';
import { saveDice } from './effectDice';
import { saveMode } from './durations';
import { monsterAvatar } from './avatar';
import { turnKey } from './economy';
import { resolveSave } from '../rules/attack';
import { adjustDamage } from '../rules/damage';
import { isIncapacitated } from '../rules/conditions';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import type { Ability } from '../rules/abilities';
import type { CharacterSheet } from '../rules/stats';
import { resourceLeft, type AttackOption, type BattleEvent, type BattleState, type Combatant, type ExtraDamage, type ShapeStats, type UsableFeature } from './types';

export const KARADUL = data;
export const KARADUL_ID = data.subclass.id;
export const GAZE_KEY = 'ev:karadul/gaze';
export const SPIDER_KEY = 'ev:karadul/spider';
export const SPIDER_WEAPON = 'karadul:spider';
const TYPES = creatureTypes.types as Record<string, string>;
const R = data.kaynaklar;

export const karadulOn = (state: Pick<BattleState, 'houseRules' | 'map' | 'kuralSurumu'>): boolean =>
  (state.kuralSurumu ?? 1) >= data.surum && houseRule(state, 'karadulCemberi');

/** Seviyeye göre veri satırı (`{"3": x, "10": y}` → seviyenin en büyük eşiği). */
export function byLevel<T>(table: Record<string, T>, level: number): T | undefined {
  return Object.entries(table).filter(([l]) => level >= Number(l)).sort((a, b) => Number(b[0]) - Number(a[0]))[0]?.[1];
}
const isKaradul = (c: Combatant) => !!c.features?.some((f) => f.key.startsWith('ev:karadul/'));
/** İnsan biçimindeki değiştiriciler (biçimdeyken `shape.prev`). */
const humanMods = (c: Combatant) => c.shape?.prev.modifiers ?? c.modifiers;
/** Alt sınıf DC'si: 8 + yeterlilik + insan biçimindeki CHA (biçim değişince düşmez). */
export const karadulDc = (c: Combatant): number => 8 + c.proficiency + humanMods(c).cha;

/** Karakterin Karadul özellikleri (oluşturulurken; kural kapalıysa savaş başında `withKaradul` kaldırır). */
export function karadulFeatures(sheet: CharacterSheet): UsableFeature[] {
  if (sheet.subclassId !== KARADUL_ID || sheet.level < 3) return [];
  const name = (id: string) => data.subclass.features.find((f) => f.id === id)?.name.tr ?? id;
  return [
    { key: GAZE_KEY, name: name('bewitching-gaze'), type: sheet.level >= data.bakis.bonusSeviye ? 'bonus' : 'action', resource: R.bakis, effect: { kind: 'karadulGaze' } },
    { key: SPIDER_KEY, name: name('spider-shape'), type: 'bonus', resource: R.orumcek, effect: { kind: 'karadulSpider' } },
  ];
}

/** Savaş başı: kural açıksa Ağ Duyusu (zehir ve Poisoned bağışıklığı); kapalıysa Karadul özellikleri kaldırılır. */
export function withKaradul(state: BattleState): BattleState {
  const on = karadulOn(state);
  let changed = false;
  const combatants: Record<string, Combatant> = {};
  for (const [id, c] of Object.entries(state.combatants)) {
    if (!isKaradul(c)) { combatants[id] = c; continue; }
    changed = true;
    if (!on) { combatants[id] = { ...c, features: (c.features ?? []).filter((f) => !f.key.startsWith('ev:karadul/')) }; continue; }
    combatants[id] = c.level >= data.ag.seviye
      ? { ...c, effects: [...(c.effects ?? []), { id: 'ev:karadul/web-sense', name: 'Ağ Duyusu', sourceId: c.id, immune: ['Poisoned'], immuneDamage: ['poison'] }] }
      : c;
  }
  return changed ? { ...state, combatants } : state;
}

const gazeId = (actor: Combatant) => `karadul:gaze:${actor.id}`;
const charmedBy = (target: Combatant, actor: Combatant) => !!target.effects?.some((e) => e.id === gazeId(actor));
const charmCount = (state: BattleState, actor: Combatant) => Object.values(state.combatants).filter((c) => charmedBy(c, actor)).length;
const typeOf = (c: Combatant) => (c.monsterId ? TYPES[c.monsterId] : 'humanoid');

export function karadulProblem(state: BattleState, actor: Combatant, f: UsableFeature, targetId?: string): string | null {
  if (!karadulOn(state)) return `${f.name}: Karadul Çemberi ev kuralı kapalı.`;
  if (f.effect.kind === 'karadulSpider') {
    if (actor.shape?.spider) return null;
    if (actor.shape) return 'Başka bir biçimdesin.';
    if (isIncapacitated(actor.conditions)) return 'Incapacitated iken biçim değiştirilemez.';
    if (resourceLeft(actor, R.orumcek) <= 0) return `${f.name}: kullanım kalmadı (kısa dinlenmede yenilenir).`;
    return byLevel(data.orumcek.bicimler, actor.level) && getMonster(byLevel(data.orumcek.bicimler, actor.level) as string) ? null : 'Örümcek biçimi bulunamadı.';
  }
  if (resourceLeft(actor, R.bakis) <= 0) return `${f.name}: kullanım kalmadı (uzun dinlenmede yenilenir).`;
  const t = targetId ? state.combatants[targetId] : undefined;
  if (!t || t.hp <= 0 || t.side === actor.side) return 'Bir düşman seç.';
  if (!data.bakis.turler.includes(typeOf(t) ?? '')) return `${t.name} insansı ya da canavar değil.`;
  if (charmedBy(t, actor)) return `${t.name} zaten büyülenmiş.`;
  if (state.map && (!actor.pos || !t.pos || gap64(state, actor, t) * 5 > data.bakis.menzilFt)) return `${data.bakis.menzilFt} ft içinde olmalı.`;
  if (charmCount(state, actor) >= Math.max(data.bakis.enAzHedef, humanMods(actor).cha)) return 'Aynı anda büyüleyebileceğin hedef sınırı doldu (CHA).';
  return null;
}

/** Biçimin savaş değerleri: AC/hız/boyut canavardan, skorlar insan biçiminden takasla, ısırık yeterlilik + max(STR, DEX). */
export function spiderStats(m: Monster, c: Combatant): ShapeStats & { spider: true } {
  const base = humanMods(c);
  const mods = { ...base };
  for (const [a, b] of data.skorTakasi as Array<[Ability, Ability]>) { mods[a] = base[b]; mods[b] = base[a]; }
  const prevSaves = c.shape?.prev.saves ?? c.saves;
  const saves = { ...prevSaves };
  for (const a of Object.keys(mods) as Ability[]) saves[a] = prevSaves[a] - base[a] + mods[a];
  const bite = m.attacks.find((a) => a.damageDice && !a.save);
  const die = (bite?.damageDice ?? '1d6').replace(/\s*[+-]\s*\d+$/, '');
  const hitMod = Math.max(mods.str, mods.dex);
  const option: AttackOption = {
    label: `${bite?.name ?? 'Bite'} (${m.name})`, attackBonus: c.proficiency + hitMod, damage: `${die}${hitMod >= 0 ? '+' : ''}${hitMod}`,
    damageType: bite?.damageType ?? 'piercing', ranged: false, spell: false, reachFt: bite?.reachFt ?? 5,
    tag: `${m.name} bite ${bite?.damageType ?? ''}`.toLowerCase(), weaponId: SPIDER_WEAPON,
  };
  return { form: m.id, name: m.name, ac: m.ac, speed: m.speed, fly: 0, size: m.size ?? c.size, modifiers: mods, saves,
    weaponOptions: [option], attacksPerAction: 1, avatar: monsterAvatar(m), spider: true };
}

export function executeKaradul(state: BattleState, actor: Combatant, f: UsableFeature, targetId: string | undefined, rng?: Rng): CommandResult {
  const why = karadulProblem(state, actor, f, targetId);
  if (why) return fail(why);
  if (f.effect.kind === 'karadulSpider') {
    if (actor.shape?.spider) return finish(state, [{ type: 'shape_changed', actorId: actor.id, stats: null, reason: 'bıraktı' }]);
    const m = getMonster(byLevel(data.orumcek.bicimler, actor.level) as string) as Monster;
    return finish(state, [
      { type: 'feature_used', actorId: actor.id, feature: R.orumcek, remaining: resourceLeft(actor, R.orumcek) - 1 },
      { type: 'shape_changed', actorId: actor.id, stats: spiderStats(m, actor) },
      { type: 'temp_hp', targetId: actor.id, amount: m.hp, label: f.name },
      { type: 'trait_turn', actorId: actor.id, trait: 'karadul-transform', key: turnKey(state) },
    ]);
  }
  if (!rng) return fail('Zar gerekli.');
  const t = state.combatants[targetId as string] as Combatant;
  const dc = karadulDc(actor);
  const save = resolveSave({ extra: saveDice(t, 'wis'), modifier: t.saves.wis, dc, mode: saveMode('normal', t, 'wis', actor), against: ['Charmed'] }, rollTag(rng, { by: t.id }));
  const events: BattleEvent[] = [
    { type: 'feature_used', actorId: actor.id, feature: R.bakis, remaining: resourceLeft(actor, R.bakis) - 1 },
    { type: 'save_resolved', actorId: actor.id, targetId: t.id, label: f.name, ability: 'wis', dc, mode: 'normal', reasons: [],
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: t.hp, effects: [], conditionsAdded: [],
      ...(save.extra ? { bonusDice: save.extra } : {}) },
  ];
  if (!save.success) {
    events.push({ type: 'effect_added', targetId: t.id, effect: { id: gazeId(actor), name: f.name, sourceId: actor.id, grants: ['Charmed'], charm: true,
      breakOnDamage: 'casterSide', until: state.round + data.bakis.sureTur, icon: '💞' } });
  }
  return finish(state, events);
}

/** Tatlı Tuzak koşulu: örümcek ısırığı, bu tur dönüşüldü, tuzak bu tur kullanılmadı, hedef bu Karadul'un büyüsünde. */
export function snareReady(state: BattleState, actor: Combatant, target: Combatant, option: AttackOption | undefined): boolean {
  return option?.weaponId === SPIDER_WEAPON && karadulOn(state) && actor.level >= 6 && charmedBy(target, actor)
    && actor.traitTurns?.['karadul-transform'] === turnKey(state) && actor.traitTurns?.['karadul-snare'] !== turnKey(state);
}
/** Son Öpücük koşulu: sürpriz vuruş + 14. seviye + kullanım. */
export const kissReady = (state: BattleState, actor: Combatant, target: Combatant, option: AttackOption | undefined): boolean =>
  snareReady(state, actor, target, option) && actor.level >= data.opucuk.seviye && resourceLeft(actor, R.opucuk) > 0;

/** İfadenin en yüksek değeri (`2d8+3`; kritikte zarlar iki kat). */
function maxOf(expr: string, critical: boolean): number {
  let n = 0;
  for (const m of expr.replace(/\s/g, '').matchAll(/([+-]?)(\d*)d(\d+)|([+-]?\d+)/g)) {
    if (m[3]) n += (m[1] === '-' ? -1 : 1) * Number(m[2] || 1) * Number(m[3]) * (critical ? 2 : 1);
    else if (m[4]) n += Number(m[4]);
  }
  return n;
}

/**
 * Örümcek ısırığı isabeti: Karadul Zehri (ek zehir + CON save ya da bir tur Poisoned), Tatlı Tuzak (ek zar; büyü
 * vuruştan sonra biter), Son Öpücük (CON save: başarısızsa zarlar en yüksek, Stunned, eşikte ölüm; efsanevide ölüm yok).
 */
export function karadulHit(state: BattleState, actor: Combatant, target: Combatant, option: AttackOption,
  hit: { critical: boolean; weaponRaw: number }, rng: Rng): { extras: ExtraDamage[]; traitTurns: Record<string, string>; after: BattleEvent[] } | null {
  if (option.weaponId !== SPIDER_WEAPON || !karadulOn(state)) return null;
  const extras: ExtraDamage[] = [];
  const after: BattleEvent[] = [];
  const traitTurns: Record<string, string> = {};
  const dc = karadulDc(actor);
  const snare = snareReady(state, actor, target, option);
  const kiss = snare && kissReady(state, actor, target, option);
  let maxed = false;
  if (kiss) {
    const s = resolveSave({ extra: saveDice(target, 'con'), modifier: target.saves.con, dc, mode: saveMode('normal', target, 'con', actor) }, rollTag(rng, { by: target.id }));
    maxed = !s.success;
    after.push({ type: 'feature_used', actorId: actor.id, feature: R.opucuk, remaining: resourceLeft(actor, R.opucuk) - 1 });
  }
  const add = (label: string, expr: string, type: string) => {
    const d = maxed ? { rolls: [], total: maxOf(expr, hit.critical) } : rollDice(expr, rollTag(rng, { kind: 'damage', by: actor.id }), hit.critical);
    const adj = adjustDamage(d.total, type, target);
    extras.push({ label, rolls: d.rolls, raw: d.total, applied: adj.amount, type, note: adj.note });
  };
  const venom = byLevel(data.zehir.zar, actor.level);
  if (venom) add('Karadul Zehri', venom, 'poison');
  if (snare) {
    add('Tatlı Tuzak', byLevel(data.tuzak.zar, actor.level) ?? '2d8', 'poison');
    traitTurns['karadul-snare'] = turnKey(state);
  }
  if (maxed) {
    const gainW = Math.max(0, maxOf(option.damage, hit.critical) - hit.weaponRaw);
    if (gainW > 0) { const adj = adjustDamage(gainW, option.damageType ?? '', target); extras.push({ label: 'Son Öpücük', rolls: [], raw: gainW, applied: adj.amount, type: option.damageType ?? '', note: adj.note }); }
    after.push({ type: 'effect_added', targetId: target.id, effect: { id: `karadul:kiss:${actor.id}`, name: 'Son Öpücük', sourceId: actor.id, grants: ['Stunned'], untilSourceTurn: true, icon: '💋' } });
    // Ölüm eşiği: efsanevi değil, CR ≤ seviye × oran; vuruştan sonra canı yarının altında.
    const legendary = target.legendaryLeft !== undefined || resourceLeft(target, 'legendaryResistance') > 0;
    const cr = target.monsterId ? crValue(getMonster(target.monsterId)?.cr ?? '99') : target.level;
    const dealt = adjustDamage(hit.weaponRaw, option.damageType ?? '', target).amount + extras.reduce((n, x) => n + x.applied, 0);
    const left = target.hp - dealt;
    if (!legendary && cr <= actor.level * data.opucuk.crOran && left > 0 && left < target.maxHp * data.opucuk.canEsigi) {
      extras.push({ label: 'Son Öpücük (ölüm)', rolls: [], raw: left, applied: left, type: '', note: null });
    }
  }
  // Zehir: CON save ya da bir tur Poisoned (Poisoned bağışıklığı olana işlemez).
  if (venom && !target.effects?.some((e) => e.immune?.includes('Poisoned'))) {
    const s = resolveSave({ extra: saveDice(target, data.zehir.save as Ability), modifier: target.saves[data.zehir.save as Ability], dc, mode: saveMode('normal', target, data.zehir.save as Ability, actor), against: ['Poisoned'] }, rollTag(rng, { by: target.id }));
    if (!s.success) after.push({ type: 'effect_added', targetId: target.id, effect: { id: `karadul:venom:${actor.id}`, name: 'Karadul Zehri', sourceId: actor.id, grants: ['Poisoned'], untilSourceTurn: true, icon: '🕷' } });
  }
  return { extras, traitTurns, after };
}

/** Büyüleyenin tarafından saldırılan (ıskalansa da) büyülü hedefin büyüsü biter (hasar zaten `breakOnDamage`). */
export function gazeBreakEvents(state: BattleState, actor: Combatant, target: Combatant): BattleEvent[] {
  const e = target.effects?.find((x) => x.id.startsWith('karadul:gaze:') && state.combatants[x.sourceId]?.side === actor.side);
  return e ? [{ type: 'effect_ended', targetId: target.id, effectId: e.id, name: e.name, reason: 'used' }] : [];
}

/** Biçim canı (geçici HP) biten örümcek biçimi. */
export const spiderOver = (c: Combatant): boolean => !!c.shape?.spider && (c.tempHp ?? 0) <= 0;

const crValue = (cr: string) => (cr.includes('/') ? Number(cr.split('/')[0]) / Number(cr.split('/')[1]) : Number(cr));
