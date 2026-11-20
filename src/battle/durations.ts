/**
 * Süreli durumlar (`Combatant.conditionTimers`), Kaçın (Dodge) ve Yardım (Help).
 *
 * Süre türleri: belirli tur sayısı; "sahibinin sonraki turunun başına / sonuna dek";
 * "save ends" (hedef her kendi turunun sonunda kurtarma zarı atar); süresiz (sayaçsız durum).
 * Sayaçlar tur başı/sonu kancalarında (`timerEvents`) işler; biten durum `condition_ended` olayı üretir.
 * Saldırı ve büyü etkilerinin süreleri `data/condition-effects.json`'da.
 */
import { adjacent3D, k73bOn } from './adjacency';
import { saveDice } from './effectDice';
import effectsJson from '../../data/condition-effects.json';
import classFeatureData from '../../data/class-features.json';
import type { Ability } from '../rules/abilities';
import { resolveSave } from '../rules/attack';
import { rollTag, type Rng, type RollMode } from '../rules/dice';
import { autoFailsStrDexSave, isIncapacitated } from '../rules/conditions';
import { distance, type Offset } from '../rules/hex';
import { fail, finish, isTargetable, type CommandResult } from './common';
import { ruleVersion } from './ruleVersion';
import { saveDisVs, type SaveCtx } from './altSoySurum';
import { pfegRepeatAdv } from './mind';
import { allyEscapeEvents } from './mapcommands';
import type { BattleEvent, BattleState, Combatant, ConditionTimer, StageSpec } from './types';

/** Görev A3: ikinci aşamanın tanımı (eski biçim: yalnızca durum adı → kalan süre, save'siz). */
export const stageOf = (e: string | StageSpec): StageSpec => (typeof e === 'string' ? { condition: e } : e);
import { damageEffect } from './maprules';

export const DODGE = 'Dodge';
/** Yardım işareti hedef düşmanda durur: `Help:<yardım eden taraf>`. */
export const helpMark = (side: Combatant['side']) => `Help:${side}`;
export const isMarker = (condition: string) => condition === DODGE || condition.startsWith('Help:');

export interface Spec {
  condition?: string;
  owner?: 'source' | 'target';
  end?: 'turnStart' | 'turnEnd';
  rounds?: number;
  save?: { ability: Ability; dc: number };
  saveEnds?: boolean | { ability: Ability; dc: number };
  ability?: Ability;
  maxRounds?: number;
  /** Durum sürerken hedefin her tur başı hasarı. */
  dot?: { dice: string; type: string };
  /**
   * İki aşamalı durum (Görev WIZARD: Sleep; Görev A3: genel, veriyle): A durumu `condition`, kurtarma türü ve DC
   * `saveEnds` (ya da saldırının/büyünün save'i), A'nın süresi `maxRounds`; tekrar save'i başarısız olunca ikinci aşama
   * (`StageSpec`: B durumu, süresi, B'de save sürer mi). Eski biçim: yalnızca B'nin adı (kalan süre, save'siz).
   */
  escalate?: string | StageSpec;
  /** Hasar alınca durum ve sayaç biter (Sleep). */
  wakeOnDamage?: boolean;
  /** Kuyruk K61: bu kural sürümünden itibaren geçerli (eski savaşta süreli durum yok). */
  surum?: number;
}
const EFFECTS = effectsJson as unknown as { attacks: Record<string, Spec>; spells: Record<string, Spec> };

/** Canavar saldırısının süreli etkisi (yoksa undefined). */
export const attackEffect = (monsterId: string | undefined, attackName: string): Spec | undefined =>
  monsterId ? EFFECTS.attacks[`${monsterId}:${attackName}`] : undefined;
export const spellEffect = (spellName: string): Spec | undefined => EFFECTS.spells[spellName];
export const supportedAttackEffects = () => Object.keys(EFFECTS.attacks);
export const supportedSpellEffects = () => Object.keys(EFFECTS.spells);

const currentActor = (state: BattleState) => state.order[state.turnIndex];

/**
 * Süre tanımından sayaç. "Sonraki turunun sonuna dek": sahibi şu an sıradaysa bu turun sonu sayılmaz
 * (count 2), değilse ilk tur sonunda biter (count 1). "Başına dek" her zaman bir sonraki tur başı.
 */
