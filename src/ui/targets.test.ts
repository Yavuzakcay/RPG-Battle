/** Görev U: ölü ya da kaldırılmış birim hedef listesinde ve vurgulamada yok; baygın karakter hedef olabilir. */
import { describe, it, expect } from 'vitest';
import { startBattle } from '../battle/create';
import { mk, scripted, sword } from '../battle/fixtures';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant } from '../battle/types';
import { attackTargets } from './hud';
import { attackChoices } from './mapView';

const o = (col: number, row: number): Offset => ({ col, row });
const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
/** A (oyuncu) ve B (düşman) A'nın yanında, C (düşman) de bitişik; P (oyuncu) A'nın öbür yanında. */
function arena(patch: Record<string, Partial<Combatant>> = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', weaponOptions: [sword], initiativeBonus: 10 }),
    mk('B', { side: 'enemies', weaponOptions: [sword] }),
    mk('C', { side: 'enemies' }),
    mk('P', { ownerId: 'p2' }),
  ];
  const s = startBattle('t', 'd-z-zemin', parts, scripted([20, 20], [20, 10], [20, 9], [20, 8]), { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(5, 3), B: o(6, 3), C: o(6, 4), P: o(4, 3) };
  const combatants = Object.fromEntries(Object.entries(s.combatants).map(([id, c]) => [id, { ...c, pos: pos[id] ?? null, ...patch[id] }])) as Record<string, Combatant>;
  return { ...s, status: 'active', turnIndex: s.order.indexOf('A'), combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: flat } };
}

describe('hedef listesi', () => {
  it('ayaktaki bitişik düşmanlar hedef', () => {
    expect(attackTargets(arena(), 'A').sort()).toEqual(['B', 'C']);
  });
  it('0 HP canavar (altıgende kalsa da) hedef değil, seçenek yok', () => {
    const s = arena({ B: { hp: 0 } });
    expect(attackTargets(s, 'A')).toEqual(['C']);
    expect(attackChoices(s, 'A', 'B')).toEqual([]);
  });
  it('ölü karakter hedef değil; ölmekte ya da stabil (baygın) karakter hedef olabilir', () => {
    const turnB = (s: BattleState) => ({ ...s, turnIndex: s.order.indexOf('B') });
    expect(attackTargets(turnB(arena({ A: { hp: 0, life: 'dead' } })), 'B')).not.toContain('A');
    expect(attackTargets(turnB(arena({ A: { hp: 0, life: 'dying', conditions: ['Unconscious'] } })), 'B')).toContain('A');
    expect(attackTargets(turnB(arena({ A: { hp: 0, life: 'stable', conditions: ['Unconscious'] } })), 'B')).toContain('A');
  });
  it('kaybolan çağrılmış yaratık hedef değil', () => {
    const s = arena({ C: { summon: { by: 'X', spell: 'Summon Dragon', level: 5, gone: true } as unknown as Combatant['summon'] } });
    expect(attackTargets(s, 'A')).toEqual(['B']);
  });
});
