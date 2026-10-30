/**
 * Görev A3: iki aşamalı durumlar veriyle (condition-effects.json `escalate`). Sleep aynı mekanizmayı kullanır
 * (davranışı wizard.test'te); Cockatrice Petrifying Bite: ilk başarısızlık Restrained, sonraki turunun sonunda tekrar
 * save; başarıda biter, ikinci başarısızlıkta 24 saat Petrified.
 */
import { describe, expect, it } from 'vitest';
import { combatantFromMonster, execute, replay, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './index';
import { getMonster } from '../data';
import type { Rng } from '../rules/dice';
import { GM, P1, envId, mk, scripted, sword } from './fixtures';
import { spellEffect, stageOf, attackEffect } from './durations';

const monster = (id: string, cid: string): Combatant => combatantFromMonster(getMonster(id), { id: cid });
function arena(parts: Combatant[]): BattleState {
  return startBattle('a3', envId('Düz'), parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number]))).state;
}
class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, ctx: CommandContext, rng: Rng = scripted()) {
    const r = execute(this.state, cmd, ctx, rng);
    if (!r.ok) throw new Error(r.error);
    this.state = r.state; this.events.push(...r.events);
    return r.events;
  }
}
const bite = (r: Run, save: number) => {
  const i = r.state.combatants.K!.attacks.findIndex((a) => a.name === 'Petrifying Bite');
  return r.do({ type: 'monster_attack', actorId: 'K', targetId: 'A', attackIndex: i }, GM, scripted([20, 19], [4, 2], [20, save]));
};
const hero = () => mk('A', { ownerId: 'p1', ac: 10, hp: 40, maxHp: 40, weaponOptions: [sword] });

describe('iki aşamalı durumlar', () => {
  it('veri şeması: Sleep yeni biçimde (Incapacitated → Unconscious, kalan süre, hasarla uyanır); eski dize biçimi aynı anlamda', () => {
    expect(spellEffect('Sleep')).toMatchObject({ saveEnds: true, escalate: { condition: 'Unconscious' }, wakeOnDamage: true });
    expect(stageOf('Unconscious')).toEqual({ condition: 'Unconscious' });
    expect(attackEffect('cockatrice', 'Petrifying Bite')).toMatchObject({ condition: 'Restrained', maxRounds: 1, escalate: { condition: 'Petrified', rounds: 14400 } });
  });
  it('Cockatrice: ilk başarısızlık Restrained; sonraki tur sonunda ikinci başarısızlık Petrified (24 saat)', () => {
    const r = new Run(arena([monster('cockatrice', 'K'), hero()]));
    bite(r, 3);
    expect(r.state.combatants.A!.conditions).toContain('Restrained');
    expect(r.state.combatants.A!.conditionTimers?.[0]).toMatchObject({ condition: 'Restrained', ownerId: 'A', end: 'turnEnd', count: 1, save: { ability: 'con', dc: 11 } });
    r.do({ type: 'end_turn', actorId: 'K' }, GM);
    // A'nın tur sonu: tekrar save başarısız.
    r.do({ type: 'end_turn', actorId: 'A' }, P1, scripted([20, 4]));
    const a = r.state.combatants.A!;
    expect(a.conditions).toContain('Petrified');
    expect(a.conditions).not.toContain('Restrained');
    expect(a.conditionTimers?.[0]).toMatchObject({ condition: 'Petrified', count: 14400 });
    expect(a.conditionTimers?.[0]?.save).toBeUndefined();
    expect(replay(r.events)).toEqual(r.state);
  });
  it('Cockatrice: tekrar save başarılıysa etki biter; ilk save başarılıysa hiç başlamaz', () => {
    const r = new Run(arena([monster('cockatrice', 'K'), hero()]));
    bite(r, 3);
    r.do({ type: 'end_turn', actorId: 'K' }, GM);
    r.do({ type: 'end_turn', actorId: 'A' }, P1, scripted([20, 15]));
    expect(r.state.combatants.A!.conditions).not.toContain('Restrained');
    expect(r.state.combatants.A!.conditions).not.toContain('Petrified');
    const s = new Run(arena([monster('cockatrice', 'K'), hero()]));
    bite(s, 15);
    expect(s.state.combatants.A!.conditions).not.toContain('Restrained');
  });
});
