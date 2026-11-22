/** Görev B98 (kural sürümü 98): Bardic Inspiration kararı, fırlatılan Melee silah, Lay On Hands herhangi yaratık. */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, mk, scripted } from './fixtures';
import type { CharacterSheet } from '../rules/stats';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { ReactionAnswer, ReactionRequest } from '../rules/reactionChoice';
import type { AttackOption, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
function arena(a: Combatant, rules: number, ally: Partial<Combatant> = {}, foe: Partial<Combatant> = {}) {
  const parts = [a, mk('C', { ownerId: 'p1', hp: 30, maxHp: 30, ...ally }), mk('B', { side: 'enemies', hp: 40, maxHp: 40, ac: 15, ...foe })];
  const s = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: rules, map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), C: o(4, 4), B: o(4, 3) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: ['A', 'C', 'B'], turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } } as BattleState;
}
const answering = (base: Rng, answer: (q: ReactionRequest) => ReactionAnswer) => {
  const seen: ReactionRequest[] = [];
  const r = (() => base()) as Rng & { react: (q: ReactionRequest) => ReactionAnswer };
  r.react = (q) => { seen.push(q); return answer(q); };
  return { rng: r, seen };
};
const swing: AttackOption = { label: 'Kılıç', attackBonus: 3, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'x' };
const inspired = { effects: [{ id: 'bardic-inspiration', name: 'Bardic Inspiration', sourceId: 'A', until: 99, inspire: '1d8' }] } as Partial<Combatant>;

describe('Bardic Inspiration (SRD 5.2.1 s. 31): alıcı d20 sonucunu görünce karar verir', () => {
  it('98: ıskada sorulur; kullanmazsa zar atılmaz ve etki kalır; kullanırsa atılır', () => {
    for (const use of [false, true]) {
      const s0 = arena(mk('A', { ownerId: 'p1' }), 98, inspired);
      const s = execute(s0, { type: 'end_turn', actorId: 'A' }, P1, () => 0.5);
      if (!s.ok) throw new Error(s.error);
      const { rng, seen } = answering(scripted([20, 5], [8, 6], [8, 4]), (q) => (q.trigger === 'inspire' ? (use ? { option: 'inspire' } : null) : q.suggested));
      const r = execute(s.state, { type: 'attack', actorId: 'C', targetId: 'B', option: swing }, P1, rng);
      if (!r.ok) throw new Error(r.error);
      expect(seen.some((q) => q.trigger === 'inspire')).toBe(true);
      expect(seen.find((q) => q.trigger === 'inspire')?.info).toMatchObject({ total: 8, ac: 15 });
      expect(r.state.combatants.C?.effects?.some((e) => e.inspire)).toBe(!use);
      expect(replay([{ type: 'battle_started', state: s.state }, ...r.events])).toEqual(r.state);
    }
  });
  it('97: sorulmaz (her başarısızlıkta kendiliğinden); kancasız Rng (yapay zekâ) 98\'de de kullanır', () => {
    const s0 = arena(mk('A', { ownerId: 'p1' }), 97, inspired);
    const s = execute(s0, { type: 'end_turn', actorId: 'A' }, P1, () => 0.5);
    if (!s.ok) throw new Error(s.error);
    const { rng, seen } = answering(scripted([20, 5], [8, 6], [8, 4]), (q) => q.suggested);
    const r = execute(s.state, { type: 'attack', actorId: 'C', targetId: 'B', option: swing }, P1, rng);
    if (!r.ok) throw new Error(r.error);
    expect(seen.some((q) => q.trigger === 'inspire')).toBe(false);
    expect(r.state.combatants.C?.effects?.some((e) => e.inspire)).toBe(false);
    const s98 = execute(arena(mk('A', { ownerId: 'p1' }), 98, inspired), { type: 'end_turn', actorId: 'A' }, P1, () => 0.5);
    if (!s98.ok) throw new Error(s98.error);
    const r98 = execute(s98.state, { type: 'attack', actorId: 'C', targetId: 'B', option: swing }, P1, scripted([20, 5], [8, 6], [8, 4]));
    if (!r98.ok) throw new Error(r98.error);
    expect(r98.state.combatants.C?.effects?.some((e) => e.inspire)).toBe(false);
  });
});

const paladin = (level: number) => combatantFromSheet({
  name: 'Aria', raceId: 'human', classId: 'paladin', level, armorName: 'Chain Mail', shield: true, itemNames: [],
  baseScores: { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 14 }, backgroundBonuses: { str: 2, cha: 1 },
  weapons: [{ name: 'Longsword' }, { name: 'Javelin' }], subclassId: 'oath-of-devotion',
} as CharacterSheet, { id: 'A', ownerId: 'p1' });

describe('Fırlatılan Melee silah (SRD 5.2.1 s. 89 Thrown, s. 55 Radiant Strikes)', () => {
  it('98: atılan Javelin isabeti Radiant Strikes ekler; 97: eklemez', () => {
    for (const rules of [98, 97]) {
      const s = arena(paladin(11), rules, {}, { ac: 5 });
      const opt = (s.combatants.A as Combatant).weaponOptions.find((x) => x.label === 'Javelin (fırlatma)')!;
      expect(opt.meleeWeapon).toBe(true);
      const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt }, P1, scripted([20, 15], [6, 3], [8, 4]));
      if (!r.ok) throw new Error(r.error);
      const ev = r.events.find((e) => e.type === 'attack_resolved') as { extra?: Array<{ label: string }> };
      expect((ev.extra ?? []).some((x) => x.label === 'Radiant Strikes')).toBe(rules === 98);
    }
  });
});

describe('Lay On Hands (SRD 5.2.1 s. 53): herhangi bir yaratık', () => {
  it('98: yaralı düşman iyileştirilebilir; 97: yalnız dost', () => {
    for (const rules of [98, 97]) {
      const s = arena(paladin(3), rules, {}, { hp: 20 });
      const r = execute(s, { type: 'use_feature', actorId: 'A', feature: 'paladin:lay-on-hands', targetId: 'B', amount: 5 } as Command, P1, () => 0.5);
      expect(r.ok).toBe(rules === 98);
      if (r.ok) expect(r.state.combatants.B?.hp).toBe(25);
    }
    void GM;
  });
});
