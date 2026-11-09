/**
 * Kuyruk K72 (kural sürümü 60): duruş yüzeyi. Oda tavanı (`dikey.odalar`), sur üstünde durma (K5, `dikey.surUstu`) ve çok
 * katlı bina (`dikey.katlar`): tırmanıp tepede durma, tepede yürüme, Prone düşürmez, itmede tek düşme, yüksek zemin, siper,
 * iniş; kat döşemesi, merdiven, delik, döşeme altı tavan, uçuş ve görüş döşemede kesilir, düşme alt kata, Earthquake kat
 * çöküşü, YZ kat geçişi; 59 sabit.
 */
import { describe, expect, it } from 'vitest';
import { GM, mk, P1, scripted } from './fixtures';
import { execute, startBattle } from './index';
import { applyEvents } from './reduce';
import { attackHeights, lineOfFire } from './cover';
import { ceilingFt } from './altitude';
import { landingFt, slabBetween, standHeights, standingOn } from './stand';
import { shoveHex } from './forced';
import type { MapDikey } from '../map/maps';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const H = (col: number, row = 3): Offset => ({ col, row });
const high: Rng = () => 0.99;
const low: Rng = () => 0.01;
/** 15×7, 7. sütun duvar (`s`), geri kalanı açık. */
const wallCol = (col = 7) => Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c === col ? 's' : '.')).join(''));
const SUR: MapDikey = { harfFt: { s: 15, O: 15 }, surUstu: ['s', 'O'] };
interface Opts { ver?: number; tiles?: string[]; dikey?: MapDikey | null }
function field(parts: Combatant[], pos: Record<string, [Offset, number?]>, o: Opts = {}): BattleState {
  const s = startBattle('k72', 'k72', parts, () => 0.5, { kuralSurumu: o.ver ?? 60,
    map: { id: 'col', variantId: 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, [p, alt]] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p, ...(alt ? { altitudeFt: alt } : {}) };
  return { ...s, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: o.tiles ?? wallCol(), objects: [], ...(o.dikey === null ? {} : { dikey: o.dikey ?? SUR }) } };
}
const BITE = [{ name: 'Bite', bonus: 5, damageDice: '1d6', damageType: 'piercing', repeat: 1, ranged: false, reachFt: 5, text: 'Bite' }] as never;
const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', speed: 60, ...p });
const G = (id = 'G', p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', attacks: BITE, ...p });
const run = (s: BattleState, cmd: Command, rng: Rng = high) => execute(s, cmd, P1, rng);
const me = (s: BattleState, id = 'A') => s.combatants[id] as Combatant;
const falls = (evs: BattleEvent[]) => evs.filter((e) => e.type === 'map_effect' && e.rule === 'fall');

describe('K72 sur üstü (K5): duruş yüzeyi', () => {
  it('duruş yükseklikleri: duvar tepesi (işaretli), açık zemin 0; işaretsiz ya da 59\'da boş', () => {
    const s = field([A()], { A: [H(3)] });
    expect(standHeights(s, H(7))).toEqual([15]);
    expect(standHeights(s, H(5))).toEqual([0]);
    expect(standHeights(field([A()], { A: [H(3)] }, { dikey: { harfFt: { s: 15 } } }), H(7))).toEqual([]);
    expect(standHeights(field([A()], { A: [H(3)] }, { ver: 59 }), H(7))).toEqual([]);
  });
  it('yerden sura tırmanış: Çeviklik zarı, 1 + 3 × 2 = 7 altıgen; tepede durur, tırmanma işareti yok, komut sonunda düşmez', () => {
    const r = run(field([A()], { A: [H(6)] }), { type: 'climb', actorId: 'A', to: H(7) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect([me(r.state).pos, me(r.state).altitudeFt, me(r.state).climbing, me(r.state).movementUsed]).toEqual([H(7), 15, undefined, 7]);
    expect(r.events.some((e) => e.type === 'map_effect' && e.rule === 'climb')).toBe(true);
    expect(standingOn(r.state, me(r.state))).toBe(true);
  });
  it('tepede yürüyüş normal maliyet; kenardan açık zemine yürünmez; Prone sürünür ama düşmez', () => {
    const s = field([A()], { A: [H(7, 1), 15] });
    const r = run(s, { type: 'move', actorId: 'A', to: H(7, 3) });
    expect(r.ok).toBe(true);
    if (r.ok) expect([me(r.state).pos, me(r.state).altitudeFt, me(r.state).movementUsed]).toEqual([H(7, 3), 15, 2]);
    expect(run(s, { type: 'move', actorId: 'A', to: H(6, 1) }).ok).toBe(false);
    const prone = field([A({ conditions: ['Prone'] })], { A: [H(7, 1), 15] });
    const p = run(prone, { type: 'move', actorId: 'A', to: H(7, 2) });
    expect(p.ok).toBe(true);
    if (p.ok) expect([me(p.state).pos, me(p.state).altitudeFt]).toEqual([H(7, 2), 15]);
  });
  it('duvarda tutunan, irtifası tepeye eşitken tepeye adım atıp durur (işaret kalkar)', () => {
    const s = field([A()], { A: [H(6), 15] });
    const hang = { ...s, combatants: { ...s.combatants, A: { ...me(s), climbing: true as const } } };
    const r = run(hang, { type: 'move', actorId: 'A', to: H(7) });
    expect(r.ok).toBe(true);
    if (r.ok) expect([me(r.state).pos, me(r.state).altitudeFt, me(r.state).climbing]).toEqual([H(7), 15, undefined]);
  });
  it('sur tepesinden iniş: tırmanarak (7 altıgen), zarsız, hasarsız', () => {
    const r = run(field([A()], { A: [H(7), 15] }), { type: 'climb', actorId: 'A', to: H(8) }, low);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect([me(r.state).pos, me(r.state).altitudeFt ?? 0, me(r.state).hp, me(r.state).movementUsed]).toEqual([H(8), 0, me(field([A()], {})).hp, 7]);
    expect(r.events.some((e) => e.type === 'map_effect' && (e.rule === 'climb' || e.rule === 'fall'))).toBe(false);
  });
  it('itme: tepede aynı yükseklikteki duvara itilir; kenardan itilen tek düşmeyle (15 ft) yere iner', () => {
    const along = field([G('B'), A()], { B: [H(7, 2), 15], A: [H(7, 3), 15] });
    const to = shoveHex(me(along, 'B'), me(along));
    const r1 = execute(along, { type: 'shove', actorId: 'B', targetId: 'A', effect: 'push' }, GM, low);
    expect(r1.ok).toBe(true);
    if (r1.ok) expect([me(r1.state).pos, me(r1.state).altitudeFt]).toEqual([to, 15]);
    const off = field([G('B'), A()], { B: [H(6), 0], A: [H(7), 15] });
    const r2 = execute(off, { type: 'shove', actorId: 'B', targetId: 'A', effect: 'push' }, GM, low);
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(falls(r2.events)).toHaveLength(1);
    expect([me(r2.state).pos, me(r2.state).altitudeFt ?? 0]).toEqual([shoveHex(me(off, 'B'), me(off)), 0]);
  });
  it('yüksek zemin (K8, katmansız haritada da): tepedeki okçu yerdekine avantajlı; tepedeki duvarından siper almaz', () => {
    const s = field([A(), G()], { A: [H(7), 15], G: [H(11)] });
    expect(attackHeights(s, me(s), me(s, 'G'))).toEqual({ attackerHeight: 1, targetHeight: 0 });
    expect(attackHeights(s, me(s, 'G'), me(s))).toEqual({ attackerHeight: -1, targetHeight: 0 });
    expect(lineOfFire(s, me(s, 'G'), me(s)).cover).toBe(0);
  });
  it('59 sabit: işaretli sur tepesine çıkılmaz (eski K71b: üstünden geçer, durmaz)', () => {
    const s = field([A()], { A: [H(6)] }, { ver: 59 });
    expect(run(s, { type: 'climb', actorId: 'A', to: H(7) }).ok).toBe(false);
    const hang = field([A()], { A: [H(6), 15] }, { ver: 59 });
    expect(run({ ...hang, combatants: { ...hang.combatants, A: { ...me(hang), climbing: true as const } } }, { type: 'move', actorId: 'A', to: H(7) }).ok).toBe(false);
  });
});

describe('K72 oda tavanı', () => {
  it('oda altıgeninde tavan 60\'ta oda değeri; 59\'da yok; duvar altıgeni tavansız', () => {
    const d: MapDikey = { odalar: [{ ft: 12, altigenler: ['3,3', '4,3'] }] };
    const s = field([A()], { A: [H(1)] }, { dikey: d });
    expect([ceilingFt(s, H(3)), ceilingFt(s, H(5))]).toEqual([12, null]);
    expect(ceilingFt(field([A()], { A: [H(1)] }, { dikey: d, ver: 59 }), H(3))).toBe(null);
  });
});

export { applyEvents, scripted, landingFt, slabBetween };
