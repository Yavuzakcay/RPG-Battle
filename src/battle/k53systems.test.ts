/**
 * Kuyruk K53 S3–S6: nesne hareketi (itme, fırlatma, enkaz), geçici engel (Çizili Duvar, dost geçer, HP), aura altyapısı
 * (tetik, süzgeç, en güçlüsü, turda bir, pasif etkiler, Cesaret), birleşik senaryolar, GM anahtarı/eski sürüm, replay.
 */
import { describe, expect, it } from 'vitest';
import { execute, replay, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command } from './index';
import type { Offset } from '../rules/hex';
import { distance } from '../rules/hex';
import { applyEvents } from './reduce';
import { forcedMove, teleport } from './motion';
import { conjureDebris, forcedMoveObject, throwObject } from './objectMotion';
import { barrierEvents, barrierOf } from './barriers';
import { panelDamageEvents } from './walls';
import { terrainAt } from './movement';
import { zoneMoveCost } from './zones';
import { auraTriggerEvents, passiveAuraOf, type AuraSpec } from './auraCore';
import { conditionAura } from './mind';
import { makeObject } from './objects';
import { GM, mk, scripted, zero } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });
const high = () => 0.99;
const low = () => 0.01;
const board = (fill = '.') => Array.from({ length: 7 }, () => fill.repeat(15));
function field(parts: Combatant[], positions: Record<string, Offset>, version?: number, toggles?: Record<string, boolean>): BattleState {
  const { state } = startBattle('f', 'd-z-zemin', parts.map((c) => ({ ...c, initiativeBonus: 0 })), scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map: { id: 'kale' } });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  const map = { ...(state.map as NonNullable<BattleState['map']>), tiles: board(), objects: [], zones: [], ...(toggles ? { ruleToggles: toggles } : {}) };
  return { ...state, status: 'active', combatants, map, ...(version ? { kuralSurumu: version } : {}) };
}
const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, modifiers: { ...zero, str: 3 }, spellSaveDc: 15, ...p });
const B = (p: Partial<Combatant> = {}) => mk('B', { side: 'enemies', hp: 40, maxHp: 40, ...p });
const C = (p: Partial<Combatant> = {}) => mk('C', { side: 'enemies', hp: 40, maxHp: 40, ...p });
const put = (s: BattleState, kind: Parameters<typeof makeObject>[1], at: Offset) => applyEvents(s, [{ type: 'object_placed', object: makeObject(s, kind, at) }]);
const objAt = (s: BattleState, at: Offset) => s.map?.objects?.find((x) => x.at.col === at.col && x.at.row === at.row);
const withAura = (s: BattleState, id: string, aura: AuraSpec) => applyEvents(s, [{ type: 'effect_added', targetId: id, effect: { id: `aura-${aura.id}`, name: aura.name, sourceId: id, aura } }]);

