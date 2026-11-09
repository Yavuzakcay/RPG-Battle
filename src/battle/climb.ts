/**
 * Kuyruk 26 (H3): yükseklik katmanında 2+ seviye farkı aşma (`climb` komutu) ve zemin çökmesiyle düşme.
 * - Yukarı: Atletizm DC (`heightMove.climbDc`), hareket maliyeti 1 + `levelCost` × fark; başarısızsa hareket biter, geçiş yok.
 * - Aşağı: aşağı atlama (gönüllü düşme): maliyet 1, düşülen seviye × `levelFt` için SRD düşme hasarı (`heightFall`), derin
 *   suya düşüşte hasar yok.
 * Yeni olay türü yok: `map_effect` (zar, `stopMovement`, hasar, Prone) ve `moved`. Yapay zekâ bu komutu vermez.
 */
import { fall } from './fall';
import { distance, neighbors, sameHex, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import { enterCost, terrainOf, type TerrainType } from '../map/terrain';
import { fail, finish, type CommandResult } from './common';
import { applyEvents, speedHexes } from './reduce';
import { checkMover, occupantAt, terrainAt } from './movement';
import { opportunityAttacks } from './features';
import { checkEffect, enterHexEvents, fallEffect } from './maprules';
import { fallReactions } from './reactions';
import { climbs, fliesOrHovers, isAirborne } from './flight';
import { climbDc, heightAt, heightDelta, heightFallRule, heightMoveRule, isCliff, katmanOn, layerActive, levelCost, levelFeet } from './heights';
import { altitudeOf } from './altitude';
import { mutlakFt } from './vertical';
import { HEIGHT_RANGE } from '../map/maps';
import type { BattleEvent, BattleState, Combatant } from './types';
import { CLIMB_CLASSES, climbAttempt, climbCheckEvent, climbCostHexes, climbOn, cliffClass, surfaceAt } from './climbing';
import { hasStandData, landingFt, standHeights, standingOn, surTop } from './stand';
import { bandOf } from './cells';
import dikeyData from '../../data/dikey.json';

const CLIFF = dikeyData.tirmanma.katmanUcurum;

/**
 * Kuyruk K71d (sürüm 59+): `climb` kullanabilir mi: uçmayan, süzülmeyen, tırmanma hızı olmayan; yerde ya da (59+) uçurum/duvar
 * yüzünde tutunan Çeviklik tırmanıcısı. 58 ve altında havadaki/duvardaki herkes reddedilir.
 */
const climbUser = (state: BattleState, actor: Combatant): boolean => {
  if (climbs(actor, state)) return false;
  if (katmanOn(state)) return !fliesOrHovers(actor) && altitudeOf(actor) >= 0;
  return !isAirborne(actor);
};

/** Tırmanılabilir/atlanabilir komşular (arayüz): uçurum kenarı, girilebilir ve boş; K72 (60+): sur tepesine çıkış ve iniş. */
export function climbTargets(state: BattleState, actor: Combatant): Offset[] {
  if (!actor.pos) return [];
  const from = actor.pos;
  const out: Offset[] = [];
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  if (hasStandData(state) && !fliesOrHovers(actor) && !climbs(actor, state)) {
    for (const h of neighbors(from, size)) if (wallClimbKind(state, actor, from, h)) out.push(h);
  }
  if (!heightMoveRule(state) || !climbUser(state, actor)) return out;
  state.map?.tiles.forEach((row, r) => [...row].forEach((_, c) => {
    const h = { col: c, row: r };
    if (distance(from, h) !== 1 || !isCliff(state, from, h)) return;
    if (enterCost(terrainAt(state, h), false) === null || occupantAt(state, h, actor.id)) return;
    out.push(h);
  }));
  return out;
}

/**
 * Kuyruk K72 (sürüm 60+, K5): sur tepesine çıkış ('up') ya da sur tepesinden bitişik alçak yüzeye iniş ('down'); değilse null.
 * Çıkış: varış `surUstu` duvarı, tepesi yaratığın yüksekliğinden yüksek. İniş: yaratık bir sur tepesinde duruyor, varış o
 * yükseklikte duruş yüzeyi değil ve geçilmez değil.
 */
function wallClimbKind(state: BattleState, actor: Combatant, from: Offset, to: Offset): 'up' | 'down' | null {
  const alt = altitudeOf(actor);
  const top = surTop(state, to);
  if (top !== null && top > alt) return occupantAt(state, to, actor.id, bandOf(actor, top)) ? null : 'up';
  if (surTop(state, from) === alt && standingOn(state, actor) && !standHeights(state, to).includes(alt)) {
    const t = terrainAt(state, to);
    if (t.movement === 'blocked' || t.outOfBounds) return null;
    return occupantAt(state, to, actor.id, bandOf(actor, landingFt(state, to, alt))) ? null : 'down';
  }
  return null;
}

/**
 * Kuyruk K72 (sürüm 60+, K5): sur tepesine tırmanma ve inme (katmandan bağımsız; K71b iç işlevi). Çıkış: 1 altıgen + her 5 ft
 * için duvar yüzeyinin çarpanı; yerden (ya da bir yüzeyden) başlarken bir kez Çeviklik zarı (`climbAttempt`; duvarda
 * tutunan zar atmaz), tepede durur (tırmanma işareti kalkar). İniş: tırmanarak, aynı maliyet, zarsız, hasarsız; alttaki en
 * yüksek duruş yüzeyine.
 */
function executeWallClimb(state: BattleState, actor: Combatant, from: Offset, to: Offset, kind: 'up' | 'down', rng: Rng): CommandResult {
  const alt = altitudeOf(actor);
  const wall = kind === 'up' ? to : from;
  const surf = surfaceAt(state, wall);
  if (!surf) return fail('Bu duvar tırmanılmaz.');
  const endFt = kind === 'up' ? (surTop(state, to) as number) : landingFt(state, to, alt);
  const ft = Math.abs(endFt - alt);
  const cost = 1 + climbCostHexes(ft, surf.carpan);
  const remaining = speedHexes(actor) - actor.movementUsed;
  if (cost > remaining) return fail(`Hareket yetmiyor: ${cost} altıgen gerekli (${ft} ft tırmanma), ${Math.max(0, remaining)} kaldı.`);
  const events: BattleEvent[] = [];
  let s = state;
  const push = (evs: BattleEvent[]) => { events.push(...evs); s = applyEvents(s, evs); };
  if (kind === 'up' && !actor.climbing) {
    const r = climbAttempt(state, actor, { dc: surf.dc, carpan: surf.carpan, tr: CLIMB_CLASSES[surf.sinif]?.tr ?? surf.sinif }, `${actor.name} sura tırmanıyor (${ft} ft)`, remaining, rng);
    push([r.event]);
    if (!r.ok) return finish(state, events);
  }
  push(opportunityAttacks(s, actor.id, { from, to, fromAlt: alt, toAlt: endFt }, rng));
  if ((s.combatants[actor.id]?.hp ?? 0) <= 0) return finish(state, events);
  push([{ type: 'moved', actorId: actor.id, path: [to], cost },
    { type: 'altitude_changed', targetId: actor.id, altitudeFt: endFt, label: kind === 'up' ? 'sur tepesine çıktı' : 'surdan indi', ...(endFt > 0 ? { stand: true as const } : {}) }]);
  if (endFt === 0 && (s.combatants[actor.id]?.hp ?? 0) > 0) push(enterHexEvents(s, s.combatants[actor.id] as Combatant, to, rng).events);
  return finish(state, events);
}

export function executeClimb(state: BattleState, actor: Combatant, to: Offset, rng: Rng): CommandResult {
  const from = checkMover(state, actor, to);
  if ('ok' in from) return from;
  // Kuyruk K72 (sürüm 60+, K5): sur tepesine çıkış/iniş (katmansız haritada da).
  if (hasStandData(state) && !fliesOrHovers(actor) && !climbs(actor, state) && distance(from, to) === 1) {
    const kind = wallClimbKind(state, actor, from, to);
    if (kind) return executeWallClimb(state, actor, from, to, kind, rng);
  }
  if (!heightMoveRule(state)) return fail('Tırmanma yalnızca yükseklik katmanlı haritada (Game Master anahtarı açık).');
  if (!climbUser(state, actor)) return fail('Uçan ya da tırmanıcı yaratık normal yürür.');
  if (distance(from, to) !== 1) return fail('Tırmanma ve atlama yalnızca bitişik altıgene.');
  if (!isCliff(state, from, to)) return fail('Burası normal yürünür (seviye farkı 1 ya da rampa).');
  const t = terrainAt(state, to);
  if (enterCost(t, false) === null) return fail(`${t.name} girilemez.`);
  const other = occupantAt(state, to, actor.id);
  if (other) return fail(`Dolu (${other.name}).`);
  if (katmanOn(state)) return executeClimb59(state, actor, from, to, t, rng);
  const up = heightDelta(state, from, to);
  // Kuyruk K71b (sürüm 57+, K4): uçurum tırmanışı duvar tırmanışıyla tek kural: Çeviklik kontrolü (yüzey `katmanUcurum`
  // sınıfının DC'si), seviye başına ek maliyet sınıfın çarpanıyla katlanır; tutmazsa düşme ve hareket sonu yok, yerinde kalır,
  // o adımın hareketi yanar. 56 ve altında Atletizm DC 12 ve hareket sonu (aynen).
  const k71 = climbOn(state);
  const cls = k71 ? CLIMB_CLASSES[CLIFF] : undefined;
  const cost = up > 0 ? 1 + levelCost(state) * up * (cls?.carpan ?? 1) : 1;
  const remaining = speedHexes(actor) - actor.movementUsed;
  if (cost > remaining) return fail(`Hareket yetmiyor: ${cost} altıgen gerekli, ${Math.max(0, remaining)} kaldı.`);
  const events: BattleEvent[] = [];
  let s = state;
  const push = (evs: BattleEvent[]) => { events.push(...evs); s = applyEvents(s, evs); };
  const me = () => s.combatants[actor.id] as Combatant;
  if (up > 0 && cls) {
    const check = climbCheckEvent(state, actor, cls.dc, `${actor.name} ${up * levelFeet(state)} ft tırmanıyor (${cls.tr}, DC ${cls.dc})`, rng);
    if (!check.roll?.success) {
      push([{ ...check, text: `${check.text}: tutunamadı (yerinde kaldı, ${cost} altıgen hareket yandı)`, burnMove: cost }]);
      return finish(state, events);
    }
    push([check]);
  } else if (up > 0) {
    const dc = climbDc(state);
    const check = checkEffect(actor, 'heightClimb', `${up * levelFeet(state)} ft tırmanıyor`, 'athletics', dc, rng, state);
    if (!check.roll?.success) {
      push([{ ...check, text: `${check.text}: tutunamadı (hareket bitti)`, stopMovement: true }]);
      return finish(state, events);
    }
    push([check]);
  }
  push(opportunityAttacks(s, actor.id, { from, to }, rng));
  if (me().hp <= 0) return finish(state, events);
  push([{ type: 'moved', actorId: actor.id, path: [to], cost }]);
  if (up < 0 && heightFallRule(state) && k71) push(fall(s, actor.id, -up * levelFeet(state), 'atlama', rng, { at: to }));
  else if (up < 0 && heightFallRule(state) && t.rule !== 'deepWater') {
    const feet = -up * levelFeet(state);
    const fr = fallReactions(s, actor.id, feet, rng);
    push(fr.events);
    push([fallEffect(me(), feet, rng, fr)]);
  }
  if (me().hp > 0) push(enterHexEvents(s, me(), to, rng).events);
  return finish(state, events);
}

/**
 * Kuyruk K71d (sürüm 59+; K71b ile tek kural): katman uçurumu SRD tırmanmasıyla. Tırmanılan ft = varış zemini − başlangıçtaki
 * mutlak yükseklik (`mutlakFt`: zemin + irtifa; yüzde tutunan kalan kadar tırmanır). Maliyet 1 altıgen + her 5 ft için sınıf
 * çarpanı (`cliffClass`: kaba ×2, zorlu arazili varış ×3); yerden başlarken bir kez Çeviklik zarı (`climbAttempt`: tutmazsa ilk
 * 5 ft yanar, düşme yok). Hareket yetmezse yüzde dikey hareketle (`vertical_move`) yükselip sonraki turda devam edilir. Aşağı:
 * düşülen = başlangıç mutlak − varış zemini (irtifa dahil), tek `fall`.
 */
function executeClimb59(state: BattleState, actor: Combatant, from: Offset, to: Offset, t: TerrainType, rng: Rng): CommandResult {
  const alt = altitudeOf(actor);
  const upFt = mutlakFt(state, { pos: to, altitudeFt: 0 }) - mutlakFt(state, actor, from);
  const cls = upFt > 0 ? cliffClass(state, to) : null;
  if (upFt > 0 && !cls) return fail(`${t.name}: bu uçurum tırmanılmaz.`);
  const cost = cls ? 1 + climbCostHexes(upFt, cls.carpan) : 1;
  const remaining = speedHexes(actor) - actor.movementUsed;
  if (cost > remaining) {
    return fail(`Hareket yetmiyor: ${cost} altıgen gerekli (${upFt} ft tırmanma), ${Math.max(0, remaining)} kaldı. Uçurumun yüzünde dikey hareketle yükselip sonraki turda sürdürebilirsin.`);
  }
  const events: BattleEvent[] = [];
  let s = state;
  const push = (evs: BattleEvent[]) => { events.push(...evs); s = applyEvents(s, evs); };
  const me = () => s.combatants[actor.id] as Combatant;
  if (cls && alt <= 0) {
    const r = climbAttempt(state, actor, cls, `${actor.name} ${upFt} ft tırmanıyor`, remaining, rng);
    push([r.event]);
    if (!r.ok) return finish(state, events);
  }
  push(opportunityAttacks(s, actor.id, { from, to, ...(alt ? { fromAlt: alt, toAlt: 0 } : {}) }, rng));
  if (me().hp <= 0) return finish(state, events);
  push([{ type: 'moved', actorId: actor.id, path: [to], cost }]);
  if (upFt < 0 && heightFallRule(state)) push(fall(s, actor.id, -upFt, 'atlama', rng, { at: to, ...(alt ? { altitudeTo: 0 } : {}) }));
  else if (alt !== 0) push([{ type: 'altitude_changed', targetId: actor.id, altitudeFt: 0, label: upFt > 0 ? 'uçurumun üstüne çıktı' : 'indi' }]);
  if (me().hp > 0) push(enterHexEvents(s, me(), to, rng).events);
  return finish(state, events);
}

/** Kuyruk K71d: arayüz: uçurum altıgeninin tırmanma DC'si ve maliyeti (sürüm 59+; öncesinde DC `climbDc`, maliyet null). */
export function climbLabel(state: BattleState, actor: Combatant, to: Offset): { up: boolean; dc: number | null; cost: number | null; ft: number } {
  const from = actor.pos as Offset;
  // Kuyruk K72 (sürüm 60+): sur tepesi.
  const wk = hasStandData(state) ? wallClimbKind(state, actor, from, to) : null;
  if (wk) {
    const alt = altitudeOf(actor);
    const surf = surfaceAt(state, wk === 'up' ? to : from);
    const ft = Math.abs((wk === 'up' ? (surTop(state, to) as number) : landingFt(state, to, alt)) - alt);
    return { up: wk === 'up', dc: wk === 'up' && surf && !actor.climbing ? surf.dc : null, cost: surf ? 1 + climbCostHexes(ft, surf.carpan) : null, ft };
  }
  if (!katmanOn(state)) {
    const up = heightDelta(state, from, to);
    return { up: up > 0, dc: up > 0 ? (climbOn(state) ? CLIMB_CLASSES[CLIFF]?.dc ?? climbDc(state) : climbDc(state)) : null, cost: null, ft: Math.abs(up) * levelFeet(state) };
  }
  const upFt = mutlakFt(state, { pos: to, altitudeFt: 0 }) - mutlakFt(state, actor, from);
  const cls = upFt > 0 ? cliffClass(state, to) : null;
  return { up: upFt > 0, dc: cls && altitudeOf(actor) <= 0 ? cls.dc : null, cost: cls ? 1 + climbCostHexes(upFt, cls.carpan) : 1, ft: Math.abs(upFt) };
}

/**
 * Zemin çökmesi (`tile_changed` ile uçuruma dönen altıgen): üstündeki uçmayan yaratık düşer (altıgen seviyesinden katmanın
 * dibine, en az 30 ft). Köprü yıkılması kendi save'ini zaten yapar (o yaratık atlanır). Kural kapalıysa boş.
 */
export function collapseFallEvents(next: BattleState, events: BattleEvent[], rng: Rng): BattleEvent[] {
  if (!layerActive(next) || !heightFallRule(next)) return [];
  const sunk = events.filter((e): e is Extract<BattleEvent, { type: 'tile_changed' }> => e.type === 'tile_changed' && terrainOf(e.to).flyersPass === true);
  if (!sunk.length) return [];
  const handled = new Set(events.filter((e) => e.type === 'map_effect' && e.rule === 'bridgeBreak').map((e) => (e as { targetId: string }).targetId));
  const out: BattleEvent[] = [];
  let s = next;
  for (const e of sunk) {
    // Kuyruk K66a: Earthquake yarığı kendi düşmesini yapar (çift düşme yok).
    if ((next.map?.zones ?? []).some((z) => z.fissure && z.hexes.some((h) => sameHex(h, e.at)))) continue;
    for (const c of Object.values(s.combatants)) {
      // Kuyruk K71d (sürüm 59+): yüzde tutunan (irtifadaki) Çeviklik tırmanıcısı da düşer: çökme + irtifa tek düşme, irtifa 0'a.
      const k59 = katmanOn(s);
      if (!c.pos || c.hp <= 0 || handled.has(c.id) || (k59 ? fliesOrHovers(c) || climbs(c, s) : isAirborne(c)) || !sameHex(c.pos, e.at)) continue;
      const alt = k59 ? Math.max(0, altitudeOf(c)) : 0;
      const feet = Math.max(30, (heightAt(s, e.at) - HEIGHT_RANGE.min) * levelFeet(s)) + alt;
      const fr = climbOn(s) ? null : fallReactions(s, c.id, feet, rng);
      const evs = fr ? [...fr.events, fallEffect(s.combatants[c.id] as Combatant, feet, rng, fr)] : fall(s, c.id, feet, 'cokme', rng, alt ? { altitudeTo: 0 } : {});
      out.push(...evs); s = applyEvents(s, evs);
      handled.add(c.id);
    }
  }
  return out;
}

