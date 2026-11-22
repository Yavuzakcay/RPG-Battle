/**
 * Hazırla (Ready, kural sürümü 90) hızlı regresyonu: yapay zekâ Ready kullanmadığı için dört senaryoda (5. seviye standart
 * parti: Çöl, Kale, Mağara, Orman) sürüm 89 imzası Ready'den önceki ağacın (61610a31, D3 dahil) altınıyla aynı, sürüm 90
 * imzası da 89 ile aynı kalır. Tohum varsayılan 3 (PowerShell: `$env:READY_TOHUM=3; npx vitest run src/sim/readyRegresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setupBattle } from './balance';
import type { BattleState } from '../battle/types';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.READY_TOHUM ?? 3);
const LEVEL = 5;
const IDS = ['col', 'kale', 'magara', 'orman'] as const;
/** Sabit düşman listeleri (senaryoların 5. seviye listeleri, Ready anında). */
const PIN: Record<string, Record<string, number>> = {
  col: { 'giant-scorpion': 2, mummy: 2, manticore: 2, 'gnoll-warrior': 4, 'giant-hyena': 1, scout: 2, 'death-dog': 1 },
  kale: { 'hobgoblin-warrior': 4, 'goblin-warrior': 4, 'hobgoblin-captain': 1, 'bugbear-stalker': 1, berserker: 3, 'warrior-veteran': 2, 'bugbear-warrior': 2 },
  magara: { troll: 1, 'giant-spider': 2, ghoul: 1, darkmantle: 1, ettercap: 1, ogre: 1, grimlock: 1 },
  orman: { owlbear: 2, werewolf: 2, 'giant-spider': 3, 'dire-wolf': 3, ettercap: 2, wolf: 2 },
};
/** Sürüm 89 imzaları, Ready'den önceki ağaçta (61610a31, D3 dahil) ölçüldü. */
const ALTIN: Record<number, Record<string, string>> = {
  3: { col: '1a4b008fc060', kale: '3a9715fbac19', magara: '48de8c404fb2', orman: '34539a82060c' },
};

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

describe('Ready regresyon: sürüm 89 altınla aynı; 90 = 89 (yapay zekâ Ready kullanmaz)', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum`, () => {
      const gold = ALTIN[SEEDS]?.[id];
      const v89 = signature(id, SEEDS, 89);
      console.log(`READY_IMZA ${id} ${SEEDS} 89 ${v89.sig} zafer ${v89.wins}/${SEEDS}`);
      if (gold) expect(v89.sig, `${id} 89`).toBe(gold);
      if (CURRENT_RULES >= 90) {
        const v90 = signature(id, SEEDS, 90);
        console.log(`READY_IMZA ${id} ${SEEDS} 90 ${v90.sig} zafer ${v90.wins}/${SEEDS}`);
        expect(v90.sig, `${id} 90 = 89`).toBe(v89.sig);
      }
    }, 1_800_000);
  }
});
