/** Kuyruk 19 (görev 10): Gece görüşü (`nightVision`) ve fırtına kuralları (`stormRules`); varsayılan kapalı. */
import { describe, expect, it } from 'vitest';
import { startBattle } from './index';
import type { BattleState, Combatant } from './index';
import { canSee, mapAttackSources, stormNow } from './maprules';
import { mk } from './fixtures';
import { combatantFromMonster } from './create';
import { senseSees } from './sight';
import { getMonster } from '../data';

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
  it('denge turu (sürüm 17, darkvisionRange): menzil yaratığın kendi karanlık görüşü; sürüm 16 ve anahtar kapalıyken herkes 12 altıgen', () => {
    const at = (s: BattleState, col: number): BattleState => ({ ...s, combatants: { ...s.combatants, B: { ...(s.combatants.B as Combatant), pos: { col, row: 3 } } } });
    const sees = (s: BattleState) => canSee(s, s.combatants.A as Combatant, s.combatants.B as Combatant);
    // 30 ft (6 altıgen): 3 altıgende görür, 8 altıgende görmez (sürüm 16'da 12 altıgen sabit olduğundan görürdü).
    const short = field('batak-kamp', 'gece', { nightVision: true }, 17, 30);
    expect([sees(short), sees(at(short, 10))]).toEqual([true, false]);
    expect(sees(at(field('batak-kamp', 'gece', { nightVision: true }, 16, 30), 10))).toBe(true);
    expect(sees(at(field('batak-kamp', 'gece', { nightVision: true, darkvisionRange: false }, 17, 30), 10))).toBe(true);
    // 120 ft (24 altıgen): 13 altıgendeki hedefi görür (eskiden 12 altıgen sınırı).
    const long = field('batak-kamp', 'gece', { nightVision: true }, 17, 120);
    expect(sees(at(long, 15))).toBe(true);
    expect(sees(at(field('batak-kamp', 'gece', { nightVision: true }, 16, 120), 15))).toBe(false);
  });
  it('denge turu: canavarın Blindsight/Truesight değeri SRD anahtarı (srdK19) kapalıyken de okunur ve görür', () => {
    const pud = combatantFromMonster(getMonster('black-pudding'), { id: 'P', name: 'P' });
    const lord = combatantFromMonster(getMonster('mummy-lord'), { id: 'L', name: 'L' });
    expect([pud.senses, lord.senses]).toEqual([{ blindsight: 60 }, { truesight: 60 }]);
    const st = field('batak-kamp', 'gece', { nightVision: true, srdK19: false }, 17);
    const p = { ...pud, pos: { col: 2, row: 3 } };
    expect(senseSees(st, p, st.combatants.B as Combatant)).toBe(true);
    expect(senseSees(st, p, { ...(st.combatants.B as Combatant), pos: { col: 16, row: 3 } })).toBe(false);
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
