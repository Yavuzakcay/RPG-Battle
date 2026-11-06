/**
 * Kuyruk K54 G2: Hızır Yemini (kural sürümü 25): Tam Zamanında, Muhtaç Sezgisi, Dar Gün Aurası, Yetişen Mucize, Yetişen Yol.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster, combatantFromSheet, startBattle } from './create';
import { getMonster } from '../data';
import { applyEvents, replay } from './reduce';
import { GM, P1, mk } from './fixtures';
import { makeObject } from './objects';
import { afterAttackReactions } from './reactions';
import { needSensed } from './imza54';
import { passiveAuraOf } from './auraCore';
import './imza54';
import { blankCharacter } from '../rules/builder';
import { distance } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const low: Rng = () => 0.01;
const mid: Rng = () => 0.5;
const o = (col: number, row: number) => ({ col, row });
const monk = (level: number) => combatantFromSheet({ ...blankCharacter('im').sheet, name: 'Hızır', raceId: 'human', classId: 'paladin', subclassId: 'imza_hizir', level, gender: 'kadin',
  baseScores: { str: 16, dex: 10, con: 14, int: 10, wis: 12, cha: 16 }, weapons: [{ name: 'Longsword' }] } as CharacterSheet, { id: 'A', ownerId: 'p1' });

function arena(level: number, opts: { kuralSurumu?: number; B?: ReturnType<typeof o>; C?: ReturnType<typeof o>; ogre?: boolean } = {}) {
  const B = opts.ogre ? { ...combatantFromMonster(getMonster('ogre'), { id: 'B' }), side: 'enemies' as const } : mk('B', { side: 'enemies', hp: 60, maxHp: 60, monsterId: 'bandit', saves: { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 } });
  const s0 = startBattle('im', 'k54', [monk(level), mk('C', { ownerId: 'p1', hp: 10, maxHp: 30 }), B], () => 0.5, {
    map: { id: 'col' }, houseRules: { imza_hizir: true }, ...(opts.kuralSurumu ? { kuralSurumu: opts.kuralSurumu } : {}) }).state;
  const combatants = { ...s0.combatants };
  const place: Record<string, { col: number; row: number }> = { A: o(3, 3), B: opts.B ?? o(4, 3), C: opts.C ?? o(0, 0) };
  for (const [id, p] of Object.entries(place)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const state: BattleState = { ...s0, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants,
    map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 9 }, () => '.'.repeat(15)), objects: [], zones: [] } };
  const run = {
    state, events: [{ type: 'battle_started', state } as BattleEvent],
    do(cmd: Command, rng: Rng = mid) {
      const r = execute(run.state, cmd, P1, rng);
      if (!r.ok) throw new Error(r.error);
      run.state = r.state; run.events.push(...r.events);
      return r.events;
    },
    try: (cmd: Command, rng: Rng = mid) => execute(run.state, cmd, P1, rng),
    c: (id: string) => run.state.combatants[id] as Combatant,
  };
  return run;
}
const _use = (f: string, targetId?: string, to?: { col: number; row: number }): Command => ({ type: 'use_feature', actorId: 'A', feature: `imza:imza_bilge/${f}`, ...(targetId ? { targetId } : {}), ...(to ? { to } : {}) });

const attack = (r: ReturnType<typeof arena>, rng: Rng = () => 0.99) => {
  const res = execute({ ...r.state, turnIndex: 1 }, { type: 'monster_attack', actorId: 'B', targetId: 'C', attackIndex: 0 }, GM, rng);
  if (!res.ok) throw new Error(res.error);
  r.state = res.state; r.events.push(...res.events);
  return res.events;
};
describe('K54 Hızır Yemini', () => {
  it('Tam Zamanında: dost hedef alınınca paladin yanına ışınlanır, saldırı ona yönelir; Kanal Gücü harcanır', () => {
    const r = arena(3, { ogre: true, B: o(6, 3), C: o(7, 3) });
    const cd = r.c('A').resources.channelDivinity ?? 0;
    expect(cd).toBeGreaterThan(0);
    const ev = attack(r);
    expect(ev.some((e) => e.type === 'reaction_used' && e.reaction === 'imza-tam-zamaninda')).toBe(true);
    expect(ev.some((e) => e.type === 'teleported' && e.actorId === 'A')).toBe(true);
    expect(r.c('C').hp).toBe(10);
    expect(r.c('A').resources.channelDivinity).toBe(cd - 1);
    expect(r.c('A').effects?.some((e) => e.id === 'imza:hizir-jit:A')).toBeFalsy();
    expect(replay(r.events).combatants.A?.pos).toEqual(r.c('A').pos);
  });
  it('sürüm 24\'te Tam Zamanında yok', () => {
    const r = arena(3, { ogre: true, B: o(6, 3), C: o(7, 3), kuralSurumu: 24 });
    expect(attack(r).some((e) => e.type === 'reaction_used' && e.reaction === 'imza-tam-zamaninda')).toBe(false);
  });
  it('Muhtaç Sezgisi: 0 HP dost işaretli (120 ft)', () => {
    const r = arena(3, { C: o(6, 3) });
    expect(needSensed(r.state, r.c('C'))).toBe(false);
    r.state = { ...r.state, combatants: { ...r.state.combatants, C: { ...r.c('C'), hp: 0, life: 'dying' } } };
    expect(needSensed(r.state, r.c('C'))).toBe(true);
  });
  it('Dar Gün Aurası (7): yarı canın altındaki yakın dosta ölüm save avantajı', () => {
    const r = arena(7, { C: o(4, 4) });
    expect(passiveAuraOf(r.state, r.c('C')).deathAdv).toBe(true);
    const far = arena(7, { C: o(9, 3) });
    expect(passiveAuraOf(far.state, far.c('C')).deathAdv).toBe(false);
  });
  it('Yetişen Mucize (15): 0 HP\'ye düşen dost 1 HP\'de kalır, kaynak harcanır', () => {
    const r = arena(15, { C: o(6, 3), B: o(7, 3) });
    r.state = { ...r.state, combatants: { ...r.state.combatants, C: { ...r.c('C'), hp: 0, life: 'dying' }, A: { ...r.c('A'), effects: [] } } };
    const ev = afterAttackReactions(r.state, 'B', 'C', { events: [], hit: true, ac: 10, damage: 12 }, { melee: true, damageType: 'slashing', dealt: 12 }, mid);
    const s = applyEvents(r.state, ev);
    expect(s.combatants.C?.hp).toBe(1);
    expect(s.combatants.A?.resources.imzaMucize).toBe(0);
    expect(s.combatants.A?.hp).toBeLessThan(r.c('A').hp);
  });
  it('Yetişen Yol (20): Adım ile dostun yanına ışınlanma, turda bir', () => {
    const r = arena(20, { C: o(10, 3) });
    r.do({ type: 'use_feature', actorId: 'A', feature: 'imza:imza_hizir/hastening-road' });
    r.do({ type: 'use_feature', actorId: 'A', feature: 'imza:imza_hizir/road-step', targetId: 'C' });
    expect(distance(r.c('A').pos!, o(10, 3))).toBe(1);
    expect(r.try({ type: 'use_feature', actorId: 'A', feature: 'imza:imza_hizir/road-step', targetId: 'C' }).ok).toBe(false);
  });
});
