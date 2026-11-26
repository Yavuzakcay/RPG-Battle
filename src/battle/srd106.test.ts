/**
 * Görev SRD-TAMAMLAMA-1 (kural sürümü 106): Preserve Life miktar seçimi ve her taraftan Bloodied yaratık (SRD 5.2.1 s. 38),
 * Land's Aid iyileşmesi aynı eylemin hasarından sonra (s. 46), Elixir of Health / Potion of Vitality eşya yolunda durum ve
 * Exhaustion temizleme (s. 220, 236). 105 ve altı aynen.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { preserveAmountOptions } from './cleric';
import { P1, mk } from './fixtures';
import { SRD106_VERSION } from './srd106Surum';
import { CURRENT_RULES } from './ruleVersion';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { CharacterSheet } from '../rules/stats';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { ReactionAnswer, ReactionRequest } from '../rules/reactionChoice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const mid: Rng = () => 0.5;
const deciding = (answer: (q: ReactionRequest) => ReactionAnswer, seen: ReactionRequest[] = []): Rng => {
  const r = (() => 0.5) as Rng & { react: (q: ReactionRequest) => ReactionAnswer };
  r.react = (q) => { seen.push(q); return answer(q); };
  return r;
};
/** Sırayla verilen seçim cevapları (bitince null: "seçme"). */
const answers = (list: string[], seen: ReactionRequest[] = []): Rng => {
  let i = 0;
  return deciding((q) => { if (q.trigger !== 'choice') return null; const c = list[i++]; return c ? { option: 'choice', choice: c } : null; }, seen);
};

