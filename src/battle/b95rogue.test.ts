/** Görev B95-B (kural sürümü 97): Rogue denetim düzeltmeleri (ROGUE-DENETIM.md, SRD 5.2.1 s. 61–63; Thief bizim alt sınıf). */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { canSneak } from './features';
import { jumpRangeFeet } from './movement';
import { GM, P1, mk, scripted } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { ReactionRequest } from '../rules/reactionChoice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const claw = { name: 'Claw', bonus: 5, damageDice: '1d8+3', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
const sheet = (level: number, p: Record<string, unknown> = {}) => ({ ...blankCharacter('x').sheet, name: 'Gölge', classId: 'rogue', subclassId: 'thief', level,
  baseScores: { str: 8, dex: 17, con: 14, int: 10, wis: 12, cha: 10 }, backgroundBonuses: {},
  weapons: [{ name: 'Shortsword' }, { name: 'Dagger' }, { name: 'Javelin' }], offHand: 'Dagger', ...p });
function arena(level: number, rules: number, foe: Partial<Combatant> = {}, where: Record<string, Offset> = {}) {
  const r = combatantFromSheet(sheet(level), { id: 'A', ownerId: 'p1' });
  const parts = [r, mk('B', { side: 'enemies', hp: 200, maxHp: 200, ac: 5, attacks: [claw], ...foe }), mk('C', { ownerId: 'p1', hp: 30, maxHp: 30 })];
  const s = startBattle('r', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: rules, map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), B: o(4, 3), C: o(5, 3), ...where };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } } as BattleState;
}
const pad = (...first: Array<[number, number]>) => scripted(...first, ...Array.from({ length: 30 }, () => [20, 10] as [number, number]));
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const A = (s: BattleState) => s.combatants.A as Combatant;
const opt = (s: BattleState, label: string) => A(s).weaponOptions.find((x) => x.label === label)!;
const atk = (evs: BattleEvent[], actorId = 'A') => evs.find((e) => e.type === 'attack_resolved' && e.actorId === actorId) as Extract<BattleEvent, { type: 'attack_resolved' }> | undefined;

describe('Uncanny Dodge (s. 63: "an attacker that you can see")', () => {
  it('97: görünmez saldırgana kullanılmaz (tepki harcanmaz); 96: kullanılır', () => {
    for (const v of [96, 97]) {
      const s0 = arena(5, v, { conditions: ['Invisible'] });
      const s = { ...s0, turnIndex: 1, combatants: { ...s0.combatants, A: { ...A(s0), hp: 30, maxHp: 30 } } } as BattleState;
      const r = ok(execute(s, { type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM, pad([20, 15], [20, 15], [8, 8])));
      expect(!!atk(r.events, 'B')?.reacted).toBe(v === 96);
      expect(r.state.combatants.A?.economy.reaction).toBe(v === 96);
    }
  });
});

describe('Second-Story Work (Thief, bizim sürüm: Jumper DEX skoruyla)', () => {
  it('gerçek Thief (combatantFromSheet): 97\'de DEX 17 ile koşarak 17 ft; 96\'da STR 8 ile 8 ft', () => {
    for (const v of [96, 97]) {
      const s = arena(3, v);
      expect(A(s).traits).toContain('jumper-dex');
      expect(jumpRangeFeet(A(s), true, s)).toBe(v === 97 ? 17 : 8);
    }
  });
});

describe('Steady Aim sonrası hız 0 (s. 62): Withdraw kayması 0', () => {
  it('97: Steady Aim → isabet + Withdraw: kayma 0 altıgen; 96: yarı hız', () => {
    for (const v of [96, 97]) {
      const s = ok(execute(arena(5, v), { type: 'steady_aim', actorId: 'A' }, P1, pad())).state;
      const r = ok(execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Shortsword'), cunning: ['withdraw'] }, P1, pad([20, 15], [20, 15])));
      const g = r.events.find((e) => e.type === 'shift_granted');
      expect(g).toBeTruthy();
      expect(g && g.type === 'shift_granted' ? g.hexes : -1).toBe(v === 97 ? 0 : 3);
      expect(replay([{ type: 'battle_started', state: s }, ...r.events])).toEqual(r.state);
    }
  });
});

describe('Sneak Attack (s. 61–62: "a Finesse or a Ranged weapon")', () => {
  it('97: fırlatılan Javelin Sneak Attack almaz; 96: alır; Dagger (Finesse) fırlatması ikisinde de alır', () => {
    for (const v of [96, 97]) {
      const s = arena(5, v);
      const jav = A(s).weaponOptions.find((x) => x.weaponId === 'javelin' && x.ranged);
      const dag = A(s).weaponOptions.find((x) => x.weaponId === 'dagger' && x.ranged);
      expect(jav && dag).toBeTruthy();
      expect(canSneak(s, A(s), s.combatants.B as Combatant, jav, 'advantage')).toBe(v === 96);
      expect(canSneak(s, A(s), s.combatants.B as Combatant, dag, 'advantage')).toBe(true);
    }
  });
});

describe('Cunning Strike (s. 63): yan el, fırsat saldırısı, Ready', () => {
  it('97: yan el saldırısında seçilir; 96: yok sayılır', () => {
    for (const v of [96, 97]) {
      const s0 = arena(5, v);
      const s = { ...s0, combatants: { ...s0.combatants, A: { ...A(s0), economy: { ...A(s0).economy, lightAttack: true } } } } as BattleState;
      const r = ok(execute(s, { type: 'offhand_attack', actorId: 'A', targetId: 'B', cunning: ['trip'] }, P1, pad([20, 15])));
      expect(!!atk(r.events)?.cunning).toBe(v === 97);
    }
  });
  it('97: fırsat saldırısında Cunning Strike seçeneği sorulur ve uygulanır; 96: sorulmaz', () => {
    for (const v of [96, 97]) {
      const s0 = arena(5, v, {}, { B: o(4, 3), C: o(4, 4) });
      const s = { ...s0, turnIndex: 1 } as BattleState;
      const seen: ReactionRequest[] = [];
      const rng = Object.assign(pad([20, 15]) as Rng, { react: (req: ReactionRequest) => {
        seen.push(req);
        const c = req.options.find((x) => x.id.endsWith(':cunning:trip'));
        return c ? { option: c.id } : req.suggested;
      } });
      const r = ok(execute(s, { type: 'move', actorId: 'B', to: o(6, 3) } as Command, GM, rng));
      const oa = seen.find((q) => q.trigger === 'leave');
      expect(!!oa?.options.some((x) => x.id.endsWith(':cunning:trip'))).toBe(v === 97);
      expect(!!atk(r.events)?.cunning).toBe(v === 97);
    }
  });
  it('97: Ready saldırısına Cunning Strike yazılır; 96: reddedilir', () => {
    for (const v of [96, 97]) {
      const s = arena(5, v);
      const r = execute(s, { type: 'ready', actorId: 'A', trigger: 'erisime-girer', response: { kind: 'attack', option: opt(s, 'Shortsword'), cunning: ['trip'] } }, P1, pad());
      expect(r.ok).toBe(v === 97);
      if (r.ok) expect(A(r.state).readied?.response).toMatchObject({ kind: 'attack', cunning: ['trip'] });
    }
  });
});
