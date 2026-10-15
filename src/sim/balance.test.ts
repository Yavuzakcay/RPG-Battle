import { describe, it, expect } from 'vitest';
import { combatantFromSheet } from '../battle';
import { getMonster } from '../data';
import { averageDamage } from '../battle/ai';
import { PARTY, SCENARIOS, scenarioXp, seeded, setupBattle, simulate } from './balance';
import { planProblems } from '../app/setup';

describe('denge simülasyonu', () => {
  it('parti: 5 karakter, 5. seviye, sorunsuz kurulur', () => {
    expect(PARTY).toHaveLength(5);
    for (const s of PARTY) expect(combatantFromSheet(s, { id: 'x', ownerId: 'p' }).level).toBe(5);
  });
  it('senaryolar haritaya sığar ve en az 5 farklı harita türü var', () => {
    const kinds = new Set(SCENARIOS.map((s) => s.map?.mapId ?? 'duz'));
    expect(kinds.size).toBeGreaterThanOrEqual(5);
    for (const s of SCENARIOS.filter((x) => x.map)) {
      const plan = {
        party: PARTY.map((sheet, i) => ({ id: `p${i}`, sheet })),
        enemies: Object.entries(s.enemies).map(([id, count]) => ({ monster: getMonster(id), count })),
        mapId: s.map?.mapId ?? '', variantId: s.map?.variantId ?? '', mirrored: false,
      };
      expect(planProblems(plan)).toEqual([]);
      expect(setupBattle(s, seeded(1)).status).toBe('active');
    }
    expect(scenarioXp(SCENARIOS[0] as (typeof SCENARIOS)[number])).toBe(4850);
  });
  it('aynı tohum aynı sonucu verir; savaş biter', () => {
    const s = SCENARIOS.find((x) => x.id === 'volkan') as (typeof SCENARIOS)[number];
    const a = simulate(s, 7);
    expect(simulate(s, 7)).toEqual(a);
    expect(['party', 'enemies', 'timeout']).toContain(a.winner);
    expect(seeded(3)()).toBe(seeded(3)());
  });
  it('ortalama hasar', () => {
    expect(averageDamage('2d6+3')).toBe(10);
    expect(averageDamage('1d10')).toBe(5.5);
  });
});
