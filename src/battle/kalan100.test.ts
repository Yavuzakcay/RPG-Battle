/**
 * Görev KALAN100 (kural sürümü 100): genel savaş denetiminden ertelenen kalanlar (harita/belgeler/GENEL-SAVAS-DENETIM.md
 * "Düzeltme durumu"). Her madde 99'da eski davranış, 100'de SRD 5.2.1; replay aynı durumu verir.
 */
import { describe, expect, it } from 'vitest';
import { execute, replay, startBattle } from './index';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './index';
import { GM, P1, mk, scripted, sword } from './fixtures';
import { KALAN100_VERSION, kalan100On } from './kalan100Surum';
import { CURRENT_RULES } from './ruleVersion';
import { highJumpFt, highJumpProblem, highJumpReachFt, moveCostFn, speedHexes, srdHighJumpFt } from './movement';
import { freeHands } from './forced';
import { chooseCommand } from './ai';
import { objectAt } from './objectData';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';

const NEW = KALAN100_VERSION;
const OLD = KALAN100_VERSION - 1;
const o = (col: number, row: number): Offset => ({ col, row });
const OPEN = Array.from({ length: 7 }, () => '.'.repeat(15));
const MODS = (str: number) => ({ str, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const fist: AttackOption = { label: 'Unarmed Strike', attackBonus: 30, damage: '1d4+3', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'unarmed', weaponId: 'unarmed-strike', reachFt: 5 };

/** Açık harita; sıra A (p1), B (düşman), C (düşman); A'nın turu. */
function field(v: number, pos: Record<string, Offset>, parts: Partial<Record<'A' | 'B' | 'C', Partial<Combatant>>> = {}): BattleState {
  const list = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, attacksPerAction: 1, weaponOptions: [sword, fist], ...parts.A }),
    mk('B', { side: 'enemies', ac: 5, hp: 60, maxHp: 60, weaponOptions: [sword], saves: LOW, ...parts.B }),
    mk('C', { side: 'enemies', ac: 5, hp: 60, maxHp: 60, weaponOptions: [sword], saves: LOW, ...parts.C }),
  ];
  const { state } = startBattle('k100', 'd-z-zemin', list, scripted([20, 20], [20, 19], [20, 18]), { map: { id: 'volkan' }, kuralSurumu: v });
  const combatants = { ...state.combatants };
  for (const id of Object.keys(combatants)) combatants[id] = { ...(combatants[id] as Combatant), pos: pos[id] ?? null };
  return { ...state, status: 'active', round: 1, order: ['A', 'B', 'C'], turnIndex: 0, combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: OPEN, zones: [], objects: [] } };
}
const withC = (s: BattleState, id: string, patch: Partial<Combatant>): BattleState =>
  ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), ...patch } } });
const grappledBy = (by: string): Partial<Combatant> => ({ conditions: ['Grappled'], grapple: { by, escapeDc: 12, restrained: false } });
type R = ReturnType<typeof execute>;
const ok = (r: R) => { if (!r.ok) throw new Error(r.error); return r; };
const run = (s: BattleState, cmd: Command, rng: Rng = () => 0.5, ctx = P1) => ok(execute(s, cmd, ctx, rng));
const replays = (start: BattleState, ...steps: Array<{ state: BattleState; events: BattleEvent[] }>) =>
  expect(replay([{ type: 'battle_started', state: start }, ...steps.flatMap((x) => x.events)])).toEqual(steps[steps.length - 1]?.state);

describe('KALAN100: sabit', () => {
  it('kural sürümü 100, güncel sürüm en az 100; 99 eski', () => {
    expect(KALAN100_VERSION).toBe(100);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(KALAN100_VERSION);
    expect(kalan100On({ kuralSurumu: 100 })).toBe(true);
    expect(kalan100On({ kuralSurumu: 99 })).toBe(false);
    expect(kalan100On(undefined)).toBe(false);
  });
});

