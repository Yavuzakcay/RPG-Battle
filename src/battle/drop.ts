/**
 * Kuyruk K73b (kural sürümü 63+, Görev 3): gönüllü düşme (`jump_down`). Kenardan bilerek inmek/atlamak:
 * - Nereden: sur tepesi ya da kat döşemesi (K72 duruş yüzeyi), katman uçurumunun üstü (K71d), duvar/uçurum yüzünde tutunma
 *   (bitişik altıgene atlar ya da kendi altıgeninde bırakır).
 * - Nereye: bitişik altıgen (1 altıgen hareket) ya da tutunan için kendi altıgeni (hareketsiz). İniş yüksekliği alttaki en
 *   yüksek duruş yüzeyi (K72 `landingFt`: kat deliğinden alt kata, balkondan yere); aynı yükseklikte yürünen yüzeye atlanmaz
 *   (yürü), geçilmez altıgene ve lava gönüllü inilmez.
 * - Düşme tek işlevle (K71b `fall`): SRD 5.2.1 her 10 ft 1d6, hasar alan Prone, düşme tepkileri, derin suda K73b suya düşme;
 *   iniş hücresi doluysa yanına (K71c). Yatay adım fırsat saldırısı tetikler (düşüş tetiklemez).
 * - Uçan/süzülen/Levitate'li dikey hareketle iner (bu komut yok).
 */
import { fail, finish, type CommandResult } from './common';
import { fall } from './fall';
import { opportunityAttacks } from './features';
import { enterHexEvents } from './maprules';
import { checkMover, occupantAt, terrainAt } from './movement';
import { applyEvents, speedHexes } from './reduce';
import { altitudeOf } from './altitude';
import { bandOf } from './cells';
import { isAirborne } from './flight';
import { k73bOn } from './adjacency';
import { landingFt, standHeights, standingOn } from './stand';
import { k9Ft } from './vertical';
import { heightFallRule, katmanOn } from './heights';
import { distance, neighbors, sameHex, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant } from './types';

/** Bir gönüllü düşmenin önizlemesi: varış altıgeni, düşülen ft, iniş yüksekliği (varışın zemininden), hasar zarı. */
export interface DropPlan { to: Offset; ft: number; land: number; dice: string; cost: number }

/** Yaratık şu an düşebilecek yerde mi (havada değil; yüksekte duruyor ya da yüzde tutunuyor). */
const dropper = (state: BattleState, c: Combatant): boolean =>
  k73bOn(state) && !!state.map && !!c.pos && c.hp > 0 && !(isAirborne(c) && !c.climbing);

/** `to`'ya atlamanın planı ya da sorunu (metin). */
export function dropPlan(state: BattleState, actor: Combatant, to: Offset): DropPlan | string {
  if (!k73bOn(state)) return 'Gönüllü düşme bu kural sürümünde yok.';
  if (!state.map || !actor.pos) return 'Bu savaşta harita yok.';
  if (isAirborne(actor) && !actor.climbing) return 'Uçan ya da süzülen yaratık dikey hareketle iner.';
  const from = actor.pos;
  const same = sameHex(from, to);
  if (same && !actor.climbing) return 'Kendi altıgenine yalnız duvarda tutunurken bırakılır.';
  if (!same && distance(from, to) !== 1) return 'Yalnız bitişik altıgene atlanır.';
  const alt = altitudeOf(actor);
  // Varışın zemininden yükseklik: K9 yüksekliği (katmanlı haritada `heightMove` açıkken zemin dahil; kapalıyken uçurum
  // yürünür, yalnız irtifa).
  const rel = k9Ft(state, actor, from, alt) - k9Ft(state, actor, to, 0);
  if (rel <= 0) return 'Orası aşağıda değil.';
  if (!same && standHeights(state, to).includes(rel)) return 'Aynı yükseklikte yürünür.';
  const land = landingFt(state, to, rel);
  const t = terrainAt(state, to);
  if (land === 0 && (t.movement === 'blocked' || t.outOfBounds)) return `${t.name}: oraya inilemez.`;
  if (land === 0 && t.movement === 'deadly') return `${t.name}: gönüllü olarak girilemez.`;
  const ft = rel - land;
  if (ft < 5) return 'Düşülecek yükseklik yok.';
  if (!same && occupantAt(state, to, actor.id, bandOf(actor, rel))) return 'Dolu.';
  const cost = same ? 0 : 1;
  if (cost > speedHexes(actor) - actor.movementUsed) return `Hareket yetmiyor: ${cost} altıgen gerekli.`;
  return { to, ft, land, dice: ft >= 10 ? `${Math.min(20, Math.floor(ft / 10))}d6` : '', cost };
}

/** Atlanabilecek bütün yerler (arayüz ve YZ): bitişik altıgenler ve tutunan için kendi altıgeni. */
export function dropTargets(state: BattleState, actor: Combatant): DropPlan[] {
  if (!dropper(state, actor) || !state.map) return [];
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const out: DropPlan[] = [];
  for (const h of [actor.pos as Offset, ...neighbors(actor.pos as Offset, size)]) {
    const p = dropPlan(state, actor, h);
    if (typeof p !== 'string') out.push(p);
  }
  return out;
}

/** `jump_down` komutu. */
export function executeJumpDown(state: BattleState, actor: Combatant, to: Offset, rng: Rng): CommandResult {
  const from = checkMover(state, actor, to);
  if ('ok' in from) return from;
  const plan = dropPlan(state, actor, to);
  if (typeof plan === 'string') return fail(plan);
  const alt = altitudeOf(actor);
  const events: BattleEvent[] = [];
  let s = state;
  const push = (evs: BattleEvent[]) => { events.push(...evs); s = applyEvents(s, evs); };
  const me = () => s.combatants[actor.id] as Combatant;
  if (plan.cost > 0) {
    push(opportunityAttacks(s, actor.id, { from, to, fromAlt: alt, toAlt: alt }, rng));
    if (me().hp <= 0) return finish(state, events);
    push([{ type: 'moved', actorId: actor.id, path: [to], cost: plan.cost }]);
  }
  // Katman uçurumundan (yalnız zemin farkı) atlamada Game Master `heightFall` kapalıysa hasarsız iner (`climb` aşağı gibi).
  const quiet = alt === 0 && !standingOn(state, actor) && katmanOn(state) && !heightFallRule(state);
  if (quiet) push([{ type: 'altitude_changed', targetId: actor.id, altitudeFt: plan.land, label: 'atladı', ...(plan.land > 0 ? { stand: true as const } : {}) }]);
  else push(fall(s, actor.id, plan.ft, 'atlama', rng, { at: to, altitudeTo: plan.land, label: plan.land > 0 ? 'aşağı atladı' : 'atladı' }));
  const after = me();
  if (plan.land === 0 && after.hp > 0 && after.pos) push(enterHexEvents(s, after, after.pos, rng).events);
  return finish(state, events);
}
