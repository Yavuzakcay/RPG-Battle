/**
 * Harita kuralları motoru (Adım 8). Kurallar haritanın JSON'undaki varyantta (`rules`) durur;
 * parametreleri (DC, hasar, tur sayısı) oradan okunur, kodda sabit yoktur. Kurallar dört
 * kancada çalışır:
 *
 * - tur başı (sırası gelen için): lav kenarı, batak, derin su, kalıcı zehir;
 * - tur sonu (sırası biten için): çöl sıcağı, soğuk, alevde bitirme, kalıcı zehirden kurtulma;
 * - altıgene giriş (yürürken her adımda): alev, buz, batak, tuzak;
 * - saldırı (menzil denetiminde): kum fırtınası, fırtına, karanlık, mazgal.
 *
 * GM tetiklemeli kurallar (patlama, lav yükselmesi, dalga) `map_trigger` komutuyla çalışır.
 * İsteğe bağlı edilgen kurallar (karanlık, masumları koru) kurulumda `MapState.options` ile açılır.
 */
import { bodyOf, gap, isMultiHex53 } from './body';
import { discoverOnEnter, discoverOnTurnStart } from './hiddenObjects';
import { desertEnterEvents, floodTrigger, stormAgainstWind, stormName } from './desert';
import { avalancheTrigger, brazierLights, snowMoveCost, weatherAttack, wildsEnterEvents, wildsTurnEndEvents, wildsTurnStartEvents } from './wilds';
import { checkBase, ruleVersion } from './ruleVersion';
import { globalRule, ruleEnabled, withParams } from './ruleControl';
import { isLiquidTile, waterWalks } from './deepWater';
import { senseSees, sightSenseFt } from './sight';
import { extrasTotal, rollExtras, type ExtraDie } from '../rules/attack';
import { finishCheck, saveDice } from './effectDice';
import { saveMode } from './durations';
import { getMap, type MapRuleData } from '../map/maps';
import { mechanicsAt } from './spellVersion';
import { spells } from '../data';
import { terrainOf, type TerrainType } from '../map/terrain';
import type { Ability } from '../rules/abilities';
import { autoFailsStrDexSave } from '../rules/conditions';
import { adjustDamage, halfDamage } from '../rules/damage';
import { parseDice, rollD20, rollDice, rollTag, type RollMode, type Rng } from '../rules/dice';
import { distance, neighbors, sameHex, withinRange, type Offset } from '../rules/hex';
import type { ModeSource } from '../rules/modes';
import { checkMode, skillBonus, SKILLS, type Skill } from '../rules/skills';
import { fail, finish, isTargetable, type CommandResult, type Failure } from './common';
import { damageEffects } from './damage-effects';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant } from './types';
import { groundBound, hovers, isAirborne } from './flight';
import { standingOn } from './stand';
import { soyFallMult } from './altSoySurum';

// ---------------------------------------------------------------------------------------------
// Kural verisi

/** GM'in komutla tetiklediği kurallar. */
export const TRIGGERED = ['eruption', 'lavaRise', 'swell', 'avalanche', 'flashFlood'] as const;

/** Varyantın kuralları; isteğe bağlı edilgen kurallar yalnızca açıldıysa. */
export function activeRules(state: BattleState): MapRuleData[] {
  if (!state.map) return [];
  const map = getMap(state.map.id);
  const variant = map.variants.find((v) => v.id === state.map?.variantId) ?? map.variants[0];
  const options = state.map.options ?? [];
  const v = ruleVersion(state);
  const m = state.map;
  // Kuyruk 24: kural sürümü (`surum`), Game Master anahtarı ve parametreleri (`ruleControl.ts`).
  return (variant?.rules ?? []).filter(
    (r) => (r.optional !== true || (TRIGGERED as readonly string[]).includes(r.id) || options.includes(r.id))
      && (typeof r.surum !== 'number' || v >= r.surum) && ruleEnabled(m, r.id),
  ).map((r) => withParams(r, m.ruleParams));
}

/** Varyantın isteğe bağlı edilgen kuralları (kurulumda açılıp kapatılır). */
export function optionalRules(mapId: string, variantId: string): MapRuleData[] {
  const map = getMap(mapId);
  const variant = map.variants.find((v) => v.id === variantId) ?? map.variants[0];
  return (variant?.rules ?? []).filter((r) => r.optional === true && !(TRIGGERED as readonly string[]).includes(r.id));
}

export function ruleOf(state: BattleState, id: string): MapRuleData | undefined {
  return activeRules(state).find((r) => r.id === id);
}

const num = (r: MapRuleData | Record<string, unknown>, key: string): number => {
  const v = r[key];
  if (typeof v !== 'number') throw new Error(`Harita kuralı "${String(r.id)}": "${key}" sayı olmalı`);
  return v;
};
const text = (r: MapRuleData | Record<string, unknown>, key: string): string => {
  const v = r[key];
  if (typeof v !== 'string') throw new Error(`Harita kuralı "${String(r.id)}": "${key}" metin olmalı`);
  return v;
};
const obj = (r: MapRuleData | Record<string, unknown>, key: string): Record<string, unknown> => {
  const v = r[key];
  if (typeof v !== 'object' || v === null) throw new Error(`Harita kuralı "${String(r.id)}": "${key}" nesne olmalı`);
  return v as Record<string, unknown>;
};
/** JSON'da "CON", "DEX" gibi yazılan ability. */
const ability = (v: unknown): Ability => String(v).toLowerCase() as Ability;
/** JSON'da "Athletics", "Perception" gibi yazılan beceri. */
const skill = (v: unknown): Skill => {
  const found = (Object.keys(SKILLS) as Skill[]).find((s) => SKILLS[s].name === v);
  if (!found) throw new Error(`Bilinmeyen beceri: ${String(v)}`);
  return found;
};

/** JSON'daki 1 tabanlı [sütun, satır]; aynalı haritada sütun ters çevrilir. */
export function ruleHex(state: BattleState, xy: unknown): Offset {
  const [c, r] = xy as [number, number];
  const cols = state.map?.tiles[0]?.length ?? 15;
  return { col: state.map?.mirrored ? cols - c : c - 1, row: r - 1 };
}

const tileAt = (state: BattleState, o: Offset): TerrainType => terrainOf(state.map?.tiles[o.row]?.[o.col] ?? '#');
const sizeOf = (state: BattleState) => ({ cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 });
const flying = (c: Combatant) => isAirborne(c);
/** Kuyruk U1a: lav, alev zemini ve derin su süzülene de işler (uçan değil). */
const lavaSafe = (c: Combatant) => !groundBound(c);

const alive = (c: Combatant) => c.pos !== null && c.life !== 'dead' && (c.hp > 0 || c.regenPending);

// ---------------------------------------------------------------------------------------------
// Olay yapıcılar

interface Hit {
  dice: string;
  type: string;
  /** Hasar önceden atıldıysa (patlama: herkese aynı zar). */
  rolled?: { rolls: number[]; total: number };
  halfOnSave?: boolean;
  /** Hasardan düşülen (Slow Fall: 5 × Monk seviyesi). */
  reduce?: number;
}

/** Hasarı uygular: direnç/bağışıklık, 0 HP etkileri. */
function hurt(c: Combatant, hit: Hit, half: boolean, rng: Rng) {
  const rolled = hit.rolled ?? rollDice(hit.dice, rollTag(rng, { kind: 'damage' }));
  const raw = Math.max(0, (half ? halfDamage(rolled.total) : rolled.total) - (hit.reduce ?? 0));
  const adj = adjustDamage(raw, hit.type, c);
  const fx = damageEffects(c, adj.amount, hit.type, false, rng);
  return {
    damage: { rolls: rolled.rolls, raw, applied: adj.amount, type: hit.type, note: adj.note },
    hpAfter: fx.hpAfter,
    effects: fx.effects,
  };
}

