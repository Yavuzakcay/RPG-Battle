/**
 * Görev KATALOG-F0 (kural sürümü 107) hızlı regresyon: faz bloğu olan canavar sim senaryolarında yok, bu yüzden 107 = 106.
 * Altın: MC3 altını (`mc3-altin.json`; SRD-TAMAMLAMA-1'de 105 = 106 = altın). Tek sınıflı savaşçılar 107'de de aynı kurulur;
 * Çöl/Kale/Mağara/Orman imzası (5. seviye standart parti) 106 = altın, 107 = altın.
 * Tohum varsayılan 3 (PowerShell: `$env:FAZ2_TOHUM=100; npx vitest run src/sim/faz2Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import altin from './mc3-altin.json';
import { combatantHashes, signature } from './mc3EskiYeni';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.FAZ2_TOHUM ?? 3);
const A = altin as unknown as { savaslar: Record<string, string>; imza: Record<string, Record<string, string>> };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

describe('KATALOG-F0 (107) eski = yeni', () => {
  it(`sürüm 107: ${Object.keys(A.savaslar).length} tek sınıflı savaşçı altınla aynı kurulur`, () => {
    setDefaultRuleVersion(107);
    const now = combatantHashes();
    expect(Object.keys(now).filter((k) => now[k] !== A.savaslar[k])).toEqual([]);
    expect(Object.keys(now).length).toBe(Object.keys(A.savaslar).length);
  });
  it(`Çöl/Kale/Mağara/Orman imzası (${SEEDS} tohum): 106 = altın, 107 = altın`, () => {
    const gold = A.imza[String(SEEDS)];
    expect(gold).toBeDefined();
    for (const id of ['col', 'kale', 'magara', 'orman']) {
      expect(signature(id, SEEDS, 106), `${id} 106`).toBe(gold![id]);
      expect(signature(id, SEEDS, 107), `${id} 107`).toBe(gold![id]);
    }
  }, 3_600_000);
});
