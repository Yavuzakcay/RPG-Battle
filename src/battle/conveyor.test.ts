/** Kuyruk 21 D2b: yürüyen merdiven (Dungeon "merdiven-yuruyen" varyantı; zemin Y, kural `conveyor`, kol). */
import { describe, it, expect } from 'vitest';
import { execute, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant } from './index';
import { getMap, RAW_MAPS } from '../map/maps';
import type { Offset } from '../rules/hex';
import { moveCostFn } from './movement';
import { conveyorFlow, isUphillStep } from './conveyor';
import { terrainInfo } from '../ui/mapView';
import { P1, mk, scripted } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });
const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, ...p });
const B = (p: Partial<Combatant> = {}) => mk('B', { side: 'enemies', hp: 30, maxHp: 30, ...p });
function field(positions: Record<string, Offset>, parts: Combatant[] = [A(), B()], variantId = 'merdiven-yuruyen'): BattleState {
  const { state } = startBattle('d', 'd-z-zemin', parts.map((c) => ({ ...c, initiativeBonus: 0 })),
    scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map: { id: 'dungeon', variantId } });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  return { ...state, status: 'active', turnIndex: state.order.indexOf('A'), combatants };
}
const run = (s: BattleState, cmd: Parameters<typeof execute>[1]) => {
  const r = execute(s, cmd, P1, scripted([10, 10]));
  if (!r.ok) throw new Error(r.error);
  return r;
};
const slides = (ev: BattleEvent[]) => ev.filter((e) => e.type === 'pushed' && e.by === 'conveyor');
const CONV = [o(12, 3), o(13, 3), o(12, 4), o(13, 4)];

describe('yürüyen merdiven (Kuyruk 21 D2b)', () => {
  it('varyant yalnızca kısa kolu geçersiz kılar; eski merdiven varyantı aynı', () => {
    const old = getMap('dungeon', { variantId: 'merdiven' }).tiles;
    const neu = getMap('dungeon', { variantId: 'merdiven-yuruyen' }).tiles;
    for (let r = 0; r < old.length; r++) for (let c = 0; c < 15; c++) {
      const isConv = CONV.some((h) => h.col === c && h.row === r);
      expect(neu[r]![c], `${c},${r}`).toBe(isConv ? 'Y' : old[r]![c]);
    }
    expect(old.join('')).not.toContain('Y');
    const raw = RAW_MAPS.find((m) => m.id === 'dungeon')!;
    expect(raw.variants.find((v) => v.id === 'merdiven')?.objects).toBeUndefined();
    expect(getMap('dungeon', { variantId: 'merdiven' }).objects).toEqual([]);
    expect(getMap('dungeon', { variantId: 'merdiven-yuruyen' }).objects.map((x) => x.kind)).toEqual(['lever']);
  });
  it('yokuş yukarı adım bir altıgen geri kayar; hareket harcanır', () => {
    const s = field({ A: o(12, 5), B: o(2, 4) });
    expect(conveyorFlow(s)).toBe(5);
    expect(isUphillStep(s, o(12, 5), o(12, 4))).toBe(true);
    const r = run(s, { type: 'move', actorId: 'A', to: o(12, 4) });
    expect(slides(r.events)).toHaveLength(1);
    expect(r.state.combatants.A?.pos).toEqual(o(12, 5));
    expect(r.state.combatants.A?.movementUsed).toBe(1);
  });
  it('aşağı yürüyüş serbest; yol bulma yukarı kenarı geçilmez sayar (yapay zekâ uzun yolu seçer)', () => {
    const s = field({ A: o(12, 2), B: o(2, 4) });
    const down = run(s, { type: 'move', actorId: 'A', to: o(12, 5) });
    expect(slides(down.events)).toHaveLength(0);
    expect(down.state.combatants.A?.pos).toEqual(o(12, 5));
    const cost = moveCostFn(s, s.combatants.A as Combatant);
    expect(cost(o(12, 4), o(12, 5))).toBeNull();
    expect(cost(o(12, 4), o(12, 3))).not.toBeNull();
    // Basamaktan üst sahanlığa yukarı adım da yokuş (en üst basamakta duran yukarı çıkamaz).
    expect(cost(o(12, 2), o(12, 3))).toBeNull();
    const top = run(field({ A: o(12, 3), B: o(2, 4) }), { type: 'move', actorId: 'A', to: o(12, 2) });
    expect(slides(top.events)).toHaveLength(1);
    expect(top.state.combatants.A?.pos).toEqual(o(12, 3));
    // Yukarı sahanlığa çok adımlı yolda kayma yok: ya uzun yol ya da yol yok.
    const up = execute(field({ A: o(12, 5), B: o(2, 4) }), { type: 'move', actorId: 'A', to: o(12, 2) }, P1, scripted([10, 10]));
    if (up.ok) expect(slides(up.events)).toHaveLength(0);
  });
  it('uçan muaf; kol çekilince merdiven durur', () => {
    const fly = field({ A: o(12, 5), B: o(2, 4) }, [A({ fly: 6 }), B()]);
    const f = run(fly, { type: 'move', actorId: 'A', to: o(12, 4) });
    expect(slides(f.events)).toHaveLength(0);
    expect(f.state.combatants.A?.pos).toEqual(o(12, 4));
    const s = field({ A: o(12, 5), B: o(2, 4) });
    const lever = s.map?.objects?.find((x) => x.kind === 'lever');
    expect(lever?.at).toEqual(o(13, 5));
    expect(terrainInfo(s, o(12, 4))).toContain('yürüyen merdiven');
    const pulled = run(s, { type: 'object_use', actorId: 'A', objectId: lever!.id, action: 'pull' });
    expect(conveyorFlow(pulled.state)).toBeNull();
    expect(terrainInfo(pulled.state, o(12, 4))).toContain('durdu');
    const r = run(pulled.state, { type: 'move', actorId: 'A', to: o(12, 4) });
    expect(slides(r.events)).toHaveLength(0);
    expect(r.state.combatants.A?.pos).toEqual(o(12, 4));
  });
  it('atlayışın iniş altıgeni Y ise kayar', () => {
    const s = field({ A: o(12, 1), B: o(2, 4) }, [A({ strScore: 14 }), B()]);
    const r = run(s, { type: 'jump', actorId: 'A', to: o(12, 3) });
    expect(slides(r.events)).toHaveLength(1);
    expect(r.state.combatants.A?.pos).toEqual(o(12, 4));
  });
  it('kural yoksa Y sıradan basamak (eski davranış)', () => {
    const s = field({ A: o(12, 5), B: o(2, 4) });
    const noRule = { ...s, map: { ...s.map!, variantId: 'merdiven' } };
    expect(conveyorFlow(noRule)).toBeNull();
  });
});