function roll(c: Combatant, label: string, bonus: number, dc: number, mode: RollMode, rng: Rng, autoFail = false, extra: ExtraDie[] = [], kind: 'save' | 'check' = 'save') {
  const d = rollD20(mode, rollTag(rng, { by: c.id, bonus }));
  // Zar eklentisi (Bless/Bane save'e, Guidance seçilen beceriye; Görev R2).
  const total = d.kept + bonus + extrasTotal(rollExtras(extra, kind, rollTag(rng, { by: c.id })));
  return { label, dc, d20: d.rolls, natural: d.kept, total, success: !autoFail && total >= dc, mode };
}

/** Save'li etki: başarısızsa hasar (veya `halfOnSave` ile başarılıysa yarısı) ve durum. */
export function saveEffect(
  c: Combatant, rule: string, what: string, save: Ability, dc: number, rng: Rng,
  opts: { hit?: Hit; onFailCondition?: string; onFailStatus?: Partial<Combatant['mapStatus']>; stopOnFail?: boolean } = {},
): BattleEvent {
  const auto = (save === 'str' || save === 'dex') && autoFailsStrDexSave(c.conditions);
  // Görev AS1a (77+): alt soyun hasar/durum kurtarma dezavantajı harita mekaniklerinde de (`genis`).
  const r = roll(c, `${save.toUpperCase()} save`, c.saves[save], dc, saveMode('normal', c, save, undefined, { ...(opts.hit?.type ? { damage: opts.hit.type } : {}), ...(opts.onFailCondition ? { against: [opts.onFailCondition] } : {}), genis: true }), rng, auto, saveDice(c, save));
  const ev: Extract<BattleEvent, { type: 'map_effect' }> = { type: 'map_effect', rule, targetId: c.id, text: what, roll: r };
  if (opts.hit && (!r.success || opts.hit.halfOnSave)) Object.assign(ev, hurt(c, opts.hit, r.success, rng));
  if (!r.success && opts.onFailCondition && !c.conditions.includes(opts.onFailCondition)) ev.addCondition = opts.onFailCondition;
  if (!r.success && opts.onFailStatus) ev.mapStatus = opts.onFailStatus;
  if (!r.success && opts.stopOnFail) ev.stopMovement = true;
  return ev;
}

/** Beceri kontrollü etki (bataktan çıkış, batma). */
export function checkEffect(c: Combatant, rule: string, what: string, sk: Skill, dc: number, rng: Rng, state?: BattleState): Extract<BattleEvent, { type: 'map_effect' }> {
  const base = sk === 'stealth' && c.stealthDisadvantage ? 'disadvantage' : 'normal';
  const mode = checkMode(c, sk, state ? checkBase(state, c, base, sk) : base);
  // Reliable Talent, eklenti zarları ve ikinci şans (Görev F; `finishCheck`).
  const d = rollD20(mode, rollTag(rng, { by: c.id, bonus: skillBonus(c, sk) }));
  const r = finishCheck(c, sk, d.kept, skillBonus(c, sk), dc, mode, rng);
  return { type: 'map_effect', rule, targetId: c.id, text: what,
    roll: { label: SKILLS[sk].name, dc, d20: d.rolls, natural: d.kept, total: r.total, success: r.total >= dc, mode },
    ...(r.extra.length ? { bonusDice: r.extra } : {}) };
}

/** Düşme (SRD 5.2.1 Falling, s. 182): her 10 ft için 1d6 bludgeoning (en çok 20d6), hasar alırsa Prone. */
export function fallEffect(c: Combatant, feet: number, rng: Rng, reaction: { reduce: number; negate: boolean; name?: string; /** Kuyruk K73b: suya düşüş (SRD): başarılı kontrolle yarı hasar. */ water?: 'half' | 'full' } = { reduce: 0, negate: false }):
  Extract<BattleEvent, { type: 'map_effect' }> {
  // Kuyruk AS1b (sürüm 71+ alt soy etkisi): düşme hasarı çarpanı (Kırık Kanat uyanışı ×2; zar sayısı üst sınırı 20 çarpılmadan önce).
  const dice = Math.min(20, Math.floor(feet / 10)) * soyFallMult(c);
  // Tepki (Görev R1, `reactions.ts`): Slow Fall hasarı 5 × Monk seviyesi azaltır, Feather Fall hasarı keser.
  if (reaction.negate) return { type: 'map_effect', rule: 'fall', targetId: c.id, text: `${feet} ft düştü (${reaction.name ?? 'Feather Fall'}: hasar yok)` };
  const reduce = reaction.reduce;
  const text = reaction.water ? `${feet} ft suya düştü${reaction.water === 'half' ? ' (yarı hasar)' : ''}`
    : reduce > 0 ? `${feet} ft düştü (${reaction.name ?? 'Slow Fall'} −${reduce})` : `${feet} ft düştü`;
  const ev = { type: 'map_effect', rule: 'fall', targetId: c.id, text, ...hurt(c, { dice: `${dice}d6`, type: 'bludgeoning', reduce }, reaction.water === 'half', rng) } as Extract<BattleEvent, { type: 'map_effect' }>;
  if ((ev.damage?.applied ?? 0) > 0 && !c.conditions.includes('Prone')) ev.addCondition = 'Prone';
  return ev;
}

/** Kuralın hasarı ve (verilmişse) durumu: yanarak iniş, merdiven boşluğu, yuvarlanma. */
export function hitEffect(
  c: Combatant, rule: string, what: string, hit: { damage: string; damageType: string; condition?: string }, rng: Rng,
): Extract<BattleEvent, { type: 'map_effect' }> {
  const ev = damageEffect(c, rule, what, { dice: hit.damage, type: hit.damageType }, rng) as Extract<BattleEvent, { type: 'map_effect' }>;
  if (hit.condition && !c.conditions.includes(hit.condition) && (ev.hpAfter ?? 1) > 0) ev.addCondition = hit.condition;
  return ev;
}

/** Yanma hasarı ve durum: lav kenarında yanarak iniş (`lavJump.onFail`). */
export function burnEffect(c: Combatant, hit: { damage: string; damageType: string; condition?: string }, what: string, rng: Rng): BattleEvent {
  return hitEffect(c, 'lavJump', what, hit, rng);
}

/** Save'siz hasar. */
export function damageEffect(c: Combatant, rule: string, what: string, hit: Hit, rng: Rng): BattleEvent {
  return { type: 'map_effect', rule, targetId: c.id, text: what, ...hurt(c, hit, false, rng) };
}

// ---------------------------------------------------------------------------------------------
// Yardımcı sorgular

/** Gölge: altıgen veya bir komşusu gölge veren zemin (kaya, sütun, yıkıntı). */
export function inShade(state: BattleState, at: Offset): boolean {
  return [at, ...neighbors(at, sizeOf(state))].some((h) => tileAt(state, h).shade === true);
}

/** Barınak (soğuk): gölge veya yanında daha yüksek zemin. */
export function inShelter(state: BattleState, at: Offset): boolean {
  const here = tileAt(state, at).height;
  return inShade(state, at) || neighbors(at, sizeOf(state)).some((h) => tileAt(state, h).height > here);
}

const adjacentToLava = (state: BattleState, at: Offset) =>
  neighbors(at, sizeOf(state)).some((h) => tileAt(state, h).movement === 'deadly');

/** Batak kuralı açık ve altıgen derin batak mı. */
export function isBog(state: BattleState, at: Offset): boolean {
  const bog = ruleOf(state, 'bog');
  return bog !== undefined && state.map?.tiles[at.row]?.[at.col] === bog.terrain;
}

/**
 * Saldıran su altında mı (SRD 5.2.1 Underwater Combat): haritada derin suda (uçmuyorsa);
 * haritasız savaşta ortam "Sualtı / bataklık" ise bütün savaş su altı sayılır.
 */
export function isUnderwater(state: BattleState, c: Combatant): boolean {
  if (!state.map) return state.environmentId === 'sualt-batakl-k';
  return !!c.pos && !flying(c) && tileAt(state, c.pos).rule === 'deepWater';
}

/** Savaşçı batağa saplanmış mı (yürüyemez; çık veya çekilmeli). */
export function stuckInBog(state: BattleState, c: Combatant): boolean {
  return c.pos !== null && c.mapStatus.sink > 0 && isBog(state, c.pos);
}

