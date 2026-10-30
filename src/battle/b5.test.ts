/**
 * Görev B5 (SRD 5.2.1): özel mekanikli büyüler. Color Spray, Expeditious Retreat, Ice Knife, Alter Self, Darkvision,
 * Dragon's Breath, Enhance Ability, Pass without Trace, Protection from Poison, Bestow Curse, Dispel Magic, Remove Curse;
 * savaş dışı ve karar bekleyen kayıtlar. Konsantrasyon, süre ve replay.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, P2, mk } from './fixtures';
import { canSee, litHexes } from './maprules';
import { stealthAuraFor } from './stealth';
import { checkMode } from '../rules/skills';
import { spells } from '../data';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const mid: Rng = () => 0.5;
const high: Rng = () => 0.99;
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const err = (r: ReturnType<typeof execute>) => (r.ok ? null : r.error);
const claw = { name: 'Claw', bonus: 4, damageDice: '1d8+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
const SLOTS = [4, 3, 3, 3, 0, 0, 0, 0, 0];
const sword: AttackOption = { label: 'Longsword', attackBonus: 4, damage: '1d8+2', damageType: 'slashing', ranged: false, spell: false,
  tag: 'longsword', weaponId: 'longsword', weaponDamage: '1d8', abilityMod: 2 };
const bow: AttackOption = { label: 'Longbow', attackBonus: 5, damage: '1d8+3', damageType: 'piercing', ranged: true, range: [150, 600], spell: false,
  tag: 'longbow', weaponId: 'longbow', weaponDamage: '1d8', abilityMod: 3 };
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };

/** Düz zemin (harita kuralları `mapId`'den); sıra A (büyücü, 3,3), B (düşman), C (dost, 2,3). */
function arena(a: Partial<Combatant> = {}, b: Partial<Combatant> = {}, c: Partial<Combatant> = {}, bPos = o(4, 3), mapId = 'col') {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellAttack: 5, spellSaveDc: 13, spellMod: 3, proficiency: 3, spellSlots: SLOTS, weaponOptions: [sword, bow], ...a }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, attacks: [claw], saves: LOW, ...b }),
    mk('C', { ownerId: 'p2', hp: 20, maxHp: 20, weaponOptions: [sword], ...c }),
  ];
  const started = startBattle('b5', 'd-z-zemin', parts, () => 0.5, { map: { id: mapId } });
  const pos: Record<string, Offset> = { A: o(3, 3), B: bPos, C: o(2, 3) };
  const combatants = { ...started.state.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const tiles = Array.from({ length: 7 }, () => '.'.repeat(15));
  const state: BattleState = { ...started.state, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants,
    map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles } };
  return new Run(state);
}

class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, ctx: CommandContext = P1, rng: Rng = mid) {
    const r = ok(execute(this.state, cmd, ctx, rng));
    this.state = r.state;
    this.events.push(...r.events);
    return r.events;
  }
  try(cmd: Command, ctx: CommandContext = P1, rng: Rng = mid) { return err(execute(this.state, cmd, ctx, rng)); }
  cast(cmd: Omit<Extract<Command, { type: 'cast_spell' }>, 'type' | 'actorId'>, rng: Rng = mid) {
    return this.do({ type: 'cast_spell', actorId: 'A', ...cmd }, P1, rng);
  }
  ctx(id: string): CommandContext { const c = this.c(id); return c.side === 'enemies' ? GM : c.ownerId === 'p2' ? P2 : P1; }
  end(rng: Rng = mid) {
    const id = this.state.order[this.state.turnIndex] as string;
    return this.do({ type: 'end_turn', actorId: id }, this.ctx(id), rng);
  }
  to(id: string, rng: Rng = mid) { const out: BattleEvent[] = []; while (this.state.order[this.state.turnIndex] !== id) out.push(...this.end(rng)); return out; }
  round(rng: Rng = mid) { const out: BattleEvent[] = [...this.end(rng)]; out.push(...this.to('A', rng)); return out; }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  fx(id: string, srd: string) { return this.c(id).effects?.find((e) => e.id === srd); }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
