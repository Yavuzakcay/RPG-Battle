/** Görev B95-B (kural sürümü 97): Monk denetim düzeltmeleri (MONK-DENETIM.md, SRD 5.2.1 s. 49–52; Quivering Palm bizim alt sınıf). */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { selfRestorationEvents } from './classTraits';
import { executeSuperiorDefense } from './capstones';
import { P1, mk, scripted } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const sheet = (level: number, armorName = 'Zırhsız') => ({ ...blankCharacter('x').sheet, name: 'Su', classId: 'monk', subclassId: 'warrior-of-the-open-hand', level,
  baseScores: suggestedScores('monk'), armorName, weapons: [{ name: 'Quarterstaff' }] });
function arena(level: number, rules: number, armorName?: string, foe: Partial<Combatant> = {}) {
  const m = combatantFromSheet(sheet(level, armorName), { id: 'A', ownerId: 'p1' });
  const s = startBattle('m', 'd-z-zemin', [m, mk('B', { side: 'enemies', hp: 300, maxHp: 300, ac: 1, ...foe })], () => 0.5, { kuralSurumu: rules, map: { id: 'col' } }).state;
  const combatants = { ...s.combatants, A: { ...(s.combatants.A as Combatant), pos: o(3, 3) }, B: { ...(s.combatants.B as Combatant), pos: o(4, 3) } };
  return { ...s, status: 'active', order: ['A', 'B'], turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } } as BattleState;
}
const pad = () => scripted(...Array.from({ length: 30 }, () => [20, 10] as [number, number]));
const run = (s: BattleState, cmd: Command, rng = pad()) => execute(s, cmd, P1, rng);
const A = (s: BattleState) => s.combatants.A as Combatant;
const strike = (s: BattleState, label: string) => {
  const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: A(s).weaponOptions.find((x) => x.label === label)! });
  if (!r.ok) throw new Error(r.error);
  return r;
};

describe('Stunning Strike (s. 51)', () => {
  it('97: başarılı save\'de hedefin hızı yarı (Monk\'un sonraki turuna dek); 96: yok; replay aynı', () => {
    for (const v of [96, 97]) {
      const s = strike(arena(5, v, undefined, { saves: { str: 0, dex: 0, con: 30, int: 0, wis: 0, cha: 0 } }), 'Unarmed Strike').state;
      const r = run(s, { type: 'stunning_strike', actorId: 'A', targetId: 'B' });
      if (!r.ok) throw new Error(r.error);
      expect(r.events.find((e) => e.type === 'save_resolved')).toMatchObject({ success: true });
      expect(!!r.state.combatants.B?.effects?.some((e) => e.speedMult === 0.5)).toBe(v === 97);
      expect(replay([{ type: 'battle_started', state: s }, ...r.events])).toEqual(r.state);
    }
  });
  it('97: zırhlı Monk Unarmed Strike isabetinden sonra Stunning Strike yapabilir; 96: yapamaz', () => {
    for (const v of [96, 97]) {
      const s = strike(arena(5, v, 'Chain Mail'), 'Unarmed Strike').state;
      expect(A(s).economy.meleeHit?.martialArts).toBeFalsy();
      expect(run(s, { type: 'stunning_strike', actorId: 'A', targetId: 'B' }).ok).toBe(v === 97);
    }
  });
});

describe('Self-Restoration (s. 52: "remove one of the following conditions")', () => {
  it('97: tur sonunda yalnız bir durum kalkar; 96: hepsi', () => {
    for (const v of [96, 97]) {
      const s = arena(10, v);
      const st = { ...s, combatants: { ...s.combatants, A: { ...A(s), conditions: ['Charmed', 'Frightened', 'Poisoned'] } } } as BattleState;
      expect(selfRestorationEvents(st, 'A').length).toBe(v === 97 ? 1 : 3);
    }
  });
});

describe('Superior Defense (s. 52: "1 minute")', () => {
  it('97: tam 10 tur (round + 9); 96: round + 10', () => {
    for (const v of [96, 97]) {
      const s = arena(18, v);
      const r = executeSuperiorDefense(s, A(s));
      if (!r.ok) throw new Error(r.error);
      expect(A(r.state).effects?.find((e) => e.id === 'superior-defense')?.until).toBe(s.round + (v === 97 ? 9 : 10));
    }
  });
});

describe('Quivering Palm (bizim alt sınıf: "Unarmed Strike isabetinde")', () => {
  const QP = 'monk/warrior-of-the-open-hand:quivering-palm';
  it('97: Monk silahı (Quarterstaff) isabeti titreşim kurmaz, Unarmed Strike kurar; 96: ikisi de kurar', () => {
    for (const v of [96, 97]) {
      const staff = strike(arena(17, v), 'Quarterstaff').state;
      expect(run(staff, { type: 'use_feature', actorId: 'A', feature: QP }).ok).toBe(v === 96);
      const fist = strike(arena(17, v), 'Unarmed Strike').state;
      expect(run(fist, { type: 'use_feature', actorId: 'A', feature: QP }).ok).toBe(true);
    }
  });
});
