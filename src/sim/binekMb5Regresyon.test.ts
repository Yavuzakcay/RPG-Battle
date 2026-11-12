/**
 * Kuyruk MB5 (kural sürümü 73): YZ binicisi ve dar geçit kararı yalnız binicili/çok altıgenli savaşı etkiler. Dört senaryoda
 * (Çöl, Kale, Mağara, Orman; 3. seviye standart parti):
 * - Binekli olmayan savaşta sürüm 72 imzası MB5 öncesi ağaçtan (`main`) alınan altın imzayla aynı; sürüm 73 imzası 72 ile aynı.
 * - Binekli (çok altıgen kapalı; ilk üye Warhorse'un üstünde) savaşta 73 kararı 72 ile aynı sonuçlanır (binici zaten yürüyemiyordu).
 * Tohum sayısı varsayılan 1; tam ölçüm `BINEK_MB5_TOHUM=30` (PowerShell: `$env:BINEK_MB5_TOHUM=30; npx vitest run src/sim/binekMb5Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { mountedStart } from './binekStart';
import { playBattle, SCENARIOS, seeded, setupBattle } from './balance';
import type { BattleState } from '../battle/types';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.BINEK_MB5_TOHUM ?? 1);
const IDS = ['col', 'kale', 'magara', 'orman'] as const;
/** Sürüm 72 imzaları (`hash`), binekli olmayan savaş: MB5 öncesi ağaçtan (`main`). */
const ALTIN_1: Record<string, string> = { col: '766547832c08', kale: 'a606f6daa274', magara: '2c0e2b70154b', orman: '9db1e75286b7' };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

function run(id: string, seed: number, ver: number, mounted: boolean) {
  setDefaultRuleVersion(ver);
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`senaryo yok: ${id}`);
  const rng = seeded(seed);
  const start: BattleState = setupBattle(s, rng, 3);
  return playBattle(mounted ? mountedStart(start) : start, rng, 20);
}
/** FNV-1a (iki 32 bit tohum) → 12 onaltılık hane. */
function hash(text: string): string {
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    a = Math.imul(a ^ ch, 0x01000193) >>> 0;
    b = Math.imul(b ^ ch, 0x01000193) >>> 0;
  }
  return (a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0')).slice(0, 12);
}
function signature(id: string, seeds: number, ver: number, mounted: boolean): string {
  let text = '';
  for (let seed = 1; seed <= seeds; seed++) {
    const end = run(id, seed, ver, mounted);
    const cs = Object.values(end.combatants).map((c) => `${c.id}:${c.hp}:${c.life}:${c.pos ? `${c.pos.col},${c.pos.row}` : '-'}:${c.altitudeFt ?? 0}:${c.riding ?? ''}`).sort();
    text += `${end.status}|${end.winner ?? ''}|${end.round}|${cs.join(';')}\n`;
  }
  return hash(text);
}

describe('MB5 regresyon: sürüm 72 altın imzayla aynı; 73 = 72', () => {
  for (const id of IDS) {
    it(`${id} (binekli olmayan): ${SEEDS} tohum`, () => {
      const sig = signature(id, SEEDS, 72, false);
      console.log(`BINEK_MB5_IMZA ${id} ${SEEDS} ${sig}`);
      if (SEEDS === 1) expect(sig, id).toBe(ALTIN_1[id]);
      expect(signature(id, SEEDS, 73, false), `${id} 73`).toBe(sig);
    }, 900_000);
    it(`${id} (binekli, çok altıgen kapalı): 73 = 72`, () => {
      expect(signature(id, SEEDS, 73, true), `${id} 73`).toBe(signature(id, SEEDS, 72, true));
    }, 900_000);
  }
});
