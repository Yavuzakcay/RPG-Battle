/**
 * Görev SORCERER: Innate Sorcery, Font of Magic, Metamagic, Sorcerous Restoration, Sorcery Incarnate, Draconic Sorcery
 * (Resilience, Elemental Affinity), Sorcerous Burst'ün patlayan zarı ve True Strike'ın büyülü silah bonusu.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, mk, scripted } from './fixtures';
import { blankCharacter, characterIssues, suggestedScores } from '../rules/builder';
import { deriveStats, type CharacterSheet } from '../rules/stats';
import { fullStatus, shortRestStatus } from '../rules/characterRest';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const sorcSheet = (level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('s').sheet, name: 'Ejder', classId: 'sorcerer', subclassId: 'draconic-sorcery', level, baseScores: suggestedScores('sorcerer'),
  metamagic: ['quickened', 'twinned'], ...patch,
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
function arena(a: Combatant, foes: Array<[string, Partial<Combatant>, Offset]>, ally?: [Partial<Combatant>, Offset]) {
  const parts = [a, ...foes.map(([id, p]) => mk(id, { side: 'enemies', hp: 60, maxHp: 60, saves: LOW, ...p })), ...(ally ? [mk('C', { ownerId: 'p1', hp: 30, maxHp: 30, ...ally[0] })] : [])];
  const s = startBattle('s', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), ...Object.fromEntries(foes.map(([id, , p]) => [id, p])), ...(ally ? { C: ally[1] } : {}) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return new Run({ ...s, status: 'active', order: Object.keys(pos), turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } });
}
const MM = { careful: 1, distant: 1, empowered: 1, extended: 1, heightened: 2, quickened: 2, seeking: 1, subtle: 1, transmuted: 1, twinned: 1 };
const sorc = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0], spellSaveDc: 15, spellAttack: 7, spellMod: 4, level: 5,
  resources: { sorceryPoints: 5, innateSorcery: 2 }, resourceCap: { sorceryPoints: 5 }, metamagic: MM,
  modifiers: { str: 0, dex: 2, con: 1, int: 0, wis: 0, cha: 4 }, ...p });

describe('Sorcerer çekirdeği', () => {
  it('karakterden: Sorcery Points tavanı, seçilen Metamagic bedelleri, Innate Sorcery özelliği', () => {
    const c = combatantFromSheet(sorcSheet(5), { id: 'A', ownerId: 'p1' });
    expect(c.resources.sorceryPoints).toBe(5);
    expect(c.resourceCap).toEqual({ sorceryPoints: 5 });
    expect(c.metamagic).toEqual({ quickened: 2, twinned: 1 });
    expect(c.features?.some((f) => f.effect.kind === 'innate')).toBe(true);
    // 1. seviyede Metamagic yok (2. seviyede iki seçenek).
    expect(combatantFromSheet(sorcSheet(1, { subclassId: undefined }), { id: 'A', ownerId: 'p1' }).metamagic).toBeUndefined();
  });
  it('Font of Magic: slot → puan (tavanı aşmaz, eylemsiz); puan → slot bonus eylem, seviye sınırı', () => {
    const r = arena(sorc({ resources: { sorceryPoints: 2, innateSorcery: 2 } }), [['B', {}, o(8, 3)]]);
    r.do({ type: 'font_of_magic', actorId: 'A', mode: 'toPoints', level: 2 });
    expect(r.c('A').resources.sorceryPoints).toBe(4);
    expect(r.c('A').spellSlots[1]).toBe(2);
    expect(r.c('A').economy.bonus).toBe(false);
    r.do({ type: 'font_of_magic', actorId: 'A', mode: 'toSlot', level: 1 });
    expect(r.c('A').resources.sorceryPoints).toBe(2);
    expect(r.c('A').spellSlots[0]).toBe(5);
    expect(r.c('A').economy.bonus).toBe(true);
    const high = execute(arena(sorc(), [['B', {}, o(8, 3)]]).state, { type: 'font_of_magic', actorId: 'A', mode: 'toSlot', level: 4 }, P1, () => 0.5);
    expect(high.ok ? '' : high.error).toContain('en az 7');
    r.replays();
  });
  it('Innate Sorcery: DC +1 ve büyü saldırısında avantaj; kullanım bitince Sorcery Incarnate 2 puanla açar', () => {
    const r = arena(sorc({ spellNames: ['Fire Bolt', 'Sacred Flame'], features: [{ key: 'sorcerer:innate-sorcery', name: 'Innate Sorcery', type: 'bonus', resource: 'innateSorcery', effect: { kind: 'innate', rounds: 10 } }] }),
      [['B', {}, o(6, 3)]]);
    r.do({ type: 'use_feature', actorId: 'A', feature: 'sorcerer:innate-sorcery' });
    expect(r.c('A').resources.innateSorcery).toBe(1);
    const atk = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }).find((e) => e.type === 'attack_resolved') as { reasons: string[]; mode: string };
    expect(atk.reasons).toContain('Innate Sorcery');
    expect(atk.mode).toBe('advantage');
    const dry = arena(sorc({ resources: { sorceryPoints: 5, innateSorcery: 0 }, traits: ['sorcery-incarnate'],
      features: [{ key: 'sorcerer:innate-sorcery', name: 'Innate Sorcery', type: 'bonus', resource: 'innateSorcery', effect: { kind: 'innate', rounds: 10 } }] }), [['B', {}, o(6, 3)]]);
    dry.do({ type: 'use_feature', actorId: 'A', feature: 'sorcerer:innate-sorcery' });
    expect(dry.c('A').resources.sorceryPoints).toBe(3);
    r.replays();
  });
  it('Sorcerous Restoration: kısa dinlenmede seviye/2 puan, uzun dinlenmeye dek bir kez', () => {
    const s = sorcSheet(5);
    const spent = { ...fullStatus(s), resources: { ...fullStatus(s).resources, sorceryPoints: 0 } };
    const r = shortRestStatus(s, spent, 0, () => 0.5);
    expect(r.status.resources.sorceryPoints).toBe(2);
    expect(r.status.resources.sorcerousRestoration).toBe(0);
    expect(shortRestStatus(s, r.status, 0, () => 0.5).status.resources.sorceryPoints).toBe(2);
  });
});

describe('Metamagic', () => {
  it('Quickened: eylemlik büyü bonus eylemle, 2 puan', () => {
    const r = arena(sorc({ spellNames: ['Fire Bolt'] }), [['B', {}, o(6, 3)]]);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B', metamagic: ['quickened'] });
    expect(r.c('A').economy.bonus).toBe(true);
    expect(r.c('A').economy.action).toBe(false);
    expect(r.c('A').resources.sorceryPoints).toBe(3);
    r.replays();
  });
  it('Twinned: Hold Person 2. slotta iki hedef; bilinmeyen ya da pahalı seçenek reddedilir; bir büyüye tek seçenek', () => {
    const r = arena(sorc({ spellNames: ['Hold Person'] }), [['B', {}, o(5, 3)], ['D', {}, o(5, 4)]]);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetIds: ['B', 'D'], slotLevel: 2, metamagic: ['twinned'] }, P1, () => 0.01);
    expect(r.c('B').conditions).toContain('Paralyzed');
    expect(r.c('D').conditions).toContain('Paralyzed');
    const poor = execute(arena(sorc({ spellNames: ['Hold Person'], resources: { sorceryPoints: 1 } }), [['B', {}, o(5, 3)]]).state,
      { type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetId: 'B', metamagic: ['heightened'] }, P1, () => 0.5);
    expect(poor.ok ? '' : poor.error).toContain('Sorcery Point');
    const two = execute(arena(sorc({ spellNames: ['Hold Person'] }), [['B', {}, o(5, 3)]]).state,
      { type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetId: 'B', metamagic: ['heightened', 'subtle'] }, P1, () => 0.5);
    expect(two.ok ? '' : two.error).toContain('tek Metamagic');
    r.replays();
  });
  it('Careful: Fireball alanındaki dost etkilenmez; Heightened: save dezavantajlı', () => {
    const fb = arena(sorc({ spellNames: ['Fireball'] }), [['B', {}, o(8, 3)]], [{}, o(8, 4)]);
    const evs = fb.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: o(8, 3), metamagic: ['careful'] });
    expect(evs.some((e) => e.type === 'save_resolved' && e.targetId === 'C')).toBe(false);
    const h = arena(sorc({ spellNames: ['Hold Person'] }), [['B', {}, o(5, 3)]]);
    const sv = h.do({ type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetId: 'B', metamagic: ['heightened'] }).find((e) => e.type === 'save_resolved') as { mode: string };
    expect(sv.mode).toBe('disadvantage');
  });
  it('Empowered: CHA kadar düşük hasar zarı yeniden atılır', () => {
    const r = arena(sorc({ spellNames: ['Fire Bolt'] }), [['B', {}, o(6, 3)]]);
    // d20 isabet; 2d10 = 1, 1 → yeniden 10, 10.
    const ev = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B', metamagic: ['empowered'] }, P1,
      scripted([20, 15], [10, 1], [10, 1], [10, 10], [10, 10])).find((e) => e.type === 'attack_resolved') as { damageRolls: number[]; rawDamage: number };
    expect(ev.damageRolls).toEqual([10, 10]);
    expect(ev.rawDamage).toBe(20);
  });
});

describe('K11: Seeking, Transmuted, Innate Sorcery kapsamı', () => {
  it('Seeking: ıskada d20 bir kez yeniden, puan yalnızca o zaman; isabette harcanmaz', () => {
    const r = arena(sorc({ spellNames: ['Ray of Frost'] }), [['B', { ac: 15 }, o(6, 3)]]);
    const evs = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Ray of Frost', targetId: 'B', metamagic: ['seeking'] }, P1,
      scripted([20, 1], [20, 18], [8, 5], [8, 5]));
    expect((evs.find((e) => e.type === 'attack_resolved') as { hit: boolean }).hit).toBe(true);
    expect(r.c('A').resources.sorceryPoints).toBe(4);
    const hit = arena(sorc({ spellNames: ['Ray of Frost'] }), [['B', { ac: 15 }, o(6, 3)]]);
    hit.do({ type: 'cast_spell', actorId: 'A', spellName: 'Ray of Frost', targetId: 'B', metamagic: ['seeking'] }, P1, scripted([20, 18], [8, 5], [8, 5]));
    expect(hit.c('A').resources.sorceryPoints).toBe(5);
    // Seeking başka seçenekle birlikte (sınıra sayılmaz).
    const both = execute(arena(sorc({ spellNames: ['Ray of Frost'] }), [['B', {}, o(6, 3)]]).state,
      { type: 'cast_spell', actorId: 'A', spellName: 'Ray of Frost', targetId: 'B', metamagic: ['seeking', 'quickened'] }, P1, () => 0.9);
    expect(both.ok).toBe(true);
    r.replays();
  });
  it('Transmuted: Fire Bolt Cold olur; listede olmayan türde (Radiant) reddedilir', () => {
    const r = arena(sorc({ spellNames: ['Fire Bolt', 'Sacred Flame'] }), [['B', {}, o(6, 3)]]);
    const ev = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B', metamagic: ['transmuted'], transmute: 'cold' }, P1, () => 0.9)
      .find((e) => e.type === 'attack_resolved') as { damageType: string };
    expect(ev.damageType).toBe('cold');
    const bad = execute(arena(sorc({ spellNames: ['Sacred Flame'] }), [['B', {}, o(6, 3)]]).state,
      { type: 'cast_spell', actorId: 'A', spellName: 'Sacred Flame', targetId: 'B', metamagic: ['transmuted'], transmute: 'cold' }, P1, () => 0.5);
    expect(bad.ok ? '' : bad.error).toContain('Transmuted');
  });
  it('Innate Sorcery yalnızca sınıf büyülerine: soy büyüsünde avantaj yok', () => {
    const innate = { key: 'sorcerer:innate-sorcery', name: 'Innate Sorcery', type: 'bonus' as const, resource: 'innateSorcery', effect: { kind: 'innate' as const, rounds: 10 } };
    const r = arena(sorc({ spellNames: ['Fire Bolt', 'Chill Touch'], classSpells: ['Chill Touch'], features: [innate] }), [['B', {}, o(4, 3)]]);
    r.do({ type: 'use_feature', actorId: 'A', feature: 'sorcerer:innate-sorcery' });
    const a = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }).find((e) => e.type === 'attack_resolved') as { reasons: string[] };
    expect(a.reasons).not.toContain('Innate Sorcery');
    const c = combatantFromSheet(sorcSheet(3, { spellNames: ['Fire Bolt', 'Cure Wounds'] }), { id: 'A', ownerId: 'p1' });
    expect(c.classSpells).toEqual(['Fire Bolt']);
  });
});

describe('Draconic Sorcery', () => {
  it('Resilience: HP +seviye, zırhsız AC 10 + DEX + CHA; Elemental Affinity: seçilen türe direnç', () => {
    const plain = deriveStats(sorcSheet(6, { subclassId: undefined }));
    const s = sorcSheet(6, { featureChoices: { 'sorcerer/draconic-sorcery:elemental-affinity': 'cold' } });
    const d = deriveStats(s);
    expect(d.maxHp - plain.maxHp).toBe(6);
    expect(d.ac).toBe(10 + d.modifiers.dex + d.modifiers.cha);
    const c = combatantFromSheet(s, { id: 'A', ownerId: 'p1' });
    expect(c.resistances).toContain('cold');
    expect(c.traits).toContain('affinity-cold');
    expect(c.spellNames).toEqual(expect.arrayContaining(['Chromatic Orb', 'Fly']));
  });
  it('Elemental Affinity: türdeki büyü hasarına CHA bir kez', () => {
    const base = arena(sorc({ spellNames: ['Fire Bolt'] }), [['B', {}, o(6, 3)]]);
    const aff = arena(sorc({ spellNames: ['Fire Bolt'], traits: ['affinity-fire'] }), [['B', {}, o(6, 3)]]);
    const roll = () => scripted([20, 15], [10, 5], [10, 5]);
    const a = base.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, P1, roll()).find((e) => e.type === 'attack_resolved') as { rawDamage: number };
    const b = aff.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, P1, roll()).find((e) => e.type === 'attack_resolved') as { rawDamage: number };
    expect(b.rawDamage - a.rawDamage).toBe(4);
  });
});

describe('büyü düzeltmeleri', () => {
  it('Sorcerous Burst: 8 gelince ek d8 (zincir, en çok büyü değiştiricisi kadar); tür seçimi', () => {
    const r = arena(sorc({ spellNames: ['Sorcerous Burst'], level: 1 }), [['B', {}, o(6, 3)]]);
    const ev = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Sorcerous Burst', targetId: 'B', choice: 'cold' }, P1,
      scripted([20, 15], [8, 8], [8, 8], [8, 3])).find((e) => e.type === 'attack_resolved') as { damageType: string; extra?: Array<{ rolls: number[] }> };
    expect(ev.damageType).toBe('cold');
    expect(ev.extra?.[0]?.rolls).toEqual([8, 3]);
    r.replays();
  });
  it('True Strike: silahın büyülü bonusu saldırı ve hasarda; 5+ seviyede ek Radiant zarı yalnızca isabette', () => {
    const blade = { label: 'Longsword', attackBonus: 6, damage: '1d8+4', damageType: 'slashing', ranged: false, spell: false, tag: 'x', weaponId: 'longsword', enchant: 1 };
    const r = arena(sorc({ spellNames: ['True Strike'], weaponOptions: [blade] }), [['B', {}, o(4, 3)]]);
    const ev = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'True Strike', targetId: 'B' }, P1,
      scripted([20, 10], [8, 4], [6, 2])).find((e) => e.type === 'attack_resolved') as { total: number; rawDamage: number; extra?: Array<{ label: string; type: string }> };
    expect(ev.total).toBe(10 + 7 + 1);
    expect(ev.rawDamage).toBe(4 + 4 + 1);
    expect(ev.extra?.[0]).toMatchObject({ label: 'True Strike', type: 'radiant' });
    expect(r.c('A').effects ?? []).toEqual([]);
  });
});

describe('oluşturucu', () => {
  it('Metamagic seçimi: 2. seviyede iki seçenek gerekli', () => {
    const c = { ...blankCharacter('s'), sheet: sorcSheet(2, { subclassId: undefined, metamagic: ['quickened'] }) };
    expect(characterIssues(c).some((x) => x.text.startsWith('Metamagic'))).toBe(true);
    const ok = { ...c, sheet: { ...c.sheet, metamagic: ['quickened', 'subtle'] } };
    expect(characterIssues(ok).some((x) => x.text.startsWith('Metamagic'))).toBe(false);
  });
});
