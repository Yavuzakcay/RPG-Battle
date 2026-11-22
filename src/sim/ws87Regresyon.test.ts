/**
 * Görev WS87 (kural sürümü 87) hızlı regresyonu: üç senaryoda (5. seviye `k18-druid` partisi: Wild Shape'li Druid; Barbed
 * Devil ve Medusa Multiattack seçenekleri, Polymorph/Wild Shape aktarımı) sürüm 86 imzası WS87'den önceki ağacın (15ad4633)
 * altınıyla aynı kalır (eski kayıt, replay ve `--kural-surumu 86` aynen); sürüm 87 çökmeden oynar, imzası ve zafer sayısı
 * günlüğe yazılır. Tohum varsayılan 3; ölçüm `WS87_TOHUM=1|3` (PowerShell: `$env:WS87_TOHUM=1; npx vitest run src/sim/ws87Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setPartyKind, setupBattle } from './balance';
import type { BattleState } from '../battle/types';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.WS87_TOHUM ?? 3);
const LEVEL = 5;
const IDS = ['col', 'kale', 'magara'] as const;
/** Sabit düşman listeleri (WS87'nin dokunduğu canavarlar); denge turu senaryo dosyasını değiştirse de imza değişmez. */
const PIN: Record<string, Record<string, number>> = {
  col: { 'barbed-devil': 1, 'gnoll-warrior': 2 },
  kale: { medusa: 1, bandit: 2 },
  magara: { 'barbed-devil': 1, medusa: 1 },
};
/** Sürüm 86 imzaları, WS87'den önceki ağaçta (15ad4633) ölçüldü. */
const ALTIN: Record<number, Record<string, string>> = {
  1: { col: '81136ec72735', kale: 'e428eb733dd6', magara: 'e975856760ac' },
  3: { col: '8e8241d137c6', kale: '572e12d10d04', magara: '8ac4cd5b9cdd' },
};

afterEach(() => { setDefaultRuleVersion(CURRENT_RULES); setPartyKind('standart'); });

function run(id: string, seed: number, ver: number): BattleState {
  setDefaultRuleVersion(ver);
  setPartyKind('k18-druid');
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

describe('WS87 regresyon: sürüm 86 altın imzayla aynı; 87 çökmesiz', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum`, () => {
      const gold = ALTIN[SEEDS]?.[id];
      const v86 = signature(id, SEEDS, 86);
      console.log(`WS87_IMZA ${id} ${SEEDS} 86 ${v86.sig} zafer ${v86.wins}/${SEEDS}`);
      if (gold) expect(v86.sig, `${id} 86`).toBe(gold);
      if (CURRENT_RULES >= 87) {
        const v87 = signature(id, SEEDS, 87);
        console.log(`WS87_IMZA ${id} ${SEEDS} 87 ${v87.sig} zafer ${v87.wins}/${SEEDS} ${v87.sig === v86.sig ? '= 86' : '≠ 86'}`);
      }
    }, 1_800_000);
  }
});
