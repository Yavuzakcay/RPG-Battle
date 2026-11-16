/** Kuyruk KQ3 NA1 (kural sürümü 80): nesne ağırlığı ve taşıma. */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, mk } from './fixtures';
import { replay } from './reduce';
import { applyEvents } from './reduce';
import { goalEvents, goalStatus } from './goals';
import { speedHexes } from './reduce';
import { OBJECTS } from './objectData';
import { objectWeightLb, weightClassOf, throwRangeByWeight, capacityOf } from './nesneAgirlik';
import { weightOf, throwRangeFt } from './objectMotion';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command, MapObject, ObjectKind } from './types';
import srdMagic from '../../data/srd/magic-items.json';
import srdWeapons from '../../data/srd/weapons.json';
import nesneler from '../../data/nesneler.json';
import aciklamalar from '../../data/aciklamalar-tr.json';

const o = (col: number, row: number): Offset => ({ col, row });
const high = () => 0.99;

function arena(opts: { tasima?: 'off' | 'srd' | 'tiered'; rules?: number; strs?: number[] } = {}): BattleState {
  const strs = opts.strs ?? [10, 16];
  const party = strs.map((str, i) => mk(`P${i}`, { ownerId: `p${i}`, strScore: str, hp: 40, maxHp: 40 }));
  const foe = mk('E', { side: 'enemies', hp: 500, maxHp: 500, ac: 5 });
  const st = startBattle('na1', 'd-z-zemin', [...party, foe], () => 0.5, { map: { id: 'col' }, ...(opts.tasima ? { tasima: opts.tasima } : {}), ...(opts.rules ? { kuralSurumu: opts.rules } : {}) }).state;
  const at: Record<string, Offset> = { P0: o(3, 3), P1: o(4, 3), P2: o(2, 3), E: o(10, 3) };
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: at[id] ?? null }]));
  return { ...st, status: 'active', order: [...party.map((p) => p.id), 'E'], turnIndex: 0, combatants,
    map: { ...(st.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)), zones: [], objects: [] } } as BattleState;
}
const ctxOf = (s: BattleState, cmd: Command) => ('actorId' in cmd && typeof cmd.actorId === 'string' ? { playerId: s.combatants[cmd.actorId]?.ownerId ?? null, isGm: false } : GM);
const run = (s: BattleState, cmd: Command, ctx?: typeof GM) => { const r = execute(s, cmd, ctx ?? ctxOf(s, cmd), high); if (!r.ok) throw new Error(r.error); return r; };
const err = (s: BattleState, cmd: Command, ctx?: typeof GM): string => { const r = execute(s, cmd, ctx ?? ctxOf(s, cmd), high); return r.ok ? '' : r.error; };
const put = (s: BattleState, kind: ObjectKind, at: Offset) => run(s, { type: 'place_object', kind, at }, GM).state;
const obj = (s: BattleState): MapObject => (s.map?.objects ?? [])[0] as MapObject;
const turn = (s: BattleState, id: string): BattleState => ({ ...s, turnIndex: s.order.indexOf(id) });
const take = (s: BattleState, actor: string, id: string) => err(s, { type: 'object_use', actorId: actor, objectId: id, action: 'take' });
const fresh = (s: BattleState, id: string): BattleState => { const a = s.combatants[id] as Combatant; return { ...s, combatants: { ...s.combatants, [id]: { ...a, economy: { ...a.economy, interacted: false } } } }; };