/** Batma kuralı olan su (derin su, hendek) ve parametreleri; altıgen öyle değilse undefined. */
function sinkingWater(state: BattleState, at: Offset): Record<string, unknown> | undefined {
  const ch = state.map?.tiles[at.row]?.[at.col];
  for (const id of ['deepWater', 'moat']) {
    const r = ruleOf(state, id);
    if (r && r.terrain === ch && typeof r.heavyArmorSink === 'object') return obj(r, 'heavyArmorSink');
  }
  return undefined;
}

/** Yürürken içinden geçilmemesi tercih edilen altıgen: alev, batak, buz, bulunmuş tuzak. */
export function isRiskyHex(state: BattleState, at: Offset): boolean {
  const t = tileAt(state, at);
  if (t.hazard || isBog(state, at)) return true;
  const ice = ruleOf(state, 'ice');
  if (ice && state.map?.tiles[at.row]?.[at.col] === ice.terrain) return true;
  return t.rule === 'trap' && (state.map?.trapsFound ?? []).includes(trapKey(at));
}

/** Tuzaklar: tuzak kuralı açıkken tuzak harfli altıgenler. */
export function trapHexes(state: BattleState): Offset[] {
  if (!state.map || !ruleOf(state, 'trap')) return [];
  const out: Offset[] = [];
  state.map.tiles.forEach((row, r) => [...row].forEach((ch, col) => { if (terrainOf(ch).rule === 'trap') out.push({ col, row: r }); }));
  return out;
}
const trapKey = (o: Offset) => `${o.col},${o.row}`;
/** Kuyruk 24: sarmaşık kapanı altıgenleri (kuralın `hexes`, 1 tabanlı). */
export function vineHexes(state: BattleState): Offset[] {
  const v = ruleOf(state, 'vineTrap');
  return v && Array.isArray(v.hexes) ? v.hexes.map((xy) => ruleHex(state, xy)) : [];
}

/** Boğulma: HP 0 (oyuncu ölüm save'lerine başlar). */
function drown(c: Combatant, rule: string, rng: Rng): BattleEvent {
  const fx = damageEffects(c, c.hp, '', false, rng);
  return { type: 'map_effect', rule, targetId: c.id, text: 'boğuldu', hpAfter: fx.hpAfter, effects: fx.effects };
}

