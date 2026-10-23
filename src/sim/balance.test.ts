import { describe, it, expect } from 'vitest';
import { combatantFromSheet } from '../battle';
import { getMonster } from '../data';
import { averageDamage } from '../battle/ai';
import { DEFAULT_LEVEL, PARTY, PARTY_KINDS, SCENARIOS, partyAt, scenarioXp, seeded, setupBattle, simulate } from './balance';
import { tableValue } from '../rules/classFeatures';
import { spellOptions } from '../rules/builder';
import { spells } from '../data';
import monsterEnvs from '../../data/monster-ortamlari.json';
import { planProblems } from '../app/setup';

describe('denge simülasyonu', () => {
  it('parti: 5 karakter, 5. seviye, sorunsuz kurulur', () => {
    expect(PARTY).toHaveLength(5);
    for (const s of PARTY) expect(combatantFromSheet(s, { id: 'x', ownerId: 'p' }).level).toBe(5);
  });
  it('seviyeli parti üreteci: 5. seviyede PARTY birebir; diğer seviyelerde aynı üyeler, istenen seviye', () => {
    expect(partyAt()).toEqual(PARTY);
    partyAt(5).forEach((s, i) => expect(s).toBe(PARTY[i]));
    const p11 = partyAt(11);
    expect(p11.map((s) => [s.name, s.level])).toEqual(PARTY.map((s) => [s.name, 11]));
    expect(p11.map((s) => s.classId)).toEqual(PARTY.map((s) => s.classId));
    expect(partyAt(1).find((s) => s.classId === 'wizard')?.spellNames).not.toContain('Fireball');
    expect(() => partyAt(21)).toThrow();
    const s = SCENARIOS[0] as (typeof SCENARIOS)[number];
    expect(Object.values(setupBattle(s, seeded(1), 11).combatants).filter((c) => c.side === 'party').every((c) => c.level === 11)).toBe(true);
    expect(simulate(s, 1)).toEqual(simulate(s, 1, 20, 5));
  });
  it('1. ve 3. seviye partiler gerçek: büyü sayısı SRD tablosunda, seçilebilir büyüler, seviye yuvaları ve ustalık hakkı', () => {
    for (const kind of ['standart', 'barbar']) {
      expect(PARTY_KINDS[kind]).toBeTruthy();
      for (const level of [1, 3, 5]) {
        for (const s of partyAt(level, kind)) {
          expect(s.level).toBe(level);
          const allowed = new Set(spellOptions(s.classId, level));
          const chosen = (s.spellNames ?? []).map((n) => spells.find((x) => x.name === n));
          expect(chosen.every((x) => x && allowed.has(x.name))).toBe(true);
          const row = { Cantrips: tableValue(s.classId, level, 'Cantrips'), 'Prepared Spells': tableValue(s.classId, level, 'Prepared Spells') };
          const cantrips = chosen.filter((x) => x?.level === 0).length;
          const prepared = chosen.length - cantrips;
          expect(cantrips).toBeLessThanOrEqual(Number(row['Cantrips'] ?? 0));
          expect(prepared).toBeLessThanOrEqual(Number(row['Prepared Spells'] ?? 0));
          // 1. ve 3. seviyede hazır büyü listesi tablo kadar dolu (5. seviye partisi önceki ölçümlerle aynı kalsın diye eksik).
          if (level < DEFAULT_LEVEL && row['Prepared Spells']) {
            const pool = spells.filter((x) => x.level > 0 && allowed.has(x.name)).length;
            expect(prepared).toBe(Math.min(Number(row['Prepared Spells']), pool));
          }
          expect((s.advancements ?? []).every((a) => a.level <= level)).toBe(true);
          expect(combatantFromSheet(s, { id: 'x', ownerId: 'p' }).level).toBe(level);
        }
      }
    }
  });
  it('1. ve 3. seviye düşman listeleri haritanın ortam listesinden', () => {
    const envOf = new Map((monsterEnvs as Array<{ id: string; ortam: string[] }>).map((m) => [m.id, m.ortam]));
    for (const s of SCENARIOS) {
      const env = s.map?.mapId ?? 'duz-zemin';
      for (const level of [1, 3]) {
        const list = s.byLevel?.[level];
        expect(list, `${s.id} ${level}. seviye listesi`).toBeTruthy();
        for (const id of Object.keys(list ?? {})) {
          expect(getMonster(id).id).toBe(id);
          expect(envOf.get(id), `${s.id}: ${id}`).toContain(env);
        }
      }
    }
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
      // Her seviyenin listesi de başlangıç bölgesine sığar (Görev B1).
      for (const level of Object.keys(s.byLevel ?? {}).map(Number)) expect(setupBattle(s, seeded(1), level).status).toBe('active');
    }
    // Düz: 2 Ogre 900 + Bandit Captain 450 + 4 Gnoll 400 + 2 Wolf 100 + 2 Worg 200 + 2 Boar 100
    // (Görev E: kurt Prone'u uygulanınca parti %51'e düştü; 4 kurttan 2'ye inildi. Görev P-Barbarian: Barbarian
    // partisi %96 olunca Ogre 1 → 2; standart parti %63).
    expect(scenarioXp(SCENARIOS[0] as (typeof SCENARIOS)[number])).toBe(2150);
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
