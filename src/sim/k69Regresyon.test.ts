/**
 * Kuyruk K69: sürüm 52 = sürüm 53 regresyonu (çok altıgen bayrağı kapalı: hiçbir şey değişmez). Dört senaryo (Çöl, Kale, Mağara,
 * Orman; 3. seviye standart parti) aynı tohumla iki kural sürümünde baştan sona oynanır; sonuç ve son durum (her savaşçının
 * canı, yaşamı, yeri, irtifası) birebir aynı olmalı. Tohum sayısı varsayılan 1 (test paketi hızlı kalsın); tam ölçüm
 * `K69_TOHUM=30` ortam değişkeniyle (PowerShell: `$env:K69_TOHUM=30; npx vitest run src/sim/k69Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setupBattle } from './balance';
import { bodyStats } from '../battle/body';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.K69_TOHUM ?? 1);
const IDS = ['col', 'kale', 'magara', 'orman'];

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

function signature(id: string, seed: number, ver: number): string {
  setDefaultRuleVersion(ver);
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`senaryo yok: ${id}`);
  const rng = seeded(seed);
  const end = playBattle(setupBattle(s, rng, 3), rng, 20);
  const cs = Object.values(end.combatants).map((c) => `${c.id}:${c.hp}:${c.life}:${c.pos ? `${c.pos.col},${c.pos.row}` : '-'}:${c.altitudeFt ?? 0}`).sort();
  return `${end.status}|${end.winner ?? ''}|${end.round}|${cs.join(';')}`;
}

describe('K69 regresyon: sürüm 52 = sürüm 53 (çok altıgen kapalı)', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum birebir aynı`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const before = bodyStats.multi;
        const now = signature(id, seed, 53);
        // Hızlı yol: bayrak kapalıyken çok altıgen yoluna hiç girilmez (Large/Huge canavarlı senaryolarda da).
        expect(bodyStats.multi, `${id} tohum ${seed}: çok altıgen yolu`).toBe(before);
        expect(now, `${id} tohum ${seed}`).toBe(signature(id, seed, 52));
      }
    }, 600_000);
  }
});
