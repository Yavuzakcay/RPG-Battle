/**
 * Alan şekilleri ve alanla uygulanan save'ler (Görev R4; SRD 5.2.1 "Area of Effect"): canavar nefesi (koni, geniş
 * çizgi), yayılım ("each enemy"), noktada küre (menzil), dost ateşi, hasarın bir kez atılması, hedef başına save ve elle
 * zar, yapay zekânın yön seçimi, Dragonborn Breath Weapon (kaynak, ekonomi, uzun dinlenme), Cone of Cold, replay.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster, combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { chooseCommand } from './ai';
import { GM, P1, dice, mk, scripted } from './fixtures';
import { getMonster } from '../data';
import { monsterAttackArea } from '../rules/areaParse';
import { askFor, newBook, runWithDice } from '../rules/manualDice';
import { longRestStatus, fullStatus } from '../rules/characterRest';
import { describeEvent } from '../ui/log';
import type { Offset } from '../rules/hex';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const saves = (events: BattleEvent[]) => events.filter((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved');

/** Savaşçılar verilen altıgenlerde, düz harita, sıra ilk savaşçıda. */
function arena(parts: Combatant[], pos: Record<string, Offset>): { state: BattleState; events: BattleEvent[] } {
  const started = startBattle('a', 'd-z-zemin', parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map: { id: 'col' } });
  const combatants = { ...started.state.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const state: BattleState = { ...started.state, status: 'active', turnIndex: 0, combatants, map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles: flat } };
  return { state, events: [{ type: 'battle_started', state }] };
}
const monster = (id: string, as: string) => ({ ...combatantFromMonster(getMonster(id), { id: as }), initiativeBonus: 30 });
const pc = (id: string, p: Partial<Combatant> = {}) => mk(id, { ownerId: 'p1', hp: 200, maxHp: 200, ...p });
const breathIndex = (c: Combatant) => c.attacks.findIndex((a) => !!a.area);

describe('alan ayrıştırma (SRD stat block metni)', () => {
  it('koni, geniş çizgi, yayılım (each enemy), noktada küre ve silindir', () => {
    expect(monsterAttackArea('Dexterity Saving Throw: DC 17, each creature in a 30-foot Cone. Failure: 56 (16d6) Fire damage.'))
      .toEqual({ shape: 'cone', sizeFt: 30, origin: 'self', targets: 'all' });
    expect(monsterAttackArea('Dexterity Saving Throw: DC 22, each creature in a 90-foot-long, 10-footwide Line. Failure: 67 (15d8) Acid damage.'))
      .toEqual({ shape: 'line', sizeFt: 90, widthFt: 10, origin: 'self', targets: 'all' });
    expect(monsterAttackArea('Wisdom Saving Throw: DC 18, each enemy in a 30-foot Emanation originating from the rakshasa.'))
      .toEqual({ shape: 'emanation', sizeFt: 30, origin: 'self', targets: 'enemies' });
    expect(monsterAttackArea('Dexterity Saving Throw: DC 10, each creature in a 10-foot-radius Sphere centered on a point within 30 feet.'))
      .toEqual({ shape: 'sphere', sizeFt: 10, origin: 'point', rangeFt: 30, targets: 'all' });
    expect(monsterAttackArea('Dexterity Saving Throw: DC 18, each creature in a 10-foot-radius, 40-foot-high Cylinder originating from a point the giant can see within 500 feet.'))
      .toEqual({ shape: 'sphere', sizeFt: 10, origin: 'point', rangeFt: 500, targets: 'all' });
    expect(monsterAttackArea('Wisdom Saving Throw: DC 11, one creature the mummy can see within 60 feet.')).toBeUndefined();
    expect(monsterAttackArea('Melee Attack Roll: +5, reach 5 ft.')).toBeUndefined();
  });
  it('canavar savaşçısında alan saldırıda (Young Red Dragon verisi elle: 30 ft koni)', () => {
    const d = monster('young-red-dragon', 'D');
    expect(d.attacks[breathIndex(d)]).toMatchObject({ name: 'Fire Breath', area: { shape: 'cone', sizeFt: 30 }, recharge: 5 });
  });
});

