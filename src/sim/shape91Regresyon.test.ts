/**
 * Görev WS91 (kural sürümü 91) hızlı regresyonu: dört senaryoda (5. seviye; WS91'in dokunduğu yollar: Wild Shape'li Druid
 * partisi iki senaryoda, Hover'lı Specter, canavar özellikli ve yetenekli düşmanlar) sürüm 89 imzası WS91'den önceki ağacın
 * (f458a3fc) altınıyla aynı kalır (eski kayıt, replay ve `--kural-surumu 89` aynen); sürüm 91 çökmeden oynar, imzası ve
 * zafer sayısı günlüğe yazılır.
 * Tohum varsayılan 3; ölçüm `SHAPE91_TOHUM=1|3` (PowerShell: `$env:SHAPE91_TOHUM=1; npx vitest run src/sim/shape91Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setPartyKind, setupBattle } from './balance';
import type { BattleState } from '../battle/types';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.SHAPE91_TOHUM ?? 3);
const LEVEL = 5;
/** Senaryo × parti (sabit düşman listeleri; denge turu senaryo dosyasını değiştirse de imza değişmez). */
const CASES = [
  { id: 'orman', parti: 'k18-druid', enemies: { 'swarm-of-rats': 2, 'swarm-of-insects': 1, cockatrice: 1, 'giant-frog': 2, 'giant-toad': 1 } },
  { id: 'magara', parti: 'buyucu', enemies: { wight: 1, specter: 2, 'gray-ooze': 1, ghoul: 1 } },
  { id: 'kale', parti: 'standart', enemies: { 'goblin-warrior': 4, 'goblin-minion': 3, 'hobgoblin-captain': 1, 'bandit-captain': 1 } },
  // Druid slotsuz başlar: yapay zekâ ilk turunda biçime girer (Wild Shape yolunu ölçer).
  { id: 'col', parti: 'k18-druid', slotsuz: true, enemies: { 'giant-scorpion': 2, 'death-dog': 2, 'giant-centipede': 3, 'gnoll-warrior': 2 } },
] as const;
/** Sürüm 89 imzaları, WS91'den önceki ağaçta (f458a3fc) ölçüldü. */
const ALTIN: Record<number, Record<string, string>> = {
  1: { orman: 'c939e6446845', magara: '91f8b97c2d81', kale: '1755a8be6361', col: '209b00b9a709' },
  3: { orman: 'd68513a8a10b', magara: '2510cb68fd8f', kale: 'b14a3c4b7782', col: '4d62451aa7de' },
};

afterEach(() => { setDefaultRuleVersion(CURRENT_RULES); setPartyKind('standart'); });

function run(c: (typeof CASES)[number], seed: number, ver: number): BattleState {
  setDefaultRuleVersion(ver);
  setPartyKind(c.parti);
  const s0 = SCENARIOS.find((x) => x.id === c.id);
  if (!s0) throw new Error(`senaryo yok: ${c.id}`);
  const { byLevel: _b, ...s } = { ...s0, enemies: { ...c.enemies } as Record<string, number> };
  const rng = seeded(seed);
  const start = setupBattle(s, rng, LEVEL);
  if (!('slotsuz' in c)) return playBattle(start, rng, 20);
  const combatants = Object.fromEntries(Object.entries(start.combatants).map(([id, x]) =>
    [id, x.features?.some((f) => f.effect.kind === 'wildShape') ? { ...x, spellSlots: x.spellSlots.map(() => 0) } : x]));
  return playBattle({ ...start, combatants }, rng, 20);
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
function signature(c: (typeof CASES)[number], seeds: number, ver: number): { sig: string; wins: number; shapes: number } {
  let text = '';
  let wins = 0;
  let shapes = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const end = run(c, seed, ver);
    if (end.winner === 'party') wins++;
    const cs = Object.values(end.combatants).map((x) => `${x.id}:${x.hp}:${x.life}:${x.pos ? `${x.pos.col},${x.pos.row}` : '-'}:${x.altitudeFt ?? 0}`).sort();
    shapes += Object.values(end.combatants).filter((x) => x.features?.some((f) => f.effect.kind === 'wildShape') && (x.resources.wildShape ?? 0) < 2).length;
    text += `${end.status}|${end.winner ?? ''}|${end.round}|${cs.join(';')}\n`;
  }
  return { sig: hash(text), wins, shapes };
}

describe('WS91 regresyon: sürüm 89 altın imzayla aynı; 91 çökmesiz', () => {
  for (const c of CASES) {
    it(`${c.id} (${c.parti}): ${SEEDS} tohum`, () => {
      const gold = ALTIN[SEEDS]?.[c.id];
      const v89 = signature(c, SEEDS, 89);
      console.log(`SHAPE91_IMZA ${c.id} ${SEEDS} 89 ${v89.sig} zafer ${v89.wins}/${SEEDS} biçim ${v89.shapes}`);
      if (gold) expect(v89.sig, `${c.id} 89`).toBe(gold);
      if (CURRENT_RULES >= 91) {
        const v91 = signature(c, SEEDS, 91);
        console.log(`SHAPE91_IMZA ${c.id} ${SEEDS} 91 ${v91.sig} zafer ${v91.wins}/${SEEDS} biçim ${v91.shapes} ${v91.sig === v89.sig ? '= 89' : '≠ 89'}`);
      }
    }, 1_800_000);
  }
});
