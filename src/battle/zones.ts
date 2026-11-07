/**
 * Büyü alanları (Görev B2; SRD 5.2.1): kalıcı zemin etkileri (Entangle, Fog Cloud, Grease, Moonbeam, Silence, Spike
 * Growth, Web, Plant Growth, Sleet Storm, Stinking Cloud), geçici engel (Wind Wall) ve yaratıkla yürüyen alanlar
 * (Flaming Sphere, Conjure Animals). Alanın yeri, sahibi ve süresi haritada (`map.zones`), kuralı büyü verisinde
 * (`mechanics.zone`). Bitiş reducer'da (`pruneZones`: süre, konsantrasyon, bağlı yaratık).
 *
 * Tetikler Spirit Guardians yayılımının kalıbında: oluşunca/taşınınca içindekiler, girince (yürüyüş ve itme adımı),
 * içinde yürüdükçe (Spike Growth), tur başı ve tur sonu. Save'ler zar kancasından (elle zar defteri). Kurallar:
 * - Uçan yaratık zemin alanlarının tetiklerinden (`ground`) ve alanların zorlu arazisinden etkilenmez (S1 `isAirborne`).
 * - Aynı büyünün alanları üst üste binerse yaratığa yalnızca biri (en yüksek DC) uygulanır; farklı büyüler ayrı ayrı.
 *   Zorlu arazi birikmez: altıgen maliyeti alanların ve zeminin en büyüğü.
 * - Dokunulamaz çağrılar (Flaming Sphere, ruh sürüsü) alanlardan etkilenmez.
 */
import { healRoll } from './healMax';
import { groundWarded, groundZone } from './groundWard';
import { barriersOn, passesBarrier } from './barriers';
import { fireSideHexes, wallOpenEvents } from './walls';
import { AXIAL_DIRECTIONS, axialToOffset, distance, isInside, neighbors, offsetToAxial } from '../rules/hex';
import { isLiquidTile } from './deepWater';
import { terrainOf } from '../map/terrain';
import { globalRule } from './ruleControl';
import { spells, type Spell, type ZoneSpec } from '../data';
import surfaceData from '../../data/yuzeyler.json';
import { resolveSave } from '../rules/attack';
import { adjustDamage } from '../rules/damage';
import { formatDice, parseDice, rollDice, rollTag, type Rng } from '../rules/dice';
import { line, sameHex, withinRange, type Offset } from '../rules/hex';
import { autoFailsStrDexSave } from '../rules/conditions';
import type { ModeSource } from '../rules/modes';
import { atSlot, damageProfile, fail, finish, isIntangible, isTargetable, upcastDiceCount, type CommandResult } from './common';
import { damageEffects } from './damage-effects';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
import { saveDamage } from './classTraits';
import { isAirborne } from './flight';
import { pickArea } from './areaAttack';
import { turnKey } from './economy';
import { bodyAt } from './body';
import { applyEvents } from './reduce';
import { pushAwayEvents } from './forced';
import { disperseEvents } from './surfaceMix';
import { ruleVersion } from './ruleVersion';
import { mechanicsAt } from './spellVersion';
import { altitudeInZone } from './altitude';
import { senseSees } from './sight';
import { concentrationEvent, spendSlot } from './slots';
import type { BattleEvent, BattleState, Combatant, Command, SpellZone } from './types';

type CastCommand = Extract<Command, { type: 'cast_spell' }>;

const spellById = (id: string): Spell | undefined => spells.find((s) => s.id === id);
/** Alanın kuralı: büyü alanında büyü verisi, yüzeyde (Görev Y1) `data/yuzeyler.json`. */
export const zoneSpecOf = (z: SpellZone): ZoneSpec | undefined =>
  z.spec ? z.spec : z.surface ? (surfaceData.kinds as Record<string, { zone: ZoneSpec }>)[z.surface]?.zone
    // Kuyruk 19: alan büyüsünün ardından kalan zemin (`aftermath`; Ice Storm'un dolu taneleri).
    : spellById(z.spellId)?.mechanics.zone ?? spellById(z.spellId)?.mechanics.aftermath ?? spellById(z.spellId)?.mechanics.upgrade?.buffZone
      ?? spellById(z.spellId)?.mechanics.upgrade?.zone;
const sizeOf = (state: BattleState) => ({ cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 });


/** Alanın şu anki altıgenleri (yürüyen alanda bağlı yaratığın çevresi). */
export function zoneHexes(state: BattleState, z: SpellZone, anchorAt?: Offset | null): Offset[] {
  if (!z.anchorId) return z.hexes;
  const at = anchorAt !== undefined ? anchorAt : state.combatants[z.anchorId]?.pos ?? null;
  return at ? withinRange(at, z.radius ?? 1, sizeOf(state)) : [];
}

const inZone = (state: BattleState, z: SpellZone, at: Offset | null, anchorAt?: Offset | null): boolean =>
  !!at && zoneHexes(state, z, anchorAt).some((h) => sameHex(h, at));

/** Kuyruk 43: yaratığın `at` çapasındaki gövdesinin herhangi bir altıgeni alanda mı (tek altıgenlide `inZone`). */
const bodyInZone = (state: BattleState, z: SpellZone, c: Combatant, at: Offset | null, anchorAt?: Offset | null): boolean =>
  !!at && bodyAt(state, c, at).some((h) => inZone(state, z, h, anchorAt))
  // Kuyruk S2 (sürüm 41): irtifası alanın tepesinin üstündeki yaratık alanda değil (silindir `heightFt`, yer alanı 0).
  && altitudeInZone(state, z, zoneSpecOf(z), c);

/** Kuyruk 19: ağ alanı (Web büyüsü; yanan ağ yüzeyi değil). */
export const isWebZone = (z: SpellZone): boolean => !z.surface && z.spellId === 'web';

/** Bir altıgendeki alanlar. */
export function zonesAt(state: BattleState, at: Offset | null): SpellZone[] {
  return (state.map?.zones ?? []).filter((z) => inZone(state, z, at));
}

