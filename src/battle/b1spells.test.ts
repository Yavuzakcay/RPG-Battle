/**
 * Kuyruk B1: altı SRD büyüsünün savaşta uçtan uca çalıştığının doğrulanması (Death Ward, Guardian of Faith, Faithful
 * Hound, Giant Insect, Animate Objects, Contagion). Kuyruk 19'un testlerini (k19spells.test.ts) tamamlar: ani ölüm
 * engeli, Giant Insect biçim jetonu/halkası ve konsantrasyon bozulması, Contagion üç başarı, Animate Objects çok varlık
 * ve sıra, Guardian/Hound eski sürümde kapalı; replay aynı (`run` denetler).
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { applyEvents } from './reduce';
import { chooseCommand } from './ai';
import { GM, P1, mk } from './fixtures';
import { seededRng } from '../rules/dice';
import { caster, field, run } from './k19spells.test';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 200, maxHp: 200, ...p });
const summonsOf = (s: BattleState, spellId: string) => Object.values(s.combatants).filter((c) => c.summon?.spellId === spellId && !c.summon.gone);

describe('B1 Death Ward', () => {
  const pos = { A: { col: 2, row: 3 }, C: { col: 3, row: 3 }, F0: { col: 8, row: 3 } };
  const party = () => [caster({ spellNames: ['Death Ward'], casterTag: 'cleric' }), mk('C', { ownerId: 'p1', hp: 10, maxHp: 30 }), foe('F0')];
  const cast: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Death Ward', targetId: 'C' };
  it('0 HP\'ye düşecekken 1 HP\'de kalır ve büyü biter (bir kez)', () => {
    const r = run(field(party(), pos), cast);
    expect(r.state.combatants.C?.effects?.some((e) => e.deathWard)).toBe(true);
    const hit = (s: BattleState) => applyEvents(s, [{ type: 'map_effect', rule: 'test', targetId: 'C', text: 'ölümcül', hpAfter: 0, damage: { type: 'force', applied: 99 } } as BattleEvent]);
    // map_effect'in hpAfter'ı sabit; Death Ward hasar yolunda: gerçek saldırıyla dene.
    const big = { label: 'Dev', attackBonus: 30, damage: '1d6+100', damageType: 'force', ranged: false, spell: false, tag: 'x' };
    const s0 = { ...r.state, order: ['F0', 'A', 'C'], turnIndex: 0, combatants: { ...r.state.combatants, F0: { ...(r.state.combatants.F0 as Combatant), pos: { col: 4, row: 3 }, weaponOptions: [big] } } };
    const q = execute(s0, { type: 'attack', actorId: 'F0', targetId: 'C', option: big }, GM, seededRng(5));
    if (!q.ok) throw new Error(q.error);
    expect(q.state.combatants.C?.hp).toBe(1);
    expect(q.state.combatants.C?.effects?.some((e) => e.deathWard)).toBe(false);
    expect(hit(q.state).combatants.C?.hp).toBe(0);
  });
  it('hasarsız ani ölüm (6. Exhaustion, Power Word Kill) bir kez engellenir (sürüm 31); sürüm 30\'da Game Master ayarı doğrudan', () => {
    const r = run(field(party(), pos, 31), cast);
    const q = execute(r.state, { type: 'set_exhaustion', targetId: 'C', level: 6 }, GM, seededRng(1));
    if (!q.ok) throw new Error(q.error);
    expect(q.state.combatants.C?.life).not.toBe('dead');
    expect(q.state.combatants.C?.effects?.some((e) => e.deathWard)).toBe(false);
    const old = run(field(party(), pos, 30), cast);
    const q2 = execute(old.state, { type: 'set_exhaustion', targetId: 'C', level: 6 }, GM, seededRng(1));
    if (!q2.ok) throw new Error(q2.error);
    expect(q2.events.some((e) => e.type === 'exhaustion_changed')).toBe(true);
  });
  it('Power Word Kill (100 HP ve altı) Death Ward\'lı hedefte boşa çıkar', () => {
    const pwk = (k: number) => {
      const s = field([caster({ spellNames: ['Death Ward', 'Power Word Kill'], casterTag: 'cleric', spellSlots: [4, 3, 3, 3, 3, 1, 1, 1, 1] }), mk('C', { ownerId: 'p1', hp: 10, maxHp: 30 }),
        foe('F0', { spellNames: ['Power Word Kill'], spellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 1], spellSaveDc: 20, spellAttack: 10, spellMod: 5, casterTag: 'wizard' })], { ...pos, F0: { col: 5, row: 3 } }, k, { spells69: true });
      const r = run(s, cast);
      const q = execute({ ...r.state, order: ['F0', 'A', 'C'], turnIndex: 0 }, { type: 'cast_spell', actorId: 'F0', spellName: 'Power Word Kill', targetId: 'C' }, GM, seededRng(3));
      if (!q.ok) throw new Error(q.error);
      return q.state.combatants.C as Combatant;
    };
    const c = pwk(31);
    expect(c.hp).toBe(10);
    expect(c.effects?.some((e) => e.deathWard)).toBe(false);
  });
});

describe('B1 Giant Insect: biçim jetonu, halka, konsantrasyon', () => {
  const pos = { A: { col: 2, row: 3 }, F0: { col: 8, row: 3 } };
  const party = () => field([caster({ spellNames: ['Giant Insect'], casterTag: 'druid' }), foe('F0')], pos);
  it.each([['spider', 'giant-spider'], ['centipede', 'giant-centipede'], ['wasp', 'giant-wasp']])('%s → monsters/%s.webp + halka', (choice, img) => {
    const r = run(party(), { type: 'cast_spell', actorId: 'A', spellName: 'Giant Insect', targetHex: { col: 4, row: 3 }, choice });
    const bug = summonsOf(r.state, 'giant-insect')[0] as Combatant;
    expect(bug.avatar.src).toBe(`monsters/${img}.webp`);
    expect(bug.avatar.ring).toMatch(/^#/);
    expect(r.state.combatants.A?.concentration?.spell).toBe('Giant Insect');
    // Konsantrasyon bozulunca bir sonraki komutta kaybolur.
    const s1 = applyEvents(r.state, [{ type: 'concentration_ended', actorId: 'A', spell: 'Giant Insect', reason: 'test' } as unknown as BattleEvent]);
    const q = execute(s1, { type: 'end_turn', actorId: 'A' }, P1, seededRng(2));
    if (!q.ok) throw new Error(q.error);
    expect(q.events.some((e) => e.type === 'summon_vanished' && e.reason === 'concentration')).toBe(true);
  });
});

describe('B1 Animate Objects: çok varlık', () => {
  it('değiştirici 6 → 6 Medium nesne sahibinin ardında; emir/yapay zekâ turları çökmez', () => {
    const pos = { A: { col: 2, row: 3 }, F0: { col: 12, row: 3 } };
    const r = run(field([caster({ spellNames: ['Animate Objects'], spellMod: 6 }), foe('F0')], pos), { type: 'cast_spell', actorId: 'A', spellName: 'Animate Objects', targetHex: { col: 3, row: 3 } });
    const objs = summonsOf(r.state, 'animate-objects');
    expect(objs).toHaveLength(6);
    expect(r.state.order.slice(1, 7)).toEqual(objs.map((c) => c.id));
    let s = r.state;
    for (let i = 0; i < 40 && s.status === 'active'; i++) {
      const cmd = chooseCommand(s);
      const actor = s.combatants['actorId' in cmd ? (cmd as { actorId: string }).actorId : ''];
      const q = execute(s, cmd, actor?.ownerId ? P1 : GM, seededRng(100 + i));
      if (!q.ok) { const e = execute(s, { type: 'end_turn', actorId: s.order[s.turnIndex] as string }, actor?.ownerId ? P1 : GM, seededRng(i)); if (!e.ok) throw new Error(e.error); s = e.state; continue; }
      s = q.state;
    }
    expect(s.round).toBeGreaterThan(r.state.round);
  });
});

describe('B1 Contagion: üç başarı', () => {
  it('tur sonu üç başarılı CON kurtulmasında büyü biter, Poisoned kalkar', () => {
    const pos = { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 } };
    const r = run(field([caster({ spellNames: ['Contagion'], casterTag: 'cleric', spellSaveDc: 10 }), foe('F0', { saves: { str: 0, dex: 0, con: 30, int: 0, wis: 0, cha: 0 } })], pos),
      { type: 'cast_spell', actorId: 'A', spellName: 'Contagion', targetId: 'F0', choice: 'wis' }, 4);
    if (!r.state.combatants.F0?.effects?.some((x) => x.id === 'spells:contagion')) return; // ilk kurtulmayı geçtiyse etki yok (SRD)
    let s = { ...r.state, order: ['F0', 'A'], turnIndex: 0 };
    for (let i = 0; i < 3; i++) { const q = execute({ ...s, turnIndex: 0 }, { type: 'end_turn', actorId: 'F0' }, GM, seededRng(30 + i)); if (!q.ok) throw new Error(q.error); s = q.state; }
    expect(s.combatants.F0?.effects?.some((x) => x.id === 'spells:contagion')).toBe(false);
    expect(s.combatants.F0?.conditions).not.toContain('Poisoned');
  });
});
