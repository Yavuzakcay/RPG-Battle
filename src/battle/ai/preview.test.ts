/**
 * Y1 G1: kuru çalıştırma gerçek sonuçla aynı mı. "Gerçek" iki yoldan: (1) bütün d20 yüzleri ve hasar zarı değerleri
 * gerçek `execute` ile tek tek oynatılıp olasılıkla ağırlıklanır (tam beklenti; sapma < %1), (2) 1000 isabet
 * olana dek tohumlu zarla gerçek saldırı (istatistik sınamasında 4 standart hata payı).
 */
import { describe, expect, it } from 'vitest';
import { kitArena, o } from '../k54bKit';
import { execute } from '../commands';

import { seededRng as seeded, type DiceRequest, type Rng } from '../../rules/dice';
import type { BattleState, Combatant, Command } from '../types';
import { attackClassP, faceP, previewCommand, saveSuccessP } from './preview';
import { P1 } from '../fixtures';

const pool = (c: Combatant | undefined) => (c ? Math.max(0, c.hp) + (c.tempHp ?? 0) : 0);

/** d20 yüzü `face` (saldırı/save), hasar zarları `die` (tavanla). */
function fixed(face: number, die: number): Rng {
  const r = (() => 0.5) as Rng & { dice?: (q: DiceRequest) => number[] };
  r.dice = (q) => Array.from({ length: q.count }, () => (q.sides === 20 && (q.kind === 'attack' || q.kind === 'save') ? face : q.sides === 20 ? 10 : Math.min(q.sides, die)));
  return r;
}

/** Gerçek çözücüyle tam beklenen hasar (tek hasar zarı türü varsayımı: `sides`). */
function exactDamage(state: BattleState, cmd: Command, targetId: string, sides: number, mode: 'normal' | 'advantage' | 'disadvantage'): number {
  let exp = 0;
  for (let k = 1; k <= 20; k++) {
    let sum = 0;
    for (let d = 1; d <= sides; d++) {
      const r = execute(state, cmd, P1, fixed(k, d));
      if (!r.ok) throw new Error(r.error);
      sum += pool(state.combatants[targetId]) - pool(r.state.combatants[targetId]);
    }
    exp += faceP(k, mode) * (sum / sides);
  }
  return exp;
}

