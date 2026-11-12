/**
 * Kuyruk K74: sürüm 75 (Truesight motor yolları, Hallow toplu koruma) bu senaryolarda 74 ile aynı (yapay zekâ Gizlen kullanmaz,
 * koruma alanı yok); sürüm 76 (sinkMud bedeli) çamursuz haritalarda 75 ile aynı, Bataklık haritalarında çökmeden biter. Dört
 * klasik senaryo (Çöl, Kale, Mağara, Orman; 3. seviye standart parti) + dört Bataklık senaryosu. Tohum varsayılan 3; tam ölçüm
 * `K74_TOHUM=30` (PowerShell: `$env:K74_TOHUM=30; npx vitest run src/sim/k74Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setupBattle } from './balance';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.K74_TOHUM ?? 3);
const IDS = ['col', 'kale', 'magara', 'orman'] as const;
const SWAMP = ['k29-batak-kamp', 'k29-batak-cukur', 'k29-batak-kale', 'k29-batak-adalar'] as const;

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

function run(id: string, seed: number, ver: number) {
  setDefaultRuleVersion(ver);
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`senaryo yok: ${id}`);
  const rng = seeded(seed);
  return playBattle(setupBattle(s, rng, 3), rng, 20);
}
function signature(id: string, seeds: number, ver: number): string {
  let text = '';
  for (let seed = 1; seed <= seeds; seed++) {
    const end = run(id, seed, ver);
    const cs = Object.values(end.combatants).map((c) => `${c.id}:${c.hp}:${c.life}:${c.pos ? `${c.pos.col},${c.pos.row}` : '-'}:${c.conditions.join('+')}`).sort();
    text += `${end.status}|${end.winner ?? ''}|${end.round}|${cs.join(';')}\n`;
  }
  return text;
}

describe('K74 regresyon: 75 = 74; 76 = 75 çamursuz haritalarda', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum`, () => {
      const sig = signature(id, SEEDS, 74);
      expect(signature(id, SEEDS, 75), `${id} 75`).toBe(sig);
      expect(signature(id, SEEDS, 76), `${id} 76`).toBe(sig);
    }, 900_000);
  }
});

describe('K74 regresyon: Bataklık senaryoları (75 = 74; 76 çökmeden biter)', () => {
  for (const id of SWAMP) {
    it(`${id}: ${SEEDS} tohum`, () => {
      expect(signature(id, SEEDS, 75), `${id} 75`).toBe(signature(id, SEEDS, 74));
      for (let seed = 1; seed <= SEEDS; seed++) expect(['finished', 'active'], `${id} 76 #${seed}`).toContain(run(id, seed, 76).status);
    }, 900_000);
  }
});