/** Alan bu yaratığı etkiler mi: ayakta, dokunulabilir, uçan değil (zemin), düşman koşulu, büyücü hariç koşulu. */
function affects(state: BattleState, z: SpellZone, spec: ZoneSpec, c: Combatant): boolean {
  if (isWebZone(z) && c.effects?.some((e) => e.webWalker)) return false;
  if (!isTargetable(c) || c.hp <= 0 || isIntangible(c) || c.id === z.anchorId) return false;
  if (spec.ground && isAirborne(c)) return false;
  // Kuyruk K54b: zemin koruması (Mevzi İşareti, Yol aç, Kuşbakışı Plan): zemin yüzeyi ve zemin alanı etkilemez.
  if (groundZone(z, spec.ground) && groundWarded(state, c)) return false;
  if (spec.targets === 'enemies' && c.side === z.side) return false;
  if (spec.targets === 'allies' && c.side !== z.side) return false;
  if (spec.notCaster && c.id === z.casterId) return false;
  if (spec.gate && !globalRule(state, spec.gate)) return false;
  return true;
}

/** Aynı büyünün üst üste binen alanlarından yalnızca en yüksek DC'li olanı (kimlik sırasıyla eşitlik bozulur). */
function strongestPerSpell(zones: SpellZone[]): SpellZone[] {
  const best = new Map<string, SpellZone>();
  for (const z of zones) {
    const cur = best.get(z.spellId);
    if (!cur || z.dc > cur.dc) best.set(z.spellId, z);
  }
  return zones.filter((z) => best.get(z.spellId) === z);
}

/** Alanın hasar zarı (yukarı slot: büyünün `upcast.dice`, `applied` ise). */
function zoneDamage(z: SpellZone, spec: ZoneSpec): string | null {
  if (z.damage) return z.damage;
  if (!spec.damage) return null;
  const spell = spellById(z.spellId);
  const d = parseDice(spec.damage);
  const extra = spell ? upcastDiceCount(spell.mechanics, z.slotLevel - spell.level) : 0;
  // Görev Y1: sabit hasar (yanan yağ 5).
  return formatDice(d.count + extra, d.sides, d.bonus);
}

/**
 * Bir yaratık için alanın tetiği: save (ya da doğrudan hasar), hasar, durumlar, konsantrasyon kaybı. Turda bir kez
 * kuralı olan alanda `zone_triggered` önce yazılır.
 */
/** Kuyruk 19: hasar bütçesi (Guardian of Faith: toplam 60 hasarda kaybolur). */
function budgetEvents(state: BattleState, z: SpellZone, spec: ZoneSpec, amount: number): BattleEvent[] {
  if (!spec.budget || amount <= 0 || !globalRule(state, 'spellsK19')) return [];
  const live = liveZone(state, z.id) ?? z;
  const out: BattleEvent[] = [{ type: 'zone_dealt', zoneId: z.id, amount }];
  if ((live.dealt ?? 0) + amount >= spec.budget) out.push({ type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'expired' });
  return out;
}

export function triggerEvents(state: BattleState, z: SpellZone, victimId: string, rng: Rng): BattleEvent[] {
  const spec = zoneSpecOf(z);
  const victim = state.combatants[victimId];
  if (!spec || !victim || !affects(state, z, spec, victim)) return [];
  const turn = turnKey(state);
  if (spec.once && z.hits?.[victim.id] === turn) return [];
  // Kuyruk 19: Conjure Elemental: ruhun bir tutsağı varken başka yaratık save atmaz.
  const captiveId = `${z.spellId}:${z.id}`;
  if (spec.captive && globalRule(state, 'spellsK19') && Object.values(state.combatants).some((c) => c.hp > 0 && (c.effects ?? []).some((e) => e.id === captiveId))) return [];
  const events: BattleEvent[] = spec.once ? [{ type: 'zone_triggered', zoneId: z.id, targetId: victim.id, turn }] : [];
  // Görev P7: iyileştiren zemin (ek paket): hasar yerine can.
  if (spec.heal) {
    if (victim.life === 'dead') return events;
    const h = { total: healRoll(state, victim, spec.heal, rng, z.casterId) };
    const n = Math.max(0, Math.min(h.total, victim.maxHp - victim.hp));
    if (n > 0) events.push({ type: 'healed', actorId: z.casterId, targetId: victim.id, label: z.name, amount: n, targetHpAfter: victim.hp + n });
    return events;
  }
  const expr = zoneDamage(z, spec);
  const dtype = z.damageType ?? spec.damageType;
  if (!spec.save) {
    if (!expr) return events;
    const d = rollDice(expr, rollTag(rng, { kind: 'damage', by: z.casterId }));
    const adj = adjustDamage(d.total, dtype, profileIn(state, victim, spells.some((x) => x.id === z.spellId)));
    const fx = damageEffects(victim, adj.amount, dtype ?? '', false, rng);
    events.push({ type: 'effect_tick', targetId: victim.id, effectId: z.spellId, name: z.name, damageRolls: d.rolls, appliedDamage: adj.amount,
      damageType: dtype ?? '', targetHpAfter: fx.hpAfter, effects: fx.effects });
    return events;
  }
  const ability = spec.save;
  const autoFail = (ability === 'str' || ability === 'dex') && autoFailsStrDexSave(victim.conditions);
  const save = resolveSave({ extra: saveDice(victim, ability), modifier: victim.saves[ability], dc: z.dc, mode: saveMode('normal', victim, ability, state.combatants[z.casterId]), autoFail },
    rollTag(rng, { by: victim.id }));
  const d = expr ? rollDice(expr, rollTag(rng, { kind: 'damage', by: z.casterId })) : { rolls: [] as number[], total: 0 };
  const amount = expr ? saveDamage(victim, ability, save.success, d.total, !!spec.half) : 0;
  const adj = amount > 0 ? adjustDamage(amount, dtype, profileIn(state, victim, spells.some((x) => x.id === z.spellId))) : { amount: 0, note: null };
  const fx = damageEffects(victim, adj.amount, dtype ?? '', false, rng);
  const failed = !save.success;
  const plain = failed && !spec.hold ? (spec.conditions ?? []).filter((x) => !victim.conditions.includes(x)) : [];
  // Sleet Storm: başarısız save'de konsantrasyon biter (hasar save'i gibi `effects` içinde).
  const lose = failed && spec.dropConcentration && victim.concentration
    ? [{ kind: 'concentration' as const, spell: victim.concentration.spell, dc: z.dc, natural: 0, total: 0, success: false }] : [];
  events.push({
    type: 'save_resolved', actorId: z.casterId, targetId: victim.id, label: z.name, ability, dc: z.dc, mode: 'normal', reasons: [],
    d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
    damageRolls: d.rolls, rawDamage: d.total, appliedDamage: adj.amount, damageType: dtype ?? '', damageNote: adj.note,
    targetHpAfter: fx.hpAfter, effects: [...fx.effects, ...lose], conditionsAdded: plain, ...(save.extra ? { bonusDice: save.extra } : {}),
  });
  events.push(...budgetEvents(state, z, spec, adj.amount));
  // Kuyruk A8 (Moonbeam, `revertShape`): başarısız save'de biçim değiştiren (Polymorph, Wild Shape) gerçek biçimine döner.
  if (failed && spec.revertShape) for (const e of victim.effects ?? []) if (e.polymorph) events.push({ type: 'effect_ended', targetId: victim.id, effectId: e.id, name: e.name, reason: 'dispelled' });
  // Kuyruk A6 (Gust of Wind): başarısız save'de büyücüden uzağa itme.
  const caster = state.combatants[z.casterId];
  if (failed && spec.push && caster?.pos && fx.hpAfter > 0) events.push(...pushAwayEvents(applyEvents(state, events), caster.pos, victim.id, spec.push, z.casterId, rng));
  // Büyü sürdükçe (Entangle, Web: tur sonu kurtulma save'i) ya da bu turun sonuna dek (Stinking Cloud) süren durumlar.
  if (failed && spec.hold && spec.conditions?.length && fx.hpAfter > 0) {
    const spell = spellById(z.spellId);
    events.push({ type: 'effect_added', targetId: victim.id, effect: {
      id: `${z.spellId}:${z.id}`, name: z.name, sourceId: z.casterId, grants: spec.conditions,
      ...(spec.hold === 'turn' ? { until: state.round + 1, untilOwnTurnEnd: true } : {}),
      ...(spec.hold === 'spell' && spell?.concentration ? { concentration: spell.name } : {}),
      ...(spec.hold === 'spell' && z.until !== undefined ? { until: z.until } : {}),
      // Kuyruk A8 (Stinking Cloud): eylem ve bonus eylem yasak (tepki serbest).
      ...(spec.noActBonus ? { noActBonus: true } : {}),
      // CILA: kurtulma eylemle STR (Athletics) kontrolü (`escape` komutu); tur sonu save'i yok.
      ...(spec.escape && !(spec.captive && globalRule(state, 'spellsK19')) ? { escapeCheck: { dc: z.dc } } : {}),
      // Kuyruk 19: tutsağın tur başı save'i (başarısızsa 4d8, başarılıysa kurtulur).
      ...(spec.captive && globalRule(state, 'spellsK19') ? { startSave: { ability: spec.save, dc: z.dc, dice: spec.captive.repeatDice, type: dtype ?? 'force' } } : {}),
    } });
  }
  return events;
}

