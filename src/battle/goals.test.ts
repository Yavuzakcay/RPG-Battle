/**
 * Görev S3: hedef sistemi. Hedefsiz savaş eskisi gibi; reach/destroy/survive/retrieve/protect, all/any, fail koşulları,
 * kilitleme (`goal_changed`), taşıyıcı düşünce nesne yere, harita verisinden hedefler, replay.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { replay } from './reduce';
import { goalHexes, goalOutcome, goalsFromData } from './goals';
import { objectAt } from './objectData';
import type { Offset } from '../rules/hex';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, Goals } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high = () => 0.99;
const club: AttackOption = { label: 'Sopa', attackBonus: 20, damage: '1d2+40', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'x' };

function arena(goals?: Goals): BattleState {
  const a = mk('A', { ownerId: 'p1', hp: 30, maxHp: 30 });
  const b = mk('B', { side: 'enemies', hp: 500, maxHp: 500 });
  const st = startBattle('s3', 'd-z-zemin', [a, b], () => 0.5, { map: { id: 'col' } }).state;
  const at = { A: o(3, 3), B: o(10, 3) };
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: at[id as 'A'] ?? null }]));
  return { ...st, status: 'active', order: ['A', 'B'], turnIndex: 0, round: 1, combatants, ...(goals ? { goals } : {}),
    map: { ...(st.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)), zones: [], objects: [] } } as BattleState;
}
function run(s: BattleState, cmd: Command, ctx = P1) {
  const r = execute(s, cmd, ctx, high);
  if (!r.ok) throw new Error(r.error);
  return r;
}
const fresh = (s: BattleState): BattleState => { const a = s.combatants.A as Combatant; return { ...s, combatants: { ...s.combatants, A: { ...a, economy: { ...a.economy, action: false, bonus: false, attacksLeft: 0 } } } }; };
const finished = (evs: BattleEvent[]) => evs.find((e) => e.type === 'battle_finished') as { winner: string } | undefined;
/** Sıradaki tur bitimleri: A, B, A… (`n` kez). */
function endTurns(s: BattleState, n: number) {
  const evs: BattleEvent[] = [];
  for (let i = 0; i < n && s.status === 'active'; i++) {
    const id = s.order[s.turnIndex] as string;
    const r = run(s, { type: 'end_turn', actorId: id }, id === 'A' ? P1 : GM);
    s = r.state; evs.push(...r.events);
  }
  return { state: s, events: evs };
}

describe('hedefsiz savaş', () => {
  it('goals yoksa eski kural: düşman ayaktayken savaş sürer, olay eklenmez', () => {
    const r = endTurns(arena(), 4);
    expect(r.state.status).toBe('active');
    expect(r.events.some((e) => e.type === 'goal_changed')).toBe(false);
  });
});

