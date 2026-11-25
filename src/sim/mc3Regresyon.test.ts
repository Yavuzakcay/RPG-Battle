/**
 * Görev MC3 "eski = yeni" (kural sürümü 105, savaş kaydı 26). Altın değerler MC3 öncesi ağaçta (`f85717ea`, kural 103, kayıt
 * 25) `scripts/mc3-eski-yeni.ts` ile üretildi (`src/sim/mc3-altin.json`; yardımcı `mc3EskiYeni.ts`):
 * - tek sınıflı savaşçılar 103, 104 ve 105'te MC3 öncesiyle aynı;
 * - MC3 öncesi savaş kaydı (sürüm 25, Çöl, 3 tur) yeni kodla aynı duruma oynar ve yüklenir;
 * - dört senaryonun imzası (5. seviye standart parti): 104 = MC3 öncesi (103) ve 105 = 104.
 * Tohum varsayılan 3 (PowerShell: `$env:MC3_TOHUM=100; npx vitest run src/sim/mc3Regresyon.test.ts`; altında 100 tohum
 * imzası da var).
 */
import { afterEach, describe, expect, it } from 'vitest';
import altin from './mc3-altin.json';
import { combatantHashes, replayHash, signature } from './mc3EskiYeni';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { restoreSession } from '../app/battleSave';
import type { BattleEvent } from '../battle/types';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.MC3_TOHUM ?? 3);
const A = altin as unknown as { savaslar: Record<string, string>; kayit: { version: number; events: BattleEvent[]; son: string; oynatma: string }; imza: Record<string, Record<string, string>> };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

describe('MC3 eski = yeni: tek sınıflı savaşçılar', () => {
  for (const v of [103, 104, 105]) {
    it(`sürüm ${v}: ${Object.keys(A.savaslar).length} savaşçı MC3 öncesiyle aynı`, () => {
      setDefaultRuleVersion(v);
      const now = combatantHashes();
      expect(Object.keys(now).filter((k) => now[k] !== A.savaslar[k])).toEqual([]);
      expect(Object.keys(now).length).toBe(Object.keys(A.savaslar).length);
    });
  }
});

describe('MC3 eski = yeni: MC3 öncesi savaş kaydı (sürüm 25)', () => {
  it('olay günlüğü yeni kodla aynı duruma oynar; kayıt dosyası yüklenir', () => {
    expect(A.kayit.son).toBe(A.kayit.oynatma);
    expect(replayHash(A.kayit.events)).toBe(A.kayit.son);
    const r = restoreSession(JSON.stringify({ version: 25, savedAt: '2026-11-24T00:00:00.000Z', events: A.kayit.events }));
    expect(r.ok).toBe(true);
  });
});

describe(`MC3 eski = yeni: Çöl/Kale/Mağara/Orman imzası (${SEEDS} tohum)`, () => {
  const ids = ['col', 'kale', 'magara', 'orman'];
  it('104 = MC3 öncesi (103), 105 = 104 (tek sınıflı parti)', () => {
    const gold = A.imza[String(SEEDS)];
    for (const id of ids) {
      const s104 = signature(id, SEEDS, 104);
      const s105 = signature(id, SEEDS, 105);
      if (gold) expect(s104, id).toBe(gold[id]);
      expect(s105, id).toBe(s104);
    }
  }, 3_600_000);
});