describe('NA1 kapasite', () => {
  it('sürüm 80+; STR 10 = 150 lb, STR 16 = 240 lb', () => {
    const s = arena();
    expect(s.kuralSurumu).toBeGreaterThanOrEqual(80);
    expect(capacityOf(s.combatants.P0 as Combatant)).toBe(150);
    expect(capacityOf(s.combatants.P1 as Combatant)).toBe(240);
  });
  it('kapasite içinde normal al; üstü tek kişiye red (neden metni, kaç kişi)', () => {
    let s = put(arena({ tasima: 'srd', strs: [10] }), 'chest', o(3, 2));
    expect(take(s, 'P0', obj(s).id)).toBe('');
    s = run(s, { type: 'set_object_weight', objectId: obj(s).id, lb: 400 }, GM).state;
    const msg = take(s, 'P0', obj(s).id);
    expect(msg).toContain('Çok ağır'); expect(msg).toContain('3 kişi gerekir');
  });
  it('GM ağırlık değişimi: sandık 25 → 400 lb tek kişi taşıyamaz; varsayılana dön; günlük etiketi', () => {
    let s = put(arena({ tasima: 'srd', strs: [16] }), 'chest', o(3, 2));
    expect(objectWeightLb(obj(s))).toBe(25);
    const r = run(s, { type: 'set_object_weight', objectId: obj(s).id, lb: 400 }, GM);
    expect(objectWeightLb(obj(r.state))).toBe(400);
    expect(JSON.stringify(r.events)).toContain('ağırlık 25 → 400 lb');
    expect(take(r.state, 'P0', obj(r.state).id)).toContain('Çok ağır');
    const back = run(r.state, { type: 'set_object_weight', objectId: obj(s).id, lb: null }, GM).state;
    expect(obj(back).agirlikLb).toBeUndefined();
    expect(take(back, 'P0', obj(back).id)).toBe('');
    expect(err(s, { type: 'set_object_weight', objectId: obj(s).id, lb: 5001 }, GM)).toContain('olmalı');
    expect(err(s, { type: 'set_object_weight', objectId: obj(s).id, lb: 0.1 }, GM)).toContain('olmalı');
    expect(err(s, { type: 'set_object_weight', objectId: obj(s).id, lb: 10 }, { playerId: 'p0', isGm: false })).toContain('Game Master');
  });
  it('Taşıma yükü kapalı (oda kuralı): ağırlık sınırı yok (eski davranış)', () => {
    let s = put(arena({ tasima: 'off', strs: [10] }), 'chest', o(3, 2));
    s = run(s, { type: 'set_object_weight', objectId: obj(s).id, lb: 4000 }, GM).state;
    expect(take(s, 'P0', obj(s).id)).toBe('');
    let u = put(arena({ strs: [10] }), 'chest', o(3, 2)); // tasima yok = sınır yok
    u = run(u, { type: 'set_object_weight', objectId: obj(u).id, lb: 4000 }, GM).state;
    expect(take(u, 'P0', obj(u).id)).toBe('');
  });
  it('eski sürüm (79) ağırlık sınırı ve komut yok', () => {
    let s = put(arena({ tasima: 'srd', rules: 79, strs: [10] }), 'chest', o(3, 2));
    expect(take(s, 'P0', obj(s).id)).toBe('');
    expect(err(s, { type: 'set_object_weight', objectId: obj(s).id, lb: 400 }, GM)).toContain('kural sürümünde yok');
    s = run(s, { type: 'object_use', actorId: 'P0', objectId: obj(s).id, action: 'take' }).state;
    expect(obj(s).carriedBy).toBe('P0');
  });
});

