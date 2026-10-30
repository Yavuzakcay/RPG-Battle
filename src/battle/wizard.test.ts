/**
 * Görev WIZARD: Arcane Recovery, Evoker (Potent Cantrip, Sculpt Spells, Empowered Evocation), Blink, Sleep'in ikinci
 * aşaması, Dispel Magic genişletmesi (alan, çağrı, silah güçlendirmesi), Hold Person çok hedef, Chromatic Orb sıçraması.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, mk, scripted } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { fullStatus, shortRestStatus } from '../rules/characterRest';
import type { CharacterSheet } from '../rules/stats';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const wizSheet = (level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('w').sheet, name: 'Büyücü', classId: 'wizard', subclassId: 'evoker', level, baseScores: suggestedScores('wizard'), ...patch,
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
  end(rng: Rng = () => 0.5) { const id = this.state.order[this.state.turnIndex] as string; return this.do({ type: 'end_turn', actorId: id }, this.state.combatants[id]?.side === 'enemies' ? GM : P1, rng); }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
function arena(a: Combatant, foes: Array<[string, Partial<Combatant>, Offset]>, ally?: [Partial<Combatant>, Offset]) {
  const parts = [a, ...foes.map(([id, p]) => mk(id, { side: 'enemies', hp: 40, maxHp: 40, saves: LOW, ...p })), ...(ally ? [mk('C', { ownerId: 'p1', hp: 30, maxHp: 30, ...ally[0] })] : [])];
  const s = startBattle('w', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), ...Object.fromEntries(foes.map(([id, , p]) => [id, p])), ...(ally ? { C: ally[1] } : {}) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return new Run({ ...s, status: 'active', order: Object.keys(pos), turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } });
}
const caster = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0], spellSaveDc: 15, spellAttack: 30, spellMod: 4, level: 5, ...p });

describe('Wizard sınıf özellikleri', () => {
  it('Arcane Recovery: kısa dinlenmede toplam ≤ seviye/2 (yukarı) slot, en yüksekten; uzun dinlenmeye dek bir kez', () => {
    const s = wizSheet(5);
    const spent = { ...fullStatus(s), slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] };
    const r = shortRestStatus(s, spent, 0, () => 0.5);
    expect(r.status.slots.slice(0, 3)).toEqual([0, 0, 1]); // bütçe 3: 3. seviyeden bir slot
    expect(r.status.resources.arcaneRecovery).toBe(0);
    const again = shortRestStatus(s, r.status, 0, () => 0.5);
    expect(again.status.slots.slice(0, 3)).toEqual([0, 0, 1]);
  });
  it('Evoker: Potent Cantrip ve (6) Sculpt Spells işaretleri; (10) Empowered Evocation', () => {
    expect(combatantFromSheet(wizSheet(3), { id: 'A', ownerId: 'p1' }).traits).toContain('potent-cantrip');
    expect(combatantFromSheet(wizSheet(6), { id: 'A', ownerId: 'p1' }).traits).toEqual(expect.arrayContaining(['potent-cantrip', 'sculpt-spells']));
    expect(combatantFromSheet(wizSheet(10), { id: 'A', ownerId: 'p1' }).traits).toContain('empowered-evocation');
  });
  it('Potent Cantrip: save gerektiren cantrip başarıda yarı hasar; Sculpt Spells: Fireball dostu etkilemez', () => {
    const r = arena(caster({ spellNames: ['Sacred Flame'], traits: ['potent-cantrip'] }), [['B', { saves: { ...LOW, dex: 30 } }, o(4, 3)]]);
    const ev = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Sacred Flame', targetId: 'B' }).find((e) => e.type === 'save_resolved') as { success: boolean; rawDamage: number; appliedDamage: number };
    expect(ev.success).toBe(true);
    expect(ev.appliedDamage).toBeGreaterThan(0);
    const fb = arena(caster({ spellNames: ['Fireball'], traits: ['sculpt-spells'] }), [['B', {}, o(8, 3)]], [{}, o(8, 4)]);
    const evs = fb.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: o(8, 3) });
    expect(evs.some((e) => e.type === 'save_resolved' && e.targetId === 'B')).toBe(true);
    expect(evs.some((e) => e.type === 'save_resolved' && e.targetId === 'C')).toBe(false);
  });
});

describe('büyüler', () => {
  it('Blink: tur sonu d20 11+ → Ethereal (hedef alınamaz), sonraki tur başında döner', () => {
    const r = arena(caster({ spellNames: ['Blink'] }), [['B', {}, o(4, 3)]]);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Blink', targetIds: ['A'] });
    r.end(() => 0.9);
    expect(r.c('A').effects?.some((e) => e.ethereal)).toBe(true);
    const hit = execute(r.state, { type: 'attack', actorId: 'B', targetId: 'A', option: { label: 'x', attackBonus: 5, damage: '1d6', damageType: 'slashing', ranged: false, spell: false, tag: 'x' } }, GM, () => 0.5);
    expect(hit.ok).toBe(false);
    r.end();
    expect(r.c('A').effects?.some((e) => e.ethereal) ?? false).toBe(false);
    r.replays();
  });
  it('Sleep: başarısız save Incapacitated; tur sonu ikinci başarısızlıkta Unconscious; hasar alınca uyanır', () => {
    const r = arena(caster({ spellNames: ['Sleep', 'Fire Bolt'] }), [['B', {}, o(6, 3)]]);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Sleep', targetHex: o(6, 3) }, P1, () => 0.01);
    expect(r.c('B').conditions).toContain('Incapacitated');
    r.end(() => 0.01); r.end(() => 0.01);
    expect(r.c('B').conditions).toContain('Unconscious');
    expect(r.c('B').conditions).not.toContain('Incapacitated');
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, P1, () => 0.9);
    expect(r.c('B').conditions).not.toContain('Unconscious');
    r.replays();
  });
  it('Hold Person 3. slotta iki hedef (yuva bir kez, her hedef ayrı save); 2. slotta tek', () => {
    const r = arena(caster({ spellNames: ['Hold Person'] }), [['B', {}, o(5, 3)], ['D', {}, o(5, 4)]]);
    const evs = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetIds: ['B', 'D'], slotLevel: 3 }, P1, () => 0.01);
    expect(evs.filter((e) => e.type === 'slot_spent')).toHaveLength(1);
    expect(r.c('B').conditions).toContain('Paralyzed');
    expect(r.c('D').conditions).toContain('Paralyzed');
    const two = execute(arena(caster({ spellNames: ['Hold Person'] }), [['B', {}, o(5, 3)], ['D', {}, o(5, 4)]]).state,
      { type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetIds: ['B', 'D'], slotLevel: 2 }, P1, () => 0.01);
    expect(two.ok ? '' : two.error).toContain('en çok 1');
    r.replays();
  });
  it('Chromatic Orb: iki zar aynıysa 30 ft içindeki başka düşmana sıçrar', () => {
    const r = arena(caster({ spellNames: ['Chromatic Orb'] }), [['B', {}, o(5, 3)], ['D', {}, o(6, 3)]]);
    // d20 isabet, 3d8 = 4,4,1 (çift) → sıçrama; ikinci küre d20 + 3d8 farklı.
    const evs = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Chromatic Orb', targetId: 'B' }, P1,
      scripted([20, 15], [8, 4], [8, 4], [8, 1], [20, 15], [8, 1], [8, 2], [8, 3]));
    const hits = evs.filter((e) => e.type === 'attack_resolved') as Array<{ targetId: string }>;
    expect(hits.map((h) => h.targetId)).toEqual(['B', 'D']);
  });
  it('Dispel Magic: çağrılmış yaratık kaybolur; silah güçlendirmesi (Magic Weapon) kalkar', () => {
    const r = arena(caster({ spellNames: ['Dispel Magic'] }), [['B', { summon: { by: 'X', spellId: 'find-familiar', spell: 'Find Familiar', turn: 'own', level: 1 } }, o(5, 3)]]);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Dispel Magic', targetId: 'B' });
    expect(r.c('B').summon?.gone).toBe(true);
    const w = arena(caster({ spellNames: ['Dispel Magic'] }), [['B', { buffs: [{ source: 'Magic Weapon', by: 'B', until: 50, attackBonus: 1 }] }, o(5, 3)]]);
    w.do({ type: 'cast_spell', actorId: 'A', spellName: 'Dispel Magic', targetId: 'B' });
    expect(w.c('B').buffs ?? []).toEqual([]);
  });
});
