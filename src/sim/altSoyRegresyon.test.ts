/**
 * Kuyruk AS1b: sürüm 70'in değişmediğinin ve sürüm 71'in (alt soy mekaniği) alt soysuz savaşta 70 ile aynı olduğunun regresyonu.
 * Dört senaryo (Çöl, Kale, Mağara, Orman; 3. seviye standart parti):
 * - Sürüm 70 imzası AS1b öncesi ağaçtan (`main` e51ad648 üstü) alınan altın imzalarla aynı .
 * - Parti Human'a çevrilince (alt soy yok) sürüm 71 imzası sürüm 70 ile aynı.
 * - Alt soylu parti sürüm 71'de sürüm 70'ten farklı oynar (en az bir senaryoda).
 * Tohum sayısı varsayılan 1; tam ölçüm `ALTSOY_TOHUM=30` (PowerShell: `$env:ALTSOY_TOHUM=30; npx vitest run src/sim/altSoyRegresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setPartyRace, setupBattle } from './balance';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.ALTSOY_TOHUM ?? 1);
const IDS = ['col', 'kale', 'magara', 'orman'] as const;
/** Sürüm 70 imzaları (`hash`): AS1b öncesi ağaçtan. */
const ALTIN_1: Record<string, string> = { col: '60c316337f70', kale: '1cfe61ee421e', magara: 'efae21cc4b01', orman: '65dd25f0c6f2' };
const ALTIN_30: Record<string, string> = { col: '707a1aba1b40', kale: '8cb560d75f44', magara: '53cf6a64fc39', orman: '59365cfe65f8' };
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
describe('AS1b regresyon: sürüm 70 altın imzalarla aynı; 71 alt soysuz savaşta 70 ile aynı; alt soylu partide fark', () => {
  const diffs: string[] = [];
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum`, () => {
      const gold = SEEDS === 1 ? ALTIN_1[id] : SEEDS === 30 ? ALTIN_30[id] : undefined;
      const s70 = signature(id, SEEDS, 70);
      console.log(`ALTSOY_IMZA ${id} ${SEEDS} ${s70}`);
      if (gold) expect(s70, `${id} 70 altın`).toBe(gold);
      // Alt soysuz parti (hepsi Human, soy seçilmemiş): 71 = 70.
      setPartyRace('human');
      expect(signature(id, SEEDS, 71), `${id} alt soysuz 71`).toBe(signature(id, SEEDS, 70));
      // Alt soylu parti (hepsi Drow: gün ışığında saldırı dezavantajı): 71'de 70'ten farklı.
      setPartyRace('elf', 'drow');
      if (signature(id, SEEDS, 71) !== signature(id, SEEDS, 70)) diffs.push(id);
      setPartyRace(null);
    }, 1_800_000);
  }
  it('alt soylu (Drow) parti sürüm 71\'de 70\'ten farklı oynar (en az bir gündüz senaryosunda); sürüm 70\'te alt soy etkisi yok', () => {
    expect(diffs.length).toBeGreaterThan(0);
  });
});