const spell = (name: string) => spells.find((x) => x.name === name);

describe('veri', () => {
  it('B5 kayıtları: her biri çalışıyor, kısmi, savaş dışı ya da karar bekliyor', () => {
    // Görev K9c: Jump ve Spider Climb; Görev CLERIC: Sanctuary ve Warding Bond süren etki oldu.
    for (const n of ['Jump', 'Spider Climb', 'Sanctuary', 'Warding Bond']) expect(spell(n)?.mechanics.kind, n).toBe('effect');
    for (const n of ['Druidcraft', 'Goodberry', 'Tongues', 'Speak with Dead']) expect(spell(n)?.mechanics.offCombat, n).toBe(true);
    expect(spell('Dispel Magic')?.mechanics.kind).toBe('dispel');
  });
});

describe('saldırı ve alan', () => {
  it('Ice Knife: saldırıdan sonra hedef ve çevresi DEX save ya da 2d6 cold (ıskada da)', () => {
    const r = arena({ spellNames: ['Ice Knife'] }, {}, {}, o(6, 3));
    const evs = r.cast({ spellName: 'Ice Knife', targetId: 'B' }, () => 0.01);
    const hit = evs.find((e) => e.type === 'attack_resolved');
    expect(hit?.type === 'attack_resolved' && hit.hit).toBe(false);
    const burst = evs.filter((e) => e.type === 'save_resolved');
    expect(burst).toHaveLength(1);
    expect(burst[0]).toMatchObject({ targetId: 'B', ability: 'dex', damageType: 'cold', success: false });
    expect(evs.filter((e) => e.type === 'slot_spent')).toHaveLength(1);
    r.replays();
  });
  it('Color Spray: konide CON save ya da Blinded; süre bitince kalkar', () => {
    const r = arena({ spellNames: ['Color Spray'] }, {}, {}, o(5, 3));
    r.cast({ spellName: 'Color Spray', targetHex: o(5, 3) });
    expect(r.c('B').conditions).toContain('Blinded');
    r.round(); r.round(); r.round();
    expect(r.c('B').conditions).not.toContain('Blinded');
    r.replays();
  });
  it('Dragon\'s Breath: bonus eylemle hazır; eylemle 15 ft koni DEX save', () => {
    const r = arena({ spellNames: ['Dragon\'s Breath'] });
    const cast = r.cast({ spellName: 'Dragon\'s Breath', targetHex: o(4, 3) });
    expect(cast.some((e) => e.type === 'save_resolved')).toBe(false);
    expect(r.c('A').concentration?.spell).toBe('Dragon\'s Breath');
    const evs = r.do({ type: 'spell_followup', actorId: 'A', targetId: 'B' });
    expect(evs.find((e) => e.type === 'save_resolved')).toMatchObject({ targetId: 'B', ability: 'dex', damageType: 'fire' });
    r.replays();
  });
});