/** Olay üreticilerini sırayla uygular (her biri öncekinin sonucunu görür). */
function chain(state: BattleState, makers: Array<(s: BattleState) => BattleEvent[]>): BattleEvent[] {
  let current = state;
  const out: BattleEvent[] = [];
  for (const f of makers) {
    const evs = f(current);
    out.push(...evs);
    current = applyEvents(current, evs);
  }
  return out;
}

const liveZone = (s: BattleState, id: string) => s.map?.zones?.find((x) => x.id === id);

/**
 * Yürüyüş ya da itme adımı (yaratık `to`dadır): girdiği alanların `enter` tetiği, içinde yürüdükçe `move` (Spike
 * Growth: her altıgen), yürüyen alanın (`anchorMove`) yaklaştığı yaratıklar.
 */
export function zoneStepEvents(state: BattleState, moverId: string, from: Offset | null, to: Offset | null, rng: Rng): BattleEvent[] {
  const zones = state.map?.zones ?? [];
  if (!zones.length) return [];
  const makers: Array<(s: BattleState) => BattleEvent[]> = [];
  const mover = state.combatants[moverId];
  const bodyIn = (z: SpellZone, at: Offset | null) => (mover ? bodyInZone(state, z, mover, at) : inZone(state, z, at));
  for (const z of strongestPerSpell(zones.filter((x) => x.anchorId !== moverId && bodyIn(x, to)))) {
    const spec = zoneSpecOf(z);
    if (!spec?.on) continue;
    const entered = !bodyIn(z, from);
    if (spec.on.includes('move') || (entered && spec.on.includes('enter'))) {
      makers.push((s) => { const live = liveZone(s, z.id); return live ? triggerEvents(s, live, moverId, rng) : []; });
    }
  }
  for (const z of zones.filter((x) => x.anchorId === moverId && zoneSpecOf(x)?.on?.includes('anchorMove'))) {
    for (const c of Object.values(state.combatants)) {
      if (!c.pos || bodyInZone(state, z, c, c.pos, from) || !bodyInZone(state, z, c, c.pos)) continue;
      makers.push((s) => { const live = liveZone(s, z.id); return live ? triggerEvents(s, live, c.id, rng) : []; });
    }
  }
  return chain(state, makers);
}

/** Tur başı ya da sonu: yaratığın bulunduğu alanların `start`/`end` tetiği. */
export function zoneTurnEvents(state: BattleState, id: string, phase: 'start' | 'end', rng: Rng): BattleEvent[] {
  const c0 = state.combatants[id];
  if (!c0?.pos || !state.map?.zones?.length) return [];
  // Kuyruk 19: girdap (Control Water): tur başında sudakiler merkeze çekilir; uzaklaşmak için Athletics (`escape`).
  const pulled = phase === 'start' ? vortexPullEvents(state, c0) : [];
  if (pulled.length) state = applyEvents(state, pulled);
  const c = state.combatants[id] as Combatant;
  if (!c.pos || !state.map) return pulled;
  const k19 = globalRule(state, 'spellsK19');
  const here = strongestPerSpell((state.map.zones ?? []).filter((z) => (bodyInZone(state, z, c, c.pos) || (phase === 'end' && !!z.endHexes?.some((h) => sameHex(h, c.pos as Offset))))
    && zoneSpecOf(z)?.on?.includes(phase) && !(k19 && zoneSpecOf(z)?.casterTurn)));
  return [...pulled, ...chain(state, here.map((z) => (s: BattleState) => { const live = liveZone(s, z.id); return live ? triggerEvents(s, live, id, rng) : []; }))];
}

