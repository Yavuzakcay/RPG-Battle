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
import { spells, type Spell, type ZoneSpec } from '../data';
import surfaceData from '../../data/yuzeyler.json';
import { resolveSave } from '../rules/attack';
import { adjustDamage } from '../rules/damage';
import { parseDice, rollDice, rollTag, type Rng } from '../rules/dice';
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
import { applyEvents } from './reduce';
import { concentrationEvent, spendSlot } from './slots';
import type { BattleEvent, BattleState, Combatant, Command, SpellZone } from './types';

type CastCommand = Extract<Command, { type: 'cast_spell' }>;

const spellById = (id: string): Spell | undefined => spells.find((s) => s.id === id);
/** Alanın kuralı: büyü alanında büyü verisi, yüzeyde (Görev Y1) `data/yuzeyler.json`. */
export const zoneSpecOf = (z: SpellZone): ZoneSpec | undefined =>
  z.surface ? (surfaceData.kinds as Record<string, { zone: ZoneSpec }>)[z.surface]?.zone : spellById(z.spellId)?.mechanics.zone;
const sizeOf = (state: BattleState) => ({ cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 });


/** Alanın şu anki altıgenleri (yürüyen alanda bağlı yaratığın çevresi). */
export function zoneHexes(state: BattleState, z: SpellZone, anchorAt?: Offset | null): Offset[] {
  if (!z.anchorId) return z.hexes;
  const at = anchorAt !== undefined ? anchorAt : state.combatants[z.anchorId]?.pos ?? null;
  return at ? withinRange(at, z.radius ?? 1, sizeOf(state)) : [];
}

const inZone = (state: BattleState, z: SpellZone, at: Offset | null, anchorAt?: Offset | null): boolean =>
  !!at && zoneHexes(state, z, anchorAt).some((h) => sameHex(h, at));

/** Bir altıgendeki alanlar. */
export function zonesAt(state: BattleState, at: Offset | null): SpellZone[] {
  return (state.map?.zones ?? []).filter((z) => inZone(state, z, at));
}

/** Alan bu yaratığı etkiler mi: ayakta, dokunulabilir, uçan değil (zemin), düşman koşulu, büyücü hariç koşulu. */
function affects(state: BattleState, z: SpellZone, spec: ZoneSpec, c: Combatant): boolean {
  if (!isTargetable(c) || c.hp <= 0 || isIntangible(c) || c.id === z.anchorId) return false;
  if (spec.ground && isAirborne(c)) return false;
  if (spec.targets === 'enemies' && c.side === z.side) return false;
  if (spec.notCaster && c.id === z.casterId) return false;
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
  if (!spec.damage) return null;
  const spell = spellById(z.spellId);
  const d = parseDice(spec.damage);
  const extra = spell ? upcastDiceCount(spell.mechanics, z.slotLevel - spell.level) : 0;
  // Görev Y1: sabit hasar (yanan yağ 5).
  if (d.count + extra === 0) return String(d.bonus);
  return `${d.count + extra}d${d.sides}${d.bonus ? `+${d.bonus}` : ''}`;
}

/**
 * Bir yaratık için alanın tetiği: save (ya da doğrudan hasar), hasar, durumlar, konsantrasyon kaybı. Turda bir kez
 * kuralı olan alanda `zone_triggered` önce yazılır.
 */
