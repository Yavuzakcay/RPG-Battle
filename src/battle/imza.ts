/**
 * Kuyruk K50: imza alt sınıflar (oyuna özel, ev kuralı; `data/imza.json`, kaynak `docs/imza-alt-siniflar/`). Tek motor,
 * davranış veriden: `eylemler` (use_feature ile; hedef seçimi, kurtulma, hasar, iyileştirme, süreli etki, Cesaret
 * bağışıklığı, özel: Buyruk ve Birlik Can Havuzu), `pasifler` (savaş başı etkisi, aura, saldırı kancası). Kural sürümü
 * `surum` (23) ve alt sınıfın ev kuralı (`evKurali`; Birlik Manastırı'nda null: her zaman). Kural kapalıyken ya da eski
 * savaşta özellikler yok. Süreli etkiler mevcut `ActiveEffect` alanlarıyla (yeni durum eklemeden). Saf.
 */
import data from '../../data/imza.json';
import { gap } from './body';
import { damageProfile as profileOf, fail, finish, isTargetable, type CommandResult } from './common';
import { byLevel, imzaId, imzaOn, imzaPasifler, isImza } from './imzaCore';
import { saveDice } from './effectDice';
import { saveMode } from './durations';
import { damageEffects } from './damage-effects';
import { saveDamage } from './classTraits';
import { strikeApi } from './reactions';
import { pushAwayEvents } from './forced';
import { moraleOn } from './morale';
import { resolveSave } from '../rules/attack';
import { adjustDamage } from '../rules/damage';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { isIncapacitated } from '../rules/conditions';
import type { Ability } from '../rules/abilities';
import type { CharacterSheet } from '../rules/stats';
import { resourceLeft, type ActiveEffect, type BattleEvent, type BattleState, type Combatant, type ExtraDamage, type UsableFeature } from './types';

type Etki = Record<string, unknown> & { name: string; sure: number; sureEfsanevi?: number; icon?: string };
export interface ImzaSpec {
  sinif: string; ozellik: string; seviye: number; tur: 'action' | 'bonus'; ad: string; not?: string;
  kaynak?: { id: string; sayi: number | string; yenilenme: string }; kullan?: { id: string; maliyet: number }; maliyet?: number;
  hedef: 'self' | 'ally' | 'allyOrSelf' | 'enemy' | 'allies' | 'enemies' | 'adjEnemies' | 'areaEnemies' | 'bonded';
  menzilFt?: number; yaricapFt?: number; kendisi?: boolean; enCok?: number | string; enCokCarpan?: Record<string, number>; tek?: boolean;
  yalnizIsaretli?: string; save?: { yetenek: Ability; dc: Ability[]; dezVs?: string[]; dezEtki?: string[] }; yari?: boolean; cesaret?: number;
  hasar?: { zar: Record<string, string>; tur: string }; hasarHep?: boolean; iyilestir?: Record<string, string>; tempHp?: string; moral?: number;
  etki?: Etki; etkiSeviye?: Record<string, Etki>; kendiEtki?: Etki; temizle?: string[]; itme?: number; bag?: boolean; ozel?: 'buyruk' | 'havuz';
  acikHava?: boolean; dostlarDahil?: boolean; efsaneviBasariSure?: number;
}

export const IMZA = data;
export const IMZA_VERSION = data.surum;
export const IMZA_SPECS = data.eylemler as unknown as Record<string, ImzaSpec>;
export { imzaId, imzaOn, isImza };
const mod = (c: Combatant, a: string) => (c.modifiers as Record<string, number>)[a] ?? 0;
const bardicDie = (c: Combatant): string => {
  const f = c.features?.find((x) => x.effect.kind === 'inspire')?.effect as { die?: string } | undefined;
  return f?.die ?? '1d6';
};
/** Belirteçler: $pb, $pbHalf, $lvl, $lvl2, $str…$cha, $bardic. */
function expr(s: string, c: Combatant): string {
  return s.replace(/\$(pbHalf|pb|lvl2|lvl|bardic|str|dex|con|int|wis|cha)/g, (_, k: string) => {
    switch (k) {
      case 'pb': return String(c.proficiency);
      case 'pbHalf': return String(Math.max(1, Math.floor(c.proficiency / 2)));
      case 'lvl': return String(c.level);
      case 'lvl2': return String(2 * c.level);
      case 'bardic': return bardicDie(c);
      default: return String(Math.max(0, mod(c, k)));
    }
  }).replace(/\+-/g, '-');
}
const num = (s: string | number | undefined, c: Combatant): number => (typeof s === 'number' ? s : s ? Number(expr(s, c)) || 0 : 0);

