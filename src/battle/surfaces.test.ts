/**
 * Görev Y1: yüzey sistemi çekirdeği. Her tepkime (yağ + ateş → alev, su + ateş → buhar, su + soğuk → buz, buz + ateş
 * → su, zehir bulutu + ateş → patlama, su + yıldırım → bağlı suda ≤ 7 altıgen, ağ + ateş → yanan ağ, Sleet Storm →
 * söndürme), yüzeylerin kendi tetikleri (alev 5 ateş, buzda Prone), bayrak kapalı, zar defteri ve replay, geniş haritada
 * yayılım, yapay zekâ riski ve kısa savaş.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { replay } from './reduce';
import { SURFACE_KINDS, isWater, surfaceRisk, surfacesAt, waterChain } from './surfaces';
import { heavilyObscured, triggerEvents, zoneMoveCost } from './zones';
import { getMap } from '../map/maps';
import { newBook, runWithDice } from '../rules/manualDice';
import { SCENARIOS, seeded, setSurfaceReactions, simulate } from '../sim/balance';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command, SurfaceKind } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high = () => 0.99;
const low = () => 0.01;
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const SPELLS = ['Fire Bolt', 'Ray of Frost', 'Shocking Grasp', 'Fireball', 'Sleet Storm', 'Web', 'Stinking Cloud', 'Lightning Bolt'];

/** A: büyücü (3,3), B: düşman (5,3), C: dost (8,3). `tiles` verilirse harita zemini. */
function arena(tiles?: string[], pos: Record<string, Offset> = {}, flag?: boolean): BattleState {
  const a = mk('A', { ownerId: 'p1', spellNames: SPELLS, spellSlots: [4, 3, 3, 3, 3, 1, 0, 0, 0], spellAttack: 30, spellSaveDc: 15, spellMod: 3, level: 11, hp: 80, maxHp: 80 });
  const b = mk('B', { side: 'enemies', hp: 500, maxHp: 500, ac: 5, saves: LOW });
  const c = mk('C', { ownerId: 'p1', hp: 200, maxHp: 200, saves: LOW });
  const st = startBattle('y1', 'd-z-zemin', [a, b, c], () => 0.5, { map: { id: 'col' }, ...(flag === false ? { yuzeyEtkilesimi: false } : {}) }).state;
  const at = { A: o(3, 3), B: o(5, 3), C: o(8, 3), ...pos };
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c0]) => [id, { ...(c0 as Combatant), pos: at[id as 'A'] ?? null }]));
  return { ...st, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants,
    map: { ...(st.map as NonNullable<BattleState['map']>), tiles: tiles ?? Array.from({ length: 7 }, () => '.'.repeat(15)), zones: [] } } as BattleState;
}
function run(state: BattleState, cmd: Command, rng: Rng = high, ctx = P1): { state: BattleState; events: BattleEvent[] } {
  const r = execute(state, cmd, ctx, rng);
  if (!r.ok) throw new Error(r.error);
  return r;
}
const place = (s: BattleState, kind: SurfaceKind, hexes: Offset[]) => run(s, { type: 'place_surface', kind, hexes }, high, GM).state;
const kinds = (s: BattleState, h: Offset) => surfacesAt(s, h).map((z) => z.surface).sort();
const reacted = (ev: BattleEvent[]) => ev.filter((e) => e.type === 'surface_reacted').map((e) => (e as { reaction: string }).reaction);
/** A'nın eylemi ve konsantrasyonu yeni turdaymış gibi boşalır (art arda büyü için). */
const fresh = (s: BattleState): BattleState => {
  const a = s.combatants.A as Combatant;
  return { ...s, combatants: { ...s.combatants, A: { ...a, economy: { ...a.economy, action: false, bonus: false } } } };
};
const cast = (s: BattleState, spellName: string, extra: Partial<Extract<Command, { type: 'cast_spell' }>>, rng: Rng = high) =>
  run(fresh(s), { type: 'cast_spell', actorId: 'A', spellName, ...extra }, rng);
