/**
 * Görev SRD-TAMAMLAMA-1 (kural sürümü 106) hızlı regresyon: MC3 altınıyla (`mc3-altin.json`, taban `304bcb60`, kural 104;
 * 105 = 104) karşılaştırma. Tek sınıflı sim partilerinin savaşçıları 106'da da aynı kurulur; Çöl/Kale/Mağara/Orman imzası
 * (5. seviye standart parti) 105'te altınla aynı ve 106 = altın (106'nın değişiklikleri Preserve Life miktar sorusu, Land's Aid
 * aynı yaratık, eşya temizleme: kancasız Rng'de öneri eski davranış; standart parti Elixir/Vitality taşımaz).
 * Tohum varsayılan 3 (PowerShell: `$env:SRD106_TOHUM=100; npx vitest run src/sim/srd106Regresyon.test.ts`; altında 100 tohum imzası da var).
 */
import { afterEach, describe, expect, it } from 'vitest';
import altin from './mc3-altin.json';
import { combatantHashes, signature } from './mc3EskiYeni';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.SRD106_TOHUM ?? 3);
const A = altin as unknown as { savaslar: Record<string, string>; imza: Record<string, Record<string, string>> };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

describe('SRD-TAMAMLAMA-1 (106) eski = yeni', () => {
  it(`sürüm 106: ${Object.keys(A.savaslar).length} tek sınıflı savaşçı altınla aynı kurulur`, () => {
    setDefaultRuleVersion(106);
    const now = combatantHashes();
    expect(Object.keys(now).filter((k) => now[k] !== A.savaslar[k])).toEqual([]);
    expect(Object.keys(now).length).toBe(Object.keys(A.savaslar).length);
  });
  it(`Çöl/Kale/Mağara/Orman imzası (${SEEDS} tohum): 105 = altın, 106 = altın`, () => {
    const gold = A.imza[String(SEEDS)];
    expect(gold).toBeDefined();
    for (const id of ['col', 'kale', 'magara', 'orman']) {
      expect(signature(id, SEEDS, 105), `${id} 105`).toBe(gold![id]);
      expect(signature(id, SEEDS, 106), `${id} 106`).toBe(gold![id]);
    }
  }, 3_600_000);
});