describe('canavar nefesi: koni', () => {
  // Ejderha (2,3) doğuya üfler; A (4,3) ve B (6,3) konide, C (2,0) dışarıda; W (ejderhanın kurdu) (3,3) konide.
  const setup = () => arena([monster('young-red-dragon', 'D'), pc('A'), pc('B'), pc('C'), { ...mk('W', { side: 'enemies', hp: 50, maxHp: 50 }) }],
    { D: o(2, 3), A: o(4, 3), B: o(6, 3), C: o(2, 0), W: o(3, 3) });
  it('hasar bir kez atılır, her hedef ayrı save; başarıda yarım; dost ateşi (each creature); recharge harcanır; günlük', () => {
    const { state } = setup();
    const d = state.combatants.D as Combatant;
    // 16d6 hepsi 3 = 48; A save 1 (başarısız), B 19 (başarılı), W 1 (başarısız).
    const r = ok(execute(state, { type: 'monster_attack', actorId: 'D', targetId: '', attackIndex: breathIndex(d), targetHex: o(8, 3) }, GM,
      scripted(...dice(6, ...Array<number>(16).fill(3)), [20, 1], [20, 1], [20, 19], [20, 19], [20, 1], [20, 1])));
    const area = r.events.find((e) => e.type === 'area_used');
    expect(area).toMatchObject({ actorId: 'D', label: 'Fire Breath', shape: 'cone', sizeFt: 30 });
    const s = saves(r.events);
    expect(s.map((e) => e.targetId).sort()).toEqual(['A', 'B', 'W']);
    for (const e of s) expect(e.rawDamage).toBe(48);
    const by = (id: string) => s.find((e) => e.targetId === id);
    expect(by('A')).toMatchObject({ success: false, appliedDamage: 48 });
    expect(by('B')).toMatchObject({ success: true, appliedDamage: 24 });
    expect(by('W')).toMatchObject({ success: false, appliedDamage: 48 });
    expect(r.events.some((e) => e.type === 'recharge_used')).toBe(true);
    expect(r.state.combatants.C?.hp).toBe(200);
    expect(describeEvent(area as BattleEvent, r.state)).toContain('30 ft koni');
  });
  it('yön için kendi altıgeni seçilemez; çıkış altıgeni alana girmez; recharge bekleyen nefes reddedilir', () => {
    const { state } = setup();
    const d = state.combatants.D as Combatant;
    expect(execute(state, { type: 'monster_attack', actorId: 'D', targetId: '', attackIndex: breathIndex(d), targetHex: o(2, 3) }, GM, scripted()).ok).toBe(false);
    const used = { ...state, combatants: { ...state.combatants, D: { ...d, rechargeUsed: [breathIndex(d)] } } };
    expect(execute(used, { type: 'monster_attack', actorId: 'D', targetId: '', attackIndex: breathIndex(d), targetHex: o(8, 3) }, GM, scripted()).ok).toBe(false);
  });
  it('yapay zekâ: dost vurmayan ve en çok düşmanı kapsayan yönü seçer', () => {
    const { state } = setup();
    const cmd = chooseCommand(state);
    expect(cmd).toMatchObject({ type: 'monster_attack', actorId: 'D', attackIndex: 1 });
    const r = ok(execute(state, cmd, GM, scripted()));
    const hit = saves(r.events).map((e) => e.targetId);
    expect(hit).not.toContain('W');
    expect(hit.length).toBeGreaterThanOrEqual(1);
    // Kurt bütün yönleri kapatıyorsa (her düşman kurdun arkasında değil) yine dostu vurmayan yön seçilir.
    for (const id of hit) expect(['A', 'B', 'C']).toContain(id);
  });
  it('elle zar: hasar zarları, sonra her hedefin save zarı ayrı istenir; replay aynı', () => {
    const { state, events } = setup();
    const d = state.combatants.D as Combatant;
    const cmd: Command = { type: 'monster_attack', actorId: 'D', targetId: '', attackIndex: breathIndex(d), targetHex: o(8, 3) };
    const ask = { ask: askFor('everyone', () => true), auto: scripted() };
    const first = runWithDice((rng) => execute(state, cmd, GM, rng), newBook(), ask);
    expect(first.ok ? null : first.need).toMatchObject({ sides: 6, count: 16, kind: 'damage', by: 'D' });
    const book = { entries: [{ group: { sides: 6, count: 16, values: Array<number>(16).fill(2) } }] };
    const second = runWithDice((rng) => execute(state, cmd, GM, rng), book, ask);
    const firstSaver = second.ok ? null : second.need.by;
    expect(['A', 'B', 'W']).toContain(firstSaver);
    const r = ok(execute(state, cmd, GM, scripted()));
    expect(replay([...events, ...r.events])).toEqual(r.state);
  });
});

