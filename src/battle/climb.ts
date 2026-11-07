/**
 * Kuyruk 26 (H3): yükseklik katmanında 2+ seviye farkı aşma (`climb` komutu) ve zemin çökmesiyle düşme.
 * - Yukarı: Atletizm DC (`heightMove.climbDc`), hareket maliyeti 1 + `levelCost` × fark; başarısızsa hareket biter, geçiş yok.
 * - Aşağı: aşağı atlama (gönüllü düşme): maliyet 1, düşülen seviye × `levelFt` için SRD düşme hasarı (`heightFall`), derin
 *   suya düşüşte hasar yok.
 * Yeni olay türü yok: `map_effect` (zar, `stopMovement`, hasar, Prone) ve `moved`. Yapay zekâ bu komutu vermez.
 */
import { distance, sameHex, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import { enterCost, terrainOf } from '../map/terrain';
import { fail, finish, type CommandResult } from './common';
import { applyEvents, speedHexes } from './reduce';
import { checkMover, occupantAt, terrainAt } from './movement';
import { opportunityAttacks } from './features';
import { checkEffect, enterHexEvents, fallEffect } from './maprules';
import { fallReactions } from './reactions';
import { climbs, isAirborne } from './flight';
import { climbDc, heightAt, heightDelta, heightFallRule, heightMoveRule, isCliff, layerActive, levelCost, levelFeet } from './heights';
import { HEIGHT_RANGE } from '../map/maps';
import type { BattleEvent, BattleState, Combatant } from './types';

/** Tırmanılabilir/atlanabilir komşular (arayüz): uçurum kenarı, girilebilir ve boş. */
export function climbTargets(state: BattleState, actor: Combatant): Offset[] {
  if (!actor.pos || !heightMoveRule(state) || isAirborne(actor) || climbs(actor, state)) return [];
  const out: Offset[] = [];
  const from = actor.pos;
  state.map?.tiles.forEach((row, r) => [...row].forEach((_, c) => {
    const h = { col: c, row: r };
    if (distance(from, h) !== 1 || !isCliff(state, from, h)) return;
    if (enterCost(terrainAt(state, h), false) === null || occupantAt(state, h, actor.id)) return;
    out.push(h);
  }));
  return out;
}

export function executeClimb(state: BattleState, actor: Combatant, to: Offset, rng: Rng): CommandResult {
  const from = checkMover(state, actor, to);
  if ('ok' in from) return from;
  if (!heightMoveRule(state)) return fail('Tırmanma yalnızca yükseklik katmanlı haritada (Game Master anahtarı açık).');
  if (isAirborne(actor) || climbs(actor, state)) return fail('Uçan ya da tırmanıcı yaratık normal yürür.');
  if (distance(from, to) !== 1) return fail('Tırmanma ve atlama yalnızca bitişik altıgene.');
  if (!isCliff(state, from, to)) return fail('Burası normal yürünür (seviye farkı 1 ya da rampa).');
  const t = terrainAt(state, to);
  if (enterCost(t, false) === null) return fail(`${t.name} girilemez.`);
  const other = occupantAt(state, to, actor.id);
  if (other) return fail(`Dolu (${other.name}).`);
  const up = heightDelta(state, from, to);
  const cost = up > 0 ? 1 + levelCost(state) * up : 1;
  const remaining = speedHexes(actor) - actor.movementUsed;
  if (cost > remaining) return fail(`Hareket yetmiyor: ${cost} altıgen gerekli, ${Math.max(0, remaining)} kaldı.`);
  const events: BattleEvent[] = [];
  let s = state;
  const push = (evs: BattleEvent[]) => { events.push(...evs); s = applyEvents(s, evs); };
  const me = () => s.combatants[actor.id] as Combatant;
  if (up > 0) {
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
  if (up < 0 && heightFallRule(state) && t.rule !== 'deepWater') {
    const feet = -up * levelFeet(state);
    const fr = fallReactions(s, actor.id, feet, rng);
    push(fr.events);
    push([fallEffect(me(), feet, rng, fr)]);
  }
  if (me().hp > 0) push(enterHexEvents(s, me(), to, rng).events);
  return finish(state, events);
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
      if (!c.pos || c.hp <= 0 || handled.has(c.id) || isAirborne(c) || !sameHex(c.pos, e.at)) continue;
      const feet = Math.max(30, (heightAt(s, e.at) - HEIGHT_RANGE.min) * levelFeet(s));
      const fr = fallReactions(s, c.id, feet, rng);
      const evs = [...fr.events, fallEffect(s.combatants[c.id] as Combatant, feet, rng, fr)];
      out.push(...evs); s = applyEvents(s, evs);
      handled.add(c.id);
    }
  }
  return out;
}

