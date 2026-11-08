/**
 * Kuyruk K68c: sürüm 51 = sürüm 52 regresyonu (iki uç zeminde görüş hattı değişmez). Dört senaryo (Çöl, Kale, Mağara,
 * Orman; 3. seviye standart parti) aynı tohumla iki kural sürümünde baştan sona oynanır; sonuç ve son durum (her savaşçının
 * canı, yaşamı, yeri, irtifası) birebir aynı olmalı. Tohum sayısı varsayılan 1 (test paketi hızlı kalsın); tam ölçüm
 * `K68C_TOHUM=30` ortam değişkeniyle (PowerShell: `$env:K68C_TOHUM=30; npx vitest run src/sim/k68cRegresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setupBattle } from './balance';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.K68C_TOHUM ?? 1);
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

describe('K68c regresyon: sürüm 51 = sürüm 52 (zemindeki savaşlar)', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum birebir aynı`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) expect(signature(id, seed, 52), `${id} tohum ${seed}`).toBe(signature(id, seed, 51));
    }, 600_000);
  }
});