export function makeTimer(
  state: BattleState, spec: Spec, condition: string, sourceId: string | undefined, targetId: string, label: string,
  save?: { ability: Ability; dc: number },
): ConditionTimer {
  if (spec.saveEnds) {
    const s = typeof spec.saveEnds === 'object' ? spec.saveEnds : save;
    return { condition, ownerId: targetId, end: 'turnEnd', count: spec.maxRounds ?? 10, label, ...(sourceId ? { sourceId } : {}), ...(s ? { save: s } : {}), ...(spec.dot ? { dot: spec.dot } : {}),
      ...(spec.escalate ? { escalate: spec.escalate } : {}), ...(spec.wakeOnDamage ? { wakeOnDamage: true } : {}) };
  }
  const ownerId = spec.owner === 'source' && sourceId ? sourceId : targetId;
  const end = spec.end ?? 'turnEnd';
  const count = spec.rounds ?? (end === 'turnEnd' && currentActor(state) === ownerId ? 2 : 1);
  return { condition, ownerId, end, count, label, ...(sourceId ? { sourceId } : {}), ...(spec.dot ? { dot: spec.dot } : {}) };
}

/** Süreli durum uygulama olayı. */
export function timedCondition(
  state: BattleState, targetId: string, spec: Spec, sourceId: string | undefined, label: string,
  save?: { ability: Ability; dc: number },
): BattleEvent {
  const condition = spec.condition ?? '';
  return { type: 'condition_changed', targetId, condition, present: true, reason: label, ...(sourceId ? { sourceId } : {}),
    timer: makeTimer(state, spec, condition, sourceId, targetId, label, save) };
}

/**
 * Bir savaşçının tur başı ya da sonu: sahibi o olan sayaçlar işler. "Save ends" ise hedef kurtarma
 * zarı atar (başarıda biter); değilse sayaç azalır, 0'a inince durum biter.
 */
export function timerEvents(state: BattleState, ownerId: string, end: ConditionTimer['end'], rng: Rng): BattleEvent[] {
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    for (const t of c.conditionTimers ?? []) {
      if (t.ownerId !== ownerId || t.end !== end) continue;
      if (t.save && c.hp > 0) {
        // Kuyruk A6: Protection from Evil and Good (kaynak korunulan türdense Charmed/Frightened save'i avantajlı).
        const pfeg = pfegRepeatAdv(state, c.id, t.sourceId, [t.condition]);
        const r = resolveSave({ extra: saveDice(c, t.save.ability), modifier: c.saves[t.save.ability], dc: t.save.dc, mode: saveMode(pfeg ? 'advantage' : 'normal', c, t.save.ability, undefined, { against: [t.condition] }),
          autoFail: (t.save.ability === 'str' || t.save.ability === 'dex') && autoFailsStrDexSave(c.conditions) }, rollTag(rng, { by: c.id }));
        out.push({ type: 'condition_save', targetId: c.id, condition: t.condition, ability: t.save.ability, dc: t.save.dc,
          d20: r.d20?.rolls ?? [], total: r.total ?? 0, success: r.success, ...(r.extra ? { bonusDice: r.extra } : {}) });
        if (r.success) { out.push({ type: 'condition_ended', targetId: c.id, condition: t.condition, reason: 'kurtarma zarı başarılı' }); continue; }
        // İki aşamalı durum (Sleep, Cockatrice): ikinci başarısız save'de ikinci aşamaya geçer (`stageOf`).
        if (t.escalate) {
          const st = stageOf(t.escalate);
          out.push({ type: 'condition_ended', targetId: c.id, condition: t.condition, reason: `${t.label}: ikinci başarısız save` },
            { type: 'condition_changed', targetId: c.id, condition: st.condition, present: true, reason: t.label, ...(t.sourceId ? { sourceId: t.sourceId } : {}),
              timer: { condition: st.condition, ownerId: c.id, end: 'turnEnd', count: st.rounds ?? Math.max(1, t.count - 1), label: t.label,
                ...(t.sourceId ? { sourceId: t.sourceId } : {}), ...(st.saveEnds ? { save: t.save } : {}), ...(t.wakeOnDamage ? { wakeOnDamage: true } : {}) } });
          continue;
        }
      }
      out.push(t.count <= 1
        ? { type: 'condition_ended', targetId: c.id, condition: t.condition, reason: 'süre doldu' }
        : { type: 'condition_timer', targetId: c.id, condition: t.condition, count: t.count - 1 });
    }
  }
  return out;
}

