/** Görev B94 (kural sürümü 94), aşama D: Paladin denetim düzeltmeleri (PALADIN-DENETIM.md). */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { lineOfFire } from './cover';
import { paladinChoice94 } from './ai/b94';
import { GM, P1, mk, scripted } from './fixtures';
import type { CharacterSheet } from '../rules/stats';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const sheet = (level: number, p: Partial<CharacterSheet> = {}): CharacterSheet => ({
  name: 'Aria', raceId: 'human', classId: 'paladin', level, armorName: 'Chain Mail', shield: false, itemNames: [],
  baseScores: { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 14 }, backgroundBonuses: { str: 2, cha: 1 },
  weapons: [{ name: 'Longsword' }, { name: 'Shortsword' }], subclassId: 'oath-of-devotion', ...p,
});
function arena(level: number, rules: number, pos: Record<string, Offset> = {}, foe: Partial<Combatant> = {}) {
  const pal = combatantFromSheet(sheet(level), { id: 'A', ownerId: 'p1' });
  const parts = [pal, mk('B', { side: 'enemies', hp: 80, maxHp: 80, ac: 5, ...foe }), mk('C', { ownerId: 'p1', hp: 30, maxHp: 30 }), mk('E', { side: 'enemies', hp: 80, maxHp: 80 })];
  const s = startBattle('p', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: rules, map: { id: 'col' } }).state;
  const where: Record<string, Offset> = { A: o(3, 3), B: o(4, 3), C: o(2, 3), E: o(5, 3), ...pos };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(where)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: ['A', 'B', 'C', 'E'], turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } } as BattleState;
}
const pad = () => scripted(...Array.from({ length: 30 }, () => [20, 10] as [number, number]));
const run = (s: BattleState, cmd: Command, rng = pad()) => { const r = execute(s, cmd, (cmd as { actorId?: string }).actorId === 'B' ? GM : P1, rng); if (!r.ok) throw new Error(r.error); return r; };
const A = (s: BattleState) => s.combatants.A as Combatant;
const opt = (s: BattleState, label: string) => A(s).weaponOptions.find((x) => x.label === label)!;
const SW = 'paladin/oath-of-devotion:sacred-weapon';
const NIMBUS = 'paladin/oath-of-devotion:holy-nimbus';
const total = (s: BattleState, label: string) => {
  const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, label) }, scripted([20, 3], [8, 5], [6, 3]));
  const ev = r.events.find((e) => e.type === 'attack_resolved');
  return ev && ev.type === 'attack_resolved' ? ev.total - opt(s, label).attackBonus - 3 : NaN;
};

describe('Sacred Weapon (SRD 5.2.1 s. 56): tek silah', () => {
  it('94: yalnız seçilen (yoksa ilk) yakın dövüş silahına CHA; 93: hepsine', () => {
    for (const rules of [94, 93]) {
      const s = run(arena(3, rules), { type: 'use_feature', actorId: 'A', feature: SW, choice: 'shortsword' }).state;
      expect(total(s, 'Shortsword')).toBe(2);
      expect(total(s, 'Longsword')).toBe(rules === 94 ? 0 : 2);
    }
  });
  it('94: silah bırakılınca güçlendirme ve ışık biter; ışık 20 + 20 ft (4 + 4 altıgen)', () => {
    const s0 = arena(3, 94);
    const r = run(s0, { type: 'use_feature', actorId: 'A', feature: SW });
    const light = A(r.state).effects?.find((e) => e.id === 'sacred-weapon-light');
    expect(light).toMatchObject({ light: 4, lightDim: 4 });
    const d = run(r.state, { type: 'drop_item', actorId: 'A', item: 'longsword' });
    expect(A(d.state).buffs?.some((b) => b.source === 'Sacred Weapon')).toBe(false);
    expect(A(d.state).effects?.some((e) => e.id === 'sacred-weapon-light')).toBe(false);
    expect(replay([{ type: 'battle_started', state: s0 }, ...r.events, ...d.events])).toEqual(d.state);
  });
});

describe('Holy Nimbus (s. 57)', () => {
  it('94: kullanım yokken 5. seviye slotla yenilenir; alan güneş ışığı. 93: kullanım yoksa red', () => {
    for (const rules of [94, 93]) {
      const s = arena(20, rules);
      const z = { ...s, combatants: { ...s.combatants, A: { ...A(s), resources: { ...A(s).resources, holyNimbus: 0 } } } } as BattleState;
      const r = execute(z, { type: 'use_feature', actorId: 'A', feature: NIMBUS }, P1, () => 0.5);
      expect(r.ok).toBe(rules === 94);
      if (r.ok) {
        expect(r.events.some((e) => e.type === 'slot_spent' && e.level === 5)).toBe(true);
        expect(r.state.map?.zones?.find((x) => x.spellId.includes('holy-nimbus'))?.spec?.sunlight).toBe(true);
      }
    }
  });
});

