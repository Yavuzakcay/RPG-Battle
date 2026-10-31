/**
 * Kuyruk 26: yükseklikli sahne simülasyonu (fikstür `yukseklik-sahnesi`: düşman okçular platoda, parti zeminde).
 * Yükseklik mekanikleri açık ve kapalı (Game Master anahtarlarının sim varsayılanı) iki yönde. Varsayılan 4 tohum (hızlı
 * denetim); ölçüm için `K26_TOHUM=20 npx vitest run src/sim/heightScene.test.ts` (PowerShell: `$env:K26_TOHUM=20`).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../map/maps', async (importOriginal) => (await import('../map/fixtures/yukseklikSahnesi')).withYukseklik(await importOriginal()));
import { simulate, type Scenario } from './balance';
import { setDefaultRuleToggles } from '../battle/ruleControl';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.K26_TOHUM ?? 4);
const SCENE: Scenario = {
  id: 'yukseklik-sahnesi', name: 'Yükseklik sahnesi (platodaki okçular)',
  map: { mapId: 'yukseklik-sahnesi', variantId: 'varsayilan' },
  enemies: { scout: 2, bandit: 3, 'bandit-captain': 1 },
};
const OFF = { heightMove: false, heightFall: false, heightCombat: false, heightSight: false, heightShow: false };

function rate(toggles: Record<string, boolean>): { wins: number; rounds: number } {
  setDefaultRuleToggles(toggles);
  let wins = 0; let rounds = 0;
  for (let i = 1; i <= SEEDS; i++) { const r = simulate(SCENE, i, 20, 3); if (r.winner === 'party') wins++; rounds += r.rounds; }
  return { wins, rounds: rounds / SEEDS };
}

describe('K26: yükseklikli sahne (sim, açık/kapalı)', () => {
  afterEach(() => setDefaultRuleToggles({}));
  it('iki yönde oynanır; sonuçlar tekrarlanabilir', () => {
    const on = rate({});
    const off = rate(OFF);
    console.log(`K26 sahne ${SEEDS} tohum, 3. sv: açık ${on.wins}/${SEEDS} (ort. ${on.rounds.toFixed(1)} tur), kapalı ${off.wins}/${SEEDS} (ort. ${off.rounds.toFixed(1)} tur)`);
    expect(rate({})).toEqual(on);
    expect(on.rounds).toBeGreaterThan(0);
    expect(off.rounds).toBeGreaterThan(0);
  }, 300000);
});