/** Kaçın etkin mi: durumu var, etkisiz (incapacitated) değil ve hızı 0 değil (Grappled/Restrained). */
export function dodgeActive(conds: string[]): boolean {
  return conds.includes(DODGE) && !isIncapacitated(conds) && !conds.some((x) => x === 'Grappled' || x === 'Restrained');
}

/** Kurtarma zarını yapan: durumları, avantajlı save'leri (Danger Sense) ve Rage (STR avantajı). */
export type SaveSubject = { conditions: string[]; saveAdvantage?: Ability[]; packStrAdv?: boolean; rage?: unknown; rageStrAdvantage?: boolean; hp?: number; maxHp?: number; authorityAdv?: boolean; auraSaveDis?: boolean; srd83?: true; srd96?: true; allyAura?: { saveAdvAll?: true };
  effects?: Array<{ name?: string; saveDisVs?: Array<{ damage?: string; condition?: string }>; saveDisVsGenis?: true; saveAdv?: Ability[]; saveDis?: Ability[]; saveDisAll?: boolean; saveAdvVs?: string[]; bloodiedAdv?: { save?: boolean }; firstRoll?: { mode: 'advantage' | 'disadvantage'; on: Array<'attack' | 'save'> }; speedZero?: boolean }> };

/**
 * G01 (yalnız görünüm): save kipinin bir kaynağı. `key` `data/neden-metinleri.json` `saveKipi` anahtarı; `name` kaynağın adı
 * (durum, süren etki, özellik). Olaya `save_resolved.modeWhy` olarak yazılır (reducer yok sayar; `annotateSaveWhy`).
 */
export interface SaveWhy { kip: 'adv' | 'dis'; key: string; name?: string }

/** Avantajlı save özelliğinin adı (`stat: saveAdvantage`; yalnız Danger Sense DEX): veriden. */
const SAVE_ADV_FEATURES: Array<{ name: string; abilities: Ability[] }> = Object.entries((classFeatureData as { features: Record<string, { stat?: string; abilities?: Ability[] }> }).features)
  .filter(([, f]) => f.stat === 'saveAdvantage').map(([k, f]) => ({ name: (k.split(':')[1] ?? k).split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), abilities: f.abilities ?? [] }));

/**
 * Kurtarma zarı kipi: Kaçın etkinse DEX save'leri avantajlı; Danger Sense gibi avantajlı save'ler (Incapacitated
 * değilken); Rage sürerken STR save'leri avantajlı. Eski çağrılar yalnızca durum listesi verebilir. G01: kaynakları da
 * döndürür (`saveModeWhy`; `saveMode` aynı hesabın kipi).
 */