const tileTerrain = (state: BattleState, h: Offset) => terrainOf(state.map?.tiles[h.row]?.[h.col] ?? '#');

/** Kuyruk 19: yaratığın içinde olduğu girdap (merkez ve DC); yoksa null. */
export function vortexOf(state: BattleState, c: Combatant): { center: Offset; dc: number; zone: SpellZone; pull: number } | null {
  if (!c.pos || !globalRule(state, 'spellsK19')) return null;
  for (const z of state.map?.zones ?? []) {
    const v = zoneSpecOf(z)?.vortex;
    if (v && z.center && z.hexes.some((h) => sameHex(h, c.pos as Offset)) && isLiquidTile(tileTerrain(state, c.pos))) return { center: z.center, dc: z.dc, zone: z, pull: v.pull };
  }
  return null;
}

function vortexPullEvents(state: BattleState, c: Combatant): BattleEvent[] {
  const v = vortexOf(state, c);
  if (!v || !c.pos || isAirborne(c)) return [];
  const out: BattleEvent[] = [];
  let at = c.pos;
  const size = sizeOf(state);
  for (let i = 0; i < v.pull && !sameHex(at, v.center); i++) {
    const next = neighbors(at, size).filter((h) => distance(h, v.center) < distance(at, v.center) && !Object.values(state.combatants).some((o) => o.id !== c.id && o.hp > 0 && o.pos && sameHex(o.pos, h)) && tileTerrain(state, h).movement !== 'blocked')
      .sort((a, b) => distance(a, v.center) - distance(b, v.center))[0];
    if (!next) break;
    out.push({ type: 'pushed', targetId: c.id, from: at, to: next, by: v.zone.casterId });
    at = next;
  }
  out.push({ type: 'effect_added', targetId: c.id, effect: { id: 'whirlpool-pull', name: 'Girdap', sourceId: v.zone.casterId, until: state.round, untilOwnTurnEnd: true, escapeCheck: { dc: v.dc }, icon: '🌀' } });
  return out;
}

/** Girdaptaki yaratık (kaçmadıysa) merkezden uzaklaşan adım atamaz. */
export function vortexBlocks(state: BattleState, c: Combatant): ((h: Offset, prev: Offset) => boolean) | null {
  if (!c.effects?.some((e) => e.id === 'whirlpool-pull')) return null;
  const v = vortexOf(state, c);
  if (!v) return null;
  return (h, prev) => distance(h, v.center) > distance(prev, v.center);
}

/**
 * Kuyruk 19: Faithful Hound: büyücünün turunun başında alandaki (köpeğe 5 ft) tek düşmana ısırık (en düşük HP'li).
 */
export function casterTurnZoneEvents(state: BattleState, casterId: string, rng: Rng): BattleEvent[] {
  if (!state.map?.zones?.length || !globalRule(state, 'spellsK19')) return [];
  const out: BattleEvent[] = [];
  let s = state;
  for (const z of state.map.zones) {
    const spec = zoneSpecOf(z);
    if (z.casterId !== casterId || !spec?.casterTurn) continue;
    const prey = Object.values(s.combatants).filter((c) => c.pos && affects(s, z, spec, c) && bodyInZone(s, z, c, c.pos)).sort((a, b) => a.hp - b.hp)[0];
    if (!prey) continue;
    const evs = triggerEvents(s, z, prey.id, rng);
    out.push(...evs);
    s = applyEvents(s, evs);
  }
  return out;
}

/** Kuyruk 19: büyücünün taşınabilir alanı (Faithful Hound; konsantrasyonsuz) varsa. */
export function movableZoneOf(state: BattleState, actor: Combatant): { zone: SpellZone; spell: Spell } | null {
  if (!globalRule(state, 'spellsK19')) return null;
  for (const z of state.map?.zones ?? []) {
    // Kuyruk A7: sürüm blokları (Dancing Lights bonus eylemle 60 ft).
    const sp0 = spellById(z.spellId);
    const sp = sp0 ? { ...sp0, mechanics: mechanicsAt(state, sp0) } : undefined;
    if (z.casterId === actor.id && sp?.mechanics.repeat?.moveZoneFt !== undefined) return { zone: z, spell: sp };
  }
  return null;
}

/** Kuyruk 19: alanı taşı (Faithful Hound: Magic eylemiyle 30 ft); altıgenler eksenel öteleme. */
export function shiftZoneEvents(state: BattleState, z: SpellZone, to: Offset, maxFt: number): BattleEvent[] | string {
  const from = z.center ?? z.hexes[Math.floor(z.hexes.length / 2)];
  if (!from) return 'Alanın merkezi yok.';
  if (distance(from, to) * 5 > maxFt) return `${z.name} en çok ${maxFt} ft taşınır.`;
  const a = offsetToAxial(from); const b = offsetToAxial(to);
  const size = sizeOf(state);
  const hexes = z.hexes.map((h) => { const x = offsetToAxial(h); return axialToOffset({ q: x.q + b.q - a.q, r: x.r + b.r - a.r }); })
    .filter((h) => !size || isInside(h, size));
  return [{ type: 'zone_moved', zoneId: z.id, hexes, center: to }];
}

/**
 * Alanların yürüme maliyeti: zorlu arazi (2; Plant Growth 4; uçan yaratık zorlu araziden etkilenmez) ve rüzgâr duvarı
 * (Small ve küçük uçan yaratık, Gaseous Form'daki yaratık geçemez: null). Altıgende alan yoksa 1.
 */
