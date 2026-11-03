/** Kuyruk 19: canavarların kalıcı azaltmaları (monsterDrain), Greater Restoration seçimi, Death Ward ve hasarsız ölüm. */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster } from './create';
import { getMonster } from '../data';
import { exhaustionGain } from './deathWard';
import { mk, P1 } from './fixtures';
import { seededRng } from '../rules/dice';
import { caster, field, run } from './k19spells.test';
import type { BattleState, Combatant } from './types';

const pos = { M: { col: 4, row: 3 }, A: { col: 3, row: 3 }, B: { col: 5, row: 3 } };
function vs(monster: string, kural = 16, toggles?: Record<string, boolean>): BattleState {
  const m = { ...combatantFromMonster(getMonster(monster)!, { id: 'M' }), side: 'enemies' as const };
  const a = caster({ spellNames: ['Greater Restoration', 'Death Ward'], casterTag: 'cleric', hp: 300, maxHp: 300, ac: 1 });
  return field([m as Combatant, a, mk('B', { ownerId: 'p1' })], pos, kural, toggles);
}
const hitUntil = (s: BattleState, pred: (s: BattleState) => boolean) => {
  const idx = Math.max(0, (s.combatants.M as Combatant).attacks.findIndex((a) => /Drain|Swipe/.test(a.name)));
  for (let seed = 1; seed < 60; seed++) {
    const r = execute({ ...s, turnIndex: 0, order: ['M', 'A', 'B'] }, { type: 'monster_attack', actorId: 'M', targetId: 'A', attackIndex: idx }, { playerId: 'gm', isGm: true }, seededRng(seed));
    if (r.ok && pred(r.state)) return r;
  }
  throw new Error('isabet yok');
};

describe('Kuyruk 19: monsterDrain', () => {
  it('Wight Life Drain HP maksimumunu hasar kadar düşürür; Greater Restoration geri verir; eski sürümde yok', () => {
    const r = hitUntil(vs('wight'), (s) => (s.combatants.A?.maxHpLoss ?? 0) > 0);
    const a = r.state.combatants.A as Combatant;
    expect(a.maxHp).toBe(300 - (a.maxHpLoss ?? 0));
    const s2 = { ...r.state, turnIndex: 1, order: ['M', 'A', 'B'] };
    const gr = run(s2, { type: 'cast_spell', actorId: 'A', spellName: 'Greater Restoration', targetId: 'A', choice: 'gr-maxhp', slotLevel: 5 });
    expect(gr.state.combatants.A?.maxHp).toBe(300);
    expect(gr.state.combatants.A?.maxHpLoss).toBeUndefined();
    const old = hitUntil(vs('wight', 15), (s) => (s.combatants.A?.hp ?? 300) < 300);
    expect(old.state.combatants.A?.maxHp).toBe(300);
  });
  it('Shadow Draining Swipe STR değiştiricisini ve save\'i düşürür; Greater Restoration kaldırır', () => {
    const r = hitUntil(vs('shadow'), (s) => !!s.combatants.A?.abilityLoss?.str);
    const a = r.state.combatants.A as Combatant;
    expect(a.saves.str).toBe(a.modifiers.str + (vs('shadow').combatants.A as Combatant).saves.str - (vs('shadow').combatants.A as Combatant).modifiers.str);
    const gr = run({ ...r.state, turnIndex: 1, order: ['M', 'A', 'B'] }, { type: 'cast_spell', actorId: 'A', spellName: 'Greater Restoration', targetId: 'A', slotLevel: 5 });
    expect(gr.state.combatants.A?.abilityLoss).toBeUndefined();
    expect(gr.state.combatants.A?.modifiers.str).toBe((vs('shadow').combatants.A as Combatant).modifiers.str);
  });
});

describe('Kuyruk 19: Greater Restoration ve Death Ward', () => {
  it('Exhaustion bir seviye iner (eski sürümde reddedilir); 6. seviye Death Ward\'la boşa çıkar', () => {
    const s = vs('wight');
    const ex = { ...s, turnIndex: 1, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), exhaustion: 2 } } };
    const gr = run(ex, { type: 'cast_spell', actorId: 'A', spellName: 'Greater Restoration', targetId: 'A', slotLevel: 5 });
    expect(gr.state.combatants.A?.exhaustion).toBe(1);
    const o = vs('wight', 15);
    const exOld = { ...o, turnIndex: 1, combatants: { ...o.combatants, A: { ...(o.combatants.A as Combatant), exhaustion: 2 } } };
    expect(execute(exOld, { type: 'cast_spell', actorId: 'A', spellName: 'Greater Restoration', targetId: 'A', slotLevel: 5 }, P1, seededRng(1)).ok).toBe(false);
    const dw = run({ ...s, turnIndex: 1 }, { type: 'cast_spell', actorId: 'A', spellName: 'Death Ward', targetIds: ['A'], slotLevel: 4 });
    const a = { ...(dw.state.combatants.A as Combatant), exhaustion: 5 };
    expect(exhaustionGain(dw.state, a, 6, 'test').map((e) => e.type)).toEqual(['map_note', 'effect_ended']);
    expect(exhaustionGain({ ...dw.state, map: { ...dw.state.map!, ruleToggles: { spellsK19: false } } }, a, 6, 'test').map((e) => e.type)).toEqual(['exhaustion_changed']);
  });
});
