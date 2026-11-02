/**
 * Kuyruk 18 H4: savaş içi kat değişimi (Derinlikler merdiveni). Harita kuralı `floorLink` (varyantta; kural sürümü 15,
 * Game Master anahtarı): `at` merdiven altıgenleri (1 tabanlı [sütun, satır]), `to`/`toVariant` öbür kat, `arrive`
 * öbür kattaki iniş altıgenleri, `enemies` öbür katta ilk inişte gelen düşmanlar (canavar kimliği → sayı).
 *
 * Merdivendeki parti üyesi `change_floor` ile bütün partiyi (ölü olmayan parti savaşçıları ve çağrıları) öbür kata
 * taşır: tek savaş durumu, tek inisiyatif sırası. Etkin kat `state.map`; bırakılan katın haritası `state.floors[id]`
 * içinde saklanır, oradaki savaşçılar `offFloor` olur (konumu `floorPos`; sırada atlanır, hedef alınmaz, kazanma
 * sayımına girmez). Geri dönülünce kat haritası ve oradakiler aynen geri gelir. Yeni katın düşmanları ve inisiyatifleri
 * olayın içinde (replay aynı). Kat değiştiren savaşçının bu turdaki hareketi biter.
 */
import { rollD20, rollTag, type Rng } from '../rules/dice';
import { distance, hexKey, neighbors, type Offset } from '../rules/hex';
import { environmentFor, getMap } from '../map/maps';
import { getMonster } from '../data';
import { buildMapState, combatantFromMonster } from './create';
import { fail, finish, type CommandResult } from './common';
import { ruleOf } from './maprules';
import { moveCostFn, speedHexes } from './movement';
import type { BattleEvent, BattleState, Combatant } from './types';

export interface FloorLink { to: string; toVariant?: string; at: Offset[]; arrive: Offset[]; enemies?: Record<string, number> }

const toOffset = (h: unknown): Offset | null => (Array.isArray(h) && typeof h[0] === 'number' && typeof h[1] === 'number' ? { col: h[0] - 1, row: h[1] - 1 } : null);

/** Etkin katın merdiven bağı (kural yoksa, kapalıysa ya da eski sürümde null). */
export function floorLinkOf(state: BattleState): FloorLink | null {
  const r = ruleOf(state, 'floorLink');
  if (!r || typeof r.to !== 'string') return null;
  const list = (v: unknown) => (Array.isArray(v) ? v.map(toOffset).filter((x): x is Offset => !!x) : []);
  return { to: r.to, ...(typeof r.toVariant === 'string' ? { toVariant: r.toVariant } : {}), at: list(r.at), arrive: list(r.arrive),
    ...(r.enemies && typeof r.enemies === 'object' ? { enemies: r.enemies as Record<string, number> } : {}) };
}

export function changeFloorProblem(state: BattleState, actor: Combatant): string | null {
  const link = floorLinkOf(state);
  if (!link) return 'Burada kat merdiveni yok.';
  if (actor.side !== 'party' || actor.summon) return 'Merdiveni yalnızca parti üyesi kullanır.';
  if (!actor.pos || !link.at.some((h) => hexKey(h) === hexKey(actor.pos as Offset))) return 'Merdiven altıgeninde değilsin.';
  return null;
}

/** Yeni katta, iniş altıgenlerinden başlayarak geçilebilir boş altıgenler (en yakından). */
function landing(s: BattleState, start: Offset[], count: number, mover: Combatant, taken: Set<string>): Offset[] {
  const size = { cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 };
  const cost = moveCostFn(s, mover);
  const out: Offset[] = [];
  const seen = new Set<string>();
  const queue = [...start];
  const ok = (h: Offset) => !taken.has(hexKey(h)) && neighbors(h, size).some((n) => cost(n, h) !== null);
  while (queue.length && out.length < count) {
    const h = queue.shift() as Offset;
    if (seen.has(hexKey(h))) continue;
    seen.add(hexKey(h));
    if (ok(h)) { out.push(h); taken.add(hexKey(h)); }
    for (const n of neighbors(h, size)) if (!seen.has(hexKey(n)) && cost(h, n) !== null) queue.push(n);
  }
  return out;
}

