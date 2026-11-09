/**
 * Kuyruk K73e: sürüm 64'ün değişmediğinin regresyonu ve sürüm 65'in (YZ kazma ve dalış) bu senaryolarda 64 ile aynı olduğu
 * (kazıcı ve derin su savaşı yok). Dört senaryo (Çöl, Kale, Mağara, Orman; 3. seviye standart parti):
 * - Sürüm 64'ün imzası K73c/K73d altın imzalarıyla aynı (bu senaryolarda 64 = 63; `k73cRegresyon` altınları, K73c ölçümü).
 * - Sürüm 65 imzası 64 ile aynı.
 * Tohum sayısı varsayılan 1; tam ölçüm `K73E_TOHUM=30` (PowerShell: `$env:K73E_TOHUM=30; npx vitest run src/sim/k73eRegresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setupBattle } from './balance';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.K73E_TOHUM ?? 1);
const IDS = ['col', 'kale', 'magara', 'orman'] as const;
/** Sürüm 64 imzaları (`hash`): K73c altınlarıyla aynı (bu senaryolarda 64 = 63). */
const ALTIN_1: Record<string, string> = { col: '60c316337f70', kale: '1cfe61ee421e', magara: 'efae21cc4b01', orman: '65dd25f0c6f2' };
const ALTIN_30: Record<string, string> = { col: '707a1aba1b40', kale: '8cb560d75f44', magara: '53cf6a64fc39', orman: '59365cfe65f8' };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

function run(id: string, seed: number, ver: number) {
  setDefaultRuleVersion(ver);
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`senaryo yok: ${id}`);
  const rng = seeded(seed);
  return playBattle(setupBattle(s, rng, 3), rng, 20);
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
function signature(id: string, seeds: number, ver: number): string {
  let text = '';
  for (let seed = 1; seed <= seeds; seed++) {
    const end = run(id, seed, ver);
    const cs = Object.values(end.combatants).map((c) => `${c.id}:${c.hp}:${c.life}:${c.pos ? `${c.pos.col},${c.pos.row}` : '-'}:${c.altitudeFt ?? 0}`).sort();
    text += `${end.status}|${end.winner ?? ''}|${end.round}|${cs.join(';')}\n`;
  }
  return hash(text);
}

describe('K73e regresyon: sürüm 64 altın imzalarla aynı; sürüm 65 aynı imza', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum`, () => {
      const gold = SEEDS === 1 ? ALTIN_1[id] : SEEDS === 30 ? ALTIN_30[id] : undefined;
      const sig = signature(id, SEEDS, 64);
      console.log(`K73E_IMZA ${id} ${SEEDS} ${sig}`);
      if (gold) expect(sig, id).toBe(gold);
      expect(signature(id, SEEDS, 65), `${id} 65`).toBe(sig);
    }, 900_000);
  }
});
