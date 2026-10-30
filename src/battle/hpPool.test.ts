/**
 * Görev A1: ortak can havuzu. Üyeye gelen hasar havuzdan düşer, iyileştirme havuza eklenir (en çok azami), havuz 0
 * olunca bütün üyeler düşer; aynı komutta birden çok üyeye gelen hasar ayrı ayrı düşülür; yeniden oynatma aynı durum.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { applyEvents, replay } from './reduce';
import { poolSyncEvents } from './hpPool';
import { GM, P1, mk } from './fixtures';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const sword: AttackOption = { label: 'Longsword', attackBonus: 4, damage: '1d8+2', damageType: 'slashing', ranged: false, spell: false,
  tag: 'longsword', weaponId: 'longsword', weaponDamage: '1d8', abilityMod: 2 };

function arena() {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, weaponOptions: [sword], attacksPerAction: 1 }),
    mk('S1', { side: 'enemies', hp: 12, maxHp: 12 }),
    mk('S2', { side: 'enemies', hp: 12, maxHp: 12 }),
    mk('S3', { side: 'enemies', hp: 12, maxHp: 12 }),
  ];
  const started = startBattle('a1', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } });
  const pos: Record<string, Offset> = { A: o(3, 3), S1: o(4, 3), S2: o(6, 3), S3: o(8, 3) };
  const combatants = { ...started.state.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const tiles = Array.from({ length: 7 }, () => '.'.repeat(15));
  const state: BattleState = { ...started.state, status: 'active', order: ['A', 'S1', 'S2', 'S3'], turnIndex: 0, combatants,
    map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles } };
  return new Run(state);
}

class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, ctx: CommandContext = P1, rng: Rng = () => 0.5) {
    const r = execute(this.state, cmd, ctx, rng);
    if (!r.ok) throw new Error(r.error);
    this.state = r.state; this.events.push(...r.events);
    return r.events;
  }
  hp(id: string) { return this.state.combatants[id]!.hp; }
  pool() { return this.state.hpPools?.['havuz-1']; }
}

const swarm = () => { const r = arena(); r.do({ type: 'create_hp_pool', memberIds: ['S1', 'S2', 'S3'], label: 'Sürü' }, GM); return r; };

describe('ortak can havuzu', () => {
  it('kurulum: yalnızca Game Master; HP ve azami üyelerin toplamı; üyelerin HP\'si havuzunki', () => {
    const r = arena();
    expect(execute(r.state, { type: 'create_hp_pool', memberIds: ['S1', 'S2'] }, P1, () => 0.5).ok).toBe(false);
    expect(execute(r.state, { type: 'create_hp_pool', memberIds: ['S1'] }, GM, () => 0.5).ok).toBe(false);
    r.do({ type: 'create_hp_pool', memberIds: ['S1', 'S2', 'S3'] }, GM);
    expect(r.pool()).toMatchObject({ hp: 36, max: 36 });
    for (const id of ['S1', 'S2', 'S3']) expect([r.hp(id), r.state.combatants[id]!.maxHp, r.state.combatants[id]!.poolId]).toEqual([36, 36, 'havuz-1']);
    expect(execute(r.state, { type: 'create_hp_pool', memberIds: ['S1', 'A'] }, GM, () => 0.5).ok).toBe(false);
  });
  it('hasar: üyeye gelen hasar havuzdan düşer, komut sonunda bütün üyeler havuzun HP\'sini gösterir', () => {
    const r = swarm();
    const ev = r.do({ type: 'attack', actorId: 'A', targetId: 'S1', option: sword }, P1, high);
    const hit = ev.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(hit.hit).toBe(true);
    expect(r.pool()!.hp).toBe(36 - hit.appliedDamage);
    for (const id of ['S1', 'S2', 'S3']) expect(r.hp(id)).toBe(36 - hit.appliedDamage);
    expect(ev.at(-1)).toMatchObject({ type: 'hp_pool_synced', hp: 36 - hit.appliedDamage });
  });
  it('aynı komutta iki üyeye gelen hasar (komut başındaki HP\'den hesaplanmış) ayrı ayrı düşer', () => {
    const r = swarm();
    // Alan büyüsü gibi: iki hedefin hasarı aynı başlangıç HP'sinden (36) hesaplanır.
    let s = applyEvents(r.state, [
      { type: 'hp_adjusted', targetId: 'S1', hpAfter: 26, life: 'alive' },
      { type: 'hp_adjusted', targetId: 'S2', hpAfter: 29, life: 'alive' },
    ]);
    expect(s.hpPools!['havuz-1']!.hp).toBe(19);
    s = applyEvents(s, poolSyncEvents(s));
    expect(['S1', 'S2', 'S3'].map((id) => s.combatants[id]!.hp)).toEqual([19, 19, 19]);
    expect(poolSyncEvents(s)).toEqual([]);
  });
  it('iyileştirme havuza eklenir, en çok azami', () => {
    const r = swarm();
    r.do({ type: 'adjust_hp', targetId: 'S2', hp: 20 }, GM);
    expect(r.pool()!.hp).toBe(20);
    r.do({ type: 'adjust_hp', targetId: 'S3', hp: 30 }, GM);
    expect(r.pool()!.hp).toBe(30);
    expect(r.hp('S1')).toBe(30);
    r.do({ type: 'adjust_hp', targetId: 'S1', hp: 36 }, GM);
    expect(r.pool()!.hp).toBe(36);
  });
  it('havuz 0: bütün üyeler düşer (canlı üye kalmaz), savaş biter', () => {
    const r = swarm();
    r.do({ type: 'adjust_hp', targetId: 'S2', hp: 0 }, GM);
    expect(r.pool()!.hp).toBe(0);
    for (const id of ['S1', 'S2', 'S3']) expect([r.hp(id), r.state.combatants[id]!.life]).toEqual([0, 'dead']);
  });
  it('yeniden oynatma aynı durumu verir', () => {
    const r = swarm();
    r.do({ type: 'attack', actorId: 'A', targetId: 'S1', option: sword }, P1, high);
    r.do({ type: 'adjust_hp', targetId: 'S3', hp: 30 }, GM);
    expect(replay(r.events)).toEqual(r.state);
  });
});