describe('süren etkiler', () => {
  it('Expeditious Retreat: hız iki katı, konsantrasyon', () => {
    const r = arena({ spellNames: ['Expeditious Retreat'] });
    r.cast({ spellName: 'Expeditious Retreat' });
    expect(r.fx('A', 'spells:expeditious-retreat')).toMatchObject({ speedMult: 2, concentration: 'Expeditious Retreat' });
  });
  it('Alter Self: silahsız vuruş 1d6 + büyü yeteneği, büyü saldırısıyla', () => {
    const unarmed: AttackOption = { label: 'Unarmed Strike', attackBonus: 2, damage: '1+0', damageType: 'bludgeoning', ranged: false, spell: false,
      tag: 'unarmed', weaponId: 'unarmed-strike', weaponDamage: '1', abilityMod: 0 };
    const r = arena({ spellNames: ['Alter Self'], weaponOptions: [unarmed] });
    r.cast({ spellName: 'Alter Self' });
    r.round();
    const e = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: unarmed }, P1, () => 0.9).find((x) => x.type === 'attack_resolved');
    expect(e?.type === 'attack_resolved' && e.rawDamage).toBe(6 + 3);
    r.replays();
  });
  it('Darkvision: karanlık haritada uzaktaki ışıksız hedef görülür', () => {
    const r = arena({ spellNames: ['Darkvision'], darkvision: 0 }, {}, {}, o(13, 0), 'magara');
    const lit = litHexes(r.state);
    const spot = [...Array(15).keys()].flatMap((col) => [...Array(7).keys()].map((row) => o(col, row)))
      .find((h) => !lit.has(`${h.col},${h.row}`) && Math.abs(h.col - 3) >= 6) as Offset;
    r.state = { ...r.state, combatants: { ...r.state.combatants, B: { ...r.c('B'), pos: spot } } };
    const far = r.c('B');
    expect(canSee(r.state, r.c('A'), far)).toBe(false);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Darkvision', targetIds: ['A'] });
    expect(canSee(r.state, r.c('A'), far)).toBe(true);
  });
  it('Enhance Ability: seçilen yetenekte kontrollere avantaj', () => {
    const r = arena({ spellNames: ['Enhance Ability'] });
    expect(checkMode(r.c('C'), 'athletics')).toBe('normal');
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Enhance Ability', targetIds: ['C'], choice: 'str' });
    expect(checkMode(r.c('C'), 'athletics')).toBe('advantage');
    expect(checkMode(r.c('C'), 'stealth')).toBe('normal');
  });
  it('Pass without Trace: 30 ft içindeki dostlar aurada; konsantrasyon bitince değil', () => {
    const r = arena({ spellNames: ['Pass without Trace', 'Expeditious Retreat'] });
    r.cast({ spellName: 'Pass without Trace' });
    expect(stealthAuraFor(r.state, r.c('C'))).toBe(true);
    expect(stealthAuraFor(r.state, r.c('B'))).toBe(false);
    r.round();
    r.cast({ spellName: 'Expeditious Retreat' });
    expect(stealthAuraFor(r.state, r.c('C'))).toBe(false);
  });
  it('Protection from Poison: Poisoned kalkar, poison direnci', () => {
    const r = arena({ spellNames: ['Protection from Poison'] }, {}, { conditions: ['Poisoned'] });
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Protection from Poison', targetIds: ['C'] });
    expect(r.c('C').conditions).not.toContain('Poisoned');
    expect(r.fx('C', 'spells:protection-from-poison')?.resist).toEqual(['poison']);
    r.replays();
  });
});

describe('lanet ve kaldırma', () => {
  it('Bestow Curse: WIS save ya da seçilen yetenekte save dezavantajı; Remove Curse kaldırır', () => {
    const r = arena({ spellNames: ['Bestow Curse', 'Remove Curse'] });
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Bestow Curse', targetIds: ['B'], choice: 'con' });
    expect(r.fx('B', 'spells:bestow-curse')).toMatchObject({ saveDis: ['con'], concentration: 'Bestow Curse' });
    r.round();
    const evs = r.cast({ spellName: 'Remove Curse', targetId: 'B' });
    expect(evs.some((e) => e.type === 'effect_ended' && e.reason === 'dispelled')).toBe(true);
    expect(r.fx('B', 'spells:bestow-curse')).toBeUndefined();
    r.replays();
  });
  it('Dispel Magic: yaratıktaki süren büyü etkileri biter (dost ya da düşman)', () => {
    const r = arena({ spellNames: ['Dispel Magic', 'Bane'] });
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Bane', targetIds: ['B'] });
    expect(r.fx('B', 'spells:bane')).toBeDefined();
    r.round();
    r.cast({ spellName: 'Dispel Magic', targetId: 'B' });
    expect(r.fx('B', 'spells:bane')).toBeUndefined();
    r.replays();
  });
});