describe('çizgi, yayılım ve noktada küre', () => {
  it('10 ft genişlikli çizgi (Ancient Blue): iki şerit; yan yana iki hedef de alanda', () => {
    const base = arena([monster('ancient-blue-dragon', 'D'), pc('A'), pc('B')], { D: o(1, 3), A: o(6, 3), B: o(0, 0) }).state;
    const d = base.combatants.D as Combatant;
    expect(d.attacks[breathIndex(d)]?.area).toMatchObject({ shape: 'line', widthFt: 10 });
    const cmd: Command = { type: 'monster_attack', actorId: 'D', targetId: '', attackIndex: breathIndex(d), targetHex: o(14, 3) };
    const dry = ok(execute(base, cmd, GM, scripted())).events.find((e) => e.type === 'area_used');
    const hexes = dry?.type === 'area_used' ? dry.hexes : [];
    expect(hexes.length).toBeGreaterThanOrEqual(24); // 13 altıgenlik ana şerit + yan şerit
    const side = [o(6, 2), o(6, 4)].find((h) => hexes.some((x) => x.col === h.col && x.row === h.row));
    expect(side).toBeDefined();
    const { state } = arena([monster('ancient-blue-dragon', 'D'), pc('A'), pc('B')], { D: o(1, 3), A: o(6, 3), B: side as Offset });
    expect(saves(ok(execute(state, cmd, GM, scripted())).events).map((e) => e.targetId).sort()).toEqual(['A', 'B']);
  });
  it('yayılım "each enemy" (Rakshasa Baleful Command): dost etkilenmez', () => {
    const rak = monster('rakshasa', 'R');
    const i = rak.attacks.findIndex((a) => a.name === 'Baleful Command');
    const { state } = arena([rak, pc('A'), mk('W', { side: 'enemies', hp: 30, maxHp: 30 })], { R: o(5, 3), A: o(6, 3), W: o(4, 3) });
    const r = ok(execute(state, { type: 'monster_attack', actorId: 'R', targetId: '', attackIndex: i }, GM, scripted()));
    expect(saves(r.events).map((e) => e.targetId)).toEqual(['A']);
  });
  it('noktada küre (Gibbering Mouther, 30 ft içinde): nokta menzil dışındaysa reddedilir', () => {
    const gm = monster('gibbering-mouther', 'G');
    const i = gm.attacks.findIndex((a) => !!a.area);
    const { state } = arena([gm, pc('A'), pc('B')], { G: o(1, 3), A: o(5, 3), B: o(5, 4) });
    const r = ok(execute(state, { type: 'monster_attack', actorId: 'G', targetId: '', attackIndex: i, targetHex: o(5, 3) }, GM, scripted()));
    expect(saves(r.events).map((e) => e.targetId).sort()).toEqual(['A', 'B']);
    expect(execute(state, { type: 'monster_attack', actorId: 'G', targetId: '', attackIndex: i, targetHex: o(9, 3) }, GM, scripted()).ok).toBe(false);
  });
});

