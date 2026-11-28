/**
 * Görev KATALOG-GUC-TAM (kural sürümü 109) hızlı regresyon: 109 katmanı yalnız katalog yaratıkları ve yuva/katalog eşyalarında veri
 * okur. Altın: MC3 altını (`mc3-altin.json`). 108 imzası altınla aynı kalmalı (eski kayıt/replay); 109 savaşçı kurulumu altınla aynı
 * (sim partilerinde yuva ve katalog eşyası yok), imza çökmesiz (SRD senaryolarında katalog yaratığı yoksa altınla aynı).
 * Tohum varsayılan 3 (PowerShell: `$env:K109_TOHUM=10; npx vitest run src/sim/katalog109Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import altin from './mc3-altin.json';
import { combatantHashes, signature } from './mc3EskiYeni';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.K109_TOHUM ?? 3);
const A = altin as unknown as { savaslar: Record<string, string>; imza: Record<string, Record<string, string>> };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

describe('Kural sürümü 109 (katalog güçleri) eski = yeni', () => {
  it(`sürüm 109: ${Object.keys(A.savaslar).length} tek sınıflı savaşçı altınla aynı kurulur`, () => {
    setDefaultRuleVersion(109);
    const now = combatantHashes();
    expect(Object.keys(now).filter((k) => now[k] !== A.savaslar[k])).toEqual([]);
  });
  it(`Çöl/Kale/Mağara/Orman imzası (${SEEDS} tohum): 108 = altın; 109 çökmesiz`, () => {
    const gold = A.imza[String(SEEDS)];
    expect(gold).toBeDefined();
    const farkli: string[] = [];
    for (const id of ['col', 'kale', 'magara', 'orman']) {
      expect(signature(id, SEEDS, 108), `${id} 108`).toBe(gold![id]);
      const yeni = signature(id, SEEDS, 109);
      expect(yeni, `${id} 109`).toMatch(/\S/);
      if (yeni !== gold![id]) farkli.push(id);
    }
    console.log(`109 imzası altından farklı: ${farkli.join(', ') || 'yok'}`);
  }, 3_600_000);
});
