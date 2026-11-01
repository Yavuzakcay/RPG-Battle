/** Kuyruk 30 D2: suda yüzey azalması. */
import { describe, expect, it } from 'vitest';
import { startBattle } from './create';
import { mk } from './fixtures';
import { applyEvents } from './reduce';
import { waterDecayEvents } from './waterDecay';
import type { Offset } from '../rules/hex';
import type { BattleState, SpellZone } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
// Sol yarı kara, sağ yarı derin su (w); 8. sütun sığ su (n).
const TILES = Array.from({ length: 7 }, () => '.......nwwwwwww');
function battle(zones: SpellZone[], opt: { v?: number; toggles?: Record<string, boolean> } = {}): BattleState {
  const st = startBattle('k30', 'duz', [mk('A', {}), mk('B', { side: 'enemies' })], () => 0.5, {
    map: { id: 'duz-zemin', ...(opt.toggles ? { ruleToggles: opt.toggles } : {}) }, ...(opt.v ? { kuralSurumu: opt.v } : {}),
  }).state;
  return { ...st, status: 'active', round: 2, map: { ...st.map!, tiles: TILES, zones } } as BattleState;
}
const zone = (id: string, hexes: Offset[], extra: Partial<SpellZone>): SpellZone =>
  ({ id, spellId: 'grease', name: id, casterId: 'A', side: 'party', dc: 12, slotLevel: 1, hexes, until: 11, ...extra });
const GREASE = [o(5, 3), o(6, 3), o(7, 3), o(8, 3), o(9, 3), o(10, 3), o(11, 3)];

describe('Kuyruk 30 D2: suda yüzey azalması', () => {
  it('gres: sudaki altıgenlerin yarısı her tur kaybolur (kıyıya yakın önce), kara aynı; 3 turda sudan gider', () => {
    let s = battle([zone('g', GREASE, {})]);
    const evs = waterDecayEvents(s);
    s = applyEvents(s, evs);
    const left = s.map!.zones![0]!.hexes;
    expect(left).toEqual(expect.arrayContaining([o(5, 3), o(6, 3)]));
    expect(left.some((h) => h.col === 7)).toBe(false);
    expect(left).toHaveLength(4);
    for (let i = 0; i < 3; i++) s = applyEvents(s, waterDecayEvents(s));
    expect(s.map!.zones![0]!.hexes).toEqual([o(5, 3), o(6, 3)]);
    expect(s.map!.zones![0]!.until).toBe(11);
  });
  it('yağ yüzeyi ve tamamen sudaki alan biter', () => {
    let s = battle([zone('y', [o(10, 2), o(11, 2)], { spellId: 'surface:oil', surface: 'oil', until: undefined })]);
    s = applyEvents(s, waterDecayEvents(s));
    expect(s.map!.zones![0]!.hexes).toHaveLength(1);
    s = applyEvents(s, waterDecayEvents(s));
    expect(s.map!.zones ?? []).toHaveLength(0);
  });
  it('alev suda bir sonraki tur başında söner, karadaki alev yanmaya devam eder', () => {
    const s = battle([zone('f', [o(6, 1), o(9, 1)], { spellId: 'surface:fire', surface: 'fire', until: 3 })]);
    const after = applyEvents(s, waterDecayEvents(s));
    expect(after.map!.zones![0]!.hexes).toEqual([o(6, 1)]);
  });
  it('karadaki yüzey ve başka alanlar değişmez', () => {
    const s = battle([zone('g', [o(1, 1), o(2, 1)], {}), zone('z', [o(10, 1)], { spellId: 'fog-cloud' })]);
    expect(waterDecayEvents(s)).toHaveLength(0);
  });
  it('Game Master anahtarı kapalıyken ve eski savaşta etkisiz', () => {
    expect(waterDecayEvents(battle([zone('g', GREASE, {})], { toggles: { waterSurfaceDecay: false } }))).toHaveLength(0);
    expect(waterDecayEvents(battle([zone('g', GREASE, {})], { v: 9 }))).toHaveLength(0);
  });
});
