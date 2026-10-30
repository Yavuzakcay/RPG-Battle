/**
 * Görev WARLOCK: Eldritch Invocations (Agonizing/Repelling Blast, Armor of Shadows, Fiendish Vigor, Pact of the Blade,
 * Thirsting Blade, Eldritch Smite), Pact Magic, Magical Cunning, Fiend (Dark One's Blessing, Dark One's Own Luck,
 * Fiendish Resilience).
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { P1, mk, scripted } from './fixtures';
import { blankCharacter, characterIssues, suggestedScores } from '../rules/builder';
import { deriveStats, type CharacterSheet } from '../rules/stats';
import { fullStatus, magicalCunningStatus, shortRestStatus } from '../rules/characterRest';
import { invocationProblems } from '../rules/invocations';
import { saveDice } from './effectDice';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const INV = ['agonizing-blast:Eldritch Blast', 'repelling-blast:Eldritch Blast', 'armor-of-shadows', 'pact-of-the-blade', 'thirsting-blade'];
const wlSheet = (level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('w').sheet, name: 'Mira', classId: 'warlock', subclassId: 'fiend-patron', level, baseScores: suggestedScores('warlock'),
  armorName: 'Zırhsız', weapons: [{ name: 'Longsword' }], pactWeapon: 'Longsword', spellNames: ['Eldritch Blast', 'Hex'], invocations: INV, ...patch,
});

class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, ctx: CommandContext = P1, rng: Rng = () => 0.5) {
    const r = execute(this.state, cmd, ctx, rng);
    if (!r.ok) throw new Error(r.error);
    this.state = r.state; this.events.push(...r.events);
    return r.events;
  }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
function arena(a: Combatant, foes: Array<[string, Partial<Combatant>, Offset]>) {
  const parts = [a, ...foes.map(([id, p]) => mk(id, { side: 'enemies', hp: 60, maxHp: 60, saves: LOW, ac: 10, ...p }))];
  const s = startBattle('w', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), ...Object.fromEntries(foes.map(([id, , p]) => [id, p])) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return new Run({ ...s, status: 'active', order: Object.keys(pos), turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } });
}
const fromSheet = (s: CharacterSheet) => combatantFromSheet(s, { id: 'A', ownerId: 'p1' });

describe('Eldritch Invocations', () => {
  it('karakterden: Armor of Shadows (zırhsız AC 13 + DEX), Thirsting Blade (2 saldırı), pact silahı CHA, slotsuz büyüler', () => {
    const c = fromSheet(wlSheet(5));
    const d = deriveStats(wlSheet(5));
    expect(c.effects?.some((e) => e.acMin === 13 + d.modifiers.dex)).toBe(true);
    expect(c.attacksPerAction).toBe(2);
    expect(c.atWill).toEqual({ 'Mage Armor': 'self' });
    expect(c.cantripMods?.['Eldritch Blast']).toEqual({ ability: true, pushFt: 10 });
    const sword = c.weaponOptions.find((w) => w.label === 'Longsword');
    expect(sword?.pact).toBe(true);
    expect(sword?.abilityMod).toBe(d.modifiers.cha);
    expect(c.spellNames).toContain('Mage Armor');
  });
  it('sayı ve ön koşullar SRD tablosundan: 1. seviyede 1, 2. seviyede 3, 5. seviyede 5; Thirsting Blade için Pact of the Blade', () => {
    expect(invocationProblems('warlock', 1, ['armor-of-shadows'], [])).toEqual([]);
    expect(invocationProblems('warlock', 2, ['armor-of-shadows'], [])[0]).toContain('3 seçilmeli');
    expect(invocationProblems('warlock', 5, ['thirsting-blade', 'armor-of-shadows', 'eldritch-mind', 'devils-sight', 'fiendish-vigor'], []).join(' '))
      .toContain('Pact of the Blade');
    expect(invocationProblems('warlock', 5, ['agonizing-blast', 'armor-of-shadows', 'eldritch-mind', 'devils-sight', 'fiendish-vigor'], ['Eldritch Blast']).join(' '))
      .toContain('cantrip');
    const ok = { ...blankCharacter('w'), sheet: wlSheet(5) };
    expect(characterIssues(ok).filter((x) => /Invocation|Pact/.test(x.text))).toEqual([]);
  });
  it('Agonizing Blast her ışına CHA; Repelling Blast isabette 10 ft iter (K7 ışın sayısı korunur)', () => {
    const c = fromSheet(wlSheet(5));
    const r = arena(c, [['B', {}, o(5, 3)]]);
    const evs = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Eldritch Blast', targetId: 'B' }, P1, scripted([20, 15], [10, 1], [20, 15], [10, 1]));
    const hits = evs.filter((e) => e.type === 'attack_resolved') as Array<{ rawDamage: number }>;
    expect(hits).toHaveLength(2);
    expect(hits.every((h) => h.rawDamage === 1 + c.spellMod)).toBe(true);
    expect(r.c('B').pos?.col).toBeGreaterThan(5);
    r.replays();
  });
  it('Fiendish Vigor: False Life slotsuz ve zarın en yükseği; slotsuz büyü yalnızca kendine', () => {
    const c = fromSheet(wlSheet(5, { invocations: ['fiendish-vigor', 'armor-of-shadows', 'eldritch-mind', 'devils-sight', 'pact-of-the-blade'] }));
    const r = arena(c, [['B', {}, o(6, 3)]]);
    const slots = [...r.c('A').spellSlots];
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'False Life', targetIds: ['A'] });
    expect(r.c('A').tempHp).toBe(12);
    expect(r.c('A').spellSlots).toEqual(slots);
    const other = execute(arena(c, [['B', { side: 'party', ownerId: 'p1' }, o(4, 3)]]).state,
      { type: 'cast_spell', actorId: 'A', spellName: 'False Life', targetIds: ['B'] }, P1, () => 0.5);
    expect(other.ok ? '' : other.error).toContain('kendine');
  });
  it('Eldritch Smite: pact silahı isabetinden sonra Pact slotu, (1 + slot seviyesi)d8 Force ve Prone', () => {
    const c = fromSheet(wlSheet(5, { invocations: [...INV.slice(2), 'eldritch-smite', 'eldritch-mind'] }));
    const r = arena(c, [['B', {}, o(4, 3)]]);
    const sword = c.weaponOptions.find((w) => w.pact) as NonNullable<Combatant['weaponOptions'][number]>;
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, scripted([20, 15], [8, 4]));
    const evs = r.do({ type: 'eldritch_smite', actorId: 'A' }, P1, () => 0.5);
    const extra = evs.find((e) => e.type === 'extra_damage') as { rolls: number[]; damageType: string };
    expect(extra.rolls).toHaveLength(4); // 3. seviye Pact slotu: 1 + 3
    expect(extra.damageType).toBe('force');
    expect(r.c('B').conditions).toContain('Prone');
    expect(r.c('A').spellSlots[2]).toBe(1);
    expect(execute(r.state, { type: 'eldritch_smite', actorId: 'A' }, P1, () => 0.5).ok).toBe(false);
    r.replays();
  });
});

describe('Pact Magic ve Magical Cunning', () => {
  it('kısa dinlenme bütün Pact slotlarını doldurur; Magical Cunning harcananın yarısını (yukarı) uzun dinlenmeye dek bir kez', () => {
    const s = wlSheet(5);
    const spent = { ...fullStatus(s), slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] };
    expect(shortRestStatus(s, spent, 0, () => 0.5).status.slots[2]).toBe(2);
    const mc = magicalCunningStatus(s, spent);
    expect(mc?.slots[2]).toBe(1);
    expect(magicalCunningStatus(s, mc ?? undefined)).toBeNull();
  });
});

describe('Fiend Patron', () => {
  it("Dark One's Blessing: düşmanı düşürünce CHA + seviye geçici HP", () => {
    const c = fromSheet(wlSheet(5));
    const r = arena(c, [['B', { hp: 1, maxHp: 20 }, o(5, 3)]]);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Eldritch Blast', targetId: 'B' }, P1, scripted([20, 15], [10, 5], [20, 15], [10, 5]));
    expect(r.c('A').tempHp).toBe(c.modifiers.cha + 5);
    r.replays();
  });
  it("Dark One's Own Luck: başarısız save'e 1d10 (tutarsa kullanım harcanır); Fiendish Resilience seçilen türe direnç", () => {
    const c = fromSheet(wlSheet(6, { featureChoices: { 'warlock/fiend-patron:fiendish-resilience': 'cold' } }));
    expect(c.traits).toContain('dark-ones-own-luck');
    expect(c.resources.darkOnesLuck).toBe(Math.max(1, c.modifiers.cha));
    expect(fromSheet(wlSheet(10, { featureChoices: { 'warlock/fiend-patron:fiendish-resilience': 'cold' } })).resistances).toContain('cold');
    // İkinci şans zarı save'lerde (Tactical Mind ile aynı yol): başarısızlıkta 1d10, tutarsa kaynak harcanır.
    expect(saveDice(c, 'wis').some((x) => x.label === "Dark One's Own Luck" && x.reroll === 'onFail' && x.resource === 'darkOnesLuck')).toBe(true);
    expect(saveDice({ ...c, resources: { ...c.resources, darkOnesLuck: 0 } }, 'wis').some((x) => x.label === "Dark One's Own Luck")).toBe(false);
  });
});
