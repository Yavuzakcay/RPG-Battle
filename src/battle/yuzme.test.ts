/** KQ6-8 (kural sürümü 82): yüzücü canavarlar suya konur, suda hareket eder. */
import { describe, expect, it } from 'vitest';
import { createMapBattle, planParticipants } from '../app/setup';
import { demoCharacters } from '../screens/fixtures';
import { getMonster } from '../data';
import { execute } from './commands';
import { moveCostFn, terrainAt } from './movement';
import { speedHexes, replay } from './reduce';
import type { Offset } from '../rules/hex';
import { GM } from './fixtures';
import derin from '../../data/derin-su.json';
import yuzme from '../../data/yuzme-hizi.json';
import { listedSwimmer } from './deepWater';
import type { BattleState, Combatant } from './types';

const sess = (monster: string, version?: number) => {
  const chars = demoCharacters();
  const plan = { party: chars.map((c) => ({ id: c.id, sheet: c.sheet })), enemies: [{ monster: getMonster(monster), count: 1 }], mapId: 'orman-heykel-golu', variantId: 'gunduz' } as never;
  const s = createMapBattle(planParticipants(plan), plan, () => 0.5).state;
  return (version ? { ...s, kuralSurumu: version } : s) as BattleState;
};
const waterHex = (s: BattleState, tile = 'w'): Offset => {
  const t = s.map?.tiles ?? [];
  for (let r = 0; r < t.length; r++) for (let c = 0; c < (t[0]?.length ?? 0); c++) if (t[r]?.[c] === tile) return { col: c, row: r };
  throw new Error('su yok');
};
const foe = (s: BattleState) => Object.values(s.combatants).find((c) => c.side === 'enemies') as Combatant;

describe('KQ6-8: yüzücü canavarlar', () => {
  it('veri: yüzme hızı tablosu derin-su.json yüzücü listeleriyle aynı küme; Octopus 30, Giant Octopus 60 ft; ikisi de yüzücü', () => {
    expect(Object.keys(yuzme.hiz).sort()).toEqual([...new Set([...derin.swimmers, ...derin.swimmers66])].sort());
    expect((yuzme.hiz as Record<string, number>).octopus).toBe(30); expect((yuzme.hiz as Record<string, number>)['giant-octopus']).toBe(60);
    for (const id of ['octopus', 'giant-octopus', 'merrow', 'reef-shark', 'giant-crab']) expect(listedSwimmer({ monsterId: id }, { kuralSurumu: 82 }), id).toBe(true);
  });
  it('kurulum: Octopus su altıgenine konur (GM); sürüm 81 ve karadaki yüzemeyen (Wolf) için su altıgeni reddedilir', () => {
    const s = sess('octopus'); const w = waterHex(s); const o = foe(s);
    expect(o.swimFt).toBe(30);
    expect(execute(s, { type: 'place', actorId: o.id, at: w } as never, GM, () => 0.5).ok).toBe(true);
    expect(execute({ ...s, kuralSurumu: 81 }, { type: 'place', actorId: o.id, at: w } as never, GM, () => 0.5).ok).toBe(false);
    const wolf = sess('wolf'); expect(execute(wolf, { type: 'place', actorId: foe(wolf).id, at: waterHex(wolf) } as never, GM, () => 0.5).ok).toBe(false);
  });
  it('savaş: Octopus karadan suya girer, suda 30 ft (6 altıgen) hareket eder; Giant Octopus 60 ft; sürüm 81\'de karadaki hız 5 ft ve su zorlu', () => {
    for (const [id, ft] of [['octopus', 30], ['giant-octopus', 60]] as const) {
      const s0 = sess(id); const w = waterHex(s0);
      const placed = execute(s0, { type: 'place', actorId: foe(s0).id, at: w } as never, GM, () => 0.5);
      if (!placed.ok) throw new Error(placed.error);
      const started = execute(placed.state, { type: 'start_battle' } as never, GM, () => 0.5);
      if (!started.ok) throw new Error(started.error);
      const c = foe(started.state);
      expect(c.inWater).toBe(true);
      expect(speedHexes(c)).toBe(ft / 5);
      const cost = moveCostFn(started.state, c)(waterHex(started.state, 'n'), w);
      expect(cost, id).toBe(1);
      expect(replay([{ type: 'battle_started', state: s0 } as never, ...placed.events, ...started.events])).toEqual(started.state);
    }
    const old = { ...sess('octopus', 81) };
    const c81 = foe(old);
    expect(c81.inWater).toBeUndefined(); expect(speedHexes(c81)).toBe(1);
    expect(moveCostFn(old, c81)(waterHex(old), { col: 0, row: 0 })).toBe(2);
    expect(terrainAt(old, waterHex(old)).rule).toBe('deepWater');
  });
});
