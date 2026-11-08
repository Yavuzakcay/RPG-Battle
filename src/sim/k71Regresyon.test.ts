/**
 * Kuyruk K71a: sürüm 55 = sürüm 56 regresyonu. Dört senaryo (Çöl, Kale, Mağara, Orman; 3. seviye standart parti) aynı tohumla
 * iki kural sürümünde baştan sona oynanır; sonuç ve son durum (her savaşçının canı, yaşamı, yeri, irtifası) birebir aynı
 * olmalı. Bu senaryolarda uçan (irtifası > 0 olan) savaşçı yok, haritalar katmansız ve altıgen tavanı yok: K71a'nın üç yolu
 * (uçanın engel aşması, irtifalı görüşte zemin/çatı, altıgen tavanı) tetiklenmez; Mağara'nın varyant tavanı (20 ft) ve duvar
 * tepesi (20 ft; harf tablosu K68c değeriyle aynı) değişmez. Tohum sayısı varsayılan 1; tam ölçüm `K71_TOHUM=30`
 * (PowerShell: `$env:K71_TOHUM=30; npx vitest run src/sim/k71Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setupBattle } from './balance';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.K71_TOHUM ?? 1);
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

describe('K71a regresyon: sürüm 55 = sürüm 56 (standart parti)', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum birebir aynı`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) expect(signature(id, seed, 56), `${id} tohum ${seed}`).toBe(signature(id, seed, 55));
    }, 600_000);
  }
});