describe('Abjure Foes (s. 55): yalnız hareket ya da eylem ya da bonus eylem', () => {
  it('94: Frightened düşman hareket ettiyse eylem yapamaz; 93: yapar', () => {
    for (const rules of [94, 93]) {
      const s = arena(9, rules, { B: o(8, 3), E: o(9, 3) }, { saves: { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 } });
      const r = run(s, { type: 'use_feature', actorId: 'A', feature: 'paladin:abjure-foes', targetId: 'B' }, scripted([20, 1], [20, 1], [20, 1]));
      expect(r.state.combatants.B?.conditions).toContain('Frightened');
      const t = { ...r.state, turnIndex: 1 } as BattleState;
      const mv = run(t, { type: 'move', actorId: 'B', to: o(10, 2) } as Command);
      const act = execute(mv.state, { type: 'dodge', actorId: 'B' }, GM, () => 0.5);
      expect(act.ok).toBe(rules === 93);
    }
  });
});

describe('Divine Sense (s. 55)', () => {
  it('94: 10 dakika (100 tur) ve Incapacitated olunca biter; 93: 101 tur, sürer', () => {
    for (const rules of [94, 93]) {
      const r = run(arena(3, rules), { type: 'use_feature', actorId: 'A', feature: 'paladin:channel-divinity' });
      const fx = A(r.state).effects?.find((e) => e.id === 'divine-sense');
      expect(fx?.until).toBe(r.state.round + (rules === 94 ? 99 : 100));
      const st = execute(r.state, { type: 'set_condition', targetId: 'A', condition: 'Stunned', present: true }, GM, () => 0.5);
      if (!st.ok) throw new Error(st.error);
      expect(A(st.state).effects?.some((e) => e.id === 'divine-sense')).toBe(rules === 93);
    }
  });
});

describe('Smite of Protection (s. 57): aurada kaldıkça yarım siper', () => {
  it('94: auraya sonradan giren dost siper alır, auradan çıkan kaybeder; Paladin Incapacitated iken yok', () => {
    const s = arena(15, 94, { C: o(9, 3), B: o(12, 3) });
    const withFx = { ...s, combatants: { ...s.combatants, A: { ...A(s), effects: [{ id: 'smite-of-protection', name: 'Smite of Protection', sourceId: 'A', untilSourceTurn: true, coverAura: 2 }] } } } as BattleState;
    const far = lineOfFire(withFx, withFx.combatants.B as Combatant, withFx.combatants.C as Combatant).cover;
    const near = { ...withFx, combatants: { ...withFx.combatants, C: { ...(withFx.combatants.C as Combatant), pos: o(4, 3) } } } as BattleState;
    expect(far).toBeLessThan(2);
    expect(lineOfFire(near, near.combatants.B as Combatant, near.combatants.C as Combatant).cover).toBeGreaterThanOrEqual(2);
    const down = { ...near, combatants: { ...near.combatants, A: { ...A(near), conditions: ['Stunned'] } } } as BattleState;
    expect(lineOfFire(down, down.combatants.B as Combatant, down.combatants.C as Combatant).cover).toBeLessThan(2);
  });
});

describe('YZ (94): Abjure Foes ve Holy Nimbus', () => {
  it('iki düşman 60 ft içindeyken Abjure Foes; aurada düşman varken Holy Nimbus (bonus); 93\'te yok', () => {
    const s = arena(20, 94);
    const foes = [s.combatants.B as Combatant, s.combatants.E as Combatant];
    const ok = (c: Command) => execute(s, c, P1, () => 0.5).ok;
    expect(paladinChoice94(s, A(s), foes, true, ok)).toMatchObject({ feature: NIMBUS });
    const used = { ...s, combatants: { ...s.combatants, A: { ...A(s), economy: { ...A(s).economy, bonus: true } } } } as BattleState;
    expect(paladinChoice94(used, A(used), foes, true, (c) => execute(used, c, P1, () => 0.5).ok)).toMatchObject({ feature: 'paladin:abjure-foes' });
    const old = arena(20, 93);
    expect(paladinChoice94(old, A(old), foes, true, () => true)).toBeNull();
  });
});
