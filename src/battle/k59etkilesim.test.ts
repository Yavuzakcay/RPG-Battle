/**
 * Kuyruk K59 Görev 2: sistemler arası etkileşimler (yeni mekanik yok; mevcut davranış testle sabitlenir).
 *  1. Moral Çökmüş × Birlik can havuzu × Ortak Can (paket ilkeli): havuza düşen hasar, Omuz Ver'i çökmüş veremez,
 *     havuzdaki dost ikinci havuza katılmaz, Yıkılmaz Birlik bir kez, havuz biterse çökmüş de ölür.
 *  2. Karadul Örümcek Biçimi × aura: geçici can yığılmaz (yüksek olan), biçim aura canıyla sürer, bırakınca geçici can
 *     sıfır; pasif kurtulma aurası biçimde de geçer.
 *  3. Işınlanma × geçici engel × yüzey: engel altıgenine ışınlanılamaz, görüşü kesen engelin arkasına görüş isteyen
 *     ışınlanma yok, görüş istemeyen ışınlanma engelin ardındaki alev yüzeyine iner ve yüzey girişi işler.
 *  4. Hizalanma olayı × Moral vicdanı × Motivasyon günlüğü: günlük kayıp sınırı, taban, savrulma, geri alma Moral'e
 *     dokunmaz, günlükteki Moral farklarının toplamı = Moral değişimi.
 *  5. Arazi etkisi × yüzey zinciri: kuru çalılıkta Fireball → arazi alevi + yağ tepkimesi tek komutta, zincir sınırı,
 *     aynı ikili bir kez; replay aynı.
 */
import { afterEach, describe, expect, it } from 'vitest';
import p10 from '../../tests/fixtures/paket-p10.json';
import { validatePack } from '../content/schema';
import { applyPackSubclasses } from '../content/paket';
import { classData } from '../data';
import { kitArena, kitHero, o, mid, high } from './k54bKit';
import { applyEvents, replay } from './reduce';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { shoulderOf } from './imzaBirlik';
import { moraleAfterEvents } from './morale';
import { teleport } from './motion';
import { barrierEvents } from './barriers';
import { auraTriggerEvents, passiveAuraOf, type AuraSpec } from './auraCore';
import { SPIDER_KEY, KARADUL_ID } from './karadul';
import { GM, P1, mk } from './fixtures';
import { blankCharacter } from '../rules/builder';
import { seededRng } from '../rules/dice';
import { applyAlignAct } from '../rules/alignmentMoral';
import { newAlignment, toggleUndo } from '../rules/alignment';
import type { CharacterSheet } from '../rules/stats';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, Command } from './types';
import './imza';

afterEach(() => applyPackSubclasses([]));
const patch = (s: BattleState, id: string, p: Partial<Combatant>): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), ...p } } });
const COLLAPSE: ActiveEffect = { id: 'moral:cokmus', name: 'Çökmüş', sourceId: 'C', grants: ['Incapacitated'], speedZero: true, attackedAdv: true } as ActiveEffect;
const members = (s: BattleState, pool: string) => Object.values(s.combatants).filter((c) => c.poolId === pool).map((c) => c.id);
const hit = (id: string, n: number): BattleEvent => ({ type: 'map_effect', rule: 'test', targetId: id, text: 'test', hpAfter: 0, damage: { type: 'force', applied: n } } as BattleEvent);