export function saveModeWhy(base: RollMode, who: string[] | SaveSubject, ability: Ability, source?: SaveSource, ctx?: SaveCtx): { mode: RollMode; why: SaveWhy[] } {
  const s: SaveSubject = Array.isArray(who) ? { conditions: who } : who;
  const why: SaveWhy[] = [];
  const A = (key: string, name?: string) => { why.push({ kip: 'adv', key, ...(name ? { name } : {}) }); };
  const D = (key: string, name?: string) => { why.push({ kip: 'dis', key, ...(name ? { name } : {}) }); };
  const fx = s.effects ?? [];
  // Kuyruk 19 (11–20): Holy Nimbus: Fiend/Undead etkilerine save avantajı (kaynağı bilinen save'lerde).
  const vs = source?.creatureType?.toLowerCase();
  if (vs) for (const e of fx) if (e.saveAdvVs?.includes(vs)) A('vsType', e.name);
  // GENEL96 A11 (sürüm 96+, `srd96`): etkiden gelen hız 0 Kaçın'ın DEX save avantajını da kaldırır (SRD 5.2.1 s. 181).
  if (ability === 'dex' && dodgeActive(s.conditions) && !(s.srd96 && s.effects?.some((e) => e.speedZero))) A('dodge');
  if (s.saveAdvantage?.includes(ability) && !isIncapacitated(s.conditions)) A('feature', SAVE_ADV_FEATURES.find((f) => f.abilities.includes(ability))?.name);
  if (ability === 'str' && !!s.rage && s.rageStrAdvantage === true) A('rage');
  // Kuyruk A6 (Conjure Animals; `syncAuras`): sürünün 5 ft içinde STR save avantajı.
  if (ability === 'str' && s.packStrAdv) A('pack');
  // Görev B1: süren etkilerin save avantajı (Haste DEX, Beacon of Hope WIS, Gaseous Form, Enlarge STR).
  for (const e of fx) if (e.saveAdv?.includes(ability)) A('effect', e.name);
  // Kuyruk 19 (SRD canavar yetenekleri): Bloodied Frenzy (Bloodied'da save avantajı), Aura of Authority.
  if (s.hp !== undefined && s.hp <= (s.maxHp ?? 0) / 2) for (const e of fx) if (e.bloodiedAdv?.save) A('bloodied', e.name);
  if (s.authorityAdv) A('authority');
  // Mekanik matris B13 (sürüm 83+, `syncAuras`): Holy Aura "creatures of your choice have Advantage on all saving throws".
  if (s.allyAura?.saveAdvAll) A('holyAura');
  // Kuyruk P10: ek paket `isaret.kurtulmaAvantaji` (kaynak işaretliyse, işaretleyenin kurtulması avantajlı).
  const sid = (s as { id?: string }).id;
  if (sid && source?.effects?.some((e) => e.pkSaveAdvFor === sid)) A('pkMark');
  // Görev B1: süren etkinin save dezavantajı (Reduce, Ray of Enfeeblement: STR).
  // Kuyruk AS1b (sürüm 71+ alt soy etkisi): hasar türü / durum bağlamlı kurtarma dezavantajı (`saveDisVs`).
  if (s.auraSaveDis) D('aura');
  for (const e of fx) if (saveDisVs([e], ctx)) D('lineage', e.name);
  for (const e of fx) if (e.saveDis?.includes(ability) || e.saveDisAll || (e.firstRoll?.on.includes('save') && e.firstRoll.mode === 'disadvantage')) D('effect', e.name);
  // Mekanik matris B01 (sürüm 83+, `srd83` işareti): SRD 5.2.1 Restrained "You have Disadvantage on Dexterity saving throws."
  if (ability === 'dex' && !!s.srd83 && s.conditions.includes('Restrained')) D('condition', 'Restrained');
  // Görev P6: ek paket `buyuDegisimi.kurtulmaDezavantaji` (kaynağın büyüleri ve alan etkileri; koşulsuz pasif).
  if (source?.paket?.ozellikler.some((f) => f.ilkeller.some((p) => p.tur === 'buyuDegisimi' && p.kurtulmaDezavantaji === true && !p.kosul))) D('pkSpell');
  // Kuyruk K54c: Yıldız Falı (Uğurlu): ilk kurtulma zarı avantajlı.
  for (const e of fx) if (e.firstRoll?.on.includes('save') && e.firstRoll.mode === 'advantage') A('effect', e.name);
  // Avantaj ve dezavantaj (tabanla birlikte) birbirini götürür (SRD).
  const anyAdv = base === 'advantage' || why.some((w) => w.kip === 'adv'), anyDis = base === 'disadvantage' || why.some((w) => w.kip === 'dis');
  return { mode: anyAdv && anyDis ? 'normal' : anyAdv ? 'advantage' : anyDis ? 'disadvantage' : 'normal', why };
}
type SaveSource = { creatureType?: string; paket?: { ozellikler: Array<{ ilkeller: Array<Record<string, unknown>> }> }; effects?: Array<{ pkSaveAdvFor?: string }> };
export function saveMode(base: RollMode, who: string[] | SaveSubject, ability: Ability, source?: SaveSource, ctx?: SaveCtx): RollMode {
  return saveModeWhy(base, who, ability, source, ctx).mode;
}

/** Kaçın: eylem; sonraki turunun başına dek. */
export function executeDodge(state: BattleState, actor: Combatant): CommandResult {
  const spec: Spec = { condition: DODGE, owner: 'target', end: 'turnStart' };
  return finish(state, [timedCondition(state, actor.id, spec, actor.id, 'Kaçın')]);
}

/** Kuyruk K73b (sürüm 63+): Yardım ve sarsma 3B bitişiklikle (dikey ≤ 5 ft, döşeme keser); öncesinde yatay altıgen. */
const near5 = (state: BattleState, a: Combatant, b: Combatant): boolean =>
  (k73bOn(state) ? adjacent3D(state, a, b) : distance(a.pos as Offset, b.pos as Offset) <= 1);

