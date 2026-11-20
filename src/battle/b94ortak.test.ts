/** Görev B94 (kural sürümü 94), aşama A: ortak düzeltmeler (Incapacitated/ölünce biten-duran etki tek yardımcıda). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { lineOfFire } from './cover';
import { saveDice } from './effectDice';
import { zoneTurnEvents } from './zones';
import { sourceDown } from './sourceDown';
import { GM, P1, mk } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { BattleEvent, BattleState, Combatant, Command } from './types';
import type { Rng } from '../rules/dice';

const pc = (classId: string, level: number, sub?: string) => combatantFromSheet({ ...blankCharacter('x').sheet, name: classId, classId, subclassId: sub, level, baseScores: suggestedScores(classId) }, { id: 'A', ownerId: 'p1' });

function arena(ver: number, a: Combatant, b: Partial<Combatant> = {}) {
  const parts = [{ ...a, id: 'A', ownerId: 'p1' }, mk('B', { side: 'enemies', hp: 200, maxHp: 200, initiative: 5, ...b }), mk('C', { ownerId: 'p1', hp: 20, maxHp: 20 })];
  const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: ver, map: { id: 'col' } }).state;
  const combatants = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: { col: 4, row: 3 }, B: { col: 5, row: 3 }, C: { col: 3, row: 3 } })) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return new Run({ ...s0, status: 'active', round: 1, order: ['A', 'B', 'C'], turnIndex: 0, combatants, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } });
}
class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, rng: Rng = () => 0.5) { const r = execute(this.state, cmd, 'actorId' in cmd && cmd.actorId === 'B' ? GM : (cmd.type === 'set_condition' ? GM : P1), rng); if (!r.ok) throw new Error(r.error); this.state = r.state; this.events.push(...r.events); return r.events; }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
const wisBonus = (c: Combatant) => c.saves.wis + saveDice(c, 'wis').filter((x) => x.label === 'Aura of Protection').reduce((n, x) => n + Number(x.die), 0);

describe('A2: sourceDown yardımcısı', () => {
  it('ölü, 0 HP, Incapacitated (ve onu içeren durumlar) düşmüş sayılır', () => {
    expect(sourceDown(undefined)).toBe(true);
    expect(sourceDown({ hp: 5, conditions: [], life: 'alive' })).toBe(false);
    expect(sourceDown({ hp: 0, conditions: [], life: 'dying' })).toBe(true);
    expect(sourceDown({ hp: 5, conditions: ['Stunned'], life: 'alive' })).toBe(true);
    expect(sourceDown({ hp: 5, conditions: ['Prone'], life: 'alive' })).toBe(false);
  });
});

describe('A2: Aura of Protection (SRD 5.2.1 s. 55)', () => {
  it('94: Paladin\'in kendi bonusu save\'lere yazılmaz, aura yolundan gelir; Incapacitated iken sürmez. 93: eski (sürer)', () => {
    for (const ver of [94, 93]) {
      const r = arena(ver, pc('paladin', 6, 'oath-of-devotion'));
      r.do({ type: 'end_turn', actorId: 'A' });
      const base = wisBonus(r.c('A'));
      r.do({ type: 'set_condition', targetId: 'A', condition: 'Stunned', present: true });
      const stunned = wisBonus(r.c('A'));
      const cha = Math.max(1, r.c('A').modifiers.cha);
      if (ver === 94) { expect(r.c('A').auraOwnLive).toBe(true); expect(stunned).toBe(base - cha); }
      else { expect(r.c('A').auraOwnLive).toBeUndefined(); expect(stunned).toBe(base); }
      // Dost aurası Paladin Incapacitated iken her iki sürümde de yok.
      expect(r.c('C').auraSave ?? 0).toBe(0);
      r.replays();
    }
  });
  it('94: anahtar kapalıyken de Paladin\'in kendi bonusu (eski davranışla aynı toplam)', () => {
    const s94 = arena(94, pc('paladin', 6, 'oath-of-devotion'));
    const s93 = arena(93, pc('paladin', 6, 'oath-of-devotion'));
    s94.do({ type: 'end_turn', actorId: 'A' }); s93.do({ type: 'end_turn', actorId: 'A' });
    expect(wisBonus(s94.c('A'))).toBe(wisBonus(s93.c('A')));
    expect(wisBonus(s94.c('C'))).toBe(wisBonus(s93.c('C')));
  });
});

describe("A2: Nature's Sanctuary ve Holy Nimbus", () => {
  it("Nature's Sanctuary Druid Incapacitated olunca biter (94); 93'te sürer", () => {
    for (const ver of [94, 93]) {
      const r = arena(ver, pc('druid', 14, 'circle-of-the-land'));
      r.do({ type: 'use_feature', actorId: 'A', feature: 'druid/circle-of-the-land:natures-sanctuary', to: { col: 3, row: 3 } });
      expect(lineOfFire(r.state, r.c('B'), r.c('C')).cover).toBeGreaterThanOrEqual(2);
      r.do({ type: 'set_condition', targetId: 'A', condition: 'Incapacitated', present: true });
      const zone = r.state.map?.zones?.some((z) => z.spellId.includes('natures-sanctuary'));
      expect(zone).toBe(ver === 93);
      r.replays();
    }
  });
  it('Holy Nimbus Paladin Incapacitated iken hasar vermez (94), kalkınca yine verir; 93\'te verir', () => {
    for (const ver of [94, 93]) {
      const r = arena(ver, pc('paladin', 20, 'oath-of-devotion'));
      r.do({ type: 'use_feature', actorId: 'A', feature: 'paladin/oath-of-devotion:holy-nimbus' });
      r.do({ type: 'set_condition', targetId: 'A', condition: 'Stunned', present: true });
      const hits = zoneTurnEvents(r.state, 'B', 'start', () => 0.5).filter((e) => e.type === 'effect_tick');
      expect(hits.length > 0).toBe(ver === 93);
      r.do({ type: 'set_condition', targetId: 'A', condition: 'Stunned', present: false });
      expect(zoneTurnEvents(r.state, 'B', 'start', () => 0.5).some((e) => e.type === 'effect_tick')).toBe(true);
      r.replays();
    }
  });
});
