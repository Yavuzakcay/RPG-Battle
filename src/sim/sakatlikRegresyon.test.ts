/**
 * Görev SAKATLIK-S1 (kural sürümü 111) hızlı regresyon: sakatlık ev kuralı (`sakatlik`) varsayılan kapalı; kapalıyken 111 savaşı
 * 110 ile aynı oynar. Altın: MC3 altını (`mc3-altin.json`). 110 imzası altınla aynı kalmalı (eski kayıt/replay), 111 imzası da.
 * Tohum varsayılan 3 (PowerShell: `$env:SAKATLIK_TOHUM=10; npx vitest run src/sim/sakatlikRegresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import altin from './mc3-altin.json';
import { combatantHashes, signature } from './mc3EskiYeni';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { SAKATLIK_VERSION } from '../battle/sakatlikSurum';
import { withSakatlikMarks } from '../battle/sakatlik';
import { playBattle, SCENARIOS, seeded, setupBattle } from './balance';
import type { Combatant } from '../battle/types';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.SAKATLIK_TOHUM ?? 3);
const A = altin as unknown as { savaslar: Record<string, string>; imza: Record<string, Record<string, string>> };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

describe('Kural sürümü 111 (sakatlık, ev kuralı kapalı) eski = yeni', () => {
  it(`sürüm 111: ${Object.keys(A.savaslar).length} tek sınıflı savaşçı altınla aynı kurulur`, () => {
    setDefaultRuleVersion(SAKATLIK_VERSION);
    const now = combatantHashes();
    expect(Object.keys(now).filter((k) => now[k] !== A.savaslar[k])).toEqual([]);
  });
  it(`Çöl/Kale/Mağara/Orman imzası (${SEEDS} tohum): 110 = 111 = altın`, () => {
    const gold = A.imza[String(SEEDS)];
    expect(gold).toBeDefined();
    for (const id of ['col', 'kale', 'magara', 'orman']) {
      expect(signature(id, SEEDS, SAKATLIK_VERSION - 1), `${id} 110`).toBe(gold![id]);
      expect(signature(id, SEEDS, SAKATLIK_VERSION), `${id} 111`).toBe(gold![id]);
    }
  }, 3_600_000);
  it(`ev kuralı açık (${SEEDS} tohum, Çöl/Kale): çökmesiz; sakatlık yalnız parti kâğıtlarında`, () => {
    setDefaultRuleVersion(SAKATLIK_VERSION);
    for (const id of ['col', 'kale']) for (let seed = 1; seed <= SEEDS; seed++) {
      const rng = seeded(seed);
      const s0 = setupBattle(SCENARIOS.find((x) => x.id === id)!, rng, 5);
      const start = withSakatlikMarks({ ...s0, houseRules: { ...s0.houseRules, sakatlik: true } });
      const end = playBattle(start, rng, 20);
      for (const c of Object.values(end.combatants) as Combatant[]) {
        if (c.sakatliklar?.length) expect(c.side === 'party' && !!c.raceId && !c.monsterId, `${id}/${seed} ${c.id}`).toBe(true);
        if (c.side !== 'party' || c.monsterId) expect(c.sakatlikOn, `${id}/${seed} ${c.id}`).toBeUndefined();
      }
    }
  }, 3_600_000);
});
