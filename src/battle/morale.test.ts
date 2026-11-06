/**
 * Kuyruk K48 Adım B: Moral tam modu (ev kuralı `moralSistemi`, kural sürümü 20). Havuz, savaş içi kayıp, 0'da Çökmüş,
 * toparlama (+ ek bonus), Bunalmış, eşik cezaları, zafer ödülü ve savaş dışı ölüm (`applyBattleResult`), kapalı kural
 * ve eski sürüm, replay.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, mk } from './fixtures';
import { saveDice, checkDice } from './effectDice';
import { resolveSave } from '../rules/attack';
import { blankCharacter, type SavedCharacter } from '../rules/builder';
import { fullStatus } from '../rules/characterRest';
import { moralMaxFrom } from '../rules/moral';
import { applyBattleResult } from '../app/partyStatus';
import { COLLAPSE_ID, DAZE_ID, collapsed } from './morale';
import type { Rng } from '../rules/dice';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const high: Rng = () => 0.99;
const sheet = (patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('m').sheet, name: 'Ada', raceId: 'human', classId: 'fighter', level: 3, armorName: 'Chain Mail', weapons: [{ name: 'Longsword' }], ...patch,
});
const pc = (id: string, patch: Partial<CharacterSheet> = {}, moral?: number) => {
  const c = combatantFromSheet(sheet({ name: id, ...patch }), { id, ownerId: `own-${id}` });
  return moral === undefined ? c : { ...c, moral };
};

/** A, C (karakterler), B (düşman). */
function arena(opts: { on?: boolean; kuralSurumu?: number; a?: Combatant; c?: Combatant } = {}) {
  const parts = [opts.a ?? pc('A'), opts.c ?? pc('C'), pc('D'), mk('B', { side: 'enemies', hp: 80, maxHp: 80 })];
  const s0 = startBattle('k48', 'd-z-zemin', parts, () => 0.5, {
    map: { id: 'col' }, ...(opts.on !== false ? { houseRules: { moralSistemi: true } } : {}), ...(opts.kuralSurumu ? { kuralSurumu: opts.kuralSurumu } : {}) }).state;
  const combatants = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: { col: 3, row: 3 }, C: { col: 2, row: 3 }, D: { col: 2, row: 5 }, B: { col: 5, row: 3 } })) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const state: BattleState = { ...s0, status: 'active', order: ['A', 'C', 'D', 'B'], turnIndex: 0, combatants, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
  const events: BattleEvent[] = [{ type: 'battle_started', state }];
  const run = {
    state, events,
    do(cmd: Command, ctx = GM, rng: Rng = high) {
      const r = execute(run.state, cmd, ctx, rng);
      if (!r.ok) throw new Error(r.error);
      run.state = r.state; run.events.push(...r.events);
      return r.events;
    },
    try: (cmd: Command, ctx = GM) => execute(run.state, cmd, ctx, high),
    c: (id: string) => run.state.combatants[id] as Combatant,
  };
  return run;
}

describe('Moral havuzu', () => {
  it('en çok = 3 + WIS + yeterlilik (en az 1); savaş başında karakterde', () => {
    expect(moralMaxFrom({ wis: 2 }, 2)).toBe(7);
    expect(moralMaxFrom({ wis: -5 }, 2)).toBe(1);
    const r = arena();
    const a = r.c('A');
    expect(a.moralMax).toBe(3 + a.modifiers.wis + a.proficiency);
    expect(a.moral).toBe(a.moralMax);
    expect(r.c('B').moralMax).toBeUndefined();
  });
  it('kural kapalı ya da eski sürüm (19): alan yok (kayıtlı Moral de silinir)', () => {
    for (const r of [arena({ on: false, a: pc('A', {}, 2) }), arena({ kuralSurumu: 19, a: pc('A', {}, 2) })]) {
      expect(r.c('A').moral).toBeUndefined();
      expect(r.c('A').moralMax).toBeUndefined();
    }
  });
});

