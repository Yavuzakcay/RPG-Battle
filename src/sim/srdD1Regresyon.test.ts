/**
 * Görev D1 (kural sürümü 86) hızlı regresyonu: dört senaryoda (5. seviye standart parti; D1'den etkilenen canavarlarla:
 * Death Dog, goblinoidler, Undead, Giant Centipede, sürüler, Gray Ooze, Cockatrice, Giant Frog/Toad) sürüm 85 imzası
 * D1'den önceki ağacın (a26ef5c3) altınıyla aynı kalır (eski kayıt, replay ve `--kural-surumu 85` aynen); sürüm 86 çökmeden
 * oynar, imzası ve zafer sayısı günlüğe yazılır (fark beklenir: tür, bağışıklık, puan, yutma).
 * Tohum varsayılan 3; ölçüm `SRDD1_TOHUM=1|3|10` (PowerShell: `$env:SRDD1_TOHUM=10; npx vitest run src/sim/srdD1Regresyon.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { playBattle, SCENARIOS, seeded, setupBattle } from './balance';
import type { BattleState } from '../battle/types';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.SRDD1_TOHUM ?? 3);
const LEVEL = 5;
const IDS = ['col', 'kale', 'magara', 'orman'] as const;
/** Sabit düşman listeleri (D1'in dokunduğu canavarlar); denge turu senaryo dosyasını değiştirse de imza değişmez. */
const PIN: Record<string, Record<string, number>> = {
  col: { 'giant-scorpion': 2, 'death-dog': 2, 'giant-centipede': 3, 'gnoll-warrior': 2 },
  kale: { 'goblin-warrior': 4, 'goblin-minion': 3, 'hobgoblin-captain': 1, 'bandit-captain': 1 },
  magara: { wight: 1, specter: 2, 'gray-ooze': 1, ghoul: 1 },
  orman: { 'swarm-of-rats': 2, 'swarm-of-insects': 1, cockatrice: 1, 'giant-frog': 2, 'giant-toad': 1 },
};
/** Sürüm 85 imzaları, D1'den önceki ağaçta (a26ef5c3) ölçüldü. */
const ALTIN: Record<number, Record<string, string>> = {
  1: { col: '5dfc29f297e6', kale: '5ec20c096d0d', magara: '6f533d569f09', orman: 'e4597b48ee6b' },
  3: { col: 'e9bbed6d684c', kale: '03666ff49530', magara: '2255fa6c3dd8', orman: 'aee12d6ce842' },
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

/** Kurulumdaki savaş (zar yok): D1 değerleri 86'da etkin, 85'te eski (imza aynı kalsa bile düzeltme simülasyona girer). */
function setup(id: string, ver: number): BattleState {
  setDefaultRuleVersion(ver);
  const s0 = SCENARIOS.find((x) => x.id === id);
  if (!s0) throw new Error(`senaryo yok: ${id}`);
  const { byLevel: _b, ...s } = { ...s0, enemies: PIN[id] ?? s0.enemies };
  return setupBattle(s, seeded(1), LEVEL);
}
const foe = (st: BattleState, monsterId: string) => Object.values(st.combatants).find((c) => c.monsterId === monsterId);

describe('D1 regresyon: kurulumda 86 değerleri, 85 eski', () => {
  it('tür, durum bağışıklığı, yetenek puanı, kurtarma', () => {
    const k86 = setup('kale', 86); const k85 = setup('kale', 85);
    expect(foe(k86, 'goblin-warrior')?.creatureType).toBe('fey');
    expect(foe(k85, 'goblin-warrior')?.creatureType).toBe('humanoid');
    expect(foe(k86, 'bandit-captain')?.saves.wis).toBe(2);
    expect(foe(k85, 'bandit-captain')?.saves.wis).toBe(0);
    const imm = (c: ReturnType<typeof foe>) => (c?.effects ?? []).flatMap((e) => e.immune ?? []);
    expect(imm(foe(setup('orman', 86), 'swarm-of-rats'))).toContain('Prone');
    expect(imm(foe(setup('orman', 85), 'swarm-of-rats'))).toEqual([]);
    expect(foe(setup('col', 86), 'giant-centipede')?.modifiers.str).toBe(-3);
    expect(foe(setup('col', 85), 'giant-centipede')?.modifiers.str).toBe(0);
    expect(foe(setup('magara', 86), 'specter')?.creatureType).toBe('undead');
    expect(foe(setup('magara', 85), 'specter')?.creatureType).toBe('celestial');
  });
});

describe('D1 regresyon: sürüm 85 altın imzayla aynı; 86 çökmesiz', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum`, () => {
      const gold = ALTIN[SEEDS]?.[id];
      const v85 = signature(id, SEEDS, 85);
      console.log(`SRDD1_IMZA ${id} ${SEEDS} 85 ${v85.sig} zafer ${v85.wins}/${SEEDS}`);
      if (gold) expect(v85.sig, `${id} 85`).toBe(gold);
      if (CURRENT_RULES >= 86) {
        const v86 = signature(id, SEEDS, 86);
        console.log(`SRDD1_IMZA ${id} ${SEEDS} 86 ${v86.sig} zafer ${v86.wins}/${SEEDS} ${v86.sig === v85.sig ? '= 85' : '≠ 85'}`);
      }
    }, 1_800_000);
  }
});
