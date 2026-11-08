/**
 * Kuyruk K68a (kural sürümü 52): dikey geometri düzeltmeleri. Yarığa itilen tek düşme (derinlik kadar, eksi irtifa);
 * Levitate biten yarığın dibine süzülür; enkaz uçuş dahil her hızı 0'lar, Freedom of Movement 5 ft ile kurtulur; yapı
 * yüksekliği nesne verisinden (harita nesnesi ezer); Sleet Storm silindiri 40 ft, Fog/Stinking Cloud tepesi yarıçap (yukarı
 * slot dahil); atlamada uçurum/yarık boşluk. Her madde için sürüm 51 eski davranış sabitlenir. `run` replay'i denetler.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { GM, mk, P1 } from './fixtures';
import { execute, replay } from './index';
import { seededRng } from '../rules/dice';
import { caster, field, run } from './k19spells.test';
import { fissureAt, fissureBudget } from './fissure';
import { forcedMoveEvents, pushOutcome } from './forced';
import { isBuried, structuresIn } from './quake';
import { applyEvents, speedHexes } from './reduce';
import { mechanicsAt } from './spellVersion';
import { zoneTopFt } from './altitude';
import { zoneSpecOf } from './zones';
import { directionTo, type Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command, MapObject, SpellZone } from './types';

const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const HIGH = { str: 30, dex: 30, con: 30, int: 30, wis: 30, cha: 30 };
const SLOTS = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const SP = (n: string) => spells.find((s) => s.name === n) as NonNullable<(typeof spells)[number]>;
const wiz = (p: Partial<Combatant> = {}) => caster({ spellNames: ['Earthquake', 'Sleet Storm', 'Fog Cloud', 'Stinking Cloud'], spellSlots: SLOTS, concentration: null, hp: 300, maxHp: 300, saves: HIGH, ...p });
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 300, maxHp: 300, saves: LOW, ...p });
const gm = (s: BattleState, cmd: Command) => {
  const r = execute(s, cmd, GM, seededRng(3));
  if (!r.ok) throw new Error(r.error);
  expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  return r;
};
const falls = (evs: BattleEvent[], id: string) => evs.filter((e): e is Extract<BattleEvent, { type: 'map_effect' }> => e.type === 'map_effect' && e.rule === 'fall' && e.targetId === id);
/** Açık yarık (col 8–9) ve kenarına kaymış F0 (save'i geçti); sürüm `ver`. */
function opened(ver: number) {
  const s = field([wiz(), foe('F0', { saves: HIGH }), foe('F1')], { A: { col: 1, row: 3 }, F0: { col: 8, row: 2 }, F1: { col: 8, row: 5 } }, ver);
  const q = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Earthquake', targetHex: { col: 7, row: 3 } } as Command);
  const p = run(q.state, { type: 'spell_followup', actorId: 'A', targetId: fissureBudget(q.state, q.state.combatants.A as Combatant)!.quake.id, targetHex: { col: 8, row: 3 }, choice: 'fissure:4' } as Command);
  return run(p.state, { type: 'end_turn', actorId: 'A' } as Command).state;
}
const depthOf = (s: BattleState) => fissureAt(s, { col: 8, row: 0 })?.fissure?.depthFt as number;

describe('K68a yarığa zorla itme', () => {
  const push = (ver: number) => {
    const s = opened(ver);
    const f0 = s.combatants.F0 as Combatant;
    expect(fissureAt(s, f0.pos as Offset)).toBeUndefined();
    const to = { col: 8, row: (f0.pos as Offset).row };
    const out = pushOutcome(s, f0, f0.pos as Offset, to);
    if (!out.ok) throw new Error(out.reason);
    const evs = forcedMoveEvents(s, 'F0', out, 'A', seededRng(5));
    const after = applyEvents(s, evs);
    const next = gm(after, { type: 'end_turn', actorId: after.order[after.turnIndex] as string } as Command);
    return { s, out, push: falls(evs, 'F0'), later: falls(next.events, 'F0'), state: next.state };
  };
  it('sürüm 52: tek düşme, yarığın derinliği kadar (derinlik/10 × d6), eksi irtifa; komut sonunda ikinci düşme yok', () => {
    const r = push(52);
    const depth = depthOf(r.s);
    expect(r.out).toMatchObject({ kind: 'fall', fallFeet: depth });
    expect(r.push).toHaveLength(1);
    expect(r.push[0]?.damage?.rolls).toHaveLength(depth / 10);
    expect(r.later).toHaveLength(0);
    expect(r.state.combatants.F0?.altitudeFt).toBe(-depth);
  });
  it('sürüm 51 (eski davranış, sabit): 30 ft uçurum düşmesi ve komut sonunda ikinci yarık düşmesi', () => {
    const r = push(51);
    expect(r.out).toMatchObject({ kind: 'chasm', fallFeet: 30 });
    expect(r.push).toHaveLength(1);
    expect(r.push[0]?.damage?.rolls).toHaveLength(3);
    expect(r.later).toHaveLength(1);
    expect(r.state.combatants.F0?.altitudeFt).toBe(-depthOf(r.s));
  });
});

