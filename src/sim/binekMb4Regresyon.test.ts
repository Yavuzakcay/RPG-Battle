/**
 * Kuyruk MB4 (kural sürümü 72): çok altıgen anahtarı KAPALIYKEN sürüm 71'in değişmediği ve 72'nin 71 ile aynı olduğu, binekli
 * dört senaryoda (Çöl, Kale, Mağara, Orman; 3. seviye standart parti; partinin ilk üyesi savaş başında Warhorse'un üstünde):
 * - Sürüm 71'in imzası MB4 öncesi ağaçtan (`main` 95a1189) alınan altın imzalarla aynı.
 * - Sürüm 72 imzası 71 ile aynı.
 * Tohum sayısı varsayılan 1; tam ölçüm `BINEK_MB4_TOHUM=30` (PowerShell: `$env:BINEK_MB4_TOHUM=30; npx vitest run src/sim/binekMb4Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { mountedStart } from './binekStart';
import { playBattle, SCENARIOS, seeded, setupBattle } from './balance';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.BINEK_MB4_TOHUM ?? 1);
const IDS = ['col', 'kale', 'magara', 'orman'] as const;
/** Sürüm 71 imzaları (`hash`): MB4 öncesi ağaçtan. */
const ALTIN_1: Record<string, string> = { col: 'c3c285b62303', kale: 'c9e5665a294a', magara: '398894b22cf5', orman: 'b147dc655577' };
const ALTIN_30: Record<string, string> = { col: '4ac81c7dc804', kale: 'b1bcc2fa6844', magara: 'e57c6df85501', orman: '82bdd9f06480' };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

function run(id: string, seed: number, ver: number) {
  setDefaultRuleVersion(ver);
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`senaryo yok: ${id}`);
  const rng = seeded(seed);
  return playBattle(mountedStart(setupBattle(s, rng, 3)), rng, 20);
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
    const cs = Object.values(end.combatants).map((c) => `${c.id}:${c.hp}:${c.life}:${c.pos ? `${c.pos.col},${c.pos.row}` : '-'}:${c.altitudeFt ?? 0}:${c.riding ?? ''}`).sort();
    text += `${end.status}|${end.winner ?? ''}|${end.round}|${cs.join(';')}\n`;
  }
  return hash(text);
}

describe('MB4 regresyon (binekli, çok altıgen kapalı): sürüm 71 altın imzalarla aynı; sürüm 72 aynı imza', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum`, () => {
      const gold = SEEDS === 1 ? ALTIN_1[id] : SEEDS === 30 ? ALTIN_30[id] : undefined;
      const sig = signature(id, SEEDS, 71);
      console.log(`BINEK_MB4_IMZA ${id} ${SEEDS} ${sig}`);
      if (gold) expect(sig, id).toBe(gold);
      expect(signature(id, SEEDS, 72), `${id} 72`).toBe(sig);
    }, 900_000);
  }
});