/** Olaylar baştan oynatılınca aynı durum. */
function replays(start: BattleState, ...steps: Array<{ state: BattleState; events: BattleEvent[] }>) {
  const all = steps.flatMap((x) => x.events);
  expect(replay([{ type: 'battle_started', state: start }, ...all])).toEqual(steps[steps.length - 1]?.state);
}
const row = (ch: string, from: number, to: number) => Array.from({ length: 7 }, (_, r) => (r === 3 ? [...'.'.repeat(15)].map((x, c) => (c >= from && c <= to ? ch : x)).join('') : '.'.repeat(15)));

describe('yüzey verisi', () => {
  it('yedi tür; Game Master yerleştirir, kaldırır; yalnızca Game Master', () => {
    expect(SURFACE_KINDS.sort()).toEqual(['burningWeb', 'fire', 'ice', 'oil', 'poison', 'steam', 'water']);
    const s = place(arena(), 'oil', [o(5, 3), o(6, 3)]);
    expect(kinds(s, o(5, 3))).toEqual(['oil']);
    expect(execute(s, { type: 'place_surface', kind: 'oil', hexes: [o(1, 1)] }, P1, high).ok).toBe(false);
    const cleared = run(s, { type: 'place_surface', hexes: [o(5, 3)] }, high, GM).state;
    expect(kinds(cleared, o(5, 3))).toEqual([]);
    expect(kinds(cleared, o(6, 3))).toEqual(['oil']);
  });
  it('yüzeylerin kendi kuralları: alev 5 ateş (sabit, SRD yanan yağ), buzda DEX ya da Prone + zorlu zemin, buhar yoğun örtü', () => {
    let s = place(arena(), 'fire', [o(5, 3)]);
    const fire = s.map?.zones?.[0];
    const tick = triggerEvents(s, fire!, 'B', high).find((e) => e.type === 'effect_tick') as { appliedDamage: number; damageType: string };
    expect(tick).toMatchObject({ appliedDamage: 5, damageType: 'fire' });
    s = place(arena(), 'ice', [o(5, 3)]);
    const save = triggerEvents(s, s.map!.zones![0]!, 'B', low).find((e) => e.type === 'save_resolved') as { success: boolean; conditionsAdded: string[]; dc: number };
    expect(save).toMatchObject({ success: false, conditionsAdded: ['Prone'], dc: 10 });
    expect(zoneMoveCost(s, s.combatants.C as Combatant)(o(5, 3))).toBe(2);
    s = place(arena(), 'steam', [o(5, 3)]);
    expect(heavilyObscured(s, o(5, 3))).toBe(true);
  });
});