export function zoneMoveCost(state: BattleState, mover: Combatant): (h: Offset, prev?: Offset) => number | null {
  const zones = state.map?.zones ?? [];
  if (!zones.length) return () => 1;
  const flying = isAirborne(mover);
  const small = mover.size === 'T' || mover.size === 'S';
  const gaseous = !!mover.effects?.some((e) => e.noAttack);
  const web = !!mover.effects?.some((e) => e.webWalker);
  const ice = !!mover.effects?.some((e) => e.iceWalker);
  // Kuyruk S1 (sürüm 40): Gust of Wind'de büyücüye yaklaşma adım adım (önceki altıgene göre).
  const stepwise = ruleVersion(state) >= 40;
  return (h, prev) => {
    let cost = 1;
    for (const z of zones) {
      // Kuyruk K53 S4: geçici engel (dost geçer gibi kişiye göre olanlar da burada).
      if (z.barrier) {
        if (barriersOn(state) && z.barrier.blocksMove && z.hexes.some((x) => x.col === h.col && x.row === h.row) && !passesBarrier(z, mover)) return null;
        continue;
      }
      const spec = zoneSpecOf(z);
      if (!spec || !inZone(state, z, h)) continue;
      if (spec.solid) return null;
      if (spec.repel && repelled(state, z, mover)) return null;
      if (spec.windWall && ((flying && small) || gaseous)) return null;
      // Kuyruk 19: yalnızca düşmanlar için zorlu arazi (Conjure Minor Elementals).
      if (spec.difficultFor === 'enemies' && mover.side === z.side) continue;
      if ((web && isWebZone(z)) || (ice && z.surface === 'ice')) continue;
      if (spec.difficult && !flying) cost = Math.max(cost, spec.difficult);
      // Kuyruk A6 (Gust of Wind): hatta büyücüye (başlangıç yerinden) yaklaşan adım iki kat.
      const src = spec.costToward ? state.combatants[z.casterId]?.pos : undefined;
      const from = stepwise && prev ? prev : mover.pos;
      if (src && from && mover.id !== z.casterId && distance(h, src) < distance(from, src)) cost = Math.max(cost, spec.costToward as number);
    }
    return cost;
  };
}

/** Kuyruk S2: altıgen hafif örtülü mü (Web). */
export const lightlyObscured = (state: BattleState, at: Offset | null): boolean =>
  zonesAt(state, at).some((z) => zoneSpecOf(z)?.obscured === 'light');

/** Altıgen yoğun örtülü mü (Fog Cloud, Sleet Storm, Stinking Cloud). */
export const heavilyObscured = (state: BattleState, at: Offset | null): boolean =>
  zonesAt(state, at).some((z) => zoneSpecOf(z)?.obscured === 'heavy');

const SPELL_RESIST_ALL = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
/** CILA: hasar profili konumla: Silence alanındaki yaratık Thunder hasarına bağışık (SRD 5.2.1). */
export function profileIn(state: BattleState, c: Combatant, spell = false): ReturnType<typeof damageProfile> {
  const p0 = damageProfile(c);
  // Kuyruk P11 (sözde tür `buyu`: paket `direnc.hasarKaynagi: buyu`): büyü hasarının her türüne direnç.
  const p = spell && ruleVersion(state) >= 42 && p0.resistances.includes('buyu') ? { ...p0, resistances: [...new Set([...p0.resistances, ...SPELL_RESIST_ALL])] } : p0;
  return c.pos && silencedAt(state, c.pos) && !p.immunities.includes('thunder') ? { ...p, immunities: [...p.immunities, 'thunder'] } : p;
}

/** Altıgen sessiz mi (Silence): sözlü bileşenli büyü yapılamaz. */
export const silencedAt = (state: BattleState, at: Offset | null): SpellZone | undefined =>
  zonesAt(state, at).find((z) => zoneSpecOf(z)?.silence);

/** İki altıgen arasında (uçlar hariç) rüzgâr duvarı (iki yanın da çizgisi duvardan geçiyorsa). */
export function windWallBetween(state: BattleState, from: Offset, to: Offset): SpellZone | undefined {
  const walls = (state.map?.zones ?? []).filter((z) => zoneSpecOf(z)?.windWall);
  if (!walls.length) return undefined;
  const crosses = (path: Offset[]) => walls.find((w) => path.slice(1, -1).some((h) => w.hexes.some((x) => sameHex(x, h))));
  const a = crosses(line(from, to, 1));
  const b = crosses(line(from, to, -1));
  return a && b ? a : undefined;
}

/**
 * Saldırıya alanların etkisi (`checkReach`): yoğun örtüdeki hedef görülmez (dezavantaj), yoğun örtüdeki saldıran
 * görülmez (avantaj); menzilli silah saldırısı rüzgâr duvarından geçemez.
 */
export function zoneAttackSources(state: BattleState, attacker: Combatant, target: Combatant, ranged: boolean, spell: boolean, label?: string): { sources: ModeSource[]; autoMiss?: string } {
  if (!state.map?.zones?.length || !attacker.pos || !target.pos) return { sources: [] };
  // CILA: menzilli silah saldırısı rüzgâr duvarından geçerken otomatik ıskalar (SRD 5.2.1 Wind Wall).
  const wall0 = ranged && !spell ? windWallBetween(state, attacker.pos, target.pos) : undefined;
  // Kuyruk S2 (sürüm 41): dev kaya ve kuşatma mermisi (saldırı adında `siegePass` sözcüğü) duvardan geçer.
  const siege = !!wall0 && ruleVersion(state) >= 41 && !!label && (zoneSpecOf(wall0)?.siegePass ?? []).some((w) => label.toLowerCase().includes(w));
  const wall = siege ? undefined : wall0;
  const out: ModeSource[] = [];
  // Kuyruk A7 (sürüm 36): Blindsight/Truesight menzilindeki yoğun örtü (Darkness, Fog Cloud) görüşü kesmez.
  const v36 = ruleVersion(state) >= 36;
  const targetHidden = heavilyObscured(state, target.pos) && !(v36 && senseSees(state, attacker, target));
  const attackerHidden = heavilyObscured(state, attacker.pos) && !(v36 && senseSees(state, target, attacker));
  if (targetHidden) out.push({ effect: 'disadvantage', reason: 'Görülmeyen hedef (yoğun örtü)' });
  if (attackerHidden) out.push({ effect: 'advantage', reason: 'Görülmeyen saldıran (yoğun örtü)' });
  // CILA: aradaki yoğun örtü (Fog Cloud, Stinking Cloud…) görüşü keser: iki taraf da birbirini görmez (avantaj ve
  // dezavantaj birbirini götürür; SRD 5.2.1 Unseen Attackers and Targets). Çizginin iki ucu yukarıda sayıldı.
  // Uçlardan biri örtüdeyse B2'nin kuralı geçerli (yukarıda); yalnızca ikisi de dışındayken aradaki örtü sayılır.
  const between = !targetHidden && !attackerHidden && line(attacker.pos, target.pos).slice(1, -1).some((h) => heavilyObscured(state, h));
  if (between) out.push({ effect: 'disadvantage', reason: 'Görülmeyen hedef (arada yoğun örtü)' }, { effect: 'advantage', reason: 'Görülmeyen saldıran (arada yoğun örtü)' });
  // Kuyruk 18 H2: Antilife Shell: dışarıdan içerideki hedefe yakın dövüş ulaşmaz.
  const shell = !ranged ? (state.map.zones ?? []).find((z) => zoneSpecOf(z)?.repel && inZone(state, z, target.pos) && repelled(state, z, attacker)) : undefined;
  const blocked = wall ?? shell;
  return { sources: out, ...(blocked ? { autoMiss: blocked.name } : {}) };
}

