/** Denge turu: bölge karşılaşma üreteci (`data/bolge-karsilasma.json`). */
import { describe, expect, it } from 'vitest';
import { getMonster } from '../data';
import { getMap } from '../map/maps';
import { seededRng } from '../rules/dice';
import { encounterBudget } from '../rules/budget';
import { ENCOUNTER_RULES, REGIONS, crXp, isLegendary, levelMultiplier, regionEncounter, regionLevelFactor, regionMonsters } from './encounter';

describe('bölge karşılaşma üreteci', () => {
  it('seviye çarpanı (Dungeondex öncesi denge turu, kullanıcı onaylı): 1 ×1,8, 5 ×1,5, 9 ×1,2, 13 ×0,8, diğerleri 1', () => {
    expect([1, 5, 9, 13, 17, 20].map(levelMultiplier)).toEqual([1.8, 1.5, 1.2, 0.8, 1, 1]);
  });
  it('bölge × seviye düzeltmesi (denge turu 2): yalnız ölçülen seviyelerde, 0,5–2 arasında; yoksa 1', () => {
    const buzul = REGIONS.find((r) => r.id === 'buzul')!;
    expect(regionLevelFactor(buzul, 3)).toBe(1);
    expect(regionLevelFactor({ ...buzul, seviyeDuzeltme: undefined }, 5)).toBe(1);
    for (const r of REGIONS) for (const [lv, f] of Object.entries(r.seviyeDuzeltme ?? {})) {
      expect([1, 5, 9]).toContain(Number(lv));
      expect(f).toBeGreaterThanOrEqual(0.5);
      expect(f).toBeLessThanOrEqual(2);
    }
  });
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
      expect(e.budget).toBe(Math.round(encounterBudget(levels, 'moderate') * r.carpan * levelMultiplier(lv) * regionLevelFactor(r, lv)));
      expect(xp).toBe(e.xp);
      expect(xp).toBeLessThanOrEqual(e.budget);
      expect(Object.values(e.enemies).reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(ENCOUNTER_RULES.enCok);
      expect(regionEncounter(r, levels, seededRng(seed))).toEqual(e);
      expect(Object.entries(e.enemies).filter(([id]) => isLegendary(id)).reduce((n, [, k]) => n + k, 0)).toBeLessThanOrEqual(ENCOUNTER_RULES.efsaneviEnCok);
    }
  });
});