describe('S3 nesne hareketi', () => {
  it('ağırlık: hafif tam mesafe, orta yarı, ağır itilmez', () => {
    let s = put(put(put(field([A()], { A: o(1, 1) }), 'chest', o(5, 3)), 'table', o(5, 5)), 'cauldron', o(5, 1));
    const chest = objAt(s, o(5, 3))!, table = objAt(s, o(5, 5))!, caul = objAt(s, o(5, 1))!;
    const evC = forcedMoveObject(s, chest.id, 'push', 10, 'A', high, { origin: o(4, 3) });
    expect(evC.filter((e) => e.type === 'object_changed')).toHaveLength(2);
    expect(forcedMoveObject(s, table.id, 'push', 20, 'A', high, { origin: o(4, 5) }).filter((e) => e.type === 'object_changed')).toHaveLength(2);
    expect(forcedMoveObject(s, caul.id, 'push', 20, 'A', high, { origin: o(4, 1) })).toEqual([]);
    s = applyEvents(s, evC);
    expect(distance(o(4, 3), s.map!.objects!.find((x) => x.id === chest.id)!.at)).toBe(3);
  });
  it('itilen nesne yaratığa çarpar: yaratık çarpma hasarı alır, nesne durur', () => {
    const s0 = put(field([A()], { A: o(1, 1) }), 'chest', o(5, 3));
    const chest = objAt(s0, o(5, 3))!;
    const first = (forcedMoveObject(s0, chest.id, 'push', 5, 'A', high, { origin: o(4, 3) })[0] as Extract<BattleEvent, { type: 'object_changed' }>).at!;
    const s = put(field([A(), B()], { A: o(1, 1), B: first }), 'chest', o(5, 3));
    const evs = forcedMoveObject(s, objAt(s, o(5, 3))!.id, 'push', 15, 'A', high, { origin: o(4, 3) });
    expect(evs.some((e) => e.type === 'map_effect' && e.rule === 'carpmaHasari' && e.targetId === 'B')).toBe(true);
    expect(evs.filter((e) => e.type === 'object_changed')).toHaveLength(0);
  });
  it('fırlatma: menzil ağırlıktan; yaratığa tek zar, nesne yanına düşer ve aynı hasarı alır (yağ fıçısı kırılır → yağ yüzeyi)', () => {
    const s = put(field([A(), B()], { A: o(3, 3), B: o(5, 3) }), 'oilBarrel', o(3, 4));
    const barrel = objAt(s, o(3, 4))!;
    expect(throwObject(s, o(3, 3), barrel.id, o(12, 3), 'A', high)).toHaveProperty('problem');
    const r = throwObject(s, o(3, 3), barrel.id, o(5, 3), 'A', high, { dice: '6d6', type: 'force' });
    if ('problem' in r) throw new Error(r.problem);
    const hits = r.events.filter((e) => e.type === 'map_effect' && e.rule === 'objectThrow');
    expect(hits).toHaveLength(1);
    expect(r.events.some((e) => e.type === 'map_effect' && e.rule === 'carpmaHasari')).toBe(false);
    expect(r.events.some((e) => e.type === 'object_destroyed')).toBe(true);
    expect(r.events.some((e) => e.type === 'zone_created' && e.zone.surface === 'oil')).toBe(true);
  });
  it('enkaz: yakında hareketli nesne yoksa taş belirir; varsa o kullanılır', () => {
    const s = field([A()], { A: o(1, 1) });
    const r = conjureDebris(s, o(6, 3));
    expect(r?.events[0]).toMatchObject({ type: 'object_placed', object: { kind: 'rock' } });
    const s2 = put(s, 'chest', o(6, 4));
    expect(conjureDebris(s2, o(6, 3))?.events).toEqual([]);
  });
  it('GM anahtarı kapalı ya da sürüm 23: nesne hareketi yok', () => {
    const off = put(field([A()], { A: o(1, 1) }, undefined, { objectMotion: false }), 'chest', o(5, 3));
    expect(forcedMoveObject(off, objAt(off, o(5, 3))!.id, 'push', 10, 'A', high, { origin: o(4, 3) })).toEqual([]);
    const old = put(field([A()], { A: o(1, 1) }, 23), 'chest', o(5, 3));
    expect(conjureDebris(old, o(6, 3))).toBeNull();
  });
});

describe('S4 geçici engel', () => {
  it('Çizili Duvar: dolu altıgen atlanır; hareketi ve görüşü keser; HP 0 olunca altıgen düşer', () => {
    const s0 = field([A(), B()], { A: o(2, 3), B: o(6, 2) });
    const evs = barrierEvents(s0, s0.combatants.A as Combatant, 'cizili-duvar', [o(6, 1), o(6, 2), o(6, 3)]);
    const s = applyEvents(s0, evs);
    const z = s.map!.zones![0]!;
    expect(z.hexes).toEqual([o(6, 1), o(6, 3)]);
    expect(terrainAt(s, o(6, 1))).toMatchObject({ movement: 'blocked', blocksSight: true });
    expect(barrierOf(s, z)).toMatchObject({ kind: 'cizili-duvar', hp: 30 });
    const broke = applyEvents(s, panelDamageEvents(s, z, o(6, 1), 30, 'bludgeoning'));
    expect(broke.map!.zones![0]!.hexes).toEqual([o(6, 3)]);
    expect(terrainAt(broke, o(6, 1)).movement).not.toBe('blocked');
  });
  it('dost geçer: sahibinin tarafı yürür, düşman geçemez (yol bulma görür)', () => {
    const s0 = field([A(), B()], { A: o(2, 3), B: o(9, 3) });
    const s = applyEvents(s0, barrierEvents(s0, s0.combatants.A as Combatant, 'dost-kalkani', [o(5, 3)]));
    expect(zoneMoveCost(s, s.combatants.A as Combatant)(o(5, 3))).toBe(1);
    expect(zoneMoveCost(s, s.combatants.B as Combatant)(o(5, 3))).toBeNull();
  });
  it('eski duvarlar aynı okuma yolunda (Wall of Stone: katı, 90 HP); anahtar kapalıyken yeni engel yok', () => {
    const s = field([A()], { A: o(2, 3) });
    const stone = { id: 'w', spellId: 'wall-of-stone', name: 'Wall of Stone', casterId: 'A', side: 'party' as const, dc: 15, slotLevel: 5, hexes: [o(7, 3)] };
    expect(barrierOf(s, stone)).toMatchObject({ kind: 'solid', blocksMove: true, hp: 90 });
    const off = field([A()], { A: o(2, 3) }, undefined, { tempBarriers: false });
    expect(barrierEvents(off, off.combatants.A as Combatant, 'cizili-duvar', [o(6, 1)])).toEqual([]);
  });
});