describe('K59 G2.1: Moral Çökmüş × Birlik can havuzu × Ortak Can', () => {
  function setup() {
    const v = validatePack(p10, { taken: classData.subclasses.map((s) => s.id), packs: [] });
    if (!v.ok) throw new Error('fikstür');
    applyPackSubclasses(v.pack.subclasses);
    // F (paket Ortak Can) ve boştaki dost E Birlik havuzunun yarıçapı dışında.
    const F = { ...kitHero({ cls: 'fighter', sub: 'denge-muhafizi', level: 17 }, 'F'), pos: o(12, 1) } as Combatant;
    const ally = (id: string, pos: { col: number; row: number }) => ({ ...mk(id, { ownerId: 'p1', hp: 30, maxHp: 30 }), pos }) as Combatant;
    const r = kitArena({ cls: 'cleric', sub: 'imza_birlik', level: 17, scores: { wis: 16 }, house: false, place: { C: o(4, 4), B: o(14, 8) }, extra: [ally('D', o(2, 3)), F, ally('E', o(12, 2))] });
    r.state = { ...r.state, houseRules: { ...r.state.houseRules, moralSistemi: true } };
    for (const id of ['A', 'C', 'D', 'E', 'F']) r.state = patch(r.state, id, { moralMax: 4, moral: 3 });
    r.events = [{ type: 'battle_started', state: r.state } as BattleEvent];
    r.do(r.use('forge-bond'));
    r.fresh();
    r.do(r.use('shared-vitality'));
    return r;
  }
  it('havuz kurulur; çökmüş üyeye gelen hasar havuzdan düşer; çökmüş dost Omuz Ver veremez', () => {
    const r = setup();
    const pool = Object.values(r.state.hpPools ?? {})[0]!;
    expect(members(r.state, pool.id)).toEqual(expect.arrayContaining(['C', 'D']));
    // Rahibin (A) tepkisi harcanmış: D'nin tek omuzu C (Bağlı, tepkisi hazır).
    const s0 = patch(r.state, 'A', { economy: { ...r.c('A').economy, reaction: true } });
    expect(shoulderOf(s0, s0.combatants.D!)?.id).toBe('C');
    const s1 = applyEvents(s0, [{ type: 'moral_changed', targetId: 'C', delta: -3, moral: 0, reason: 'korku' }, { type: 'effect_added', targetId: 'C', effect: COLLAPSE }]);
    expect(s1.combatants.C!.conditions.includes('Incapacitated') || s1.combatants.C!.effects?.some((e) => e.grants?.includes('Incapacitated'))).toBe(true);
    // Çökmüş (Incapacitated) dost tepki veremez: Omuz Ver kaynağı olamaz.
    expect(shoulderOf(s1, s1.combatants.D!)).toBeUndefined();
    const s2 = applyEvents(s1, [{ ...hit('C', 10), hpAfter: s1.combatants.C!.hp - 10 } as BattleEvent]);
    expect(s2.hpPools![pool.id]!.hp).toBe(pool.hp - 10);
  });
  it('havuzdaki dost Ortak Can havuzuna katılmaz; boşta dost yoksa reddedilir, boşta dostla ayrı havuz', () => {
    const r = setup();
    const before = Object.keys(r.state.hpPools ?? {}).length;
    const inPool = new Set(Object.values(r.state.combatants).filter((c) => c.poolId).map((c) => c.id));
    r.state = { ...r.state, turnIndex: r.state.order.indexOf('F') };
    const key = (r.c('F').features ?? []).find((f) => f.key.includes('denge-muhafizi/birlik'))?.key as string;
    expect(key).toBeTruthy();
    const cmd = { type: 'use_feature', actorId: 'F', feature: key } as Command;
    expect(inPool.has('F') || inPool.has('E')).toBe(false);
    // E yokken (havuzdakiler katılamaz) reddedilir.
    const alone = execute(patch(r.state, 'E', { pos: o(0, 8) }), cmd, P1, mid);
    expect(alone.ok).toBe(false);
    const x = execute(r.state, cmd, P1, mid);
    expect(x.ok).toBe(true);
    if (!x.ok) return;
    const pools = Object.values(x.state.hpPools ?? {});
    expect(pools.length).toBe(before + 1);
    const fresh = x.state.combatants.F!.poolId as string;
    expect(fresh).toBeTruthy();
    expect(members(x.state, fresh).some((id) => inPool.has(id))).toBe(false);
    for (const id of inPool) expect(x.state.combatants[id]!.poolId).toBe(r.state.combatants[id]!.poolId);
  });
  it('havuz 0: Yıkılmaz Birlik bir kez tutar; sonra çökmüş üye dahil hepsi ölür; ölü havuz diğer havuza dokunmaz', () => {
    const r = setup();
    const pool = Object.values(r.state.hpPools ?? {})[0]!;
    let s = applyEvents(r.state, [{ type: 'effect_added', targetId: 'C', effect: COLLAPSE }]);
    s = applyEvents(s, [hit('C', 999)]);
    expect(s.hpPools![pool.id]!.hp).toBeGreaterThan(0);
    expect(s.combatants.C!.life).not.toBe('dead');
    // Yıkılmaz Birlik üyelerin Motivasyonunu doldurur: komut sonunda çökme biter.
    expect(s.combatants.C!.moral).toBe(s.combatants.C!.moralMax);
    expect(moraleAfterEvents(r.state, s, []).some((e) => e.type === 'effect_ended' && e.targetId === 'C' && e.effectId === 'moral:cokmus')).toBe(true);
    s = applyEvents(s, [hit('D', 999)]);
    for (const id of members(r.state, pool.id)) expect(s.combatants[id]!.life, id).toBe('dead');
    expect(s.combatants.F!.life).not.toBe('dead');
    expect(JSON.stringify(replay([{ type: 'battle_started', state: r.state } as BattleEvent, { type: 'effect_added', targetId: 'C', effect: COLLAPSE }, hit('C', 999), hit('D', 999)])))
      .toBe(JSON.stringify(s));
  });
});

