/**
 * Kuyruk 16 K16D: yapay zekâ hedef paketi. Devriye yürüyüşü (rota, durak, fark edince alarm ve rota biter), hedef
 * taşıyıcısını/çıkışı kesme (öncelik ve yol kapatma), barut fıçısı (alanında ≥ 2 kahraman, 0 müttefik). Yalnızca ilgili
 * verisi olan haritada; replay aynı.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, mk } from './fixtures';
import { applyEvents, replay } from './reduce';
import { formGroupsEvent } from './alarm';
import { chooseCommand, objectiveRunner } from './ai';
import { presetObjects } from './objects';
import type { Offset } from '../rules/hex';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, Goals, SleepGroup } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const club: AttackOption = { label: 'Sopa', attackBonus: 5, damage: '1d6', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'x' };
const bow: AttackOption = { label: 'Yay', attackBonus: 5, damage: '1d6', damageType: 'piercing', ranged: true, spell: false, tag: 'y', range: [80, 320] };

function arena(opts: { pos: Record<string, Offset>; groups?: SleepGroup[]; goals?: Goals; objects?: Parameters<typeof presetObjects>[0]; house?: Record<string, boolean>; order?: string[]; extra?: Combatant[] }): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, weaponOptions: [club] }),
    mk('A2', { ownerId: 'p1', hp: 30, maxHp: 30, weaponOptions: [club] }),
    mk('B', { side: 'enemies', hp: 30, maxHp: 30, weaponOptions: [club, bow], speed: 30, attacks: [{ name: 'Bite', bonus: 4, damageDice: '1d6', damageType: 'piercing', repeat: 1, ranged: false, reachFt: 5, text: 'Bite' }] }),
    ...(opts.extra ?? []),
  ];
  const st = startBattle('k16d', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
  const order = opts.order ?? ['B', 'A', 'A2', ...(opts.extra ?? []).map((c) => c.id)];
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, x]) => [id, { ...(x as Combatant), pos: opts.pos[id] ?? null }]));
  const s0 = {
    ...st, status: 'active', order, turnIndex: 0, round: 1, combatants, houseRules: opts.house ?? {},
    ...(opts.groups ? { groups: opts.groups } : {}), ...(opts.goals ? { goals: opts.goals } : {}),
    map: { ...(st.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)), zones: [], objects: presetObjects(opts.objects ?? []) },
  } as BattleState;
  return opts.groups ? applyEvents(s0, [formGroupsEvent(s0) as BattleEvent]) : s0;
}
const ok = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, GM, () => 0.5); if (!r.ok) throw new Error(r.error); return r; };

describe('devriye', () => {
  const route = [o(13, 5), o(14, 1)];
  const patrol = (at: Offset = o(8, 3)): SleepGroup => ({ id: 'devriye', state: 'calm', hexes: [at], route, routeIndex: 0, pause: 1 });
  it('habersiz devriye üyesi turunu atlamaz, rotadaki noktaya kendi hızıyla yürür; varınca sıradaki nokta ve durak', () => {
    const s = arena({ pos: { A: o(0, 0), A2: o(0, 1), B: o(8, 3) }, groups: [patrol()] });
    expect(s.combatants.B?.unaware).toBe(true);
    const cmd = chooseCommand(s);
    expect(cmd.type).toBe('move');
    const r = ok(s, cmd);
    const b = r.state.combatants.B as Combatant;
    expect(Math.abs((b.pos as Offset).col - 13) + Math.abs((b.pos as Offset).row - 5)).toBeLessThan(Math.abs(8 - 13) + Math.abs(3 - 5));
    // Habersiz üye saldıramaz; yalnızca yürür.
    expect(execute(s, { type: 'attack', actorId: 'B', targetId: 'A', option: club }, GM, () => 0.5).ok).toBe(false);
    // Noktaya bitişik yürüyüş: sıradaki nokta ve bekleme.
    const near = arena({ pos: { A: o(0, 0), A2: o(0, 1), B: o(12, 5) }, groups: [patrol(o(12, 5))] });
    const step = chooseCommand(near);
    const r2 = ok(near, step);
    const ev = r2.events.find((e) => e.type === 'patrol_moved') as Extract<BattleEvent, { type: 'patrol_moved' }>;
    expect(ev).toMatchObject({ groupId: 'devriye', index: 1, waitUntil: 2 });
    expect(r2.state.groups?.[0]?.routeIndex).toBe(1);
    // Durakta: 1. turda bekler, 2. turda sıradaki noktaya yürür.
    const waiting = { ...r2.state, round: 1, turnIndex: r2.state.order.indexOf('B') } as BattleState;
    expect(chooseCommand(waiting).type).toBe('end_turn');
    expect(chooseCommand({ ...waiting, round: 2 }).type).toBe('move');
    expect(replay([{ type: 'battle_started', state: near }, ...r2.events])).toEqual(r2.state);
  });
  it('fark edince (görüş, 60 ft) alarm: rota biter, grup uyanık kalır', () => {
    const s = arena({ pos: { A: o(13, 3), A2: o(14, 3), B: o(8, 3) }, groups: [patrol()] });
    const r = ok(s, chooseCommand(s));
    const alarm = r.events.find((e) => e.type === 'group_alarmed');
    expect(alarm).toBeTruthy();
    expect(r.state.groups?.[0]?.state).toBe('alarmed');
    expect(r.state.combatants.B?.unaware).toBeFalsy();
  });
  it('rotasız habersiz grup eskisi gibi bekler (turu atlanır)', () => {
    const s = arena({ pos: { A: o(0, 0), A2: o(0, 1), B: o(8, 3) }, groups: [{ id: 'g', state: 'calm', hexes: [o(8, 3)] }] });
    expect(chooseCommand(s).type).toBe('end_turn');
  });
});

describe('taşıyıcı ve çıkış', () => {
  const reach: Goals = { mode: 'any', list: [{ id: 'kule', kind: 'reach', hexes: [o(14, 0)] }] };
  it('açık "ulaş" hedefinde çıkışa en yakın kahraman koşucudur; saldırı önceliği ona', () => {
    const s = arena({ pos: { A: o(9, 2), A2: o(11, 2), B: o(10, 2) }, goals: reach });
    expect(objectiveRunner(s)?.id).toBe('A2');
    const cmd = chooseCommand(s);
    expect(cmd).toMatchObject({ type: 'monster_attack', targetId: 'A2' });
    // Hedefsiz haritada en yakın (A) önce.
    const plain = arena({ pos: { A: o(9, 2), A2: o(11, 2), B: o(10, 2) } });
    expect(objectiveRunner(plain)).toBeNull();
    expect(chooseCommand(plain)).toMatchObject({ type: 'monster_attack', targetId: 'A' });
  });
  it('taşıyıcı varsa o koşucu; yetişemiyorsa yol kapatmak için koşucuya/çıkışa yürür', () => {
    const goals: Goals = { mode: 'any', list: [{ id: 'al', kind: 'retrieve', objectId: 'sandik', hexes: [o(0, 0)] }] };
    const s0 = arena({ pos: { A: o(5, 1), A2: o(14, 6), B: o(14, 0) }, goals, objects: [{ id: 'sandik', kind: 'chest', at: o(5, 2) }] });
    const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), objects: s0.map?.objects?.map((x) => ({ ...x, carriedBy: 'A' })) } } as BattleState;
    expect(objectiveRunner(s)?.id).toBe('A');
    const s2 = s;
    const cmd = chooseCommand(s2);
    expect(cmd.type).toBe('move');
    const r = ok(s2, cmd);
    const d = (p: Offset) => Math.max(Math.abs(p.col - 5), Math.abs(p.row - 1));
    expect(d(r.state.combatants.B?.pos as Offset)).toBeLessThan(d(o(14, 0)));
  });
});

describe('barut fıçısı', () => {
  const keg = [{ id: 'barut', kind: 'powderKeg', at: o(10, 3) }];
  it('alanında 2 kahraman ve hiç müttefik yokken menzildeki fıçıya saldırır', () => {
    const s = arena({ pos: { A: o(10, 2), A2: o(11, 3), B: o(4, 3) }, objects: keg, house: { barutPatlama: true } });
    expect(chooseCommand(s)).toMatchObject({ type: 'attack_object', objectId: 'barut' });
  });
  it('müttefik alandaysa, tek kahraman varsa ya da patlama kuralı kapalıysa fıçıya saldırmaz', () => {
    const ally = mk('C', { side: 'enemies', hp: 20, maxHp: 20 });
    const withAlly = arena({ pos: { A: o(10, 2), A2: o(11, 3), B: o(4, 3), C: o(9, 4) }, objects: keg, house: { barutPatlama: true }, extra: [ally] });
    expect(chooseCommand(withAlly).type).not.toBe('attack_object');
    const one = arena({ pos: { A: o(10, 2), A2: o(1, 6), B: o(4, 3) }, objects: keg, house: { barutPatlama: true } });
    expect(chooseCommand(one).type).not.toBe('attack_object');
    const off = arena({ pos: { A: o(10, 2), A2: o(11, 3), B: o(4, 3) }, objects: keg, house: {} });
    expect(chooseCommand(off).type).not.toBe('attack_object');
  });
});
