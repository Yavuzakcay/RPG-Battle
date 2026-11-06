/**
 * Kuyruk 18b: yüzey × yüzey (ve element × yüzey) etkileşimlerinin yenileri (tablo: `data/yuzey-etkilesim.json`; eskiler
 * `surfaces.ts`, `ignite.ts`, nesneler). Her etkileşim ayrı global Game Master anahtarı (`kural-kontrol.json`, kural
 * sürümü 15, varsayılan açık): eski kayıt ve replay eski kurallarla aynı kalır. Komut sonunda (`execute`, eski
 * tepkimelerden sonra) o komutun olaylarından; rüzgâr sürüklemesi tur başında. Tepkime derinliği 1. Saf.
 */
import table from '../../data/yuzey-etkilesim.json';
import { hexKey, neighbors, type Offset } from '../rules/hex';
import { type Rng } from '../rules/dice';
import { applyEvents } from './reduce';
import { globalRule } from './ruleControl';
import { surfaceEvent, areaDamageOf } from './surfaces';
import { triggerEvents, zoneHexes } from './zones';
import { GREASE_SPELL, greaseIgniteEvents } from './ignite';
import { WIND_VEC } from './forest';
import { ruleOf } from './maprules';
import { isAirborne } from './flight';
import type { BattleEvent, BattleState, Side, SpellZone, SurfaceReaction } from './types';

export const MIX_PARAMS = table.params;
export const MIX_TABLE = table.etkilesimler;

const on = (s: BattleState, key: string) => !!globalRule(s, key);
const keys = (hs: Offset[]) => new Set(hs.map(hexKey));
const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const zones = (s: BattleState) => s.map?.zones ?? [];
const isSurface = (z: SpellZone, kind: string) => z.surface === kind;
const isSpell = (z: SpellZone, id: string) => !z.surface && z.spellId === id;

/** Kuyruk 19: gaz ya da buhar bulutu mu (Gust of Wind dağıtır): zehir bulutu, buhar, Fog Cloud, Stinking Cloud, Cloudkill. */
export const isCloudZone = (z: SpellZone): boolean => isSurface(z, 'poison') || isSurface(z, 'steam') || isSpell(z, 'fog-cloud')
  || isSpell(z, 'stinking-cloud') || isSpell(z, 'cloudkill');

/**
 * Kuyruk 19: Gust of Wind (SRD 5.2.1 "disperses gas or vapor"): çizgiye değen bulut alanları biter. Anahtar `gustDisperse`
 * (sürüm 16).
 */
export function disperseEvents(state: BattleState, hexes: Offset[]): BattleEvent[] {
  if (!globalRule(state, 'gustDisperse')) return [];
  const keys = new Set(hexes.map(hexKey));
  return zones(state).filter((z) => !z.anchorId && isCloudZone(z) && z.hexes.some((h) => keys.has(hexKey(h))))
    .map((z) => ({ type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'dispelled' }) as BattleEvent);
}
const overlap = (s: BattleState, z: SpellZone, area: Set<string>) => zoneHexes(s, z).filter((h) => area.has(hexKey(h)));

function shrink(z: SpellZone, remove: Set<string>): BattleEvent {
  const left = z.hexes.filter((h) => !remove.has(hexKey(h)));
  return left.length ? { type: 'zone_moved', zoneId: z.id, hexes: left } : { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'reacted' };
}

/** Ağdaki tutsakları (Web'in Restrained etkisi) serbest bırakır; `burn`: yanan ağ alanının hasarı da gelir. */
export function freeCaptives(s: BattleState, web: SpellZone, hexes: Offset[], rng: Rng, burn?: SpellZone): BattleEvent[] {
  const at = keys(hexes);
  const out: BattleEvent[] = [];
  let cur = s;
  for (const c of Object.values(s.combatants)) {
    if (!c.pos || !at.has(hexKey(c.pos))) continue;
    const held = (c.effects ?? []).find((e) => e.id === `${web.spellId}:${web.id}`);
    if (held) {
      const ev: BattleEvent = { type: 'effect_ended', targetId: c.id, effectId: held.id, name: held.name, reason: 'dispelled' };
      out.push(ev); cur = applyEvents(cur, [ev]);
      if (burn) {
        const z = cur.map?.zones?.find((x) => x.id === burn.id);
        const hurt = z && !isAirborne(c) ? triggerEvents(cur, z, c.id, rng) : [];
        out.push(...hurt); cur = applyEvents(cur, hurt);
      }
    }
  }
  return out;
}

interface Touch { type: string; hexes: Offset[]; actorId: string; label: string }

