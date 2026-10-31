/**
 * Görev Y1: yüzey sistemi çekirdeği (docs/harita/SEFER-TASARIMI.md §1 ve "Kararlar"). Yüzeyler büyü alanlarıyla aynı
 * katmanda (`map.zones`, `surface` alanı; kuralları `data/yuzeyler.json`): yağ, su, buz, alev, yanan ağ, buhar,
 * zehir bulutu. Tetikleri (girme, tur başı/sonu, save, hasar, zorlu zemin, örtü) `zones.ts` yolundan çalışır.
 *
 * Tepkimeler her komutun sonunda (`execute`), o komutun ürettiği hasar olaylarından: alan büyüsü (`spell_cast.area`),
 * alanlı saldırı/nefes (`area_used`), isabet eden saldırının hedef altıgeni (`attack_resolved`). Tepkime derinliği 1:
 * tepkimenin ürettiği hasar ya da yüzey aynı komutta yeniden tepkimeye girmez; sıra olay sırası, aynı olayda yukarıdan
 * aşağı (söndürme → tutuşma → ağ → erime → buhar → patlama; soğuk: donma; yıldırım: suda yayılım).
 * - ateş: yağ → alev (bütün yağ birikintisi; SRD Oil), ağ → yanan ağ (yalnızca değen altıgenler; SRD Web), buz → su,
 *   su (yüzey ya da su zemini) → buhar (ev kuralı), zehir bulutu (Stinking Cloud ya da yüzey) → patlama ve bulut kalkar
 *   (ev kuralı).
 * - soğuk: su yüzeyi ve sığ su zemini → buz (ev kuralı; derin su donmaz).
 * - yıldırım: değdiği su altıgeninden bağlı su altıgenlerine (en çok `chainMax`) yayılır; oradaki, zaten vurulmamış,
 *   yerdeki yaratıklar aynı hasarla DEX save (başarıda yarım; ev kuralı). Hasar bir kez atılır.
 * - söndürme: `douses` alanı (Sleet Storm) oluşunca altındaki alev yüzeyleri söner (SRD).
 * Görev K13B: ev kuralı tepkimeleri ayrı bayrak (`houseRule`: suYildirim, buhar, donma, erime, zehirPatlama; varsayılan
 * açık, Game Master kurulumda kapatabilir); tutuşma, yanan ağ ve söndürme SRD'dir, bayraksız.
 * Zarlar rng'den (`rollTag`; elle zar modunda istenir), sonuç olaylarda: replay aynı durumu verir. Bayrak:
 * `state.yuzeyEtkilesimi === false` tepkimeleri kapatır (yüzeylerin kendi tetikleri çalışır). Saf.
 */
import data from '../../data/yuzeyler.json';
import { resolveSave } from '../rules/attack';
import { adjustDamage } from '../rules/damage';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { hexKey, neighbors, type Offset } from '../rules/hex';
import { autoFailsStrDexSave } from '../rules/conditions';
import { damageProfile, isTargetable } from './common';
import { damageEffects } from './damage-effects';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
import { saveDamage } from './classTraits';
import { isAirborne } from './flight';
import { applyEvents } from './reduce';
import { zoneHexes, zoneSpecOf } from './zones';
import { houseRule } from './houseRules';
import type { BattleEvent, BattleState, Side, SpellZone, SurfaceKind, SurfaceReaction } from './types';

interface SurfaceDef { tr: string; en: string; rounds: number | null; dc: number; srd: string; aiRisk: number; zone: { icon?: string; color?: string } }
export const SURFACES = data.kinds as unknown as Record<SurfaceKind, SurfaceDef>;
export const SURFACE_KINDS = Object.keys(SURFACES) as SurfaceKind[];
const WATER_TILES = new Set(data.waterTiles);
const FREEZE_TILES = new Set(data.freezeTiles);
/** Görev K13B: suda duran hedefe buhar bırakacak ateşin yapay zekâ puan çarpanı. */
export const STEAM_PENALTY: number = data.aiSteamPenalty;

