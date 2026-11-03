/** Kuyruk 19 (görev 10): Gece görüşü (`nightVision`) ve fırtına kuralları (`stormRules`); varsayılan kapalı. */
import { describe, expect, it } from 'vitest';
import { startBattle } from './index';
import type { BattleState, Combatant } from './index';
import { canSee, mapAttackSources, stormNow } from './maprules';
import { mk } from './fixtures';

function field(mapId: string, variantId: string, toggles?: Record<string, boolean>, kuralSurumu = 16, darkvision = 0): BattleState {
  const parts = [mk('A', { ownerId: 'p1', darkvision }), mk('B', { side: 'enemies' })];
  const { state } = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu, map: { id: mapId, variantId, ...(toggles ? { ruleToggles: toggles } : {}) } });
  const combatants = { ...state.combatants };
  combatants.A = { ...(combatants.A as Combatant), pos: { col: 2, row: 3 } };
  combatants.B = { ...(combatants.B as Combatant), pos: { col: 5, row: 3 } };
  return { ...state, combatants };
}

describe('Kuyruk 19: gece ve fırtına görüşü', () => {
  it('gece görüşü: kapalıyken (varsayılan) görür; açıkken karanlık görüşsüz uzak hedefi görmez, saldırısı dezavantajlı; karanlık görüşlü görür; eski sürümde yok', () => {
    const off = field('batak-kamp', 'gece');
    expect(canSee(off, off.combatants.A as Combatant, off.combatants.B as Combatant)).toBe(true);
    const on = field('batak-kamp', 'gece', { nightVision: true });
    expect(canSee(on, on.combatants.A as Combatant, on.combatants.B as Combatant)).toBe(false);
    const src = mapAttackSources(on, on.combatants.A as Combatant, on.combatants.B as Combatant, true);
    expect('sources' in src && src.sources.some((x) => x.effect === 'disadvantage')).toBe(true);
    const dv = field('batak-kamp', 'gece', { nightVision: true }, 16, 60);
    expect(canSee(dv, dv.combatants.A as Combatant, dv.combatants.B as Combatant)).toBe(true);
    const old = field('batak-kamp', 'gece', { nightVision: true }, 15);
    expect(canSee(old, old.combatants.A as Combatant, old.combatants.B as Combatant)).toBe(true);
  });
  it('fırtına: kapalıyken etkisiz; açıkken menzilli saldırı dezavantajlı', () => {
    const off = field('gemi', 'firtina');
    expect(stormNow(off)).toBe(false);
    const on = field('gemi', 'firtina', { stormRules: true });
    expect(stormNow(on)).toBe(true);
    const src = mapAttackSources(on, on.combatants.A as Combatant, on.combatants.B as Combatant, true);
    expect('sources' in src && src.sources.some((x) => x.reason === 'Fırtına')).toBe(true);
    expect(stormNow(field('gemi', 'firtina', { stormRules: true }, 15))).toBe(false);
  });
});
