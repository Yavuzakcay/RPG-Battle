/**
 * A1 regresyon (A0 yoklama betiğinin büyü bölümü): her büyü 20. seviye büyücüyle kısa bir arenada birkaç hedef biçimiyle
 * (düşman, insansı, hayvan, altıgen, boş altıgen, dost, kendisi, hedefsiz, çoklu, ölmekte/ölü dost, vurduktan sonra)
 * `cast_spell` olarak denenir. Komut kabul edilebilir ya da gerekçeyle reddedilebilir; hiçbiri istisna fırlatmaz
 * (Heal'in "0d1+70" çökmesi gibi). Kabul edilen sayısı da alt sınırla denetlenir.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { mk, P1 } from './fixtures';
import { spells } from '../data';
import type { BattleState, Combatant, Command } from './types';

const o = (col: number, row: number) => ({ col, row });
const weak = { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 };
function arena(): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 80, maxHp: 80, level: 20, spellAttack: 9, spellSaveDc: 17, spellMod: 5, proficiency: 6, spellSlots: [4, 4, 4, 4, 4, 4, 4, 4, 4], spellNames: [] }),
    mk('B', { side: 'enemies', hp: 90, maxHp: 90, monsterId: 'ogre', creatureType: 'giant', saves: weak }),
    mk('C', { ownerId: 'p1', hp: 5, maxHp: 30 }),
    mk('H', { side: 'enemies', hp: 40, maxHp: 40, monsterId: 'bandit', creatureType: 'humanoid', saves: weak }),
    mk('W', { side: 'enemies', hp: 40, maxHp: 40, monsterId: 'wolf', creatureType: 'beast', saves: weak }),
    mk('E', { side: 'enemies', hp: 90, maxHp: 90, monsterId: 'ogre', creatureType: 'undead', saves: weak }),
  ];
  const st = startBattle('a1', 'a1', parts, () => 0.5, { map: { id: 'col' } }).state;
  const pos: Record<string, { col: number; row: number }> = { A: o(3, 3), B: o(4, 3), C: o(2, 3), E: o(5, 4), H: o(3, 4), W: o(4, 2) };
  const combatants = { ...st.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...st, status: 'active', order: ['A', 'B', 'C', 'E', 'H', 'W'], turnIndex: 0, combatants,
    map: { ...(st.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 9 }, () => '.'.repeat(15)), objects: [], zones: [] } };
}
const withC = (s: BattleState, p: Partial<Combatant>): BattleState => ({ ...s, combatants: { ...s.combatants, C: { ...(s.combatants.C as Combatant), ...p } } });

describe('A1: büyü yoklaması (istisna yok)', () => {
  it('her büyü × hedef biçimleri: execute istisna fırlatmaz', () => {
    const base0 = arena();
    const crashes: string[] = [];
    let accepted = 0;
    for (const sp of spells) {
      const a = base0.combatants.A as Combatant;
      const base: BattleState = { ...base0, combatants: { ...base0.combatants, A: { ...a, spellNames: [sp.name] } } };
      const hit: BattleState = { ...base, combatants: { ...base.combatants, A: { ...(base.combatants.A as Combatant), economy: { ...a.economy, meleeHit: { targetId: 'B', critical: false } } } } };
      const tries: Array<[string, BattleState, Partial<Command>]> = [
        ['düşman', base, { targetId: 'B' }], ['düşman+altıgen', base, { targetId: 'B', targetHex: o(4, 3) }], ['altıgen', base, { targetHex: o(4, 3) }],
        ['dost', base, { targetId: 'C' }], ['kendi', base, { targetId: 'A' }], ['hedefsiz', base, {}], ['çoklu', base, { targetIds: ['B', 'E'] }],
        ['boş altıgen', base, { targetHex: o(7, 5) }], ['insansı', base, { targetId: 'H' }], ['hayvan', base, { targetId: 'W' }],
        ['vurduktan sonra', hit, { targetId: 'B' }], ['ölmekte dost', withC(base, { hp: 0, life: 'dying', conditions: ['Unconscious'] }), { targetId: 'C' }],
        ['ölü dost', withC(base, { hp: 0, life: 'dead', diedRound: base.round }), { targetId: 'C' }],
      ];
      for (const [label, st, extra] of tries) {
        const cmd = { type: 'cast_spell', actorId: 'A', spellName: sp.name, ...(sp.level > 0 ? { slotLevel: sp.level } : {}), ...extra } as Command;
        try { if (execute(st, cmd, P1, () => 0.3).ok) accepted++; } catch (e) { crashes.push(`${sp.name} (${label}): ${String(e).slice(0, 100)}`); }
      }
    }
    expect(crashes).toEqual([]);
    expect(spells.length).toBeGreaterThanOrEqual(330);
    expect(accepted).toBeGreaterThan(spells.length);
  }, 120_000);
});
