/**
 * GECE-KATALOG-KALAN (kural sürümü 110) hızlı regresyon: 110 katmanı yalnız katalog yaratıklarında (`s110`) ve katalog eşya
 * kancalarında veri okur; aura altyapısı (`auraCore` `fireAura`) yeniden düzenlendi. Altın: MC3 altını (`mc3-altin.json`).
 * 109 imzası altınla aynı kalmalı (eski kayıt/replay); 110 imzası da altınla aynı (SRD senaryolarında katalog yaratığı ve eşyası yok).
 * Tohum varsayılan 3 (PowerShell: `$env:K110_TOHUM=10; npx vitest run src/sim/katalog110Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import altin from './mc3-altin.json';
import { combatantHashes, signature } from './mc3EskiYeni';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.K110_TOHUM ?? 3);
const A = altin as unknown as { savaslar: Record<string, string>; imza: Record<string, Record<string, string>> };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

describe('Kural sürümü 110 (katalog kalanları) eski = yeni', () => {
  it(`sürüm 110: ${Object.keys(A.savaslar).length} tek sınıflı savaşçı altınla aynı kurulur`, () => {
    setDefaultRuleVersion(110);
    const now = combatantHashes();
    expect(Object.keys(now).filter((k) => now[k] !== A.savaslar[k])).toEqual([]);
  });
  it(`Çöl/Kale/Mağara/Orman imzası (${SEEDS} tohum): 109 = 110 = altın`, () => {
    const gold = A.imza[String(SEEDS)];
    expect(gold).toBeDefined();
    for (const id of ['col', 'kale', 'magara', 'orman']) {
      expect(signature(id, SEEDS, 109), `${id} 109`).toBe(gold![id]);
      expect(signature(id, SEEDS, 110), `${id} 110`).toBe(gold![id]);
    }
  }, 3_600_000);
});