function touchesOf(s: BattleState, events: BattleEvent[]): Touch[] {
  const out: Touch[] = areaDamageOf(events).map((a) => ({ type: a.damageType, hexes: a.hexes, actorId: a.actorId, label: a.label }));
  for (const e of events) {
    if (e.type !== 'attack_resolved' || !e.hit) continue;
    const pos = s.combatants[e.targetId]?.pos;
    if (pos) out.push({ type: e.damageType, hexes: [pos], actorId: e.actorId, label: e.label });
  }
  return out;
}

/** Komut sonu etkileşimleri. */
export function surfaceMixEvents(next: BattleState, events: BattleEvent[], rng: Rng): BattleEvent[] {
  if (!next.map || next.yuzeyEtkilesimi === false) return [];
  const out: BattleEvent[] = [];
  let s = next;
  const push = (evs: BattleEvent[]) => { if (evs.length) { out.push(...evs); s = applyEvents(s, evs); } };
  const sideOf = (id: string): Side => s.combatants[id]?.side ?? 'enemies';
  const note = (reaction: string, hexes: Offset[], sourceId: string, label: string): BattleEvent =>
    ({ type: 'surface_reacted', reaction: reaction as SurfaceReaction, hexes, sourceId, label });

  // Element dokunuşları.
  for (const t of touchesOf(next, events)) {
    const area = keys(t.hexes);
    if (t.type === 'fire' && on(s, 'mixFireFog')) {
      for (const z of zones(s).filter((x) => isSpell(x, 'fog-cloud'))) {
        const hit = overlap(s, z, area);
        if (hit.length) push([note('fogBurn', hit, t.actorId, t.label), shrink(z, keys(hit))]);
      }
    }
    if (t.type === 'lightning') {
      if (on(s, 'mixLightningIce')) for (const z of zones(s).filter((x) => isSurface(x, 'ice'))) {
        const hit = overlap(s, z, area);
        if (hit.length) push([note('crack', hit, t.actorId, t.label), shrink(z, keys(hit))]);
      }
      if (on(s, 'mixLightningIgnite')) {
        for (const z of zones(s).filter((x) => isSurface(x, 'oil') && overlap(s, x, area).length)) {
          push([note('ignite', z.hexes, t.actorId, t.label), { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'reacted' }, surfaceEvent(s, 'fire', z.hexes, t.actorId, sideOf(t.actorId))]);
        }
        push(greaseIgniteEvents(s, t.hexes, t.actorId, rng));
      }
    }
    if (t.type === 'cold' && on(s, 'mixColdSteam')) for (const z of zones(s).filter((x) => isSurface(x, 'steam'))) {
      const hit = overlap(s, z, area);
      if (hit.length) push([note('condense', hit, t.actorId, t.label), shrink(z, keys(hit)), surfaceEvent(s, 'water', hit, t.actorId, sideOf(t.actorId))]);
    }
    if ((t.type === 'force' || t.type === 'thunder') && on(s, 'mixForceWater')) for (const z of zones(s).filter((x) => isSurface(x, 'water') && overlap(s, x, area).length)) {
      const have = keys(z.hexes);
      const grow: Offset[] = [];
      for (let ring = 0; ring < MIX_PARAMS.forceWaterRing; ring++) {
        for (const h of [...z.hexes, ...grow]) for (const n of neighbors(h, sizeOf(s))) {
          if (have.has(hexKey(n)) || (s.map?.tiles[n.row]?.[n.col] ?? '#') === '#') continue;
          have.add(hexKey(n)); grow.push(n);
        }
      }
      if (grow.length) push([note('splash', grow, t.actorId, t.label), { type: 'zone_moved', zoneId: z.id, hexes: [...z.hexes, ...grow] }]);
    }
    if (t.type === 'acid' && on(s, 'mixAcidWeb')) for (const z of zones(s).filter((x) => isSpell(x, 'web'))) {
      const hit = overlap(s, z, area);
      if (!hit.length) continue;
      push([note('dissolve', hit, t.actorId, t.label)]);
      push(freeCaptives(s, z, hit, rng));
      push([shrink(z, keys(hit))]);
    }
  }

  // Bu komutta oluşan yüzeyler.
  for (const e of events) {
    if (e.type !== 'zone_created') continue;
    const made = e.zone;
    const area = keys(made.hexes);
    const src = made.casterId;
    if (made.surface === 'fire' && on(s, 'mixOilSpread')) {
      // Bitişik yağ ve gres de tutuşur; yağdan doğan alevin üstündekiler hemen yanar.
      const ring = keys(made.hexes.flatMap((h) => [h, ...neighbors(h, sizeOf(s))]));
      for (const z of zones(s).filter((x) => isSurface(x, 'oil') && zoneHexes(s, x).some((h) => ring.has(hexKey(h))))) {
        push([note('ignite', z.hexes, src, made.name), { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'reacted' }, surfaceEvent(s, 'fire', z.hexes, src, made.side)]);
      }
      const greaseNear = zones(s).filter((x) => isSpell(x, GREASE_SPELL) && zoneHexes(s, x).some((h) => ring.has(hexKey(h))));
      if (greaseNear.length) push(greaseIgniteEvents(s, greaseNear.flatMap((z) => zoneHexes(s, z)), src, rng));
      const live = s.map?.zones?.find((x) => x.id === made.id);
      const fromOil = events.some((x) => x.type === 'surface_reacted' && x.reaction === 'ignite' && x.hexes.some((h) => area.has(hexKey(h))));
      if (live && fromOil) for (const c of Object.values(s.combatants)) {
        if (!c.pos || c.hp <= 0 || isAirborne(c) || !area.has(hexKey(c.pos))) continue;
        push(triggerEvents(s, live, c.id, rng));
      }
    }
    if (made.surface === 'burningWeb' && on(s, 'mixWebFree')) {
      const web = zones(next).find((x) => isSpell(x, 'web')) ?? zones(s).find((x) => isSpell(x, 'web'));
      const live = s.map?.zones?.find((x) => x.id === made.id);
      if (web && live) push(freeCaptives(s, web, made.hexes, rng, live));
    }
    if (made.surface !== 'water') continue;
    if (on(s, 'mixWaterFire')) for (const z of zones(s).filter((x) => isSurface(x, 'fire') || isSurface(x, 'burningWeb'))) {
      const hit = overlap(s, z, area);
      if (hit.length) push([note('douse', hit, src, made.name), shrink(z, keys(hit)), surfaceEvent(s, 'steam', hit, src, made.side)]);
    }
    if (on(s, 'mixWaterGrease')) for (const z of zones(s).filter((x) => isSpell(x, GREASE_SPELL) && overlap(s, x, area).length)) {
      const until = s.round + MIX_PARAMS.waterGreaseRounds - 1;
      if (z.until === undefined || z.until > until) push([note('wash', overlap(s, z, area), src, made.name), { type: 'zone_moved', zoneId: z.id, hexes: z.hexes, until }]);
    }
    if (on(s, 'mixWaterPoison')) for (const z of zones(s).filter((x) => (isSurface(x, 'poison') || isSpell(x, 'stinking-cloud')) && overlap(s, x, area).length)) {
      const until = s.round + MIX_PARAMS.waterPoisonRounds - 1;
      if (z.until === undefined || z.until > until) push([note('dilute', overlap(s, z, area), src, made.name), { type: 'zone_moved', zoneId: z.id, hexes: z.hexes, until }]);
    }
    if (on(s, 'mixWaterWeb')) for (const z of zones(s).filter((x) => isSpell(x, 'web'))) {
      const hit = overlap(s, z, area);
      if (!hit.length) continue;
      push([note('dissolve', hit, src, made.name)]);
      push(freeCaptives(s, z, hit, rng));
      push([shrink(z, keys(hit))]);
    }
  }
  return out;
}

