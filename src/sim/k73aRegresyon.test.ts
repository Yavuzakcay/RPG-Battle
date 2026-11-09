/**
 * Kuyruk K73a: sürüm 61'in değişmediğinin regresyonu ve sürüm 62'nin (YZ dikey taktiği) çökmezliği. Dört senaryo (Çöl, Kale,
 * Mağara, Orman; 3. seviye standart parti) aynı tohumla:
 * - Sürüm 60 ve 61 baştan sona aynı sonuç ve son durum. K73a'nın bütün kararları 62+'ya kapılı; 61'in eski kodla birebir
 *   aynılığı K73a'da eski ağaçla imza karşılaştırmasıyla ölçüldü (DECISIONS.md).
 * - Sürüm 62 çökmeden biter (sonuç farklı olabilir: yeni taktik).
 * Tohum sayısı varsayılan 1; tam ölçüm `K73A_TOHUM=30` (PowerShell: `$env:K73A_TOHUM=30; npx vitest run src/sim/k73aRegresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setupBattle } from './balance';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.K73A_TOHUM ?? 1);
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

describe('K73a regresyon: sürüm 60 = sürüm 61; sürüm 62 çökmeden biter', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        expect(signature(id, seed, 61), `${id} tohum ${seed}`).toBe(signature(id, seed, 60));
        expect(signature(id, seed, 62)).toMatch(/^(finished|active)\|/);
      }
    }, 900_000);
  }
});
