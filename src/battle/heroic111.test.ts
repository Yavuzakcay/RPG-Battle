/**
 * Görev HEROIC-INSPIRATION-TAM (kural sürümü 111; SRD 5.2.1 s. 7): hakkı olan her oyuncu karakteri kullanır, Game Master savaşta
 * verir (en çok bir; aktarma/kaybolma), savaş sonucu kâğıda yazılır. 110 ve altı aynen.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { combatantFromSheet, setDefaultRuleVersion, startBattle } from './create';
import { execute } from './commands';
import { replay } from './reduce';
import { CURRENT_RULES } from './ruleVersion';
import { HEROIC111_VERSION } from './heroic111Surum';
import { GM, P1, mk, scripted } from './fixtures';
import { applyBattleResult, withStatus } from '../app/partyStatus';
import { fullStatus } from '../rules/characterRest';
import { withHeroic } from '../rules/heroicInspiration';
import { blankCharacter, suggestedScores, type SavedCharacter } from '../rules/builder';
import type { CharacterSheet } from '../rules/stats';
import type { BattleState, Combatant } from './types';

const NEW = HEROIC111_VERSION;
const OLD = HEROIC111_VERSION - 1;
afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

const sheet = (raceId: string): CharacterSheet => ({ ...blankCharacter('hi').sheet, name: raceId, raceId, classId: 'fighter', level: 3, baseScores: suggestedScores('fighter'), weapons: [{ name: 'Longsword' }] });
const saved = (id: string, raceId: string, heroic: boolean): SavedCharacter => {
  const st = fullStatus(sheet(raceId));
  return { ...blankCharacter(id), id, sheet: sheet(raceId), status: heroic ? withHeroic(st) : { ...st, resources: { ...st.resources, heroicInspiration: 0 } } };
};
const pc = (ch: SavedCharacter, id: string): Combatant => withStatus(combatantFromSheet(ch.sheet, { id, ownerId: ch.id }), ch);

/** A ve B parti (A sırada, B'ye bitişik değil), T düşman A'ya bitişik. */
function arena(v: number, a: Combatant, b: Combatant): { state: BattleState; start: BattleState } {
  const r = startBattle('hi', 'd', [a, b, mk('T', { side: 'enemies', hp: 40, maxHp: 40 })], () => 0.5, { kuralSurumu: v, map: { id: 'col' } } as never);
  const s0 = r.state;
  const state = { ...s0, kuralSurumu: v, status: 'active' as const, turnIndex: s0.order.indexOf('A'), map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) },
    combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), pos: { col: 3, row: 3 } }, B: { ...(s0.combatants.B as Combatant), pos: { col: 8, row: 3 } }, T: { ...(s0.combatants.T as Combatant), pos: { col: 4, row: 3 } } } };
  return { state, start: s0 };
}
const swing = { label: 'Kılıç', attackBonus: 3, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'x' };
const elfA = saved('c1', 'elf', true);
const dwarfB = saved('c2', 'dwarf', false);

describe('HEROIC-INSPIRATION-TAM: savaşta kullanım', () => {
  it('111: Elf\'in kâğıttaki hakkı savaşa gelir ve başarısız d20\'yi bir kez yeniden attırır', () => {
    const { state } = arena(NEW, pc(elfA, 'A'), pc(dwarfB, 'B'));
    expect(state.combatants.A?.hi111).toBe(true);
    expect(state.combatants.A?.resources.heroicInspiration).toBe(1);
    expect(state.combatants.T?.hi111).toBeUndefined();
    const r = execute(state, { type: 'attack', actorId: 'A', targetId: 'T', option: swing }, { playerId: 'c1', isGm: false }, scripted([20, 2], [20, 19], [8, 4]));
    if (!r.ok) throw new Error(r.error);
    expect(r.state.combatants.A?.resources.heroicInspiration).toBe(0);
  });
  it('110: işaretsiz (Human/Champion değil) savaşçı hakkı kullanmaz (eski davranış)', () => {
    const { state } = arena(OLD, pc(elfA, 'A'), pc(dwarfB, 'B'));
    expect(state.combatants.A?.hi111).toBeUndefined();
    const r = execute(state, { type: 'attack', actorId: 'A', targetId: 'T', option: swing }, { playerId: 'c1', isGm: false }, scripted([20, 2], [8, 4]));
    if (!r.ok) throw new Error(r.error);
    expect(r.state.combatants.A?.resources.heroicInspiration).toBe(1);
  });
});