describe('K59 G2.2: Karadul Örümcek Biçimi × aura', () => {
  const sheet: CharacterSheet = { ...blankCharacter('kd').sheet, name: 'Lilith', raceId: 'human', classId: 'druid', subclassId: KARADUL_ID, gender: 'kadin', level: 6,
    baseScores: { str: 8, dex: 14, con: 8, int: 10, wis: 15, cha: 16 }, armorName: 'Leather Armor', weapons: [{ name: 'Quarterstaff' }] } as CharacterSheet;
  function arena() {
    const parts = [combatantFromSheet(sheet, { id: 'A', ownerId: 'p1' }), mk('C', { ownerId: 'p1', hp: 20, maxHp: 20 }), mk('B', { side: 'enemies', hp: 60, maxHp: 60 })];
    const s0 = startBattle('kd', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' }, houseRules: { karadulCemberi: true } }).state;
    let s: BattleState = { ...s0, status: 'active', order: ['A', 'C', 'B'], turnIndex: 0, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
    for (const [id, p] of Object.entries({ A: o(3, 3), C: o(4, 3), B: o(10, 3) })) s = patch(s, id, { pos: p });
    return s;
  }
  const aura = (amount: number): AuraSpec => ({ id: 'test-can', name: 'Test Aurası', radius: 2, filter: 'allies', trigger: 'turnStart', effect: { kind: 'tempHp', amount } });
  const save: AuraSpec = { id: 'test-save', name: 'Kalkan Aurası', radius: 2, filter: 'allies', trigger: 'passive', effect: { kind: 'saveBonus', amount: 3 } };
  const withAura = (s: BattleState, a: AuraSpec) => applyEvents(s, [{ type: 'effect_added', targetId: 'C', effect: { id: `aura-${a.id}`, name: a.name, sourceId: 'C', aura: a } as ActiveEffect }]);
  const spider = (s: BattleState) => {
    const x = execute(s, { type: 'use_feature', actorId: 'A', feature: SPIDER_KEY }, P1, high);
    if (!x.ok) throw new Error(x.error);
    return x.state;
  };
  it('biçim canından düşük aura canı yazılmaz; yüksek olanı biçim canının yerine geçer ve biçim sürer', () => {
    const s = spider(arena());
    const form = s.combatants.A!.tempHp ?? 0;
    expect(form).toBeGreaterThan(0);
    expect(auraTriggerEvents(withAura(s, aura(form - 5)), 'A', 'turnStart', mid).some((e) => e.type === 'temp_hp')).toBe(false);
    const hiS = withAura(s, aura(form + 10));
    const evs = auraTriggerEvents(hiS, 'A', 'turnStart', mid);
    const after = applyEvents(hiS, evs);
    expect(after.combatants.A!.tempHp).toBe(form + 10);
    expect(after.combatants.A!.shape?.spider).toBe(true);
  });
  it('biçim bırakılınca bütün geçici can gider (aura canı dahil: tek geçici can havuzu)', () => {
    let s = spider(arena());
    const form = s.combatants.A!.tempHp ?? 0;
    s = withAura(s, aura(form + 10));
    s = applyEvents(s, auraTriggerEvents(s, 'A', 'turnStart', mid));
    s = patch(s, 'A', { economy: arena().combatants.A!.economy });
    const x = execute(s, { type: 'use_feature', actorId: 'A', feature: SPIDER_KEY }, P1, high);
    expect(x.ok).toBe(true);
    if (x.ok) { expect(x.state.combatants.A!.shape).toBeUndefined(); expect(x.state.combatants.A!.tempHp ?? 0).toBe(0); }
  });
  it('pasif kurtulma aurası biçimde de geçer (takaslı değiştiricinin üstüne)', () => {
    const s = withAura(spider(arena()), save);
    expect(passiveAuraOf(s, s.combatants.A!).saveBonus).toBe(3);
  });
});

describe('K59 G2.3: ışınlanma × geçici engel × yüzey', () => {
  function field(): BattleState {
    const parts = [mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, spellSaveDc: 15 }), mk('B', { side: 'enemies', hp: 40, maxHp: 40 })];
    const s0 = startBattle('f', 'd-z-zemin', parts, () => 0.5, { map: { id: 'kale' } }).state;
    let s: BattleState = { ...s0, status: 'active', order: ['A', 'B'], turnIndex: 0, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)), objects: [], zones: [] } };
    s = patch(s, 'A', { pos: o(2, 3) });
    s = patch(s, 'B', { pos: o(12, 3) });
    // Görüşü ve hareketi kesen Çizili Duvar sütunu (5. sütun) ve ardında alev yüzeyi.
    s = applyEvents(s, barrierEvents(s, s.combatants.A as Combatant, 'cizili-duvar', [o(5, 1), o(5, 2), o(5, 3), o(5, 4), o(5, 5)]));
    const placed = execute(s, { type: 'place_surface', kind: 'fire', hexes: [o(6, 3)] } as Command, GM, high);
    if (!placed.ok) throw new Error(placed.error);
    return placed.state;
  }
  it('engel altıgenine ışınlanılamaz', () => {
    const s = field();
    const r = teleport(s, s.combatants.A as Combatant, o(5, 3), { rangeFt: 30, sight: false }, 'Misty Step', high);
    expect('problem' in r).toBe(true);
  });
  it('görüş isteyen ışınlanma görüşü kesen engelin arkasına gidemez', () => {
    const s = field();
    const r = teleport(s, s.combatants.A as Combatant, o(6, 3), { rangeFt: 30, sight: true }, 'Misty Step', high);
    expect('problem' in r).toBe(true);
  });
  it('görüş istemeyen ışınlanma engelin ardındaki alev yüzeyine iner: fırsat saldırısı yok, yüzey girişi işler; replay aynı', () => {
    const s = field();
    const r = teleport(s, s.combatants.A as Combatant, o(6, 3), { rangeFt: 30, sight: false }, 'Misty Step', high);
    if ('problem' in r) throw new Error(r.problem);
    expect(r.events[0]?.type).toBe('teleported');
    expect(r.events.some((e) => e.type === 'attack_resolved')).toBe(false);
    expect(r.events.length).toBeGreaterThan(1);
    const after = applyEvents(s, r.events);
    expect(after.combatants.A!.pos).toEqual(o(6, 3));
    expect(after.combatants.A!.hp).toBeLessThan(40);
    expect(JSON.stringify(replay([{ type: 'battle_started', state: s } as BattleEvent, ...r.events]))).toBe(JSON.stringify(after));
  });
});

