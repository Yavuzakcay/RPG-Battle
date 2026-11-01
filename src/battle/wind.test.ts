/**
 * Gece kuyruğu 2 (K28 ortak): rüzgâr şiddeti. Ortak `wind` kuralında Game Master parametresi `strength` (0 hafif = eski
 * davranış, 2 şiddetli): rüzgâra karşı menzilli saldırı dezavantajlı; rüzgârla aynı yöne ya da yakın dövüşte değil.
 */
import { describe, expect, it } from 'vitest';
import { startBattle } from './create';
import { mk } from './fixtures';
import { checkReach } from './range';
import { againstStrongWind } from './forest';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
// Ork Kampı gündüz: rüzgâr kuralı var (yön Game Master parametresiyle).
function scene(strength: number | null, v?: number, dir = 'N'): BattleState {
  const st = startBattle('wind', 'orman', [mk('A', { ownerId: 'p1' }), mk('B', { side: 'enemies' })], () => 0.5, {
    map: { id: 'orman-ork-kampi', variantId: 'gunduz', ruleParams: { wind: { dir, ...(strength !== null ? { strength } : {}) } } }, ...(v ? { kuralSurumu: v } : {}),
  }).state;
  return { ...st, combatants: { A: { ...(st.combatants.A as Combatant), pos: o(5, 8) }, B: { ...(st.combatants.B as Combatant), pos: o(5, 3) } } } as BattleState;
}
const ranged = { kind: 'ranged', normalFt: 150, longFt: 600 } as const;
const reasons = (s: BattleState) => { const r = checkReach(s, s.combatants.A as Combatant, s.combatants.B as Combatant, ranged); return 'ok' in r && r.ok ? r.sources.map((x) => x.reason) : []; };

describe('K28 ortak: rüzgâr şiddeti', () => {
  it('şiddetli rüzgâra karşı (kuzeye esen rüzgâr, güneyden kuzeye değil; kuzeyden güneye ateş eden ters yönde) dezavantaj', () => {
    // Rüzgâr kuzeye esiyor; A güneyde, B kuzeyde: A'nın atışı rüzgârla aynı yönde.
    expect(againstStrongWind(scene(2), o(5, 8), o(5, 3))).toBe(false);
    expect(againstStrongWind(scene(2), o(5, 3), o(5, 8))).toBe(true);
    // Rüzgâr güneye esiyor: A'nın kuzeye atışı rüzgâra karşı.
    expect(reasons(scene(2, undefined, 'S'))).toContain('Şiddetli rüzgâra karşı');
  });
  it('varsayılan (hafif), orta rüzgâr ve eski kural sürümü: etki yok', () => {
    expect(reasons(scene(null, undefined, 'S'))).not.toContain('Şiddetli rüzgâra karşı');
    expect(reasons(scene(1, undefined, 'S'))).not.toContain('Şiddetli rüzgâra karşı');
    expect(reasons(scene(2, 6, 'S'))).not.toContain('Şiddetli rüzgâra karşı');
  });
});
