/**
 * Görev AS1a (toplu; kural sürümü 77): alt soyun kurtarma dezavantajı yeni yollarda (`SaveCtx.genis`). Dört senaryo (Çöl,
 * Kale, Mağara, Orman; 3. seviye): standart parti 77 = 76; alt soylu parti (Dragonborn Red: soğuk kurtarma dezavantajı) çökmeden
 * oynar, farkı günlüğe yazılır. Tohum varsayılan 1; ölçüm `AS1A77_TOHUM=100`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setPartyRace, setupBattle } from './balance';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.AS1A77_TOHUM ?? 1);
const IDS = ['col', 'kale', 'magara', 'orman'] as const;
afterEach(() => { setDefaultRuleVersion(CURRENT_RULES); setPartyRace(null); });
function run(id: string, seed: number, ver: number) {
  setDefaultRuleVersion(ver);
  const s = SCENARIOS.find((x) => x.id === id)!;
  const rng = seeded(seed);
  return playBattle(setupBattle(s, rng, 3), rng, 20);
}
function hash(text: string): string {
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < text.length; i++) { const ch = text.charCodeAt(i); a = Math.imul(a ^ ch, 0x01000193) >>> 0; b = Math.imul(b ^ ch, 0x01000193) >>> 0; }
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
describe('AS1a regresyon: standart parti 77 = 76; alt soylu parti çökmeden', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum`, () => {
      const s76 = signature(id, SEEDS, 76);
      console.log(`AS1A77_IMZA ${id} ${SEEDS} ${s76}`);
      expect(signature(id, SEEDS, 77), `${id} 77`).toBe(s76);
      setPartyRace('dragonborn', 'red');
      const r76 = signature(id, SEEDS, 76), r77 = signature(id, SEEDS, 77);
      console.log(`AS1A77_RED ${id} ${SEEDS} 76=${r76} 77=${r77} ${r76 === r77 ? 'ayni' : 'farkli'}`);
      setPartyRace(null);
    }, 3_600_000);
  }
});