describe('K59 G2.4: hizalanma × Moral vicdanı × Motivasyon günlüğü', () => {
  const day = '2026-11-06';
  it('ardışık çatışan olaylar: olay başına en çok −2, günde en çok −3, taban 1; günlük farkları toplamı = değişim', () => {
    let a = newAlignment({ duzen: 40, iyilik: 0 }, 'orta');
    a = { ...a, duzen: 40, baslangic: { duzen: 40, iyilik: 0 }, kova: { duzen: 'pos', iyilik: 'neu' } };
    let moral = 6;
    const start = moral;
    for (let i = 0; i < 4; i++) {
      const res = applyAlignAct(a, { kind: 'serbest', eksen: 'duzen', miktar: -6, gerekce: 'kaos' }, 'gm', `t${i}`, { moral, max: 6, day });
      expect(res.delta).toBeGreaterThanOrEqual(-2);
      a = res.alignment; moral = res.moral;
      expect(moral).toBeGreaterThanOrEqual(1);
    }
    expect(start - moral).toBe(3);
    const logged = a.gunluk.reduce((s, e) => s + (e.moral?.delta ?? 0), 0);
    expect(logged).toBe(moral - start);
    // Geri alma: hizalanma geri alınır, Moral'e dokunmaz (günlük kaydı kalır).
    const last = a.gunluk[a.gunluk.length - 1]!;
    const undone = toggleUndo(a, last.id);
    expect(undone.gunluk.find((e) => e.id === last.id)?.moral).toEqual(last.moral);
  });
  it('düşük Moral (≤ 1/3): savrulma ×1.5 olay puanına (günlükte çarpan) ve yeni gün sınırı sıfırlanır', () => {
    let a = newAlignment({ duzen: 40, iyilik: 0 }, 'orta');
    a = { ...a, duzen: 40, baslangic: { duzen: 40, iyilik: 0 }, kova: { duzen: 'pos', iyilik: 'neu' } };
    const res = applyAlignAct(a, { kind: 'serbest', eksen: 'duzen', miktar: -4, gerekce: 'kaos' }, 'gm', 't', { moral: 2, max: 6, day });
    const e = res.alignment.gunluk[res.alignment.gunluk.length - 1]!;
    expect(e.carpan).toBe(1.5);
    expect(e.duzen).toBe(-6);
    const next = applyAlignAct(res.alignment, { kind: 'serbest', eksen: 'duzen', miktar: -6, gerekce: 'kaos' }, 'gm', 't2', { moral: 6, max: 6, day: '2026-11-07' });
    expect(next.alignment.vicdan?.gun).toBe('2026-11-07');
    expect(next.delta).toBeLessThan(0);
  });
});

