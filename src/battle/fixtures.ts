/** Testlerde kullanılan ortak yardımcılar: sahte rastgele üretici, savaşçı ve savaş kurulumu. */
import { environments } from '../data';
import type { Rng } from '../rules/dice';
import { execute } from './commands';
import { startBattle } from './create';
import type { AttackOption, BattleState, Combatant, CommandContext } from './types';

/** Sırayla verilen [yüz sayısı, değer] çiftlerini üreten sahte rastgele üretici. */
export function scripted(...rolls: Array<[number, number]>): Rng {
  let i = 0;
  return () => {
    const [sides, value] = rolls[i++] ?? [20, 1];
    return (value - 0.5) / sides;
  };
}

/** Aynı yüz sayısından birkaç zar değeri: dice(6, 3, 3, 3) gibi. */
export function dice(sides: number, ...values: number[]): Array<[number, number]> {
  return values.map((v) => [sides, v] as [number, number]);
}

export const zero = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

export function mk(id: string, p: Partial<Combatant> = {}): Combatant {
  return {
    id, name: id, avatar: { src: `avatars/${id}.webp`, bg: '#555', label: id.slice(0, 2) }, side: 'party', ownerId: null, ac: 12, hp: 20, maxHp: 20, speed: 30,
    initiativeBonus: 0, initiative: 0, height: 0, pos: null, movementUsed: 0, fly: 0, strScore: 10, run: null, hidden: null, stealthDisadvantage: false, conditions: [], modifiers: zero, saves: zero,
    climbMod: 2, spellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0], resistances: [], immunities: [],
    vulnerabilities: [], packTactics: false, level: 1, spellMod: 0, spellSaveDc: null,
    spellAttack: null, spellNames: [], casterTag: id.toLowerCase(), attacks: [], multiattack: false,
    undeadFortitude: false, regeneration: 0, rechargeUsed: [], regenBlocked: false, regenPending: false, life: 'alive', deathSaves: { successes: 0, failures: 0 }, weaponOptions: [], ...p,
  };
}

export const GM: CommandContext = { playerId: 'gm', isGm: true };
export const P1: CommandContext = { playerId: 'p1', isGm: false };
export const P2: CommandContext = { playerId: 'p2', isGm: false };

export const envId = (prefix: string) => {
  const e = environments.find((x) => x.name.startsWith(prefix));
  if (!e) throw new Error(`ortam yok: ${prefix}`);
  return e.id;
};

export const sword: AttackOption = {
  label: 'Longsword', attackBonus: 5, damage: '1d8+3', damageType: 'slashing',
  ranged: false, spell: false, tag: 'human fighter longsword slashing',
};

/** A (oyuncu p1), B (düşman), C (oyuncu p2). Sıra: C, B, A. */
export function setup(env = 'Düz', overrides: Record<string, Partial<Combatant>> = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', initiativeBonus: 2, ...overrides.A }),
    mk('B', { side: 'enemies', ...overrides.B }),
    mk('C', { ownerId: 'p2', initiativeBonus: 1, ...overrides.C }),
  ];
  // A: 10+2=12, B: 15+0=15, C: 15+1=16
  return startBattle('b1', envId(env), parts, scripted([20, 10], [20, 15], [20, 15])).state;
}

/** Sıra istenen savaşçıya gelene kadar end_turn uygular. */
export function advanceTo(state: BattleState, id: string): BattleState {
  let s = state;
  for (let i = 0; i < 10 && s.order[s.turnIndex] !== id; i++) {
    const actor = s.order[s.turnIndex] ?? '';
    const c = s.combatants[actor];
    const ctx = c && c.side === 'enemies' ? GM : { playerId: c?.ownerId ?? null, isGm: false };
    const r = execute(s, { type: 'end_turn', actorId: actor }, ctx, scripted());
    if (!r.ok) throw new Error(r.error);
    s = r.state;
  }
  return s;
}
