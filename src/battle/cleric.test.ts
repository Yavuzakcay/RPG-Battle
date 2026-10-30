/**
 * Görev CLERIC: Divine Order, Channel Divinity (Divine Spark, Turn Undead), Sear Undead, Blessed Strikes, Life Domain
 * (Disciple of Life, Preserve Life, Blessed Healer, Supreme Healing). Veriden; her biri için birim test.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { P1, mk, scripted } from './fixtures';
import { blankCharacter, spellLimits, suggestedScores } from '../rules/builder';
import { armorProficient, type CharacterSheet } from '../rules/stats';
import { weaponProficient } from '../rules/mastery';
import { weapons } from '../data';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const mid: Rng = () => 0.5;
const high: Rng = () => 0.99;
const sheet = (level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('c').sheet, name: 'Rahip', classId: 'cleric', subclassId: 'life-domain', level, baseScores: suggestedScores('cleric'),
  armorName: 'Chain Shirt', weapons: [{ name: 'Mace' }], spellNames: ['Cure Wounds', 'Healing Word', 'Mass Healing Word', 'Sacred Flame'], ...patch,
});
const cleric = (level: number, patch: Partial<CharacterSheet> = {}) => combatantFromSheet(sheet(level, patch), { id: 'A', ownerId: 'p1' });

function arena(a: Combatant, b: Partial<Combatant> = {}, c: Partial<Combatant> = {}) {
  const parts = [a, mk('B', { side: 'enemies', hp: 60, maxHp: 60, ac: 5, ...b }), mk('C', { ownerId: 'p1', hp: 4, maxHp: 30, ...c })];
  const s = startBattle('cl', 'd-z-zemin', parts, mid, { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), B: o(4, 3), C: o(2, 3) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const state: BattleState = { ...s, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
  return state;
}
const run = (s: BattleState, cmd: Command, rng: Rng = mid) => { const r = execute(s, cmd, P1, rng); if (!r.ok) throw new Error(r.error); return r; };
const err = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, mid); return r.ok ? '' : r.error; };
const replays = (s0: BattleState, r: { state: BattleState; events: BattleEvent[] }) => expect(replay([{ type: 'battle_started', state: s0 }, ...r.events])).toEqual(r.state);

describe('Divine Order', () => {
  it('Protector (varsayılan): Heavy zırh ve Martial silah eğitimi; Thaumaturge: ek cantrip', () => {
    expect(armorProficient('cleric', 'heavy')).toBe(true);
    expect(armorProficient('cleric', 'heavy', { 'cleric:divine-order': 'thaumaturge' })).toBe(false);
    const longsword = weapons.find((w) => w.name === 'Longsword')!;
    expect(weaponProficient('cleric', longsword)).toBe(true);
    expect(weaponProficient('cleric', longsword, { 'cleric:divine-order': 'thaumaturge' })).toBe(false);
    expect(spellLimits('cleric', 1, { 'cleric:divine-order': 'thaumaturge' }).cantrips).toBe(spellLimits('cleric', 1).cantrips + 1);
    expect(cleric(1, { featureChoices: { 'cleric:divine-order': 'thaumaturge' } }).traits).toContain('thaumaturge');
  });
});

describe('Channel Divinity', () => {
  it('2. seviyede Divine Spark ve Turn Undead; kullanım tablodan (2)', () => {
    const a = cleric(2);
    expect(a.features?.map((f) => f.key)).toEqual(expect.arrayContaining(['cleric:channel-divinity/divine-spark', 'cleric:channel-divinity/turn-undead']));
    expect(a.resources.channelDivinity).toBe(2);
    expect(cleric(1).features?.some((f) => f.key.startsWith('cleric:channel-divinity')) ?? false).toBe(false);
  });
  it('Divine Spark: dosta 1d8 + WIS iyileştirme; düşmana CON save Radiant/Necrotic (başarıda yarı); 7. seviyede 2d8', () => {
    const a = cleric(5);
    const s = arena(a);
    const heal = run(s, { type: 'use_feature', actorId: 'A', feature: 'cleric:channel-divinity/divine-spark', targetId: 'C' });
    expect(heal.events.find((e) => e.type === 'healed')).toMatchObject({ targetId: 'C', amount: 5 + a.modifiers.wis });
    expect(heal.state.combatants.A?.resources.channelDivinity).toBe(1);
    replays(s, heal);
    const hurt = run(s, { type: 'use_feature', actorId: 'A', feature: 'cleric:channel-divinity/divine-spark', targetId: 'B', choice: 'radiant' }, () => 0.01);
    expect(hurt.events.find((e) => e.type === 'save_resolved')).toMatchObject({ targetId: 'B', ability: 'con', success: false, damageType: 'radiant', damageRolls: [1] });
    const seven = run(arena(cleric(7)), { type: 'use_feature', actorId: 'A', feature: 'cleric:channel-divinity/divine-spark', targetId: 'B' }, () => 0.01);
    expect((seven.events.find((e) => e.type === 'save_resolved') as { damageRolls: number[] }).damageRolls).toHaveLength(2);
  });
  it('Turn Undead: yalnızca Undead; başarısızsa Frightened + Incapacitated (hasarla biter); Sear Undead Radiant hasar', () => {
    const s0 = arena(cleric(5), { creatureType: 'undead' });
    expect(err(arena(cleric(5)), { type: 'use_feature', actorId: 'A', feature: 'cleric:channel-divinity/turn-undead' })).toContain('Undead yok');
    const r = run(s0, { type: 'use_feature', actorId: 'A', feature: 'cleric:channel-divinity/turn-undead' }, () => 0.01);
    const save = r.events.find((e) => e.type === 'save_resolved') as { success: boolean; appliedDamage: number };
    expect(save.success).toBe(false);
    expect(save.appliedDamage).toBeGreaterThan(0); // Sear Undead (5. seviye)
    expect(r.state.combatants.B?.conditions).toEqual(expect.arrayContaining(['Frightened', 'Incapacitated']));
    replays(s0, r);
    // 2. seviyede Sear Undead yok.
    const r2 = run(arena(cleric(2), { creatureType: 'undead' }), { type: 'use_feature', actorId: 'A', feature: 'cleric:channel-divinity/turn-undead' }, () => 0.01);
    expect((r2.events.find((e) => e.type === 'save_resolved') as { appliedDamage: number }).appliedDamage).toBe(0);
  });
});

describe('Blessed Strikes', () => {
  it('Divine Strike (varsayılan, 7. seviye): turda bir silah isabetine +1d8; Potent Spellcasting: cantrip hasarına WIS', () => {
    const a = cleric(7);
    expect(a.traits).toContain('divine-strike');
    const s = arena(a);
    const mace = a.weaponOptions.find((w) => !w.spell)!;
    const hit = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: mace }, () => 0.7);
    const ev = hit.events.find((e) => e.type === 'attack_resolved') as { hit: boolean; extra?: Array<{ label: string }> };
    expect(ev.hit).toBe(true);
    expect(ev.extra?.map((x) => x.label)).toContain('Divine Strike');
    const potent = cleric(7, { featureChoices: { 'cleric:blessed-strikes': 'potent-spellcasting' } });
    const flame = run(arena(potent), { type: 'cast_spell', actorId: 'A', spellName: 'Sacred Flame', targetId: 'B' }, () => 0.01);
    const sv = flame.events.find((e) => e.type === 'save_resolved') as { rawDamage: number; damageRolls: number[] };
    expect(sv.rawDamage).toBe(sv.damageRolls.reduce((n, x) => n + x, 0) + potent.modifiers.wis);
  });
});

describe('Life Domain', () => {
  it('Disciple of Life: Cure Wounds (1. slot) +3; Blessed Healer (6): başkasını iyileştirince büyücüye 2 + slot', () => {
    const a = { ...cleric(6), hp: 10 };
    const r = run(arena(a), { type: 'cast_spell', actorId: 'A', spellName: 'Cure Wounds', targetId: 'C', slotLevel: 1 }, scripted([8, 1], [8, 1]));
    const healed = r.events.filter((e) => e.type === 'healed') as Array<{ targetId: string; amount: number }>;
    expect(healed[0]).toMatchObject({ targetId: 'C', amount: 2 + a.modifiers.wis + 3 });
    expect(healed[1]).toMatchObject({ targetId: 'A', amount: 3 });
    // 3. seviyede Blessed Healer yok.
    const r3 = run(arena({ ...cleric(3), hp: 10 }), { type: 'cast_spell', actorId: 'A', spellName: 'Cure Wounds', targetId: 'C', slotLevel: 1 }, scripted([8, 1], [8, 1]));
    expect(r3.events.filter((e) => e.type === 'healed')).toHaveLength(1);
  });
  it('alan büyüleri her zaman hazır (3: Aid, Bless, Cure Wounds, Lesser Restoration; 5: Mass Healing Word, Revivify)', () => {
    expect(cleric(5, { spellNames: [] }).spellNames).toEqual(expect.arrayContaining(['Aid', 'Bless', 'Lesser Restoration', 'Mass Healing Word', 'Revivify']));
    expect(cleric(3, { spellNames: [] }).spellNames).not.toContain('Revivify');
  });
  it('Preserve Life: 5 × seviye HP Bloodied dostlara, en çok yarı HP; Supreme Healing (17) en yüksek zar', () => {
    const s = arena(cleric(3), {}, { hp: 4, maxHp: 30 });
    const r = run(s, { type: 'use_feature', actorId: 'A', feature: 'cleric/life-domain:preserve-life' });
    expect(r.events.find((e) => e.type === 'healed')).toMatchObject({ targetId: 'C', amount: 11, targetHpAfter: 15 });
    replays(s, r);
    expect(err(arena(cleric(3), {}, { hp: 20, maxHp: 30 }), { type: 'use_feature', actorId: 'A', feature: 'cleric/life-domain:preserve-life' })).toContain('Bloodied');
    const a17 = cleric(17);
    const top = run(arena(a17, {}, { hp: 4, maxHp: 80 }), { type: 'cast_spell', actorId: 'A', spellName: 'Cure Wounds', targetId: 'C', slotLevel: 1 }, () => 0.01);
    // 2d8 en yüksek 16 + WIS + Disciple of Life 3.
    expect(top.events.find((e) => e.type === 'healed' && e.targetId === 'C')).toMatchObject({ amount: 16 + a17.modifiers.wis + 3 });
  });
});

describe('yapay zekâ', () => {
  it('Undead yakındaysa Turn Undead; iki Bloodied dost varsa Preserve Life; kendisi çok yaralıysa Sanctuary', async () => {
    const { chooseCommand } = await import('./ai');
    const undead = arena(cleric(5), { creatureType: 'undead', hp: 40 }, { hp: 30 });
    expect(chooseCommand(undead)).toMatchObject({ type: 'use_feature', feature: 'cleric:channel-divinity/turn-undead' });
    const hurt = arena({ ...cleric(5), hp: 10 }, {}, { hp: 4, maxHp: 30 });
    expect(chooseCommand(hurt)).toMatchObject({ type: 'use_feature', feature: 'cleric/life-domain:preserve-life' });
    const low = cleric(5, { spellNames: ['Sanctuary', 'Sacred Flame'] });
    const s = arena({ ...low, hp: 5, resources: { ...low.resources, channelDivinity: 0 } }, {}, { hp: 30, maxHp: 30 });
    expect(chooseCommand(s)).toMatchObject({ type: 'cast_spell', spellName: 'Sanctuary', targetIds: ['A'] });
  });
});
