/**
 * Kuyruk K71c (kural sürümü 58): prizma hava ızgarası. Düzey/irtifa dönüşümü (işaretli, aşağı yuvarlama), hücre kaplama
 * (boy düzeyi), aynı altıgende yer + hava, çakışma reddi, uçanın düşmanın üstünden geçmesi ve üstünde durması (K6), uçuş üst
 * sınırı (açık gök 60 ft / harita ezmesi / tavanlı K68b), çapraz tek adım, eksi düzey şeması, çok altıgen, 3B fırsat
 * saldırısı ve erişim, düşmede dolu hücre, tırmananın hücresi, YZ düzey seçimi, hızlı yol sayaçları, 57 sabit.
 */
import { describe, expect, it } from 'vitest';
import { mk, P1, scripted } from './fixtures';
import { execute, replay, startBattle } from './index';
import { chooseCommand, airAiStats } from './ai';
import { neighbors, type Offset } from '../rules/hex';
import { bandGap, bandOf, bandsOverlap, cellStats, heightLevels, levelOf, levelToFt, snapFt } from './cells';
import { airReach } from './airMove';
import { altitudeCapFt, reachFt } from './altitude';
import { occupantAt, bodyFitProblem } from './movement';
import dikeyData from '../../data/dikey.json';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const H = (col: number, row = 3): Offset => ({ col, row });
const d20 = (...v: number[]) => scripted(...v.map((x) => [20, x] as [number, number]));
const open = () => Array.from({ length: 7 }, () => '.'.repeat(15));
const wallCol = (col: number) => Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c === col ? 's' : '.')).join(''));
interface Opts { ver?: number; tiles?: string[]; mapId?: string; variantId?: string; multiHex?: boolean; ucusUstFt?: number }
function field(parts: Combatant[], pos: Record<string, [Offset, number?]>, o: Opts = {}): BattleState {
  const s = startBattle('k71c', 'k71c', parts, () => 0.5, { kuralSurumu: o.ver ?? 58, ...(o.multiHex ? { multiHex: true } : {}),
    map: { id: o.mapId ?? 'col', variantId: o.variantId ?? 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, [p, alt]] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p, ...(alt ? { altitudeFt: alt } : {}) };
  return { ...s, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: o.tiles ?? open(), objects: [], ...(o.ucusUstFt ? { ucusUstFt: o.ucusUstFt } : {}) } };
}
const BITE = [{ name: 'Bite', bonus: 5, damageDice: '1d6', damageType: 'piercing', repeat: 1, ranged: false, reachFt: 5, text: 'Bite' }] as never;
const F = (p: Partial<Combatant> = {}) => mk('F', { ownerId: 'p1', fly: 30, speed: 30, ...p });
const G = (id = 'G', p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', attacks: BITE, ...p });
const run = (s: BattleState, cmd: Command, rng = d20(10, 3)) => execute(s, cmd, P1, rng);
const me = (s: BattleState, id = 'F') => s.combatants[id] as Combatant;
const fly = (to: Offset, toFt: number): Command => ({ type: 'move', actorId: 'F', to, toFt } as Command);

describe('K71c düzey ve hücre (şema)', () => {
  it('düzey = ⌊irtifa / 5⌋ (işaretli, aşağı yuvarlama); düzey → ft; 5\'e oturtma', () => {
    expect([0, 5, 12, 60, -10, -12].map(levelOf)).toEqual([0, 1, 2, 12, -2, -3]);
    expect(levelToFt(4)).toBe(20);
    expect(snapFt(12)).toBe(10);
  });
  it('boy düzeyi K68b boyundan: Tiny/Small/Medium 1, Large 2, Huge 3, Gargantuan 4', () => {
    expect(['T', 'S', 'M', 'L', 'H', 'G'].map((size) => heightLevels({ size } as Combatant))).toEqual([1, 1, 1, 2, 3, 4]);
  });
  it('bant: ayak izi × [düzey, düzey + boy − 1]; çakışma ve aralık', () => {
    const L = mk('L', { size: 'L' });
    expect(bandOf(L)).toEqual({ lo: 0, hi: 1 });
    expect(bandOf(mk('M'), 15)).toEqual({ lo: 3, hi: 3 });
    expect(bandsOverlap(bandOf(L), { lo: 1, hi: 1 })).toBe(true);
    expect(bandGap(bandOf(L), { lo: 2, hi: 2 })).toBe(1);
  });
  it('eksi düzey yalnız şema: yarıktaki yaratık (−15 ft) düzey −3, yer sorgusunu doldurmaz (davranış yok)', () => {
    const s = field([F(), G('Y')], { F: [H(3)], Y: [H(9), -15] });
    expect(bandOf(me(s, 'Y'))).toEqual({ lo: -3, hi: -3 });
    expect(occupantAt(s, H(9))).toBeUndefined();
  });
});

describe('K71c aynı altıgende yer + hava, çakışma', () => {
  it('uçan, yerdeki düşmanın üstünde (10 ft) durur; yerdeki sorgu yalnız yerdekini görür', () => {
    const r = run(field([F(), G()], { F: [H(3)], G: [H(5)] }), fly(H(5), 10));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect([me(r.state).pos, me(r.state).altitudeFt]).toEqual([H(5), 10]);
    expect(occupantAt(r.state, H(5))?.id).toBe('G');
  });
  it('çakışma reddi: aynı hücreye (yere) inilmez; dikine de inilmez', () => {
    const s = field([F(), G()], { F: [H(3)], G: [H(5)] });
    expect(run(s, fly(H(5), 0))).toMatchObject({ ok: false });
    const above = field([F(), G()], { F: [H(5), 10], G: [H(5)] });
    const r = run(above, { type: 'vertical_move', actorId: 'F', toFt: 0 } as Command);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Hücre dolu/);
  });
  it('doluluk sorgusu: bant verilirse yalnız o düzeyleri kaplayan; verilmezse yer düzeyi (58); 57\'de bant bakılmaz', () => {
    const s = (ver: number) => field([F(), G()], { F: [H(5), 10], G: [H(5)] }, { ver });
    expect(occupantAt(s(58), H(5), 'G')).toBeUndefined();
    expect(occupantAt(s(58), H(5), 'G', bandOf(me(s(58), 'G'), 10))?.id).toBe('F');
    expect(occupantAt(s(57), H(5), 'G')?.id).toBe('F');
  });
  it('Large (iki düzey) yerdekinin 5 ft üstü dolu, 10 ft boş', () => {
    const s = field([F(), G('B', { size: 'L' })], { F: [H(3)], B: [H(5)] });
    expect(run(s, fly(H(5), 5)).ok).toBe(false);
    expect(run(s, fly(H(5), 10)).ok).toBe(true);
  });
  it('yerdeki yaratık havadakinin altında durur (58); sürüm 57: altıgen dolu', () => {
    const w = (ver: number) => field([mk('W', { ownerId: 'p1' }), mk('F2', { side: 'enemies', fly: 30 })], { W: [H(3)], F2: [H(5), 10] }, { ver });
    expect(execute(w(58), { type: 'move', actorId: 'W', to: H(5) } as Command, P1, d20(10)).ok).toBe(true);
    expect(execute(w(57), { type: 'move', actorId: 'W', to: H(5) } as Command, P1, d20(10)).ok).toBe(false);
  });
  it('uçan, düşman sırasının üstünden geçer (5 ft): yolu kesmez', () => {
    const blockers = [2, 3, 4].map((r) => G(`G${r}`));
    const pos = Object.fromEntries([2, 3, 4].map((r) => [`G${r}`, [H(6, r)] as [Offset]]));
    const s = field([F(), ...blockers], { F: [H(4), 5], ...pos });
    const r = run(s, fly(H(8), 5));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.events.find((e) => e.type === 'moved')).toMatchObject({ cost: 4 });
  });
});

