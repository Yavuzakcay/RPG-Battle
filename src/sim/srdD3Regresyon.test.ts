/**
 * Görev D3 (kural sürümü 89) hızlı regresyonu: dört senaryoda (5. seviye; D3'ün dokunduğu yollar: Wild Shape'li Druid partisi,
 * Charmed/Frightened veren büyüleri olan büyücü ve ozan partileri; Undead ve durum bağışıklığı olan düşmanlar) sürüm 88
 * imzası D3'ten önceki ağacın (18d86fc8) altınıyla aynı kalır (eski kayıt, replay ve `--kural-surumu 88` aynen); sürüm 89
 * çökmeden oynar, imzası ve zafer sayısı günlüğe yazılır.
 * Tohum varsayılan 3; ölçüm `SRDD3_TOHUM=1|3` (PowerShell: `$env:SRDD3_TOHUM=1; npx vitest run src/sim/srdD3Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setPartyKind, setupBattle } from './balance';
import type { BattleState } from '../battle/types';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.SRDD3_TOHUM ?? 3);
const LEVEL = 5;
/** Senaryo × parti (sabit düşman listeleri; denge turu senaryo dosyasını değiştirse de imza değişmez). */
const CASES = [
  { id: 'orman', parti: 'k18-druid', enemies: { 'swarm-of-rats': 2, 'swarm-of-insects': 1, cockatrice: 1, 'giant-frog': 2, 'giant-toad': 1 } },
  { id: 'magara', parti: 'buyucu', enemies: { wight: 1, specter: 2, 'gray-ooze': 1, ghoul: 1 } },
  { id: 'kale', parti: 'k18-bard', enemies: { 'goblin-warrior': 4, 'goblin-minion': 3, 'hobgoblin-captain': 1, 'bandit-captain': 1 } },
  { id: 'col', parti: 'standart', enemies: { 'giant-scorpion': 2, 'death-dog': 2, 'giant-centipede': 3, 'gnoll-warrior': 2 } },
] as const;
/** Sürüm 88 imzaları, D3'ten önceki ağaçta (18d86fc8) ölçüldü. */
const ALTIN: Record<number, Record<string, string>> = {
  1: { orman: 'c939e6446845', magara: '91f8b97c2d81', kale: '46bf794f5f03', col: 'fc426ab339e7' },
  3: { orman: 'd68513a8a10b', magara: '3d020e9b7052', kale: 'a00c2e45dad6', col: '9cfa1b3921ef' },
};

afterEach(() => { setDefaultRuleVersion(CURRENT_RULES); setPartyKind('standart'); });

function run(c: (typeof CASES)[number], seed: number, ver: number): BattleState {
  setDefaultRuleVersion(ver);
  setPartyKind(c.parti);
  const s0 = SCENARIOS.find((x) => x.id === c.id);
  if (!s0) throw new Error(`senaryo yok: ${c.id}`);
  const { byLevel: _b, ...s } = { ...s0, enemies: { ...c.enemies } as Record<string, number> };
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
function signature(c: (typeof CASES)[number], seeds: number, ver: number): { sig: string; wins: number } {
  let text = '';
  let wins = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const end = run(c, seed, ver);
    if (end.winner === 'party') wins++;
    const cs = Object.values(end.combatants).map((x) => `${x.id}:${x.hp}:${x.life}:${x.pos ? `${x.pos.col},${x.pos.row}` : '-'}:${x.altitudeFt ?? 0}`).sort();
    text += `${end.status}|${end.winner ?? ''}|${end.round}|${cs.join(';')}\n`;
  }
  return { sig: hash(text), wins };
}

describe('D3 regresyon: sürüm 88 altın imzayla aynı; 89 çökmesiz', () => {
  for (const c of CASES) {
    it(`${c.id} (${c.parti}): ${SEEDS} tohum`, () => {
      const gold = ALTIN[SEEDS]?.[c.id];
      const v88 = signature(c, SEEDS, 88);
      console.log(`SRDD3_IMZA ${c.id} ${SEEDS} 88 ${v88.sig} zafer ${v88.wins}/${SEEDS}`);
      if (gold) expect(v88.sig, `${c.id} 88`).toBe(gold);
      if (CURRENT_RULES >= 89) {
        const v89 = signature(c, SEEDS, 89);
        console.log(`SRDD3_IMZA ${c.id} ${SEEDS} 89 ${v89.sig} zafer ${v89.wins}/${SEEDS} ${v89.sig === v88.sig ? '= 88' : '≠ 88'}`);
      }
    }, 1_800_000);
  }
});
