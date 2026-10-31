/**
 * Görev S4: uyuyan gruplar ve alarm. Üyelik (alan), uyuyan/habersiz turu atlanır, tetikler (hasar, Algı, gizlenme,
 * gürültü: kırılan kapı), dezavantajlı inisiyatifle sıraya girme, komşuya haber (ev kuralı), Game Master alarmı,
 * alarm kapalı bayrağı, hedeflerde `alarm` başarısızlığı, replay.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { applyEvents, replay } from './reduce';
import { formGroupsEvent } from './alarm';
import { goalOutcome } from './goals';
import type { Offset } from '../rules/hex';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, SleepGroup } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high = () => 0.99;
const club: AttackOption = { label: 'Sopa', attackBonus: 20, damage: '1d2', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'x' };

function arena(groups: SleepGroup[], at: Record<string, Offset> = {}, flags: Record<string, boolean> = {}): BattleState {
  const a = mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, weaponOptions: [club] });
  const b = mk('B', { side: 'enemies', hp: 50, maxHp: 50 });
  const c = mk('C', { side: 'enemies', hp: 50, maxHp: 50 });
  const st = startBattle('s4', 'd-z-zemin', [a, b, c], () => 0.5, { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), B: o(12, 1), C: o(12, 5), ...at };
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, x]) => [id, { ...(x as Combatant), pos: pos[id] ?? null, initiative: id === 'A' ? 15 : 10 }]));
  const s0 = { ...st, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, round: 1, combatants, groups, houseRules: flags,
    map: { ...(st.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)), zones: [], objects: [] } } as BattleState;
  return applyEvents(s0, [formGroupsEvent(s0) as BattleEvent]);
}
function run(s: BattleState, cmd: Command, ctx = P1) {
  const r = execute(s, cmd, ctx, high);
  if (!r.ok) throw new Error(r.error);
  return r;
}
const alarmed = (evs: BattleEvent[]) => evs.filter((e) => e.type === 'group_alarmed') as Array<Extract<BattleEvent, { type: 'group_alarmed' }>>;
const G = (id: string, state: SleepGroup['state'], hexes: Offset[], links?: string[]): SleepGroup => ({ id, state, hexes, ...(links ? { links } : {}) });

describe('gruplar', () => {
  it('alandaki düşman üye olur; uyuyan ve habersiz turu atlanır', () => {
    const s = arena([G('kogus', 'asleep', [o(12, 1)]), G('avlu', 'calm', [o(12, 5)])]);
    expect(s.groups?.map((g) => g.members)).toEqual([['B'], ['C']]);
    expect(s.combatants.B?.asleep).toBe(true);
    expect(s.combatants.C?.unaware).toBe(true);
    const r = run(s, { type: 'end_turn', actorId: 'A' });
    expect(r.state.round).toBe(2);
    expect(r.state.order[r.state.turnIndex]).toBe('A');
  });
  it('hasar uyandırır: dezavantajlı inisiyatif, sıraya girer; replay aynı', () => {
    const s = arena([G('kogus', 'asleep', [o(4, 3)])], { B: o(4, 3) });
    const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: club });
    const ev = alarmed(r.events)[0];
    expect(ev).toMatchObject({ groupId: 'kogus', reason: 'hasar', byId: 'A' });
    expect(r.state.combatants.B?.asleep).toBe(false);
    expect(r.state.groups?.[0]).toMatchObject({ state: 'alarmed', alarmedRound: 1 });
    expect(r.state.alarmRound).toBe(1);
    expect(r.state.order[r.state.turnIndex]).toBe('A');
    expect(replay([{ type: 'battle_started', state: s }, ...r.events])).toEqual(r.state);
  });
  it('habersiz grup görüş çizgisindeki gizlenmemiş kahramanı fark eder; gizlenmiş olanı pasif Algıyla', () => {
    const s = arena([G('avlu', 'calm', [o(9, 3)])], { B: o(9, 3) });
    expect(alarmed(run(s, { type: 'move', actorId: 'A', to: o(4, 3) }).events)[0]).toMatchObject({ reason: 'gördü', byId: 'A' });
    const hid = { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), hidden: { dc: 30 } } } };
    expect(alarmed(run(hid, { type: 'end_turn', actorId: 'A' }).events)).toEqual([]);
  });
  it('uyuyan yalnızca yakından ve pasif −5 ile duyar', () => {
    const s = arena([G('kogus', 'asleep', [o(9, 3)])], { B: o(9, 3) });
    expect(alarmed(run(s, { type: 'move', actorId: 'A', to: o(7, 3) }).events)).toEqual([]);
    const b = s.combatants.B as Combatant;
    const sharp = { ...s, combatants: { ...s.combatants, B: { ...b, modifiers: { ...b.modifiers, wis: 10 } } } } as BattleState;
    expect(alarmed(run(sharp, { type: 'move', actorId: 'A', to: o(6, 3) }).events)).toEqual([]);
    expect(alarmed(run(sharp, { type: 'move', actorId: 'A', to: o(8, 3) }).events)[0]).toMatchObject({ reason: 'uykusunda duydu' });
  });
  it('gürültü: kırılan kapı 60 ft içindeki grubu uyandırır', () => {
    let s = arena([G('kogus', 'asleep', [o(12, 1)])]);
    s = run(s, { type: 'place_object', kind: 'door', at: o(4, 3) }, GM).state;
    const big = { ...club, damage: '1d2+40' };
    const r = run(s, { type: 'attack_object', actorId: 'A', objectId: 'door:1', option: big });
    expect(alarmed(r.events)[0]).toMatchObject({ reason: 'kapı kırıldı' });
  });
  it('komşuya haber yalnızca ev kuralıyla ve 1 tur sonra', () => {
    const groups = [G('kogus', 'asleep', [o(4, 3)], ['kule']), G('kule', 'asleep', [o(12, 5)])];
    const off = run(arena(groups, { B: o(4, 3), C: o(12, 5) }), { type: 'attack', actorId: 'A', targetId: 'B', option: club });
    expect(alarmed(off.events).map((e) => e.groupId)).toEqual(['kogus']);
    const later = (st: BattleState) => { let x = st; const evs: BattleEvent[] = []; for (let i = 0; i < 3 && x.round < 2; i++) { const id = x.order[x.turnIndex] as string; const r = run(x, { type: 'end_turn', actorId: id }, id === 'A' ? P1 : GM); x = r.state; evs.push(...r.events); } return evs; };
    expect(alarmed(later(off.state))).toEqual([]);
    const on = run(arena(groups, { B: o(4, 3), C: o(12, 5) }, { alarmKosusu: true }), { type: 'attack', actorId: 'A', targetId: 'B', option: club });
    expect(alarmed(later(on.state))[0]).toMatchObject({ groupId: 'kule', reason: 'haberci (kogus)' });
  });
  it('Game Master alarmı; alarm kapalı bayrağında tetik yok; hedefte alarm + N tur başarısızlığı', () => {
    const s = arena([G('kogus', 'asleep', [o(4, 3)])], { B: o(4, 3) });
    expect(run(s, { type: 'alarm_group', groupId: 'kogus' }, GM).state.groups?.[0]?.state).toBe('alarmed');
    expect(execute(s, { type: 'alarm_group', groupId: 'kogus' }, P1, high).ok).toBe(false);
    const quiet = run({ ...s, alarmEnabled: false }, { type: 'attack', actorId: 'A', targetId: 'B', option: club });
    expect(alarmed(quiet.events)).toEqual([]);
    const goal = { ...s, goals: { mode: 'any' as const, list: [{ id: 'k', kind: 'reach' as const, hexes: [o(14, 0)] }], fail: [{ kind: 'alarm' as const, rounds: 6 }] } };
    expect(goalOutcome({ ...goal, alarmRound: 1, round: 6 })).toBeNull();
    expect(goalOutcome({ ...goal, alarmRound: 1, round: 7 })).toBe('enemies');
  });
});
