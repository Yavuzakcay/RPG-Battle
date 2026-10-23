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
import { saveMode } from './durations';
import { getMap, type MapRuleData } from '../map/maps';
import { terrainOf, type TerrainType } from '../map/terrain';
import type { Ability } from '../rules/abilities';
import { autoFailsStrDexSave } from '../rules/conditions';
import { adjustDamage, halfDamage } from '../rules/damage';
import { rollD20, rollDice, rollTag, type RollMode, type Rng } from '../rules/dice';
import { distance, neighbors, sameHex, withinRange, type Offset } from '../rules/hex';
import type { ModeSource } from '../rules/modes';
import { checkMode, skillBonus, SKILLS, type Skill } from '../rules/skills';
import { fail, isTargetable, type CommandResult, type Failure } from './common';
import { damageEffects } from './damage-effects';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant } from './types';

// ---------------------------------------------------------------------------------------------
// Kural verisi

/** GM'in komutla tetiklediği kurallar. */
export const TRIGGERED = ['eruption', 'lavaRise', 'swell'] as const;

/** Varyantın kuralları; isteğe bağlı edilgen kurallar yalnızca açıldıysa. */
export function activeRules(state: BattleState): MapRuleData[] {
  if (!state.map) return [];
  const map = getMap(state.map.id);
  const variant = map.variants.find((v) => v.id === state.map?.variantId) ?? map.variants[0];
  const options = state.map.options ?? [];
  return (variant?.rules ?? []).filter(
    (r) => r.optional !== true || (TRIGGERED as readonly string[]).includes(r.id) || options.includes(r.id),
  );
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
const flying = (c: Combatant) => c.fly > 0;
const alive = (c: Combatant) => c.pos !== null && c.life !== 'dead' && (c.hp > 0 || c.regenPending);

// ---------------------------------------------------------------------------------------------
// Olay yapıcılar

interface Hit {
  dice: string;
  type: string;
  /** Hasar önceden atıldıysa (patlama: herkese aynı zar). */
  rolled?: { rolls: number[]; total: number };
  halfOnSave?: boolean;
}

/** Hasarı uygular: direnç/bağışıklık, 0 HP etkileri. */
function hurt(c: Combatant, hit: Hit, half: boolean, rng: Rng) {
  const rolled = hit.rolled ?? rollDice(hit.dice, rollTag(rng, { kind: 'damage' }));
  const raw = half ? halfDamage(rolled.total) : rolled.total;
  const adj = adjustDamage(raw, hit.type, c);
  const fx = damageEffects(c, adj.amount, hit.type, false, rng);
  return {
    damage: { rolls: rolled.rolls, raw, applied: adj.amount, type: hit.type, note: adj.note },
    hpAfter: fx.hpAfter,
    effects: fx.effects,
  };
}

function roll(c: Combatant, label: string, bonus: number, dc: number, mode: RollMode, rng: Rng, autoFail = false) {
  const d = rollD20(mode, rollTag(rng, { by: c.id, bonus }));
  const total = d.kept + bonus;
  return { label, dc, d20: d.rolls, natural: d.kept, total, success: !autoFail && total >= dc, mode };
}

/** Save'li etki: başarısızsa hasar (veya `halfOnSave` ile başarılıysa yarısı) ve durum. */
export function saveEffect(
  c: Combatant, rule: string, what: string, save: Ability, dc: number, rng: Rng,
  opts: { hit?: Hit; onFailCondition?: string; onFailStatus?: Partial<Combatant['mapStatus']>; stopOnFail?: boolean } = {},
): BattleEvent {
  const auto = (save === 'str' || save === 'dex') && autoFailsStrDexSave(c.conditions);
  const r = roll(c, `${save.toUpperCase()} save`, c.saves[save], dc, saveMode('normal', c, save), rng, auto);
  const ev: Extract<BattleEvent, { type: 'map_effect' }> = { type: 'map_effect', rule, targetId: c.id, text: what, roll: r };
  if (opts.hit && (!r.success || opts.hit.halfOnSave)) Object.assign(ev, hurt(c, opts.hit, r.success, rng));
  if (!r.success && opts.onFailCondition && !c.conditions.includes(opts.onFailCondition)) ev.addCondition = opts.onFailCondition;
  if (!r.success && opts.onFailStatus) ev.mapStatus = opts.onFailStatus;
  if (!r.success && opts.stopOnFail) ev.stopMovement = true;
  return ev;
}

/** Beceri kontrollü etki (bataktan çıkış, batma). */
export function checkEffect(c: Combatant, rule: string, what: string, sk: Skill, dc: number, rng: Rng): Extract<BattleEvent, { type: 'map_effect' }> {
  const mode = checkMode(c, sk, sk === 'stealth' && c.stealthDisadvantage ? 'disadvantage' : 'normal');
  return { type: 'map_effect', rule, targetId: c.id, text: what, roll: roll(c, SKILLS[sk].name, skillBonus(c, sk), dc, mode, rng) };
}

/** Düşme (SRD 5.2.1 Falling, s. 182): her 10 ft için 1d6 bludgeoning (en çok 20d6), hasar alırsa Prone. */
export function fallEffect(c: Combatant, feet: number, rng: Rng): Extract<BattleEvent, { type: 'map_effect' }> {
  const dice = Math.min(20, Math.floor(feet / 10));
  const ev = { type: 'map_effect', rule: 'fall', targetId: c.id, text: `${feet} ft düştü`, ...hurt(c, { dice: `${dice}d6`, type: 'bludgeoning' }, false, rng) } as Extract<BattleEvent, { type: 'map_effect' }>;
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
  if (lavaEdge && !flying(c) && adjacentToLava(state, c.pos)) {
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
  const water = !flying(c) ? sinkingWater(state, c.pos) : undefined;
  if (water && c.heavyArmor) {
    const ev = checkEffect(c, 'deepWater', 'ağır zırhla suda', skill(water.skill), num(water, 'dc'), rng);
    if (!ev.roll?.success) {
      const sink = c.mapStatus.sink + 1;
      ev.mapStatus = { sink };
      events.push(ev);
      if (sink >= num(water, 'drownAfterRounds')) events.push(drown(c, 'deepWater', rng));
    } else {
      events.push(ev);
    }
  }
  return events;
}

/** Sırası biten savaşçının tur sonu harita olayları. */
export function turnEndMapEvents(state: BattleState, c: Combatant, rng: Rng): BattleEvent[] {
  if (!state.map || !c.pos || !alive(c)) return [];
  const events: BattleEvent[] = [];
  const here = tileAt(state, c.pos);
  if (here.hazard && !flying(c)) {
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
  return events;
}

/** Yürürken girilen altıgenin olayları; `stop` doğruysa yürüyüş orada biter. */
export function enterHexEvents(state: BattleState, c: Combatant, at: Offset, rng: Rng): { events: BattleEvent[]; stop: boolean } {
  if (!state.map || flying(c)) return { events: [], stop: false };
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
  if (bog && isBog(state, at)) {
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
  const stop = events.some((e) => e.type === 'map_effect' && (e.stopMovement === true || (e.hpAfter ?? 1) <= 0));
  return { events, stop };
}

/**
 * Işıklar tek yerde (Görev K): karanlık (`darkness`, görüş sınırı) ve gece (`night`, gizlenme) kuralları aynı ışık
 * listesini kullanır. Işıklar ve yarıçap hangi kuralda yazılıysa oradan okunur (önce `darkness`); ikisinde birden
 * yazılmaz. Işık veren zemin (kristal) her zaman ışıktır.
 */
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
  const lit = new Set<string>();
  const dark = ruleOf(state, 'darkness');
  const rule = lightRule(state);
  if (!rule || !state.map) return lit;
  const size = sizeOf(state);
  const r0 = rule.lightRadiusHexes ?? ruleOf(state, 'night')?.lightRadiusHexes;
  const radius = typeof r0 === 'number' ? r0 : 0;
  const sources: Array<{ at: Offset; r: number }> = ((rule.lights as unknown[] | undefined) ?? []).map((xy) => ({ at: ruleHex(state, xy), r: radius }));
  state.map.tiles.forEach((row, r) => [...row].forEach((ch, col) => {
    // Işık veren zeminin yarıçapı kuralda ezilebilir (mağara: loş kristaller, `tileLightRadiusHexes`).
    const light = terrainOf(ch).light;
    const tileR = typeof dark?.tileLightRadiusHexes === 'number' ? dark.tileLightRadiusHexes : light?.radiusHexes;
    if (light && tileR !== undefined) sources.push({ at: { col, row: r }, r: tileR });
  }));
  for (const src of sources) for (const h of withinRange(src.at, src.r, size)) lit.add(`${h.col},${h.row}`);
  return lit;
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
    penalty: typeof night.passivePerceptionPenalty === 'number' ? night.passivePerceptionPenalty : 0,
    advantage: night.hideAdvantage === true,
  };
}

/** Karanlıkta `observer` `target`ı görür mü: hedef aydınlıktaysa ya da görüş mesafesindeyse. */
export function canSee(state: BattleState, observer: Combatant, target: Combatant, lit?: Set<string>): boolean {
  const dark = ruleOf(state, 'darkness');
  if (!dark || !observer.pos || !target.pos) return true;
  // Işıklar yalnızca görüş sınırı (karanlık) varken hesaplanır (gece haritasında her görüş sorusunda değil).
  if ((lit ?? litHexes(state)).has(`${target.pos.col},${target.pos.row}`)) return true;
  const range = observer.darkvision > 0 ? num(dark, 'darkvisionHexes') : num(dark, 'unlitSightHexes');
  return distance(observer.pos, target.pos) <= range;
}

/** Haritadan gelen saldırı etkileri ve siper; görülemeyen hedefte hata. */
export function mapAttackSources(
  state: BattleState, attacker: Combatant, target: Combatant, ranged: boolean,
): { sources: ModeSource[]; cover: 0 | 2 | 5 } | Failure {
  if (!state.map || !attacker.pos || !target.pos) return { sources: [], cover: 0 };
  const d = distance(attacker.pos, target.pos);
  const sources: ModeSource[] = [];
  let cover: 0 | 2 | 5 = 0;
  const dark = ruleOf(state, 'darkness');
  if (dark) {
    const lit = litHexes(state);
    if (dark.unseenTargetsUntargetable === true && !canSee(state, attacker, target, lit)) {
      return fail(`Karanlık: ${target.name} görülmüyor.`);
    }
    if (dark.unseenAttackerAdvantage === true && !canSee(state, target, attacker, lit)) {
      sources.push({ effect: 'advantage', reason: 'Karanlıktan saldıran' });
    }
  }
  const crenel = ruleOf(state, 'crenel');
  if (crenel && ranged) {
    const from = (crenel.fromTerrain as string[] | undefined) ?? [];
    const here = state.map.tiles[target.pos.row]?.[target.pos.col] ?? '';
    if (from.includes(here) && tileAt(state, attacker.pos).height < tileAt(state, target.pos).height) {
      cover = crenel.coverVsRangedFromBelow === 'three-quarters' ? 5 : 2;
    }
  }
  const sand = ruleOf(state, 'sandstorm');
  if (sand) {
    const sight = num(sand, 'visibilityHexes');
    if (d > sight) return fail(`Kum fırtınası: ${sight} altıgenden uzağı görülmez (${d}).`);
    if (ranged && d > num(sand, 'rangedDisadvantageBeyondHexes')) sources.push({ effect: 'disadvantage', reason: 'Kum fırtınası' });
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
  return sand && sand.hideCheckAdvantage === true ? [{ effect: 'advantage', reason: 'Kum fırtınası' }] : [];
}

/**
 * Harita kurallarının yürüme maliyeti: tırmanma (`climb`, çıkılan her seviye için) ve derin
 * batak (`bog`, `moveCostPerHex`). Zemin maliyetinden büyükse o geçer.
 */
export function mapEnterCost(state: BattleState, from: Offset, to: Offset, base: number): number {
  let cost = base;
  const climb = ruleOf(state, 'climb');
  const up = tileAt(state, to).height - tileAt(state, from).height;
  if (climb && up > 0) cost = Math.max(cost, num(climb, 'heightDiffCost') * up);
  const bog = ruleOf(state, 'bog');
  if (bog && isBog(state, to)) cost = Math.max(cost, num(bog, 'moveCostPerHex'));
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
      if (c.pos && sameHex(c.pos, h) && !flying(c) && c.life !== 'dead') events.push({ type: 'fell_into_lava', actorId: c.id, at: h });
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