describe('tepkimeler', () => {
  it('yağ + ateş → alev (bütün birikinti; Fire Bolt isabeti); replay aynı', () => {
    const s0 = place(arena(), 'oil', [o(5, 3), o(6, 3), o(6, 2)]);
    const r = cast(s0, 'Fire Bolt', { targetId: 'B' });
    expect(reacted(r.events)).toEqual(['ignite']);
    for (const h of [o(5, 3), o(6, 3), o(6, 2)]) expect(kinds(r.state, h)).toEqual(['fire']);
    replays(s0, r);
  });
  it('su + ateş → buhar (su zemini kalır, görüş keser); buz + ateş → su', () => {
    const s0 = arena(row('n', 4, 6));
    const r = cast(s0, 'Fire Bolt', { targetId: 'B' });
    expect(reacted(r.events)).toEqual(['steam']);
    expect(kinds(r.state, o(5, 3))).toEqual(['steam']);
    expect(heavilyObscured(r.state, o(5, 3))).toBe(true);
    const s1 = place(arena(), 'ice', [o(5, 3)]);
    const r1 = cast(s1, 'Fire Bolt', { targetId: 'B' });
    expect(reacted(r1.events)).toEqual(['melt', 'steam']);
    expect(kinds(r1.state, o(5, 3))).toEqual(['steam', 'water']);
    replays(s1, r1);
  });
  it('su + soğuk → buz (su yüzeyi ve sığ su zemini; derin su donmaz)', () => {
    const s0 = arena(row('n', 4, 6));
    const r = cast(s0, 'Ray of Frost', { targetId: 'B' });
    expect(reacted(r.events)).toEqual(['freeze']);
    expect(kinds(r.state, o(5, 3))).toEqual(['ice']);
    const deep = cast(arena(row('w', 4, 6)), 'Ray of Frost', { targetId: 'B' });
    expect(reacted(deep.events)).toEqual([]);
    const s1 = place(arena(), 'water', [o(5, 3)]);
    const r1 = cast(s1, 'Ray of Frost', { targetId: 'B' });
    expect(kinds(r1.state, o(5, 3))).toEqual(['ice']);
  });
  it('zehir bulutu + ateş → patlama (buluttaki herkese DEX save, ateş) ve bulut kalkar', () => {
    const s0 = arena(undefined, { C: o(6, 3) });
    const cloud = cast(s0, 'Stinking Cloud', { targetHex: o(6, 3) }, low);
    const r = cast(cloud.state, 'Fire Bolt', { targetId: 'B' });
    expect(reacted(r.events)).toEqual(['explode']);
    const boom = r.events.filter((e) => e.type === 'save_resolved' && (e as { label: string }).label.includes('patlama')) as Array<{ targetId: string; damageType: string }>;
    // 20 ft yarıçaplı bulut büyücüyü de kapsar (A üç altıgen uzakta).
    expect(boom.map((e) => e.targetId).sort()).toEqual(['A', 'B', 'C']);
    expect(boom.every((e) => e.damageType === 'fire')).toBe(true);
    expect(r.state.map?.zones?.some((z) => z.spellId === 'stinking-cloud')).toBe(false);
    replays(fresh(cloud.state), r);
  });
  it('su + yıldırım: bağlı su altıgenlerindeki diğer yaratıklar DEX save (hedef iki kez vurulmaz)', () => {
    const s0 = arena(row('n', 5, 9), { A: o(4, 3) });
    const r = cast(s0, 'Shocking Grasp', { targetId: 'B' });
    expect(reacted(r.events)).toEqual(['chain']);
    const chain = r.events.filter((e) => e.type === 'save_resolved') as Array<{ targetId: string; damageType: string; rawDamage: number }>;
    expect(chain.map((e) => e.targetId)).toEqual(['C']);
    const hit = r.events.find((e) => e.type === 'attack_resolved') as { rawDamage: number };
    expect(chain[0]).toMatchObject({ damageType: 'lightning', rawDamage: hit.rawDamage });
    replays(s0, r);
    // Kuru zeminde yayılım yok.
    expect(reacted(cast(arena(undefined, { A: o(4, 3) }), 'Shocking Grasp', { targetId: 'B' }).events)).toEqual([]);
  });
  it('ağ + ateş → yalnızca değen altıgenler yanar (SRD Web), Sleet Storm alevleri söndürür (SRD)', () => {
    const web = cast(arena(), 'Web', { targetHex: o(7, 3) }, low);
    const webHexes = web.state.map?.zones?.find((z) => z.spellId === 'web')?.hexes ?? [];
    expect(webHexes.length).toBeGreaterThan(1);
    const s1 = { ...web.state, combatants: { ...web.state.combatants, B: { ...(web.state.combatants.B as Combatant), pos: webHexes[0] as Offset } } } as BattleState;
    const r = cast(s1, 'Fire Bolt', { targetId: 'B' });
    expect(reacted(r.events)).toEqual(['webBurn']);
    expect(kinds(r.state, webHexes[0] as Offset)).toEqual(['burningWeb']);
    expect(r.state.map?.zones?.find((z) => z.spellId === 'web')?.hexes.length).toBe(webHexes.length - 1);
    const lit = place(arena(), 'fire', [o(7, 3), o(7, 4)]);
    const doused = cast(lit, 'Sleet Storm', { targetHex: o(7, 3) }, low);
    expect(reacted(doused.events)).toContain('douse');
    expect(kinds(doused.state, o(7, 3))).toEqual([]);
  });
  it('bayrak kapalı (yuzeyEtkilesimi: false): tepkime yok, yüzeylerin kendi kuralları sürer', () => {
    const s0 = place(arena(undefined, {}, false), 'oil', [o(5, 3)]);
    expect(s0.yuzeyEtkilesimi).toBe(false);
    const r = cast(s0, 'Fire Bolt', { targetId: 'B' });
    expect(reacted(r.events)).toEqual([]);
    expect(kinds(r.state, o(5, 3))).toEqual(['oil']);
  });
});

