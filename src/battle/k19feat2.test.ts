/** Kuyruk 19 (0b): sınıf özelliklerinin kalanları, 2. parti (anahtar `featuresK19`, kural sürümü 16). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { P1, mk } from './fixtures';
import { alternativeCantrips } from '../rules/builder';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';
import type { Rng } from '../rules/dice';

const bow: AttackOption = { label: 'Longbow', attackBonus: 5, damage: '1d8+3', damageType: 'piercing', ranged: true, range: [150, 600], spell: false, tag: 'longbow', weaponId: 'longbow' };
const OFF = { featuresK19: false };

function arena(ver: number, a: Partial<Combatant>, b: Partial<Combatant> = {}, toggles?: Record<string, boolean>, extra: Combatant[] = [], tiles?: string[]) {
  const parts = [mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, weaponOptions: [bow], ...a }), mk('B', { side: 'enemies', hp: 40, maxHp: 40, ...b }), ...extra];
  const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: ver, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
  const combatants = { ...s0.combatants };
  const pos: Record<string, { col: number; row: number }> = { A: { col: 3, row: 3 }, B: { col: 7, row: 3 }, S: { col: 4, row: 3 }, C: { col: 3, row: 4 } };
  for (const id of Object.keys(combatants)) combatants[id] = { ...(combatants[id] as Combatant), pos: pos[id] ?? null };
  const state: BattleState = { ...s0, status: 'active', round: 1, order: Object.keys(combatants), turnIndex: 0, combatants,
    map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: tiles ?? Array.from({ length: 7 }, () => '.'.repeat(15)) } };
  return new Run(state);
}
class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, rng: Rng = () => 0.5) { const r = execute(this.state, cmd, P1, rng); if (!r.ok) throw new Error(r.error); this.state = r.state; this.events.push(...r.events); return r.events; }
  try(cmd: Command, rng: Rng = () => 0.5) { const r = execute(this.state, cmd, P1, rng); return r.ok ? null : r.error; }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  to(id: string) { this.state = { ...this.state, turnIndex: this.state.order.indexOf(id) }; }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
const modeOf = (evs: BattleEvent[]) => (evs.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }> | undefined)?.mode;

describe('Kuyruk 19: Feral Senses', () => {
  it('30 ft içindeki görünmez hedefe saldırı dezavantajsız (sürüm 16); kapalı ve sürüm 15\'te dezavantajlı', () => {
    const inv = { conditions: ['Invisible'] };
    expect(modeOf(arena(16, { traits: ['feral-senses'] }, inv).do({ type: 'attack', actorId: 'A', targetId: 'B', option: bow }))).toBe('normal');
    for (const r of [arena(16, { traits: ['feral-senses'] }, inv, OFF), arena(15, { traits: ['feral-senses'] }, inv)]) {
      expect(modeOf(r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: bow }))).toBe('disadvantage');
    }
  });
});

describe('Kuyruk 19: Divine Sense', () => {
  it('gizlenmiş Undead hedef alınabilir (sürüm 16); özellik kullanılmadan alınamaz', () => {
    const feature = { key: 'paladin:channel-divinity', name: 'Channel Divinity', type: 'bonus', resource: 'channelDivinity', effect: { kind: 'divineSense', rangeFt: 60, types: ['celestial', 'fiend', 'undead'], rounds: 100 } };
    const a = { features: [feature] as unknown as Combatant['features'], resources: { channelDivinity: 2 } as Combatant['resources'] };
    const r = arena(16, a, { hidden: { dc: 15 } as unknown as Combatant['hidden'], creatureType: 'undead' });
    expect(r.try({ type: 'attack', actorId: 'A', targetId: 'B', option: bow })).toMatch(/gizlenmiş/);
    r.do({ type: 'use_feature', actorId: 'A', feature: 'paladin:channel-divinity' });
    expect(r.c('A').resources.channelDivinity).toBe(1);
    expect(r.try({ type: 'attack', actorId: 'A', targetId: 'B', option: bow })).toBeNull();
    r.replays();
    const old = arena(15, a, { hidden: { dc: 15 } as unknown as Combatant['hidden'], creatureType: 'undead' });
    expect(old.try({ type: 'use_feature', actorId: 'A', feature: 'paladin:channel-divinity' })).not.toBeNull();
  });
});

describe('Kuyruk 19: Roving', () => {
  it('ağır zırhsız Ranger çok derin suya girebilir (yüzme hızı); sürüm 15\'te giremez', async () => {
    const { deepWaterBlocks } = await import('./deepWater');
    const tiles = Array.from({ length: 7 }, () => 'w'.repeat(15));
    const on = arena(16, { traits: ['roving'] }, {}, { deepWaterLimit: true }, [], tiles);
    const old = arena(15, { traits: ['roving'] }, {}, { deepWaterLimit: true }, [], tiles);
    expect(deepWaterBlocks(on.state, on.c('A'))({ col: 7, row: 3 })).toBe(false);
    expect(deepWaterBlocks(old.state, old.c('A'))({ col: 7, row: 3 })).toBe(true);
    const heavy = arena(16, { traits: ['roving'], heavyArmor: true }, {}, { deepWaterLimit: true }, [], tiles);
    expect(deepWaterBlocks(heavy.state, heavy.c('A'))({ col: 7, row: 3 })).toBe(true);
  });
});

describe('Kuyruk 19: Otherworldly Steed', () => {
  const steed = (choice: string) => mk('S', { ownerId: 'p1', hp: 20, maxHp: 30, summon: { by: 'A', spellId: 'find-steed', spell: 'Find Steed', turn: 'after-owner', level: 2, choice } as Combatant['summon'] });
  it('Healing Touch (Celestial): 5 ft içine 2d8 + seviye; savaşta bir kez', () => {
    const r = arena(16, { hp: 10, spellSaveDc: 13 }, {}, undefined, [steed('celestial')]);
    r.to('S');
    r.do({ type: 'steed_action', actorId: 'S', kind: 'healing-touch', targetId: 'A' }, () => 0.5);
    expect(r.c('A').hp).toBe(10 + 5 + 5 + 2);
    r.state = { ...r.state, combatants: { ...r.state.combatants, S: { ...r.c('S'), economy: { ...r.c('S').economy, bonus: false } } } };
    expect(r.try({ type: 'steed_action', actorId: 'S', kind: 'healing-touch', targetId: 'A' })).not.toBeNull();
  });
  it('Fell Glare (Fiend): WIS save başarısızsa Frightened; yanlış türde yok; sürüm 15\'te yok', () => {
    const r = arena(16, { spellSaveDc: 30 }, {}, undefined, [steed('fiend')]);
    r.to('S');
    expect(r.try({ type: 'steed_action', actorId: 'S', kind: 'healing-touch', targetId: 'A' })).not.toBeNull();
    r.do({ type: 'steed_action', actorId: 'S', kind: 'fell-glare', targetId: 'B' }, () => 0.1);
    expect(r.c('B').conditions).toContain('Frightened');
    const old = arena(15, { spellSaveDc: 30 }, {}, undefined, [steed('fiend')]);
    old.to('S');
    expect(old.try({ type: 'steed_action', actorId: 'S', kind: 'fell-glare', targetId: 'B' })).not.toBeNull();
  });
  it('Life Bond: sahibe 1.+ seviye büyüyle gelen iyileşme 5 ft içindeki ata da', () => {
    const cleric = { hp: 10, spellNames: ['Healing Word'], spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0], spellMod: 3, spellSaveDc: 13, spellAttack: 5 };
    const r = arena(16, cleric, {}, undefined, [steed('celestial')]);
    const evs = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Healing Word', targetId: 'A' });
    const own = evs.find((e) => e.type === 'healed' && e.targetId === 'A') as Extract<BattleEvent, { type: 'healed' }>;
    const bond = evs.find((e) => e.type === 'healed' && e.targetId === 'S') as Extract<BattleEvent, { type: 'healed' }>;
    expect(bond?.label).toBe('Life Bond');
    expect(bond.amount).toBe(Math.min(own.amount, 10));
    r.replays();
    const off = arena(16, cleric, {}, OFF, [steed('celestial')]);
    expect(off.do({ type: 'cast_spell', actorId: 'A', spellName: 'Healing Word', targetId: 'A' }).some((e) => e.type === 'healed' && e.targetId === 'S')).toBe(false);
  });
});

describe('Kuyruk 19: Wild Companion', () => {
  const druid = { traits: ['wild-companion', 'wild-companion-only'], spellNames: ['Find Familiar'], spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0], resources: { wildShape: 2 } as Combatant['resources'], spellSaveDc: 13, spellMod: 3 };
  it('savaşta Magic eylemiyle Find Familiar: slot ya da Wild Shape; sürüm 15\'te ritüel engeli', () => {
    const r = arena(16, druid);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', targetHex: { col: 3, row: 2 } });
    expect(r.c('A').spellSlots[0]).toBe(1);
    expect(Object.values(r.state.combatants).some((c) => c.summon?.spellId === 'find-familiar')).toBe(true);
    const w = arena(16, druid);
    w.do({ type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', targetHex: { col: 3, row: 2 }, free: true });
    expect(w.c('A').resources.wildShape).toBe(1);
    expect(w.c('A').spellSlots[0]).toBe(2);
    w.replays();
    expect(arena(15, druid).try({ type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', targetHex: { col: 3, row: 2 } })).toMatch(/ritüel/);
  });
});

describe('Kuyruk 19: Druidic Warrior', () => {
  it('Ranger Fighting Style yuvasında iki Druid cantrip\'i seçebilir', () => {
    const r = alternativeCantrips({ classId: 'ranger', level: 2, advancements: [{ level: 2, featId: 'druidic-warrior' }] as never });
    expect(r.max).toBe(2);
    expect(r.options).toContain('Shillelagh');
  });
});

describe('Kuyruk 19: alt sınıf büyü tabloları ve Natural Recovery', () => {
  it('Circle of the Land 9. seviye: 7./9. satır büyüleri hazır; bir daire büyüsü slotsuz (uzun dinlenmede bir)', async () => {
    const { combatantFromSheet } = await import('./create');
    const { blankCharacter, suggestedScores } = await import('../rules/builder');
    const c = combatantFromSheet({ ...blankCharacter('d').sheet, name: 'Ova', classId: 'druid', subclassId: 'circle-of-the-land', level: 9, baseScores: suggestedScores('druid'),
      featureChoices: { 'druid/circle-of-the-land:circle-of-the-land-spells': 'temperate' } }, { id: 'D', ownerId: 'p1' });
    expect(c.spellNames).toEqual(expect.arrayContaining(['Freedom of Movement', 'Tree Stride']));
    expect(c.resources.naturalRecoveryCast).toBe(1);
    expect(c.freeSpells?.['Tree Stride']).toBe('naturalRecoveryCast');
  });
});