describe('NA1 ortak taşıma', () => {
  it('ağır nesne iki kişiyle: bitişik dost yükü paylaşır, ikisinin de hızı yarıya; Al ve çıkar hedefi', () => {
    let s = put(arena({ tasima: 'srd', strs: [16, 16] }), 'chest', o(3, 2));
    s = run(s, { type: 'set_object_weight', objectId: obj(s).id, lb: 400 }, GM).state;
    const solo = take(s, 'P0', obj(s).id);
    expect(solo).toBe(''); // P1 (STR 16) bitişik: birlikte 480 ≥ 400
    const r = run(s, { type: 'object_use', actorId: 'P0', objectId: obj(s).id, action: 'take' });
    expect(obj(r.state).carriedBy).toBe('P0');
    expect(obj(r.state).carriers).toEqual(['P1']);
    expect(JSON.stringify(r.events)).toContain('yük paylaşıldı');
    const base = speedHexes(s.combatants.P0 as Combatant);
    expect(speedHexes(r.state.combatants.P0 as Combatant)).toBe(Math.floor(base / 2));
    expect(speedHexes(r.state.combatants.P1 as Combatant)).toBe(Math.floor(speedHexes(s.combatants.P1 as Combatant) / 2));
    // Al ve çıkar: taşıyanlardan biri çıkışa varınca tamam
    const goal = { id: 'g', kind: 'retrieve' as const, objectId: obj(s).id, hexes: [o(9, 3)] };
    const withGoal: BattleState = { ...r.state, goals: { mode: 'all', list: [goal] } };
    expect(goalStatus(withGoal, goal)).toBe('open');
    const moved = { ...withGoal, combatants: { ...withGoal.combatants, P1: { ...(withGoal.combatants.P1 as Combatant), pos: o(9, 3) } } };
    expect(goalStatus(moved, goal)).toBe('done');
  });
  it('yetmezse red: yanında yeterli yardımcı yok', () => {
    let s = put(arena({ tasima: 'srd', strs: [10, 10] }), 'chest', o(3, 2));
    s = run(s, { type: 'set_object_weight', objectId: obj(s).id, lb: 1000 }, GM).state;
    expect(take(s, 'P0', obj(s).id)).toContain('kişi gerekir');
  });
  it('biri bırakırsa kalan kapasiteye bakar: yetmezse nesne düşer, yetiyorsa yük kalanda', () => {
    let s = put(arena({ tasima: 'srd', strs: [16, 16, 16] }), 'chest', o(3, 2));
    s = run(s, { type: 'set_object_weight', objectId: obj(s).id, lb: 600 }, GM).state; // 3 × 240 = 720 ≥ 600 (üçü gerekli: iki 480 < 600)
    s = run(s, { type: 'object_use', actorId: 'P0', objectId: obj(s).id, action: 'take' }).state;
    expect(obj(s).carriers?.length).toBe(2);
    const left = run(turn(s, 'P1'), { type: 'object_use', actorId: 'P1', objectId: obj(s).id, action: 'put' });
    expect(obj(left.state).carriedBy).toBeUndefined(); // kalan ikisi 480 < 600: düştü
    expect(left.events.some((e) => e.type === 'object_changed' && e.carriedBy === null)).toBe(true);
    // ağırlık 400 iken biri bırakınca kalan ikisi 480 ≥ 400: yük kalanlarda
    let t = put(arena({ tasima: 'srd', strs: [16, 16, 16] }), 'chest', o(3, 2));
    t = run(t, { type: 'set_object_weight', objectId: obj(t).id, lb: 700 }, GM).state;
    t = run(t, { type: 'object_use', actorId: 'P0', objectId: obj(t).id, action: 'take' }).state;
    t = run(t, { type: 'set_object_weight', objectId: obj(t).id, lb: 400 }, GM).state;
    const l2 = run(turn(t, 'P1'), { type: 'object_use', actorId: 'P1', objectId: obj(t).id, action: 'put' });
    expect(obj(l2.state).carriedBy).toBe('P0');
    expect(obj(l2.state).carriers ?? []).toEqual(['P2']);
  });
  it('taşıyan Prone / Incapacitated / ölürse nesne düşer (komut sonu)', () => {
    let s = put(arena({ tasima: 'srd', strs: [16] }), 'chest', o(3, 2));
    s = run(s, { type: 'object_use', actorId: 'P0', objectId: obj(s).id, action: 'take' }).state;
    expect(obj(s).carriedBy).toBe('P0');
    const prone = { ...s, combatants: { ...s.combatants, P0: { ...(s.combatants.P0 as Combatant), conditions: ['Prone'] } } } as BattleState;
    // komut sonu temizliği: bir sonraki komutta düşer
    const r = run(prone, { type: 'end_turn', actorId: 'P0' });
    expect(obj(r.state).carriedBy).toBeUndefined();
    expect(JSON.stringify(r.events)).toContain('yere düştü');
    const dead = { ...s, combatants: { ...s.combatants, P0: { ...(s.combatants.P0 as Combatant), hp: 0, life: 'dead' } } } as BattleState;
    expect(goalEvents({ ...dead, goals: { mode: 'all', list: [{ id: 'x', kind: 'defeat' }] } }).some((e) => e.type === 'object_changed')).toBe(true);
  });
  it('ağırlık bırakma (put) tek taşıyıcıda her nesne için', () => {
    let s = put(arena({ tasima: 'srd', strs: [10] }), 'chest', o(3, 2));
    s = run(s, { type: 'object_use', actorId: 'P0', objectId: obj(s).id, action: 'take' }).state;
    const r = run(s, { type: 'object_use', actorId: 'P0', objectId: obj(s).id, action: 'put' });
    expect(obj(r.state).carriedBy).toBeUndefined();
    expect(obj(r.state).at).toEqual(o(3, 3));
  });
});