/** Tepkimeler açık mı (bayrak yoksa açık). */
export const surfacesReact = (state: BattleState): boolean => state.yuzeyEtkilesimi !== false && !!state.map;

const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const tileAt = (s: BattleState, h: Offset) => s.map?.tiles[h.row]?.[h.col] ?? '#';
const keys = (hs: Offset[]) => new Set(hs.map(hexKey));
const surfacesOf = (s: BattleState, kind: SurfaceKind) => (s.map?.zones ?? []).filter((z) => z.surface === kind);

/** Altıgen su mu: su zemini (sığ, derin) ya da su yüzeyi. */
export function isWater(s: BattleState, h: Offset): boolean {
  if (WATER_TILES.has(tileAt(s, h))) return true;
  return surfacesOf(s, 'water').some((z) => z.hexes.some((x) => hexKey(x) === hexKey(h)));
}

/** Bir altıgendeki yüzeyler (bilgi baloncuğu, yapay zekâ). */
export function surfacesAt(s: BattleState, h: Offset): SpellZone[] {
  return (s.map?.zones ?? []).filter((z) => z.surface && z.hexes.some((x) => hexKey(x) === hexKey(h)));
}

/** Yapay zekâ için altıgenin yüzey tehlikesi (`aiRisk`; uçan yaratık zemin yüzeylerinden etkilenmez). */
export function surfaceRisk(s: BattleState, h: Offset, flying: boolean): number {
  let r = 0;
  for (const z of surfacesAt(s, h)) {
    const spec = zoneSpecOf(z);
    if (flying && spec?.ground) continue;
    r = Math.max(r, SURFACES[z.surface as SurfaceKind]?.aiRisk ?? 0);
  }
  // Stinking Cloud gibi zehir bulutu büyüleri de kaçınılır.
  if ((s.map?.zones ?? []).some((z) => !z.surface && z.spellId === 'stinking-cloud' && zoneHexes(s, z).some((x) => hexKey(x) === hexKey(h)))) r = Math.max(r, 20);
  return r;
}

/** Yeni yüzeyin oluşum olayı (kimlik: tür + sıra; süre veriden). */
export function surfaceEvent(s: BattleState, kind: SurfaceKind, hexes: Offset[], sourceId: string, side: Side, dc?: number): BattleEvent {
  const used = new Set((s.map?.zones ?? []).map((z) => z.id));
  let n = 1;
  while (used.has(`surface:${kind}:${n}`)) n++;
  const def = SURFACES[kind];
  return { type: 'zone_created', zone: {
    id: `surface:${kind}:${n}`, spellId: `surface:${kind}`, name: def.tr, casterId: sourceId, side, dc: dc ?? def.dc, slotLevel: 0,
    hexes, surface: kind, ...(def.rounds !== null ? { until: s.round + def.rounds - 1 } : {}),
  } };
}

/** Alanın bazı altıgenleri kalkar (kalan yoksa alan biter). */
function shrink(z: SpellZone, remove: Set<string>): BattleEvent {
  const left = z.hexes.filter((h) => !remove.has(hexKey(h)));
  return left.length ? { type: 'zone_moved', zoneId: z.id, hexes: left } : { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'reacted' };
}

/** Bir komutun hasar olayından çıkan element etkisi. */
interface Hit { element: 'fire' | 'cold' | 'lightning'; hexes: Offset[]; actorId: string; dc: number; damage: number | null; dice?: string; hitIds: Set<string>; label: string }

const ELEMENTS = new Set(['fire', 'cold', 'lightning']);

