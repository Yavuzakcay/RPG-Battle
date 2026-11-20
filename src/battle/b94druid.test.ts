/** Görev B94 (kural sürümü 94), aşama C: Druid denetim düzeltmeleri (DRUID-DENETIM.md; Wild Shape hariç). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { druidChoice94 } from './ai/b94';
import { P1, mk } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { CharacterSheet } from '../rules/stats';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const sheet = (level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('d').sheet, name: 'Ova', classId: 'druid', subclassId: 'circle-of-the-land', level, baseScores: suggestedScores('druid'),
  featureChoices: { 'druid/circle-of-the-land:circle-of-the-land-spells': 'temperate' }, ...patch,
});
const druid = (level: number, patch: Partial<CharacterSheet> = {}) => combatantFromSheet(sheet(level, patch), { id: 'A', ownerId: 'p1' });
function arena(a: Combatant, rules: number, pos: Record<string, Offset> = {}, ally: Partial<Combatant> = {}, cols = 15) {
  const parts = [a, mk('C', { ownerId: 'p1', hp: 30, maxHp: 30, ...ally }), mk('B', { side: 'enemies', hp: 60, maxHp: 60 }), mk('E', { side: 'enemies', hp: 60, maxHp: 60 })];
  const s = startBattle('d', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: rules, map: { id: 'col' } }).state;
  const where: Record<string, Offset> = { A: o(3, 3), C: o(5, 3), B: o(8, 3), E: o(8, 4), ...pos };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(where)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: ['A', 'B', 'C', 'E'], turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(cols)) } } as BattleState;
}
const run = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, () => 0.5); if (!r.ok) throw new Error(r.error); return r; };
const LANDS_AID = 'druid/circle-of-the-land:lands-aid';

describe("Land's Aid (SRD 5.2.1 s. 46): 0 HP'deki dost", () => {
  it('94: alandaki 0 HP dost iyileşir ve ayağa kalkar; 93: iyileşmez', () => {
    for (const rules of [94, 93]) {
      const s = arena(druid(3), rules, {}, { hp: 0, life: 'dying', conditions: ['Unconscious', 'Prone'] });
      const r = run(s, { type: 'use_feature', actorId: 'A', feature: LANDS_AID, to: o(5, 3) });
      const c = r.state.combatants.C as Combatant;
      if (rules === 94) { expect(c.hp).toBeGreaterThan(0); expect(c.life).toBe('alive'); expect(c.conditions).not.toContain('Unconscious'); }
      else expect(c.hp).toBe(0);
      expect(replay([{ type: 'battle_started', state: s }, ...r.events])).toEqual(r.state);
    }
  });
  it('YZ (94): 0 HP dost varken onu kaldırmak için; yoksa iki düşmanlı kümeye; 93\'te kullanmaz', () => {
    const s = arena(druid(3), 94, {}, { hp: 0, life: 'dying', conditions: ['Unconscious'] });
    const foes = [s.combatants.B as Combatant, s.combatants.E as Combatant];
    const ok = (c: Command) => execute(s, c, P1, () => 0.5).ok;
    expect(druidChoice94(s, s.combatants.A as Combatant, foes, true, ok)).toMatchObject({ feature: LANDS_AID, to: o(5, 3) });
    const s2 = arena(druid(3), 94);
    expect(druidChoice94(s2, s2.combatants.A as Combatant, foes, true, (c) => execute(s2, c, P1, () => 0.5).ok)).toMatchObject({ feature: LANDS_AID });
    const s3 = arena(druid(3), 93);
    expect(druidChoice94(s3, s3.combatants.A as Combatant, foes, true, () => true)).toBeNull();
  });
});

describe('Natural Recovery (s. 46): yalnız seçili arazinin daire büyüleri slotsuz', () => {
  it('94: Temperate Druid\'in hazırladığı Polar büyüsü (Hold Person) slotsuz değil; 93: eski liste', () => {
    const d = druid(9, { spellNames: ['Hold Person', 'Fog Cloud', 'Cure Wounds'] });
    expect(d.freeSpells?.['Tree Stride']).toBe('naturalRecoveryCast');
    for (const rules of [94, 93]) {
      const s = arena(d, rules);
      const a = s.combatants.A as Combatant;
      expect(a.freeSpells?.['Hold Person']).toBe(rules === 93 ? 'naturalRecoveryCast' : undefined);
      expect(a.freeSpells?.['Misty Step']).toBe('naturalRecoveryCast');
      expect(a.freeSpellsPre94).toBeUndefined();
    }
  });
});

describe('Wild Companion (s. 43): familiar Fey', () => {
  it('94: savaşta Wild Companion ile çağrılan familiar Fey (Fiend seçimi yok sayılır); 93: seçim', () => {
    for (const rules of [94, 93]) {
      const s = arena(druid(2), rules);
      const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', targetHex: o(3, 2), free: true, choice: 'fiend' } as Command);
      const fam = Object.values(r.state.combatants).find((c) => c.summon?.spellId === 'find-familiar');
      expect(fam?.summon?.choice).toBe(rules === 94 ? 'fey' : 'fiend');
    }
  });
});

describe("Nature's Sanctuary (s. 46): taşınan küp Druid'in 120 ft'inde", () => {
  it('94: 120 ft dışına taşınamaz; 93: taşınır', () => {
    for (const rules of [94, 93]) {
      const s = arena(druid(14), rules, { A: o(0, 3), C: o(1, 3), B: o(29, 3), E: o(29, 4) }, {}, 31);
      const r = run(s, { type: 'use_feature', actorId: 'A', feature: 'druid/circle-of-the-land:natures-sanctuary', to: o(20, 3) });
      const mv = execute(r.state, { type: 'use_feature', actorId: 'A', feature: 'druid/circle-of-the-land:natures-sanctuary', to: o(28, 3) }, P1, () => 0.5);
      expect(mv.ok).toBe(rules === 93);
    }
  });
});