describe('K68a Levitate biten yarığın üstünde', () => {
  const glide = (ver: number) => {
    const s = opened(ver);
    // Yarık üstünde (8,0) 10 ft'te süzülen, Levitate'i biten (yumuşak iniş işareti) parti üyesi.
    const p = mk('P', { ownerId: 'p1', hp: 100, maxHp: 100 });
    const withP: BattleState = { ...s, combatants: { ...s.combatants, P: { ...p, pos: { col: 8, row: 0 } } }, order: [...s.order, 'P'] };
    const up = applyEvents(withP, [{ type: 'altitude_changed', targetId: 'P', altitudeFt: 10, label: 'Levitate', gentle: true }]);
    return gm(up, { type: 'end_turn', actorId: up.order[up.turnIndex] as string } as Command);
  };
  it('sürüm 52: süzülerek yarığın dibine iner: hasarsız, Prone yok, irtifa −derinlik', () => {
    const r = glide(52);
    const depth = depthOf(r.state);
    const p = r.state.combatants.P as Combatant;
    expect(falls(r.events, 'P')).toHaveLength(0);
    expect(p.hp).toBe(100);
    expect(p.conditions).not.toContain('Prone');
    expect(p.altitudeFt).toBe(-depth);
  });
  it('sürüm 51 (eski davranış, sabit): 0\'a süzülür, sonra yarığa hasarla düşer', () => {
    const r = glide(51);
    expect(falls(r.events, 'P')).toHaveLength(1);
    expect((r.state.combatants.P as Combatant).hp).toBeLessThan(100);
  });
});

describe('K68a enkaz altı', () => {
  const obj = (id: string, kind: MapObject['kind'], at: Offset, hp: number, extra: Partial<MapObject> = {}): MapObject => ({ id, kind, at, hp, ...(kind === 'door' ? { state: 'closed' as const } : {}), ...extra });
  const buried = (ver: number, p: Partial<Combatant> = {}) => {
    const s0 = field([wiz(), foe('F0', p), foe('F1')], { A: { col: 1, row: 3 }, F0: { col: 9, row: 2 }, F1: { col: 12, row: 5 } }, ver);
    const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), objects: [obj('door', 'door', { col: 9, row: 3 }, 18)] } };
    return run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Earthquake', targetHex: { col: 7, row: 3 } } as Command).state;
  };
  it('sürüm 52: uçuş hızı olan da hareket edemez (her hız 0); sürüm 51\'de uçarak hareket eder (eski)', () => {
    const f52 = buried(52, { fly: 30 }).combatants.F0 as Combatant;
    expect(isBuried(f52)).toBe(true);
    expect(speedHexes(f52)).toBe(0);
    const f51 = buried(51, { fly: 30 }).combatants.F0 as Combatant;
    expect(isBuried(f51)).toBe(true);
    expect(speedHexes(f51)).toBeGreaterThan(0);
  });
  it('sürüm 52: Freedom of Movement hız 0\'ı aşmaz; 5 ft harcayarak eylemsiz kurtulur. Sürüm 51: FoM ile yürür (eski)', () => {
    const fom = { id: 'spells:freedom-of-movement', name: 'Freedom of Movement', sourceId: 'F0', freeMove: true as const };
    const s52 = buried(52, { effects: [fom] });
    const f52 = s52.combatants.F0 as Combatant;
    expect(speedHexes(f52)).toBe(0);
    const turn = { ...s52, turnIndex: 1 } as BattleState;
    const e = gm(turn, { type: 'escape', actorId: 'F0' } as Command);
    const after = e.state.combatants.F0 as Combatant;
    expect(isBuried(after)).toBe(false);
    expect(after.movementUsed).toBe(1);
    expect(after.economy.action).toBe(false);
    expect(e.events.some((x) => x.type === 'grapple_escape')).toBe(false);
    const f51 = buried(51, { effects: [fom] }).combatants.F0 as Combatant;
    expect(isBuried(f51)).toBe(true);
    expect(speedHexes(f51)).toBeGreaterThan(0);
  });
});

