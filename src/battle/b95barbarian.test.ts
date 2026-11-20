/** Görev B95-B (kural sürümü 97): Barbarian denetim düzeltmeleri (BARBARIAN-DENETIM.md, SRD 5.2.1 s. 29–30). */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { applyEvents, replay } from './reduce';
import { damageEffects } from './damage-effects';
import { brutalAfterEvents } from './brutal';
import { GM, P1, mk, scripted } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const sheet = (level: number, sub = 'path-of-the-berserker') => ({ ...blankCharacter('x').sheet, name: 'Bor', classId: 'barbarian', subclassId: sub, level, baseScores: suggestedScores('barbarian'),
  weapons: [{ name: 'Greataxe' }] });
function arena(level: number, rules: number, foe: Partial<Combatant> = {}) {
  const bar = combatantFromSheet(sheet(level), { id: 'A', ownerId: 'p1' });
  const parts = [bar, mk('B', { side: 'enemies', hp: 200, maxHp: 200, ac: 5, ...foe }), mk('C', { ownerId: 'p1' })];
  const s = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: rules, map: { id: 'col' } }).state;
  const where: Record<string, Offset> = { A: o(3, 3), B: o(4, 3), C: o(1, 1) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(where)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  combatants.A = { ...(combatants.A as Combatant), rage: { refreshed: false, added: [] } };
  return { ...s, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } } as BattleState;
}
const pad = () => scripted(...Array.from({ length: 30 }, () => [20, 10] as [number, number]));
const run = (s: BattleState, cmd: Command, rng = pad()) => { const r = execute(s, cmd, (cmd as { actorId?: string }).actorId === 'B' ? GM : P1, rng); if (!r.ok) throw new Error(r.error); return r; };
const A = (s: BattleState) => s.combatants.A as Combatant;
const opt = (s: BattleState) => A(s).weaponOptions.find((x) => x.label === 'Greataxe')!;

describe('Rage uzatması (s. 29: "on your next turn" … "Force an enemy to make a saving throw")', () => {
  it('97: başkasının turundaki saldırı (fırsat saldırısı, Retaliation) uzatmaz; 96: uzatır; kendi turunda ikisi de uzatır', () => {
    for (const v of [96, 97]) {
      const s = arena(5, v);
      const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s) });
      expect(A(r.state).rage?.refreshed).toBe(true);
      const other = applyEvents({ ...s, turnIndex: 1 }, r.events);
      expect(A(other).rage?.refreshed).toBe(v === 96);
    }
  });
  it('97: Grapple save\'i uzatır; 96: uzatmaz; replay aynı', () => {
    for (const v of [96, 97]) {
      const s = arena(5, v);
      const r = run(s, { type: 'grapple', actorId: 'A', targetId: 'B' });
      expect(A(r.state).rage?.refreshed).toBe(v === 97);
      expect(replay([{ type: 'battle_started', state: s }, ...r.events])).toEqual(r.state);
    }
  });
  it('97: Intimidating Presence (save_resolved) ve alan (area_used) uzatır; 96: uzatmaz', () => {
    for (const v of [96, 97]) {
      const s = arena(14, v);
      const r = run(s, { type: 'use_feature', actorId: 'A', feature: 'barbarian/path-of-the-berserker:intimidating-presence' }, () => 0.05);
      expect(r.events.some((e) => e.type === 'save_resolved')).toBe(true);
      expect(A(r.state).rage?.refreshed).toBe(v === 97);
      const area: BattleEvent = { type: 'area_used', actorId: 'A', label: 'Breath Weapon', shape: 'cone', sizeFt: 15, hexes: [o(4, 3)], targetIds: ['B'] } as BattleEvent;
      expect(A(applyEvents(s, [area])).rage?.refreshed).toBe(v === 97);
    }
  });
});