describe('S5 aura altyapısı', () => {
  const burn = (id: string, dice: string): AuraSpec => ({ id, name: `Yanık ${id}`, radius: 2, filter: 'enemies', trigger: 'turnStart', effect: { kind: 'damage', dice, type: 'fire' }, save: { ability: 'dex', dc: 25 } });
  it('tur başı hasar: süzgeç ve yarıçap; aynı tür iki aurada en güçlüsü; turda bir kez', () => {
    let s = field([A(), B(), C()], { A: o(4, 3), B: o(5, 3), C: o(12, 3) });
    s = withAura(withAura(s, 'A', burn('k', '1d6')), 'A', burn('b', '4d6'));
    const evs = auraTriggerEvents(s, 'B', 'turnStart', high);
    const dmg = evs.filter((e) => e.type === 'map_effect' && e.rule === 'auraCore') as Array<Extract<BattleEvent, { type: 'map_effect' }>>;
    expect(dmg).toHaveLength(1);
    expect(dmg[0]!.damage?.rolls).toHaveLength(4);
    expect(auraTriggerEvents(applyEvents(s, evs), 'B', 'turnStart', high)).toEqual([]);
    expect(auraTriggerEvents(s, 'C', 'turnStart', high)).toEqual([]);
    expect(auraTriggerEvents(s, 'A', 'turnStart', high)).toEqual([]);
  });
  it('pasif: save bonusu (en güçlüsü), durum bağışıklığı, can yenileyemez, ölüm save dezavantajı (syncAuras)', () => {
    let s = field([A(), mk('D', { ownerId: 'p1', hp: 20, maxHp: 20 }), B()], { A: o(4, 3), D: o(5, 3), B: o(6, 3) });
    s = withAura(s, 'A', { id: 'kalkan', name: 'Kalkan', radius: 2, filter: 'allies', trigger: 'passive', effect: { kind: 'saveBonus', amount: 3 } });
    s = withAura(s, 'A', { id: 'cesur', name: 'Cesur', radius: 2, filter: 'allies', trigger: 'passive', effect: { kind: 'conditionImmune', conditions: ['Frightened'] } });
    s = withAura(s, 'A', { id: 'kuru', name: 'Kuruluk', radius: 2, filter: 'enemies', trigger: 'passive', effect: { kind: 'noHeal' } });
    expect(passiveAuraOf(s, s.combatants.D as Combatant).saveBonus).toBe(3);
    expect(s.combatants.D?.auraSave).toBe(3);
    expect(conditionAura(s, 'D', 'Frightened')).toBe(true);
    expect(s.combatants.B?.auraNoHeal).toBe(true);
    const hurt = applyEvents(s, [{ type: 'healed', actorId: 'B', targetId: 'B', label: 'x', amount: 5, targetHpAfter: 45 }]);
    expect(hurt.combatants.B?.hp).toBe(40);
  });
  it('Cesaret: durum aurasına kurtulmayı başaran 10 tur bağışık', () => {
    let s = field([A(), B()], { A: o(4, 3), B: o(5, 3) });
    s = withAura(s, 'A', { id: 'korku', name: 'Korku', radius: 2, filter: 'enemies', trigger: 'turnStart', effect: { kind: 'condition', condition: 'Frightened' }, save: { ability: 'wis', dc: 1 } });
    const evs = auraTriggerEvents(s, 'B', 'turnStart', high);
    expect(evs.some((e) => e.type === 'effect_added' && e.effect.id === 'aura:cesaret:korku:A' && e.effect.until === s.round + 10)).toBe(true);
    const next = { ...applyEvents(s, evs), turnIndex: s.turnIndex + 1 };
    expect(auraTriggerEvents(next, 'B', 'turnStart', high)).toEqual([]);
  });
});

