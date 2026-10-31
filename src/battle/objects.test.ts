/**
 * Görev S2: nesne katmanı. Yerleştirme/kaldırma, zemin etkisi (hareket, örtü, görüş), kırma (yağ fıçısı → yağ, ateşle
 * → alev), barut fıçısı patlaması yalnızca ev kuralı bayrağıyla, kapı (aç/kapa/kilit/kır), masa devirme, mangal
 * dökme, alan hasarı, replay ve zar defteri, geniş harita, yapay zekâ riski.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { replay } from './reduce';
import { terrainAt } from './movement';
import { objectAt } from './objectData';
import { objectRisk } from './objects';
import { surfacesAt } from './surfaces';
import { newBook, runWithDice } from '../rules/manualDice';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, ObjectKind } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high = () => 0.99;
const low = () => 0.01;
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const club: AttackOption = { label: 'Sopa', attackBonus: 20, damage: '1d2+40', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'x' };
const torch: AttackOption = { ...club, label: 'Meşale', damage: '1d2', damageType: 'fire' };

function arena(flags: Record<string, boolean> = {}, size?: { cols: number; rows: number }, mapId = 'col'): BattleState {
  const a = mk('A', { ownerId: 'p1', spellNames: ['Fire Bolt', 'Burning Hands'], spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0], spellAttack: 30, spellSaveDc: 15, spellMod: 3, level: 5, hp: 80, maxHp: 80 });
  const b = mk('B', { side: 'enemies', hp: 500, maxHp: 500, ac: 5, saves: LOW });
  const st = startBattle('s2', 'd-z-zemin', [a, b], () => 0.5, { map: { id: mapId } }).state;
  const cols = size?.cols ?? 15, rows = size?.rows ?? 7;
  const at = { A: o(3, 3), B: o(8, 3) };
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: at[id as 'A'] ?? null }]));
  return { ...st, status: 'active', order: ['A', 'B'], turnIndex: 0, combatants, houseRules: flags,
    map: { ...(st.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: rows }, () => '.'.repeat(cols)), zones: [], objects: [] } } as BattleState;
}
function run(s: BattleState, cmd: Command, rng: Rng = high, ctx = P1) {
  const r = execute(s, cmd, ctx, rng);
  if (!r.ok) throw new Error(r.error);
  return r;
}
const fresh = (s: BattleState): BattleState => { const a = s.combatants.A as Combatant; return { ...s, combatants: { ...s.combatants, A: { ...a, economy: { ...a.economy, action: false, bonus: false, attacksLeft: 0 } } } }; };
const put = (s: BattleState, kind: ObjectKind, at: Offset, state?: 'locked' | 'open' | 'closed') => run(s, { type: 'place_object', kind, at, ...(state ? { state } : {}) }, high, GM).state;
const hit = (s: BattleState, at: Offset, option = club) => run(fresh(s), { type: 'attack_object', actorId: 'A', objectId: objectAt(s, at)!.id, option });
const replays = (start: BattleState, ...steps: Array<{ state: BattleState; events: BattleEvent[] }>) =>
  expect(replay([{ type: 'battle_started', state: start }, ...steps.flatMap((x) => x.events)])).toEqual(steps[steps.length - 1]?.state);

describe('nesne verisi ve zemin', () => {
  it('Game Master yerleştirir/kaldırır; SRD AC/HP; nesne etkin zemini değiştirir', () => {
    let s = put(arena(), 'chest', o(4, 3));
    expect(objectAt(s, o(4, 3))).toMatchObject({ kind: 'chest', hp: 10 });
    expect(terrainAt(s, o(4, 3))).toMatchObject({ movement: 'difficult', cover: 2, name: 'Sandık' });
    expect(execute(s, { type: 'place_object', kind: 'chest', at: o(5, 3) }, P1, high).ok).toBe(false);
    s = run(s, { type: 'place_object', at: o(4, 3) }, high, GM).state;
    expect(objectAt(s, o(4, 3))).toBeUndefined();
    s = put(s, 'door', o(5, 3));
    expect(terrainAt(s, o(5, 3))).toMatchObject({ movement: 'blocked', blocksSight: true });
    s = put(s, 'brazier', o(6, 3));
    expect(terrainAt(s, o(6, 3)).movement).toBe('blocked');
  });
});

describe('kırma ve tepkimeler', () => {
  it('yağ fıçısı kırılınca yağ bırakır (3 altıgen); ateşle vurulunca alev; replay aynı', () => {
    const s0 = put(arena(), 'oilBarrel', o(4, 3));
    const r = hit(s0, o(4, 3));
    expect(objectAt(r.state, o(4, 3))).toBeUndefined();
    expect(r.events.some((e) => e.type === 'object_destroyed')).toBe(true);
    const oil = r.state.map?.zones?.filter((z) => z.surface === 'oil') ?? [];
    expect(oil[0]?.hexes.length).toBe(3);
    replays(s0, r);
    const f = hit(put(arena(), 'oilBarrel', o(4, 3)), o(4, 3), torch);
    expect(surfacesAt(f.state, o(4, 3)).map((z) => z.surface)).toEqual(['fire']);
  });
  it('barut fıçısı: ev kuralı kapalıyken yalnızca yıkılır; açıkken patlar (DEX DC 13, 2d10 ateş, 10 ft) ve yağı tutuşturur', () => {
    const off = hit(put(arena(), 'powderKeg', o(4, 3)), o(4, 3));
    expect(off.events.some((e) => e.type === 'save_resolved')).toBe(false);
    let s = put(arena({ barutPatlama: true }), 'powderKeg', o(4, 3));
    s = run(s, { type: 'place_surface', kind: 'oil', hexes: [o(5, 3)] }, high, GM).state;
    const boom = hit(s, o(4, 3));
    const saves = boom.events.filter((e) => e.type === 'save_resolved') as Array<{ targetId: string; dc: number; damageType: string }>;
    expect(saves.map((x) => x.targetId)).toEqual(['A']);
    expect(saves[0]).toMatchObject({ dc: 13, damageType: 'fire' });
    expect(surfacesAt(boom.state, o(5, 3)).map((z) => z.surface)).toEqual(['fire']);
    replays(s, boom);
  });
  it('alan büyüsü alandaki nesnelere işler: Burning Hands yağ fıçısını tutuşturur', () => {
    const s = put(arena(), 'oilBarrel', o(4, 3));
    const r = run(fresh(s), { type: 'cast_spell', actorId: 'A', spellName: 'Burning Hands', targetHex: o(4, 3) });
    expect(objectAt(r.state, o(4, 3))).toBeUndefined();
    expect(surfacesAt(r.state, o(4, 3)).map((z) => z.surface)).toEqual(['fire']);
  });
});

describe('kullanım', () => {
  it('kapı: kilitliyken açılmaz; kilit DEX (Sleight of Hand) DC 15; açılınca geçilir; kırılır', () => {
    let s = put(arena(), 'door', o(4, 3), 'locked');
    expect(execute(fresh(s), { type: 'object_use', actorId: 'A', objectId: objectAt(s, o(4, 3))!.id, action: 'open' }, P1, high).ok).toBe(false);
    const fail = run(fresh(s), { type: 'object_use', actorId: 'A', objectId: objectAt(s, o(4, 3))!.id, action: 'unlock' }, low);
    expect(objectAt(fail.state, o(4, 3))?.state).toBe('locked');
    const ok = run(fresh(s), { type: 'object_use', actorId: 'A', objectId: objectAt(s, o(4, 3))!.id, action: 'unlock' }, high);
    expect(ok.events.find((e) => e.type === 'object_changed')).toMatchObject({ check: { dc: 15, success: true } });
    s = run(ok.state, { type: 'object_use', actorId: 'A', objectId: objectAt(ok.state, o(4, 3))!.id, action: 'open' }).state;
    expect(terrainAt(s, o(4, 3))).toMatchObject({ movement: 'normal', blocksSight: false });
    const broken = hit(put(arena(), 'door', o(4, 3), 'locked'), o(4, 3));
    expect(objectAt(broken.state, o(4, 3))).toBeUndefined();
    replays(put(arena(), 'door', o(4, 3), 'locked'), broken);
  });
  it('masa devrilince yarım örtü; mangal dökülünce bitişik altıgen alev ve yağı tutuşturur', () => {
    let s = put(arena(), 'table', o(4, 3));
    expect(terrainAt(s, o(4, 3)).cover).toBe(0);
    s = run(fresh(s), { type: 'object_use', actorId: 'A', objectId: objectAt(s, o(4, 3))!.id, action: 'tip' }).state;
    expect(terrainAt(s, o(4, 3)).cover).toBe(2);
    let m = put(arena(), 'brazier', o(4, 3));
    m = run(m, { type: 'place_surface', kind: 'oil', hexes: [o(5, 3), o(6, 3)] }, high, GM).state;
    const r = run(fresh(m), { type: 'object_use', actorId: 'A', objectId: objectAt(m, o(4, 3))!.id, action: 'knock', to: o(5, 3) });
    expect(surfacesAt(r.state, o(6, 3)).map((z) => z.surface)).toEqual(['fire']);
  });
});

describe('zar defteri, geniş harita, yapay zekâ', () => {
  it('elle zar: nesneye saldırının d20 zarı istenir; aynı zarla aynı sonuç', () => {
    const s0 = put(arena(), 'chest', o(4, 3));
    const step = (rng: Rng) => run(fresh(s0), { type: 'attack_object', actorId: 'A', objectId: objectAt(s0, o(4, 3))!.id, option: { ...club, damage: '1d4' } }, rng);
    const book = newBook();
    const opts = { ask: (req: { sides: number }) => req.sides === 20, auto: high };
    const first = runWithDice(step, book, opts);
    expect(first.ok).toBe(false);
    book.entries.push({ group: { ...(first.ok ? {} : first.need), sides: 20, count: 1, values: [1] } as never });
    const second = runWithDice(step, book, opts);
    expect(second.ok && second.value.events.find((e) => e.type === 'object_damaged')).toMatchObject({ roll: { d20: 1, hit: false }, damage: 0 });
  });
  it('geniş haritada (31×17) nesne yerleşir, köşede de çalışır; harita verisinden hazır nesneler', () => {
    const s = put(arena({}, { cols: 31, rows: 17 }, 'orman-yolu'), 'chest', o(30, 16));
    expect(objectAt(s, o(30, 16))?.kind).toBe('chest');
    expect(terrainAt(s, o(30, 16)).movement).toBe('difficult');
  });
  it('yapay zekâ: barut fıçısının 2 altıgen yakını yalnızca ev kuralı açıkken riskli', () => {
    expect(objectRisk(put(arena(), 'powderKeg', o(4, 3)), o(5, 3))).toBe(0);
    const on = put(arena({ barutPatlama: true }), 'powderKeg', o(4, 3));
    expect(objectRisk(on, o(5, 3))).toBe(25);
    expect(objectRisk(on, o(9, 3))).toBe(0);
  });
});
