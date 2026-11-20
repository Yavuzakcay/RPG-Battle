/** Görev B94 (kural sürümü 94), aşama B: Bard denetim düzeltmeleri (BARD-DENETIM.md). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { inspirePayable } from './bard';
import { cuttingWordsCheck, cuttingWordsDamage } from './reactions';
import { GM, P1, mk, scripted } from './fixtures';
import { blankCharacter, characterIssues, discoveryCap, newCharacter, spellCounts, spellOptions, suggestedScores } from '../rules/builder';
import type { CharacterSheet } from '../rules/stats';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { ReactionAnswer, ReactionRequest } from '../rules/reactionChoice';
import type { BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const bardSheet = (level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('b').sheet, name: 'Lira', classId: 'bard', subclassId: 'college-of-lore', level, baseScores: suggestedScores('bard'), ...patch,
});
const bard = (level = 5, patch: Partial<CharacterSheet> = {}) => combatantFromSheet(bardSheet(level, patch), { id: 'A', ownerId: 'p1' });
function arena(a: Combatant, rules: number, extra: Combatant[] = [], ally: Partial<Combatant> = {}) {
  const parts = [a, mk('C', { ownerId: 'p1', hp: 30, maxHp: 30, ac: 15, ...ally }), mk('B', { side: 'enemies', hp: 40, maxHp: 40 }), ...extra];
  const s = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: rules, map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), B: o(5, 3), C: o(4, 3), D: o(6, 3) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) if (combatants[id]) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: ['A', 'B', 'C', ...extra.map((x) => x.id)], turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } } as BattleState;
}
const answering = (base: Rng, answer: (q: ReactionRequest) => ReactionAnswer | null) => {
  const seen: ReactionRequest[] = [];
  const r = (() => base()) as Rng & { react: (q: ReactionRequest) => ReactionAnswer | null };
  r.react = (q) => { seen.push(q); return answer(q); };
  return { rng: r, seen };
};
const issues = (sheet: CharacterSheet) => characterIssues({ ...newCharacter('x'), sheet }).map((i) => (typeof i === 'string' ? i : i.text));

describe('Magical Discoveries ve Magical Secrets (SRD 5.2.1 s. 33, 35)', () => {
  const base = { ...newCharacter('lore').sheet, classId: 'bard', level: 10, subclassId: 'college-of-lore' };
  const bardSpells = spellOptions('bard', 10).filter((n) => n !== 'Fireball');
  it('Lore 10+: Discoveries büyüleri (2) hazır/cantrip sayısına girmez; Magical Secrets büyüleri girer', () => {
    expect(discoveryCap('bard', 10, 'college-of-lore')).toBe(2);
    const own = bardSpells.filter((n) => !['Fire Bolt', 'Ray of Frost', 'Shield', 'Haste'].includes(n));
    const prepared15 = own.filter((n) => spellCounts({ ...base, spellNames: [n] }).prepared === 1).slice(0, 15);
    const cantrips4 = own.filter((n) => spellCounts({ ...base, spellNames: [n] }).cantrips === 1).slice(0, 4);
    const s = { ...base, spellNames: [...cantrips4, ...prepared15, 'Shield', 'Fire Bolt'] };
    expect(spellCounts(s)).toMatchObject({ cantrips: 4, prepared: 15 });
    expect(issues(s).some((x) => /fazla/.test(x))).toBe(false);
    // Üçüncü başka liste büyüsü: Magical Secrets ile hazır sayısına girer (16/15).
    expect(spellCounts({ ...s, spellNames: [...s.spellNames, 'Haste'] }).prepared).toBe(16);
    // Başka listeden ikinci cantrip: Discoveries sınırı (2 → cantrip + Shield + Ray of Frost = 3 başka liste; cantrip'ler önce).
    const two = { ...s, spellNames: [...s.spellNames.filter((n) => n !== 'Shield'), 'Ray of Frost', 'Shield'] };
    expect(spellCounts(two).prepared).toBe(16);
  });
  it('Magical Secrets başka listeden cantrip vermez (Lore dışı Bard 10: Fire Bolt yok, Fireball var)', () => {
    // Alt sınıf boşsa varsayılan (Lore) sayılır; başka alt sınıf kimliğiyle Discoveries yok.
    expect(spellOptions('bard', 10, 'baska-kolej')).toContain('Fireball');
    expect(spellOptions('bard', 10, 'baska-kolej')).not.toContain('Fire Bolt');
    expect(spellOptions('bard', 10, 'college-of-lore')).toContain('Fire Bolt');
  });
});

describe('Cutting Words (SRD 5.2.1 s. 35) ve Font of Inspiration (s. 32)', () => {
  it('94: kullanım bitince Font ile en düşük slot harcanır; 93: tepki sunulmaz', () => {
    for (const rules of [94, 93]) {
      const a = bard(5);
      const s0 = arena({ ...a, resources: { ...a.resources, bardicInspiration: 0 } }, rules);
      const st = { ...s0, turnIndex: 1 };
      const { rng, seen } = answering(scripted([20, 11], [8, 5], [8, 6]), (q) => ({ option: q.options[0]!.id, choice: 'damage' }));
      const r = execute(st, { type: 'attack', actorId: 'B', targetId: 'C', option: { label: 'Kılıç', attackBonus: 5, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'x' } }, GM, rng);
      if (!r.ok) throw new Error(r.error);
      expect(seen.length > 0).toBe(rules === 94);
      if (rules === 94) {
        expect(r.events.some((e) => e.type === 'slot_spent' && e.actorId === 'A' && e.level === 1)).toBe(true);
        expect(r.state.combatants.A?.resources.bardicInspiration).toBe(0);
        expect(r.state.combatants.C?.hp).toBe(30 - (8 - 6));
      }
      expect(replay([{ type: 'battle_started', state: st }, ...r.events])).toEqual(r.state);
    }
  });
  it('94: save\'li hasar zarından düşer (dost hedefteyken; bir kez); 93\'te yok', () => {
    for (const rules of [94, 93]) {
      const s = arena(bard(5), rules);
      const { rng } = answering(scripted([8, 5]), (q) => q.suggested);
      const r = cuttingWordsDamage(s, s.combatants.B as Combatant, 20, [s.combatants.C as Combatant], 'Fireball', rng);
      expect(r.total).toBe(rules === 94 ? 15 : 20);
      expect(r.events.some((e) => e.type === 'reaction_used')).toBe(rules === 94);
    }
    // Dost etkilenmiyorsa sunulmaz.
    const s = arena(bard(5), 94);
    expect(cuttingWordsDamage(s, s.combatants.B as Combatant, 20, [], 'Fireball', scripted([8, 5])).total).toBe(20);
  });
  it('94: düşmanın başarılı yetenek kontrolünden (kaçış) düşer; kaçış başarısız olur', () => {
    const s = arena(bard(5), 94);
    const { rng } = answering(scripted([8, 5]), (q) => q.suggested);
    const r = cuttingWordsCheck(s, s.combatants.B as Combatant, 14, 13, 'Grapple', rng);
    expect(r.total).toBe(9);
    // Grapple'dan kaçış komutu da bağlı.
    const g = { ...s, turnIndex: 1, combatants: { ...s.combatants, B: { ...(s.combatants.B as Combatant), grapple: { by: 'C', escapeDc: 13, restrained: false }, conditions: ['Grappled'] } } } as BattleState;
    const k = answering(scripted([20, 15], [8, 6]), (q) => q.suggested);
    const res = execute(g, { type: 'escape_grapple', actorId: 'B' } as Command, GM, k.rng);
    if (!res.ok) throw new Error(res.error);
    const esc = res.events.find((e) => e.type === 'grapple_escape') as { success: boolean } | undefined;
    expect(k.seen.length).toBe(1);
    expect(esc?.success).toBe(false);
    expect(replay([{ type: 'battle_started', state: g }, ...res.events])).toEqual(res.state);
  });
});

describe('Bardic Inspiration hedefi ve Font düğmesi', () => {
  it('94: Blinded + Deafened dost zar alamaz; 93: alır', () => {
    for (const rules of [94, 93]) {
      const s = arena(bard(5), rules, [], { conditions: ['Blinded', 'Deafened'] });
      const r = execute(s, { type: 'use_feature', actorId: 'A', feature: 'bard:bardic-inspiration', targetId: 'C' }, P1, () => 0.5);
      expect(r.ok).toBe(rules === 93);
    }
    const s = arena(bard(5), 94, [], { conditions: ['Blinded'] });
    expect(execute(s, { type: 'use_feature', actorId: 'A', feature: 'bard:bardic-inspiration', targetId: 'C' }, P1, () => 0.5).ok).toBe(true);
  });
  it('kullanım 0 iken Font ile slot varsa ödenebilir (arayüz düğmesi açık); 4. seviyede değil', () => {
    for (const [lv, ok] of [[5, true], [4, false]] as const) {
      const a = bard(lv);
      const z = { ...a, resources: { ...a.resources, bardicInspiration: 0 } };
      const f = z.features!.find((x) => x.effect.kind === 'inspire')!;
      expect(inspirePayable({ kuralSurumu: 94 }, z, f)).toBe(ok);
    }
  });
});

describe('Words of Creation (SRD 5.2.1 s. 33): ikinci hedefi büyücü seçer', () => {
  it('94: targetIds ile seçilen 10 ft içindeki yaratık (dost da olabilir); 93: aynı taraftan en yakın', () => {
    for (const rules of [94, 93]) {
      const D = mk('D', { side: 'enemies', hp: 40, maxHp: 40 });
      const s = arena(bard(20), rules, [D]);
      const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Power Word Kill', targetId: 'B', targetIds: ['B', 'C'], slotLevel: 9 } as Command, P1, () => 0.5);
      if (!r.ok) throw new Error(r.error);
      expect(r.state.combatants.B?.hp).toBe(0);
      expect(r.state.combatants.C?.hp === 0).toBe(rules === 94);
      expect(r.state.combatants.D?.hp === 0).toBe(rules === 93);
    }
  });
});
