/**
 * Kuyruk MB3 (kural sürümü 69; `harita/belgeler/BINEK-PLAN.md` §7.2 MB3, §11 MB1'in bıraktıkları): binek dikey kuralları.
 * Görev 0: her açık önce sürüm 69 durumunda başarısız testle doğrulandı; düzeltmeden sonra yeşil. 68'de eski davranış.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { adjacent3D } from './adjacency';
import { canBurrow } from './burrow';
import { cageOpenEvents } from './forcecage';
import { GM, P1, mk } from './fixtures';
import { KATLI_BINA_DIKEY, KATLI_BINA_TILES } from '../map/fixtures/katliBina';
import type { MapDikey } from '../map/maps';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, SpellZone } from './types';

const o = (col: number, row = 3): Offset => ({ col, row });
const lo: Rng = () => 0.5;
const open = () => Array.from({ length: 7 }, () => '.'.repeat(15));
const SAVES = (n: number) => ({ str: n, dex: n, con: n, int: n, wis: n, cha: n });
const sword: AttackOption = { label: 'Longsword', attackBonus: 9, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'longsword' };

interface Opts { tiles?: string[]; dikey?: MapDikey; pos?: Record<string, [Offset, number?]> }
/** 15×7 düz harita: A binici (4,3), H binek (5,3, Large), B düşman (10,3). Sıra A, H, B. */
function scene(v: number, a: Partial<Combatant> = {}, h: Partial<Combatant> = {}, b: Partial<Combatant> = {}, op: Opts = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', size: 'M', speed: 30, hp: 40, maxHp: 40, weaponOptions: [sword], ...a }),
    mk('H', { ownerId: 'p1', size: 'L', speed: 60, hp: 40, maxHp: 40, ...h }),
    mk('B', { side: 'enemies', hp: 50, maxHp: 50, weaponOptions: [sword], ...b }),
  ];
  const s0 = startBattle('b', 'd-z-zemin', parts, lo, { kuralSurumu: v, map: { id: 'col', variantId: 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const cs = { ...s0.combatants };
  const pos = { A: [o(4)], H: [o(5)], B: [o(10)], ...op.pos } as Record<string, [Offset, number?]>;
  for (const [id, [p, alt]] of Object.entries(pos)) cs[id] = { ...(cs[id] as Combatant), pos: p, ...(alt ? { altitudeFt: alt } : {}) };
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, order: ['A', 'H', 'B'], turnIndex: 0, combatants: cs,
    map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: op.tiles ?? open(), objects: [], ...(op.dikey ? { dikey: op.dikey } : {}) } };
}
const ctxOf = (s: BattleState, cmd: Command) => ('actorId' in cmd && s.combatants[cmd.actorId]?.ownerId === 'p1' ? P1 : GM);
function run(s: BattleState, cmd: Command, rng: Rng = lo): { state: BattleState; events: BattleEvent[] } {
  const r = execute(s, cmd, ctxOf(s, cmd), rng);
  if (!r.ok) throw new Error(r.error);
  return r;
}
const err = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, ctxOf(s, cmd), lo); return r.ok ? null : r.error; };
const turn = (s: BattleState, id: string): BattleState => ({ ...s, turnIndex: s.order.indexOf(id) });
const chain = (before: BattleState, evs: BattleEvent[]) => replay([{ type: 'battle_started', state: before }, ...evs]);
const mountUp = (s: BattleState) => run(s, { type: 'mount', actorId: 'A', mountId: 'H' }).state;
const riding = (s: BattleState) => s.combatants.A?.riding;
const vm = (id: string, toFt: number): Command => ({ type: 'vertical_move', actorId: id, toFt } as Command);