describe('Dragonborn Breath Weapon', () => {
  const sheet = (level: number): CharacterSheet => ({
    name: 'Rhog', raceId: 'dragonborn', lineageId: 'red', classId: 'fighter', level, armorName: 'Chain Mail', shield: false, itemNames: [], spellNames: [],
    baseScores: { str: 15, dex: 12, con: 14, int: 8, wis: 10, cha: 10 }, weapons: [{ name: 'Longsword' }],
  } as CharacterSheet);
  const rhog = (level = 5) => ({ ...combatantFromSheet(sheet(level), { id: 'A', ownerId: 'p1' }), initiativeBonus: 30 });
  it('veriden: miras türü (Red → fire), DC 8 + CON + yetkinlik, seviye zarı, kullanım yetkinlik kadar (uzun dinlenmede dolar)', () => {
    const a = rhog(5);
    expect(a.breath).toMatchObject({ srd: 'species:dragonborn/breath-weapon', damageType: 'fire', dice: '2d10', dc: 8 + 2 + 3 });
    expect(a.resources.breathWeapon).toBe(3);
    expect(rhog(1).breath?.dice).toBe('1d10');
    expect(fullStatus(sheet(5)).resources.breathWeapon).toBe(3);
    expect(longRestStatus(sheet(5), { ...fullStatus(sheet(5)), resources: { ...fullStatus(sheet(5)).resources, breathWeapon: 0 } }).resources.breathWeapon).toBe(3);
  });
  it('koni ya da çizgi; Attack eyleminin bir saldırısı yerine; kullanım azalır, bitince reddedilir', () => {
    const { state } = arena([rhog(5), mk('B', { side: 'enemies', hp: 60, maxHp: 60 }), mk('E', { side: 'enemies', hp: 60, maxHp: 60 })],
      { A: o(3, 3), B: o(5, 3), E: o(6, 3) });
    const cone = ok(execute(state, { type: 'breath_weapon', actorId: 'A', shape: 'cone', targetHex: o(6, 3) }, P1, scripted()));
    expect(saves(cone.events).map((e) => e.targetId).sort()).toEqual(['B', 'E']);
    expect(cone.events.find((e) => e.type === 'feature_used')).toMatchObject({ feature: 'breathWeapon', remaining: 2 });
    // Fighter 5: iki saldırı; nefes birinin yerine, biri kalır.
    expect(cone.state.combatants.A?.economy.attacksLeft).toBe(1);
    const line = ok(execute(state, { type: 'breath_weapon', actorId: 'A', shape: 'line', targetHex: o(9, 3) }, P1, scripted()));
    expect(line.events.find((e) => e.type === 'area_used')).toMatchObject({ shape: 'line', sizeFt: 30 });
    const empty = { ...state, combatants: { ...state.combatants, A: { ...(state.combatants.A as Combatant), resources: { ...(state.combatants.A as Combatant).resources, breathWeapon: 0 } } } };
    expect(execute(empty, { type: 'breath_weapon', actorId: 'A', shape: 'cone', targetHex: o(6, 3) }, P1, scripted()).ok).toBe(false);
  });
  it('yapay zekâ: iki düşmanı kapsayan, dostu vurmayan nefes', () => {
    const { state } = arena([rhog(5), mk('B', { side: 'enemies', hp: 60, maxHp: 60 }), mk('E', { side: 'enemies', hp: 60, maxHp: 60 }), pc('C')],
      { A: o(3, 3), B: o(5, 3), E: o(5, 4), C: o(2, 3) });
    const cmd = chooseCommand(state);
    expect(cmd.type).toBe('breath_weapon');
    const r = ok(execute(state, cmd, P1, scripted()));
    expect(saves(r.events).map((e) => e.targetId).sort()).toEqual(['B', 'E']);
  });
});

describe('Cone of Cold ve Burning Hands (alan büyüleri aynı geometri)', () => {
  it('Cone of Cold: 60 ft koni, CON save, 8d8 cold; koninin içindekiler', () => {
    const w = mk('A', { ownerId: 'p1', spellNames: ['Cone of Cold', 'Burning Hands'], spellSaveDc: 15, spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0], initiativeBonus: 30 });
    const { state } = arena([w, mk('B', { side: 'enemies', hp: 80, maxHp: 80 }), mk('E', { side: 'enemies', hp: 80, maxHp: 80 })], { A: o(1, 3), B: o(6, 3), E: o(12, 3) });
    const r = ok(execute(state, { type: 'cast_spell', actorId: 'A', spellName: 'Cone of Cold', targetHex: o(14, 3) }, P1, scripted()));
    expect(saves(r.events).map((e) => [e.targetId, e.ability, e.damageType])).toEqual([['B', 'con', 'cold'], ['E', 'con', 'cold']]);
    expect(saves(r.events)[0]?.damageRolls.length).toBe(8);
    const bh = ok(execute(state, { type: 'cast_spell', actorId: 'A', spellName: 'Burning Hands', targetHex: o(4, 3) }, P1, scripted()));
    expect(saves(bh.events)).toEqual([]); // B 25 ft uzakta: 15 ft koninin dışında
  });
});