function place(s0: BattleState, pos: Record<string, Offset>, order: string[]): BattleState {
  const combatants = { ...s0.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s0, status: 'active', round: 1, order, turnIndex: 0, combatants, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
}
const run = (s: BattleState, cmd: Command, rng: Rng = mid) => { const r = execute(s, cmd, P1, rng); if (!r.ok) throw new Error(r.error); return r; };
const replays = (s0: BattleState, r: { state: BattleState; events: BattleEvent[] }) => expect(replay([{ type: 'battle_started', state: s0 }, ...r.events])).toEqual(r.state);
const healed = (evs: BattleEvent[]) => Object.fromEntries(evs.flatMap((e) => (e.type === 'healed' ? [[e.targetId, e.amount]] : [])));

it('sürüm sabiti 106 ve güncel kural sürümü en az 106', () => {
  expect(SRD106_VERSION).toBe(106);
  expect(CURRENT_RULES).toBeGreaterThanOrEqual(106);
});

describe('Preserve Life (SRD 5.2.1 s. 38): miktar seçimi', () => {
  const PL = 'cleric/life-domain:preserve-life';
  const cSheet = (level: number): CharacterSheet => ({
    ...blankCharacter('c').sheet, name: 'Rahip', classId: 'cleric', subclassId: 'life-domain', level, baseScores: suggestedScores('cleric'),
    armorName: 'Chain Shirt', weapons: [{ name: 'Mace' }], spellNames: ['Cure Wounds'],
  });
  /** Cleric 3 (havuz 15); C 4/30 (en çok 11), D 2/20 (en çok 8), düşman B. */
  const arena = (rules: number, b: Partial<Combatant> = {}) => {
    const parts = [combatantFromSheet(cSheet(3), { id: 'A', ownerId: 'p1' }), mk('B', { side: 'enemies', hp: 60, maxHp: 60, ...b }),
      mk('C', { ownerId: 'p1', hp: 4, maxHp: 30 }), mk('D', { ownerId: 'p1', hp: 2, maxHp: 20 })];
    const s0 = startBattle('pl', 'd-z-zemin', parts, mid, { kuralSurumu: rules, map: { id: 'col' } }).state;
    return place(s0, { A: o(3, 3), B: o(4, 3), C: o(2, 3), D: o(3, 4) }, ['A', 'B', 'C', 'D']);
  };
  const use: Command = { type: 'use_feature', actorId: 'A', feature: PL };

  it('seçenek listesi: 12\'ye dek her değer, üstünde 5\'in katları ve üst sınır; büyükten küçüğe', () => {
    expect(preserveAmountOptions(3)).toEqual([3, 2, 1]);
    expect(preserveAmountOptions(12)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(preserveAmountOptions(13)).toEqual([13, 10, 5]);
    expect(preserveAmountOptions(30)).toEqual([30, 25, 20, 15, 10, 5]);
    expect(preserveAmountOptions(0)).toEqual([]);
  });

  it('kancasız Rng (yapay zekâ, simülasyon): 106 = 105, en yaralıdan alabildiği kadar', () => {
    const r105 = run(arena(105), use);
    const r106 = run(arena(106), use);
    expect(healed(r105.events)).toEqual({ D: 8, C: 7 });
    expect(r106.events).toEqual(r105.events);
  });

  it('106: oyuncu yaratık başına miktarı seçer; öneri üst sınır; havuz paylaşılır; replay aynı', () => {
    const s = arena(106);
    const seen: ReactionRequest[] = [];
    // Sıra: C, D, sonra bırak; miktar: C'ye 5, D'ye 8 (kalan havuz 10, D en çok 8).
    const r = run(s, use, answers(['C', 'D', '5', '8'], seen));
    expect(healed(r.events)).toEqual({ C: 5, D: 8 });
    const amountQs = seen.filter((q) => q.options[0]?.choices?.[0]?.label.endsWith(' HP'));
    expect(amountQs).toHaveLength(2);
    expect(amountQs[0]?.suggested).toMatchObject({ choice: '11' });
    expect(amountQs[1]?.suggested).toMatchObject({ choice: '8' });
    expect(amountQs[1]?.options[0]?.choices?.map((c) => c.id)).toEqual(['8', '7', '6', '5', '4', '3', '2', '1']);
    replays(s, r);
  });

  it('106: miktar sorusunda "seçme" üst sınırı verir; 105\'te miktar sorulmaz', () => {
    const seen105: ReactionRequest[] = [];
    const r105 = run(arena(105), use, answers(['C', 'D'], seen105));
    expect(healed(r105.events)).toEqual({ C: 11, D: 4 });
    expect(seen105.every((q) => !q.options[0]?.choices?.[0]?.label.endsWith(' HP'))).toBe(true);
    // 106: sıra C, D; miktar soruları cevapsız → üst sınır.
    const pick: Rng = deciding((q) => {
      const ids = q.options[0]?.choices?.map((c) => c.id) ?? [];
      if (ids.includes('C')) return { option: 'choice', choice: 'C' };
      if (ids.includes('D')) return { option: 'choice', choice: 'D' };
      return null;
    });
    expect(healed(run(arena(106), use, pick).events)).toEqual({ C: 11, D: 4 });
  });

  it('106: Bloodied düşman da seçilebilir (öneri değil); 105\'te aday değil', () => {
    const seen: ReactionRequest[] = [];
    run(arena(106, { hp: 10 }), use, deciding((q) => { seen.push(q); return null; }));
    const first = seen[0]!;
    expect(first.options[0]?.choices?.map((c) => c.id)).toContain('B');
    expect(first.suggested).toMatchObject({ choice: 'D' });
    const r = run(arena(106, { hp: 10 }), use, answers(['B', '', '30']));
    expect(healed(r.events)).toEqual({ B: 15 });
    const seen105: ReactionRequest[] = [];
    run(arena(105, { hp: 10 }), use, deciding((q) => { seen105.push(q); return null; }));
    expect(seen105[0]?.options[0]?.choices?.map((c) => c.id)).not.toContain('B');
  });

  it('106: yalnız düşman Bloodied iken kullanılabilir; 105\'te kullanılamaz', () => {
    const only = (rules: number) => {
      const s = arena(rules, { hp: 10 });
      const combatants = { ...s.combatants, C: { ...(s.combatants.C as Combatant), hp: 30 }, D: { ...(s.combatants.D as Combatant), hp: 20 } };
      return { ...s, combatants };
    };
    expect(execute(only(105), use, P1, mid).ok).toBe(false);
    expect(execute(only(106), use, P1, mid).ok).toBe(true);
  });
});

describe("Land's Aid (SRD 5.2.1 s. 46): iyileşme hasardan sonra", () => {
  const LA = 'druid/circle-of-the-land:lands-aid';
  const dSheet = (level: number): CharacterSheet => ({
    ...blankCharacter('d').sheet, name: 'Ova', classId: 'druid', subclassId: 'circle-of-the-land', level, baseScores: suggestedScores('druid'),
    featureChoices: { 'druid/circle-of-the-land:circle-of-the-land-spells': 'temperate' },
  });
  /** C (dost, 20/30) ve B (düşman) küre içinde; E dışarıda. */
  const arena = (rules: number) => {
    const parts = [combatantFromSheet(dSheet(3), { id: 'A', ownerId: 'p1' }), mk('C', { ownerId: 'p1', hp: 20, maxHp: 30 }),
      mk('B', { side: 'enemies', hp: 60, maxHp: 60 }), mk('E', { side: 'enemies', hp: 60, maxHp: 60 })];
    const s0 = startBattle('la', 'd-z-zemin', parts, mid, { kuralSurumu: rules, map: { id: 'col' } }).state;
    return place(s0, { A: o(3, 3), C: o(5, 3), B: o(6, 3), E: o(12, 3) }, ['A', 'B', 'C', 'E']);
  };
  const use: Command = { type: 'use_feature', actorId: 'A', feature: LA, to: o(5, 3) };

  it('kancasız Rng: 106 = 105 (düşman save atar, dost iyileşir)', () => {
    const r105 = run(arena(105), use);
    const r106 = run(arena(106), use);
    expect(r106.events).toEqual(r105.events);
    expect(r105.events.some((e) => e.type === 'save_resolved' && e.targetId === 'B')).toBe(true);
    expect(r105.events.some((e) => e.type === 'save_resolved' && e.targetId === 'C')).toBe(false);
    expect(healed(r105.events).C).toBeGreaterThan(0);
  });

  it('aynı yaratık hem hasar alıp hem iyileşirse: 106 hasardan sonraki candan, 105 hasarı siler', () => {
    // Save atacaklar: C; iyileşecek: C.
    for (const rules of [105, 106]) {
      const s = arena(rules);
      const r = run(s, use, answers(['C', '', 'C']));
      const save = r.events.find((e) => e.type === 'save_resolved' && e.targetId === 'C') as Extract<BattleEvent, { type: 'save_resolved' }>;
      const heal = r.events.find((e) => e.type === 'healed' && e.targetId === 'C') as Extract<BattleEvent, { type: 'healed' }>;
      expect(save.appliedDamage).toBeGreaterThan(0);
      const c = r.state.combatants.C as Combatant;
      if (rules === 106) {
        expect(heal.targetHpAfter).toBe(Math.min(30, save.targetHpAfter + heal.amount));
        expect(c.hp).toBe(heal.targetHpAfter);
        expect(c.hp).toBeLessThan(Math.min(30, 20 + heal.amount));
      } else {
        // Eski davranış: iyileşme eylem öncesi candan (hasar silinir).
        expect(heal.targetHpAfter).toBe(Math.min(30, 20 + heal.amount));
      }
      replays(s, r);
    }
  });

  it('106: başta tam canlı yaratık bu eylemde hasar alınca iyileşme adayı olur', () => {
    const s = arena(106);
    const full = { ...s, combatants: { ...s.combatants, C: { ...(s.combatants.C as Combatant), hp: 30 } } };
    const seen: ReactionRequest[] = [];
    const r = run(full, use, answers(['C', '', 'C'], seen));
    expect(seen.at(-1)?.options[0]?.choices?.map((c) => c.id)).toContain('C');
    expect(healed(r.events).C).toBeGreaterThan(0);
  });
});

describe('Elixir of Health ve Potion of Vitality (SRD 5.2.1 s. 220, 236): eşya yolunda temizleme', () => {
  const arena = (rules: number, a: Partial<Combatant>) => {
    const parts = [mk('A', { ownerId: 'p1', hp: 20, maxHp: 30, ...a }), mk('B', { side: 'enemies', hp: 60, maxHp: 60 })];
    const s0 = startBattle('it', 'd-z-zemin', parts, mid, { kuralSurumu: rules, map: { id: 'col' } }).state;
    return place(s0, { A: o(3, 3), B: o(8, 3) }, ['A', 'B']);
  };
  const drink = (id: string): Command => ({ type: 'use_item', actorId: 'A', itemId: id, targetId: 'A' });

  it('Elixir of Health: 106\'da Blinded, Deafened, Paralyzed, Poisoned kalkar (başkası kalır), boş etki eklenmez; 105\'te kalır', () => {
    const conds = ['Blinded', 'Deafened', 'Poisoned', 'Prone'];
    const s106 = arena(106, { conditions: conds, consumables: { 'elixir-of-health': 1 } });
    const r = run(s106, drink('elixir-of-health'));
    expect(r.state.combatants.A?.conditions).toEqual(['Prone']);
    expect(r.events.filter((e) => e.type === 'condition_changed').map((e) => (e as { condition: string }).condition)).toEqual(['Blinded', 'Deafened', 'Poisoned']);
    expect(r.events.some((e) => e.type === 'effect_added')).toBe(false);
    expect(r.state.combatants.A?.consumables?.['elixir-of-health']).toBe(0);
    replays(s106, r);
    const r105 = run(arena(105, { conditions: conds, consumables: { 'elixir-of-health': 1 } }), drink('elixir-of-health'));
    expect(r105.state.combatants.A?.conditions).toEqual(conds);
  });

  it('Potion of Vitality: 106\'da bütün Exhaustion ve Poisoned kalkar; 105\'te kalır', () => {
    const s106 = arena(106, { conditions: ['Poisoned'], exhaustion: 3, consumables: { 'potion-of-vitality': 1 } });
    const r = run(s106, drink('potion-of-vitality'));
    expect(r.state.combatants.A?.exhaustion ?? 0).toBe(0);
    expect(r.state.combatants.A?.conditions).not.toContain('Poisoned');
    replays(s106, r);
    const r105 = run(arena(105, { conditions: ['Poisoned'], exhaustion: 3, consumables: { 'potion-of-vitality': 1 } }), drink('potion-of-vitality'));
    expect(r105.state.combatants.A?.exhaustion).toBe(3);
    expect(r105.state.combatants.A?.conditions).toContain('Poisoned');
  });

  it('dosta içirme (5 ft): 106\'da dostun Poisoned durumu kalkar', () => {
    const parts = [mk('A', { ownerId: 'p1', consumables: { 'potion-of-vitality': 1 } }), mk('C', { ownerId: 'p1', conditions: ['Poisoned'], exhaustion: 1 }), mk('B', { side: 'enemies' })];
    const s = place(startBattle('it2', 'd-z-zemin', parts, mid, { kuralSurumu: 106, map: { id: 'col' } }).state, { A: o(3, 3), C: o(4, 3), B: o(9, 3) }, ['A', 'B', 'C']);
    const r = run(s, { type: 'use_item', actorId: 'A', itemId: 'potion-of-vitality', targetId: 'C' });
    expect(r.state.combatants.C?.conditions).not.toContain('Poisoned');
    expect(r.state.combatants.C?.exhaustion ?? 0).toBe(0);
  });
});
