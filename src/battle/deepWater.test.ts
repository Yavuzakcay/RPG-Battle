/**
 * Kuyruk 24d: çok derin su (Game Master mekaniği `deepWaterLimit`, kural sürümü 5) ve hane tabanlı mağara keşfi.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { P1, mk } from './fixtures';
import { replay } from './reduce';
import { shoreDistances, veryDeepAt } from './deepWater';
import { getMap, maps } from '../map/maps';
import { neighbors, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleState, Combatant } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const HG = 'orman-heykel-golu';

function lake(a: Partial<Combatant> = {}, opt: { v?: number; toggles?: Record<string, boolean>; params?: Record<string, Record<string, number>> } = {}): BattleState {
  const st = startBattle('k24d', 'orman', [mk('A', { ownerId: 'p1', ...a }), mk('B', { side: 'enemies' })], () => 0.5, {
    map: { id: HG, ...(opt.toggles ? { ruleToggles: opt.toggles } : {}), ...(opt.params ? { ruleParams: opt.params } : {}) }, ...(opt.v ? { kuralSurumu: opt.v } : {}),
  }).state;
  return { ...st, status: 'active', order: ['A', 'B'], turnIndex: 0,
    combatants: { A: { ...(st.combatants.A as Combatant), pos: null }, B: { ...(st.combatants.B as Combatant), pos: o(2, 15) } } } as BattleState;
}
const place = (s: BattleState, at: Offset): BattleState => ({ ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), pos: at, movementUsed: 0 } } });

/** Heykel Gölü'nde çok derin bir altıgen ve ona bitişik, eşik içindeki derin su altıgeni. */
function edge(): { far: Offset; near: Offset } {
  const tiles = getMap(HG).tiles;
  const size = { cols: tiles[0]!.length, rows: tiles.length };
  for (let r = 0; r < size.rows; r++) for (let c = 0; c < size.cols; c++) {
    const h = o(c, r);
    if (!veryDeepAt(tiles, h, 3)) continue;
    const n = neighbors(h, size).find((x) => tiles[x.row]?.[x.col] === 'w' && !veryDeepAt(tiles, x, 3));
    if (n) return { far: h, near: n };
  }
  throw new Error('çok derin altıgen yok');
}

describe('Kuyruk 24d: çok derin su', () => {
  it('Heykel Gölü ortasında kıyıdan > 3 altıgen: yüzemeyen giremez; suda yürüyen ve yüzücü (timsah) girer', () => {
    const { far, near } = edge();
    const s = place(lake(), near);
    expect(execute(s, { type: 'move', actorId: 'A', to: far }, P1, high).ok).toBe(false);
    const walker = place(lake({ effects: [{ id: 'water-walk', name: 'Water Walk', sourceId: 'A' }] }), near);
    const r = execute(walker, { type: 'move', actorId: 'A', to: far }, P1, high);
    expect(r.ok).toBe(true);
    if (r.ok) expect(replay([{ type: 'battle_started', state: walker }, ...r.events])).toEqual(r.state);
    expect(execute(place(lake({ monsterId: 'crocodile' }), near), { type: 'move', actorId: 'A', to: far }, P1, high).ok).toBe(true);
  });
  it('Game Master kapatınca, eşik büyütülünce ve eski kayıtta (kural sürümü 4) mevcut yüzme kuralı', () => {
    const { far, near } = edge();
    for (const s of [lake({}, { toggles: { deepWaterLimit: false } }), lake({}, { params: { deepWaterLimit: { threshold: 20 } } }), lake({}, { v: 4 })]) {
      expect(execute(place(s, near), { type: 'move', actorId: 'A', to: far }, P1, high).ok).toBe(true);
    }
  });
  it('şelale geçidi kara altıgeni (kıyıya uzaklık 0); açılınca yüzemeyen kıyıdan girer', () => {
    const tiles = getMap(HG).tiles;
    const d = shoreDistances(tiles);
    const s0 = lake();
    const opened = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: tiles.map((l, r) => (r === 6 || r === 7 ? l.slice(0, 28) + '.' + l.slice(29) : l)) } };
    expect(d[7 * tiles[0]!.length + 27]).toBe(0);
    expect(execute(place(opened, o(27, 7)), { type: 'move', actorId: 'A', to: o(28, 7) }, P1, high).ok).toBe(true);
  });
  it('hiçbir haritanın başlangıç altıgeni çok derin değil', () => {
    for (const m of maps) for (const h of [...m.startZones.players, ...m.startZones.enemies]) expect(veryDeepAt(m.tiles, h, 3), `${m.id} ${h.col},${h.row}`).toBe(false);
  });
});

describe('Kuyruk 24d: mağara keşfi hane tabanlı', () => {
  it('geçide uçarak giren parti üyesi bayrağı üretir (bir kez)', () => {
    const s0 = lake({ fly: 30, speed: 30 });
    const tiles = getMap(HG).tiles.map((l, r) => (r === 6 || r === 7 ? l.slice(0, 28) + '.' + l.slice(29) : l));
    const s1 = place({ ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles } }, o(27, 8));
    const r = execute(s1, { type: 'move', actorId: 'A', to: o(28, 7) }, P1, high);
    if (!r.ok) throw new Error(r.error);
    expect(r.events.filter((e) => e.type === 'map_note' && e.flag === 'heykel-magarasi-kesfedildi')).toHaveLength(1);
    expect(r.state.flags).toEqual(['heykel-magarasi-kesfedildi']);
  });
});
