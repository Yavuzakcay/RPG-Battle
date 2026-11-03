/** Kuyruk 19 (Görev 4): Barbarian, Monk, Paladin 11–20. seviye özellikleri. */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { damageEffects } from './damage-effects';
import { applyEvents, replay } from './reduce';
import { P1, mk } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { finalScores } from '../rules/stats';
import { resolveSave } from '../rules/attack';
import { saveDice } from './effectDice';
import { capstoneStartEvents } from './capstones';
import type { AttackOption, BattleEvent, BattleState, Combatant } from './types';

const sheet = (classId: string, level: number, sub?: string) => ({ ...blankCharacter('x').sheet, name: classId, classId, subclassId: sub, level, baseScores: suggestedScores(classId) });

describe('Kuyruk 19: 20. seviye yetenek artışı', () => {
  it('Primal Champion STR/CON +4 (en çok 25), Body and Mind DEX/WIS +4', () => {
    const b19 = finalScores(sheet('barbarian', 19, 'path-of-the-berserker'));
    const b20 = finalScores(sheet('barbarian', 20, 'path-of-the-berserker'));
    expect(b20.str).toBe(Math.min(25, b19.str + 4));
    expect(b20.con).toBe(Math.min(25, b19.con + 4));
    const m20 = finalScores(sheet('monk', 20, 'warrior-of-the-open-hand'));
    expect(m20.dex).toBe(Math.min(25, finalScores(sheet('monk', 19, 'warrior-of-the-open-hand')).dex + 4));
  });
});

describe('Kuyruk 19: Barbarian', () => {
  it('Relentless Rage: öfkedeyken 0 HP\'de CON save; başarıda HP 2 × seviye, DC artar', () => {
    const c = mk('A', { hp: 5, maxHp: 100, level: 12, rage: { refreshed: true, added: [] }, traits: ['relentless-rage'], saves: { str: 0, dex: 0, con: 10, int: 0, wis: 0, cha: 0 }, resources: { relentlessRage: 10 } as Combatant['resources'] });
    const r = damageEffects(c, 20, 'slashing', false, () => 0.5);
    expect(r.hpAfter).toBe(24);
    expect(r.effects.find((e) => e.kind === 'relentless_rage')).toMatchObject({ dc: 10, success: true });
    const used = { ...c, resources: { relentlessRage: 9 } as Combatant['resources'] };
    expect(damageEffects(used, 20, 'slashing', false, () => 0.5).effects.find((e) => e.kind === 'relentless_rage')).toMatchObject({ dc: 15 });
  });
  it('Indomitable Might: STR save toplamı STR skorundan küçükse skor sayılır', () => {
    const c = mk('A', { strScore: 22, traits: ['indomitable-might'] });
    const r = resolveSave({ extra: saveDice(c, 'str'), modifier: 0, dc: 20, mode: 'normal' }, () => 0.01);
    expect(r.success).toBe(true);
    expect(r.total).toBe(22);
  });
  it('Persistent Rage: inisiyatifte Rage dolar (bir kez); tur sonunda bitmez', () => {
    const c = mk('A', { traits: ['persistent-rage'], resources: { rage: 1, persistentRage: 1 } as Combatant['resources'], resourceCaps: { rage: 5 } });
    const evs = capstoneStartEvents(c, false);
    expect(evs).toContainEqual({ type: 'feature_used', actorId: 'A', feature: 'rage', remaining: 5 });
  });
  it('Improved Brutal Strike: Sundering sonraki başka saldırıya AC −5 (tek kullanım); 17\'de iki etki', async () => {
    const { brutalOptions, brutalAfterEvents } = await import('./brutal');
    const b = mk('B', { ac: 15 });
    const a13 = mk('A', { level: 13, traits: ['brutal-strike', 'improved-brutal-strike'] });
    expect(brutalOptions(a13)).toEqual({ blows: ['forceful', 'hamstring', 'staggering', 'sundering'], max: 1 });
    expect(brutalOptions({ ...a13, level: 17 }).max).toBe(2);
    const st = { round: 1, combatants: { A: a13, B: b } } as unknown as BattleState;
    const evs = brutalAfterEvents(st, a13, b, 'sundering', () => 0.5);
    expect(evs[0]).toMatchObject({ type: 'effect_added', effect: { ac: -5, consumeOnAttacked: true } });
  });
});

