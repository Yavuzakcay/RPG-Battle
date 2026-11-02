/** Kuyruk 19 (0f): canavar duyuları ve yapay zekânın Blindness/Deafness seçimi. */
import { describe, expect, it } from 'vitest';
import { getMonster } from '../data';
import { combatantFromMonster, combatantFromSheet, monsterSenses, startBattle } from './create';
import { blindChoice } from './ai';
import { mk } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { BattleState, Combatant } from './types';

const wizard = (): Combatant => {
  const c = combatantFromSheet({ ...blankCharacter('w').sheet, name: 'W', classId: 'wizard', subclassId: 'evoker', level: 5, baseScores: suggestedScores('wizard') }, { id: 'A', ownerId: 'p1' });
  return { ...c, spellNames: [...new Set([...c.spellNames, 'Blindness/Deafness'])] };
};
function battle(foe: Combatant, kuralSurumu = 16): BattleState {
  const s = startBattle('b', 'd-z-zemin', [wizard(), foe], () => 0.5, { kuralSurumu, map: { id: 'col' } }).state;
  const combatants = { ...s.combatants };
  combatants.A = { ...(combatants.A as Combatant), pos: { col: 3, row: 3 } };
  combatants[foe.id] = { ...(combatants[foe.id] as Combatant), pos: { col: 6, row: 3 } };
  return { ...s, status: 'active', order: ['A', foe.id], turnIndex: 0, combatants };
}

describe('Kuyruk 19: duyular ve Blindness/Deafness', () => {
  it('canavar duyuları verideki notlardan', () => {
    expect(monsterSenses(getMonster('young-red-dragon'))).toEqual({ blindsight: 30 });
    expect(monsterSenses(getMonster('wolf'))).toBeUndefined();
    expect(combatantFromMonster(getMonster('young-red-dragon'), { id: 'D' }).senses).toEqual({ blindsight: 30 });
  });
  it('yapay zekâ güçlü düşmana Blinded, görüşe dayanmayana Deafened seçer; anahtar kapalıyken yapmaz', () => {
    const ogre = mk('B', { side: 'enemies', hp: 60, maxHp: 60 });
    const cmd = blindChoice(battle(ogre), battle(ogre).combatants.A as Combatant);
    expect(cmd).toMatchObject({ type: 'cast_spell', spellName: 'Blindness/Deafness', targetId: 'B', choice: 'Blinded' });
    const bat = mk('B', { side: 'enemies', hp: 60, maxHp: 60, senses: { blindsight: 60 } });
    expect(blindChoice(battle(bat), battle(bat).combatants.A as Combatant)).toMatchObject({ choice: 'Deafened' });
    expect(blindChoice(battle(ogre, 15), battle(ogre, 15).combatants.A as Combatant)).toBeNull();
  });
});

import { moveCostFn } from './movement';
import { execute } from './commands';
import { P1 } from './fixtures';

