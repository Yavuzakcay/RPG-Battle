/** Denge turu: bölge karşılaşma üreteci (`data/bolge-karsilasma.json`). */
import { describe, expect, it } from 'vitest';
import { getMonster } from '../data';
import { getMap } from '../map/maps';
import { seededRng } from '../rules/dice';
import { encounterBudget } from '../rules/budget';
import { ENCOUNTER_RULES, REGIONS, crXp, isLegendary, regionEncounter, regionMonsters } from './encounter';

describe('bölge karşılaşma üreteci', () => {
  it('yedi bölge; haritaları var; canavar havuzu dolu ve dışlananlar yok', () => {
    expect(REGIONS.map((r) => r.id)).toEqual(['buzul', 'dag', 'orman', 'col', 'bataklik', 'bati-kiyisi', 'volkan']);
    for (const r of REGIONS) {
      expect(() => getMap(r.harita.mapId, { variantId: r.harita.variantId })).not.toThrow();
      const pool = regionMonsters(r);
      expect(pool.length).toBeGreaterThan(20);
      expect(pool.some((m) => m.id === 'troll-limb' || m.tema === 'Deniz canlıları')).toBe(false);
    }
  });
  it('her bölge × seviyede: bütçeyi aşmaz, en çok enCok düşman, lider CR ≤ seviye, aynı tohum aynı liste', () => {
    for (const r of REGIONS) for (const lv of [1, 5, 9, 13, 17, 20]) for (const seed of [1, 2, 3]) {
      const levels = Array(5).fill(lv);
      const e = regionEncounter(r, levels, seededRng(seed));
      const xp = Object.entries(e.enemies).reduce((n, [id, k]) => n + crXp(getMonster(id).cr) * k, 0);
      expect(e.budget).toBe(encounterBudget(levels, 'moderate'));
      expect(xp).toBe(e.xp);
      expect(xp).toBeLessThanOrEqual(e.budget);
      expect(Object.values(e.enemies).reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(ENCOUNTER_RULES.enCok);
      expect(regionEncounter(r, levels, seededRng(seed))).toEqual(e);
      expect(Object.entries(e.enemies).filter(([id]) => isLegendary(id)).reduce((n, [, k]) => n + k, 0)).toBeLessThanOrEqual(ENCOUNTER_RULES.efsaneviEnCok);
    }
  });
});