describe('HEROIC-INSPIRATION-TAM: Game Master verir (grant_inspiration)', () => {
  it('yalnız Game Master, yalnız 111+', () => {
    const { state } = arena(NEW, pc(dwarfB, 'A'), pc(elfA, 'B'));
    expect(execute(state, { type: 'grant_inspiration', targetId: 'A' }, P1, () => 0.5).ok).toBe(false);
    const old = arena(OLD, pc(dwarfB, 'A'), pc(elfA, 'B')).state;
    expect(execute(old, { type: 'grant_inspiration', targetId: 'A' }, GM, () => 0.5).ok).toBe(false);
    expect(execute(state, { type: 'grant_inspiration', targetId: 'T' }, GM, () => 0.5).ok).toBe(false);
  });
  it('hakkı olmayana verilir; varken aktarılmazsa kaybolur, hakkı olmayan dosta aktarılır, hakkı olana aktarılmaz; replay aynı', () => {
    const { state, start } = arena(NEW, pc(dwarfB, 'A'), pc(elfA, 'B'));
    const g1 = execute(state, { type: 'grant_inspiration', targetId: 'A' }, GM, () => 0.5);
    if (!g1.ok) throw new Error(g1.error);
    expect(g1.state.combatants.A?.resources.heroicInspiration).toBe(1);
    const lost = execute(g1.state, { type: 'grant_inspiration', targetId: 'A' }, GM, () => 0.5);
    expect(lost.ok && lost.events.some((e) => e.type === 'inspiration_granted' && e.lost)).toBe(true);
    // B'nin hakkı var: aktarılamaz.
    expect(execute(g1.state, { type: 'grant_inspiration', targetId: 'A', passToId: 'B' }, GM, () => 0.5).ok).toBe(false);
    const spentB = { ...g1.state, combatants: { ...g1.state.combatants, B: { ...(g1.state.combatants.B as Combatant), resources: { ...(g1.state.combatants.B as Combatant).resources, heroicInspiration: 0 } } } };
    const passed = execute(spentB, { type: 'grant_inspiration', targetId: 'A', passToId: 'B' }, GM, () => 0.5);
    if (!passed.ok) throw new Error(passed.error);
    expect(passed.state.combatants.B?.resources.heroicInspiration).toBe(1);
    // Düşmana aktarılmaz.
    expect(execute(spentB, { type: 'grant_inspiration', targetId: 'A', passToId: 'T' }, GM, () => 0.5).ok).toBe(false);
    const evs = [{ type: 'battle_started' as const, state: start }, ...g1.events];
    expect(replay(evs).combatants.A?.resources.heroicInspiration).toBe(1);
  });
  it('savaş sonu: verilen hak kâğıda yazılır, harcanan düşer (Human olmayan da)', () => {
    const { state } = arena(NEW, pc(dwarfB, 'A'), pc(elfA, 'B'));
    const g = execute(state, { type: 'grant_inspiration', targetId: 'A' }, GM, () => 0.5);
    if (!g.ok) throw new Error(g.error);
    const fin: BattleState = { ...g.state, status: 'finished', combatants: { ...g.state.combatants,
      A: { ...(g.state.combatants.A as Combatant), ownerId: 'c2' }, B: { ...(g.state.combatants.B as Combatant), ownerId: 'c1', resources: { ...(g.state.combatants.B as Combatant).resources, heroicInspiration: 0 } } } };
    const [b, a] = applyBattleResult([elfA, dwarfB], fin);
    expect(a?.status?.resources.heroicInspiration).toBe(1);
    expect(b?.status?.resources.heroicInspiration ?? 0).toBe(0);
  });
});