/** Yardım: eylem; bitişik düşmana karşı tarafının ilk saldırısı avantajlı, sonraki turunun başına dek. */
export function executeHelp(state: BattleState, actor: Combatant, targetId: string, rng?: Rng): CommandResult {
  const target = state.combatants[targetId];
  if (!target || !isTargetable(target)) return fail('Hedef bulunamadı.');
  // Kuyruk A6 (sürüm 35): bitişik dosta yardım = sarsarak uyandırma (Sleep, Hypnotic Pattern: "someone … takes an action
  // to shake it"); hasarla biten uyku sayaçları ve `shakeable` etkiler biter.
  if (target.side === actor.side && target.id !== actor.id && ruleVersion(state) >= 35) {
    if (state.map && (!actor.pos || !target.pos || !near5(state, actor, target))) return fail('Sarsmak için dost bitişik olmalı.');
    const timers = (target.conditionTimers ?? []).filter((t) => t.wakeOnDamage && target.conditions.includes(t.condition));
    const effs = (target.effects ?? []).filter((e) => e.shakeable);
    // Ensnaring Strike: dostu sarmaşıktan kurtarma (Athletics).
    const freed = !timers.length && !effs.length && rng ? allyEscapeEvents(state, actor, target, rng) : null;
    if (freed) return finish(state, freed);
    if (!timers.length && !effs.length) return fail(`${target.name} sarsılarak uyandırılacak ya da kurtarılacak bir etki altında değil.`);
    return finish(state, [
      { type: 'map_note', text: `${actor.name}, ${target.name} adlı dostunu sarsarak kendine getirdi.` },
      ...timers.map((t): BattleEvent => ({ type: 'condition_changed', targetId: target.id, condition: t.condition, present: false, reason: 'sarsıldı' })),
      ...effs.map((e): BattleEvent => ({ type: 'effect_ended', targetId: target.id, effectId: e.id, name: e.name, reason: 'expired' })),
    ]);
  }
  if (target.side === actor.side) return fail('Yardım için bitişik bir düşman seç.');
  // Haritasız savaşta mesafe yok (yakın dövüş menzilinde sayılır).
  if (state.map && (!actor.pos || !target.pos || !near5(state, actor, target))) return fail('Hedef düşman bitişik olmalı.');
  const spec: Spec = { condition: helpMark(actor.side), owner: 'source', end: 'turnStart' };
  // GENEL96: etiketin sonu `genel96.ts` `HELP_LABEL` (yardım edenin kendisi yararlanmaz; Stunning Strike ayrı).
  return finish(state, [timedCondition(state, target.id, spec, actor.id, `${actor.name}: Yardım`)]);
}

/**
 * Büyüyle eklenen durumların süresi ("save ends": hedef her tur sonunda büyünün yeteneği — ya da
 * tanımdaki `ability` — ve büyücünün DC'siyle kurtarma zarı atar). Konsantrasyon bağı ayrıca sürer.
 */
export function spellTimerEvents(
  state: BattleState, spellName: string, targetId: string, added: string[], ability: Ability, dc: number,
): BattleEvent[] {
  const spec = spellEffect(spellName);
  if (!spec || added.length === 0) return [];
  if (spec.surum && (state.kuralSurumu ?? 1) < spec.surum) return [];
  const save = { ability: spec.ability ?? ability, dc };
  return added.map((condition) => ({
    type: 'condition_changed', targetId, condition, present: true, reason: spellName,
    timer: makeTimer(state, { ...spec, saveEnds: true }, condition, undefined, targetId, spellName, save),
  }));
}

/** Süren durum hasarı: savaşçının tur başında, üzerindeki her `dot`'lu süreli durum için. */
export function dotEvents(state: BattleState, combatantId: string, rng: Rng): BattleEvent[] {
  const c = state.combatants[combatantId];
  if (!c || c.hp <= 0) return [];
  const out: BattleEvent[] = [];
  let cur = c;
  for (const t of c.conditionTimers ?? []) {
    if (!t.dot || cur.hp <= 0) continue;
    const ev = damageEffect(cur, 'condition', `${t.label}: ${t.condition}`, { dice: t.dot.dice, type: t.dot.type }, rng);
    out.push(ev);
    if (ev.type === 'map_effect' && ev.hpAfter !== undefined) cur = { ...cur, hp: ev.hpAfter };
  }
  return out;
}