describe('K71c birleşik hareket ve üst sınır', () => {
  it('çapraz (altıgen + düzey) adım tek adım: 2 altıgen + 10 ft = 2 hareket', () => {
    const r = run(field([F(), G()], { F: [H(3)], G: [H(12)] }), fly(H(5), 10));
    expect(r.ok && me(r.state).movementUsed).toBe(2);
  });
  it('açık gök üst sınırı 60 ft (veri), harita ezmesi, tavanlı haritada tavan − boy (K68b)', () => {
    expect(dikeyData.ucus.ucusUstFt).toBe(60);
    const s = field([F({ speed: 120, fly: 120 }), G()], { F: [H(3)], G: [H(12)] });
    expect(altitudeCapFt(s, me(s))).toBe(60);
    expect(run(s, { type: 'vertical_move', actorId: 'F', toFt: 65 } as Command).ok).toBe(false);
    expect(run(s, { type: 'vertical_move', actorId: 'F', toFt: 60 } as Command).ok).toBe(true);
    expect(altitudeCapFt(field([F(), G()], { F: [H(3)], G: [H(12)] }, { ucusUstFt: 30 }), me(s))).toBe(30);
    const cave = field([F(), G()], { F: [H(3)], G: [H(12)] }, { mapId: 'magara', variantId: 'magara' });
    expect(altitudeCapFt(cave, me(cave))).toBe(15);
    expect(altitudeCapFt(field([F(), G()], { F: [H(3)], G: [H(12)] }, { ver: 57 }), me(s))).toBe(120);
  });
  it('eski kayıttaki 60 ft üstü irtifa komut sonunda sınıra iner', () => {
    const s = field([F(), G()], { F: [H(3), 80], G: [H(12)] });
    const r = run(s, { type: 'end_turn', actorId: 'F' } as Command);
    expect(r.ok && me(r.state).altitudeFt).toBe(60);
  });
  it('K71a ile tutarlı: 20 ft duvar düzey 0–3; uçan 20 ft\'ten (4. düzey) aşar, duvar üstünde durmaz', () => {
    const s = (alt: number) => field([F(), G()], { F: [H(6), alt], G: [H(13)] }, { tiles: wallCol(7) });
    const walk = (alt: number) => run(s(alt), { type: 'move', actorId: 'F', to: H(8) } as Command);
    expect(walk(20).ok).toBe(true);
    const w15 = walk(15);
    expect(w15.ok && me(w15.state).pos?.col === 8).toBe(false);
    // Birleşik hareket 15 ft'ten duvarın üstüne (4. düzey) çaprazlama yükselip öte yanda 15 ft'e iner: 2 adım.
    const over = run(s(15), fly(H(8), 15));
    expect(over.ok && me(over.state).movementUsed).toBe(2);
    expect(run(s(25), fly(H(7), 25)).ok).toBe(false);
  });
  it('hava erişimi: seçili düzeyde varılan altıgenler (yerdekinin üstü dahil); replay aynı', () => {
    const s = field([F(), G()], { F: [H(3)], G: [H(5)] });
    expect(airReach(s, me(s), 1).some((x) => x.to.col === 5 && x.to.row === 3)).toBe(true);
    const r = run(s, fly(H(5), 5));
    if (r.ok) expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  });
  it('sürüm 57: birleşik hareket yok', () => {
    expect(run(field([F(), G()], { F: [H(3)], G: [H(12)] }, { ver: 57 }), fly(H(5), 10))).toMatchObject({ ok: false });
  });
});

