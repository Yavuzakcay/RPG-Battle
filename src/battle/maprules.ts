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
import { getMap, type MapRuleData } from '../map/maps';
import { terrainOf, type TerrainType } from '../map/terrain';
import type { Ability } from '../rules/abilities';
import { autoFailsStrDexSave } from '../rules/conditions';
import { adjustDamage, halfDamage } from '../rules/damage';
import { rollD20, rollDice, type RollMode, type Rng } from '../rules/dice';
import { distance, neighbors, sameHex, withinRange, type Offset } from '../rules/hex';
import type { ModeSource } from '../rules/modes';
import { skillBonus, SKILLS, type Skill } from '../rules/skills';
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
  const rolled = hit.rolled ?? rollDice(hit.dice, rng);
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
  const d = rollD20(mode, rng);
  const total = d.kept + bonus;
  return { label, dc, d20: d.rolls, natural: d.kept, total, success: !autoFail && total >= dc, mode };
}

/** Save'li etki: başarısızsa hasar (veya `halfOnSave` ile başarılıysa yarısı) ve durum. */
export function saveEffect(
  c: Combatant, rule: string, what: string, save: Ability, dc: number, rng: Rng,
  opts: { hit?: Hit; onFailCondition?: string; onFailStatus?: Partial<Combatant['mapStatus']>; stopOnFail?: boolean } = {},
): BattleEvent {
  const auto = (save === 'str' || save === 'dex') && autoFailsStrDexSave(c.conditions);
  const r = roll(c, `${save.toUpperCase()} save`, c.saves[save], dc, 'normal', rng, auto);
  const ev: Extract<BattleEvent, { type: 'map_effect' }> = { type: 'map_effect', rule, targetId: c.id, text: what, roll: r };
  if (opts.hit && (!r.success || opts.hit.halfOnSave)) Object.assign(ev, hurt(c, opts.hit, r.success, rng));
  if (!r.success && opts.onFailCondition && !c.conditions.includes(opts.onFailCondition)) ev.addCondition = opts.onFailCondition;
  if (!r.success && opts.onFailStatus) ev.mapStatus = opts.onFailStatus;
  if (!r.success && opts.stopOnFail) ev.stopMovement = true;
  return ev;
}

/** Beceri kontrollü etki (bataktan çıkış, batma). */
export function checkEffect(c: Combatant, rule: string, what: string, sk: Skill, dc: number, rng: Rng): Extract<BattleEvent, { type: 'map_effect' }> {
  const mode = sk === 'stealth' && c.stealthDisadvantage ? 'disadvantage' : 'normal';
  return { type: 'map_effect', rule, targetId: c.id, text: what, roll: roll(c, SKILLS[sk].name, skillBonus(c, sk), dc, mode, rng) };
}

/** Save'siz hasar. */
function damageEffect(c: Combatant, rule: string, what: string, hit: Hit, rng: Rng): BattleEvent {
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

// ---------------------------------------------------------------------------------------------
// Kancalar

/** Sırası gelen savaşçının tur başı harita olayları. */
export function turnStartMapEvents(state: BattleState, c: Combatant, rng: Rng): BattleEvent[] {
  if (!state.map || !c.pos || !alive(c)) return [];
  const events: BattleEvent[] = [];
  const lavaEdge = ruleOf(state, 'lavaEdge');
  if (lavaEdge && !flying(c) && adjacentToLava(state, c.pos)) {
    events.push(damageEffect(c, 'lavaEdge', 'lav kenarında sıcak dalga', { dice: text(lavaEdge, 'damage'), type: text(lavaEdge, 'damageType') }, rng));
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
  const stop = events.some((e) => e.type === 'map_effect' && (e.stopMovement === true || (e.hpAfter ?? 1) <= 0));
  return { events, stop };
}

/** Haritadan gelen saldırı etkileri; görülemeyen hedefte hata. */
export function mapAttackSources(
  state: BattleState, attacker: Combatant, target: Combatant, ranged: boolean,
): ModeSource[] | Failure {
  if (!state.map || !attacker.pos || !target.pos) return [];
  const d = distance(attacker.pos, target.pos);
  const sources: ModeSource[] = [];
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
  return sources;
}

/** Gizlenme zarına harita etkisi (kum fırtınası: avantaj). */
export function mapHideSources(state: BattleState): ModeSource[] {
  const sand = ruleOf(state, 'sandstorm');
  return sand && sand.hideCheckAdvantage === true ? [{ effect: 'advantage', reason: 'Kum fırtınası' }] : [];
}

/** Bir altıgenden komşusuna geçerken tırmanma ek maliyeti (`climb`): çıkılan her seviye için. */
export function climbCost(state: BattleState, from: Offset, to: Offset, base: number): number {
  const climb = ruleOf(state, 'climb');
  if (!climb) return base;
  const up = tileAt(state, to).height - tileAt(state, from).height;
  return up > 0 ? Math.max(base, num(climb, 'heightDiffCost') * up) : base;
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
    const rolled = rollDice(text(r, 'damage'), rng);
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