describe('KALAN100 B20: sürüklemede Tiny / iki boy küçük istisnası (SRD s. 182 Grappled "Movable")', () => {
  const cost = (v: number, aSize: Combatant['size'], bSize: Combatant['size']) => {
    const s = field(v, { A: o(3, 3), B: o(4, 3) }, { A: { size: aSize }, B: { size: bSize, ...grappledBy('A') } });
    return moveCostFn(s, s.combatants.A as Combatant)(o(2, 3), o(3, 3));
  };
  it('100: Tiny yakalanan ek maliyetsiz; 99 iki kat', () => {
    expect(cost(NEW, 'M', 'T')).toBe(1);
    expect(cost(OLD, 'M', 'T')).toBe(2);
  });
  it('100: iki boy küçük (Large → Small) ek maliyetsiz; bir boy küçük ve aynı boy iki kat', () => {
    expect(cost(NEW, 'L', 'S')).toBe(1);
    expect(cost(NEW, 'L', 'M')).toBe(2);
    expect(cost(NEW, 'M', 'M')).toBe(2);
    expect(cost(OLD, 'L', 'S')).toBe(2);
  });
});

describe('KALAN100 B9: saldırı ekinden gelen Charmed büyüleyene saldırıyı engeller (SRD s. 178)', () => {
  const charmed = (v: number) => field(v, { A: o(3, 3), B: o(4, 3), C: o(3, 4) }, {
    A: { conditions: ['Charmed'], conditionTimers: [{ condition: 'Charmed', ownerId: 'A', end: 'turnEnd', count: 3, label: 'Enchanting Bow', sourceId: 'B' }] },
  });
  it('100: büyüleyen (B) hedef alınamaz; başka düşman (C) alınır', () => {
    const s = charmed(NEW);
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, () => 0.5);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Charmed/);
    expect(execute(s, { type: 'attack', actorId: 'A', targetId: 'C', option: sword }, P1, () => 0.5).ok).toBe(true);
  });
  it('99: eski davranış (süreli durumdan gelen Charmed saldırıyı engellemez)', () => {
    expect(execute(charmed(OLD), { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, () => 0.5).ok).toBe(true);
  });
});

describe('KALAN100 C17: Grapple boş el ister (SRD s. 190 "a hand free", s. 182 "One Grapple per Hand")', () => {
  const scene = (v: number, a: Partial<Combatant>, held: number) => {
    let s = field(v, { A: o(3, 3), B: o(4, 3), C: o(3, 4) }, { A: { modifiers: MODS(3), ...a } });
    if (held >= 1) s = withC(s, 'C', grappledBy('A'));
    if (held >= 2) {
      const d = { ...(mk('D', { side: 'enemies', hp: 10, maxHp: 10, saves: LOW }) as unknown as Combatant), ...(s.combatants.C as Combatant), id: 'D', name: 'D', pos: o(2, 3), ...grappledBy('A') };
      s = { ...s, combatants: { ...s.combatants, D: d } };
    }
    return s;
  };
  const grab = (s: BattleState) => execute(s, { type: 'grapple', actorId: 'A', targetId: 'B' }, P1, () => 0.5);
  it('100: kalkan + bir yakalama tutarken yeni yakalama yok; 99 serbest', () => {
    const s = scene(NEW, { shieldHeld: true }, 1);
    expect(freeHands(s, s.combatants.A as Combatant)).toBe(0);
    const r = grab(s);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/boş el/);
    expect(grab(scene(OLD, { shieldHeld: true }, 1)).ok).toBe(true);
  });
  it('100: kalkansız bir yakalama tutarken ikinci el boş; iki yakalama tutarken yok', () => {
    const one = scene(NEW, {}, 1);
    const r = ok(grab(one));
    expect(r.state.combatants.B?.grapple?.by).toBe('A');
    replays(one, r);
    expect(grab(scene(NEW, {}, 2)).ok).toBe(false);
  });
  it('100: silah ve kalkan taşıyan (yakalama tutmuyor) yakalayabilir (silah saldırıyla bırakılır, s. 177)', () => {
    expect(grab(scene(NEW, { shieldHeld: true }, 0)).ok).toBe(true);
  });
});