describe('MB3 Görev 0: açıkların doğrulanması (sürüm 69)', () => {
  it('açık 1 (B12): uçan binek Prone olup düşünce binici save\'i geçse de iki ayrı düşme (ikisi de hasar alır)', () => {
    const s = mountUp(scene(69, { saves: SAVES(20) }, { fly: 60 }));
    const up = run(turn(s, 'H'), vm('H', 20)).state;
    expect(up.combatants.A?.altitudeFt).toBe(20);
    const r = run(up, { type: 'set_condition', targetId: 'H', condition: 'Prone', present: true } as Command);
    expect(riding(r.state)).toBeUndefined();
    expect(r.state.combatants.A?.hp).toBeLessThan(40);
    expect(r.state.combatants.H?.hp).toBeLessThan(40);
    expect(r.state.combatants.A?.altitudeFt ?? 0).toBe(0);
    expect(r.events.some((e) => e.type === 'dismounted' && e.actorId === 'A' && e.fell)).toBe(true);
    expect(chain(up, r.events)).toEqual(r.state);
  });

  it('açık 2 (B11): binicili binek tavanı alçak altıgene yürüyerek ve uçarak giremez; binicisiz girer', () => {
    const dikey = { tavan: { '6,3': 10 } } as MapDikey;
    const s = mountUp(scene(69, {}, {}, {}, { dikey }));
    expect(err(turn(s, 'H'), { type: 'move', actorId: 'H', to: o(6) })).not.toBeNull();
    expect(err(turn(scene(69, {}, {}, {}, { dikey }), 'H'), { type: 'move', actorId: 'H', to: o(6) })).toBeNull();
    // Uçarak: 15 ft tavan, binek 5 ft'te (Large 10 + binici 5 = 20 > 15).
    const d15 = { tavan: { '6,3': 15 } } as MapDikey;
    const f = mountUp(scene(69, {}, { fly: 60 }, {}, { dikey: d15 }));
    const fUp = run(turn(f, 'H'), vm('H', 5)).state;
    expect(err(fUp, { type: 'move', actorId: 'H', to: o(6), toFt: 5 })).not.toBeNull();
    const g = run(turn(scene(69, {}, { fly: 60 }, {}, { dikey: d15 }), 'H'), vm('H', 5)).state;
    expect(err(g, { type: 'move', actorId: 'H', to: o(6), toFt: 5 })).toBeNull();
  });

  it('açık 3a: kat döşemesinin altına binicili binek girmez (10 ft döşeme, yığın 15 ft); bineğe döşeme altında binilmez', () => {
    const op: Opts = { tiles: KATLI_BINA_TILES, dikey: KATLI_BINA_DIKEY, pos: { A: [o(11)], H: [o(10)] } };
    const s = mountUp(scene(69, {}, {}, {}, op));
    expect(err(turn(s, 'H'), { type: 'move', actorId: 'H', to: o(7) })).not.toBeNull();
    expect(err(turn(scene(69, {}, {}, {}, op), 'H'), { type: 'move', actorId: 'H', to: o(7) })).toBeNull();
    const inside = scene(69, {}, {}, {}, { tiles: KATLI_BINA_TILES, dikey: KATLI_BINA_DIKEY, pos: { A: [o(6)], H: [o(7)] } });
    expect(err(inside, { type: 'mount', actorId: 'A', mountId: 'H' })).toMatch(/döşeme/);
  });

  it('açık 3b: Forcecage kutusu (10 ft) yığını sığdırmaz: binici dışarı itilir', () => {
    const s = mountUp(scene(69));
    const zone = { id: 'z', spellId: 'forcecage', name: 'Forcecage', casterId: 'B', dc: 15, cage: 'box', hexes: [o(5), o(6), o(5, 2), o(6, 2)] } as unknown as SpellZone;
    const evs = cageOpenEvents(s, zone);
    expect(evs.some((e) => e.type === 'pushed' && e.targetId === 'A')).toBe(true);
    expect(evs.some((e) => e.type === 'pushed' && e.targetId === 'H')).toBe(false);
  });

  it('açık 4: bineği dalan binicinin nefesi kendi tur sonunda sayılır', () => {
    const tiles = Array.from({ length: 7 }, (_, r) => (r === 3 ? '...wwwww.......' : '...............'));
    const s = mountUp(scene(69, {}, {}, {}, { tiles }));
    const dive = run(turn(s, 'H'), vm('H', -5)).state;
    expect(dive.combatants.A?.altitudeFt).toBe(-5);
    const end = run(turn(dive, 'A'), { type: 'end_turn', actorId: 'A' } as Command);
    expect(end.events.some((e) => e.type === 'map_effect' && e.rule === 'suAlti' && e.targetId === 'A')).toBe(true);
  });

  it('açık 5 (B14): tırmanma hızı olmayan binek binicisiyle duvara tırmanamaz; tırmanma hızlı binek tırmanır, binici izler', () => {
    const tiles = Array.from({ length: 7 }, () => '......s........');
    const s = mountUp(scene(69, {}, {}, {}, { tiles }));
    expect(err(turn(s, 'H'), vm('H', 10))).not.toBeNull();
    const c = mountUp(scene(69, {}, { traits: ['climber'] }, {}, { tiles }));
    const r = run(turn(c, 'H'), vm('H', 10));
    expect(r.state.combatants.A?.altitudeFt).toBe(10);
    expect(riding(r.state)).toBe('H');
  });

  it('açık 6: havadaki bineğe yerden binilmez (3B bitişiklik); uçan binici havada iner (toFt)', () => {
    const s = run(turn(scene(69, {}, { fly: 60 }), 'H'), vm('H', 20)).state;
    expect(err(turn(s, 'A'), { type: 'mount', actorId: 'A', mountId: 'H' })).not.toBeNull();
    const a = scene(69, { fly: 30 }, { fly: 60 }, {}, { pos: { A: [o(4), 20], H: [o(5), 20] } });
    const m = run(a, { type: 'mount', actorId: 'A', mountId: 'H' }).state;
    expect(riding(m)).toBe('H');
    const d = run(m, { type: 'dismount', actorId: 'A', to: o(6), toFt: 25 } as Command);
    expect(d.state.combatants.A?.altitudeFt).toBe(25);
    expect(chain(m, d.events)).toEqual(d.state);
  });

  it('açık 7: Fey Step varışında yığın sığmalı (10 ft tavan)', () => {
    const steed = { summon: { by: 'A', spellId: 'find-steed', spell: 'Find Steed', level: 2, turn: 'after-owner', choice: 'fey' } } as Partial<Combatant>;
    const s = mountUp(scene(69, {}, steed, {}, { dikey: { tavan: { '8,1': 10 } } as MapDikey }));
    expect(err(turn(s, 'H'), { type: 'steed_action', actorId: 'H', kind: 'fey-step', to: o(8, 1) })).not.toBeNull();
    expect(err(turn(s, 'H'), { type: 'steed_action', actorId: 'H', kind: 'fey-step', to: o(8, 5) })).toBeNull();
  });

  it('açık 8 (B6): binicinin dikey bandı bineğin bandı: 15 ft\'teki uçan Huge bineğin binicisine bitişik', () => {
    const s = mountUp(scene(69, {}, { size: 'H' }, { fly: 60 }, { pos: { B: [o(6), 15] } }));
    const A = s.combatants.A as Combatant, B = s.combatants.B as Combatant;
    expect(adjacent3D(s, A, B)).toBe(true);
    const r = run(turn(s, 'B'), { type: 'attack', actorId: 'B', targetId: 'A', option: sword });
    expect(r.events.some((e) => e.type === 'attack_resolved' && e.targetId === 'A')).toBe(true);
  });

  it('açık 9 (B13): binicisi üstündeki binek hiçbir yoldan kazamaz (canBurrow); kazmış bineğe binilmez', () => {
    const s = mountUp(scene(69, {}, { burrowFt: 20 }));
    expect(canBurrow(s, s.combatants.H as Combatant)).toBe(false);
    const dug = run(turn(scene(69, {}, { burrowFt: 20 }), 'H'), vm('H', -5)).state;
    expect(err(turn(dug, 'A'), { type: 'mount', actorId: 'A', mountId: 'H' })).not.toBeNull();
  });
});