export function executeChangeFloor(state: BattleState, actor: Combatant, rng: Rng): CommandResult {
  const why = changeFloorProblem(state, actor);
  if (why) return fail(why);
  const link = floorLinkOf(state) as FloorLink;
  const from = state.map?.id as string;
  const stored = state.floors?.[link.to];
  const m = getMap(link.to, link.toVariant ? { variantId: link.toVariant } : {});
  const variantId = link.toVariant ?? m.variants[0]?.id ?? '';
  const map = stored ?? buildMapState(m, variantId, state.map?.ruleToggles ?? {}, state.map?.ruleParams);
  const env = environmentFor(m, variantId);
  // Taşınanlar: ölü olmayan parti savaşçıları ve çağrıları (bu kattakiler).
  const here = Object.values(state.combatants).filter((c) => !c.offFloor);
  const movers = here.filter((c) => c.side === 'party' && c.life !== 'dead' && !c.civilian && !c.summon?.gone);
  const parked = here.filter((c) => !movers.includes(c) && c.pos);
  const restored = Object.values(state.combatants).filter((c) => c.offFloor === link.to);
  // Yeni katın geçici durumu (iniş yeri ve yeni düşmanların yeri için).
  const probe: BattleState = { ...state, map, combatants: Object.fromEntries(restored.map((c) => [c.id, { ...c, offFloor: undefined, pos: c.floorPos ?? null }])) };
  const taken = new Set(restored.map((c) => c.floorPos).filter((p): p is Offset => !!p).map(hexKey));
  const spots = landing(probe, link.arrive, movers.length, actor, taken);
  const moved = movers.map((c, i) => ({ id: c.id, pos: spots[i] ?? null }));
  // İlk inişte gelen düşmanlar: iniş yerinden en uzak boş altıgenlere, inisiyatifleri burada atılır.
  const added: Combatant[] = [];
  if (!stored && link.enemies) {
    const pool = landing(probe, [{ col: (map.tiles[0]?.length ?? 1) - 2, row: Math.floor(map.tiles.length / 2) }], Object.values(link.enemies).reduce((a, b) => a + b, 0) * 3, actor, taken)
      .sort((a, b) => Math.min(...link.arrive.map((x) => distance(x, b))) - Math.min(...link.arrive.map((x) => distance(x, a))));
    let n = 0;
    for (const [id, count] of Object.entries(link.enemies)) {
      const mon = getMonster(id);
      for (let k = 0; k < count; k++) {
        n += 1;
        const c = combatantFromMonster(mon, { id: `kat-${link.to}-${n}`, name: `${mon.name} ${n}` });
        const roll = rollD20('normal', rollTag(rng, { kind: 'initiative', by: c.id }));
        added.push({ ...c, side: 'enemies', initiative: roll.kept + c.modifiers.dex, pos: pool[n - 1] ?? null });
      }
    }
  }
  return finish(state, [{
    type: 'floor_changed', actorId: actor.id, from, to: link.to, map, environmentId: env, prev: state.map as NonNullable<BattleState['map']>,
    moved, parked: parked.map((c) => ({ id: c.id, pos: c.pos as Offset })), restored: restored.map((c) => c.id), added,
    hexesUsed: speedHexes(actor),
  }]);
}

/** Reducer: kat değişimi (etkin harita, saklanan katlar, savaşçılar, sıra). */
export function applyFloorChange(state: BattleState, e: Extract<BattleEvent, { type: 'floor_changed' }>): BattleState {
  const combatants: Record<string, Combatant> = { ...state.combatants };
  for (const m of e.moved) { const c = combatants[m.id]; if (c) combatants[m.id] = { ...c, pos: m.pos }; }
  for (const p of e.parked) { const c = combatants[p.id]; if (c) combatants[p.id] = { ...c, pos: null, offFloor: e.from, floorPos: p.pos }; }
  for (const id of e.restored) {
    const c = combatants[id];
    if (!c) continue;
    const { offFloor: _o, floorPos, ...rest } = c;
    combatants[id] = { ...rest, pos: floorPos ?? null } as Combatant;
  }
  const actor = combatants[e.actorId];
  if (actor) combatants[e.actorId] = { ...actor, movementUsed: Math.max(actor.movementUsed, e.hexesUsed) };
  // Yeni düşmanlar inisiyatiflerine göre sıraya girer (eşitlikte sonra).
  const order = [...state.order];
  for (const c of e.added) {
    combatants[c.id] = c;
    const at = order.findIndex((id) => (combatants[id]?.initiative ?? 0) < c.initiative);
    order.splice(at < 0 ? order.length : at, 0, c.id);
  }
  const current = state.order[state.turnIndex];
  const floors = { ...(state.floors ?? {}) };
  delete floors[e.to];
  floors[e.from] = e.prev;
  return { ...state, map: e.map, environmentId: e.environmentId, floors, combatants, order, turnIndex: Math.max(0, order.indexOf(current ?? '')) };
}