describe('NA1 ağırlık sınıfı ve fırlatma', () => {
  it('sınıf ve menzil ağırlıktan; GM ağırlığı artırınca sınıf ve menzil değişir', () => {
    expect([10, 50, 51, 150, 151].map(weightClassOf)).toEqual(['hafif', 'hafif', 'orta', 'orta', 'agir']);
    expect([5, 10, 11, 50, 51, 150, 151].map(throwRangeByWeight)).toEqual([30, 30, 20, 20, 10, 10, 0]);
    let s = put(arena({ tasima: 'srd' }), 'chest', o(3, 2));
    expect(weightOf(obj(s), s)).toBe('hafif');
    expect(throwRangeFt(obj(s), s)).toBe(20);
    s = run(s, { type: 'set_object_weight', objectId: obj(s).id, lb: 300 }, GM).state;
    expect(weightOf(obj(s), s)).toBe('agir');
    expect(throwRangeFt(obj(s), s)).toBe(0);
  });
  it('eski sürümde sınıf türden (sandık hafif, 30 ft)', () => {
    const s = put(arena({ rules: 79 }), 'chest', o(3, 2));
    expect(weightOf(obj(s), s)).toBe('hafif');
    expect(throwRangeFt(obj(s), s)).toBe(30);
  });
});

describe('NA1 yeni nesne türleri ve kimlikler', () => {
  const NEW: ObjectKind[] = ['sword', 'statue', 'potion', 'wand', 'amulet', 'ring'];
  it('altı yeni tür var; ağırlık ve TR/EN ad; Kılıç SRD silahı, 4 büyülü eşya SRD sihirli eşya, Heykel dekor', () => {
    const sw = new Set(srdWeapons.weapons.map((w) => w.id));
    const mi = new Set(srdMagic.items.map((i) => i.id));
    for (const k of NEW) {
      const d = OBJECTS[k];
      expect(d, k).toBeDefined(); expect(d.tr && d.en, k).toBeTruthy(); expect(d.agirlikLb, k).toBeGreaterThan(0);
    }
    expect(OBJECTS.sword.srd).toBe('weapons:longsword'); expect(OBJECTS.sword.weapon).toBeTruthy(); expect(sw.has('longsword')).toBe(true);
    expect(OBJECTS.statue.dekor).toBe(true); expect(OBJECTS.statue.agirlikLb).toBeGreaterThanOrEqual(500);
    for (const k of ['potion', 'wand', 'amulet', 'ring'] as const) {
      const [file, id] = (OBJECTS[k].srd as string).split(':');
      expect(file).toBe('magic-items'); expect(mi.has(id as string), k).toBe(true);
      const esya = aciklamalar.esya as Record<string, string>; // eşya kaydı tekil kimlikli (potion-of-healing); SRD kimliği çoğul olabilir
      expect(esya[id as string] ?? esya[(id as string).replace(/^potions-/, 'potion-')], `${k} Türkçe açıklama`).toBeTruthy();
    }
  });
  it('srdIds kuralı: SRD karşılığı olmayan tür yalnız `dekor` işaretiyle; yinelenen srd yok', () => {
    const kinds = nesneler.kinds as unknown as Record<string, { srd?: string; dekor?: boolean; buyulu?: boolean }>;
    const seen = new Set<string>();
    for (const k of NEW) {
      const d = kinds[k] as { srd?: string; dekor?: boolean };
      expect(!!d.srd || d.dekor === true, k).toBe(true);
      if (d.srd) { expect(seen.has(d.srd)).toBe(false); seen.add(d.srd); }
    }
  });
  it('yeni nesneler yerleştirilir ve alınır (kılıç doğaçlama değil, silah verisiyle)', () => {
    let s = arena({ tasima: 'srd', strs: [10] });
    for (const [i, k] of NEW.filter((x) => x !== 'statue').entries()) s = put(s, k, o(2, i));
    expect(s.map?.objects?.length).toBe(5);
    const sword = (s.map?.objects ?? []).find((x) => x.kind === 'sword') as MapObject;
    const r = run({ ...s, combatants: { ...s.combatants, P0: { ...(s.combatants.P0 as Combatant), pos: o(2, 0) } } }, { type: 'object_use', actorId: 'P0', objectId: sword.id, action: 'take' });
    expect(obj({ ...r.state, map: { ...(r.state.map as NonNullable<BattleState['map']>), objects: [r.state.map?.objects?.find((x) => x.id === sword.id) as MapObject] } }).carriedBy).toBe('P0');
  });
  it('Heykel 600 lb: ağır sınıf; iki STR 16 dostla bile 480 < 600, üç kişi gerekir', () => {
    let s = put(arena({ tasima: 'srd', strs: [16, 16] }), 'statue', o(3, 2));
    expect(weightOf(obj(s), s)).toBe('agir');
    expect(take(s, 'P0', obj(s).id)).toContain('3 kişi gerekir');
    s = run(s, { type: 'set_object_weight', objectId: obj(s).id, lb: 400 }, GM).state;
    expect(take(s, 'P0', obj(s).id)).toBe('');
  });
});