/** Arayüz: eylem hedef ister mi (dost/düşman ya da alanın merkezi). */
export const imzaTargeted = (key: string): boolean => ['ally', 'allyOrSelf', 'enemy', 'areaEnemies'].includes(IMZA_SPECS[key]?.hedef ?? '');

/** Alt sınıf DC'si: 8 + yeterlilik + listedeki yeteneklerin en yükseği. */
export const imzaDc = (c: Combatant, dc: Ability[]): number => 8 + c.proficiency + Math.max(...dc.map((a) => mod(c, a)));

/** Karakterin imza özellikleri (kural kapalıysa savaş başında `withImza` kaldırır). */
export function imzaFeatures(sheet: CharacterSheet): UsableFeature[] {
  const sub = imzaId(sheet.subclassId);
  if (!isImza(sub) || sheet.level < 3) return [];
  return Object.entries(IMZA_SPECS).filter(([, s]) => s.sinif === sub && sheet.level >= s.seviye)
    .map(([key, s]) => ({ key, name: s.ad, type: s.tur, ...(s.kaynak || s.kullan ? { resource: (s.kaynak ?? s.kullan)?.id } : {}), effect: { kind: 'imza' as const } }));
}

const imzaOf = (c: Combatant): string | undefined => c.imza;
const pasifler = imzaPasifler;

/** Savaş başı: kural açıksa pasif etkiler (bağışıklık, Ölümsüz Taht…); kapalıysa imza özellikleri kaldırılır. */
export function withImza(state: BattleState): BattleState {
  let changed = false;
  const combatants: Record<string, Combatant> = {};
  for (const [id, c] of Object.entries(state.combatants)) {
    if (!imzaOf(c)) { combatants[id] = c; continue; }
    changed = true;
    if (!imzaOn(state, imzaOf(c))) { combatants[id] = { ...c, features: (c.features ?? []).filter((f) => !f.key.startsWith('imza:')) }; continue; }
    const adds: ActiveEffect[] = pasifler(c).filter((p) => typeof p.etki.name === 'string')
      .map((p) => ({ ...(p.etki as Partial<ActiveEffect>), id: `imza:${p.sinif}/${p.ozellik}`, name: p.etki.name as string, sourceId: c.id }) as ActiveEffect);
    combatants[id] = adds.length ? { ...c, effects: [...(c.effects ?? []), ...adds] } : c;
  }
  return changed ? { ...state, combatants } : state;
}

const effectId = (key: string, actor: Combatant) => `${key}:${actor.id}`;
const isLegendary = (t: Combatant) => t.legendaryLeft !== undefined || resourceLeft(t, 'legendaryResistance') > 0;
const cesaretId = (key: string, actor: Combatant) => `imza:cesaret:${key}:${actor.id}`;
/** Açık gökyüzü: kapalı bölge/harita/varyant listesinde değil (data/imza.json `kapaliOrtam`). */
export function openSky(state: BattleState): boolean {
  const k = data.kapaliOrtam;
  const map = state.map;
  if (!map) return true;
  const bolge = (map as { bolge?: string }).bolge ?? '';
  const variant = String((map as { variantId?: string }).variantId ?? '');
  return !k.haritalar.includes(map.id) && !k.bolgeler.includes(bolge) && !k.varyantSozcukleri.some((w) => variant.includes(w));
}
/** Bağlı dostlar (Birlik Manastırı; bu rahibin bağı). */
const bondedOf = (state: BattleState, actor: Combatant) => Object.values(state.combatants)
  .filter((c) => c.effects?.some((e) => e.id === effectId('imza:imza_birlik/forge-bond', actor)) && c.hp > 0 && c.life !== 'dead');

function within(state: BattleState, a: Combatant, b: Combatant, ft: number | undefined): boolean {
  if (ft === undefined || !state.map || !a.pos || !b.pos) return true;
  return gap(state, a, b) * 5 <= ft;
}
const alive = (c: Combatant) => c.hp > 0 && c.life !== 'dead' && !c.summon?.gone && isTargetable(c);

