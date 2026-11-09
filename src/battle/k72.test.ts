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

// --- Çok katlı bina -------------------------------------------------------------------------------------------------------
import { KATLI_BINA, KATLI_BINA_DIKEY, KATLI_BINA_TILES } from '../map/fixtures/katliBina';
import { dikeyErrors, validateMap } from '../map/maps';
import ornek from '../../harita/belgeler/K72-ORNEK-KATLI-HARITA.json';
import { quakeStructureEvents } from './quake';
import { chooseCommand } from './ai';
import type { SpellZone } from './types';
import { spells } from '../data';
import { mechanicsAt } from './spellVersion';

const bina = (parts: Combatant[], pos: Record<string, [Offset, number?]>, ver = 60) => field(parts, pos, { ver, tiles: KATLI_BINA_TILES, dikey: KATLI_BINA_DIKEY });
const F = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', fly: 30, speed: 30, ...p });

describe('K72 çok katlı bina', () => {
  it('fikstür ve örnek taslak geçerli; duruş yükseklikleri: iç 0 + 10, merdiven 0 + 10, delik 0, duvar yok', () => {
    expect(validateMap(KATLI_BINA)).toEqual([]);
    expect(dikeyErrors(ornek.variants[0]?.dikey as MapDikey, 'örnek')).toEqual([]);
    const s = bina([A()], { A: [H(1)] });
    expect([standHeights(s, H(6)), standHeights(s, H(4, 2)), standHeights(s, H(8, 4)), standHeights(s, H(3))]).toEqual([[0, 10], [0, 10], [0], []]);
    expect(standHeights(bina([A()], { A: [H(1)] }, 59), H(6))).toEqual([]);
  });
  it('üst katta yürüyüş: döşemede normal; delik ve döşeme dışı yürünmez; komut sonunda düşmez', () => {
    const s = bina([A()], { A: [H(5, 2), 10] });
    const r = run(s, { type: 'move', actorId: 'A', to: H(7, 2) });
    expect(r.ok).toBe(true);
    if (r.ok) expect([me(r.state).pos, me(r.state).altitudeFt]).toEqual([H(7, 2), 10]);
    expect(run(s, { type: 'move', actorId: 'A', to: H(8, 4) }).ok).toBe(false);
  });
  it('merdiven: zemin ↔ üst kat yürüyerek (10 ft = 2 altıgen); merdivensiz altıgende döşeme geçilmez', () => {
    const up = run(bina([A()], { A: [H(4, 2)] }), { type: 'vertical_move', actorId: 'A', toFt: 10 } as Command);
    expect(up.ok).toBe(true);
    if (up.ok) expect([me(up.state).altitudeFt, me(up.state).movementUsed, me(up.state).climbing, standingOn(up.state, me(up.state))]).toEqual([10, 2, undefined, true]);
    const wallUp = run(bina([A()], { A: [H(5, 2)] }), { type: 'vertical_move', actorId: 'A', toFt: 10 } as Command);
    expect(wallUp.ok).toBe(false);
    if (!wallUp.ok) expect(wallUp.error).toMatch(/kat döşemesi/);
  });
  it('uçan: alt katta döşemeye dek (5 ft), döşemeyi delik ya da merdivenden geçer; birleşik uçuş açıklığı kullanır', () => {
    const s = bina([F()], { A: [H(6)] });
    expect(run(s, { type: 'vertical_move', actorId: 'A', toFt: 5 } as Command).ok).toBe(true);
    expect(run(s, { type: 'vertical_move', actorId: 'A', toFt: 10 } as Command).ok).toBe(false);
    expect(run(bina([F()], { A: [H(8, 4)] }), { type: 'vertical_move', actorId: 'A', toFt: 15 } as Command).ok).toBe(true);
    const r = run(s, { type: 'move', actorId: 'A', to: H(6, 2), toFt: 10 } as Command);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const path = (r.events.find((e) => e.type === 'moved') as Extract<BattleEvent, { type: 'moved' }>).path;
      expect(path.some((h) => (h.col === 8 && h.row === 4) || (h.col === 4 && h.row === 2))).toBe(true);
      expect([me(r.state).pos, me(r.state).altitudeFt]).toEqual([H(6, 2), 10]);
    }
  });
  it('görüş: alt kattaki üst kattakini döşemeden göremez, itemez; aynı kattakiler görür', () => {
    const s = bina([A(), G()], { A: [H(5, 3)], G: [H(7, 3), 10] });
    expect(lineOfFire(s, me(s), me(s, 'G'))).toMatchObject({ blocked: true, blockedBy: 'döşeme' });
    const near = bina([A(), G()], { A: [H(6, 3)], G: [H(6, 2), 10] });
    const sh = execute(near, { type: 'shove', actorId: 'A', targetId: 'G', effect: 'push' }, P1, high);
    expect(sh.ok).toBe(false);
    if (!sh.ok) expect(sh.error).toMatch(/kat döşemesi/);
    const same = bina([A(), G()], { A: [H(5, 3), 10], G: [H(7, 3), 10] });
    expect(lineOfFire(same, me(same), me(same, 'G')).blocked).toBe(false);
    expect(slabBetween(s, H(6), 0, 12)).toBe(true);
    expect(slabBetween(s, H(8, 4), 0, 12)).toBe(false);
  });
  it('düşme alt kata: üst katın 15 ft üstünden düşen döşemeye iner (tek düşme), irtifa 10', () => {
    const s = bina([A(), G()], { A: [H(6), 25], G: [H(13)] });
    expect(landingFt(s, H(6), 25)).toBe(10);
    const r = run(s, { type: 'end_turn', actorId: 'A' } as Command);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(falls(r.events)).toHaveLength(1);
    expect(me(r.state).altitudeFt).toBe(10);
  });
  it('Earthquake kat çöküşü: alandaki döşeme çöker, üstündeki tek düşmeyle zemine iner', () => {
    const s = bina([A(), G()], { A: [H(6), 10], G: [H(13)] });
    const sp = spells.find((x) => x.id === 'earthquake') as NonNullable<ReturnType<typeof spells.find>>;
    const quake = { id: 'q1', spellId: 'earthquake', name: 'Earthquake', casterId: 'G', side: 'enemies', dc: 15, hexes: [H(5), H(6), H(7)], rounds: 10, hits: {},
      spec: mechanicsAt(s, sp).zone } as unknown as SpellZone;
    const evs = quakeStructureEvents(s, quake, low);
    expect(evs.some((e) => e.type === 'map_effect' && e.rule === 'katCokme')).toBe(true);
    const after = applyEvents(s, evs);
    expect(falls(evs)).toHaveLength(1);
    expect([me(after).altitudeFt ?? 0, standHeights(after, H(6))]).toEqual([0, [0]]);
    expect(standHeights(after, H(6, 2))).toEqual([0, 10]);
  });
  it('YZ: bütün düşmanlar üst kattaysa merdivene yürür, merdivende kata çıkar', () => {
    const s0 = bina([A(), G('G', { speed: 30 })], { A: [H(6, 2), 10], G: [H(8, 3)] });
    const s = { ...s0, order: ['G', 'A'] } as BattleState;
    const c1 = chooseCommand(s);
    expect(c1).toMatchObject({ type: 'move', actorId: 'G', to: H(4, 2) });
    const onStairs = { ...s, combatants: { ...s.combatants, G: { ...me(s, 'G'), pos: H(4, 2) } } };
    expect(chooseCommand(onStairs)).toMatchObject({ type: 'vertical_move', actorId: 'G', toFt: 10 });
  });
});