describe('Kuyruk 19: Monk', () => {
  it('Perfect Focus: Focus 3 ya da azsa 4; Metabolism kullanıldıysa yok', () => {
    const c = mk('A', { traits: ['perfect-focus'], resources: { focus: 1 } as Combatant['resources'] });
    expect(capstoneStartEvents(c, false)).toContainEqual({ type: 'feature_used', actorId: 'A', feature: 'focus', remaining: 4 });
    expect(capstoneStartEvents(c, true)).toEqual([]);
  });
  it('Superior Defense: 3 Focus ile Force dışında direnç; Disciplined Survivor yeniden atış', () => {
    const parts = [mk('A', { ownerId: 'p1', traits: ['superior-defense'], resources: { focus: 5 } as Combatant['resources'] }), mk('B', { side: 'enemies' })];
    const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5).state;
    const s: BattleState = { ...s0, status: 'active', order: ['A', 'B'], turnIndex: 0 };
    const r = execute(s, { type: 'superior_defense', actorId: 'A' }, P1, () => 0.5);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.combatants.A?.resources.focus).toBe(2);
    expect(r.state.combatants.A?.effects?.find((e) => e.id === 'superior-defense')?.resist).not.toContain('force');
    expect(replay([{ type: 'battle_started', state: s }, ...r.events])).toEqual(r.state);
    const ds = mk('A', { traits: ['disciplined-survivor'], resources: { focus: 2 } as Combatant['resources'] });
    expect(saveDice(ds, 'wis').some((x) => x.label === 'Disciplined Survivor' && x.resource === 'focus')).toBe(true);
  });
});

describe('Kuyruk 19: Paladin', () => {
  it('Radiant Strikes: yakın dövüş isabetinde +1d8 Radiant; Restoring Touch ek durumları kaldırır', () => {
    const pal = combatantFromSheet(sheet('paladin', 11, 'oath-of-devotion'), { id: 'A', ownerId: 'p1' });
    expect(pal.traits).toContain('radiant-strikes');
    const sword = pal.weaponOptions.find((o) => !o.ranged) as AttackOption;
    const parts = [pal, mk('B', { side: 'enemies', hp: 80, maxHp: 80, ac: 5 })];
    const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5).state;
    const s: BattleState = { ...s0, status: 'active', order: ['A', 'B'], turnIndex: 0 };
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, () => 0.6);
    const atk = r.ok ? r.events.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }> : undefined;
    expect(atk?.extra?.some((x) => x.label === 'Radiant Strikes' && x.type === 'radiant')).toBe(true);
    const p14 = combatantFromSheet(sheet('paladin', 14, 'oath-of-devotion'), { id: 'A', ownerId: 'p1' });
    const ally = mk('C', { ownerId: 'p1', conditions: ['Stunned', 'Blinded'], pos: { col: 3, row: 3 } });
    const s2: BattleState = { ...s, order: ['A', 'B', 'C'], combatants: { ...s.combatants, A: { ...p14, pos: { col: 2, row: 3 } }, C: ally } };
    const lay = execute(s2, { type: 'use_feature', actorId: 'A', feature: 'paladin:lay-on-hands', targetId: 'C', amount: 0, cure: true }, P1, () => 0.5);
    if (!lay.ok) throw new Error(lay.error);
    expect(lay.state.combatants.C?.conditions.filter((x) => ['Stunned', 'Blinded'].includes(x))).toEqual([]);
    expect(lay.state.combatants.A?.resources.layOnHands).toBe(((s2.combatants.A as Combatant).resources.layOnHands ?? 0) - 10);
    void applyEvents;
  });
});