describe('MB3: binekli sahneler (sürüm 69)', () => {
  it('B12: kendi uçuşu olan binici düşen binekten ayrılır ama düşmez', () => {
    const s = mountUp(scene(69, { saves: SAVES(20), fly: 30 }, { fly: 60 }));
    const up = run(turn(s, 'H'), vm('H', 20)).state;
    const r = run(up, { type: 'set_condition', targetId: 'H', condition: 'Prone', present: true } as Command);
    expect(riding(r.state)).toBeUndefined();
    expect(r.state.combatants.A?.altitudeFt).toBe(20);
    expect(r.state.combatants.A?.hp).toBe(40);
    expect(r.state.combatants.H?.hp).toBeLessThan(40);
  });

  it('havadaki binekten uçamayan binici iner ve düşer (hasar); uçamayan başka irtifada inemez', () => {
    const s = mountUp(scene(69, {}, { fly: 60 }));
    const up = run(turn(s, 'H'), vm('H', 20)).state;
    expect(err(turn(up, 'A'), { type: 'dismount', actorId: 'A', to: o(6), toFt: 10 } as Command)).toMatch(/uçabilmelisin/);
    const b0 = turn(up, 'A');
    const d = run(b0, { type: 'dismount', actorId: 'A', to: o(6) });
    expect(d.state.combatants.A?.altitudeFt ?? 0).toBe(0);
    expect(d.state.combatants.A?.hp).toBeLessThan(40);
    expect(chain(b0, d.events)).toEqual(d.state);
  });

  it('binicili binek uçarak alçalırken ve yükselirken binici hücreyi tıkamaz; replay aynı', () => {
    const s = mountUp(scene(69, {}, { fly: 60 }));
    const b0 = turn(s, 'H');
    const up = run(b0, vm('H', 20));
    const down = run(up.state, vm('H', 15));
    expect(down.state.combatants.A?.altitudeFt).toBe(15);
    expect(chain(b0, [...up.events, ...down.events])).toEqual(down.state);
  });

  it('B14: binicili binek `climb` komutuyla da tırmanamaz', () => {
    const tiles = Array.from({ length: 7 }, () => '......s........');
    const s = mountUp(scene(69, {}, {}, {}, { tiles }));
    expect(err(turn(s, 'H'), { type: 'climb', actorId: 'H', to: o(6) })).toMatch(/tırmanılamaz/);
  });
});

