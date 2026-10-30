/**
 * Görev A4: tasma (hareket sınırı). Genel etki: merkez yaratık, yarıçap (altıgen), süre. Özellik türü `leash`
 * (dış içerikteki Biat Yemini gibi): WIS save başarısızsa hedef kullanandan 30 ft (6 altıgen) uzağa gidemez; yürüme,
 * atlama ve yapay zekâ bunu sayar; merkez ölünce kalkar.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { chooseCommand } from './ai';
import { replay } from './reduce';
import { leashOf } from './leash';
import { GM, P1, mk } from './fixtures';
import { distance, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, UsableFeature } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const FEALTY: UsableFeature = { key: 'test:biat', name: 'Biat (deneme)', type: 'action', effect: { kind: 'leash', rangeFt: 30, radiusFt: 30, save: 'wis', rounds: 10 } };
const LOW = { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 };
const claw = { name: 'Claw', bonus: 4, damageDice: '1d6+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };

function arena(bPos = o(5, 3), bOver: Partial<Combatant> = {}) {
  const parts = [
    mk('P', { ownerId: 'p1', spellSaveDc: 13, features: [FEALTY] }),
    mk('B', { side: 'enemies', hp: 40, maxHp: 40, speed: 40, saves: LOW, attacks: [claw], ...bOver }),
    mk('C', { ownerId: 'p1', hp: 30, maxHp: 30 }),
  ];
  const started = startBattle('a4', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } });
  const combatants = { ...started.state.combatants };
  const pos: Record<string, Offset> = { P: o(3, 3), B: bPos, C: o(13, 3) };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const tiles = Array.from({ length: 7 }, () => '.'.repeat(15));
  return { ...started.state, status: 'active', order: ['P', 'B', 'C'], turnIndex: 0, combatants,
    map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles } } as BattleState;
}
const leashed = (rng: Rng = () => 0.01) => {
  const s = arena();
  const r = execute(s, { type: 'use_feature', actorId: 'P', feature: FEALTY.key, targetId: 'B' }, P1, rng);
  if (!r.ok) throw new Error(r.error);
  const e = execute(r.state, { type: 'end_turn', actorId: 'P' }, P1, () => 0.5);
  if (!e.ok) throw new Error(e.error);
  return { state: e.state, events: [{ type: 'battle_started', state: s } as BattleEvent, ...r.events, ...e.events] };
};

describe('tasma (hareket sınırı)', () => {
  it('WIS save başarısız: tasma etkisi (merkez kullanan, 6 altıgen); başarılıysa yok', () => {
    const { state } = leashed();
    expect(state.combatants.B!.effects?.find((e) => e.leash)?.leash).toEqual({ centerId: 'P', radius: 6 });
    expect(leashOf(state, state.combatants.B!)).toEqual({ center: o(3, 3), radius: 6 });
    const ok = execute(arena(), { type: 'use_feature', actorId: 'P', feature: FEALTY.key, targetId: 'B' }, P1, () => 0.99);
    expect(ok.ok && !!ok.state.combatants.B!.effects?.some((e) => e.leash)).toBe(false);
  });
  it('hareket doğrulaması: 30 ft dışına yürünmez, içinde serbest; dışarıdan yalnızca yaklaşır', () => {
    const { state } = leashed();
    expect(execute(state, { type: 'move', actorId: 'B', to: o(10, 3) }, GM, () => 0.5).ok).toBe(false);
    expect(execute(state, { type: 'move', actorId: 'B', to: o(9, 3) }, GM, () => 0.5).ok).toBe(true);
    // Merkez uzaklaşmış: B dışarıda kalır, uzaklaşamaz ama yaklaşabilir.
    const far = { ...state, combatants: { ...state.combatants, B: { ...state.combatants.B!, pos: o(11, 3) } } };
    expect(execute(far, { type: 'move', actorId: 'B', to: o(12, 3) }, GM, () => 0.5).ok).toBe(false);
    expect(execute(far, { type: 'move', actorId: 'B', to: o(10, 3) }, GM, () => 0.5).ok).toBe(true);
  });
  it('yapay zekâ: sınırın dışındaki hedefe gitmez, sınırın içinde kalır', () => {
    // P (merkez) yere düşmüş: B için tek hedef 10 altıgen ötedeki C; tasma yine sürer (merkez ölmedi).
    const l = leashed().state;
    const state: BattleState = { ...l, combatants: { ...l.combatants, P: { ...l.combatants.P!, hp: 0, life: 'dying' as const, conditions: ['Unconscious'] } } };
    const cmd = chooseCommand(state);
    const r = execute(state, cmd, GM, () => 0.5);
    expect(r.ok).toBe(true);
    if (r.ok) expect(distance(r.state.combatants.B!.pos as Offset, o(3, 3))).toBeLessThanOrEqual(6);
  });
  it('merkez ölünce tasma kalkar; yeniden oynatma aynı', () => {
    const { state, events } = leashed();
    expect(replay(events)).toEqual(state);
    const dead: BattleState = { ...state, combatants: { ...state.combatants, P: { ...state.combatants.P!, hp: 0, life: 'dead' as const } } };
    expect(leashOf(dead, dead.combatants.B!)).toBeNull();
  });
});
