/** Görev B95-B (kural sürümü 97): Fighter denetim düzeltmeleri (FIGHTER-DENETIM.md, SRD 5.2.1 s. 47–49). */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { applyEvents, replay } from './reduce';
import { saveDice } from './effectDice';
import { resolveSave } from '../rules/attack';
import { GM, mk, scripted } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const sheet = (level: number) => ({ ...blankCharacter('x').sheet, name: 'Kara', classId: 'fighter', subclassId: 'champion', level, baseScores: suggestedScores('fighter'),
  weapons: [{ name: 'Greataxe' }], weaponMasteries: ['greataxe'] });
function arena(level: number, rules: number, patch: Partial<Combatant> = {}) {
  const f = combatantFromSheet(sheet(level), { id: 'A', ownerId: 'p1' });
  const s = startBattle('f', 'd-z-zemin', [f, mk('B', { side: 'enemies', hp: 50, maxHp: 50 })], () => 0.5, { kuralSurumu: rules, map: { id: 'col' } }).state;
  const combatants = { ...s.combatants, A: { ...(s.combatants.A as Combatant), pos: o(3, 3), ...patch }, B: { ...(s.combatants.B as Combatant), pos: o(6, 3) } };
  return { ...s, order: ['A', 'B'], turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } } as BattleState;
}
const A = (s: BattleState) => s.combatants.A as Combatant;

describe('Heroic Warrior (Champion, bizim sürüm: tur başında)', () => {
  it('97: inisiyatifte ilk sıradaki Champion 1. turunda Heroic Inspiration alır; 96: almaz', () => {
    for (const v of [96, 97]) {
      const s = arena(10, v, { resources: { ...(combatantFromSheet(sheet(10), { id: 'A', ownerId: 'p1' }).resources), heroicInspiration: 0 } });
      expect(A(s).traits).toContain('heroic-warrior');
      const go = applyEvents(s, [{ type: 'combat_started' }]);
      expect(go.combatants.A?.resources.heroicInspiration ?? 0).toBe(v === 97 ? 1 : 0);
    }
  });
});

describe('Indomitable (s. 48: "If you fail a saving throw")', () => {
  it('97: başarısız ölüm save\'i Fighter seviyesiyle yeniden atılır ve kullanım düşer; 96: yok; replay aynı', () => {
    for (const v of [96, 97]) {
      const s0 = arena(9, v, { hp: 0, life: 'dying', conditions: ['Unconscious'], resources: { indomitable: 1 } as Combatant['resources'] });
      const s = { ...s0, order: ['B', 'A'], turnIndex: 0, status: 'active' } as BattleState;
      const r = execute(s, { type: 'end_turn', actorId: 'B' }, GM, scripted([20, 3], [20, 4]));
      if (!r.ok) throw new Error(r.error);
      const ds = r.events.find((e) => e.type === 'death_save');
      expect(ds).toMatchObject({ outcome: v === 97 ? 'success' : 'failure' });
      expect(A(r.state).resources.indomitable).toBe(v === 97 ? 0 : 1);
      expect(replay([{ type: 'battle_started', state: s }, ...r.events])).toEqual(r.state);
    }
  });
  it('97: başarı imkânsızken (20 + seviye bile DC\'ye yetmiyor) seçilmez, kullanım harcanmaz; 96: harcanır', () => {
    for (const sinif97 of [false, true]) {
      const c = mk('A', { level: 9, traits: ['indomitable'], resources: { indomitable: 1 } as Combatant['resources'], ...(sinif97 ? { sinif97 } : {}) });
      const r = resolveSave({ extra: saveDice(c, 'wis'), modifier: 0, dc: 40, mode: 'normal' }, () => 0.5);
      expect(r.success).toBe(false);
      expect((r.extra ?? []).some((x) => x.label === 'Indomitable')).toBe(!sinif97);
      // Başarı olası olduğunda 97'de de kullanılır.
      const ok = resolveSave({ extra: saveDice(c, 'wis'), modifier: 0, dc: 20, mode: 'normal' }, scripted([20, 2], [20, 15]));
      expect(ok.success).toBe(true);
      expect((ok.extra ?? []).some((x) => x.label === 'Indomitable' && x.resource === 'indomitable')).toBe(true);
    }
  });
});

describe('Tactical Master (s. 48): komut', () => {
  it('9. seviye: ustalıklı silahla saldırıda Sap seçilir (komutun `mastery` alanı)', () => {
    const s0 = arena(9, 97);
    const s = { ...s0, status: 'active', combatants: { ...s0.combatants, B: { ...(s0.combatants.B as Combatant), pos: o(4, 3), ac: 1 } } } as BattleState;
    const opt = A(s).weaponOptions.find((x) => x.label === 'Greataxe' && x.mastery);
    expect(opt).toBeTruthy();
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt!, mastery: 'sap' }, { playerId: 'p1', isGm: false }, scripted([20, 15], [12, 6]));
    if (!r.ok) throw new Error(r.error);
    expect(r.events.some((e: BattleEvent) => e.type === 'mastery_applied' && e.mastery === 'sap')).toBe(true);
  });
});