describe('K71c 3B erişim ve fırsat saldırısı', () => {
  it('erişim dikey bileşeni bant aralığı: Large + 10 ft uçan 5 ft (58), 10 ft (57)', () => {
    const s = (ver: number) => field([F(), G('B', { size: 'L' })], { F: [H(5), 10], B: [H(5)] }, { ver });
    expect(reachFt(s(58), me(s(58)), me(s(58), 'B'), 0)).toBe(5);
    expect(reachFt(s(57), me(s(57)), me(s(57), 'B'), 0)).toBe(10);
  });
  it('düşmanın yanından dikine yükselip erişimden çıkan uçan fırsat saldırısı yer; sürüm 57 yemez', () => {
    const s = (ver: number) => field([F({ hp: 30, maxHp: 30 }), G()], { F: [H(5)], G: [H(6)] }, { ver });
    const r58 = run(s(58), { type: 'vertical_move', actorId: 'F', toFt: 10 } as Command, d20(15, 3));
    expect(r58.ok && r58.events.some((e) => e.type === 'attack_resolved')).toBe(true);
    const r57 = run(s(57), { type: 'vertical_move', actorId: 'F', toFt: 10 } as Command, d20(15, 3));
    expect(r57.ok && r57.events.some((e) => e.type === 'attack_resolved')).toBe(false);
  });
  it('5 ft\'te düşmanın yanından geçip 3B erişimden çıkan uçan fırsat saldırısı yer (birleşik hareketin adımında)', () => {
    const s = field([F({ hp: 30, maxHp: 30 }), G()], { F: [H(5), 5], G: [H(6)] });
    const r = run(s, fly(H(3), 5), d20(15, 3));
    expect(r.ok && r.events.some((e) => e.type === 'attack_resolved')).toBe(true);
  });
  it('erişimin hep dışında (10 ft yukarıda) düşmanın yanından geçen uçan fırsat saldırısı yemez', () => {
    const s = field([F(), G()], { F: [H(4), 10], G: [H(6)] });
    const r = run(s, fly(H(8), 10), d20(15, 3));
    expect(r.ok && r.events.some((e) => e.type === 'attack_resolved')).toBe(false);
  });
});

