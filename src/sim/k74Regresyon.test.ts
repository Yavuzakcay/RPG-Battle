/**
 * Kuyruk K74: Truesight motor yolları + Hallow toplu koruma (75) ve batıran çamur bedeli (76) dört senaryoda (Çöl, Kale,
 * Mağara, Orman; 3. seviye standart parti) imzayı değiştirmez: 74 = MB2 altınları, 75 = 76 = 74. Tohum varsayılan 1; tam ölçüm
 * `K74_TOHUM=100` (PowerShell: `$env:K74_TOHUM=100; npx vitest run src/sim/k74Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { mountedStart } from './binekStart';
import { playBattle, SCENARIOS, seeded, setupBattle } from './balance';
import type { BattleState } from '../battle/types';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.K74_TOHUM ?? 1);
const IDS = ['col', 'kale', 'magara', 'orman'] as const;
/** Sürüm 74 imzaları (`hash`), binekli olmayan savaş: MB2 altınlarıyla aynı (bu senaryolarda 74 = 73). */
const ALTIN_1: Record<string, string> = { col: '766547832c08', kale: 'a606f6daa274', magara: '2c0e2b70154b', orman: '9db1e75286b7' };
const ALTIN_30: Record<string, string> = { col: '68cbf77b0d09', kale: 'db2fbc433ec4', magara: 'e1ef97b8775a', orman: '9bb70c8251c7' };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

type Mode = 'yok' | 'bagimsiz' | 'kontrollu';
function run(id: string, seed: number, ver: number, mode: Mode) {
  setDefaultRuleVersion(ver);
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`senaryo yok: ${id}`);
  const rng = seeded(seed);
  const start: BattleState = setupBattle(s, rng, 3);
  return playBattle(mode === 'yok' ? start : mountedStart(start, { control: mode === 'kontrollu' }), rng, 20);
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
function signature(id: string, seeds: number, ver: number, mode: Mode): string {
  let text = '';
  for (let seed = 1; seed <= seeds; seed++) {
    const end = run(id, seed, ver, mode);
    const cs = Object.values(end.combatants).map((c) => `${c.id}:${c.hp}:${c.life}:${c.pos ? `${c.pos.col},${c.pos.row}` : '-'}:${c.altitudeFt ?? 0}:${c.riding ?? ''}`).sort();
    text += `${end.status}|${end.winner ?? ''}|${end.round}|${cs.join(';')}\n`;
  }
  return hash(text);
}

describe('K74 regresyon: sürüm 74 altın imzayla aynı (MB2 altınları); 75 ve 76 = 74 (bu senaryolarda Truesight\'lı gizlenme, Hallow ve çamur yok)', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum`, () => {
      const gold = SEEDS === 1 ? ALTIN_1[id] : SEEDS === 30 ? ALTIN_30[id] : undefined;
      const sig = signature(id, SEEDS, 74, 'yok');
      console.log(`K74_IMZA ${id} ${SEEDS} ${sig}`);
      if (gold) expect(sig, id).toBe(gold);
      expect(signature(id, SEEDS, 75, 'yok'), `${id} 75`).toBe(sig);
      expect(signature(id, SEEDS, 76, 'yok'), `${id} 76`).toBe(sig);
    }, 1_800_000);
  }
});
