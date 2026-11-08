/**
 * Kuyruk Y1 (kural sürümü 55, büyü verisinde `y1` bloğu): K70 artıkları ve yapay zekâ kuyruğu. Her madde sürüm 55'te
 * yeni, sürüm 54'te eski davranışla sabitlenir; replay `run` içinde denetlenir.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { execute } from './index';
import { GM, mk, sword } from './fixtures';
import { chooseCommand } from './ai';
import { caster, field, run } from './k19spells.test';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const ALL = [4, 3, 3, 3, 3, 3, 2, 2, 1];
const cast = (actorId: string, spellName: string, extra: Record<string, unknown> = {}) => ({ type: 'cast_spell', actorId, spellName, ...extra }) as Command;
const wiz = (names: string[], p: Partial<Combatant> = {}) => caster({ spellNames: names, spellSlots: ALL, concentration: null, ...p });
const sp = (n: string) => spells.find((s) => s.name === n) as NonNullable<(typeof spells)[number]>;

describe('Y1 G1.1: Dispel Magic Wall of Force\'u kaldırmaz (SRD: "can\'t be dispelled by Dispel Magic")', () => {
  const PATH = [{ col: 5, row: 1 }, { col: 5, row: 2 }, { col: 5, row: 3 }, { col: 5, row: 4 }, { col: 5, row: 5 }];
  const P = { A: { col: 2, row: 3 }, D: { col: 9, row: 3 } };
  const setup = (k: number) => {
    const d = mk('D', { side: 'enemies', hp: 200, maxHp: 200, spellNames: ['Dispel Magic'], spellSlots: ALL, spellSaveDc: 18, spellAttack: 10, spellMod: 5, casterTag: 'wizard' });
    const r = run(field([wiz(['Wall of Force']), d], P, k), cast('A', 'Wall of Force', { targetHex: PATH[0], targetHexes: PATH }));
    return { ...r.state, turnIndex: 1 } as BattleState;
  };
  it('veri: Wall of Force ve Forcecage `y1.dispelImmune`', () => {
    expect(sp('Wall of Force').mechanics.y1?.dispelImmune).toBe(true);
    expect(sp('Forcecage').mechanics.y1?.dispelImmune).toBe(true);
  });
  it('sürüm 55: Dispel Magic duvar altıgenine yapılınca duvar kalır (slot harcanır, "kaldırılacak büyü alanı yok")', () => {
    const r = run(setup(55), cast('D', 'Dispel Magic', { targetHex: PATH[2] }));
    expect(r.state.map?.zones?.some((z) => z.spellId === 'wall-of-force')).toBe(true);
    expect(r.state.combatants.A?.concentration?.spell).toBe('Wall of Force');
    expect(r.events).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'spell_cast', note: 'kaldırılacak büyü alanı yok' })]));
  });
  it('sürüm 54 sabit: Dispel Magic duvarı kaldırır (eski davranış)', () => {
    const r = run(setup(54), cast('D', 'Dispel Magic', { targetHex: PATH[2] }));
    expect(r.state.map?.zones?.some((z) => z.spellId === 'wall-of-force')).toBe(false);
  });
});

describe('Y1 G1.2: Disintegrate Resilient Sphere küresini içindekine zarar vermeden yok eder', () => {
  const P = { A: { col: 2, row: 3 }, F0: { col: 6, row: 3 }, D: { col: 9, row: 3 } };
  const setup = (k: number) => {
    const d = mk('D', { side: 'enemies', hp: 200, maxHp: 200, spellNames: ['Disintegrate'], spellSlots: ALL, spellSaveDc: 18, spellAttack: 10, spellMod: 5, casterTag: 'sorcerer' });
    // A, düşman F0'ı (gönülsüz, düşük DEX) küreye alır; sonra sıra düşman büyücü D'de: kendi dostunu kurtarmak için küreyi kırar.
    const f0 = mk('F0', { side: 'enemies', hp: 60, maxHp: 60, saves: { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 } });
    const r = run(field([wiz(['Resilient Sphere']), f0, d], P, k), cast('A', 'Resilient Sphere', { targetId: 'F0' }));
    expect(r.state.combatants.F0?.effects?.some((e) => e.sealed)).toBe(true);
    return { ...r.state, turnIndex: 2 } as BattleState;
  };
  it('veri: Disintegrate `y1.destroysSphere`', () => { expect(sp('Disintegrate').mechanics.y1?.destroysSphere).toBe(true); });
  it('sürüm 55: küre biter, hedef hasar almaz, kürenin sahibinin konsantrasyonu düşer; replay aynı', () => {
    const s = setup(55);
    const r = run(s, cast('D', 'Disintegrate', { targetId: 'F0' }));
    expect(r.state.combatants.F0?.effects?.some((e) => e.sealed)).toBe(false);
    expect(r.state.combatants.F0?.hp).toBe(60);
    expect(r.events.some((e) => e.type === 'save_resolved')).toBe(false);
    expect(r.state.combatants.A?.concentration ?? null).toBeNull();
    expect(r.events).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'effect_ended', reason: 'destroyed' })]));
  });
  it('sürüm 54 sabit: Disintegrate hedefe save ile vurur (küre hasara bağışık), küre kalır', () => {
    const r = run(setup(54), cast('D', 'Disintegrate', { targetId: 'F0' }));
    expect(r.events.some((e) => e.type === 'save_resolved')).toBe(true);
    expect(r.state.combatants.F0?.effects?.some((e) => e.sealed)).toBe(true);
  });
  it('kürede olmayan hedefe Disintegrate sürüm 55\'te de normal (save + hasar)', () => {
    const s0 = field([wiz([]), mk('F0', { side: 'party', ownerId: 'p1', hp: 200, maxHp: 200 }), mk('D', { side: 'enemies', hp: 200, maxHp: 200, spellNames: ['Disintegrate'], spellSlots: ALL, spellSaveDc: 18, spellAttack: 10, spellMod: 5, casterTag: 'sorcerer' })], P, 55);
    const r = run({ ...s0, turnIndex: 2 }, cast('D', 'Disintegrate', { targetId: 'F0' }));
    expect(r.events.some((e) => e.type === 'save_resolved')).toBe(true);
  });
});

describe('Y1 G2a: yolu kesen düşman duvarı (panel saldırısı, Wall of Force\'a Disintegrate)', () => {
  const COL6 = Array.from({ length: 7 }, (_, r) => ({ col: 6, row: r }));
  const enemyWiz = (names: string[]) => mk('F', { side: 'enemies', hp: 80, maxHp: 80, spellNames: names, spellSlots: ALL, spellSaveDc: 15, spellAttack: 7, spellMod: 4, casterTag: 'wizard' });
  /** Düşman büyücü F (10,3) 6. sütunu duvarla keser; sonra sıra A'da. */
  const walled = (k: number, wall: string, a: Combatant, aPos = { col: 5, row: 3 }, path = COL6) => {
    const s0 = field([a, enemyWiz([wall])], { A: aPos, F: { col: 10, row: 3 } }, k);
    const r = run({ ...s0, turnIndex: 1 }, cast('F', wall, { targetHex: path[0], targetHexes: path }));
    return { ...r.state, turnIndex: 0, combatants: { ...r.state.combatants, F: { ...(r.state.combatants.F as Combatant), concentration: r.state.combatants.F?.concentration ?? null } } } as BattleState;
  };
  const fighter = () => mk('A', { ownerId: 'p1', hp: 60, maxHp: 60, weaponOptions: [sword] });
  it('sürüm 55: Wall of Ice tam keserse bitişik panele silahla saldırır', () => {
    const s = walled(55, 'Wall of Ice', fighter());
    const cmd = chooseCommand(s);
    expect(cmd).toMatchObject({ type: 'attack_object', actorId: 'A' });
    expect((cmd as { objectId: string }).objectId).toMatch(/^wall:/);
  });
  it('olumsuz: duvarda boşluk varken (yol kısa) panele saldırmaz', () => {
    const s = walled(55, 'Wall of Ice', fighter(), { col: 5, row: 3 }, COL6.slice(0, 4));
    expect(chooseCommand(s).type).not.toBe('attack_object');
  });
  it('sürüm 54 sabit: panele saldırmaz', () => {
    const s = walled(54, 'Wall of Ice', fighter());
    expect(chooseCommand(s).type).not.toBe('attack_object');
  });
  it('sürüm 55: Wall of Force tam keserse Disintegrate ile duvarı kaldırır; Disintegrate yoksa ve silah duvara işlemezse yapmaz', () => {
    const sorc = wiz(['Disintegrate'], { hp: 60, maxHp: 60, weaponOptions: [] });
    const s = walled(55, 'Wall of Force', sorc, { col: 2, row: 3 });
    const cmd = chooseCommand(s);
    expect(cmd).toMatchObject({ type: 'cast_spell', spellName: 'Disintegrate' });
    expect((cmd as { targetId?: string }).targetId).toBeUndefined();
    expect(chooseCommand(walled(54, 'Wall of Force', sorc, { col: 2, row: 3 }))).not.toMatchObject({ type: 'cast_spell', spellName: 'Disintegrate' });
  });
});