/** En yakın sağlam, boş altıgen (bataktan çıkış); `near` verilirse eşitlikte ona yakın olan. */
export function nearestSolid(state: BattleState, from: Offset, moverId: string, near?: Offset): Offset | null {
  const size = sizeOf(state);
  const taken = (h: Offset) => Object.values(state.combatants).some(
    (c) => c.id !== moverId && c.pos !== null && sameHex(c.pos, h) && isTargetable(c));
  for (let r = 1; r <= 4; r++) {
    const ring = withinRange(from, r, size).filter((h) => distance(from, h) === r)
      .filter((h) => {
        const t = tileAt(state, h);
        return t.movement !== 'blocked' && t.movement !== 'deadly' && !isBog(state, h) && !taken(h);
      })
      .sort((a, b) => (near ? distance(a, near) - distance(b, near) : 0) || a.row - b.row || a.col - b.col);
    if (ring[0]) return ring[0];
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Kancalar

/** Sırası gelen savaşçının tur başı harita olayları. */
export function turnStartMapEvents(state: BattleState, c: Combatant, rng: Rng): BattleEvent[] {
  if (!state.map || !c.pos || !alive(c)) return [];
  const events: BattleEvent[] = [];
  // Gizli tuzak, pasif Algı (`hiddenTrap`): partiden biri turuna tuzağın yakınında başlarsa ve
  // pasif Algısı (10 + Perception) tuzağın DC'sine yeterse fark eder.
  const hidden = ruleOf(state, 'hiddenTrap');
  const trap = ruleOf(state, 'trap');
  if (hidden && trap && c.side === 'party' && !c.civilian) {
    const known = new Set([...(state.map.trapsFound ?? []), ...(state.map.trapsSprung ?? [])]);
    const passive = 10 + skillBonus(c, 'perception');
    const dc = num(trap, 'perceptionDc');
    for (const h of trapHexes(state)) {
      if (!known.has(trapKey(h)) && distance(c.pos, h) <= num(hidden, 'radiusHexes') && passive >= dc) {
        events.push({ type: 'map_note', text: `${c.name} pasif Algıyla (${passive} / DC ${dc}) bir tuzak fark etti (${h.col + 1},${h.row + 1}).`, trapFound: h });
      }
    }
  }
  // Kuyruk 24: gizli sarmaşık kapanı (`vineTrap`): parti üyesi turuna yakınında başlar ve pasif Algısı yeterse fark eder
  // (gizli tuzakla aynı bulunmuş tuzak listesi; arayüz işaretler).
  const vine = ruleOf(state, 'vineTrap');
  if (vine && c.side === 'party' && !c.civilian) {
    const known = new Set([...(state.map.trapsFound ?? []), ...(state.map.trapsSprung ?? [])]);
    const passive = 10 + skillBonus(c, 'perception');
    const dc = num(vine, 'perceptionDc');
    for (const h of vineHexes(state)) {
      if (!known.has(trapKey(h)) && distance(c.pos, h) <= (typeof vine.radiusHexes === 'number' ? vine.radiusHexes : 2) && passive >= dc) {
        events.push({ type: 'map_note', text: `${c.name} pasif Algıyla (${passive} / DC ${dc}) otların arasında sarmaşık kapanı fark etti (${h.col + 1},${h.row + 1}).`, trapFound: h });
      }
    }
  }
  // Yanma (Burning, `lavJump.burning`): tur başında ateş hasarı, sonra DEX save ile söner.
  if (c.conditions.includes('Burning')) {
    const b = obj(ruleOf(state, 'lavJump') ?? { id: 'lavJump' }, 'burning');
    const hurtEv = damageEffect(c, 'lavJump', 'yanıyor', { dice: text(b, 'damage'), type: text(b, 'damageType') }, rng);
    events.push(hurtEv);
    const after = applyEvents(state, [hurtEv]).combatants[c.id] as Combatant;
    if (after.hp > 0) {
      const ev = saveEffect(after, 'lavJump', 'alevi söndürmek', ability(b.save), num(b, 'dc'), rng);
      if (ev.type === 'map_effect' && ev.roll?.success) ev.removeCondition = 'Burning';
      events.push(ev);
    }
  }
  const lavaEdge = ruleOf(state, 'lavaEdge');
  if (lavaEdge && !lavaSafe(c) && adjacentToLava(state, c.pos)) {
    events.push(damageEffect(c, 'lavaEdge', 'lav kenarında sıcak dalga', { dice: text(lavaEdge, 'damage'), type: text(lavaEdge, 'damageType') }, rng));
  }
  const bog = ruleOf(state, 'bog');
  if (bog && stuckInBog(state, c)) {
    const each = obj(bog, 'startOfOwnTurn');
    const sink = c.mapStatus.sink + num(each, 'sinkCounterPlus');
    const ev = damageEffect(c, 'bog', 'batakta: zehirli çamur', { dice: text(each, 'damage'), type: text(each, 'damageType') }, rng);
    if (ev.type === 'map_effect') ev.mapStatus = { sink };
    events.push(ev);
    const after = applyEvents(state, [ev]).combatants[c.id] as Combatant;
    if (sink >= num(bog, 'drownAtCounter') && after.hp > 0) events.push(drown(after, 'bog', rng));
  } else if (bog && c.mapStatus.lingeringPoison && !flying(c)) {
    const lp = obj(bog, 'lingeringPoison');
    events.push(damageEffect(c, 'bog', 'batak zehri sürüyor', { dice: text(lp, 'damage'), type: text(lp, 'damageType') }, rng));
  }
  const water = !lavaSafe(c) && !(waterWalks(state, c) && isLiquidTile(tileAt(state, c.pos))) ? sinkingWater(state, c.pos) : undefined;
  if (water && c.heavyArmor) {
    const ev = checkEffect(c, 'deepWater', 'ağır zırhla suda', skill(water.skill), num(water, 'dc'), rng, state);
    if (!ev.roll?.success) {
      const sink = c.mapStatus.sink + 1;
      ev.mapStatus = { sink };
      events.push(ev);
      if (sink >= num(water, 'drownAfterRounds')) events.push(drown(c, 'deepWater', rng));
    } else {
      events.push(ev);
    }
  }
  // Kuyruk 29 K28b: köprüde rüzgâr, nöbetçinin bakışı.
  events.push(...wildsTurnStartEvents(state, c, rng));
  // Kuyruk 30 D1: gizli nesneler (komşu ya da pasif Algı).
  events.push(...discoverOnTurnStart(state, c));
  return events;
}

/** Kuyruk K69: tehlikeli altıgenlerden ortalama hasarı en yüksek olanı (eşitlikte ilk). */
function worstHazard<T extends { hazard?: { damage: string } }>(list: T[]): T | undefined {
  const avg = (d: string) => { const p = parseDice(d); return p.count * (p.sides + 1) / 2 + p.bonus; };
  return list.reduce<T | undefined>((best, t) => (!best || avg(t.hazard?.damage ?? '0') > avg(best.hazard?.damage ?? '0') ? t : best), undefined);
}

/** Sırası biten savaşçının tur sonu harita olayları. */
export function turnEndMapEvents(state: BattleState, c: Combatant, rng: Rng): BattleEvent[] {
  if (!state.map || !c.pos || !alive(c)) return [];
  const events: BattleEvent[] = [];
  // Kuyruk 43: çok altıgenli gövdede gövdenin herhangi bir altıgenindeki tehlike (lav, alev) sayılır (bir kez).
  // Kuyruk K69 (sürüm 53): birden çok tehlikede en kötüsü (ortalama hasarı en yüksek), yine bir kez.
  const hazards = bodyOf(state, c).map((h) => tileAt(state, h)).filter((t) => t.hazard);
  const here = (isMultiHex53(state, c) ? worstHazard(hazards) : hazards[0]) ?? tileAt(state, c.pos);
  if (here.hazard && !lavaSafe(c)) {
    events.push(damageEffect(c, 'fire', `${here.name} içinde turu bitirdi`, { dice: here.hazard.damage, type: here.hazard.damageType }, rng));
  }
  const heat = ruleOf(state, 'heat');
  if (heat && c.heavyArmor && !inShade(state, c.pos)) {
    events.push(saveEffect(c, 'heat', 'kavurucu sıcak (ağır zırh, gölgesiz)', ability(heat.save), num(heat, 'dc'), rng,
      { hit: { dice: text(heat, 'damage'), type: text(heat, 'damageType') } }));
  }
  const bog = ruleOf(state, 'bog');
  if (bog && c.mapStatus.lingeringPoison && !stuckInBog(state, c)) {
    const save = obj(obj(bog, 'lingeringPoison'), 'save');
    const ev = saveEffect(c, 'bog', 'batak zehrine karşı', ability(save.ability), num(save, 'dc'), rng);
    if (ev.type === 'map_effect' && ev.roll?.success) {
      ev.mapStatus = { lingeringPoison: false };
      ev.removeCondition = 'Poisoned';
    }
    events.push(ev);
  }
  const cold = ruleOf(state, 'cold');
  if (cold && !inShelter(state, c.pos)) {
    events.push(saveEffect(c, 'cold', 'dondurucu soğuk (barınaksız)', ability(cold.save), num(cold, 'dc'), rng,
      { hit: { dice: text(cold, 'damage'), type: text(cold, 'damageType') } }));
  }
  // Kuyruk 29 K28b: sülük suyu.
  events.push(...wildsTurnEndEvents(state, c, rng));
  return events;
}

/** Kuyruk U1a: süzülenin girdiği altıgenin olayları (alev zemini, sudan çıkış). */
function hoverEnterEvents(state: BattleState, c: Combatant, at: Offset, rng: Rng): { events: BattleEvent[]; stop: boolean } {
  const events: BattleEvent[] = [];
  const t = tileAt(state, at);
  if (t.hazard) events.push(damageEffect({ ...c, pos: at }, 'fire', `${t.name} altıgenine girdi`, { dice: t.hazard.damage, type: t.hazard.damageType }, rng));
  if (c.mapStatus.sink > 0 && !sinkingWater(state, at) && !isBog(state, at)) events.push({ type: 'map_effect', rule: 'deepWater', targetId: c.id, text: 'sudan çıktı', mapStatus: { sink: 0 } });
  return { events, stop: events.some((e) => e.type === 'map_effect' && (e.hpAfter ?? 1) <= 0) };
}

/** Yürürken girilen altıgenin olayları; `stop` doğruysa yürüyüş orada biter. */
export function enterHexEvents(state: BattleState, c: Combatant, at: Offset, rng: Rng): { events: BattleEvent[]; stop: boolean } {
  if (!state.map || (flying(c) && !hovers(c))) return { events: [], stop: false };
  // Kuyruk U1a (sürüm 61+): süzülen yalnız alev zemininden (lav gönüllü girilmez) etkilenir; sudan çıkış sayacı sıfırlanır.
  // Zorlu zemin, buz, çamur, tuzak plakası, çukur, sarmaşık ve diğer yer etkileri işlemez.
  if (flying(c)) return hoverEnterEvents(state, c, at, rng);
  // Kuyruk K72 (sürüm 60+): duruş yüzeyindeki (sur tepesi, kat) yaratığa zemin etkileri işlemez.
  if ((c.altitudeFt ?? 0) > 0 && standingOn(state, { pos: at, altitudeFt: c.altitudeFt })) return { events: [], stop: false };
  // Kuyruk 19: Water Walk: sıvı altıgende batak/batma yok (sudan çıkış sayacı sıfırlaması aşağıda yine çalışır).
  const walker = waterWalks(state, c) && isLiquidTile(tileAt(state, at));
  const events: BattleEvent[] = [];
  const t = tileAt(state, at);
  const mover = { ...c, pos: at };
  if (t.hazard) {
    events.push(damageEffect(mover, 'fire', `${t.name} altıgenine girdi`, { dice: t.hazard.damage, type: t.hazard.damageType }, rng));
  }
  // Sudan çıkınca batma sayacı sıfırlanır.
  if (c.mapStatus.sink > 0 && !sinkingWater(state, at) && !isBog(state, at)) {
    events.push({ type: 'map_effect', rule: 'deepWater', targetId: c.id, text: 'sudan çıktı', mapStatus: { sink: 0 } });
  }
  const ice = ruleOf(state, 'ice');
  if (ice && state.map.tiles[at.row]?.[at.col] === ice.terrain) {
    events.push(saveEffect(mover, 'ice', 'buzda kaydı mı', ability(ice.save), num(ice, 'dc'), rng,
      { onFailCondition: ice.onFail === 'prone' ? 'Prone' : undefined, stopOnFail: ice.endsMovement === true }));
  }
  const bog = ruleOf(state, 'bog');
  if (bog && isBog(state, at) && !walker) {
    const enter = obj(bog, 'onEnter');
    events.push({
      type: 'map_effect', rule: 'bog', targetId: c.id, text: 'batağa saplandı',
      ...(mover.conditions.includes('Poisoned') ? {} : { addCondition: 'Poisoned' }),
      mapStatus: { sink: Math.max(c.mapStatus.sink, num(enter, 'sinkCounter')) }, stopMovement: true,
    });
  }
  const trap = ruleOf(state, 'trap');
  if (trap && terrainOf(state.map.tiles[at.row]?.[at.col] ?? '#').rule === 'trap' && !(state.map.trapsSprung ?? []).includes(trapKey(at))) {
    events.push({ type: 'map_note', text: `Tuzak tetiklendi (${at.col + 1},${at.row + 1})!`, trapSprung: at });
    const ev = saveEffect(mover, 'trap', 'tuzağa bastı', ability(trap.save), num(trap, 'dc'), rng,
      { hit: { dice: text(trap, 'damage'), type: text(trap, 'damageType') } });
    if (ev.type === 'map_effect') ev.stopMovement = true;
    events.push(ev);
  }
  // Kuyruk 41b: kayalık çukur (`pitFall`): girene düşme hasarı (veride, 1d6), yürüyüş biter, bir sonraki turu kayıp
  // (süren etkide `command: halt`: tur başında `turn_lost`). Uçan etkilenmez.
  const pit = ruleOf(state, 'pitFall');
  if (pit && !isAirborne(mover) && terrainOf(state.map.tiles[at.row]?.[at.col] ?? '#').rule === 'pitFall') {
    events.push({ type: 'map_effect', rule: 'pitFall', targetId: mover.id, text: 'çukura düştü', ...hurt(mover, { dice: text(pit, 'damage'), type: text(pit, 'damageType') }, false, rng), stopMovement: true });
    events.push({ type: 'effect_added', targetId: mover.id, effect: { id: `pit:${mover.id}:${state.round}`, name: 'Çukura düştü', sourceId: mover.id, command: 'halt' } });
  }
  // Kuyruk 24: sarmaşık kapanı: STR save; başarısızsa Restrained (ağ yüzeyinin kuralı: eylemle STR (Athletics) kurtulma,
  // `escape` komutu), yürüyüş biter. Her sarmaşık bir kez tetiklenir.
  const vine = ruleOf(state, 'vineTrap');
  if (vine && !(state.map.trapsSprung ?? []).includes(trapKey(at)) && vineHexes(state).some((h) => sameHex(h, at))) {
    events.push({ type: 'map_note', text: `Sarmaşık kapanı tetiklendi (${at.col + 1},${at.row + 1})!`, trapSprung: at });
    const dc = num(vine, 'dc');
    const ev = saveEffect(mover, 'vineTrap', 'sarmaşık bacağına dolandı', 'str', dc, rng);
    events.push(ev);
    if (ev.type === 'map_effect' && ev.roll && !ev.roll.success) {
      ev.stopMovement = true;
      events.push({ type: 'effect_added', targetId: c.id, effect: { id: `vineTrap:${trapKey(at)}`, name: 'Sarmaşık', sourceId: 'harita', grants: ['Restrained'], escapeCheck: { dc } } });
    }
  }
  // Kuyruk 24b: şelale arkasındaki geçide ilk giren parti üyesi keşif bayrağını üretir (kural sürümü 4; sefer ekranı okuyacak).
  const fall = ruleOf(state, 'waterfall');
  if (fall && typeof fall.flag === 'string' && ruleVersion(state) >= 4 && c.side === 'party' && !c.civilian && !c.summon
    && !(state.flags ?? []).includes(fall.flag) && Array.isArray(fall.hexes) && fall.hexes.some((xy) => sameHex(ruleHex(state, xy), at))) {
    events.push({ type: 'map_note', text: `${c.name} şelalenin arkasındaki geçide girdi: mağara keşfedildi.`, flag: fall.flag });
  }
  // Kuyruk 29 K28b: ince buz, batıran çamur.
  events.push(...wildsEnterEvents(state, c, at, rng).events);
  // Kuyruk 29 K22: çürük güverte.
  events.push(...desertEnterEvents(state, c, at, rng));
  // Kuyruk 30 D1: komşudaki gizli nesne bulunur.
  events.push(...discoverOnEnter(state, c, at));
  const stop = events.some((e) => e.type === 'map_effect' && (e.stopMovement === true || (e.hpAfter ?? 1) <= 0));
  return { events, stop };
}

/**
 * Işıklar tek yerde (Görev K): karanlık (`darkness`, görüş sınırı) ve gece (`night`, gizlenme) kuralları aynı ışık
 * listesini kullanır. Işıklar ve yarıçap hangi kuralda yazılıysa oradan okunur (önce `darkness`); ikisinde birden
 * yazılmaz. Işık veren zemin (kristal) her zaman ışıktır.
 */
/**
 * Kuyruk 19 (görev 10): görüş sınırı kuralı. Harita `darkness` kuralı yoksa ve Game Master "Gece görüşü kuralları"
 * (`nightVision`, varsayılan kapalı) açıkken gece haritasında (`night`) SRD görüşü: ışıksız altıgen karanlık; karanlık
 * görüşlü (Darkvision) ya da Blindsight/Truesight menzilindeki görür; görmeyen saldıran dezavantajlı (hedef seçilebilir),
 * görülmeyen saldıran avantajlı. Görüş menzili gece kuralında `unlitSightHexes` (varsayılan 2: yıldız ışığı).
 */
export function darkRule(state: BattleState): MapRuleData | undefined {
  const dark = ruleOf(state, 'darkness');
  if (dark) return dark;
  const night = ruleOf(state, 'night');
  if (!night || !globalRule(state, 'nightVision')) return undefined;
  return { id: 'darkness', darkvisionHexes: 12, unlitSightHexes: typeof night.unlitSightHexes === 'number' ? night.unlitSightHexes : 2,
    unseenTargetsUntargetable: false, unseenAttackerAdvantage: true, unseenTargetDisadvantage: true, lights: night.lights, lightRadiusHexes: night.lightRadiusHexes } as MapRuleData;
}

function lightRule(state: BattleState): MapRuleData | undefined {
  const dark = ruleOf(state, 'darkness');
  const night = ruleOf(state, 'night');
  if (dark && (dark.lights !== undefined || !night)) return dark;
  return night ?? dark;
}

/** Karanlık ya da gece mi (ışıksız altıgen kavramı var mı). */
export const hasDarkness = (state: BattleState): boolean => !!(ruleOf(state, 'darkness') || ruleOf(state, 'night'));

/** Karanlıkta/gecede aydınlık altıgenler: kuraldaki ışıklar ve ışık veren zemin (kristal). */
export function litHexes(state: BattleState): Set<string> {
  // Kuyruk K67a: aynı durum için bir kez (bir yapay zekâ kararında onlarca çağrı); sürüm 51+ parlak + loş.
  const hit = LIT_CACHE.get(state);
  if (hit) return hit;
  const lit = dimLightOn(state) ? new Set(lightLevels(state).keys()) : litHexesV50(state);
  LIT_CACHE.set(state, lit);
  return lit;
}

/** Sürüm 50 ve öncesi: tek yarıçaplı ışık kümesi (bugünkü davranış birebir). */
function litHexesV50(state: BattleState): Set<string> {
  const lit = new Set<string>();
  const rule = lightRule(state);
  if (!rule || !state.map) return lit;
  const size = sizeOf(state);
  for (const src of lightSources(state, rule)) if (src.r >= 0) for (const h of withinRange(src.at, src.r, size)) lit.add(`${h.col},${h.row}`);
  for (const z of zoneLight(state)) for (const h0 of z.hexes) for (const h of withinRange(h0, z.r, size)) lit.add(`${h.col},${h.row}`);
  for (const key of magicDarkHexes(state)) lit.delete(key);
  return lit;
}

/** Kuyruk K67a (kural sürümü 51): loş ışık (parlak / loş / karanlık, SRD 5.2.1 "Vision and Light"). */
export const dimLightOn = (state: Pick<BattleState, 'kuralSurumu'>): boolean => ruleVersion(state) >= 51;
export type LightLevel = 'bright' | 'dim' | 'dark';
const LIT_CACHE = new WeakMap<BattleState, Set<string>>();
const LEVEL_CACHE = new WeakMap<BattleState, Map<string, 'bright' | 'dim'>>();
const DARK_CACHE = new WeakMap<BattleState, Set<string>>();

/** Nokta ışık kaynakları: parlak yarıçap `r` (−1: parlak yok) ve ek loş `dim` (altıgen). */
function lightSources(state: BattleState, rule: MapRuleData): Array<{ at: Offset; r: number; dim: number }> {
  const dark = ruleOf(state, 'darkness');
  const r0 = rule.lightRadiusHexes ?? ruleOf(state, 'night')?.lightRadiusHexes;
  // Kuyruk K67b (sürüm 51): harita ışıklarının SRD değerleri veride (meşale 20 ft parlak + 20 ft loş: `brightRadiusHexes`).
  const radius = dimLightOn(state) && typeof rule.brightRadiusHexes === 'number' ? rule.brightRadiusHexes : typeof r0 === 'number' ? r0 : 0;
  // Kuyruk K67a: harita ışıklarının ek loş halkası veride (`dimRadiusHexes`, `tileDimRadiusHexes`; yoksa 0).
  const dimR = dimLightOn(state) && typeof rule.dimRadiusHexes === 'number' ? rule.dimRadiusHexes : 0;
  const sources = ((rule.lights as unknown[] | undefined) ?? []).map((xy) => ({ at: ruleHex(state, xy), r: radius, dim: dimR }));
  // Kuyruk 29 K28b: sönmemiş mangallar (`brazierLight`).
  // K67b (sürüm 51): mangalın parlak/loş yarıçapı kuralda (`brightRadius`, `dimRadius`; SRD'de mangal yok, meşale değeri).
  const br = dimLightOn(state) ? ruleOf(state, 'brazierLight') : undefined;
  sources.push(...brazierLights(state).map((b) => ({ ...b, ...(typeof br?.brightRadius === 'number' ? { r: br.brightRadius } : {}), dim: typeof br?.dimRadius === 'number' ? br.dimRadius : 0 })));
  const tileDim = dimLightOn(state) && typeof dark?.tileDimRadiusHexes === 'number' ? dark.tileDimRadiusHexes : 0;
  state.map?.tiles.forEach((row, r) => [...row].forEach((ch, col) => {
    // Işık veren zeminin yarıçapı kuralda ezilebilir (mağara: loş kristaller, `tileLightRadiusHexes`).
    const light = terrainOf(ch).light;
    const tileR = typeof dark?.tileLightRadiusHexes === 'number' ? dark.tileLightRadiusHexes : light?.radiusHexes;
    if (light && tileR !== undefined) sources.push({ at: { col, row: r }, r: tileR, dim: tileDim });
  }));
  // Görev B4: büyü ışıkları (Light, Daylight, Faerie Fire, Flame Blade); K67a: süren etkide ek loş `lightDim`.
  for (const c of Object.values(state.combatants)) {
    if (!c.pos || c.hp <= 0) continue;
    const r = Math.max(-1, ...(c.effects ?? []).map((e) => e.light ?? -1));
    const outer = dimLightOn(state) ? Math.max(-1, ...(c.effects ?? []).map((e) => (e.lightDim ? Math.max(e.light ?? -1, 0) + e.lightDim : e.light ?? -1))) : r;
    if (r >= 0 || outer >= 0) sources.push({ at: c.pos, r, dim: Math.max(0, outer - Math.max(r, 0)) });
  }
  // Kuyruk K67b (sürüm 51, Shining Smite `wardLight`): konsantrasyon hedefi parlak ışık saçar.
  if (dimLightOn(state)) for (const c of Object.values(state.combatants)) {
    const conc = c.concentration;
    if (!conc?.targetId) continue;
    const sp = spells.find((x) => x.name === conc.spell);
    const wl = sp ? mechanicsAt(state, sp).wardLight : undefined;
    const t = state.combatants[conc.targetId];
    if (wl !== undefined && t?.pos && t.hp > 0) sources.push({ at: t.pos, r: wl, dim: 0 });
  }
  // Kuyruk A7 (sürüm 36): nesneye bağlı ışık (Light, Continual Flame): taşıyanın yerinde ya da nesnenin altıgeninde;
  // K67a: ek loş büyünün sürüm verisinden (`objectLightDim`).
  for (const o of state.map?.objects ?? []) {
    if (o.light === undefined) continue;
    const at = o.carriedBy ? state.combatants[o.carriedBy]?.pos : o.at;
    const sp = o.lightSpell ? spells.find((x) => x.id === o.lightSpell) : undefined;
    const dim = sp && dimLightOn(state) ? mechanicsAt(state, sp).objectLightDim ?? 0 : 0;
    if (at) sources.push({ at, r: o.light, dim });
  }
  return sources;
}

/** Altıgen kümesini `k` adım genişletir (çok kaynaklı BFS; büyük alan ışıkları için `withinRange` döngüsünden ucuz). */
function dilate(state: BattleState, hexes: Offset[], k: number): Set<string> {
  const out = new Set(hexes.map((h) => `${h.col},${h.row}`));
  if (k <= 0) return out;
  const size = sizeOf(state);
  let ring = hexes;
  for (let d = 0; d < k && ring.length; d++) {
    const next: Offset[] = [];
    for (const h of ring) for (const n of neighbors(h, size)) {
      const key = `${n.col},${n.row}`;
      if (!out.has(key)) { out.add(key); next.push(n); }
    }
    ring = next;
  }
  return out;
}

/**
 * Kuyruk K67a (sürüm 51): ışık seviyeleri (anahtar → parlak/loş; yoksa karanlık). Kaynak başına parlak yarıçap + ek loş;
 * çakışmada en parlak; isteğe bağlı loş ortam (`ambient: 'dim'`, karanlık/gece kuralında); büyülü karanlıkta ışık yok.
 * Aynı durum için önbellekli.
 */
export function lightLevels(state: BattleState): Map<string, 'bright' | 'dim'> {
  const hit = LEVEL_CACHE.get(state);
  if (hit) return hit;
  const out = new Map<string, 'bright' | 'dim'>();
  const rule = lightRule(state);
  if (rule && state.map) {
    const size = sizeOf(state);
    if (rule.ambient === 'dim') state.map.tiles.forEach((row, r) => [...row].forEach((_, col) => out.set(`${col},${r}`, 'dim')));
    const put = (key: string, lv: 'bright' | 'dim') => { if (lv === 'bright' || out.get(key) !== 'bright') out.set(key, lv); };
    for (const src of lightSources(state, rule)) {
      if (src.dim > 0) for (const h of withinRange(src.at, Math.max(src.r, 0) + src.dim, size)) put(`${h.col},${h.row}`, 'dim');
      if (src.r >= 0) for (const h of withinRange(src.at, src.r, size)) put(`${h.col},${h.row}`, 'bright');
    }
    for (const z of zoneLight(state)) {
      // K67b: parlaksız alan (`r` −1: Moonbeam silindiri, Dancing Lights) yalnızca loş.
      if (z.dim > 0 || z.r < 0) for (const k of dilate(state, z.hexes, Math.max(z.r, 0) + z.dim)) put(k, 'dim');
      if (z.r >= 0) for (const k of dilate(state, z.hexes, z.r)) put(k, 'bright');
    }
    for (const key of magicDarkHexes(state)) out.delete(key);
  }
  LEVEL_CACHE.set(state, out);
  return out;
}

/** Altıgenin ışık seviyesi (karanlık kavramı olmayan gündüz haritasında parlak; büyülü karanlık her haritada karanlık). */
export function lightLevelAt(state: BattleState, at: Offset): LightLevel {
  const key = `${at.col},${at.row}`;
  if (!hasDarkness(state)) return magicDarkHexes(state).has(key) ? 'dark' : 'bright';
  if (!dimLightOn(state)) return litHexes(state).has(key) ? 'bright' : 'dark';
  return lightLevels(state).get(key) ?? 'dark';
}

/**
 * Kuyruk K67a: gözcünün gördüğü seviye (SRD Darkvision: menzilde loş → parlak, karanlık → loş; büyülü karanlıkta yok;
 * Devil's Sight 120 ft içinde her şey parlak).
 */
export function perceivedLevel(state: BattleState, observer: Combatant, at: Offset): LightLevel {
  const lv = lightLevelAt(state, at);
  if (lv === 'bright' || !observer.pos) return lv;
  const d = distance(observer.pos, at);
  if (observer.traits?.includes('devils-sight') && d * 5 <= 120) return 'bright';
  // Kuyruk K67b: Blindsight (fiziksel görmeye dayanmaz) ve Truesight (normal ve büyülü karanlığı deler) menzilinde ceza yok.
  const sense = sightSenseFt(state, observer);
  if (sense > 0 && d * 5 <= sense) return 'bright';
  if (magicDarkHexes(state).has(`${at.col},${at.row}`)) return 'dark';
  const dv = darkvisionOf(observer);
  const dark = darkRule(state);
  const dvHexes = globalRule(state, 'darkvisionRange') || !dark ? Math.floor(dv / 5) : num(dark, 'darkvisionHexes');
  if (dv > 0 && d <= dvHexes) return lv === 'dark' ? 'dim' : 'bright';
  return lv;
}

/** Loş ışıkta ya da karanlıkta mı (One with Shadows, Merge with Shadows; sürüm 50: ışıksız altıgen). */
export function inShadowAt(state: BattleState, at: Offset): boolean {
  if (!hasDarkness(state)) return false;
  return dimLightOn(state) ? lightLevelAt(state, at) !== 'bright' : !litHexes(state).has(`${at.col},${at.row}`);
}

const zoneSpecOf = (spellId: string) => { const m = spells.find((s) => s.id === spellId)?.mechanics; return m?.zone ?? m?.aftermath; };

/** Işık veren alanlar: altıgenleri, parlak yarıçap ve (K67a, sürüm 51) ek loş; yürüyen alan bağlı yaratığın yerinde. */
function zoneLight(state: BattleState): Array<{ hexes: Offset[]; r: number; dim: number }> {
  const out: Array<{ hexes: Offset[]; r: number; dim: number }> = [];
  for (const z of state.map?.zones ?? []) {
    // Kuyruk A7: alanda saklanan sürümlü kural (`z.spec`) önce.
    const spec = z.spec ?? zoneSpecOf(z.spellId);
    // Kuyruk K67b (sürüm 51): parlaksız loş alan (`light` yok, `lightDim` var: Moonbeam 0 = yalnız silindir, Dancing Lights 2).
    const dimOnly = dimLightOn(state) && spec?.light === undefined && spec?.lightDim !== undefined;
    const r = dimOnly ? -1 : spec?.light;
    if (r === undefined) continue;
    const dim = dimLightOn(state) ? spec?.lightDim ?? 0 : 0;
    const anchor = z.anchorId ? state.combatants[z.anchorId]?.pos : undefined;
    if (anchor) out.push(dimOnly ? { hexes: [anchor], r: -1, dim: (z.radius ?? 1) + dim } : { hexes: [anchor], r: (z.radius ?? 1) + r, dim });
    else out.push({ hexes: z.hexes, r, dim });
  }
  return out;
}

/** Görev B5: karanlık görüş (ft): türden ve süren etkiden (Darkvision büyüsü) büyüğü. */
export const darkvisionOf = (c: Combatant): number => Math.max(c.darkvision, ...(c.effects ?? []).map((e) => e.darkvision ?? 0));

/** Görev B4: büyülü karanlık altıgenleri (Darkness): ışık aydınlatamaz, karanlık görüş göremez. */
export function magicDarkHexes(state: BattleState): Set<string> {
  const hit = DARK_CACHE.get(state);
  if (hit) return hit;
  const out = new Set<string>();
  for (const z of state.map?.zones ?? []) if (zoneSpecOf(z.spellId)?.dark) for (const h of z.hexes) out.add(`${h.col},${h.row}`);
  DARK_CACHE.set(state, out);
  return out;
}

/** Gece/karanlıkta ışıksız altıgen mi. */
export function isUnlit(state: BattleState, at: Offset, lit = litHexes(state)): boolean {
  return hasDarkness(state) && !lit.has(`${at.col},${at.row}`);
}

/**
 * Gece kuralı (`night`, Görev K): ışıksız altıgende gizlenene karşı karanlık görüşü olmayan gözcünün pasif Algısı
 * düşer (`passivePerceptionPenalty`), Gizlen Stealth zarı avantajlı olur (`hideAdvantage`). Gece yoksa etkisiz.
 */
export function nightStealth(state: BattleState): { penalty: number; advantage: boolean } | null {
  const night = ruleOf(state, 'night');
  if (!night) return null;
  return {
    penalty: (typeof night.passivePerceptionPenalty === 'number' ? night.passivePerceptionPenalty : 0) + (stormRain(state) ? 5 : 0),
    advantage: night.hideAdvantage === true,
  };
}

/** Karanlıkta `observer` `target`ı görür mü: hedef aydınlıktaysa ya da görüş mesafesindeyse. */
export function canSee(state: BattleState, observer: Combatant, target: Combatant, lit?: Set<string>): boolean {
  const dark = darkRule(state);
  if (!dark || !observer.pos || !target.pos) return true;
  // Işıklar yalnızca görüş sınırı (karanlık) varken hesaplanır (gece haritasında her görüş sorusunda değil).
  // Kuyruk 43: çok altıgenli gövdenin herhangi bir altıgeni aydınlıksa görülür; uzaklık gövdeler arası (`gap`).
  const litSet = lit ?? litHexes(state);
  if (bodyOf(state, target).some((h) => litSet.has(`${h.col},${h.row}`))) return true;
  // Kuyruk 19: Blindsight/Truesight menzilinde karanlık ve büyülü karanlık engel değil.
  if (senseSees(state, observer, target)) return true;
  // Kuyruk 19: Gaze of Two Minds: bağlı dostun duyularıyla (konumu, karanlık görüşü, özel duyuları).
  const gz = observer.effects?.find((e) => e.gazeAt);
  const pal = gz?.gazeAt ? state.combatants[gz.gazeAt] : undefined;
  if (pal?.pos && pal.hp > 0 && canSee(state, { ...pal, id: observer.id, effects: [] }, target, litSet)) return true;
  // Kuyruk 19: Mislead: büyücü ikizinin gözünden de görür.
  const decoy = (state.map?.zones ?? []).find((z) => z.casterId === observer.id && z.center && z.name.endsWith('(ikiz)'));
  if (decoy?.center && !(decoy.center.col === observer.pos.col && decoy.center.row === observer.pos.row) && canSee(state, { ...observer, pos: decoy.center }, target, litSet)) return true;
  // Görev B4: büyülü karanlığın içini karanlık görüş göremez.
  const magicDark = magicDarkHexes(state).has(`${target.pos.col},${target.pos.row}`);
  // Devil's Sight (Görev WARLOCK): büyülü karanlığın içini de görür.
  // Denge turu (kural sürümü 17, `darkvisionRange`): karanlık görüş menzili yaratığın kendi değeri (SRD: 60/90/120… ft);
  // eski savaşlarda kuraldaki sabit `darkvisionHexes` (12 altıgen = 60 ft).
  const dv = darkvisionOf(observer);
  const dvHexes = globalRule(state, 'darkvisionRange') ? Math.floor(dv / 5) : num(dark, 'darkvisionHexes');
  const range = dv > 0 && (!magicDark || !!observer.traits?.includes('devils-sight')) ? dvHexes : num(dark, 'unlitSightHexes');
  // Feral Senses (Ranger; Görev F): 30 ft Blindsight (karanlıkta 6 altıgen içi görülür).
  return gap(state, observer, target) <= (observer.traits?.includes('feral-senses') ? Math.max(range, 6) : range);
}

/** Haritadan gelen saldırı etkileri ve siper; görülemeyen hedefte hata. */
export function mapAttackSources(
  state: BattleState, attacker: Combatant, target: Combatant, ranged: boolean,
): { sources: ModeSource[]; cover: 0 | 2 | 5 } | Failure {
  if (!state.map || !attacker.pos || !target.pos) return { sources: [], cover: 0 };
  const d = gap(state, attacker, target);
  const sources: ModeSource[] = [];
  let cover: 0 | 2 | 5 = 0;
  const dark = darkRule(state);
  if (dark) {
    const lit = litHexes(state);
    if (dark.unseenTargetsUntargetable === true && !canSee(state, attacker, target, lit)) {
      return fail(`Karanlık: ${target.name} görülmüyor.`);
    }
    // Kuyruk 19 (nightVision): görülmeyen hedefe saldırı dezavantajlı (SRD).
    if (dark.unseenTargetDisadvantage === true && !canSee(state, attacker, target, lit)) sources.push({ effect: 'disadvantage', reason: 'Görülmeyen hedef (karanlık)' });
    if (dark.unseenAttackerAdvantage === true && !canSee(state, target, attacker, lit)) {
      sources.push({ effect: 'advantage', reason: 'Karanlıktan saldıran' });
    }
  }
  // Kuyruk 19 (stormRules): fırtına ve kuvvetli rüzgârda menzilli saldırı dezavantajlı.
  if (ranged && stormNow(state)) sources.push({ effect: 'disadvantage', reason: 'Fırtına' });
  const crenel = ruleOf(state, 'crenel');
  if (crenel && ranged) {
    const from = (crenel.fromTerrain as string[] | undefined) ?? [];
    const here = state.map.tiles[target.pos.row]?.[target.pos.col] ?? '';
    if (from.includes(here) && tileAt(state, attacker.pos).height < tileAt(state, target.pos).height) {
      cover = crenel.coverVsRangedFromBelow === 'three-quarters' ? 5 : 2;
    }
  }
  // Kuyruk 29 K28b: kar yağışı ve sis (görüş menzili, uzak menzilli atış dezavantajı).
  const weather = weatherAttack(state, attacker, target, ranged);
  if (weather.fail) return fail(weather.fail);
  sources.push(...weather.sources);
  const sand = ruleOf(state, 'sandstorm');
  if (sand) {
    const sight = num(sand, 'visibilityHexes');
    const name = stormName(sand);
    if (d > sight) return fail(`${name}: ${sight} altıgenden uzağı görülmez (${d}).`);
    if (ranged && d > num(sand, 'rangedDisadvantageBeyondHexes')) sources.push({ effect: 'disadvantage', reason: name });
    // Kuyruk 29 K22: fırtınada rüzgâra karşı atış dezavantajlı (kural sürümü 9; rüzgâr yönü `wind`).
    if (ranged && stormAgainstWind(state, attacker.pos, target.pos)) sources.push({ effect: 'disadvantage', reason: `${name}: rüzgâra karşı` });
  }
  const storm = ruleOf(state, 'storm');
  if (storm && ranged && d > num(storm, 'rangedDisadvantageBeyondHexes')) {
    sources.push({ effect: 'disadvantage', reason: 'Fırtına' });
  }
  return { sources, cover };
}

/** Gizlenme zarına harita etkisi (kum fırtınası: avantaj). */
export function mapHideSources(state: BattleState): ModeSource[] {
  const sand = ruleOf(state, 'sandstorm');
  return sand && sand.hideCheckAdvantage === true ? [{ effect: 'advantage', reason: stormName(sand) }] : [];
}

/**
 * Harita kurallarının yürüme maliyeti: tırmanma (`climb`, çıkılan her seviye için) ve derin
 * batak (`bog`, `moveCostPerHex`). Zemin maliyetinden büyükse o geçer.
 */
export function mapEnterCost(state: BattleState, from: Offset, to: Offset, base: number, climber = false): number {
  let cost = base;
  const climb = ruleOf(state, 'climb');
  const up = tileAt(state, to).height - tileAt(state, from).height;
  if (climb && up > 0 && !climber) cost = Math.max(cost, num(climb, 'heightDiffCost') * up);
  const bog = ruleOf(state, 'bog');
  if (bog && isBog(state, to)) cost = Math.max(cost, num(bog, 'moveCostPerHex'));
  // Kuyruk 29 K28b: şiddetli kar yağışında açık kar zorlu zemin.
  cost = Math.max(cost, snowMoveCost(state, to));
  return cost;
}

// ---------------------------------------------------------------------------------------------
// Tur başında (yeni tur) lav yükselmesi

/** Yeni tura geçerken: uyarılan altıgenler lav olur, üstündeki (uçmayan) yaratık ölür. */
export function roundStartMapEvents(state: BattleState): BattleEvent[] {
  const warn = state.map?.lavaWarning;
  if (!warn || warn.round >= state.round) return [];
  const events: BattleEvent[] = [];
  for (const h of warn.hexes) {
    events.push({ type: 'tile_changed', at: h, to: '~' });
    for (const c of Object.values(state.combatants)) {
      if (c.pos && sameHex(c.pos, h) && !lavaSafe(c) && c.life !== 'dead') events.push({ type: 'fell_into_lava', actorId: c.id, at: h });
    }
  }
  return events;
}

// ---------------------------------------------------------------------------------------------
// GM tetiklemeleri

export function executeMapTrigger(state: BattleState, rule: string, at: Offset | undefined, isGm: boolean, rng: Rng): CommandResult {
  if (!isGm) return fail('Harita olaylarını yalnızca GM tetikler.');
  if (state.status !== 'active' || !state.map) return fail('Haritalı savaş sürmüyor.');
  const r = ruleOf(state, rule);
  if (!r || !(TRIGGERED as readonly string[]).includes(rule)) return fail(`Bu haritada "${rule}" olayı yok.`);
  const events: BattleEvent[] = [];
  const victims = Object.values(state.combatants).filter((c) => alive(c) && isTargetable(c));

  if (rule === 'avalanche' || rule === 'flashFlood') {
    const r2 = rule === 'avalanche' ? avalancheTrigger(state) : floodTrigger(state);
    return typeof r2 === 'string' ? fail(r2) : finish(state, r2);
  }
  if (rule === 'eruption') {
    if (!at) return fail('Patlamanın merkez altıgeni seçilmeli.');
    const area = withinRange(at, num(r, 'radius'), sizeOf(state));
    const rolled = rollDice(text(r, 'damage'), rollTag(rng, { kind: 'damage' }));
    events.push({ type: 'map_note', text: `Yanardağ patlaması: merkez ${at.col + 1},${at.row + 1}, hasar ${rolled.rolls.join('+')} = ${rolled.total}.` });
    for (const c of victims.filter((v) => area.some((h) => sameHex(h, v.pos as Offset)))) {
      events.push(saveEffect(c, 'eruption', 'yanardağ patlaması', ability(r.save), num(r, 'dc'), rng,
        { hit: { dice: text(r, 'damage'), type: text(r, 'damageType'), rolled, halfOnSave: r.halfOnSave === true } }));
    }
  } else if (rule === 'lavaRise') {
    if (state.round < num(r, 'startRound')) return fail(`Lav yükselmesi ${num(r, 'startRound')}. turdan başlar.`);
    if (state.map.lavaWarning) return fail('Lav yükselmesi zaten uyarıldı: bir sonraki tur başında olacak.');
    const size = sizeOf(state);
    const ring: Offset[] = [];
    for (let row = 0; row < size.rows; row++) {
      for (let col = 0; col < size.cols; col++) {
        const h = { col, row };
        const t = tileAt(state, h);
        if (t.movement !== 'deadly' && t.movement !== 'blocked' && adjacentToLava(state, h)) ring.push(h);
      }
    }
    if (ring.length === 0) return fail('Lava dönecek kıyı altıgeni kalmadı.');
    events.push({ type: 'lava_warning', hexes: ring, round: state.round });
  } else if (rule === 'swell') {
    for (const c of victims.filter((v) => !flying(v))) {
      events.push(saveEffect(c, 'swell', 'dalga güverteyi salladı', ability(r.save), num(r, 'dc'), rng, { onFailCondition: 'Prone' }));
    }
  }
  return { ok: true, state: applyEvents(state, events), events };
}

export { obj as ruleObject, num as ruleNumber, text as ruleText, ability as ruleAbility, skill as ruleSkill };

/**
 * Kuyruk 19 (görev 10): Game Master "Fırtına kuralları" (`stormRules`, varsayılan kapalı). Fırtınalı ya da şiddetli
 * rüzgârlı haritada (`storm`, `sandstorm`, rüzgâr gücü 2): menzilli saldırılar dezavantajlı, uçan yaratığın hareketi iki
 * kat; fırtına (yağmur) görüşe dayalı Algıya dezavantaj (pasif Algı −5).
 */
export function stormNow(state: BattleState): boolean {
  if (!globalRule(state, 'stormRules')) return false;
  const wind = ruleOf(state, 'wind');
  return !!ruleOf(state, 'storm') || !!ruleOf(state, 'sandstorm') || (!!wind && Number(wind.strength ?? 0) >= 2);
}
export const stormRain = (state: BattleState): boolean => !!globalRule(state, 'stormRules') && !!ruleOf(state, 'storm');

