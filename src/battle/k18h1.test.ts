/**
 * Kuyruk 18 H1: taraf değiştirme (Dominate Person/Beast). Yönetilen yaratık büyücünün tarafına ve sahibine geçer,
 * etki bitince geri döner; zafer sayımı ve ölüm asıl tarafla; Game Master anahtarı kapalıyken yalnızca Charmed;
 * eski kural sürümünde (13) taraf değişmez. Replay aynı.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { applyEvents, replay } from './reduce';
import { P1, mk } from './fixtures';
import { winnerOf } from './common';
import { homeSide } from './allegiance';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const low: Rng = () => 0.01;
const SLOTS = [4, 3, 3, 3, 2, 0, 0, 0, 0];
function arena(opt: { v?: number; toggles?: Record<string, boolean>; type?: string } = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, spellSaveDc: 30, spellAttack: 9, spellMod: 5, spellSlots: SLOTS, spellNames: ['Dominate Person', 'Dominate Beast'] }),
    mk('B', { side: 'enemies', hp: 50, maxHp: 50, creatureType: opt.type ?? 'humanoid' }),
    mk('E', { side: 'enemies', hp: 30, maxHp: 30 }),
  ];
  const st = startBattle('k18', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col', ...(opt.toggles ? { ruleToggles: opt.toggles } : {}) }, ...(opt.v ? { kuralSurumu: opt.v } : {}) }).state;
  const pos: Record<string, Offset> = { A: o(2, 3), B: o(5, 3), E: o(9, 3) };
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
  return { ...st, status: 'active', order: ['A', 'B', 'E'], turnIndex: 0, combatants } as BattleState;
}
const cast = (s: BattleState, name = 'Dominate Person') => {
  const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: name, targetId: 'B' } as Command, P1, low);
  if (!r.ok) throw new Error(r.error);
  return r;
};
const B = (s: BattleState) => s.combatants.B as Combatant;

describe('K18 H1: taraf değiştirme', () => {
  it('Dominate Person: hedef büyücünün tarafına ve oyuncusuna geçer; asıl taraf saklanır; replay aynı', () => {
    const s0 = arena();
    const r = cast(s0);
    expect(B(r.state).side).toBe('party');
    expect(B(r.state).ownerId).toBe('p1');
    expect(homeSide(B(r.state))).toBe('enemies');
    expect(B(r.state).conditions).toContain('Charmed');
    expect(replay([{ type: 'battle_started', state: s0 }, ...r.events] as BattleEvent[])).toEqual(r.state);
  });
  it('etki bitince (hasarla yeniden save başarısı ya da konsantrasyon) asıl tarafa döner', () => {
    const r = cast(arena());
    const effectId = B(r.state).effects?.find((e) => e.dominate)?.id as string;
    const ended = applyEvents(r.state, [{ type: 'effect_ended', targetId: 'B', effectId, name: 'Dominate Person', reason: 'save' } as BattleEvent]);
    expect(B(ended).side).toBe('enemies');
    expect(B(ended).ownerId).toBe(B(arena()).ownerId);
    expect(B(ended).allegiance).toBeUndefined();
    // Konsantrasyon bozulunca (büyücünün konsantrasyonu yok) bir sonraki olayda etki ve taraf geri döner.
    const lost = { ...r.state, combatants: { ...r.state.combatants, A: { ...(r.state.combatants.A as Combatant), concentration: null } } };
    const back = applyEvents(lost, [{ type: 'map_note', text: 'test' }]);
    expect(B(back).side).toBe('enemies');
    expect(B(back).conditions).not.toContain('Charmed');
  });
  it('zafer asıl tarafla: tek gerçek düşman düşse de yönetilen düşman ayaktayken parti kazanmaz', () => {
    const r = cast(arena());
    const s = { ...r.state, combatants: { ...r.state.combatants, E: { ...(r.state.combatants.E as Combatant), hp: 0, life: 'dead' as const } } };
    expect(winnerOf(s)).toBeNull();
  });
  it('Dominate Beast yalnızca Beast; humanoid hedef reddedilir', () => {
    expect(() => cast(arena(), 'Dominate Beast')).toThrow(/beast/);
    expect(B(cast(arena({ type: 'beast' }), 'Dominate Beast').state).side).toBe('party');
  });
  it('Game Master anahtarı kapalı: yalnızca Charmed (taraf aynı); eski sürüm (13): taraf aynı', () => {
    const off = cast(arena({ toggles: { allegianceSwap: false } }));
    expect(B(off.state).side).toBe('enemies');
    expect(B(off.state).conditions).toContain('Charmed');
    expect(B(cast(arena({ v: 13 })).state).side).toBe('enemies');
  });
});

describe('K18 H1: yapay zekâ ve simülasyon', () => {
  it('yapay zekâ iki düşmanda en güçlü humanoid\'i yönetir; yönetilen yaratığın turu parti tarafında oynanır, çökme yok', async () => {
    const { chooseCommand } = await import('./ai');
    const s0 = arena();
    const cmd = chooseCommand(s0);
    expect(cmd).toMatchObject({ type: 'cast_spell', spellName: 'Dominate Person', targetId: 'B' });
    const r = execute(s0, cmd, P1, low);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const st = { ...r.state, turnIndex: 1 };
    const bcmd = chooseCommand(st);
    expect((bcmd as { actorId: string }).actorId).toBe('B');
    if (bcmd.type === 'monster_attack') expect((bcmd as { targetId: string }).targetId).toBe('E');
  });
});