/** Hedef listesi (komutun hedefi + spec). */
function targetsOf(state: BattleState, actor: Combatant, spec: ImzaSpec, key: string, targetId?: string): Combatant[] | string {
  const all = Object.values(state.combatants).filter(alive);
  const t = targetId ? state.combatants[targetId] : undefined;
  const cap = (list: Combatant[]) => {
    const n0 = spec.enCok === undefined ? Infinity : Math.max(1, num(spec.enCok, actor));
    const n = n0 * (byLevel(spec.enCokCarpan, actor.level) ?? 1);
    return list.slice(0, n);
  };
  const near = (c: Combatant) => (state.map && actor.pos && c.pos ? gap(state, actor, c) : 0);
  switch (spec.hedef) {
    case 'self': return [actor];
    case 'ally': case 'allyOrSelf': case 'enemy': {
      if (!t || !alive(t)) return 'Bir hedef seç.';
      const enemy = spec.hedef === 'enemy';
      if (enemy ? t.side === actor.side : t.side !== actor.side) return enemy ? 'Bir düşman seç.' : 'Bir dost seç.';
      if (spec.hedef === 'ally' && t.id === actor.id) return 'Başka bir dost seç.';
      if (!within(state, actor, t, spec.menzilFt)) return `${spec.menzilFt} ft içinde olmalı.`;
      if (spec.yalnizIsaretli && !t.effects?.some((e) => e.id === effectId(`imza:${spec.sinif}/${spec.yalnizIsaretli}`, actor))) return 'Yalnızca hükümlü hedefe.';
      if (spec.cesaret && t.effects?.some((e) => e.id === cesaretId(key, actor))) return `${t.name} buna direndi; bir süre bağışık (Cesaret).`;
      return [t];
    }
    case 'allies': {
      const list = all.filter((c) => c.side === actor.side && (spec.kendisi || c.id !== actor.id) && within(state, actor, c, spec.yaricapFt))
        .sort((a, b) => (a.id === actor.id ? -1 : b.id === actor.id ? 1 : near(a) - near(b)));
      // Bağ Kurma: rahip + en çok `enCok` dost.
      const out = spec.bag ? [actor, ...cap(list.filter((c) => c.id !== actor.id))] : cap(list);
      return out.length ? out : 'Menzilde dost yok.';
    }
    case 'bonded': {
      const list = bondedOf(state, actor);
      return list.length ? list : 'Bağlı dost yok (önce Bağ Kurma).';
    }
    case 'enemies': case 'adjEnemies': {
      const r = spec.hedef === 'adjEnemies' ? 5 : spec.yaricapFt;
      const list = cap(all.filter((c) => c.side !== actor.side && within(state, actor, c, r) && !(spec.cesaret && c.effects?.some((e) => e.id === cesaretId(key, actor))))
        .sort((a, b) => near(a) - near(b)));
      return list.length ? list : 'Menzilde düşman yok.';
    }
    case 'areaEnemies': {
      if (!t || !alive(t) || t.side === actor.side) return 'Alanın merkezi için bir düşman seç.';
      if (!within(state, actor, t, spec.menzilFt)) return `${spec.menzilFt} ft içinde olmalı.`;
      const list = all.filter((c) => (spec.dostlarDahil || c.side !== actor.side) && c.id !== actor.id && within(state, t, c, spec.yaricapFt));
      return list.length ? list : [t];
    }
  }
}

export function imzaProblem(state: BattleState, actor: Combatant, f: UsableFeature, targetId?: string): string | null {
  const spec = IMZA_SPECS[f.key];
  if (!spec) return 'Bilinmeyen özellik.';
  if (!imzaOn(state, imzaOf(actor))) return `${f.name}: imza alt sınıf ev kuralı kapalı.`;
  if (isIncapacitated(actor.conditions)) return 'Incapacitated iken kullanılamaz.';
  const res = spec.kaynak?.id ?? spec.kullan?.id;
  const cost = spec.kullan?.maliyet ?? spec.maliyet ?? 1;
  if (res && resourceLeft(actor, res) < cost) return `${f.name}: kullanım kalmadı.`;
  if (spec.acikHava && !openSky(state)) return `${f.name} yalnızca açık gökyüzü altında çalışır.`;
  const t = targetsOf(state, actor, spec, f.key, targetId);
  return typeof t === 'string' ? t : null;
}