describe('hedef türleri', () => {
  it('reach (any): bir kahraman altıgene ulaşınca kilitlenir ve parti kazanır; replay aynı', () => {
    const s0 = arena({ mode: 'all', list: [{ id: 'k', kind: 'reach', hexes: [o(5, 3)] }] });
    expect(goalHexes(s0)).toEqual([o(5, 3)]);
    const r = run(s0, { type: 'move', actorId: 'A', to: o(5, 3) });
    expect(r.events.find((e) => e.type === 'goal_changed')).toMatchObject({ goalId: 'k', status: 'done' });
    expect(finished(r.events)?.winner).toBe('party');
    expect(replay([{ type: 'battle_started', state: s0 }, ...r.events])).toEqual(r.state);
  });
  it('destroy: nesne yıkılınca; all(destroy, survive) yalnızca ikisi de olunca', () => {
    let s = arena({ mode: 'all', list: [{ id: 'd', kind: 'destroy', objectId: 'chest:1' }, { id: 's', kind: 'survive', rounds: 1 }] });
    s = run(s, { type: 'place_object', kind: 'chest', at: o(4, 3) }, GM).state;
    const hit = run(fresh(s), { type: 'attack_object', actorId: 'A', objectId: 'chest:1', option: club });
    expect(objectAt(hit.state, o(4, 3))).toBeUndefined();
    expect(hit.state.goals?.status).toEqual({ d: 'done' });
    expect(hit.state.status).toBe('active');
    const later = endTurns(hit.state, 2);
    expect(later.state.goals?.status?.s).toBe('done');
    expect(later.state.winner).toBe('party');
  });
  it('any: biri yeter; fail rounds: süre dolunca düşman kazanır', () => {
    const s = arena({ mode: 'any', list: [{ id: 'k', kind: 'reach', hexes: [o(14, 0)] }, { id: 'v', kind: 'survive', rounds: 5 }], fail: [{ kind: 'rounds', rounds: 1 }] });
    const r = endTurns(s, 2);
    expect(r.state.winner).toBe('enemies');
    expect(goalOutcome(r.state)).toBe('enemies');
  });
  it('protect (nesne): yıkılınca kilitli başarısız, düşman kazanır', () => {
    let s = arena({ mode: 'all', list: [{ id: 'p', kind: 'protect', objectId: 'chest:1', rounds: 3 }] });
    s = run(s, { type: 'place_object', kind: 'chest', at: o(4, 3) }, GM).state;
    const r = run(fresh(s), { type: 'attack_object', actorId: 'A', objectId: 'chest:1', option: club });
    expect(r.state.goals?.status?.p).toBe('failed');
    expect(r.state.winner).toBe('enemies');
  });
  it('protect (masumlar, tur sınırsız) + defeat: korunanlar ayaktaysa yenince kazanılır', () => {
    const s = arena({ mode: 'all', list: [{ id: 'p', kind: 'protect' }, { id: 'y', kind: 'defeat' }] });
    expect(goalOutcome(s)).toBeNull();
    const dead = { ...s, combatants: { ...s.combatants, B: { ...(s.combatants.B as Combatant), hp: 0, life: 'dead' as const } } };
    expect(goalOutcome(dead)).toBe('party');
  });
  it('retrieve: sandığı al, çıkışa taşı; taşıyıcı düşerse sandık yere düşer', () => {
    let s = arena({ mode: 'all', list: [{ id: 'r', kind: 'retrieve', objectId: 'chest:1', hexes: [o(0, 3)] }] });
    s = run(s, { type: 'place_object', kind: 'chest', at: o(4, 3) }, GM).state;
    const took = run(s, { type: 'object_use', actorId: 'A', objectId: 'chest:1', action: 'take' });
    expect(took.state.map?.objects?.[0]?.carriedBy).toBe('A');
    expect(objectAt(took.state, o(4, 3))).toBeUndefined();
    const down = { ...took.state, combatants: { ...took.state.combatants, A: { ...(took.state.combatants.A as Combatant), hp: 0, life: 'dying' as const } } };
    const drop = run(down, { type: 'end_turn', actorId: 'A' });
    expect(drop.state.map?.objects?.[0]).toMatchObject({ at: o(3, 3) });
    expect(drop.state.map?.objects?.[0]?.carriedBy).toBeUndefined();
    const go = run(took.state, { type: 'move', actorId: 'A', to: o(0, 3) });
    expect(go.state.winner).toBe('party');
    expect(replay([{ type: 'battle_started', state: s }, ...took.events, ...go.events])).toEqual(go.state);
  });
});

describe('harita verisi', () => {
  it('1 tabanlı altıgenler 0 tabanlıya; kimliksiz hedefe sıra kimliği', () => {
    const g = goalsFromData({ mode: 'any', list: [{ kind: 'reach', hexes: [[2, 3]] }, { kind: 'destroy', objectId: 'door:1' }], fail: [{ kind: 'alarm', rounds: 6 }] });
    expect(g).toEqual({ mode: 'any', list: [{ id: 'g1', kind: 'reach', hexes: [o(1, 2)] }, { id: 'g2', kind: 'destroy', objectId: 'door:1' }], fail: [{ kind: 'alarm', rounds: 6 }] });
    const s = { ...arena(g), alarmRound: 1, round: 7 } as BattleState;
    expect(goalOutcome(s)).toBe('enemies');
  });
});

describe('yapay zekâ', () => {
  it('ulaşabildiği hedef altıgene yürür; vurabildiği hedef nesneye vurur; sandığı alır', async () => {
    const { chooseCommand } = await import('./ai');
    const reach = arena({ mode: 'any', list: [{ id: 'k', kind: 'reach', hexes: [o(6, 3)] }] });
    expect(chooseCommand(reach)).toMatchObject({ type: 'move', to: o(6, 3) });
    let d = arena({ mode: 'all', list: [{ id: 'd', kind: 'destroy', objectId: 'chest:1' }] });
    d = run(d, { type: 'place_object', kind: 'chest', at: o(4, 3) }, GM).state;
    const armed = { ...d, combatants: { ...d.combatants, A: { ...(d.combatants.A as Combatant), weaponOptions: [club] } } };
    expect(chooseCommand(armed)).toMatchObject({ type: 'attack_object', objectId: 'chest:1' });
    const r = { ...armed, goals: { mode: 'all' as const, list: [{ id: 'r', kind: 'retrieve' as const, objectId: 'chest:1', hexes: [o(0, 3)] }] } };
    expect(chooseCommand(r)).toMatchObject({ type: 'object_use', action: 'take' });
  });
});