describe('K71c düşme, çok altıgen, tırmanan', () => {
  it('düşerken alttaki hücre doluysa en yakın boş altıgene iner (ek hasar yok)', () => {
    const s = field([F({ hp: 30, maxHp: 30, conditions: ['Prone'] }), G()], { F: [H(5), 20], G: [H(5)] });
    const r = run(s, { type: 'end_turn', actorId: 'F' } as Command, d20(3, 3, 3));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const fall = r.events.find((e) => e.type === 'map_effect' && e.rule === 'fall') as Extract<BattleEvent, { type: 'map_effect' }>;
    expect(fall.moveTo).toBeDefined();
    expect(me(r.state).pos).not.toEqual(H(5));
    expect(me(r.state).altitudeFt ?? 0).toBe(0);
    expect(fall.damage?.rolls.length).toBe(2);
  });
  it('çok altıgen: büyük uçan gövdesi küçüklerin üstüne sığar (bant), yerde sığmaz', () => {
    const s = field([F({ size: 'L' }), G('A1'), G('A2')], { F: [H(2)], A1: [H(8)], A2: [H(9, 3)] }, { multiHex: true });
    const big = me(s);
    expect(bodyFitProblem(s, { ...big, altitudeFt: 0 }, H(8))).not.toBeNull();
    expect(bodyFitProblem(s, { ...big, altitudeFt: 10 }, H(8))).toBeNull();
  });
  it('duvarda tırmanan (K71b) hücresi dolu: uçan aynı düzeye giremez, üstüne girer', () => {
    const s = field([F(), mk('C', { side: 'enemies' })], { F: [H(3)], C: [H(6), 10] }, { tiles: wallCol(7) });
    const st = { ...s, combatants: { ...s.combatants, C: { ...me(s, 'C'), climbing: true as const } } };
    expect(run(st, fly(H(6), 10)).ok).toBe(false);
    expect(run(st, fly(H(6), 15)).ok).toBe(true);
  });
});

describe('K71c YZ ve hızlı yol', () => {
  it('uçan düşman: hedefin bütün yer komşuları kendi dostlarıyla doluyken bir dostun üstüne (düşük düzey) uçar', () => {
    const ring = neighbors(H(7), { cols: 15, rows: 7 });
    const parts = [mk('U', { side: 'enemies', fly: 40, speed: 30, attacks: BITE }), mk('T', { ownerId: 'p1' }), ...ring.map((_, i) => mk(`P${i}`, { side: 'enemies' }))];
    const pos: Record<string, [Offset]> = { U: [H(2)], T: [H(7)] };
    ring.forEach((h, i) => { pos[`P${i}`] = [h]; });
    const s = field(parts, pos);
    const cmd = chooseCommand(s) as Extract<Command, { type: 'move' }>;
    expect(cmd).toMatchObject({ type: 'move', toFt: 5 });
    expect(ring.some((h) => h.col === cmd.to.col && h.row === cmd.to.row)).toBe(true);
    expect(chooseCommand({ ...s, kuralSurumu: 57 })).not.toHaveProperty('toFt');
  });
  it('uçansız savaşta hücre çözücüsünün tam yolu ve YZ hava yeri çalışmaz (sayaç)', () => {
    const c0 = cellStats.full;
    const a0 = airAiStats.calls;
    const s = field([mk('W', { ownerId: 'p1' }), G()], { W: [H(3)], G: [H(9)] });
    const r = execute(s, { type: 'move', actorId: 'W', to: H(6) } as Command, P1, d20(10));
    expect(r.ok).toBe(true);
    chooseCommand({ ...s, turnIndex: 1 });
    expect(cellStats.full).toBe(c0);
    expect(airAiStats.calls).toBe(a0);
  });
});