describe('Kuyruk 19: Water Walk', () => {
  function pond(kuralSurumu = 16, toggles?: Record<string, boolean>): BattleState {
    const cleric = combatantFromSheet({ ...blankCharacter('c').sheet, name: 'C', classId: 'cleric', subclassId: 'life-domain', level: 5, baseScores: suggestedScores('cleric') }, { id: 'A', ownerId: 'p1' });
    const caster = { ...cleric, spellNames: [...new Set([...cleric.spellNames, 'Water Walk'])] };
    const s = startBattle('w', 'd-z-zemin', [caster, mk('B', { side: 'enemies', hp: 30, maxHp: 30 })], () => 0.5, { kuralSurumu, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
    const combatants = { ...s.combatants };
    combatants.A = { ...(combatants.A as Combatant), pos: { col: 2, row: 3 } };
    combatants.B = { ...(combatants.B as Combatant), pos: { col: 12, row: 3 } };
    const tiles = Array.from({ length: 7 }, (_, r) => (r === 3 ? '..nnnn.........' : '...............'));
    return { ...s, status: 'active', order: ['A', 'B'], turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles } };
  }
  it('büyü dosta etki verir; sığ su/çamur normal zemin maliyetinde; anahtar kapalı ya da eski sürümde zorlu zemin', () => {
    const s = pond();
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Water Walk', targetIds: ['A'] }, P1, () => 0.5);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const a = r.state.combatants.A as Combatant;
    expect(a.effects?.some((e) => e.waterWalk)).toBe(true);
    expect(moveCostFn(r.state, a)({ col: 3, row: 3 }, { col: 2, row: 3 })).toBe(1);
    const off = { ...r.state, map: { ...(r.state.map as NonNullable<BattleState['map']>), ruleToggles: { waterWalk: false } } };
    expect(moveCostFn(off, a)({ col: 3, row: 3 }, { col: 2, row: 3 })).toBe(2);
    expect(moveCostFn({ ...r.state, kuralSurumu: 15 }, a)({ col: 3, row: 3 }, { col: 2, row: 3 })).toBe(2);
  });
});

import { executeEscapeGrapple } from './grapple';
import { scripted } from './fixtures';

describe('Kuyruk 19: Powerful Build', () => {
  it('Goliath Grappled kaçışında iki zar atar (avantaj); anahtar kapalı ya da eski sürümde tek zar', () => {
    const base = mk('A', { ownerId: 'p1', raceId: 'goliath', grapple: { by: 'B', escapeDc: 30, restrained: false } });
    const mkState = (kuralSurumu: number, toggles?: Record<string, boolean>) => {
      const s = startBattle('g', 'd-z-zemin', [base, mk('B', { side: 'enemies' })], () => 0.5, { kuralSurumu, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
      return { ...s, status: 'active' as const };
    };
    const d20Of = (s: BattleState) => {
      const r = executeEscapeGrapple(s, s.combatants.A as Combatant, scripted([20, 5], [20, 15]));
      return r.ok ? (r.events[0] as { d20: number[] }).d20.length : -1;
    };
    expect(d20Of(mkState(16))).toBe(2);
    expect(d20Of(mkState(16, { powerfulBuild: false }))).toBe(1);
    expect(d20Of(mkState(15))).toBe(1);
  });
});

describe('Kuyruk 19: Gust of Wind bulutları dağıtır', () => {
  function windy(kuralSurumu = 16, toggles?: Record<string, boolean>): BattleState {
    const w = wizard();
    const caster = { ...w, spellNames: [...new Set([...w.spellNames, 'Gust of Wind'])] };
    const s = startBattle('g', 'd-z-zemin', [caster, mk('B', { side: 'enemies', hp: 30, maxHp: 30 })], () => 0.5, { kuralSurumu, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
    const combatants = { ...s.combatants };
    combatants.A = { ...(combatants.A as Combatant), pos: { col: 2, row: 3 } };
    combatants.B = { ...(combatants.B as Combatant), pos: { col: 12, row: 0 } };
    const fog = { id: 'fog1', spellId: 'fog-cloud', name: 'Fog Cloud', casterId: 'B', side: 'enemies' as const, dc: 13, slotLevel: 1, hexes: [{ col: 5, row: 3 }, { col: 6, row: 3 }] };
    return { ...s, status: 'active', order: ['A', 'B'], turnIndex: 0, combatants,
      map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)), zones: [fog] } };
  }
  const cast = (s: BattleState) => execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Gust of Wind', targetHex: { col: 8, row: 3 } }, P1, () => 0.5);
  it('çizgiye değen Fog Cloud biter; anahtar kapalı ya da eski sürümde kalır', () => {
    const r = cast(windy());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.events.some((e) => e.type === 'zone_ended' && e.zoneId === 'fog1')).toBe(true);
    for (const s of [windy(16, { gustDisperse: false }), windy(15)]) {
      const q = cast(s);
      expect(q.ok && q.events.some((e) => e.type === 'zone_ended' && e.zoneId === 'fog1')).toBe(false);
    }
  });
});
