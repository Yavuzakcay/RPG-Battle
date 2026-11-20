/**
 * Mekanik matris düzeltmeleri (kural sürümü 83) hızlı regresyonu: dört senaryoda (Çöl, Kale, Mağara, Orman; 5. seviye
 * standart parti) sürüm 82 imzası düzeltmelerden önceki ağacın altınıyla aynı kalır (eski kayıt ve replay aynen); sürüm 83
 * çökmeden oynar, imzası ve zafer sayısı günlüğe yazılır (fark beklenebilir: Restrained DEX save dezavantajı vb.).
 * Tohum varsayılan 1; ölçüm `MATRIS_TOHUM=10` (PowerShell: `$env:MATRIS_TOHUM=10; npx vitest run src/sim/matrisRegresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setupBattle } from './balance';
import type { BattleState } from '../battle/types';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.MATRIS_TOHUM ?? 1);
const LEVEL = 5;
const IDS = ['col', 'kale', 'magara', 'orman'] as const;
/**
 * Düşman listeleri sabit: altınların ölçüldüğü ağacın (3116efd) 5. seviye listeleri. Denge turu `data/sim-senaryolar.json`'ı
 * değiştirse de imza değişmez (yalnız motor farkını ölçer).
 */
const PIN: Record<string, Record<string, number>> = {
  col: { 'giant-scorpion': 3, mummy: 3, manticore: 2, 'gnoll-warrior': 4, 'giant-hyena': 1, scout: 2, 'death-dog': 1 },
  kale: { 'hobgoblin-warrior': 3, 'goblin-warrior': 4, 'hobgoblin-captain': 1, 'bugbear-stalker': 1, berserker: 2, 'warrior-veteran': 2, 'bugbear-warrior': 1 },
  magara: { troll: 1, 'giant-spider': 2, ghoul: 1, darkmantle: 1, ettercap: 1, ogre: 2 },
  orman: { owlbear: 2, werewolf: 2, 'giant-spider': 3, 'dire-wolf': 3, ettercap: 2, wolf: 2 },
};
/** Sürüm 82 imzaları, düzeltmelerden önceki ağaçta (3116efd) ölçüldü. */
const ALTIN_1: Record<string, string> = { col: '59c8902f4a10', kale: '899777217ec5', magara: '0973bb2c4ac4', orman: '2fccd98fbd52' };
const ALTIN_3: Record<string, string> = { col: 'd0dfe3867d71', kale: '4cfaaa44acaa', magara: 'e51d7bdd6201', orman: 'bf14c67cbddb' };
const ALTIN_10: Record<string, string> = { col: '7941ed30b8d3', kale: '245fdef426d3', magara: '3f5a17e6f187', orman: '1a5c6b93af3f' };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

function run(id: string, seed: number, ver: number): BattleState {
  setDefaultRuleVersion(ver);
  const s0 = SCENARIOS.find((x) => x.id === id);
  if (!s0) throw new Error(`senaryo yok: ${id}`);
  const { byLevel: _b, ...s } = { ...s0, enemies: PIN[id] ?? s0.enemies };
  const rng = seeded(seed);
  return playBattle(setupBattle(s, rng, LEVEL), rng, 20);
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
function signature(id: string, seeds: number, ver: number): { sig: string; wins: number } {
  let text = '';
  let wins = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const end = run(id, seed, ver);
    if (end.winner === 'party') wins++;
    const cs = Object.values(end.combatants).map((c) => `${c.id}:${c.hp}:${c.life}:${c.pos ? `${c.pos.col},${c.pos.row}` : '-'}:${c.altitudeFt ?? 0}`).sort();
    text += `${end.status}|${end.winner ?? ''}|${end.round}|${cs.join(';')}\n`;
  }
  return { sig: hash(text), wins };
}

describe('Matris regresyon: sürüm 82 altın imzayla aynı; 83 çökmesiz', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum`, () => {
      const gold = SEEDS === 1 ? ALTIN_1[id] : SEEDS === 3 ? ALTIN_3[id] : SEEDS === 10 ? ALTIN_10[id] : undefined;
      const v82 = signature(id, SEEDS, 82);
      console.log(`MATRIS_IMZA ${id} ${SEEDS} 82 ${v82.sig} zafer ${v82.wins}/${SEEDS}`);
      if (gold) expect(v82.sig, `${id} 82`).toBe(gold);
      if (CURRENT_RULES >= 83) {
        const v83 = signature(id, SEEDS, 83);
        console.log(`MATRIS_IMZA ${id} ${SEEDS} 83 ${v83.sig} zafer ${v83.wins}/${SEEDS} ${v83.sig === v82.sig ? '= 82' : '≠ 82'}`);
      }
    }, 1_800_000);
  }
});
