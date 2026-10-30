/**
 * Görev BARD: Bardic Inspiration (dosta zar, başarısız D20 Testinde atılır), Font of Inspiration (slotla), Jack of All
 * Trades, Superior Inspiration, College of Lore (Cutting Words tepkisi, Bonus Proficiencies).
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, mk, scripted } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { deriveStats, type CharacterSheet } from '../rules/stats';
import { skillBonus } from '../rules/skills';
import { classKit } from '../rules/classFeatures';
import { superiorInspirationEvents } from './bard';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const bardSheet = (level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('b').sheet, name: 'Lira', classId: 'bard', subclassId: 'college-of-lore', level, baseScores: suggestedScores('bard'), ...patch,
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
/** A: Bard, C: dost, B: düşman; sıra A, B, C. */
function arena(a: Combatant, ally: Partial<Combatant> = {}, foe: Partial<Combatant> = {}) {
  const parts = [a, mk('C', { ownerId: 'p1', hp: 30, maxHp: 30, ac: 15, ...ally }), mk('B', { side: 'enemies', hp: 40, maxHp: 40, ...foe })];
  const s = startBattle('b', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), B: o(5, 3), C: o(4, 3) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return new Run({ ...s, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } });
}
const bard = (level = 5, patch: Partial<CharacterSheet> = {}) => combatantFromSheet(bardSheet(level, patch), { id: 'A', ownerId: 'p1' });
const swing = { label: 'Kılıç', attackBonus: 5, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'x' };

describe('Bard çekirdeği', () => {
  it('Bardic Inspiration zarı tablodan (1. seviye d6, 5. seviye d8); Jack of All Trades yetkin olunmayan beceriye ve inisiyatife', () => {
    const d1 = bard(1).features?.find((f) => f.effect.kind === 'inspire')?.effect;
    const d5 = bard(5).features?.find((f) => f.effect.kind === 'inspire')?.effect;
    expect(d1 && 'die' in d1 ? d1.die : null).toBe('1d6');
    expect(d5 && 'die' in d5 ? d5.die : null).toBe('1d8');
    const s = deriveStats(bardSheet(5));
    expect(s.jack).toBe(1);
    expect(s.initiative).toBe(s.modifiers.dex + 1);
    const c = bard(5);
    expect(skillBonus(c, 'athletics')).toBe(c.modifiers.str + 1);
    expect(deriveStats(bardSheet(1)).jack).toBe(0);
  });
  it('dosta bonus eylemle zar; dostun başarısız save\'ine eklenir ve etki biter', () => {
    const r = arena(bard(5));
    r.do({ type: 'use_feature', actorId: 'A', feature: 'bard:bardic-inspiration', targetId: 'C' });
    expect(r.c('C').effects?.some((e) => e.inspire === '1d8')).toBe(true);
    expect(r.c('A').economy.bonus).toBe(true);
    expect(execute(r.state, { type: 'use_feature', actorId: 'A', feature: 'bard:bardic-inspiration', targetId: 'A' }, P1, () => 0.5).ok).toBe(false);
    r.replays();
  });
  it('Font of Inspiration: kullanım bitince en düşük slot harcanır', () => {
    const c = bard(5);
    const r = arena({ ...c, resources: { ...c.resources, bardicInspiration: 0 } });
    const evs = r.do({ type: 'use_feature', actorId: 'A', feature: 'bard:bardic-inspiration', targetId: 'C' });
    expect(evs.some((e) => e.type === 'slot_spent' && e.level === 1)).toBe(true);
    expect(execute(arena({ ...bard(3), resources: { bardicInspiration: 0 } }).state,
      { type: 'use_feature', actorId: 'A', feature: 'bard:bardic-inspiration', targetId: 'C' }, P1, () => 0.5).ok).toBe(false);
  });
  it('ilham alan dostun ıskalayan saldırısına zar eklenir, zar atılınca etki biter', () => {
    const r = arena(bard(5), { attacksPerAction: 1 });
    r.do({ type: 'use_feature', actorId: 'A', feature: 'bard:bardic-inspiration', targetId: 'C' });
    const st = { ...r.state, turnIndex: 2 };
    const res = execute(st, { type: 'attack', actorId: 'C', targetId: 'B', option: swing }, P1, scripted([20, 6], [8, 8], [8, 4]));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const atk = res.events.find((e) => e.type === 'attack_resolved') as { hit: boolean; total: number };
    expect(atk.total).toBe(6 + 5 + 8);
    expect(atk.hit).toBe(true);
    expect(res.state.combatants.C?.effects?.some((e) => e.inspire) ?? false).toBe(false);
  });
  it('Superior Inspiration: savaş başında en az 2', () => {
    const c = bard(18);
    expect(superiorInspirationEvents({ ...c, resources: { ...c.resources, bardicInspiration: 0 } }))
      .toEqual([{ type: 'feature_used', actorId: 'A', feature: 'bardicInspiration', remaining: 2 }]);
    expect(superiorInspirationEvents(bard(5))).toEqual([]);
  });
});

describe('College of Lore', () => {
  it('Bonus Proficiencies: üç ek beceri; Cutting Words tepkisi düşmanın dosta isabetini çevirir', () => {
    expect(classKit('bard', 3, 'college-of-lore').extraClassSkills).toBe(3);
    expect(bard(3).reactions?.some((x) => x.kind === 'cutting')).toBe(true);
    const r = arena(bard(3), {}, { attacks: [] });
    const st = { ...r.state, turnIndex: 1 };
    // Düşman: d20 = 11 → 16 vs AC 15 (isabet); Cutting Words d6 = 6 → 10 (ıska).
    const res = execute(st, { type: 'attack', actorId: 'B', targetId: 'C', option: swing }, GM, scripted([20, 11], [8, 5], [6, 6]));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const atk = res.events.find((e) => e.type === 'attack_resolved') as { hit: boolean; reacted?: { name: string } };
    expect(atk.hit).toBe(false);
    expect(atk.reacted?.name).toBe('Cutting Words');
    expect(res.state.combatants.A?.resources.bardicInspiration).toBe(Math.max(1, bard(3).modifiers.cha) - 1);
    expect(res.state.combatants.A?.economy.reaction).toBe(true);
  });
});
