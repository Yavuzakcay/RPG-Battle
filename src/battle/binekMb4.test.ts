/**
 * Kuyruk MB4 (kural sürümü 72; `harita/belgeler/BINEK-PLAN.md` §15): çok altıgenli (multiHex) binek gövdesi. Görev 0: maddeler
 * önce sürüm 72 durumunda sınandı; başarısız olanlar (gövdenin dışına inme ve düşme, dar geçit nedeni, yığın boyu gövdede, zorla
 * varışta B24) düzeltildi; ötekiler K69 + MB1/MB3 ile zaten doğruydu ve burada kilitlenir. 71'de (ve anahtar kapalıyken) eski davranış.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { absBand, mutlakFt } from './vertical';
import { adjacent3D } from './adjacency';
import { bodyOf, covers, footprintOf } from './body';
import { mountProblem } from './mounted';
import { occupantAt } from './movement';
import { GM, P1, mk } from './fixtures';
import { distance, type Offset } from '../rules/hex';
import { footprint } from '../rules/footprint';
import type { MapDikey } from '../map/maps';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';
import reasons from '../../data/neden-metinleri.json';
import { hexCenter, tokenCenter } from '../ui/mapView';

const o = (col: number, row = 3): Offset => ({ col, row });
const lo: Rng = () => 0.5;
const open = () => Array.from({ length: 7 }, () => '.'.repeat(15));
const SAVES = (n: number) => ({ str: n, dex: n, con: n, int: n, wis: n, cha: n });
const sword: AttackOption = { label: 'Longsword', attackBonus: 9, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'longsword' };
const claw = { name: 'Claw', bonus: 4, damageDice: '1d6+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
const inBody = (fp: Offset[], h: Offset | null | undefined) => !!h && fp.some((x) => x.col === h.col && x.row === h.row);

interface Opts { tiles?: string[]; dikey?: MapDikey; pos?: Record<string, [Offset, number?]>; multiHex?: boolean }
/** 15×7 düz harita, çok altıgen açık: A binici (3,3), H binek (6,3; varsayılan Huge, 7 altıgen), B düşman (11,3). Sıra A, H, B. */
function scene(v: number, a: Partial<Combatant> = {}, h: Partial<Combatant> = {}, b: Partial<Combatant> = {}, op: Opts = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', size: 'M', speed: 30, hp: 40, maxHp: 40, weaponOptions: [sword], ...a }),
    mk('H', { ownerId: 'p1', size: 'H', speed: 60, hp: 60, maxHp: 60, ...h }),
    mk('B', { side: 'enemies', hp: 50, maxHp: 50, weaponOptions: [sword], ...b }),
  ];
  const s0 = startBattle('b', 'd-z-zemin', parts, lo, { kuralSurumu: v, map: { id: 'col', variantId: 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const cs = { ...s0.combatants };
  const pos = { A: [o(4)], H: [o(6)], B: [o(11)], ...op.pos } as Record<string, [Offset, number?]>;
  for (const [id, [p, alt]] of Object.entries(pos)) cs[id] = { ...(cs[id] as Combatant), pos: p, ...(alt ? { altitudeFt: alt } : {}) };
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, order: ['A', 'H', 'B'], turnIndex: 0, combatants: cs, multiHex: op.multiHex ?? true,
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
const C = (s: BattleState, id: string) => s.combatants[id] as Combatant;
/** `data/neden-metinleri.json` motor kalıbı bu metni karşılıyor mu (TR → EN çevirisi var). */
const hasPattern = (text: string) => (reasons as { motor: Array<{ kalip: string }> }).motor.some((p) => new RegExp(p.kalip).test(text));

describe('MB4: gövde ve binicinin yeri (sürüm 72)', () => {
  it('Large binek 3, Huge binek 7 altıgen kaplar; binici bineğin çapasında, ayrı hücre kaplamaz', () => {
    const L = mountUp(scene(72, {}, { size: 'L' }, {}, { pos: { A: [o(5)] } }));
    expect(bodyOf(L, C(L, 'H'))).toHaveLength(3);
    const s = mountUp(scene(72));
    expect(bodyOf(s, C(s, 'H'))).toHaveLength(7);
    expect(C(s, 'A').pos).toEqual(C(s, 'H').pos);
    expect(footprintOf(s, C(s, 'A'))).toEqual([o(6)]);
    for (const h of bodyOf(s, C(s, 'H'))) expect(occupantAt(s, h)?.id).toBe('H');
  });

  it('gövdenin çapa dışındaki bir altıgenine bitişikten binilir (çapaya 2 altıgen)', () => {
    const s = scene(72, {}, {}, {}, { pos: { A: [o(4)] } });
    expect(distance(o(4), o(6))).toBe(2);
    expect(mountProblem(s, C(s, 'A'), 'H')).toBeNull();
    const r = run(s, { type: 'mount', actorId: 'A', mountId: 'H' });
    expect(riding(r.state)).toBe('H');
    expect(chain(s, r.events)).toEqual(r.state);
    // Gövdeye bitişik değilse binilmez.
    expect(mountProblem(scene(72, {}, {}, {}, { pos: { A: [o(3)] } }), C(scene(72, {}, {}, {}, { pos: { A: [o(3)] } }), 'A'), 'H')).toMatch(/bitişik/);
  });

  it('inişte binici gövdenin dışına, gövdeye bitişik boş altıgene iner; gövdenin içine inilmez', () => {
    const s = mountUp(scene(72));
    const fp = bodyOf(s, C(s, 'H'));
    const r = run(s, { type: 'dismount', actorId: 'A' });
    const at = C(r.state, 'A').pos;
    expect(inBody(fp, at)).toBe(false);
    expect(Math.min(...fp.map((h) => distance(h, at as Offset)))).toBe(1);
    expect(chain(s, r.events)).toEqual(r.state);
    // Elle seçilen: çapaya 2 altıgen ama gövdeye bitişik → geçerli; gövdenin içindeki altıgen → geçersiz.
    expect(err(s, { type: 'dismount', actorId: 'A', to: o(8) })).toBeNull();
    expect(err(s, { type: 'dismount', actorId: 'A', to: o(7) })).not.toBeNull();
  });

  it('düşen binici gövdenin dışına düşer (Prone binek, başarısız DEX 10)', () => {
    const s = mountUp(scene(72, { saves: SAVES(-20) }));
    const r = run(s, { type: 'set_condition', targetId: 'H', condition: 'Prone', present: true } as Command);
    expect(riding(r.state)).toBeUndefined();
    expect(inBody(bodyOf(r.state, C(r.state, 'H')), C(r.state, 'A').pos)).toBe(false);
    expect(occupantAt(r.state, C(r.state, 'A').pos as Offset)?.id).toBe('A');
  });
});

describe('MB4: hareket, fırsat saldırısı, itme (sürüm 72)', () => {
  it('bineğin gövdesi sığmayan dar geçitte hareket reddedilir; neden metninin EN kalıbı var', () => {
    // 6. sütunda tek altıgenlik geçit (satır 3): Large gövde (3 altıgen) sığmaz.
    const tiles = Array.from({ length: 7 }, (_, r) => (r === 3 ? '...............' : '........#......'));
    const s = mountUp(scene(72, {}, { size: 'L' }, {}, { tiles, pos: { A: [o(5)], H: [o(6)], B: [o(13, 0)] } }));
    const e = err(turn(s, 'H'), { type: 'move', actorId: 'H', to: o(10) });
    expect(e).not.toBeNull();
    expect(e, e as string).toMatch(/^Dar geçit/);
    expect(hasPattern(e as string)).toBe(true);
  });

  it('binekli gövde yürür, binici çapayla taşınır; fırsat saldırısı yalnız bineğe (gövdeden erişim)', () => {
    // B gövdenin doğu altıgenine bitişik (çapaya 2): gövde batıya uzaklaşınca erişimden çıkar.
    const s = mountUp(scene(72, {}, {}, { attacks: [claw] }, { pos: { B: [o(8)] } }));
    const b0 = turn(s, 'H');
    const r = run(b0, { type: 'move', actorId: 'H', to: o(3) });
    const opp = r.events.filter((e) => e.type === 'attack_resolved' && e.opportunity);
    expect(opp.length).toBe(1);
    expect(opp.every((e) => e.type === 'attack_resolved' && e.targetId === 'H')).toBe(true);
    expect(C(r.state, 'A').pos).toEqual(o(3));
    expect(riding(r.state)).toBe('H');
    expect(chain(b0, r.events)).toEqual(r.state);
  });

  it('itilen gövde binicisiyle gider (binici çapada kalır)', () => {
    const s = mountUp(scene(72, { saves: SAVES(20) }, { size: 'L', saves: SAVES(-20) }, { size: 'L' }, { pos: { A: [o(5)], H: [o(6)], B: [o(8)] } }));
    const b0 = turn(s, 'B');
    const r = run(b0, { type: 'shove', actorId: 'B', targetId: 'H', effect: 'push' });
    expect(r.events.some((e) => e.type === 'pushed' && e.targetId === 'H')).toBe(true);
    expect(riding(r.state)).toBe('H');
    expect(C(r.state, 'A').pos).toEqual(C(r.state, 'H').pos);
    expect(C(r.state, 'H').pos).not.toEqual(o(6));
    expect(chain(b0, r.events)).toEqual(r.state);
  });
});

describe('MB4: irtifa, tavan, ışınlanma (sürüm 72)', () => {
  it('uçan Huge binekte binicinin bandı bineğin çapa bandı (3 düzey); 15 ft\'teki düşman gövdenin kenarından bitişik', () => {
    const s = mountUp(scene(72, {}, { fly: 60 }));
    const up = run(turn(s, 'H'), { type: 'vertical_move', actorId: 'H', toFt: 10 } as Command).state;
    expect(C(up, 'A').altitudeFt).toBe(10);
    expect(absBand(up, C(up, 'A'))).toEqual(absBand(up, C(up, 'H')));
    const withB = { ...up, combatants: { ...up.combatants, B: { ...C(up, 'B'), pos: o(8), fly: 60, altitudeFt: 15 } } };
    expect(adjacent3D(withB, C(withB, 'B'), C(withB, 'H'))).toBe(true);
  });

  it('engebeli zeminde binicinin mutlak yüksekliği bineğinki (ayak altı bineğin gövdesinin en yüksek zemini)', () => {
    const heights = Array.from({ length: 7 }, (_, r) => Array.from({ length: 15 }, (_, c) => (r === 3 && c === 7 ? 1 : 0)));
    const s0 = mountUp(scene(72));
    const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), heights } };
    expect(mutlakFt(s, C(s, 'H'))).toBeGreaterThan(0);
    expect(mutlakFt(s, C(s, 'A'))).toBe(mutlakFt(s, C(s, 'H')));
    const s71 = { ...s, kuralSurumu: 71 };
    expect(mutlakFt(s71, C(s71, 'A'))).toBe(0);
  });

  it('tavanı alçak altıgen gövdenin çapa dışındaki bir altıgeninde olsa da yığın sığmaz (B11 gövdede)', () => {
    // Huge 15 ft + binici 5 ft = 20 ft; (9,3) tavanı 15 ft: çapa (8,3) olursa gövdenin doğu altıgeni (9,3).
    const dikey = { tavan: { '9,3': 15 } } as MapDikey;
    const s = mountUp(scene(72, {}, {}, {}, { dikey }));
    expect(err(turn(s, 'H'), { type: 'move', actorId: 'H', to: o(8) })).not.toBeNull();
    // Binicisiz Huge (15 ft) sığar.
    expect(err(turn(scene(72, {}, {}, {}, { dikey }), 'H'), { type: 'move', actorId: 'H', to: o(8) })).toBeNull();
    // Gövdesi tavanın altında duran bineğe binilmez.
    const under = scene(72, {}, {}, {}, { dikey, pos: { A: [o(11)], H: [o(9)], B: [o(13)] } });
    expect(err(under, { type: 'mount', actorId: 'A', mountId: 'H' })).toMatch(/Tavan alçak/);
  });

  it('ışınlanan binici iner (B24); bineğin ışınlanma varışında gövde ve yığın sığmalı', () => {
    const steed = { size: 'L', summon: { by: 'A', spellId: 'find-steed', spell: 'Find Steed', level: 2, turn: 'after-owner', choice: 'fey', mount: {} } } as Partial<Combatant>;
    const dikey = { tavan: { '9,1': 10 } } as MapDikey;
    const s = mountUp(scene(72, {}, steed, {}, { dikey, pos: { A: [o(5)], H: [o(6)] } }));
    // Gövdenin (8,1) çapasında doğu altıgeni (9,1): tavan 10 ft < Large 10 + binici 5.
    expect(footprint(o(8, 1), 'L').some((h) => h.col === 9 && h.row === 1)).toBe(true);
    expect(err(turn(s, 'H'), { type: 'steed_action', actorId: 'H', kind: 'fey-step', to: o(8, 1) })).not.toBeNull();
    const ok = run(turn(s, 'H'), { type: 'steed_action', actorId: 'H', kind: 'fey-step', to: o(10, 5) });
    expect(riding(ok.state)).toBe('H');
    expect(C(ok.state, 'A').pos).toEqual(o(10, 5));
  });

  it('zorla varışta yığın gövdenin bir altıgeninde sığmıyorsa binici save\'siz gövdenin dışına iner (B24); binek itildiği yerde', () => {
    const mk0 = (dikey?: MapDikey) => mountUp(scene(72, { saves: SAVES(20) }, { size: 'L', saves: SAVES(-20) }, { size: 'L' }, { dikey, pos: { A: [o(5)], H: [o(6)], B: [o(8)] } }));
    const free = run(turn(mk0(), 'B'), { type: 'shove', actorId: 'B', targetId: 'H', effect: 'push' });
    const D = C(free.state, 'H').pos as Offset;
    const back = footprint(D, 'L').find((h) => !inBody(footprint(o(6), 'L'), h)) as Offset;
    const s = mk0({ tavan: { [`${back.col},${back.row}`]: 10 } } as MapDikey);
    const b0 = turn(s, 'B');
    const r = run(b0, { type: 'shove', actorId: 'B', targetId: 'H', effect: 'push' });
    expect(C(r.state, 'H').pos).toEqual(D);
    expect(riding(r.state)).toBeUndefined();
    expect(inBody(bodyOf(r.state, C(r.state, 'H')), C(r.state, 'A').pos)).toBe(false);
    expect(r.events.some((e) => e.type === 'save_resolved' && e.label === 'Binekten düşme')).toBe(false);
    expect(chain(b0, r.events)).toEqual(r.state);
  });

  it('kazma ve tırmanma kuralları gövdeyle (B13, B14): binicili Huge binek kazamaz ve duvara tırmanamaz', () => {
    const s = mountUp(scene(72, {}, { burrowFt: 20 }));
    expect(err(turn(s, 'H'), { type: 'vertical_move', actorId: 'H', toFt: -5 } as Command)).not.toBeNull();
    const tiles = Array.from({ length: 7 }, () => '........s......');
    const c = mountUp(scene(72, {}, {}, {}, { tiles }));
    expect(err(turn(c, 'H'), { type: 'vertical_move', actorId: 'H', toFt: 10 } as Command)).not.toBeNull();
  });

  it('arayüz: binicinin jetonu (rozeti) bineğin çapa altıgeninde', () => {
    const s = mountUp(scene(72, {}, { size: 'L' }, {}, { pos: { A: [o(5)] } }));
    expect(tokenCenter(s, C(s, 'A'))).toEqual(hexCenter(C(s, 'H').pos as Offset));
  });

  it('alan büyüsü binek ve biniciyi ayrı ve birer kez sayar (gövdenin birçok altıgeni alanda)', () => {
    const m = mountUp(scene(72, {}, {}, { spellSlots: [0, 0, 1, 0, 0, 0, 0, 0, 0], spellNames: ['Fireball'], spellSaveDc: 13, spellMod: 3 }));
    const b0 = turn(m, 'B');
    const r = run(b0, { type: 'cast_spell', actorId: 'B', spellName: 'Fireball', targetHex: o(6, 1) } as Command);
    const saved = r.events.filter((e) => e.type === 'save_resolved' && e.label !== 'Binekten düşme').map((e) => (e.type === 'save_resolved' ? e.targetId : ''));
    expect(saved.filter((x) => x === 'A')).toHaveLength(1);
    expect(saved.filter((x) => x === 'H')).toHaveLength(1);
    expect(chain(b0, r.events)).toEqual(r.state);
  });
});

describe('MB4: eski sürüm ve anahtar kapalı', () => {
  it('71 (çok altıgen açık): Huge bineğin çapasının komşuları gövdede, iniş eskisi gibi reddedilir', () => {
    const s = mountUp(scene(71));
    expect(err(s, { type: 'dismount', actorId: 'A' })).not.toBeNull();
  });
  it('72 anahtar kapalı: tek altıgen binek, iniş çapanın komşusuna (71 ile aynı)', () => {
    const s72 = mountUp(scene(72, {}, {}, {}, { multiHex: false, pos: { A: [o(5)] } }));
    const s71 = mountUp(scene(71, {}, {}, {}, { multiHex: false, pos: { A: [o(5)] } }));
    const r72 = run(s72, { type: 'dismount', actorId: 'A' });
    const r71 = run(s71, { type: 'dismount', actorId: 'A' });
    expect(r72.events).toEqual(r71.events);
    expect(covers(s72, C(s72, 'H'), o(7))).toBe(false);
  });
});