function hitsOf(next: BattleState, events: BattleEvent[]): Hit[] {
  const out: Hit[] = [];
  const firstRaw = (from: number, type: string) => {
    for (let i = from; i < events.length; i++) {
      const e = events[i] as BattleEvent;
      if (e.type === 'save_resolved' && e.damageType === type && e.damageRolls.length) return e.rawDamage;
      if (e.type === 'spell_cast' || e.type === 'area_used') break;
    }
    return null;
  };
  events.forEach((e, i) => {
    if (e.type === 'spell_cast' && e.area?.damageType && ELEMENTS.has(e.area.damageType)) {
      out.push({ element: e.area.damageType as Hit['element'], hexes: e.area.hexes, actorId: e.actorId, dc: e.area.dc ?? 10,
        damage: firstRaw(i + 1, e.area.damageType), ...(e.area.dice ? { dice: e.area.dice } : {}), hitIds: new Set(e.area.targetIds ?? []), label: e.label });
    } else if (e.type === 'area_used' && e.damageType && ELEMENTS.has(e.damageType)) {
      out.push({ element: e.damageType as Hit['element'], hexes: e.hexes, actorId: e.actorId, dc: e.dc ?? 10,
        damage: firstRaw(i + 1, e.damageType), ...(e.dice ? { dice: e.dice } : {}), hitIds: new Set(e.targetIds), label: e.label });
    } else if (e.type === 'attack_resolved' && e.hit && ELEMENTS.has(e.damageType)) {
      const pos = next.combatants[e.targetId]?.pos;
      const actor = next.combatants[e.actorId];
      if (pos) out.push({ element: e.damageType as Hit['element'], hexes: [pos], actorId: e.actorId, dc: actor?.spellSaveDc ?? 10,
        damage: e.rawDamage, hitIds: new Set([e.targetId]), label: e.label });
    }
  });
  return out;
}

/** Alandaki yerdeki yaratıkların save'i ve hasarı (patlama, suda yıldırım): hasar bir kez atılır. */
function burstEvents(s: BattleState, hexes: Offset[], skip: Set<string>, dc: number, raw: number | null, dice: string, damageType: string,
  actorId: string, label: string, rng: Rng): BattleEvent[] {
  const inside = keys(hexes);
  const victims = Object.values(s.combatants).filter((c) => c.pos && inside.has(hexKey(c.pos)) && !skip.has(c.id) && c.hp > 0
    && isTargetable(c) && !isAirborne(c));
  if (!victims.length) return [];
  const roll = raw !== null ? { rolls: [] as number[], total: raw } : rollDice(dice, rollTag(rng, { kind: 'damage', by: actorId }));
  const out: BattleEvent[] = [];
  let current = s;
  for (const v0 of victims) {
    const v = current.combatants[v0.id];
    if (!v || v.hp <= 0) continue;
    const autoFail = autoFailsStrDexSave(v.conditions);
    const save = resolveSave({ extra: saveDice(v, 'dex'), modifier: v.saves.dex, dc, mode: saveMode('normal', v, 'dex'), autoFail }, rollTag(rng, { by: v.id }));
    const amount = saveDamage(v, 'dex', save.success, roll.total, true);
    const adj = amount > 0 ? adjustDamage(amount, damageType, damageProfile(v)) : { amount: 0, note: null };
    const fx = damageEffects(v, adj.amount, damageType, false, rng);
    const ev: BattleEvent = { type: 'save_resolved', actorId, targetId: v.id, label, ability: 'dex', dc, mode: 'normal', reasons: [],
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: roll.rolls, rawDamage: roll.total, appliedDamage: adj.amount, damageType, damageNote: adj.note,
      targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: [], ...(save.extra ? { bonusDice: save.extra } : {}) };
    out.push(ev);
    current = applyEvents(current, [ev]);
  }
  return out;
}