/** Kuyruk 18 H2: itici auranın dışındaki, Undead/Construct olmayan, aurayı taşımayan yaratık. */
/**
 * Kuyruk 19: Antilife Shell: büyücü yürüyüp etkilenen bir yaratığı bariyerden geçmeye zorlarsa (yaratık auranın içine
 * düşerse) büyü biter (SRD 5.2.1). Komut sonunda, anahtar `spellsK19`.
 */
export function repelPushEvents(before: BattleState, after: BattleState): BattleEvent[] {
  if (!globalRule(after, 'spellsK19')) return [];
  const out: BattleEvent[] = [];
  for (const z of after.map?.zones ?? []) {
    const spec = zoneSpecOf(z);
    if (!spec?.repel || !z.anchorId) continue;
    const a0 = before.combatants[z.anchorId]?.pos;
    const a1 = after.combatants[z.anchorId]?.pos;
    if (!a0 || !a1 || sameHex(a0, a1)) continue;
    const z0 = before.map?.zones?.find((x) => x.id === z.id) ?? z;
    const caught = Object.values(after.combatants).some((c) => {
      if (!c.pos || c.hp <= 0 || c.id === z.anchorId) return false;
      const type = c.creatureType ?? 'humanoid';
      if (type === 'undead' || type === 'construct') return false;
      const was = before.combatants[c.id]?.pos;
      return inZone(after, z, c.pos) && !!was && !inZone(before, z0, was);
    });
    if (caught && after.combatants[z.casterId]?.concentration?.spell === z.concentration) out.push({ type: 'concentration_ended', actorId: z.casterId, label: z.name });
  }
  return out;
}

function repelled(state: BattleState, z: SpellZone, c: Combatant): boolean {
  if (c.id === z.anchorId || !c.pos || inZone(state, z, c.pos)) return false;
  const type = c.creatureType ?? 'humanoid';
  return type !== 'undead' && type !== 'construct';
}

/** Alan büyüsü yapılırken ya da taşınırken altıgenler (büyünün alanı; duvar şekli `rules/area.ts`). */
function castHexes(state: BattleState, actor: Combatant, spell: Spell, aim: Offset | null, wallShape?: 'arc' | 'ring', cmd?: CastCommand): Offset[] | CommandResult {
  if (!state.map || !actor.pos) return fail('Alan büyüsü yalnızca haritalı savaşta.');
  if (!spell.area) return fail(`${spell.name}: alan tanımı yok.`);
  // Kuyruk S2 (sürüm 41, Wind Wall `wallPath`): serbest duvar: birbirine bitişik altıgen yolu (en çok N), ilki menzilde.
  const wp = ruleVersion(state) >= 41 ? spell.mechanics.wallPath : undefined;
  if (wp && cmd?.targetHexes?.length) return wallPathHexes(state, actor, spell, cmd.targetHexes, wp);
  // Kuyruk S2 (sürüm 41, Plant Growth `excludable`): seçilen altıgenler alanın dışında kalır.
  if (ruleVersion(state) >= 41 && spell.mechanics.excludable && cmd?.excludeHexes?.length) {
    const r = castHexes(state, actor, spell, aim, wallShape);
    if (!Array.isArray(r)) return r;
    const out = r.filter((h) => !cmd.excludeHexes?.some((x) => sameHex(x, h)));
    return out.length ? out : fail(`${spell.name}: bütün alan dışarıda bırakılamaz.`);
  }
  // CILA: duvar yay biçiminde de kurulabilir (Wind Wall).
  const area = wallShape && spell.area.shape === 'wall' ? { ...spell.area, bend: wallShape } : spell.area;
  const pick = pickArea(state, actor, area, spell.rangeFt, aim, 'büyü');
  if ('ok' in pick) return pick;
  return pick.hexes;
}

/** Kuyruk S2: Wind Wall serbest yol: bitişik altıgenler, tekrarsız, ilki büyü menzilinde, hepsi harita içinde. */
function wallPathHexes(state: BattleState, actor: Combatant, spell: Spell, path: Offset[], max: number): Offset[] | CommandResult {
  if (path.length > max) return fail(`${spell.name}: duvar en çok ${max} altıgen (${max * 5} ft).`);
  const size = sizeOf(state);
  for (let i = 0; i < path.length; i++) {
    const h = path[i] as Offset;
    if (size && !isInside(h, size)) return fail('Duvar harita dışına taşamaz.');
    if (path.slice(0, i).some((x) => sameHex(x, h))) return fail('Duvar yolu aynı altıgenden iki kez geçemez.');
    if (i > 0 && distance(path[i - 1] as Offset, h) !== 1) return fail('Duvar yolunun altıgenleri birbirine bitişik olmalı.');
  }
  if (!actor.pos || distance(actor.pos, path[0] as Offset) * 5 > spell.rangeFt) return fail(`${spell.name}: duvarın başı menzil dışında (${spell.rangeFt} ft).`);
  return path;
}

/** Yeni alanın kimliği: büyü + büyücü + sıra (konsantrasyonsuz büyüler birden çok kez yapılabilir). */
export function newZoneId(state: BattleState, spellId: string, casterId: string): string {
  const used = new Set((state.map?.zones ?? []).map((z) => z.id));
  let n = 1;
  while (used.has(`${spellId}:${casterId}:${n}`)) n++;
  return `${spellId}:${casterId}:${n}`;
}