/** Süreli etkinin tam hâli (belirteçler çözülür). */
function makeEffect(e: Etki, id: string, actor: Combatant, state: BattleState, legendary: boolean): ActiveEffect {
  const { sure, sureEfsanevi, ...rest } = e;
  const out: Record<string, unknown> = { ...rest, id, sourceId: actor.id, until: state.round + (legendary && sureEfsanevi ? sureEfsanevi : sure) };
  if (out.attackDisVs === '$actor') out.attackDisVs = actor.id;
  if (typeof out.hitDie === 'string') out.hitDie = expr(out.hitDie, actor);
  if (out.dice && typeof (out.dice as { die: string }).die === 'string') out.dice = { ...(out.dice as object), die: expr((out.dice as { die: string }).die, actor) };
  if (typeof out.tempHp === 'string') out.tempHp = num(out.tempHp, actor);
  return out as unknown as ActiveEffect;
}

export function executeImza(state: BattleState, actor: Combatant, f: UsableFeature, targetId: string | undefined, rng?: Rng): CommandResult {
  const why = imzaProblem(state, actor, f, targetId);
  if (why) return fail(why);
  if (!rng) return fail('Zar gerekli.');
  const spec = IMZA_SPECS[f.key] as ImzaSpec;
  const targets = targetsOf(state, actor, spec, f.key, targetId) as Combatant[];
  const events: BattleEvent[] = [];
  const res = spec.kaynak?.id ?? spec.kullan?.id;
  if (res) events.push({ type: 'feature_used', actorId: actor.id, feature: res, remaining: resourceLeft(actor, res) - (spec.kullan?.maliyet ?? spec.maliyet ?? 1) });
  const markId = effectId(f.key, actor);
  // Tek hedefli işaret (Hüküm): öncekinin yerine.
  if (spec.tek) for (const c of Object.values(state.combatants)) {
    const old = c.effects?.find((e) => e.id === markId);
    if (old) events.push({ type: 'effect_ended', targetId: c.id, effectId: old.id, name: old.name, reason: 'used' });
  }
  if (spec.bag) for (const c of bondedOf(state, actor)) events.push({ type: 'effect_ended', targetId: c.id, effectId: markId, name: spec.etki?.name ?? spec.ad, reason: 'used' });
  if (spec.ozel === 'buyruk') return finish(state, [...events, ...decreeEvents(state, actor, targets[0] as Combatant, rng)]);
  if (spec.ozel === 'havuz') {
    const ids = targets.map((c) => c.id).filter((id) => !state.combatants[id]?.poolId);
    if (ids.length < 2) return fail('Havuz için en az iki bağlı ve havuzsuz dost gerekir.');
    const max = ids.reduce((n, id) => n + (state.combatants[id]?.maxHp ?? 0), 0);
    const hp = Math.min(max, ids.reduce((n, id) => n + (state.combatants[id]?.hp ?? 0), 0));
    return finish(state, [...events, { type: 'hp_pool_created', poolId: `imza-birlik-${actor.id}`, memberIds: ids, hp, max, label: spec.ad }]);
  }
  const dc = spec.save ? imzaDc(actor, spec.save.dc) : 0;
  const etki = byLevel(spec.etkiSeviye, actor.level) ?? spec.etki;
  for (const t of targets) {
    const legendary = isLegendary(t);
    const isFoe = t.side !== actor.side;
    let failed = true;
    let applied = 0;
    if (spec.save && isFoe) {
      const ab = spec.save.yetenek;
      const dez = (spec.save.dezVs ?? []).some((x) => t.conditions.includes(x)) || (spec.save.dezEtki ?? []).some((n) => t.effects?.some((e) => e.name === n));
      const mode = saveMode(dez ? 'disadvantage' : 'normal', t, ab, actor);
      const sv = resolveSave({ extra: saveDice(t, ab), modifier: t.saves[ab], dc, mode }, rollTag(rng, { by: t.id }));
      failed = !sv.success;
      const dice = spec.hasar ? expr(byLevel(spec.hasar.zar, actor.level) ?? '0', actor) : '';
      const dmg = spec.hasar && (failed || spec.yari) ? rollDice(dice, rollTag(rng, { kind: 'damage', by: actor.id })) : { rolls: [] as number[], total: 0 };
      const amount = spec.hasar ? saveDamage(t, ab, sv.success, dmg.total, !!spec.yari) : 0;
      const adj = amount > 0 ? adjustDamage(amount, spec.hasar?.tur ?? '', profileOf(t)) : { amount: 0, note: null };
      const fx = damageEffects(t, adj.amount, spec.hasar?.tur ?? '', false, rng);
      applied = adj.amount;
      events.push({ type: 'save_resolved', actorId: actor.id, targetId: t.id, label: spec.ad, ability: ab, dc, mode, reasons: [],
        d20: sv.d20?.rolls ?? [], natural: sv.d20?.kept ?? null, total: sv.total, success: sv.success,
        damageRolls: dmg.rolls, rawDamage: dmg.total, appliedDamage: adj.amount, damageType: spec.hasar?.tur ?? '', damageNote: adj.note,
        targetHpAfter: fx.hpAfter, conditionsAdded: [], effects: fx.effects, ...(sv.extra ? { bonusDice: sv.extra } : {}) });
      if (sv.success && spec.cesaret) events.push({ type: 'effect_added', targetId: t.id, effect: { id: cesaretId(f.key, actor), name: 'Cesaret', sourceId: actor.id, until: state.round + spec.cesaret, icon: '🛡' } });
      if (sv.success && legendary && spec.efsaneviBasariSure && etki) {
        events.push({ type: 'effect_added', targetId: t.id, effect: makeEffect({ ...etki, sure: spec.efsaneviBasariSure }, markId, actor, state, false) });
      }
    } else if (spec.hasar && isFoe) {
      // Kurtulmasız hasar (Mantar).
      const d = rollDice(expr(byLevel(spec.hasar.zar, actor.level) ?? '0', actor), rollTag(rng, { kind: 'damage', by: actor.id }));
      const adj = adjustDamage(d.total, spec.hasar.tur, profileOf(t));
      const fx = damageEffects(t, adj.amount, spec.hasar.tur, false, rng);
      applied = adj.amount;
      events.push({ type: 'save_resolved', actorId: actor.id, targetId: t.id, label: spec.ad, ability: 'con', dc: 0, mode: 'normal', reasons: [],
        d20: [], natural: null, total: 0, success: false, damageRolls: d.rolls, rawDamage: d.total, appliedDamage: adj.amount, damageType: spec.hasar.tur,
        damageNote: adj.note, targetHpAfter: fx.hpAfter, conditionsAdded: [], effects: fx.effects });
    }
    void applied;
    if (spec.iyilestir) {
      const h = rollDice(expr(byLevel(spec.iyilestir, actor.level) ?? '0', actor), rollTag(rng, { kind: 'heal', by: actor.id }));
      const amount = Math.max(0, Math.min(h.total, t.maxHp - t.hp));
      events.push({ type: 'healed', actorId: actor.id, targetId: t.id, label: spec.ad, amount, targetHpAfter: t.hp + amount });
    }
    if (spec.tempHp) {
      const n = spec.tempHp.includes('d') ? rollDice(expr(spec.tempHp, actor), rollTag(rng, { kind: 'heal', by: actor.id })).total : num(spec.tempHp, actor);
      if (n > 0) events.push({ type: 'temp_hp', targetId: t.id, amount: n, label: spec.ad });
    }
    if (spec.moral && moraleOn(state) && t.moralMax !== undefined) {
      const now = t.moral ?? t.moralMax;
      const to = Math.min(t.moralMax, now + spec.moral);
      if (to !== now) events.push({ type: 'moral_changed', targetId: t.id, delta: to - now, moral: to, reason: 'toparlama', byId: actor.id });
    }
    for (const c of spec.temizle ?? []) if (t.conditions.includes(c)) events.push({ type: 'condition_ended', targetId: t.id, condition: c, reason: spec.ad });
    if (spec.itme && failed && isFoe && actor.pos) events.push(...pushAwayEvents(state, actor.pos, t.id, spec.itme, actor.id, rng));
    const self = t.id === actor.id && spec.kendiEtki;
    const e = self ? spec.kendiEtki : etki;
    if (e && (!isFoe || failed)) events.push({ type: 'effect_added', targetId: t.id, effect: makeEffect(e, markId, actor, state, legendary) });
  }
  return finish(state, events);
}