describe('NA1 replay', () => {
  it('taşıma, ortak yük ve ağırlık komutu olaylardan aynı durumu üretir', () => {
    const start = arena({ tasima: 'srd', strs: [16, 16] });
    const a = run(start, { type: 'place_object', kind: 'chest', at: o(3, 2) }, GM);
    const b = run(a.state, { type: 'set_object_weight', objectId: obj(a.state).id, lb: 400 }, GM);
    const c = run(b.state, { type: 'object_use', actorId: 'P0', objectId: obj(b.state).id, action: 'take' });
    const d = run(c.state, { type: 'object_use', actorId: 'P0', objectId: obj(c.state).id, action: 'put' });
    const events: BattleEvent[] = [{ type: 'battle_started', state: start }, ...a.events, ...b.events, ...c.events, ...d.events];
    expect(replay(events)).toEqual(d.state);
    expect(applyEvents(start, [...a.events, ...b.events, ...c.events, ...d.events])).toEqual(d.state);
  });
});

describe('NA1 arayüz ve yapay zekâ', () => {
  it('nesne etkileşimi: taşınabilir nesne al / bırak (sürüm 80+); bilgi satırında ağırlık', async () => {
    const { objectCommand } = await import('../ui/gm/objectActions');
    let s = put(arena({ tasima: 'srd', strs: [10] }), 'sword', o(3, 2));
    const p0 = s.combatants.P0 as Combatant;
    expect(objectCommand(s, p0, obj(s))).toMatchObject({ action: 'take' });
    s = run(s, { type: 'object_use', actorId: 'P0', objectId: obj(s).id, action: 'take' }).state;
    expect(objectCommand(s, s.combatants.P0 as Combatant, obj(s))).toMatchObject({ action: 'put' });
  });
  it('yapay zekâ taşıyamayacağı ya da yardım gerektiren nesneyi almaz', async () => {
    const { limitsOn, liftPlan } = await import('./nesneAgirlik');
    let s = put(arena({ tasima: 'srd', strs: [10, 16] }), 'chest', o(3, 2));
    expect(limitsOn(s)).toBe(true);
    expect(liftPlan(s, s.combatants.P0 as Combatant, obj(s))).toEqual({ helpers: [] });
    s = run(s, { type: 'set_object_weight', objectId: obj(s).id, lb: 300 }, GM).state;
    const plan = liftPlan(s, s.combatants.P0 as Combatant, obj(s));
    expect('helpers' in plan && plan.helpers.length > 0).toBe(true); // yardımcı gerekiyor → yapay zekâ vazgeçer (ai.ts)
  });
});