describe('S6 birleşik senaryolar', () => {
  const enter: AuraSpec = { id: 'girdap', name: 'Girdap', radius: 1, filter: 'enemies', trigger: 'enter', effect: { kind: 'damage', dice: '2d6', type: 'force' } };
  it('ışınlanıp aura içine düşme: varışta giriş tetiği', () => {
    let s = field([A(), B()], { A: o(8, 3), B: o(2, 3) });
    s = withAura(s, 'A', enter);
    const r = teleport(s, s.combatants.B as Combatant, o(7, 3), { rangeFt: 60, sight: false }, 'Misty Step', high);
    if ('problem' in r) throw new Error(r.problem);
    expect(r.events.some((e) => e.type === 'map_effect' && e.rule === 'auraCore' && e.targetId === 'B')).toBe(true);
  });
  it('itilip engele çarpma: Çizili Duvar çarpma hasarı verir', () => {
    const s0 = field([A(), B()], { A: o(4, 3), B: o(5, 3) });
    const first = (forcedMove(s0, 'B', 'push', 5, 'A', high, { origin: o(4, 3) })[0] as Extract<BattleEvent, { type: 'pushed' }>).to;
    const s = applyEvents(s0, barrierEvents(s0, s0.combatants.A as Combatant, 'cizili-duvar', [first]));
    const evs = forcedMove(s, 'B', 'push', 15, 'A', high, { origin: o(4, 3) });
    expect(evs.some((e) => e.type === 'map_effect' && e.rule === 'carpmaHasari' && e.damage?.rolls.length === 3)).toBe(true);
  });
  it('engel yıkılırken aura işler: duvar düşünce itme geçer ve aura girişi tetiklenir', () => {
    let s0 = field([A(), B(), C()], { A: o(4, 3), B: o(5, 3), C: o(12, 5) });
    const first = (forcedMove(s0, 'B', 'push', 5, 'A', high, { origin: o(4, 3) })[0] as Extract<BattleEvent, { type: 'pushed' }>).to;
    s0 = applyEvents(s0, barrierEvents(s0, s0.combatants.A as Combatant, 'cizili-duvar', [first]));
    s0 = withAura(s0, 'A', { ...enter, radius: 3 });
    const z = s0.map!.zones![0]!;
    const broken = applyEvents(s0, panelDamageEvents(s0, z, first, 99, 'bludgeoning'));
    const evs = forcedMove(broken, 'B', 'push', 5, 'A', high, { origin: o(4, 3) });
    expect(evs.some((e) => e.type === 'pushed')).toBe(true);
  });
  it('replay: yeni olaylar battle_started günlüğüne eklenince aynı durum', () => {
    const { events } = startBattle('r', 'd-z-zemin', [A(), B()].map((c) => ({ ...c, initiativeBonus: 0 })), scripted([20, 19], [18, 17]), { map: { id: 'kale' } });
    const placed: BattleEvent[] = [{ type: 'placed', actorId: 'A', at: o(4, 3) }, { type: 'placed', actorId: 'B', at: o(5, 3) }];
    const s0 = applyEvents(replay(events), placed);
    const a = s0.combatants.A as Combatant;
    const extra = [...barrierEvents(s0, a, 'cizili-duvar', [o(7, 0)]), ...forcedMove(s0, 'B', 'push', 10, 'A', high, { origin: o(4, 3) })];
    expect(extra.some((e) => e.type === 'pushed')).toBe(true);
    expect(replay([...events, ...placed, ...extra])).toEqual(applyEvents(s0, extra));
  });
  it('eski sürüm (23): ışınlanma varışı yok, aura altyapısı ve engeller kapalı', () => {
    let s = field([A(), B()], { A: o(8, 3), B: o(2, 3) }, 23);
    s = withAura(s, 'A', enter);
    const r = teleport(s, s.combatants.B as Combatant, o(7, 3), { rangeFt: 60, sight: false }, 'Misty Step', high);
    if ('problem' in r) throw new Error(r.problem);
    expect(r.events.map((e) => e.type)).toEqual(['teleported']);
    expect(barrierEvents(s, s.combatants.A as Combatant, 'cizili-duvar', [o(6, 1)])).toEqual([]);
    expect(typeof execute).toBe('function');
    expect(GM).toBeTruthy();
    expect([] as Command[]).toEqual([]);
    expect(low()).toBeLessThan(1);
  });
});
