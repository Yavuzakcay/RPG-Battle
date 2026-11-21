/**
 * Görev D2 (kural sürümü 88) hızlı regresyonu: savaş sırasında canavar eklenen dört senaryoda (5. seviye standart parti:
 * Ork Kampı boynuz takviyesi, Kemik Açıklığı iskeletleri, Vaha kum pususu, Mağara Karakolu kat değişimi) sürüm 87 imzası
 * D2'den önceki ağacın (083e4b93) altınıyla aynı kalır (eski kayıt, replay ve `--kural-surumu 87` aynen); sürüm 88 çökmeden
 * oynar, imzası, zafer sayısı ve savaşta eklenen canavar sayısı günlüğe yazılır.
 * Tohum varsayılan 3; ölçüm `SRDD2_TOHUM=1|3` (PowerShell: `$env:SRDD2_TOHUM=1; npx vitest run src/sim/srdD2Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setupBattle } from './balance';
import type { BattleState } from '../battle/types';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.SRDD2_TOHUM ?? 3);
const LEVEL = 5;
const IDS = ['orman-ork', 'orman-kemik', 'k29-col-vaha', 'derin-karakol'] as const;
/** Sabit düşman listeleri (senaryoların 5. seviye listeleri, D2 anında); denge turu senaryo dosyasını değiştirse de imza değişmez. */
const PIN: Record<string, Record<string, number>> = {
  'orman-ork': { 'tough-boss': 1, berserker: 3, tough: 3, worg: 2 },
  'orman-kemik': { wight: 1, ghoul: 3, skeleton: 4, owlbear: 1 },
  'k29-col-vaha': { 'gnoll-warrior': 4, lion: 2, 'giant-hyena': 1 },
  'derin-karakol': { bandit: 6, 'bandit-captain': 2, skeleton: 4, ghoul: 2 },
};
/** Sürüm 87 imzaları, D2'den önceki ağaçta (083e4b93) ölçüldü. */
const ALTIN: Record<number, Record<string, string>> = {
  1: { 'orman-ork': '3274e4d0c263', 'orman-kemik': 'b9b1bea597dc', 'k29-col-vaha': '67fe62a425ae', 'derin-karakol': 'd9abdf0cc6f9' },
  3: { 'orman-ork': '299617a2c53f', 'orman-kemik': '093c31c6f491', 'k29-col-vaha': 'd95679fc8e3d', 'derin-karakol': 'c1c12a499c79' },
};
/** Savaşta eklenen canavar (takviye, kemik yığını, kum pususu, kat). */
const LATE = /^(takviye-|kemik-|kum-solucani|kat-)/;

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
function signature(id: string, seeds: number, ver: number): { sig: string; wins: number; late: number } {
  let text = '';
  let wins = 0;
  let late = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const end = run(id, seed, ver);
    if (end.winner === 'party') wins++;
    late += Object.keys(end.combatants).filter((k) => LATE.test(k)).length;
    const cs = Object.values(end.combatants).map((c) => `${c.id}:${c.hp}:${c.life}:${c.pos ? `${c.pos.col},${c.pos.row}` : '-'}:${c.altitudeFt ?? 0}`).sort();
    text += `${end.status}|${end.winner ?? ''}|${end.round}|${cs.join(';')}\n`;
  }
  return { sig: hash(text), wins, late };
}

describe('D2 regresyon: sürüm 87 altın imzayla aynı; 88 çökmesiz', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum`, () => {
      const gold = ALTIN[SEEDS]?.[id];
      const v87 = signature(id, SEEDS, 87);
      console.log(`SRDD2_IMZA ${id} ${SEEDS} 87 ${v87.sig} zafer ${v87.wins}/${SEEDS} eklenen ${v87.late}`);
      if (gold) expect(v87.sig, `${id} 87`).toBe(gold);
      if (CURRENT_RULES >= 88) {
        const v88 = signature(id, SEEDS, 88);
        console.log(`SRDD2_IMZA ${id} ${SEEDS} 88 ${v88.sig} zafer ${v88.wins}/${SEEDS} eklenen ${v88.late} ${v88.sig === v87.sig ? '= 87' : '≠ 87'}`);
      }
    }, 1_800_000);
  }
});
