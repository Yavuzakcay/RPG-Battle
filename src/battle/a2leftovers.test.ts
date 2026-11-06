/**
 * Kuyruk A2 G4: A1'den kalanlar. Eyebite (SRD 5.2.1): Asleep hasarla biter, Panicked her turunun başında büyücüden
 * uzaklaşmak için Dash yapar (kural sürümü 30; 29'da eski davranış). Yapay zekâ "Nesne fırlat" açıklayıcısı (Kolay'da yok).
 */
import { describe, expect, it } from 'vitest';
import { execute, replay, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command } from './index';
import type { Offset } from '../rules/hex';
import { distance } from '../rules/hex';
import { applyEvents } from './reduce';
import { damageEffect } from './maprules';
import { makeObject } from './objects';
import { P1, mk, scripted } from './fixtures';
import { actionDescriptors, type AiHelpers } from './ai/actions';
import './ai';

const o = (col: number, row: number): Offset => ({ col, row });
const mid = () => 0.5;
const board = () => Array.from({ length: 9 }, () => '.'.repeat(15));
function field(parts: Combatant[], positions: Record<string, Offset>, version?: number): BattleState {
  const { state } = startBattle('a2', 'd-z-zemin', parts.map((c) => ({ ...c, initiativeBonus: 0 })), scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map: { id: 'kale' } });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  const map = { ...(state.map as NonNullable<BattleState['map']>), tiles: board(), objects: [], zones: [] };
  return { ...state, status: 'active', order: Object.keys(combatants), turnIndex: 0, combatants, map, ...(version ? { kuralSurumu: version } : {}) };
}
const caster = () => mk('A', { ownerId: 'p1', hp: 80, maxHp: 80, level: 20, spellAttack: 9, spellSaveDc: 17, spellMod: 5, proficiency: 6,
  spellSlots: [4, 4, 4, 4, 4, 4, 4, 4, 4], spellNames: ['Eyebite'] });
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 60, maxHp: 60, speed: 30, saves: { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 }, ...p });
const ok = (s: BattleState, cmd: Command, rng = mid, ctx = P1) => { const r = execute(s, cmd, ctx, rng); if (!r.ok) throw new Error(r.error); return r; };
const eyebite = (s: BattleState, choice: string) => ok(s, { type: 'cast_spell', actorId: 'A', spellName: 'Eyebite', targetId: 'B', slotLevel: 6, choice });

describe('Eyebite (SRD 5.2.1, sürüm 30)', () => {
  it('Asleep: Unconscious; hasar alınca biter (sürüm 29: hasarla bitmez)', () => {
    const s = field([caster(), foe('B')], { A: o(1, 4), B: o(5, 4) });
    const r = eyebite(s, 'Unconscious');
    expect(r.state.combatants.B!.conditions).toContain('Unconscious');
    expect(r.state.combatants.B!.effects?.find((e) => e.breakOnDamage)).toMatchObject({ grants: ['Unconscious'], concentration: 'Eyebite' });
    const hurt = applyEvents(r.state, [damageEffect(r.state.combatants.B!, 'test', 'darbe', { dice: '3', type: 'slashing' }, mid)]);
    expect(hurt.combatants.B!.conditions).not.toContain('Unconscious');
    const old = eyebite(field([caster(), foe('B')], { A: o(1, 4), B: o(5, 4) }, 29), 'Unconscious');
    const oldHurt = applyEvents(old.state, [damageEffect(old.state.combatants.B!, 'test', 'darbe', { dice: '3', type: 'slashing' }, mid)]);
    expect(oldHurt.combatants.B!.conditions).toContain('Unconscious');
  });
  it('Panicked: Frightened; kendi turunun başında Dash ile büyücüden uzaklaşır; replay aynı', () => {
    const s = field([caster(), foe('B')], { A: o(1, 4), B: o(5, 4) });
    const r = eyebite(s, 'Frightened');
    expect(r.state.combatants.B!.effects?.find((e) => e.command === 'flee')).toMatchObject({ fleeDash: true, commandPersist: true, grants: ['Frightened'] });
    const r2 = ok(r.state, { type: 'end_turn', actorId: 'A' });
    const evs: BattleEvent[] = [{ type: 'battle_started', state: s }, ...r.events, ...r2.events];
    expect(distance(r2.state.combatants.B!.pos!, o(1, 4))).toBeGreaterThan(distance(o(5, 4), o(1, 4)));
    expect(r2.events.some((e) => e.type === 'dashed' && e.actorId === 'B')).toBe(true);
    expect(replay(evs)).toEqual(r2.state);
  });
  it('sürüm 29: Panicked yalnızca Frightened (kaçış yok)', () => {
    const r = eyebite(field([caster(), foe('B')], { A: o(1, 4), B: o(5, 4) }, 29), 'Frightened');
    expect(r.state.combatants.B!.effects?.some((e) => e.command === 'flee') ?? false).toBe(false);
  });
});

describe('YZ: Nesne fırlat', () => {
  const desc = () => actionDescriptors().find((d) => d.id === 'a2:firlat')!;
  const helpers = (foes: Combatant[]): AiHelpers => ({ foes, allies: [], ok: () => true, threat: () => 0, risk: () => 0, priorityKeys: () => [], canAct: true });
  const scene = (zorluk?: 'kolay' | 'normal') => {
    const s0 = field([foe('E'), mk('P', { ownerId: 'p1', hp: 30, maxHp: 30 })], { E: o(4, 4), P: o(7, 4) });
    const rock = makeObject(s0, 'rock', o(4, 3));
    return { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), objects: [rock] }, ...(zorluk ? { yz: { zorluk: { enemies: zorluk } } } : {}) } as BattleState;
  };
  it('Normal: bitişikteki hafif nesneyi menzildeki düşmana fırlatma adayı; komut geçerli', () => {
    const s = scene('normal');
    const cmds = desc().gen(s, s.combatants.E!, helpers([s.combatants.P!])).filter(Boolean) as Command[];
    expect(cmds).toHaveLength(1);
    expect(cmds[0]).toMatchObject({ type: 'object_use', action: 'throw', to: o(7, 4) });
    expect(execute(s, cmds[0]!, { playerId: 'gm', isGm: true }, mid).ok).toBe(true);
  });
  it('Kolay: aday yok; nesne yoksa aday yok', () => {
    const s = scene('kolay');
    expect(desc().gen(s, s.combatants.E!, helpers([s.combatants.P!]))).toHaveLength(0);
    const n = field([foe('E'), mk('P', { ownerId: 'p1' })], { E: o(4, 4), P: o(7, 4) });
    expect(desc().gen(n, n.combatants.E!, helpers([n.combatants.P!]))).toHaveLength(0);
  });
});
