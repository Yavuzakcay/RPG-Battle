/**
 * Görev K9c: dikey hareket bayrağı (yeni yükseklik modeli yok). Fly, Levitate, Gaseous Form yükseklik farkı maliyetini
 * ve zemin engelini yok sayar; Spider Climb tırmanma maliyetini kaldırır; Jump turda bir 30 ft atlatır (10 ft harcar),
 * aradaki hendek ya da tek engel altıgeninin üstünden geçer.
 */
import { describe, expect, it } from 'vitest';
import { execute, replay, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command } from './index';
import { AXIAL_DIRECTIONS, axialToOffset, offsetToAxial, type Offset } from '../rules/hex';
import { moveCostFn } from './movement';
import { P1, mk, scripted } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });
/** (3,3)'ten doğu-güneydoğu doğrultusunda n. altıgen (odd-q'da düz hat). */
const line = (n: number): Offset => {
  const a = offsetToAxial(o(3, 3));
  const d = AXIAL_DIRECTIONS[0] as { q: number; r: number };
  return axialToOffset({ q: a.q + d.q * n, r: a.r + d.r * n });
};
function board(fill: string, patch: Array<[Offset, string]> = []): string[] {
  const rows = Array.from({ length: 7 }, () => fill.repeat(15).split(''));
  for (const [h, ch] of patch) (rows[h.row] as string[])[h.col] = ch;
  return rows.map((r) => r.join(''));
}
const SPELLS = ['Spider Climb', 'Fly', 'Levitate', 'Gaseous Form', 'Jump'];
function field(mapId: string, tiles: string[]): BattleState {
  const a = mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, strScore: 10, spellNames: SPELLS, spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0], spellSaveDc: 13, spellMod: 3 });
  const b = mk('B', { side: 'enemies', hp: 30, maxHp: 30 });
  const { state } = startBattle('k9c', 'd-z-zemin', [a, b], scripted([20, 20], [20, 19]), { map: { id: mapId } });
  const combatants = { ...state.combatants, A: { ...(state.combatants.A as Combatant), pos: o(3, 3) }, B: { ...(state.combatants.B as Combatant), pos: o(12, 3) } };
  return { ...state, status: 'active', order: ['A', 'B'], turnIndex: 0, combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles } };
}
function run(s: BattleState, cmd: Command): { state: BattleState; events: BattleEvent[] } {
  const r = execute(s, cmd, P1, scripted([1, 1], [1, 1]));
  if (!r.ok) throw new Error(r.error);
  return r;
}
const selfCast = (s: BattleState, spellName: string) => run(s, { type: 'cast_spell', actorId: 'A', spellName, targetIds: ['A'] }).state;
const errorOf = (r: ReturnType<typeof execute>) => (r.ok ? '' : r.error);

describe('yükseklik farkı (dag, tırmanma kuralı)', () => {
  const hill = board('.', [[o(4, 3), 'h']]);
  const climbCost = (s: BattleState) => moveCostFn(s, s.combatants.A as Combatant)(o(4, 3), o(3, 3));
  it('büyüsüz bir seviye çıkmak 2; Spider Climb, Fly, Levitate, Gaseous Form ile 1', () => {
    const s = field('dag', hill);
    expect(climbCost(s)).toBe(2);
    expect(run(s, { type: 'move', actorId: 'A', to: o(4, 3) }).events[0]).toMatchObject({ cost: 2 });
    for (const name of ['Spider Climb', 'Fly', 'Levitate', 'Gaseous Form']) expect(climbCost(selfCast(s, name)), name).toBe(1);
    const climber = selfCast(s, 'Spider Climb');
    expect(climber.combatants.A?.effects?.[0]).toMatchObject({ climb: true, concentration: expect.anything() });
    expect(run(climber, { type: 'move', actorId: 'A', to: o(4, 3) }).events[0]).toMatchObject({ cost: 1 });
  });
  it('Spider Climb zorlu zemini (zemin engeli) yok saymaz; uçan sayar', () => {
    const rough = field('dag', board('.', [[o(4, 3), 'r']]));
    const t = rough.map?.tiles[3]?.[4];
    expect(t).toBe('r');
    const c = (s: BattleState) => moveCostFn(s, s.combatants.A as Combatant)(o(4, 3), o(3, 3));
    expect(c(selfCast(rough, 'Spider Climb'))).toBe(c(rough));
    expect(c(selfCast(rough, 'Fly'))).toBe(1);
  });
  it('Levitate yürütmez (diğer SRD sınırı kalır)', () => {
    const s = selfCast(field('dag', hill), 'Levitate');
    expect(errorOf(execute(s, { type: 'move', actorId: 'A', to: o(4, 3) }, P1, scripted()))).toMatch(/hız|Hareket/);
  });
});

describe('Jump', () => {
  it('tek engel altıgeninin üstünden yalnızca büyüyle; 10 ft harcar; turda bir', () => {
    const s = field('col', board('.', [[line(1), 'c']]));
    expect(errorOf(execute(s, { type: 'jump', actorId: 'A', to: line(2) }, P1, scripted()))).toContain('atlanamaz');
    const j = selfCast(s, 'Jump');
    const r = run(j, { type: 'jump', actorId: 'A', to: line(2) });
    expect(r.events[0]).toMatchObject({ type: 'jumped', cost: 2 });
    expect(r.state.combatants.A?.movementUsed).toBe(2);
    expect(errorOf(execute(r.state, { type: 'jump', actorId: 'A', to: o(3, 3) }, P1, scripted()))).toContain('atlanamaz');
    expect(replay([{ type: 'battle_started', state: j }, ...r.events]).combatants.A?.traitTurns).toEqual(r.state.combatants.A?.traitTurns);
  });
  it('hendek (iki altıgen, 10 ft): STR 10 koşusuz menzil 5 ft yetmez; büyüyle 30 ft içinde', () => {
    const s = field('kale', board('.', [[line(1), 'n'], [line(2), 'n']]));
    expect(errorOf(execute(s, { type: 'jump', actorId: 'A', to: line(3) }, P1, scripted()))).toContain('Menzil');
    expect(run(selfCast(s, 'Jump'), { type: 'jump', actorId: 'A', to: line(3) }).events[0]).toMatchObject({ cost: 2, gap: 2 });
  });
  it('kısa atlamada büyü harcanmaz (yürüme maliyeti 2 zaten)', () => {
    const j = selfCast(field('col', board('.')), 'Jump');
    const r = run(j, { type: 'jump', actorId: 'A', to: line(2) });
    expect(r.events[0]).not.toHaveProperty('traitTurns');
  });
});