describe('MB3: 68 ve altı eski davranış', () => {
  it('68: binek düşünce binici bineğiyle hasarsız iner; tavanı alçak altıgene girer; havadaki bineğe yerden binilir; B6 yok', () => {
    const s = mountUp(scene(68, { saves: SAVES(20) }, { fly: 60 }));
    const up = run(turn(s, 'H'), vm('H', 20)).state;
    const r = run(up, { type: 'set_condition', targetId: 'H', condition: 'Prone', present: true } as Command);
    expect(riding(r.state)).toBe('H');
    expect(r.state.combatants.A?.hp).toBe(40);
    expect(chain(up, r.events)).toEqual(r.state);
    const low = mountUp(scene(68, {}, {}, {}, { dikey: { tavan: { '6,3': 10 } } as MapDikey }));
    expect(err(turn(low, 'H'), { type: 'move', actorId: 'H', to: o(6) })).toBeNull();
    const air = run(turn(scene(68, {}, { fly: 60 }), 'H'), vm('H', 20)).state;
    expect(err(turn(air, 'A'), { type: 'mount', actorId: 'A', mountId: 'H' })).toBeNull();
    const huge = mountUp(scene(68, {}, { size: 'H' }, { fly: 60 }, { pos: { B: [o(6), 15] } }));
    expect(adjacent3D(huge, huge.combatants.A as Combatant, huge.combatants.B as Combatant)).toBe(false);
    const dig = mountUp(scene(68, {}, { burrowFt: 20 }));
    expect(canBurrow(dig, dig.combatants.H as Combatant)).toBe(true);
  });
});
