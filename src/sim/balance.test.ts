import { describe, it, expect } from 'vitest';
import { combatantFromSheet } from '../battle';
import { getMonster } from '../data';
import { averageDamage } from '../battle/ai';
import { PARTY, SCENARIOS, partyAt, scenarioXp, seeded, setupBattle, simulate } from './balance';
import { planProblems } from '../app/setup';

describe('denge simülasyonu', () => {
  it('parti: 5 karakter, 5. seviye, sorunsuz kurulur', () => {
    expect(PARTY).toHaveLength(5);
    for (const s of PARTY) expect(combatantFromSheet(s, { id: 'x', ownerId: 'p' }).level).toBe(5);
  });
  it('seviyeli parti üreteci (iskelet): 5. seviyede PARTY birebir; diğer seviyelerde aynı üyeler, istenen seviye', () => {
    expect(partyAt()).toBe(PARTY);
    expect(partyAt(5)).toBe(PARTY);
    const p11 = partyAt(11);
    expect(p11.map((s) => [s.name, s.level])).toEqual(PARTY.map((s) => [s.name, 11]));
    expect(p11.map((s) => s.classId)).toEqual(PARTY.map((s) => s.classId));
    expect(partyAt(1).find((s) => s.classId === 'wizard')?.spellNames).not.toContain('Fireball');
    expect(() => partyAt(21)).toThrow();
    const s = SCENARIOS[0] as (typeof SCENARIOS)[number];
    expect(Object.values(setupBattle(s, seeded(1), 11).combatants).filter((c) => c.side === 'party').every((c) => c.level === 11)).toBe(true);
    expect(simulate(s, 1)).toEqual(simulate(s, 1, 20, 5));
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
    // Düz: Ogre 450 + Bandit Captain 450 + 4 Gnoll 400 + 2 Wolf 100 + 2 Worg 200 + 2 Boar 100
    // (Görev E: kurt Prone'u uygulanınca parti %51'e düştü; 4 kurttan 2'ye inildi).
    expect(scenarioXp(SCENARIOS[0] as (typeof SCENARIOS)[number])).toBe(1700);
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
