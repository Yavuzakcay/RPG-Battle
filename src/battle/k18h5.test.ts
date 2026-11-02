/**
 * Kuyruk 18 H5: yapay zekâ hedef paketi anahtarları ve takviye sürerken parti çadır hedeflemesi.
 */
import { describe, it, expect } from 'vitest';
import { startBattle } from './create';
import { chooseCommand } from './ai';
import { mk, sword } from './fixtures';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
function camp(toggles?: Record<string, boolean>, surum?: number): BattleState {
  const a = mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, weaponOptions: [sword] } as Partial<Combatant>);
  const b = mk('B', { side: 'enemies', hp: 20, maxHp: 20 });
  const st = startBattle('k18h5', 'orman', [a, b], () => 0.5, { map: { id: 'orman-ork-kampi', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
  // A çadırın (7,4 → 0 tabanlı 6,3) bitişiğinde, B uzakta.
  const pos: Record<string, Offset> = { A: o(6, 4), B: o(25, 14) };
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
  return { ...st, status: 'active', order: ['A', 'B'], turnIndex: 0, combatants, ...(surum ? { kuralSurumu: surum } : {}) } as BattleState;
}

describe('K18 H5: parti çadır hedeflemesi', () => {
  it('takviye (hornReinforce) sürerken bitişikteki çadırı tutuşturur; anahtar kapalı ya da sürüm 14\'te dokunmaz', () => {
    const tent = (s: BattleState) => s.map?.objects?.find((x) => x.kind === 'tent' && x.at.col === 6 && x.at.row === 3);
    const s = camp();
    expect(tent(s)).toBeTruthy();
    expect(chooseCommand(s)).toMatchObject({ type: 'object_use', actorId: 'A', action: 'ignite' });
    for (const other of [camp({ aiTentTarget: false }), camp(undefined, 14)]) expect(['object_use', 'attack_object']).not.toContain(chooseCommand(other).type);
  });
});
