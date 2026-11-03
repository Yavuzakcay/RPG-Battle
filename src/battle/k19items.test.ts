/** Kuyruk 19 (görev 7): SRD maceracı eşyaları ve sihirli eşyalar (anahtar `srdK19`). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { P1, mk } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { items } from '../data';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';
import type { Rng } from '../rules/dice';

const sheet = (classId: string, level: number, itemNames: string[], extra: object = {}) => ({ ...blankCharacter('x').sheet, name: classId, classId, level, baseScores: suggestedScores(classId), itemNames, ...extra });
function arena(a: Combatant, toggles?: Record<string, boolean>, b: Partial<Combatant> = {}) {
  const parts = [{ ...a, id: 'A', ownerId: 'p1' }, mk('B', { side: 'enemies', hp: 200, maxHp: 200, ac: 5, saves: { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 }, ...b })];
  const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: 16, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
  const combatants = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: { col: 4, row: 3 }, B: { col: 5, row: 3 } })) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s0, status: 'active', round: 1, order: ['A', 'B'], turnIndex: 0, combatants, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } } as BattleState;
}
const run = (s: BattleState, cmd: Command, rng: Rng = () => 0.5) => { const r = execute(s, cmd, P1, rng); if (!r.ok) throw new Error(r.error); return r; };
const pc = (cls: string, lvl: number, its: string[], extra: object = {}) => combatantFromSheet(sheet(cls, lvl, its, extra) as never, { id: 'A', ownerId: 'p1' });

describe('Kuyruk 19: eşyalar', () => {
  it('SRD sihirli eşyalarının ve maceracı eşyalarının hepsi veride; savaş dışılar gerekçeli', () => {
    expect(items.filter((i) => i.srd.startsWith('magic-items:')).length).toBeGreaterThanOrEqual(250);
    for (const i of items) if (i.offCombat !== undefined) expect(i.offCombat.length).toBeGreaterThan(5);
  });
  it('Acid fırlatma: Attack eyleminin saldırısı yerine DEX save ya da 2d6; kapalıyken kullanılamaz', () => {
    const a = pc('fighter', 5, ['Acid (vial)']);
    const s = arena(a);
    const r = run(s, { type: 'use_item', actorId: 'A', itemId: 'acid', targetId: 'B' }, () => 0.01);
    expect(r.events.some((e) => e.type === 'save_resolved' && e.damageType === 'acid' && e.appliedDamage > 0)).toBe(true);
    expect(r.state.combatants.A?.economy.attacksLeft).toBe((a.attacksPerAction ?? 1) - 1);
    expect(replay([{ type: 'battle_started', state: s }, ...r.events])).toEqual(r.state);
    const off = arena(a, { srdK19: false });
    expect(execute(off, { type: 'use_item', actorId: 'A', itemId: 'acid', targetId: 'B' }, P1, () => 0.5).ok).toBe(false);
  });
  it('Potion of Flying: içince uçuş; Ring of Resistance pasif direnç; kapalıyken kalkar', () => {
    const a = pc('fighter', 5, ['Potion of Flying', 'Ring of Resistance (fire)']);
    const s = arena(a);
    expect(s.combatants.A?.effects?.some((e) => e.resist?.includes('fire'))).toBe(true);
    const r = run(s, { type: 'use_item', actorId: 'A', itemId: 'potion-of-flying', targetId: 'A' });
    expect(r.state.combatants.A?.effects?.find((e) => e.fly)?.fly).toBe(60);
    expect(arena(a, { srdK19: false }).combatants.A?.effects?.some((e) => e.resist?.includes('fire'))).toBe(false);
  });
  it('Wand of Fireballs: slotsuz Fireball, DC 15 eşyadan; yük azalır', () => {
    const a = pc('fighter', 5, ['Wand of Fireballs']);
    expect(a.spellNames).toContain('Fireball');
    const s = arena(a);
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: { col: 5, row: 3 } } as Command);
    const sv = r.events.find((e) => e.type === 'save_resolved') as Extract<BattleEvent, { type: 'save_resolved' }>;
    expect(sv.dc).toBe(15);
    expect(r.state.combatants.A?.resources['item:wand-of-fireballs']).toBe(6);
  });
  it('Weapon +2 ve Flame Tongue: saldırı +2 ve isabette 2d6 fire; Adamantine Armor kritiği keser', () => {
    const w = { weapons: [{ name: 'Longsword' }] };
    const base = pc('fighter', 5, [], w);
    const a = pc('fighter', 5, ['Weapon, +2', 'Flame Tongue'], w);
    const o0 = base.weaponOptions[0] as AttackOption, o = a.weaponOptions[0] as AttackOption;
    expect(o.attackBonus).toBe(o0.attackBonus + 2);
    const s = arena(a);
    const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: o }, () => 0.7);
    const atk = r.events.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(atk.extra?.some((x) => x.label === 'Flame Tongue' && x.type === 'fire')).toBe(true);
    const def = pc('fighter', 5, ['Adamantine Armor']);
    const s2 = arena(mk('A', { ownerId: 'p1', weaponOptions: [o0] }), undefined, { effects: def.effects?.filter((e) => e.id.startsWith('item:')) });
    const r2 = run(s2, { type: 'attack', actorId: 'A', targetId: 'B', option: { ...o0, attackBonus: 30 } }, () => 0.999);
    expect((r2.events.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>).critical).toBe(false);
  });
});

describe('Kuyruk 19: tür özellikleri', () => {
  const race = (raceId: string, level = 5) => combatantFromSheet({ ...sheet('fighter', level, []), raceId } as never, { id: 'A', ownerId: 'p1' });
  it('Halfling: Luck, Brave, Nimbleness, Naturally Stealthy; Gnome: INT/WIS/CHA save avantajı; kapalıyken yok', async () => {
    const { saveDice } = await import('./effectDice');
    const h = race('halfling');
    const s = arena(h);
    expect(s.combatants.A?.traits).toEqual(expect.arrayContaining(['halfling-luck', 'halfling-nimbleness', 'naturally-stealthy']));
    expect(saveDice(s.combatants.A as Combatant, 'wis').some((x) => x.label === 'Luck')).toBe(true);
    expect(arena(h, { srdK19: false }).combatants.A?.traits ?? []).not.toContain('halfling-luck');
    const g = arena(race('gnome'));
    expect(g.combatants.A?.effects?.some((e) => e.saveAdv?.includes('int'))).toBe(true);
  });
  it('Orc: Adrenaline Rush (Dash + geçici HP) ve Relentless Endurance (1 HP)', async () => {
    const { damageEffects } = await import('./damage-effects');
    const o = race('orc');
    const s = arena(o);
    const r = run(s, { type: 'use_feature', actorId: 'A', feature: 'srd19:adrenaline-rush' });
    expect(r.state.combatants.A?.economy.dashes).toBe(1);
    expect(r.state.combatants.A?.tempHp ?? 0).toBeGreaterThan(0);
    const fx = damageEffects(s.combatants.A as Combatant, (s.combatants.A as Combatant).hp + 2, 'slashing', false, () => 0.5);
    expect(fx.hpAfter).toBe(1);
    expect(fx.effects.some((e) => e.kind === 'relentless_endurance')).toBe(true);
  });
  it('Dragonborn 5: Draconic Flight; Goliath 5: Large Form', () => {
    const d = arena(race('dragonborn'));
    const r = run(d, { type: 'use_feature', actorId: 'A', feature: 'srd19:draconic-flight' });
    expect(r.state.combatants.A?.effects?.find((e) => e.fly)?.fly).toBeGreaterThan(0);
    const g = arena(race('goliath'));
    const r2 = run(g, { type: 'use_feature', actorId: 'A', feature: 'srd19:large-form' });
    expect(r2.state.combatants.A?.effects?.some((e) => e.size === 1)).toBe(true);
  });
});

describe('Kuyruk 19: binek ve su altı', () => {
  it('Binek: bin, bineğin hareketiyle taşın, binek Prone olunca düş; kapalıyken binilemez', () => {
    const rider = mk('A', { ownerId: 'p1', size: 'M', speed: 30 });
    const horse = mk('H', { ownerId: 'p1', size: 'L', speed: 60 });
    const parts = [rider, horse, mk('B', { side: 'enemies', hp: 50, maxHp: 50 })];
    const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: 16, map: { id: 'col' } }).state;
    const cs = { ...s0.combatants };
    cs.A = { ...(cs.A as Combatant), pos: { col: 4, row: 3 } }; cs.H = { ...(cs.H as Combatant), pos: { col: 5, row: 3 } }; cs.B = { ...(cs.B as Combatant), pos: { col: 12, row: 3 } };
    const s: BattleState = { ...s0, status: 'active', order: ['A', 'H', 'B'], turnIndex: 0, combatants: cs, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
    const r = run(s, { type: 'mount', actorId: 'A', mountId: 'H' });
    expect(r.state.combatants.A?.riding).toBe('H');
    expect(r.state.combatants.A?.pos).toEqual({ col: 5, row: 3 });
    expect(execute(r.state, { type: 'move', actorId: 'A', to: { col: 6, row: 3 } }, P1, () => 0.5).ok).toBe(false);
    const s2: BattleState = { ...r.state, turnIndex: 1 };
    const r2 = run(s2, { type: 'move', actorId: 'H', to: { col: 8, row: 3 } });
    expect(r2.state.combatants.A?.pos).toEqual({ col: 8, row: 3 });
    expect(replay([{ type: 'battle_started', state: s }, ...r.events])).toEqual(r.state);
    const off = { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), ruleToggles: { srdK19: false } } };
    expect(execute(off, { type: 'mount', actorId: 'A', mountId: 'H' }, P1, () => 0.5).ok).toBe(false);
  });
});

describe('Kuyruk 19: canavar yetenekleri', () => {
  it('Ghast: durum bağışıklığı ve Stench aurası; Archmage: Magic Resistance; kapalıyken yok', async () => {
    const { getMonster } = await import('../data');
    const { combatantFromMonster } = await import('./create');
    const mon = (id: string) => ({ ...combatantFromMonster(getMonster(id), { id: 'M' }), side: 'enemies' as const, pos: { col: 5, row: 3 } });
    const start = (m: Combatant, toggles?: Record<string, boolean>) =>
      startBattle('b', 'd-z-zemin', [{ ...mk('A'), ownerId: 'p1' }, m], () => 0.5, { kuralSurumu: 16, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
    const g = start(mon('ghast'));
    expect(g.combatants.M?.effects?.some((e) => e.immune?.includes('Poisoned'))).toBe(true);
    expect(g.map?.zones?.some((z) => z.name === 'Stench' && z.anchorId === 'M')).toBe(true);
    const off = start(mon('ghast'), { srdK19: false });
    expect(off.combatants.M?.effects?.some((e) => e.immune?.includes('Poisoned')) ?? false).toBe(false);
    expect(off.map?.zones?.some((z) => z.name === 'Stench') ?? false).toBe(false);
    const am = start(mon('archmage'));
    expect(am.combatants.M?.effects?.some((e) => e.saveAdvAgainst?.includes('spell'))).toBe(true);
  });
});
