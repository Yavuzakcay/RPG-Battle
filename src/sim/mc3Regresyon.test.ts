/**
 * Görev MC3 "eski = yeni" (kural sürümü 105, savaş kaydı 27). Altın değerler MC3 öncesi taban ağaçta üretildi: MC3-BIRLESTIR'den
 * beri `origin/birlesik` `304bcb60` (KARAR104 ve KARAR104-KALAN dahil: kural 104, kayıt 26; MC5'te `a50fd8ed`'den yenilendi), `scripts/mc3-eski-yeni.ts` ile
 * (`src/sim/mc3-altin.json`; yardımcı `mc3EskiYeni.ts`):
 * - tek sınıflı savaşçılar 104 ve 105'te tabandaki 104 ile, 103'te tabandaki 103 ile aynı;
 * - taban ağacın savaş kaydı (sürüm 26, KARAR104; Çöl, 3 tur) yeni kodla aynı duruma oynar ve yüklenir;
 * - ilk MC3 öncesi ağacın (`f85717ea`) savaş kaydı (sürüm 25) tabandakiyle aynı duruma oynar ve yüklenir;
 * - dört senaryonun imzası (5. seviye standart parti): 104 = taban (104) ve 105 = 104.
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
interface Kayit { version: number; events: BattleEvent[]; son?: string; oynatma: string }
const A = altin as unknown as { surum: number; savaslar: Record<string, string>; savaslar103: Record<string, string>; kayit: Kayit; kayit25: Kayit; imza: Record<string, Record<string, string>> };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

const same = (now: Record<string, string>, gold: Record<string, string>): void => {
  expect(Object.keys(now).filter((k) => now[k] !== gold[k])).toEqual([]);
  expect(Object.keys(now).length).toBe(Object.keys(gold).length);
};

describe('MC3 eski = yeni: tek sınıflı savaşçılar', () => {
  it('altın taban kural sürümü 104 (KARAR104)', () => expect(A.surum).toBe(104));
  for (const v of [104, 105]) {
    it(`sürüm ${v}: ${Object.keys(A.savaslar).length} savaşçı tabandaki 104 ile aynı`, () => {
      setDefaultRuleVersion(v);
      same(combatantHashes(), A.savaslar);
    });
  }
  it('sürüm 103: tabandaki 103 ile aynı', () => {
    setDefaultRuleVersion(103);
    same(combatantHashes(), A.savaslar103);
  });
});

describe('MC3 eski = yeni: MC3 öncesi savaş kayıtları', () => {
  const load = (k: Kayit) => restoreSession(JSON.stringify({ version: k.version, savedAt: '2026-11-26T00:00:00.000Z', events: k.events }));
  it('sürüm 26 (KARAR104): olay günlüğü yeni kodla aynı duruma oynar; kayıt dosyası yüklenir', () => {
    expect(A.kayit.version).toBe(26);
    expect(A.kayit.son).toBe(A.kayit.oynatma);
    expect(replayHash(A.kayit.events)).toBe(A.kayit.oynatma);
    expect(load(A.kayit).ok).toBe(true);
  });
  it('sürüm 25 (f85717ea): olay günlüğü tabandakiyle aynı duruma oynar; kayıt dosyası yüklenir', () => {
    expect(A.kayit25.version).toBe(25);
    expect(replayHash(A.kayit25.events)).toBe(A.kayit25.oynatma);
    expect(load(A.kayit25).ok).toBe(true);
  });
});

describe(`MC3 eski = yeni: Çöl/Kale/Mağara/Orman imzası (${SEEDS} tohum)`, () => {
  const ids = ['col', 'kale', 'magara', 'orman'];
  it('104 = taban (104, KARAR104), 105 = 104 (tek sınıflı parti)', () => {
    const gold = A.imza[String(SEEDS)];
    for (const id of ids) {
      const s104 = signature(id, SEEDS, 104);
      const s105 = signature(id, SEEDS, 105);
      if (gold) expect(s104, id).toBe(gold[id]);
      expect(s105, id).toBe(s104);
    }
  }, 3_600_000);
});
