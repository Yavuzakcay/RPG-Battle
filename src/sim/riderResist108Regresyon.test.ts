/**
 * Görev KATALOG-ON-HAZIRLIK (kural sürümü 108) hızlı regresyon: ek hasarın süren etki direnci yalnız saldırı çözümünü değiştirir,
 * savaşçı kurulumunu değil. Altın: MC3 altını (`mc3-altin.json`; 105 = 106 = 107 = altın). 107 imzası altınla aynı kalmalı
 * (eski kayıt/replay); 108 savaşçı kurulumu altınla aynı, imza çökmesiz (sim partisinde ek hasara karşı süren etki direnci
 * yoksa altınla aynı).
 * Tohum varsayılan 3 (PowerShell: `$env:R108_TOHUM=10; npx vitest run src/sim/riderResist108Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import altin from './mc3-altin.json';
import { combatantHashes, signature } from './mc3EskiYeni';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.R108_TOHUM ?? 3);
const A = altin as unknown as { savaslar: Record<string, string>; imza: Record<string, Record<string, string>> };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

describe('Kural sürümü 108 (ek hasar direnci) eski = yeni', () => {
  it(`sürüm 108: ${Object.keys(A.savaslar).length} tek sınıflı savaşçı altınla aynı kurulur`, () => {
    setDefaultRuleVersion(108);
    const now = combatantHashes();
    expect(Object.keys(now).filter((k) => now[k] !== A.savaslar[k])).toEqual([]);
  });
  it(`Çöl/Kale/Mağara/Orman imzası (${SEEDS} tohum): 107 = altın; 108 çökmesiz`, () => {
    const gold = A.imza[String(SEEDS)];
    expect(gold).toBeDefined();
    const farkli: string[] = [];
    for (const id of ['col', 'kale', 'magara', 'orman']) {
      expect(signature(id, SEEDS, 107), `${id} 107`).toBe(gold![id]);
      const yeni = signature(id, SEEDS, 108);
      expect(yeni, `${id} 108`).toMatch(/\S/);
      if (yeni !== gold![id]) farkli.push(id);
    }
    // Bilgi: 108'de imzası değişen senaryolar (ek hasara karşı süren etki direnci olan sim savaşları).
    console.log(`108 imzası altından farklı: ${farkli.join(', ') || 'yok'}`);
  }, 3_600_000);
});