/** Su altıgenlerinden bağlı su (en çok `chainMax`; başlangıçlar dahil, en yakından). */
export function waterChain(s: BattleState, from: Offset[]): Offset[] {
  const start = from.filter((h) => isWater(s, h));
  const seen = new Set(start.map(hexKey));
  const out = [...start];
  const queue = [...start];
  while (queue.length && out.length < data.chainMax) {
    const h = queue.shift() as Offset;
    for (const n of neighbors(h, sizeOf(s))) {
      if (out.length >= data.chainMax) break;
      if (seen.has(hexKey(n)) || !isWater(s, n)) continue;
      seen.add(hexKey(n)); out.push(n); queue.push(n);
    }
  }
  return out.slice(0, data.chainMax);
}

/** Bir element etkisinin tepkimeleri (state üzerinde, olay listesi). */
function reactTo(s0: BattleState, hit: Hit, rng: Rng): BattleEvent[] {
  const out: BattleEvent[] = [];
  let s = s0;
  const push = (evs: BattleEvent[]) => { out.push(...evs); s = applyEvents(s, evs); };
  const area = keys(hit.hexes);
  const touches = (z: SpellZone) => zoneHexes(s, z).some((h) => area.has(hexKey(h)));
  const side = s.combatants[hit.actorId]?.side ?? 'enemies';
  const note = (reaction: SurfaceReaction, hexes: Offset[]) => ({ type: 'surface_reacted' as const, reaction, hexes, sourceId: hit.actorId, label: hit.label });
  if (hit.element === 'fire') {
    for (const z of surfacesOf(s, 'oil').filter(touches)) {
      push([note('ignite', z.hexes), { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'reacted' }, surfaceEvent(s, 'fire', z.hexes, hit.actorId, side)]);
    }
    for (const z of (s.map?.zones ?? []).filter((x) => !x.surface && x.spellId === 'web' && touches(x))) {
      const burned = z.hexes.filter((h) => area.has(hexKey(h)));
      push([note('webBurn', burned), shrink(z, keys(burned)), surfaceEvent(s, 'burningWeb', burned, hit.actorId, side)]);
    }
    for (const z of (houseRule(s, 'erime') ? surfacesOf(s, 'ice') : []).filter(touches)) {
      const melted = z.hexes.filter((h) => area.has(hexKey(h)));
      push([note('melt', melted), shrink(z, keys(melted)), surfaceEvent(s, 'water', melted, hit.actorId, side)]);
    }
    const wet = houseRule(s, 'buhar') ? hit.hexes.filter((h) => isWater(s, h)) : [];
    if (wet.length) push([note('steam', wet), surfaceEvent(s, 'steam', wet, hit.actorId, side)]);
    const clouds = !houseRule(s, 'zehirPatlama') ? [] : (s.map?.zones ?? []).filter((z) => (z.surface === 'poison' || (!z.surface && z.spellId === 'stinking-cloud')) && touches(z));
    for (const z of clouds) {
      const live = s.map?.zones?.find((x) => x.id === z.id);
      if (!live) continue;
      const hexes = zoneHexes(s, live);
      push([note('explode', hexes), { type: 'zone_ended', zoneId: live.id, name: live.name, reason: 'reacted' }]);
      push(burstEvents(s, hexes, new Set(), live.dc, null, data.explosion.damage, data.explosion.damageType, hit.actorId, `${live.name}: patlama`, rng));
    }
  } else if (hit.element === 'cold' && houseRule(s, 'donma')) {
    for (const z of surfacesOf(s, 'water').filter(touches)) {
      const frozen = z.hexes.filter((h) => area.has(hexKey(h)));
      push([note('freeze', frozen), shrink(z, keys(frozen)), surfaceEvent(s, 'ice', frozen, hit.actorId, side)]);
    }
    const iced = keys(surfacesOf(s, 'ice').flatMap((z) => z.hexes));
    const tiles = hit.hexes.filter((h) => FREEZE_TILES.has(tileAt(s, h)) && !iced.has(hexKey(h)));
    if (tiles.length) push([note('freeze', tiles), surfaceEvent(s, 'ice', tiles, hit.actorId, side)]);
  } else if (hit.element === 'lightning' && houseRule(s, 'suYildirim')) {
    const chain = waterChain(s, hit.hexes);
    if (chain.length) {
      const dice = hit.dice ?? '1d8';
      const evs = burstEvents(s, chain, hit.hitIds, hit.dc, hit.damage, dice, 'lightning', hit.actorId, `${hit.label}: suda yıldırım`, rng);
      if (evs.length) push([note('chain', chain), ...evs]);
    }
  }
  return out;
}