describe('Persistent Rage (s. 30: "Unconscious condition (not just the Incapacitated condition)")', () => {
  it('97: Stunned Rage\'i bitirmez, Unconscious bitirir; 96: Stunned bitirir', () => {
    for (const v of [96, 97]) {
      const s = arena(15, v);
      const stun = applyEvents(s, [{ type: 'condition_changed', targetId: 'A', condition: 'Stunned', present: true, reason: 'test' } as BattleEvent]);
      expect(!!A(stun).rage).toBe(v === 97);
      const ko = applyEvents(s, [{ type: 'condition_changed', targetId: 'A', condition: 'Unconscious', present: true, reason: 'test' } as BattleEvent]);
      expect(A(ko).rage).toBeFalsy();
    }
  });
  it('Persistent Rage olmayan Barbarian Stunned olunca 97\'de de biter', () => {
    const s = arena(5, 97);
    expect(A(applyEvents(s, [{ type: 'condition_changed', targetId: 'A', condition: 'Stunned', present: true, reason: 'test' } as BattleEvent])).rage).toBeFalsy();
  });
});

describe('Relentless Rage (s. 30: "…and don\'t die outright")', () => {
  it('97: anında ölüm hasarında çalışmaz; ölmeyen hasarda çalışır; 96: anında ölümde de çalışır', () => {
    const base = mk('A', { hp: 5, maxHp: 30, level: 12, rage: { refreshed: true, added: [] }, traits: ['relentless-rage'], saves: { str: 0, dex: 0, con: 10, int: 0, wis: 0, cha: 0 }, resources: { relentlessRage: 10 } as Combatant['resources'] });
    const old = damageEffects(base, 100, 'slashing', false, () => 0.5);
    expect(old.hpAfter).toBe(24);
    const now = damageEffects({ ...base, sinif97: true }, 100, 'slashing', false, () => 0.5);
    expect(now.effects.some((e) => e.kind === 'relentless_rage')).toBe(false);
    expect(now.effects).toContainEqual({ kind: 'instant_death' });
    expect(damageEffects({ ...base, sinif97: true }, 20, 'slashing', false, () => 0.5).hpAfter).toBe(24);
  });
  it('savaş 97+ ise savaşçıya işaret yazılır (96\'da yok)', () => {
    expect(A(arena(5, 97)).sinif97).toBe(true);
    expect(A(arena(5, 96)).sinif97).toBeUndefined();
  });
});

describe('Improved Brutal Strike (s. 30)', () => {
  it('Sundering Blow: 97\'de Barbarian\'ın kendi saldırısına +5 işlemez; başka yaratığın saldırısı harcar', () => {
    for (const v of [96, 97]) {
      const s0 = arena(13, v, { ac: 15 });
      const add = brutalAfterEvents(s0, A(s0), s0.combatants.B as Combatant, 'sundering', () => 0.5);
      const s = applyEvents(s0, add);
      // d20 = 8, saldırı bonusu + 8: AC 15'e (ya da −5 ile 10'a) karşı.
      const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s) }, scripted([20, 8], [12, 6]));
      const ev = r.events.find((e) => e.type === 'attack_resolved');
      const total = ev && ev.type === 'attack_resolved' ? ev.total : 0;
      expect(ev && ev.type === 'attack_resolved' && ev.hit).toBe(v === 96 ? total >= 10 : total >= 15);
      expect(r.state.combatants.B?.effects?.some((e) => e.name === 'Sundering Blow')).toBe(true);
      const byC = applyEvents(r.state, [{ ...(ev as BattleEvent), actorId: 'C' } as BattleEvent]);
      expect(byC.combatants.B?.effects?.some((e) => e.name === 'Sundering Blow')).toBe(false);
    }
  });
  it('Staggering Blow: 97\'de tur sonu tekrar save\'i (effect_tick) ve Topple save\'i dezavantajı harcar; 96\'da kalır', () => {
    for (const v of [96, 97]) {
      const s0 = arena(13, v);
      const s = applyEvents(s0, brutalAfterEvents(s0, A(s0), s0.combatants.B as Combatant, 'staggering', () => 0.5));
      expect(s.combatants.B?.effects?.some((e) => e.saveDisAll)).toBe(true);
      const tick = { type: 'effect_tick', targetId: 'B', effectId: 'x', name: 'X', damageRolls: [], appliedDamage: 0, damageType: 'psychic', targetHpAfter: 200, effects: [],
        save: { ability: 'wis', dc: 10, d20: [3, 15], total: 3, success: false } } as unknown as BattleEvent;
      expect(applyEvents(s, [tick]).combatants.B?.effects?.some((e) => e.saveDisAll)).toBe(v === 96);
    }
  });
});