/** Buyruk: dost tepkisini harcamadan en yakın düşmana tek silah saldırısı (kayıtlı saldırı yolu). */
function decreeEvents(state: BattleState, actor: Combatant, ally: Combatant, rng: Rng): BattleEvent[] {
  const api = strikeApi();
  if (!api) return [];
  const foes = Object.values(state.combatants).filter((c) => c.side !== ally.side && alive(c) && api.can(state, ally.id, c.id))
    .sort((a, b) => a.hp - b.hp);
  const foe = foes[0];
  return foe ? api.strike(state, ally.id, foe.id, rng) : [];
}

/**
 * Saldırı kancası (silah isabeti): Hüküm (hükümlüye Sneak Attack zarı başına +1; d6 → d8 ortalaması), İnfaz
 * (hükümlüye Sneak Attack'lı isabet, uzun dinlenmede bir: zarlar en yüksek ve eşikte CON kurtulması ya da ölüm),
 * Yıpranmışlığın Gücü (öfkedeyken +min(PB, ⌊eksik puan / 2⌋)).
 */
export function imzaHit(state: BattleState, actor: Combatant, target: Combatant, extras: ExtraDamage[], weaponRaw: number, rng: Rng): { extras: ExtraDamage[]; after: BattleEvent[] } | null {
  const sub = imzaOf(actor);
  if (!sub || !imzaOn(state, sub)) return null;
  const out: ExtraDamage[] = [];
  const after: BattleEvent[] = [];
  const sneak = extras.find((x) => x.label === 'Sneak Attack');
  const marked = target.effects?.some((e) => e.id === effectId(`imza:${sub}/verdict`, actor));
  if (sneak && marked) {
    const n = sneak.rolls.length;
    out.push({ label: 'Hüküm', rolls: [], raw: n, applied: adjustDamage(n, sneak.type, profileOf(target)).amount, type: sneak.type, note: null });
    const inf = pasifler(actor).find((p) => p.ozellik === 'execution');
    if (inf && resourceLeft(actor, 'imzaInfaz') > 0) {
      after.push({ type: 'feature_used', actorId: actor.id, feature: 'imzaInfaz', remaining: resourceLeft(actor, 'imzaInfaz') - 1 });
      const gain = sneak.rolls.reduce((s, r) => s + (6 - r), 0);
      if (gain > 0) out.push({ label: 'İnfaz', rolls: [], raw: gain, applied: adjustDamage(gain, sneak.type, profileOf(target)).amount, type: sneak.type, note: null });
      const dealt = weaponRaw + [...extras, ...out].reduce((s, x) => s + x.applied, 0);
      const left = target.hp - dealt;
      if (!isLegendary(target) && left > 0 && left < actor.level * 4) {
        const dc = imzaDc(actor, ['dex']);
        const sv = resolveSave({ extra: saveDice(target, 'con'), modifier: target.saves.con, dc, mode: saveMode('normal', target, 'con', actor) }, rollTag(rng, { by: target.id }));
        if (!sv.success) out.push({ label: 'İnfaz (ölüm)', rolls: [], raw: left, applied: left, type: '', note: null });
      }
    }
  }
  const worn = pasifler(actor).find((p) => p.ozellik === 'strength-of-the-worn');
  if (worn && actor.rage) {
    const y = worn.etki.yipranma as { tavanBolen: number; carpan: number };
    const cap = actor.moralMax ?? (3 + mod(actor, 'wis') + actor.proficiency);
    const ceiling = Math.max(1, Math.floor(cap / y.tavanBolen));
    const now = actor.moralMax !== undefined ? Math.min(actor.moral ?? ceiling, ceiling) : ceiling;
    const bonus = Math.min(actor.proficiency, Math.floor((cap - now) * y.carpan));
    if (bonus > 0) out.push({ label: 'Yıpranmışlığın Gücü', rolls: [], raw: bonus, applied: adjustDamage(bonus, extras[0]?.type ?? '', profileOf(target)).amount, type: extras[0]?.type ?? '', note: null });
  }
  return out.length || after.length ? { extras: out, after } : null;
}