const pix = (h: Offset) => ({ x: 1.5 * h.col, y: Math.sqrt(3) * (h.row + (h.col & 1 ? 0.5 : 0)) });

/** Tur başı: rüzgâr sis, zehir bulutu ve buharı bir altıgen sürükler; şiddetli rüzgârda süre bir kısalır. */
export function windDriftEvents(state: BattleState): BattleEvent[] {
  if (!state.map || state.yuzeyEtkilesimi === false || !on(state, 'mixWindClouds')) return [];
  const w = ruleOf(state, 'wind');
  const v = w && typeof w.dir === 'string' ? WIND_VEC[w.dir] : undefined;
  if (!v) return [];
  const strong = typeof w?.strength === 'number' && w.strength >= MIX_PARAMS.windDiluteStrength;
  const size = sizeOf(state);
  const out: BattleEvent[] = [];
  for (const z of zones(state)) {
    if (z.anchorId || !(isSurface(z, 'poison') || isSurface(z, 'steam') || isSpell(z, 'fog-cloud') || isSpell(z, 'stinking-cloud'))) continue;
    const moved: Offset[] = [];
    const seen = new Set<string>();
    for (const h of z.hexes) {
      const p = pix(h);
      const best = neighbors(h, size).map((n) => { const q = pix(n); return { n, d: (q.x - p.x) * v.x + (q.y - p.y) * v.y }; }).sort((a, b) => b.d - a.d)[0];
      if (best && best.d > 0 && !seen.has(hexKey(best.n))) { seen.add(hexKey(best.n)); moved.push(best.n); }
    }
    const until = strong && z.until !== undefined ? z.until - 1 : z.until;
    if (!moved.length || (until !== undefined && until < state.round)) { out.push({ type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'reacted' }); continue; }
    out.push({ type: 'zone_moved', zoneId: z.id, hexes: moved, ...(until !== z.until && until !== undefined ? { until } : {}) });
  }
  return out;
}