/** Söndürme: yeni `douses` alanı (Sleet Storm) altındaki alev yüzeyleri. */
function douseEvents(s: BattleState, events: BattleEvent[]): BattleEvent[] {
  const out: BattleEvent[] = [];
  for (const e of events) {
    if (e.type !== 'zone_created' || e.zone.surface || !zoneSpecOf(e.zone)?.douses) continue;
    const area = keys(e.zone.hexes);
    for (const z of (s.map?.zones ?? []).filter((x) => (x.surface === 'fire' || x.surface === 'burningWeb') && x.hexes.some((h) => area.has(hexKey(h))))) {
      const out1 = z.hexes.filter((h) => area.has(hexKey(h)));
      out.push({ type: 'surface_reacted', reaction: 'douse', hexes: out1, sourceId: e.zone.casterId, label: e.zone.name }, shrink(z, keys(out1)));
    }
  }
  return out;
}

/** Komutun sonunda yüzey tepkimeleri (`execute`); bayrak kapalıysa ya da haritasız savaşta boş. */
export function surfaceReactionEvents(next: BattleState, events: BattleEvent[], rng: Rng): BattleEvent[] {
  if (!surfacesReact(next)) return [];
  const out: BattleEvent[] = [];
  let s = next;
  const doused = douseEvents(s, events);
  if (doused.length) { out.push(...doused); s = applyEvents(s, doused); }
  for (const hit of hitsOf(next, events)) {
    const evs = reactTo(s, hit, rng);
    if (evs.length) { out.push(...evs); s = applyEvents(s, evs); }
  }
  return out;
}

/**
 * Görev S2: bir element etkisinin tepkimeleri, komut olayı olmadan (nesne olayları: yıkılan mangal, ateşle yıkılan yağ
 * fıçısı, barut patlaması). Bayrak kapalıysa boş.
 */
export function elementReactionEvents(state: BattleState, element: 'fire' | 'cold' | 'lightning', hexes: Offset[], actorId: string, label: string,
  rng: Rng, damage: number | null = null, dc = 10): BattleEvent[] {
  if (!surfacesReact(state)) return [];
  return reactTo(state, { element, hexes, actorId, dc, damage, hitIds: new Set(), label }, rng);
}

/** Görev S2: bir komutun alanlı hasarları (her hasar türü; nesneler için): altıgenler, ham hasar ya da zar, tür. */
export function areaDamageOf(events: BattleEvent[]): Array<{ hexes: Offset[]; damageType: string; damage: number | null; dice?: string; actorId: string; label: string }> {
  const out: Array<{ hexes: Offset[]; damageType: string; damage: number | null; dice?: string; actorId: string; label: string }> = [];
  events.forEach((e, i) => {
    const area = e.type === 'spell_cast' ? e.area : e.type === 'area_used' ? { hexes: e.hexes, damageType: e.damageType, dice: e.dice } : undefined;
    if (!area?.damageType || (e.type !== 'spell_cast' && e.type !== 'area_used')) return;
    let raw: number | null = null;
    for (let j = i + 1; j < events.length; j++) {
      const x = events[j] as BattleEvent;
      if (x.type === 'spell_cast' || x.type === 'area_used') break;
      if (x.type === 'save_resolved' && x.damageType === area.damageType && x.damageRolls.length) { raw = x.rawDamage; break; }
    }
    out.push({ hexes: area.hexes, damageType: area.damageType, damage: raw, ...(area.dice ? { dice: area.dice } : {}), actorId: e.actorId, label: e.label });
  });
  return out;
}