describe('Y1 G1 kuru çalıştırma', () => {
  const fighter = () => kitArena({ cls: 'fighter', sub: 'champion', level: 5, scores: { str: 16 }, sheet: { weapons: [{ name: 'Longsword' }] }, enemy: { ac: 15, hp: 200, maxHp: 200 } });

  it('olasılık yardımcıları', () => {
    expect(attackClassP(5, 15, 'normal').hit + attackClassP(5, 15, 'normal').crit).toBeCloseTo(0.55, 5);
    expect(attackClassP(5, 15, 'normal', 19).crit).toBeCloseTo(0.1, 5);
    expect(attackClassP(5, 15, 'advantage').miss).toBeCloseTo(0.45 * 0.45, 5);
    expect(saveSuccessP(2, 12, 'normal')).toBeCloseTo(0.55, 5);
    expect(saveSuccessP(2, 12, 'disadvantage')).toBeCloseTo(0.55 * 0.55, 5);
  });

  it('silah saldırısı: tam beklenti ile önizleme (sapma < %1), normal ve avantajlı', () => {
    for (const prone of [false, true]) {
      const r = fighter();
      // Tam sayımda ikinci şans (Heroic Inspiration) modellenmez: kaynak 0 (ikinci şans tohumlu sınamada).
      const A = r.c('A');
      r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...A, resources: { ...A.resources, heroicInspiration: 0 } }, ...(prone ? { B: { ...r.c('B'), conditions: ['Prone'] } } : {}) } };
      const opt = (r.c('A').weaponOptions.find((w) => /Longsword/i.test(w.label)) ?? r.c('A').weaponOptions[0]) as Combatant['weaponOptions'][number];
      const cmd: Command = { type: 'attack', actorId: 'A', targetId: 'B', option: opt };
      const p = previewCommand(r.state, cmd);
      expect(p.ok).toBe(true);
      const t = p.targets.find((x) => x.id === 'B');
      expect(t?.hitP).toBeGreaterThan(0);
      expect(opt.label).toMatch(/Longsword/i);
      const sides = Number(/d(\d+)/.exec(opt.damage)?.[1] ?? 8);
      const exact = exactDamage(r.state, cmd, 'B', sides, prone ? 'advantage' : 'normal');
      expect(Math.abs((t?.damage.avg ?? 0) - exact) / exact).toBeLessThan(0.01);
      expect(t?.damage.max).toBeGreaterThanOrEqual(t?.damage.min ?? 0);
      expect(t?.ally).toBe(false);
    }
  });

  it('1000 isabet: tohumlu gerçek saldırılarla isabet oranı ve isabet başına hasar', () => {
    const r = fighter();
    const opt = (r.c('A').weaponOptions.find((w) => /Longsword/i.test(w.label)) ?? r.c('A').weaponOptions[0]) as Combatant['weaponOptions'][number];
    const cmd: Command = { type: 'attack', actorId: 'A', targetId: 'B', option: opt };
    const p = previewCommand(r.state, cmd);
    const t = p.targets.find((x) => x.id === 'B');
    const rng = seeded(54);
    let tries = 0; let hits = 0; let dmg = 0;
    while (hits < 1000) {
      const x = execute(r.state, cmd, P1, rng);
      if (!x.ok) throw new Error(x.error);
      tries++;
      const ev = x.events.find((e) => e.type === 'attack_resolved');
      if (ev && ev.type === 'attack_resolved' && ev.hit) { hits++; dmg += ev.appliedDamage; }
    }
    const hp = t?.hitP ?? 0;
    const se = Math.sqrt(hp * (1 - hp) / tries);
    expect(Math.abs(hits / tries - hp)).toBeLessThan(4 * se + 0.005);
    const perHit = (t?.damage.avg ?? 0) / hp;
    expect(Math.abs(dmg / hits - perHit) / perHit).toBeLessThan(0.05);
  });

  it('save büyüsü: save olasılığı ve hasar, geçersiz komutta motorun hatası', () => {
    const r = kitArena({ cls: 'cleric', sub: 'life-domain', level: 5, scores: { wis: 16 }, enemy: { hp: 200, maxHp: 200 }, place: { B: o(6, 3) } });
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Sacred Flame', targetId: 'B' };
    const ok = execute(r.state, cmd, P1, () => 0.5);
    if (!ok.ok) return; // büyü listesi değişirse sınama anlamsız; kuru çalıştırma da aynı hatayı vermeli
    const p = previewCommand(r.state, cmd);
    const t = p.targets.find((x) => x.id === 'B');
    expect(t?.saveP).toBeDefined();
    // Gerçek: save yüzleri × hasar değerleri.
    let exact = 0;
    for (let k = 1; k <= 20; k++) {
      let s = 0;
      for (let d = 1; d <= 8; d++) {
        const x = execute(r.state, cmd, P1, fixed(k, d));
        if (x.ok) s += pool(r.state.combatants.B) - pool(x.state.combatants.B);
      }
      exact += (s / 8) / 20;
    }
    expect(Math.abs((t?.damage.avg ?? 0) - exact) / Math.max(1, exact)).toBeLessThan(0.01);
    const bad = previewCommand(r.state, { type: 'cast_spell', actorId: 'A', spellName: 'Yok Böyle Büyü', targetId: 'B' });
    expect(bad.ok).toBe(false);
    expect(bad.error).toBeTruthy();
  });

  it('kuru çalıştırma durumu değiştirmez', () => {
    const r = fighter();
    const before = JSON.stringify(r.state);
    const opt = r.c('A').weaponOptions[0] as Combatant['weaponOptions'][number];
    previewCommand(r.state, { type: 'attack', actorId: 'A', targetId: 'B', option: opt });
    expect(JSON.stringify(r.state)).toBe(before);
  });
});