describe('K68a yapı yüksekliği verisi', () => {
  const obj = (id: string, kind: MapObject['kind'], at: Offset, extra: Partial<MapObject> = {}): MapObject => ({ id, kind, at, hp: 18, ...extra });
  const spec = (s: BattleState) => mechanicsAt(s, SP('Earthquake')).zone?.structures as NonNullable<NonNullable<ReturnType<typeof mechanicsAt>['zone']>['structures']>;
  const all = (s: BattleState) => s.map?.tiles.flatMap((row, r) => [...row].map((_, c) => ({ col: c, row: r }))) ?? [];
  const at = (ver: number, objects: MapObject[]) => { const s0 = field([wiz(), foe('F0')], { A: { col: 1, row: 3 }, F0: { col: 12, row: 5 } }, ver); return { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), objects } } as BattleState; };
  it('sürüm 52: yükseklik nesne türünden (kapı 10, kale kapısı 15), harita nesnesi ezer (30 ft çökme yarıçapı 3); sandık yapı değil', () => {
    const s = at(52, [obj('a', 'door', { col: 3, row: 1 }), obj('b', 'gate', { col: 4, row: 1 }), obj('c', 'door', { col: 5, row: 1 }, { yukseklikFt: 30 }), obj('d', 'chest', { col: 6, row: 1 })]);
    const st = structuresIn(s, all(s), spec(s));
    expect(Object.fromEntries(st.map((x) => [x.obj?.id, x.heightFt]))).toEqual({ a: 10, b: 15, c: 30 });
  });
  it('sürüm 51 (eski): büyü tablosu, ezme yok sayılır', () => {
    const s = at(51, [obj('c', 'door', { col: 5, row: 1 }, { yukseklikFt: 30 })]);
    expect(structuresIn(s, all(s), spec(s)).map((x) => x.heightFt)).toEqual([10]);
  });
});

describe('K68a silindir ve küre yüksekliği', () => {
  const cast = (ver: number, name: string, slotLevel?: number) => {
    const s = field([wiz(), foe('F0')], { A: { col: 1, row: 3 }, F0: { col: 13, row: 6 } }, ver);
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: name, targetHex: { col: 8, row: 3 }, ...(slotLevel ? { slotLevel } : {}) } as Command);
    const z = r.state.map?.zones?.find((x) => x.spellId === SP(name).id) as SpellZone;
    return zoneTopFt(z, zoneSpecOf(z));
  };
  it('sürüm 52: Sleet Storm 40 ft; Fog Cloud 20 ft, 3. seviye slotta 60 ft; Stinking Cloud 20 ft', () => {
    expect(cast(52, 'Sleet Storm')).toBe(40);
    expect(cast(52, 'Fog Cloud')).toBe(20);
    expect(cast(52, 'Fog Cloud', 3)).toBe(60);
    expect(cast(52, 'Stinking Cloud')).toBe(20);
  });
  it('sürüm 51 (eski): hepsi varsayılan 20 ft (yukarı slotta da)', () => {
    expect(cast(51, 'Sleet Storm')).toBe(20);
    expect(cast(51, 'Fog Cloud', 3)).toBe(20);
  });
  it('sürüm 52: Sleet Storm 30 ft\'te uçan alanda (save); 45 ft\'teki dışında', () => {
    const s = field([wiz(), foe('F0', { fly: 60, altitudeFt: 30 }), foe('F1', { fly: 60, altitudeFt: 45 })], { A: { col: 1, row: 3 }, F0: { col: 8, row: 3 }, F1: { col: 8, row: 4 } }, 52);
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Sleet Storm', targetHex: { col: 8, row: 3 } } as Command);
    const ex = { ...r.state, turnIndex: 1, order: ['A', 'F0', 'F1'] } as BattleState;
    const t0 = gm(ex, { type: 'end_turn', actorId: 'F0' } as Command);
    expect(t0.events.some((e) => e.type === 'save_resolved' && e.targetId === 'F1')).toBe(false);
  });
});

describe('K68a atlamada uçurum ve yarık', () => {
  // Satır 2–3 boyunca yarık (`u`); A (7,1) → (7,4): arada 2 altıgen (10 ft).
  const A0 = { col: 7, row: 1 }; const TO = { col: 7, row: 4 };
  const jumper = (ver: number, p: Partial<Combatant> = {}) => {
    const s0 = field([mk('A', { ownerId: 'p1', strScore: 16, ...p }), foe('F0')], { A: A0, F0: { col: 13, row: 6 } }, ver);
    const tiles = s0.map!.tiles.map((row, r) => (r === 2 || r === 3 ? 'u'.repeat(row.length) : row));
    return { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles } } as BattleState;
  };
  const jump = (s: BattleState) => execute(s, { type: 'jump', actorId: 'A', to: TO } as Command, P1, seededRng(3));
  const running = (s: BattleState) => ({ ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), run: { dir: directionTo(A0, TO) as number, hexes: 2 } } } }) as BattleState;
  const JUMP = { effects: [{ id: 'spells:jump', name: 'Jump', sourceId: 'A', jumpFt: 30 }] };
  it('sürüm 52: 10 ft yarık koşarak Long Jump ile (STR 16) ve Jump büyüsüyle atlanır; koşusuz (8 ft) yetmez', () => {
    const r = jump(running(jumper(52)));
    expect(r.ok ? '' : r.error).toBe('');
    expect(jump(jumper(52)).ok).toBe(false);
    const r2 = jump(jumper(52, JUMP));
    expect(r2.ok ? '' : r2.error).toBe('');
  });
  it('sürüm 51 (eski): yarık engel sayılır, atlanamaz (Jump büyüsüyle de iki altıgen)', () => {
    expect(jump(running(jumper(51))).ok).toBe(false);
    expect(jump(jumper(51, JUMP)).ok).toBe(false);
  });
});
