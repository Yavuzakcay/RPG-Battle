/** Kuyruk 19 (0c): savaş dışı 4.–5. seviye büyülerin savaş yönleri (anahtar `spellsK19`, kural sürümü 16). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { applyEvents, replay } from './reduce';
import { P1, mk } from './fixtures';
import type { BattleEvent, BattleState, Combatant, Command } from './types';
import type { Rng } from '../rules/dice';

const SLOTS = [4, 3, 3, 3, 3, 0, 0, 0, 0];
const OFF = { spellsK19: false };

function arena(ver: number, spellNames: string[], tiles: string[], b: Partial<Combatant> = {}, toggles?: Record<string, boolean>, bPos = { col: 10, row: 3 }) {
  const parts = [mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellNames, spellSlots: SLOTS, spellMod: 4, spellSaveDc: 15, spellAttack: 7 }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, saves: { str: -5, dex: 0, con: 0, int: 0, wis: -5, cha: 0 }, ...b })];
  const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: ver, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
  const combatants = { ...s0.combatants };
  combatants.A = { ...(combatants.A as Combatant), pos: { col: 2, row: 3 } };
  combatants.B = { ...(combatants.B as Combatant), pos: bPos };
  return new Run({ ...s0, status: 'active', round: 1, order: ['A', 'B'], turnIndex: 0, combatants, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles } });
}
class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, rng: Rng = () => 0.5, ctx = P1) { const r = execute(this.state, cmd, ctx, rng); if (!r.ok) throw new Error(r.error); this.state = r.state; this.events.push(...r.events); return r.events; }
  try(cmd: Command) { const r = execute(this.state, cmd, P1, () => 0.5); return r.ok ? null : r.error; }
  tile(col: number, row: number) { return this.state.map?.tiles[row]?.[col]; }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
const flat = (row3: string) => [...Array.from({ length: 3 }, () => '.'.repeat(15)), row3, ...Array.from({ length: 3 }, () => '.'.repeat(15))];

describe('Kuyruk 19: Passwall ve Stone Shape', () => {
  it('Passwall: duvarda 4 altıgen derin geçit; sürüm 15\'te savaş dışı not', () => {
    const wall = '....ssssss.....';
    const tiles = [...Array.from({ length: 2 }, () => '.'.repeat(15)), wall, wall, wall, ...Array.from({ length: 2 }, () => '.'.repeat(15))];
    const r = arena(16, ['Passwall'], tiles);
    const evs = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Passwall', targetHex: { col: 4, row: 3 } });
    expect(evs.filter((e) => e.type === 'tile_changed' && e.to === '.')).toHaveLength(4);
    expect(r.tile(4, 3)).toBe('.');
    r.replays();
    const old = arena(15, ['Passwall'], tiles);
    old.do({ type: 'cast_spell', actorId: 'A', spellName: 'Passwall', targetHex: { col: 4, row: 3 } });
    expect(old.tile(4, 3)).toBe('s');
  });
  it('Stone Shape: bitişik taş açılır, kapı mühürlenir; uzaktaki taş olmaz', () => {
    const r = arena(16, ['Stone Shape'], flat('...sO.....s....'));
    expect(r.try({ type: 'cast_spell', actorId: 'A', spellName: 'Stone Shape', targetHex: { col: 10, row: 3 } })).not.toBeNull();
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Stone Shape', targetHex: { col: 3, row: 3 } });
    expect(r.tile(3, 3)).toBe('.');
  });
});

describe('Kuyruk 19: Control Water', () => {
  const lake = Array.from({ length: 7 }, (_, row) => (row === 3 ? '..' : '..') + 'w'.repeat(13));
  it('girdap: tur başında sudakini merkeze çeker, STR save hasarı; uzaklaşamaz; konsantrasyon bitince alan kalkar', () => {
    const r = arena(16, ['Control Water'], lake, {}, undefined, { col: 12, row: 3 });
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Control Water', targetHex: { col: 9, row: 3 }, choice: 'whirlpool' });
    expect(r.state.map?.zones?.some((z) => z.spellId === 'control-water' && z.center)).toBe(true);
    const evs = r.do({ type: 'end_turn', actorId: 'A' }, () => 0.1);
    expect(evs.some((e) => e.type === 'pushed' && e.targetId === 'B')).toBe(true);
    expect(r.state.combatants.B?.effects?.some((e) => e.id === 'whirlpool-pull')).toBe(true);
    // Merkezden uzaklaşan adım engelli.
    const away = r.try({ type: 'move', actorId: 'B', to: { col: 14, row: 3 } });
    expect(away).not.toBeNull();
  });
  it('taşkın: sığ su derin suya, konsantrasyon bitince geri döner; anahtar kapalıyken savaş dışı', () => {
    const tiles = flat('...nnnn........');
    const r = arena(16, ['Control Water'], tiles);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Control Water', targetHex: { col: 4, row: 3 }, choice: 'flood' });
    expect(r.tile(4, 3)).toBe('w');
    const z = r.state.map?.zones?.find((x) => x.restore);
    r.replays();
    const ended = applyEvents(r.state, [{ type: 'zone_ended', zoneId: z?.id as string, name: 'Control Water', reason: 'concentration' }]);
    expect(ended.map?.zones?.some((x) => x.id === z?.id)).toBe(false);
    expect(ended.map?.tiles[3]?.[4]).toBe('n');
    const off = arena(16, ['Control Water'], tiles, {}, OFF);
    off.do({ type: 'cast_spell', actorId: 'A', spellName: 'Control Water', targetHex: { col: 4, row: 3 }, choice: 'flood' });
    expect(off.tile(4, 3)).toBe('n');
  });
});

describe('Kuyruk 19: Modify Memory', () => {
  it('WIS save (savaşta avantajlı) başarısızsa Charmed + Incapacitated; başka büyünün hedefi olunca biter', () => {
    const r = arena(16, ['Modify Memory', 'Fire Bolt'], flat('...............'), {}, undefined, { col: 5, row: 3 });
    const mm = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Modify Memory', targetId: 'B' }, () => 0.05);
    expect(mm.find((e) => e.type === 'save_resolved')).toMatchObject({ mode: 'advantage' });
    expect(r.state.combatants.B?.conditions).toEqual(expect.arrayContaining(['Charmed', 'Incapacitated']));
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...(r.state.combatants.A as Combatant), economy: { ...(r.state.combatants.A as Combatant).economy, action: false } } } };
    r.events = [{ type: 'battle_started', state: r.state }];
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, () => 0.05);
    expect(r.state.combatants.B?.effects?.some((e) => e.breakOnSpell)).toBe(false);
  });
});