describe('KALAN100 A32: nesne etkileşimi turda tek serbest bütçe (SRD s. 13)', () => {
  const doors = (v: number) => {
    let s = field(v, { A: o(3, 3), B: o(10, 3) });
    s = run(s, { type: 'place_object', kind: 'door', at: o(4, 3), state: 'closed' }, () => 0.5, GM).state;
    s = run(s, { type: 'place_object', kind: 'door', at: o(3, 2), state: 'closed' }, () => 0.5, GM).state;
    return s;
  };
  const open = (s: BattleState, at: Offset) => execute(s, { type: 'object_use', actorId: 'A', objectId: objectAt(s, at)!.id, action: 'open' }, P1, () => 0.5);
  it('100: ilk kapı serbest, ikincisi Utilize (eylem); eylem yoksa açılmaz', () => {
    const s0 = doors(NEW);
    const r1 = ok(open(s0, o(4, 3)));
    expect(r1.state.combatants.A?.economy.interacted).toBe(true);
    expect(r1.state.combatants.A?.economy.action).toBe(false);
    const r2 = ok(open(r1.state, o(3, 2)));
    expect(r2.state.combatants.A?.economy.action).toBe(true);
    replays(s0, r1, r2);
    const busy = withC(r1.state, 'A', { economy: { ...(r1.state.combatants.A as Combatant).economy, action: true } });
    expect(open(busy, o(3, 2)).ok).toBe(false);
  });
  it('99: iki kapı da serbest (eski)', () => {
    const r1 = ok(open(doors(OLD), o(4, 3)));
    const r2 = ok(open(r1.state, o(3, 2)));
    expect(r2.state.combatants.A?.economy.action).toBe(false);
  });
});

describe('KALAN100 E13/F15: büyüsüz High Jump (SRD s. 183)', () => {
  it('formül: 3 + STR (en az 0), durarak yarısı', () => {
    expect(srdHighJumpFt({ modifiers: MODS(3), strScore: 16 }, true)).toBe(6);
    expect(srdHighJumpFt({ modifiers: MODS(3), strScore: 16 }, false)).toBe(3);
    expect(srdHighJumpFt({ modifiers: MODS(-4), strScore: 3 }, true)).toBe(0);
  });
  it('100: durarak yerinde zıplama (1 altıgen hareket, dikey erişim +3 ft); 99 Jump etkisi ister', () => {
    const s = field(NEW, { A: o(3, 3), B: o(10, 3) }, { A: { modifiers: MODS(3), strScore: 16 } });
    expect(highJumpProblem(s, s.combatants.A as Combatant)).toBeNull();
    const r = run(s, { type: 'jump', actorId: 'A', to: o(3, 3) });
    expect(r.state.combatants.A?.movementUsed).toBe(1);
    expect(highJumpReachFt(r.state, r.state.combatants.A as Combatant)).toBe(3);
    expect(highJumpProblem(r.state, r.state.combatants.A as Combatant)).toMatch(/zaten/);
    replays(s, r);
    const old = field(OLD, { A: o(3, 3), B: o(10, 3) }, { A: { modifiers: MODS(3), strScore: 16 } });
    expect(highJumpProblem(old, old.combatants.A as Combatant)).toMatch(/Jump etkisi/);
  });
  it('100: 10 ft koşudan sonra tam yükseklik (6 ft, 2 altıgen)', () => {
    let s = field(NEW, { A: o(3, 3), B: o(12, 3) }, { A: { modifiers: MODS(3), strScore: 16 } });
    s = run(s, { type: 'move', actorId: 'A', to: o(5, 3) }).state;
    const a = s.combatants.A as Combatant;
    expect(a.movementUsed).toBeGreaterThanOrEqual(2);
    expect(highJumpFt(s, a)).toBe(6);
    const r = run(s, { type: 'jump', actorId: 'A', to: a.pos as Offset });
    expect(r.state.combatants.A?.movementUsed).toBe(a.movementUsed + 2);
    expect(highJumpReachFt(r.state, r.state.combatants.A as Combatant)).toBe(6);
  });
});

describe('KALAN100 A45: yapay zekânın Dash\'i', () => {
  /** B'nin (düşman, yapay zekâ) turu; bütün hareketini harcamış, A çok uzakta. */
  const far = (v: number, b: Partial<Combatant> = {}) => {
    const s = field(v, { A: o(0, 3), B: o(14, 3) }, { B: b });
    const bb = s.combatants.B as Combatant;
    return withC({ ...s, turnIndex: 1 }, 'B', { movementUsed: speedHexes(bb) });
  };
  it('100: yetişemeyen Dash yapar; 99 turu bitirir', () => {
    expect(chooseCommand(far(NEW))).toMatchObject({ type: 'dash', actorId: 'B' });
    expect(chooseCommand(far(OLD)).type).toBe('end_turn');
  });
  it('100: eylemi harcanmış ya da bu tur yürümemiş yaratık Dash yapmaz', () => {
    const used = far(NEW);
    const b = used.combatants.B as Combatant;
    expect(chooseCommand(withC(used, 'B', { economy: { ...b.economy, action: true } })).type).not.toBe('dash');
    expect(chooseCommand(withC(used, 'B', { movementUsed: 0 })).type).not.toBe('dash');
  });
});