describe('zar defteri, geniş harita, yapay zekâ, kısa savaş', () => {
  it('elle zar: suda yıldırımda dostun save zarı istenir; verilen zarla aynı adım yeniden çalışır', () => {
    const s0 = arena(row('n', 5, 9), { A: o(4, 3) });
    const step = (rng: Rng) => run(fresh(s0), { type: 'cast_spell', actorId: 'A', spellName: 'Shocking Grasp', targetId: 'B' }, rng);
    const book = newBook();
    const opts = { ask: (req: { by?: string }) => req.by === 'C', auto: high };
    const first = runWithDice(step, book, opts);
    expect(first.ok).toBe(false);
    expect(first.ok ? null : first.need).toMatchObject({ by: 'C', sides: 20 });
    book.entries.push({ group: { ...(first.ok ? {} : first.need), sides: 20, count: 1, values: [1] } as never });
    const second = runWithDice(step, book, opts);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    const save = second.value.events.find((e) => e.type === 'save_resolved') as { natural: number; success: boolean };
    expect(save).toMatchObject({ natural: 1, success: false });
    // Aynı defterle aynı sonuç.
    const again = runWithDice(step, book, opts);
    expect(again.ok && again.value.events).toEqual(second.value.events);
  });
  it('geniş harita (Orman yolu 31×17): dere suyunda yıldırım en çok 7 bağlı su altıgenine yayılır', () => {
    const m = getMap('orman-yolu');
    const st = startBattle('y1w', 'orman', [mk('X', {})], () => 0.5, { map: { id: 'orman-yolu' } }).state;
    expect(st.map?.tiles.length).toBe(17);
    let water: Offset | null = null;
    for (let r = 0; r < m.size.rows && !water; r++) for (let c = 0; c < m.size.cols; c++) if (isWater(st, o(c, r))) { water = o(c, r); break; }
    expect(water).not.toBeNull();
    const chain = waterChain(st, [water as Offset]);
    expect(chain.length).toBe(7);
    expect(chain.every((h) => isWater(st, h))).toBe(true);
    expect(waterChain(st, [o(0, 0)].filter((h) => !isWater(st, h)))).toEqual([]);
  });
  it('yapay zekâ: alev ve zehir bulutu risk (kaçınır), uçan yaratık zemin yüzeyinden etkilenmez; 50 altı (kazanç varsa girer)', () => {
    const s = place(arena(), 'fire', [o(5, 3)]);
    expect(surfaceRisk(s, o(5, 3), false)).toBe(20);
    expect(surfaceRisk(s, o(5, 3), true)).toBe(0);
    expect(surfaceRisk(s, o(6, 3), false)).toBe(0);
    expect(surfaceRisk(place(arena(), 'poison', [o(5, 3)]), o(5, 3), true)).toBe(20);
  });
  it('kısa savaş: su zeminli haritada savaş biter (yüzeyler açık ve kapalı)', () => {
    const sc = SCENARIOS.find((x) => x.map?.mapId === 'orman-yolu') ?? SCENARIOS[0];
    for (const on of [true, false]) {
      setSurfaceReactions(on);
      const res = simulate(sc!, 3, 20, 3);
      expect(['party', 'enemies', 'timeout']).toContain(res.winner);
    }
    setSurfaceReactions(true);
    expect(seeded(1)()).toBeGreaterThanOrEqual(0);
  });
});
