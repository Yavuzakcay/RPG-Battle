/**
 * Görev B93 (kural sürümü 93): Cleric, Sorcerer, Wizard ve Warlock denetim düzeltmeleri. Her maddede 93 davranışı ve
 * gerektiğinde 92 (eski kayıt/replay) davranışı.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { divineStrikeHit } from './cleric';
import { GM, P1, mk } from './fixtures';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };

export class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, ctx: CommandContext = P1, rng: Rng = () => 0.5) {
    const r = execute(this.state, cmd, ctx, rng);
    if (!r.ok) throw new Error(r.error);
    this.state = r.state; this.events.push(...r.events);
    return r.events;
  }
  try(cmd: Command, ctx: CommandContext = P1, rng: Rng = () => 0.5) { return execute(this.state, cmd, ctx, rng); }
  end(rng: Rng = () => 0.5) { const id = this.state.order[this.state.turnIndex] as string; return this.do({ type: 'end_turn', actorId: id }, this.state.combatants[id]?.side === 'enemies' ? GM : P1, rng); }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
export function arena(a: Combatant, foes: Array<[string, Partial<Combatant>, Offset]>, opts: { ally?: [Partial<Combatant>, Offset]; rules?: number } = {}) {
  const ally = opts.ally;
  const parts = [a, ...foes.map(([id, p]) => mk(id, { side: 'enemies', hp: 60, maxHp: 60, saves: LOW, ...p })), ...(ally ? [mk('C', { ownerId: 'p1', hp: 30, maxHp: 30, ...ally[0] })] : [])];
  const s = startBattle('w', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), ...Object.fromEntries(foes.map(([id, , p]) => [id, p])), ...(ally ? { C: ally[1] } : {}) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return new Run({ ...s, ...(opts.rules ? { kuralSurumu: opts.rules } : {}), status: 'active', order: Object.keys(pos), turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } });
}
export const caster = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0], spellSaveDc: 15, spellAttack: 30, spellMod: 4, level: 10, ...p });
const dmgOf = (evs: BattleEvent[], id = 'B') => evs.filter((e) => e.type === 'attack_resolved' && e.targetId === id).reduce((n, e) => n + (e as { rawDamage: number }).rawDamage, 0);

describe('A1: tek zara eklenen değerler (Empowered Evocation, Elemental Affinity)', () => {
  it('Magic Missile: Empowered Evocation +INT yalnız bir darta (93); 92\'de her darta', () => {
    const a = caster({ spellNames: ['Magic Missile'], traits: ['empowered-evocation'] });
    const now = arena(a, [['B', {}, o(5, 3)]]).do({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' });
    const old = arena(a, [['B', {}, o(5, 3)]], { rules: 92 }).do({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' });
    // 3 dart × (1d4 = 3, +1) = 12; +4 bir kez.
    expect(dmgOf(now)).toBe(16);
    expect(dmgOf(old)).toBe(24);
  });
  it('Scorching Ray: Elemental Affinity +CHA yalnız ilk isabet eden ışına (93)', () => {
    const a = caster({ spellNames: ['Scorching Ray'], traits: ['affinity-fire'], modifiers: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 3 } });
    const now = arena(a, [['B', {}, o(5, 3)]]).do({ type: 'cast_spell', actorId: 'A', spellName: 'Scorching Ray', targetId: 'B', slotLevel: 2 });
    const old = arena(a, [['B', {}, o(5, 3)]], { rules: 92 }).do({ type: 'cast_spell', actorId: 'A', spellName: 'Scorching Ray', targetId: 'B', slotLevel: 2 });
    expect(dmgOf(old) - dmgOf(now)).toBe(6); // 3 ışın: 92 +9, 93 +3
  });
  it('Fireball (tek zar) aynı kalır: +INT bir kez', () => {
    const a = caster({ spellNames: ['Fireball'], traits: ['empowered-evocation'] });
    const save = (evs: BattleEvent[]) => (evs.find((e) => e.type === 'save_resolved') as { rawDamage: number }).rawDamage;
    const now = arena(a, [['B', {}, o(8, 3)]]).do({ type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: o(8, 3) });
    const old = arena(a, [['B', {}, o(8, 3)]], { rules: 92 }).do({ type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: o(8, 3) });
    expect(save(now)).toBe(save(old));
  });
  it('Empowered Spell Magic Missile dartlarında zar yeniden atar, büyü başına en çok CHA zar (93); 92\'de etkisiz', () => {
    const count = (rules?: number) => {
      let n = 0;
      const rng: Rng = () => { n++; return 0.1; };
      const a = caster({ spellNames: ['Magic Missile'], traits: ['mm-empowered'], modifiers: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 2 } });
      arena(a, [['B', {}, o(5, 3)]], { rules }).do({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' }, P1, rng);
      return n;
    };
    expect(count(93) - count(92)).toBe(2); // 3 dart, CHA 2: iki dart yeniden
  });
});

describe('A3: Divine Strike / Primal Strike yalnız kendi turunda', () => {
  const opt: AttackOption = { label: 'Mace', attackBonus: 5, damage: '1d6', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'mace' };
  it('başkasının turunda (fırsat saldırısı) ek zar yok; kendi turunda var; 92\'de ikisinde de', () => {
    for (const trait of ['divine-strike', 'primal-strike']) {
      const r = arena(caster({ traits: [trait] }), [['B', {}, o(4, 3)]]);
      const own = divineStrikeHit(r.state, r.c('A'), r.c('B'), opt, false, () => 0.5);
      expect(own?.extra.raw).toBeGreaterThan(0);
      const other = { ...r.state, turnIndex: 1 };
      expect(divineStrikeHit(other, r.c('A'), r.c('B'), opt, false, () => 0.5)).toBeNull();
      expect(divineStrikeHit({ ...other, kuralSurumu: 92 }, r.c('A'), r.c('B'), opt, false, () => 0.5)).not.toBeNull();
    }
  });
});
