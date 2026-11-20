/** Görev B94 (kural sürümü 94), aşama E: Ranger denetim düzeltmeleri (RANGER-DENETIM.md). */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { hordeProblem } from './classTraits';
import { hunterDefenseEvents } from './reactions';
import { rangerChoice94 } from './ai/b94';
import { P1, mk, scripted } from './fixtures';
import { blankCharacter, characterIssues, newCharacter, spellCounts, suggestedScores } from '../rules/builder';
import { classKit } from '../rules/classFeatures';
import { recommendedSpells } from '../screens/builderDefaults';
import type { CharacterSheet } from '../rules/stats';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const sheet = (level: number, p: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('r').sheet, name: 'Kael', classId: 'ranger', subclassId: 'hunter', level, baseScores: suggestedScores('ranger'),
  armorName: 'Leather Armor', weapons: [{ name: 'Shortsword' }, { name: 'Longbow' }],
  featureChoices: { 'ranger/hunter:hunters-prey': 'horde-breaker' }, ...p,
});
function arena(level: number, rules: number) {
  const r = combatantFromSheet(sheet(level), { id: 'A', ownerId: 'p1' });
  const parts = [r, mk('B', { side: 'enemies', hp: 40, maxHp: 40, ac: 5 }), mk('C', { side: 'enemies', hp: 40, maxHp: 40, ac: 5 }), mk('D', { side: 'enemies', hp: 40, maxHp: 40, ac: 5 })];
  const s = startBattle('r', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: rules, map: { id: 'col' } }).state;
  const where: Record<string, Offset> = { A: o(3, 3), B: o(4, 3), C: o(4, 4), D: o(4, 2) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(where)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: ['A', 'B', 'C', 'D'], turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } } as BattleState;
}
const pad = () => scripted(...Array.from({ length: 30 }, () => [20, 15] as [number, number]));
const run = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, pad()); if (!r.ok) throw new Error(r.error); return r; };
const A = (s: BattleState) => s.combatants.A as Combatant;
const opt = (s: BattleState, label: string) => A(s).weaponOptions.find((x) => x.label === label)!;

describe("Hunter's Mark her zaman hazır (SRD 5.2.1 s. 58)", () => {
  it('kitte her zaman hazır; öneri listesi onu seçmez; listede kalmışsa hazır sayısına girmez', () => {
    expect(classKit('ranger', 1).alwaysPrepared).toContain("Hunter's Mark");
    const rec = recommendedSpells(sheet(1)).spellNames;
    expect(rec).not.toContain("Hunter's Mark");
    expect(rec.length).toBe(2);
    expect(spellCounts({ ...sheet(1), spellNames: [...rec, "Hunter's Mark"] }).prepared).toBe(2);
    const issues = characterIssues({ ...newCharacter('x'), sheet: { ...sheet(1), spellNames: [...rec, "Hunter's Mark"] } }).map((i) => (typeof i === 'string' ? i : i.text));
    expect(issues.some((x) => /fazla/.test(x))).toBe(false);
    // Savaşta yine bilinir ve Favored Enemy ile slotsuz.
    const c = combatantFromSheet({ ...sheet(1), spellNames: rec }, { id: 'A', ownerId: 'p1' });
    expect(c.spellNames).toContain("Hunter's Mark");
    const s = arena(1, 94);
    const r = run({ ...s, combatants: { ...s.combatants, A: { ...A(s), ...c, id: 'A', pos: A(s).pos } } } as BattleState, { type: 'cast_spell', actorId: 'A', spellName: "Hunter's Mark", targetId: 'B' });
    expect(r.events.some((e) => e.type === 'feature_used' && e.feature === 'favoredEnemy')).toBe(true);
    expect(r.events.some((e) => e.type === 'slot_spent')).toBe(false);
  });
});

describe('Horde Breaker (Hunter): aynı silah, bu tur saldırılmamış hedef', () => {
  it('94: bu tur saldırılmış yaratığa ve başka silahla red; 93: kabul', () => {
    for (const rules of [94, 93]) {
      let s = arena(5, rules);
      s = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Shortsword') }).state;
      s = run(s, { type: 'attack', actorId: 'A', targetId: 'C', option: opt(s, 'Shortsword') }).state;
      // Son hedef C; C'nin 5 ft'indeki B bu tur saldırıldı.
      expect(!!hordeProblem(s, A(s), s.combatants.B as Combatant, opt(s, 'Shortsword'))).toBe(rules === 94);
      // D (B'nin değil C'nin yanında olmayabilir): son hedef C'ye bitişik kontrolü ayrı; başka silah 94'te red.
      const dBy = { ...s, combatants: { ...s.combatants, D: { ...(s.combatants.D as Combatant), pos: o(5, 4) } } } as BattleState;
      expect(hordeProblem(dBy, A(dBy), dBy.combatants.D as Combatant, opt(dBy, 'Shortsword'))).toBeNull();
      expect(!!hordeProblem(dBy, A(dBy), dBy.combatants.D as Combatant, opt(dBy, 'Longbow'))).toBe(rules === 94);
    }
  });
  it('kayıt/replay aynı', () => {
    const s0 = arena(5, 94);
    const r = run(s0, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s0, 'Shortsword') });
    expect(A(r.state).economy.attackedIds).toEqual(['B']);
    expect(replay([{ type: 'battle_started', state: s0 }, ...r.events])).toEqual(r.state);
  });
});

describe("Superior Hunter's Defense (s. 61): her hasarda", () => {
  it('hunterDefenseEvents tepki ve tür direnci üretir (save\'li/otomatik isabetli büyü yollarında 94+ çağrılır)', () => {
    const s = arena(15, 94);
    const ev = hunterDefenseEvents(s, A(s), 'B', 'force');
    expect(ev.some((e) => e.type === 'reaction_used')).toBe(true);
    expect(ev.find((e) => e.type === 'effect_added')).toMatchObject({ effect: { resist: ['force'] } });
  });
});

describe('YZ (94): Nature\'s Veil ve Tireless', () => {
  it('canı düşükken önce Nature\'s Veil (bonus), bonus kullanılmışsa ve can üçte birin altındaysa Tireless; 93\'te yok', () => {
    const s0 = arena(14, 94);
    const low = { ...s0, combatants: { ...s0.combatants, A: { ...A(s0), hp: Math.floor(A(s0).maxHp / 4) } } } as BattleState;
    const foes = ['B', 'C', 'D'].map((id) => low.combatants[id] as Combatant);
    const ok = (c: Command) => execute(low, c, P1, () => 0.5).ok;
    expect(rangerChoice94(low, A(low), foes, true, ok)).toMatchObject({ feature: 'ranger:natures-veil' });
    const noBonus = { ...low, combatants: { ...low.combatants, A: { ...A(low), economy: { ...A(low).economy, bonus: true } } } } as BattleState;
    expect(rangerChoice94(noBonus, A(noBonus), foes, true, (c) => execute(noBonus, c, P1, () => 0.5).ok)).toMatchObject({ feature: 'ranger:tireless' });
    const old = arena(14, 93);
    expect(rangerChoice94(old, A(old), foes, true, () => true)).toBeNull();
  });
});
