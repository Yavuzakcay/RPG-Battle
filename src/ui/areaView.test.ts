/** Alan önizlemesi (Görev R4): etkilenecek dost/düşman, yön okları, alan eylemleri listesi, kayıt sürümü. */
import { describe, it, expect } from 'vitest';
import { startBattle, combatantFromMonster } from '../battle/create';
import { mk, scripted } from '../battle/fixtures';
import { getMonster } from '../data';
import { distance, sameHex, type Offset } from '../rules/hex';
import type { BattleState, Combatant } from '../battle/types';
import { areaActCommand, areaActPreview, areaAttacksOf, directionAims } from './hud';
import { attackChoices } from './mapView';
import { LOADABLE_VERSIONS, SAVE_VERSION, restoreSession } from '../app/battleSave';

const o = (col: number, row: number): Offset => ({ col, row });
const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
function arena(): BattleState {
  const d = { ...combatantFromMonster(getMonster('young-red-dragon'), { id: 'D' }), initiativeBonus: 30 };
  const parts = [d, mk('A', { ownerId: 'p1', hp: 99, maxHp: 99 }), mk('W', { side: 'enemies', hp: 30, maxHp: 30 })];
  const s = startBattle('a', 'd-z-zemin', parts, scripted([20, 20], [20, 5], [20, 4]), { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { D: o(2, 3), A: o(5, 3), W: o(3, 3) };
  const combatants = Object.fromEntries(Object.entries(s.combatants).map(([id, c]) => [id, { ...c, pos: pos[id] ?? null }])) as Record<string, Combatant>;
  return { ...s, status: 'active', turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: flat } };
}

describe('alan önizlemesi', () => {
  it('nefes: alandaki düşman ve dost ayrı; komut motorla aynı', () => {
    const s = arena();
    const d = s.combatants.D as Combatant;
    expect(areaAttacksOf(d)).toEqual([{ index: 1, name: 'Fire Breath', ready: true }]);
    const p = areaActPreview(s, d, { kind: 'monster', index: 1 }, o(8, 3));
    expect(p.error).toBeNull();
    expect(p.foes.map((c) => c.id)).toEqual(['A']);
    expect(p.friends.map((c) => c.id)).toEqual(['W']);
    expect(p.hexes.length).toBeGreaterThanOrEqual(17);
    expect(areaActCommand('D', { kind: 'monster', index: 1 }, o(8, 3))).toEqual({ type: 'monster_attack', actorId: 'D', targetId: '', attackIndex: 1, targetHex: o(8, 3) });
    // Haritada alanlı saldırı hedef seçeneklerinde yok (önizlemeli menüden yapılır).
    expect(attackChoices(s, 'D', 'A').map((c) => c.label)).not.toContain('Fire Breath');
  });
  it('yön okları: altı farklı yön, alanın boyu kadar ötede; harita dışındaki nişan da yön verir', () => {
    const aims = directionAims(o(2, 3), 30);
    expect(aims).toHaveLength(6);
    for (const { aim } of aims) expect(distance(o(2, 3), aim)).toBe(6);
    expect(new Set(aims.map(({ aim }) => `${aim.col},${aim.row}`)).size).toBe(6);
    const s = arena();
    const left = aims.find(({ dir }) => dir === 5)?.aim as Offset; // sol yukarı: haritanın dışına taşar
    const p = areaActPreview(s, s.combatants.D as Combatant, { kind: 'monster', index: 1 }, left);
    expect(p.error).toBeNull();
    expect(p.hexes.every((h) => !sameHex(h, o(2, 3)))).toBe(true);
  });
  it('kayıt sürümü 17 (Görev E1); eski (15) kayıt yüklenir', () => {
    expect(SAVE_VERSION).toBe(17);
    expect(LOADABLE_VERSIONS).toContain(15);
    expect(restoreSession(JSON.stringify({ version: 15, savedAt: '', events: [{ type: 'battle_started', state: arena() }] })).ok).toBe(true);
  });
});