export function triggerEvents(state: BattleState, z: SpellZone, victimId: string, rng: Rng): BattleEvent[] {
  const spec = zoneSpecOf(z);
  const victim = state.combatants[victimId];
  if (!spec || !victim || !affects(state, z, spec, victim)) return [];
  const turn = turnKey(state);
  if (spec.once && z.hits?.[victim.id] === turn) return [];
  const events: BattleEvent[] = spec.once ? [{ type: 'zone_triggered', zoneId: z.id, targetId: victim.id, turn }] : [];
  const expr = zoneDamage(z, spec);
  if (!spec.save) {
    if (!expr) return events;
    const d = rollDice(expr, rollTag(rng, { kind: 'damage', by: z.casterId }));
    const adj = adjustDamage(d.total, spec.damageType, damageProfile(victim));
    const fx = damageEffects(victim, adj.amount, spec.damageType ?? '', false, rng);
    events.push({ type: 'effect_tick', targetId: victim.id, effectId: z.spellId, name: z.name, damageRolls: d.rolls, appliedDamage: adj.amount,
      damageType: spec.damageType ?? '', targetHpAfter: fx.hpAfter, effects: fx.effects });
    return events;
  }
  const ability = spec.save;
  const autoFail = (ability === 'str' || ability === 'dex') && autoFailsStrDexSave(victim.conditions);
  const save = resolveSave({ extra: saveDice(victim, ability), modifier: victim.saves[ability], dc: z.dc, mode: saveMode('normal', victim, ability), autoFail },
    rollTag(rng, { by: victim.id }));
  const d = expr ? rollDice(expr, rollTag(rng, { kind: 'damage', by: z.casterId })) : { rolls: [] as number[], total: 0 };
  const amount = expr ? saveDamage(victim, ability, save.success, d.total, !!spec.half) : 0;
  const adj = amount > 0 ? adjustDamage(amount, spec.damageType, damageProfile(victim)) : { amount: 0, note: null };
  const fx = damageEffects(victim, adj.amount, spec.damageType ?? '', false, rng);
  const failed = !save.success;
  const plain = failed && !spec.hold ? (spec.conditions ?? []).filter((x) => !victim.conditions.includes(x)) : [];
  // Sleet Storm: başarısız save'de konsantrasyon biter (hasar save'i gibi `effects` içinde).
  const lose = failed && spec.dropConcentration && victim.concentration
    ? [{ kind: 'concentration' as const, spell: victim.concentration.spell, dc: z.dc, natural: 0, total: 0, success: false }] : [];
  events.push({
    type: 'save_resolved', actorId: z.casterId, targetId: victim.id, label: z.name, ability, dc: z.dc, mode: 'normal', reasons: [],
    d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
    damageRolls: d.rolls, rawDamage: d.total, appliedDamage: adj.amount, damageType: spec.damageType ?? '', damageNote: adj.note,
    targetHpAfter: fx.hpAfter, effects: [...fx.effects, ...lose], conditionsAdded: plain, ...(save.extra ? { bonusDice: save.extra } : {}),
  });
  // Büyü sürdükçe (Entangle, Web: tur sonu kurtulma save'i) ya da bu turun sonuna dek (Stinking Cloud) süren durumlar.
  if (failed && spec.hold && spec.conditions?.length && fx.hpAfter > 0) {
    const spell = spellById(z.spellId);
    events.push({ type: 'effect_added', targetId: victim.id, effect: {
      id: `${z.spellId}:${z.id}`, name: z.name, sourceId: z.casterId, grants: spec.conditions,
      ...(spec.hold === 'turn' ? { until: state.round + 1, untilOwnTurnEnd: true } : {}),
      ...(spec.hold === 'spell' && spell?.concentration ? { concentration: spell.name } : {}),
      ...(spec.hold === 'spell' && z.until !== undefined ? { until: z.until } : {}),
      // CILA: kurtulma eylemle STR (Athletics) kontrolü (`escape` komutu); tur sonu save'i yok.
      ...(spec.escape ? { escapeCheck: { dc: z.dc } } : {}),
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
  for (const z of strongestPerSpell(zones.filter((x) => x.anchorId !== moverId && inZone(state, x, to)))) {
    const spec = zoneSpecOf(z);
    if (!spec?.on) continue;
    const entered = !inZone(state, z, from);
    if (spec.on.includes('move') || (entered && spec.on.includes('enter'))) {
      makers.push((s) => { const live = liveZone(s, z.id); return live ? triggerEvents(s, live, moverId, rng) : []; });
    }
  }
  for (const z of zones.filter((x) => x.anchorId === moverId && zoneSpecOf(x)?.on?.includes('anchorMove'))) {
    for (const c of Object.values(state.combatants)) {
      if (!c.pos || inZone(state, z, c.pos, from) || !inZone(state, z, c.pos)) continue;
      makers.push((s) => { const live = liveZone(s, z.id); return live ? triggerEvents(s, live, c.id, rng) : []; });
    }
  }
  return chain(state, makers);
}

/** Tur başı ya da sonu: yaratığın bulunduğu alanların `start`/`end` tetiği. */
export function zoneTurnEvents(state: BattleState, id: string, phase: 'start' | 'end', rng: Rng): BattleEvent[] {
  const c = state.combatants[id];
  if (!c?.pos || !state.map?.zones?.length) return [];
  const here = strongestPerSpell(zonesAt(state, c.pos).filter((z) => zoneSpecOf(z)?.on?.includes(phase)));
  return chain(state, here.map((z) => (s: BattleState) => { const live = liveZone(s, z.id); return live ? triggerEvents(s, live, id, rng) : []; }));
}

/**
 * Alanların yürüme maliyeti: zorlu arazi (2; Plant Growth 4; uçan yaratık zorlu araziden etkilenmez) ve rüzgâr duvarı
 * (Small ve küçük uçan yaratık, Gaseous Form'daki yaratık geçemez: null). Altıgende alan yoksa 1.
 */
export function zoneMoveCost(state: BattleState, mover: Combatant): (h: Offset) => number | null {
  const zones = state.map?.zones ?? [];
  if (!zones.length) return () => 1;
  const flying = isAirborne(mover);
  const small = mover.size === 'T' || mover.size === 'S';
  const gaseous = !!mover.effects?.some((e) => e.noAttack);
  return (h) => {
    let cost = 1;
    for (const z of zones) {
      const spec = zoneSpecOf(z);
      if (!spec || !inZone(state, z, h)) continue;
      if (spec.windWall && ((flying && small) || gaseous)) return null;
      if (spec.difficult && !flying) cost = Math.max(cost, spec.difficult);
    }
    return cost;
  };
}

/** Altıgen yoğun örtülü mü (Fog Cloud, Sleet Storm, Stinking Cloud). */
export const heavilyObscured = (state: BattleState, at: Offset | null): boolean =>
  zonesAt(state, at).some((z) => zoneSpecOf(z)?.obscured === 'heavy');

/** CILA: hasar profili konumla: Silence alanındaki yaratık Thunder hasarına bağışık (SRD 5.2.1). */
export function profileIn(state: BattleState, c: Combatant): ReturnType<typeof damageProfile> {
  const p = damageProfile(c);
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
export function zoneAttackSources(state: BattleState, attacker: Combatant, target: Combatant, ranged: boolean, spell: boolean): { sources: ModeSource[]; autoMiss?: string } {
  if (!state.map?.zones?.length || !attacker.pos || !target.pos) return { sources: [] };
  // CILA: menzilli silah saldırısı rüzgâr duvarından geçerken otomatik ıskalar (SRD 5.2.1 Wind Wall).
  const wall = ranged && !spell ? windWallBetween(state, attacker.pos, target.pos) : undefined;
  const out: ModeSource[] = [];
  const targetHidden = heavilyObscured(state, target.pos);
  const attackerHidden = heavilyObscured(state, attacker.pos);
  if (targetHidden) out.push({ effect: 'disadvantage', reason: 'Görülmeyen hedef (yoğun örtü)' });
  if (attackerHidden) out.push({ effect: 'advantage', reason: 'Görülmeyen saldıran (yoğun örtü)' });
  // CILA: aradaki yoğun örtü (Fog Cloud, Stinking Cloud…) görüşü keser: iki taraf da birbirini görmez (avantaj ve
  // dezavantaj birbirini götürür; SRD 5.2.1 Unseen Attackers and Targets). Çizginin iki ucu yukarıda sayıldı.
  // Uçlardan biri örtüdeyse B2'nin kuralı geçerli (yukarıda); yalnızca ikisi de dışındayken aradaki örtü sayılır.
  const between = !targetHidden && !attackerHidden && line(attacker.pos, target.pos).slice(1, -1).some((h) => heavilyObscured(state, h));
  if (between) out.push({ effect: 'disadvantage', reason: 'Görülmeyen hedef (arada yoğun örtü)' }, { effect: 'advantage', reason: 'Görülmeyen saldıran (arada yoğun örtü)' });
  return { sources: out, ...(wall ? { autoMiss: wall.name } : {}) };
}

/** Alan büyüsü yapılırken ya da taşınırken altıgenler (büyünün alanı; duvar şekli `rules/area.ts`). */
function castHexes(state: BattleState, actor: Combatant, spell: Spell, aim: Offset | null, wallShape?: 'arc'): Offset[] | CommandResult {
  if (!state.map || !actor.pos) return fail('Alan büyüsü yalnızca haritalı savaşta.');
  if (!spell.area) return fail(`${spell.name}: alan tanımı yok.`);
  // CILA: duvar yay biçiminde de kurulabilir (Wind Wall).
  const area = wallShape && spell.area.shape === 'wall' ? { ...spell.area, bend: wallShape } : spell.area;
  const pick = pickArea(state, actor, area, spell.rangeFt, aim, 'büyü');
  if ('ok' in pick) return pick;
  return pick.hexes;
}

/** Yeni alanın kimliği: büyü + büyücü + sıra (konsantrasyonsuz büyüler birden çok kez yapılabilir). */
function newZoneId(state: BattleState, spellId: string, casterId: string): string {
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
  const slot = repeat ? { ok: true as const, slotLevel: actor.concentration?.slotLevel ?? spell0.level, events: [] as BattleEvent[] }
    : spendSlot(actor, spell0.level, cmd.slotLevel, spell0.name);
  if (!slot.ok) return slot;
  // Görev K9b: yukarı slotta alan büyür (Fog Cloud +20 ft yarıçap).
  const spell = atSlot(spell0, slot.slotLevel);
  const hexes = castHexes(state, actor, spell, aim, cmd.wallShape);
  if (!Array.isArray(hexes)) return hexes;
  const events: BattleEvent[] = [...slot.events, ...(repeat ? [] : concentrationEvent(state, actor, spell, slot.slotLevel))];
  events.push({ type: 'spell_cast', actorId: actor.id, targetId: null, label: repeat ? `${spell.name} (taşındı)` : spell.name, slotLevel: repeat ? null : slot.slotLevel,
    note: `${hexes.length} altıgen` });
  let zone: SpellZone;
  if (existing) {
    zone = { ...existing, hexes };
    events.push({ type: 'zone_moved', zoneId: existing.id, hexes });
  } else {
    const after = applyEvents(state, events);
    zone = {
      id: newZoneId(after, spell.id, actor.id), spellId: spell.id, name: spell.name, casterId: actor.id, side: actor.side,
      dc: actor.spellSaveDc ?? 10, slotLevel: slot.slotLevel ?? spell.level, hexes,
      // Görev K13B: yüzey olan alan (Stinking Cloud → zehir bulutu): kural ve tepkimeler yüzey yolundan.
      ...(spec.surface ? { surface: spec.surface } : {}),
      ...(spell.concentration ? { concentration: spell.name } : {}),
      ...(spec.rounds !== undefined ? { until: state.round + spec.rounds - 1 } : {}),
    };
    events.push({ type: 'zone_created', zone });
    // Görev B4: Daylight örtüştüğü Darkness alanlarını kaldırır (büyücünün konsantrasyonu sürer, alan yok olur).
    for (const other of state.map?.zones ?? []) {
      if (spec.dispels?.includes(other.spellId) && zoneHexes(state, other).some((h) => hexes.some((x) => sameHex(x, h)))) {
        events.push({ type: 'zone_ended', zoneId: other.id, name: other.name, reason: 'dispelled' });
      }
    }
  }
  if (spec.on?.includes('cast')) {
    const current = applyEvents(state, events);
    const inside = Object.values(current.combatants).filter((c) => c.pos && hexes.some((h) => sameHex(h, c.pos as Offset)));
    events.push(...chain(current, inside.map((c) => (s: BattleState) => { const live = liveZone(s, zone.id); return live ? triggerEvents(s, live, c.id, rng) : []; })));
  }
  return finish(state, events);
}

/** Yürüyen alanın oluşumu (çağırma: Flaming Sphere, Conjure Animals): bağlı yaratık ve yarıçap. */
export function anchoredZoneEvent(state: BattleState, actor: Combatant, spell: Spell, anchorId: string, radius: number, slotLevel: number): BattleEvent {
  const spec = spell.mechanics.zone as ZoneSpec;
  return { type: 'zone_created', zone: {
    id: newZoneId(state, spell.id, actor.id), spellId: spell.id, name: spell.name, casterId: actor.id, side: actor.side,
    dc: actor.spellSaveDc ?? 10, slotLevel, hexes: [], anchorId, radius,
    ...(spell.concentration ? { concentration: spell.name } : {}),
    ...(spec.rounds !== undefined ? { until: state.round + spec.rounds - 1 } : {}),
  } };
}