/**
 * Alan büyüsü (`mechanics.zone`): slot, konsantrasyon, alan oluşur ve içindekiler `cast` tetiğine uğrar. `repeat`
 * (`spell_followup`, Moonbeam): slotsuz, büyücünün alanı yeni yere taşınır; taşınan alan içindekileri yine tetikler.
 */
export function executeZoneCast(state: BattleState, actor: Combatant, cmd: CastCommand, spell0: Spell, rng: Rng, repeat = false): CommandResult {
  const spec = spell0.mechanics.zone as ZoneSpec;
  const named = cmd.targetId ? state.combatants[cmd.targetId] : undefined;
  if (cmd.targetId && !named) return fail('Hedef bulunamadı.');
  const aim = cmd.targetHex ?? named?.pos ?? null;
  const existing = repeat ? (state.map?.zones ?? []).find((z) => z.spellId === spell0.id && z.casterId === actor.id) : undefined;
  if (repeat && !existing) return fail(`${spell0.name}: taşınacak alan yok.`);
  // Kuyruk A8 (Moonbeam, `repeat.moveFt`): taşıma mesafesi sınırlı (merkezden en çok bu kadar ft).
  const moveFt = spell0.mechanics.repeat?.moveFt;
  const from = existing ? existing.center ?? existing.hexes[Math.floor(existing.hexes.length / 2)] : undefined;
  if (existing && moveFt && aim && from && distance(from, aim) * 5 > moveFt) return fail(`${spell0.name} en çok ${moveFt} ft taşınır.`);
  const slot = repeat ? { ok: true as const, slotLevel: actor.concentration?.slotLevel ?? spell0.level, events: [] as BattleEvent[] }
    : spendSlot(actor, spell0.level, cmd.slotLevel, spell0.name, cmd.free);
  if (!slot.ok) return slot;
  // Görev K9b: yukarı slotta alan büyür (Fog Cloud +20 ft yarıçap).
  const spell = atSlot(spell0, slot.slotLevel);
  // Kuyruk 18 H2: büyücüye bağlı yürüyen alan (Antilife Shell).
  if (spec.anchorSelf && !repeat) {
    const evs: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, slot.slotLevel),
      { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel, note: `${spec.anchorSelf * 5} ft aura` }];
    evs.push(anchoredZoneEvent(applyEvents(state, evs), actor, spell, actor.id, spec.anchorSelf, slot.slotLevel ?? spell.level));
    return finish(state, evs);
  }
  const hexes = castHexes(state, actor, spell, aim, cmd.wallShape, cmd);
  if (!Array.isArray(hexes)) return hexes;
  // Kuyruk 19: Guardian of Faith boş bir altıgende belirir.
  if (spec.occupy && !existing && aim && globalRule(state, 'spellsK19') && Object.values(state.combatants).some((c) => c.hp > 0 && c.pos && bodyAt(state, c, c.pos).some((b) => sameHex(b, aim)))) {
    return fail(`${spell.name} boş bir altıgende belirmeli.`);
  }
  const events: BattleEvent[] = [...slot.events, ...(repeat ? [] : concentrationEvent(state, actor, spell, slot.slotLevel))];
  events.push({ type: 'spell_cast', actorId: actor.id, targetId: null, label: repeat ? `${spell.name} (taşındı)` : spell.name, slotLevel: repeat ? null : slot.slotLevel,
    note: `${hexes.length} altıgen` });
  let zone: SpellZone;
  if (existing) {
    zone = { ...existing, hexes, ...(moveFt && aim ? { center: aim } : {}) };
    events.push({ type: 'zone_moved', zoneId: existing.id, hexes, ...(moveFt && aim ? { center: aim } : {}) });
  } else {
    const after = applyEvents(state, events);
    zone = {
      id: newZoneId(after, spell.id, actor.id), spellId: spell.id, name: spell.name, casterId: actor.id, side: actor.side,
      dc: actor.spellSaveDc ?? 10, slotLevel: slot.slotLevel ?? spell.level, hexes,
      // Kuyruk A7 (sürüm 36): sürüm blokları alanın kuralını değiştirdiyse kural alanda saklanır (replay ve yükleme aynı).
      ...(ruleVersion(state) >= 36 && spec !== spellById(spell.id)?.mechanics.zone ? { spec } : {}),
      // Kuyruk 19: kaplanan merkez (Guardian of Faith) ve taşınabilir merkez (Faithful Hound).
      ...((spec.occupy || spec.casterTurn) && aim && globalRule(state, 'spellsK19') ? { center: aim } : {}),
      // Kuyruk A8 (Moonbeam, `repeat.moveFt`): taşıma mesafesi merkezden ölçülür.
      ...(moveFt && aim && !(spec.occupy || spec.casterTurn) ? { center: aim } : {}),
      // Kuyruk 19: Wall of Fire: hasar veren yüz (varsayılan büyücüden uzak yan).
      ...(spec.sideDamage && globalRule(state, 'spellsK19') ? { endHexes: fireSideHexes(state, actor, hexes, cmd.choice === 'near' ? 'near' : 'far') } : {}),
      // Görev K13B: yüzey olan alan (Stinking Cloud → zehir bulutu): kural ve tepkimeler yüzey yolundan.
      ...(spec.surface ? { surface: spec.surface } : {}),
      // Kuyruk S2 (sürüm 41, Spike Growth `camouflaged`): büyücünün karşı tarafından gizli (fark eden `seenBy`).
      ...(spec.camouflaged && ruleVersion(state) >= 41 ? { hiddenFrom: actor.side === 'party' ? 'enemies' as const : 'party' as const, seenBy: [] } : {}),
      ...(spell.concentration ? { concentration: spell.name } : {}),
      ...(spec.rounds !== undefined ? { until: state.round + spec.rounds - 1 } : {}),
    };
    events.push({ type: 'zone_created', zone });
    // Kuyruk 19: duvarın açıldığı altıgendeki yaratık yana itilir (Wall of Force/Stone); kapatılan DEX save.
    events.push(...wallOpenEvents(applyEvents(state, events), actor, zone, cmd.choice === 'near' || cmd.choice === 'far' ? cmd.choice : undefined, rng));
    // Kuyruk A7 (Darkness, `dispelLight`): örtüştüğü, en çok bu seviyedeki büyülerin ışığı kalkar (yaratıktaki ışık etkisi,
    // ışık alanı, nesne ışığı).
    if (spec.dispelLight !== undefined) events.push(...dispelLightEvents(state, hexes, spec.dispelLight));
    // Kuyruk A8 (Wind Wall, `dispersesGas`): duvarın değdiği gaz/buhar bulutları dağılır ("keeps fog, smoke, and other gases at bay").
    if (spec.dispersesGas) events.push(...disperseEvents(applyEvents(state, events), hexes));
    // Görev B4: Daylight örtüştüğü Darkness alanlarını kaldırır (büyücünün konsantrasyonu sürer, alan yok olur).
    for (const other of state.map?.zones ?? []) {
      if (spec.dispels?.includes(other.spellId) && zoneHexes(state, other).some((h) => hexes.some((x) => sameHex(x, h)))) {
        events.push({ type: 'zone_ended', zoneId: other.id, name: other.name, reason: 'dispelled' });
      }
    }
  }
  if (spec.on?.includes('cast')) {
    const current = applyEvents(state, events);
    const inside = Object.values(current.combatants).filter((c) => c.pos && bodyAt(current, c, c.pos).some((b) => hexes.some((h) => sameHex(h, b)))
      // Kuyruk S2 (sürüm 41): alanın tepesinin üstündeki uçan etkilenmez.
      && altitudeInZone(current, zone, zoneSpecOf(zone), c));
    events.push(...chain(current, inside.map((c) => (s: BattleState) => { const live = liveZone(s, zone.id); return live ? triggerEvents(s, live, c.id, rng) : []; })));
  }
  return finish(state, events);
}