describe('Savaşta Moral', () => {
  it('dost 0 HP: öbür karakter −1; 0\'da Çökmüş (Incapacitated, hız 0, ona saldırı avantajlı); replay', () => {
    const r = arena({ a: pc('A', {}, 1) });
    r.do({ type: 'adjust_hp', targetId: 'C', hp: 0 });
    const a = r.c('A');
    expect(a.moral).toBe(0);
    expect(collapsed(a)).toBe(true);
    expect(a.conditions).toContain('Incapacitated');
    const eff = a.effects?.find((e) => e.id === COLLAPSE_ID);
    expect(eff?.speedZero).toBe(true);
    expect(eff?.attackedAdv).toBe(true);
    expect(a.hp).toBeGreaterThan(0); // HP'ye dokunmaz
    expect(replay(r.events)).toEqual(r.state);
  });
  it('müttefik toparlama (eylem): +1, çökme biter; Bard/Cleric özelliğiyle +2', () => {
    const r = arena({ a: pc('A', {}, 1), c: pc('C'), });
    r.do({ type: 'adjust_hp', targetId: 'D', hp: 0 }); // dost D düşer: A 1 → 0, Çökmüş
    expect(collapsed(r.c('A'))).toBe(true);
    r.state = { ...r.state, turnIndex: 1 };
    r.events.push({ type: 'battle_started', state: r.state });
    r.do({ type: 'moral_rally', actorId: 'C', targetId: 'A' }, { playerId: 'own-C', isGm: false });
    expect(r.c('A').moral).toBe(1);
    expect(collapsed(r.c('A'))).toBe(false);
    expect(r.c('A').conditions).not.toContain('Incapacitated');
    expect(r.c('C').economy.action).toBe(true);
    expect(replay(r.events)).toEqual(r.state);
    // Bard: ek bonus.
    const b = arena({ a: pc('A', {}, 1), c: pc('C', { classId: 'bard', armorName: 'Leather Armor' }) });
    b.do({ type: 'adjust_hp', targetId: 'D', hp: 0 });
    b.state = { ...b.state, turnIndex: 1 };
    b.do({ type: 'moral_rally', actorId: 'C', targetId: 'A' }, { playerId: 'own-C', isGm: false });
    expect(b.c('A').moral).toBe(2);
  });
  it('çökmemiş dosta toparlama yapılamaz; kural kapalıyken komut reddedilir', () => {
    const r = arena();
    r.state = { ...r.state, turnIndex: 1 };
    expect(r.try({ type: 'moral_rally', actorId: 'C', targetId: 'A' }).ok).toBe(false);
    const off = arena({ on: false });
    expect(off.try({ type: 'moral_rally', actorId: 'C', targetId: 'A' }).ok).toBe(false);
  });
  it('Moral 0 ile giren Bunalmış: ilk tur Incapacitated ve yarım hız', () => {
    const parts = [pc('A', {}, 0), mk('B', { side: 'enemies', hp: 30, maxHp: 30 })];
    const s0 = startBattle('k48b', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' }, houseRules: { moralSistemi: true } }).state;
    const placed = { ...s0, combatants: { A: { ...(s0.combatants.A as Combatant), pos: { col: 2, row: 3 } }, B: { ...(s0.combatants.B as Combatant), pos: { col: 9, row: 3 } } } };
    const r = execute(placed, { type: 'start_battle' }, GM, () => 0.5);
    if (!r.ok) throw new Error(r.error);
    const a = r.state.combatants.A as Combatant;
    const daze = a.effects?.find((e) => e.id === DAZE_ID);
    expect(daze?.speedMult).toBe(0.5);
    expect(a.conditions).toContain('Incapacitated');
  });
  it('eşikler: yarıda WIS save −1; üçte birde Frightened save dezavantaj (başarıda ikinci zar, küçüğü)', () => {
    const r = arena({ a: pc('A', {}, 1) });
    const a = r.c('A');
    expect(saveDice(a, 'wis').find((x) => x.label === 'Moral')).toMatchObject({ die: '1', sign: -1 });
    expect(saveDice(a, 'str').some((x) => x.label === 'Moral')).toBe(false);
    expect(checkDice(a, 'insight').some((x) => x.label === 'Moral')).toBe(true);
    const seq = [0.95, 0.05];
    let i = 0;
    const rng: Rng = () => seq[i++] ?? 0.5;
    const s = resolveSave({ modifier: 0, dc: 10, mode: 'normal', extra: saveDice(a, 'str'), against: ['Frightened'] }, rng);
    expect(s.success).toBe(false); // 20 → 2 (dezavantaj)
    i = 0;
    const s2 = resolveSave({ modifier: 0, dc: 10, mode: 'normal', extra: saveDice(a, 'str'), against: ['Poisoned'] }, rng);
    expect(s2.success).toBe(true);
  });
});

describe('Savaş sonu (karakter durumu)', () => {
  const saved = (id: string): SavedCharacter => ({ ...blankCharacter(`own-${id}`), sheet: sheet({ name: id }), status: { ...fullStatus(sheet({ name: id })), moral: 3 } });
  const finish = (r: ReturnType<typeof arena>, winner: 'party' | 'enemies') => ({ ...r.state, status: 'finished' as const, winner });
  it('zafer: +1; çökmüş kalıp kazanana +2', () => {
    const r = arena({ a: pc('A', {}, 1), c: pc('C', {}, 4) });
    r.do({ type: 'adjust_hp', targetId: 'D', hp: 0 }); // A 1 → 0 (Çökmüş), C 4 → 3
    r.do({ type: 'adjust_hp', targetId: 'B', hp: 0 }); // son düşman düşer: savaş biter, ödül motorda
    expect(r.state.status).toBe('finished');
    expect(r.events.filter((e) => e.type === 'moral_changed' && e.reason === 'zafer')).toHaveLength(2);
    expect(replay(r.events)).toEqual(r.state);
    const out = applyBattleResult([saved('A'), saved('C')].map((x, i) => ({ ...x, id: i ? 'own-C' : 'own-A' })), r.state);
    expect(out[0]?.status?.moral).toBe(2);
    expect(out[1]?.status?.moral).toBe(4);
  });
  it('yenilgi/kaçış: ödül yok; 0\'da kalan Moral ölümü', () => {
    const r = arena({ a: pc('A', {}, 1) });
    r.do({ type: 'adjust_hp', targetId: 'D', hp: 0 });
    const out = applyBattleResult([{ ...saved('A'), id: 'own-A' }], finish(r, 'enemies'));
    expect(out[0]?.status).toMatchObject({ moral: 0, dead: true, moralOlum: true });
  });
  it('tam mod yokken kayıtlı Moral olduğu gibi kalır', () => {
    const r = arena({ on: false });
    const out = applyBattleResult([{ ...saved('A'), id: 'own-A' }], finish(r, 'party'));
    expect(out[0]?.status?.moral).toBe(3);
    expect(out[0]?.status?.dead).toBeUndefined();
  });
});
void P1;