describe('K59 G2.5: arazi etkisi × yüzey zinciri', () => {
  function field(): BattleState {
    const parts = [mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, spellNames: ['Fireball'], spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0], spellSaveDc: 15, level: 5 }),
      mk('F0', { side: 'enemies', hp: 300, maxHp: 300 })];
    const s0 = startBattle('k59', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
    const tiles = Array.from({ length: 7 }, () => '.'.repeat(4) + 'g'.repeat(11));
    let s: BattleState = { ...s0, status: 'active', order: ['A', 'F0'], turnIndex: 0, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles, objects: [], zones: [] } };
    s = patch(s, 'A', { pos: o(1, 3) });
    s = patch(s, 'F0', { pos: o(8, 3) });
    // Yağ: patlama alanının hemen dışında (arazi alevinin yayıldığı halkada).
    const placed = execute(s, { type: 'place_surface', kind: 'oil', hexes: [o(13, 3), o(13, 2)] } as Command, GM, high);
    if (!placed.ok) throw new Error(placed.error);
    return placed.state;
  }
  it('Fireball: arazi alevi ve yağ tepkimesi aynı komutta; satırlar tekil; zincir sınırı; replay aynı', () => {
    const s = field();
    const x = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: o(8, 3) } as Command, P1, seededRng(3));
    if (!x.ok) throw new Error(x.error);
    const rows = x.events.filter((e): e is Extract<BattleEvent, { type: 'surface_reacted' }> => e.type === 'surface_reacted');
    expect(rows.some((e) => e.reaction === 'terrain')).toBe(true);
    // Aynı ikili aynı komutta bir kez (zincir tekrar etmez).
    const keys = rows.map((e) => `${e.reaction}|${e.row ?? ''}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(rows.length).toBeLessThanOrEqual(6);
    expect(x.state.map?.zones?.some((z) => z.surface === 'fire')).toBe(true);
    expect(JSON.stringify(replay([{ type: 'battle_started', state: s } as BattleEvent, ...x.events]))).toBe(JSON.stringify(x.state));
  });
});