/** Yürüyen alanın oluşumu (çağırma: Flaming Sphere, Conjure Animals): bağlı yaratık ve yarıçap. */
export function anchoredZoneEvent(state: BattleState, actor: Combatant, spell: Spell, anchorId: string, radius: number, slotLevel: number, damageType?: string): BattleEvent {
  const spec = spell.mechanics.zone as ZoneSpec;
  return { type: 'zone_created', zone: {
    id: newZoneId(state, spell.id, actor.id), spellId: spell.id, name: spell.name, casterId: actor.id, side: actor.side,
    dc: actor.spellSaveDc ?? 10, slotLevel, hexes: [], anchorId, radius, ...(damageType ? { damageType } : {}),
    // Kuyruk A8: sürüm blokları kuralı değiştirdiyse alanda saklanır (Flaming Sphere ışığı).
    ...(ruleVersion(state) >= 36 && spec !== spellById(spell.id)?.mechanics.zone ? { spec } : {}),
    ...(spell.concentration ? { concentration: spell.name } : {}),
    ...(spec.rounds !== undefined ? { until: state.round + spec.rounds - 1 } : {}),
  } };
}

/**
 * Kuyruk 19: büyücünün turunun başında ondan uzaklaşan alanlar (Cloudkill: 10 ft). Yön büyücüden alanın merkezine en
 * yakın eksen; harita dışına taşan altıgenler düşer, hiç kalmazsa alan biter. Anahtar `spellsK19`.
 */
export function zoneDriftEvents(state: BattleState, casterId: string): BattleEvent[] {
  const caster = state.combatants[casterId];
  if (!caster?.pos || !state.map?.zones?.length || !globalRule(state, 'spellsK19')) return [];
  const size = sizeOf(state);
  const out: BattleEvent[] = [];
  for (const z of state.map.zones) {
    const spec = zoneSpecOf(z);
    if (z.casterId !== casterId || z.anchorId || !spec?.drift || !z.hexes.length) continue;
    const ax = z.hexes.map(offsetToAxial);
    const c = { q: ax.reduce((n, a) => n + a.q, 0) / ax.length, r: ax.reduce((n, a) => n + a.r, 0) / ax.length };
    const from = offsetToAxial(caster.pos);
    const v = { q: c.q - from.q, r: c.r - from.r };
    // En yakın eksen: vektörle iç çarpımı en büyük yön (küp koordinatında).
    const dot = (d: { q: number; r: number }) => d.q * v.q + d.r * v.r + (-d.q - d.r) * (-v.q - v.r);
    const dir = [...AXIAL_DIRECTIONS].sort((a, b) => dot(b) - dot(a))[0] as { q: number; r: number };
    const steps = Math.round(spec.drift / 5);
    const moved = ax.map((a) => axialToOffset({ q: a.q + dir.q * steps, r: a.r + dir.r * steps }))
      .filter((h) => h.col >= 0 && h.row >= 0 && h.col < size.cols && h.row < size.rows);
    out.push(moved.length ? { type: 'zone_moved', zoneId: z.id, hexes: moved } : { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'expired' });
  }
  return out;
}

/** Kuyruk A7: alanla örtüşen, en çok `maxLevel` seviyedeki büyülerin ışıkları (etki, alan, nesne) kalkar. */
function dispelLightEvents(state: BattleState, hexes: Offset[], maxLevel: number): BattleEvent[] {
  const inArea = (h: Offset) => hexes.some((x) => sameHex(x, h));
  const low = (spellId: string) => { const sp = spellById(spellId); return !!sp && sp.level <= maxLevel; };
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    if (!c.pos || !inArea(c.pos)) continue;
    for (const e of c.effects ?? []) if (e.light !== undefined && e.id.startsWith('spells:') && low(e.id.slice(7).split(':')[0] as string)) out.push({ type: 'effect_ended', targetId: c.id, effectId: e.id, name: e.name, reason: 'dispelled' });
  }
  for (const z of state.map?.zones ?? []) {
    if ((z.spec ?? zoneSpecOf(z))?.light !== undefined && low(z.spellId) && zoneHexes(state, z).some(inArea)) out.push({ type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'dispelled' });
  }
  for (const o of state.map?.objects ?? []) {
    const at = o.carriedBy ? state.combatants[o.carriedBy]?.pos : o.at;
    if (o.light !== undefined && o.lightSpell && low(o.lightSpell) && at && inArea(at)) out.push({ type: 'object_changed', objectId: o.id, label: `${o.lightSpell}: ışık kalktı`, light: null });
  }
  return out;
}
