/**
 * Süren etkiler (Görev R2; SRD 5.2.1): zar eklentisi (Bless, Bane, Guidance), hasar azaltma (Resistance), geçici HP
 * ve bağışıklık (Heroism), en çok HP (Aid), Command, süregelen hasar (Searing Smite), Hex; süre, konsantrasyon bağı,
 * tek kullanım, elle zar ve replay.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet } from './create';
import { applyEvents, replay } from './reduce';
import { advanceTo, GM, P1, scripted, setup, sword } from './fixtures';
import { askFor, newBook, runWithDice } from '../rules/manualDice';
import type { CharacterSheet } from '../rules/stats';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, Command } from './types';

const sheet = (classId: string, level: number, spellNames: string[], p: Partial<CharacterSheet> = {}): CharacterSheet => ({
  name: 'X', raceId: 'human', classId, level, armorName: 'Zırhsız', shield: false, itemNames: [], spellNames,
  baseScores: { str: 14, dex: 12, con: 13, int: 10, wis: 16, cha: 16 }, weapons: [{ name: 'Mace' }], ...p,
});
const fields = (s: CharacterSheet, p: Partial<Combatant> = {}): Partial<Combatant> => {
  const { id: _i, name: _n, ownerId: _o, initiativeBonus: _b, ...f } = combatantFromSheet(s, { id: 'x', ownerId: 'p1' });
  return { ...f, ...p };
};
const pad = (...xs: Array<[number, number]>) => scripted(...xs, ...Array.from({ length: 30 }, () => [20, 10] as [number, number]));
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const cleric = (spells: string[], level = 3) => fields(sheet('cleric', level, spells, { subclassId: 'life-domain' }));
const claw = { name: 'Claw', bonus: 4, damageDice: '1d8+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
/** A büyücü (sırası), B düşman, C dost (oyuncu p2). */
const start = (a: Partial<Combatant>, b: Partial<Combatant> = {}, c: Partial<Combatant> = {}) =>
  advanceTo(setup('Düz', { A: a, B: { attacks: [claw], hp: 40, maxHp: 40, ...b }, C: { weaponOptions: [sword], ...c } }), 'A');
const cast = (s: BattleState, cmd: Omit<Extract<Command, { type: 'cast_spell' }>, 'type' | 'actorId'>, rng = pad()) =>
  ok(execute(s, { type: 'cast_spell', actorId: 'A', ...cmd }, P1, rng));
const fx = (s: BattleState, id: string) => s.combatants[id]?.effects ?? [];
const toTurn = (s: BattleState, id: string) => advanceTo(s, id);

describe('zar eklentisi: Bless ve Bane', () => {
  it('Bless: üç dosta kadar saldırı ve save zarına +1d4 (günlükte, toplamda); konsantrasyon bitince biter', () => {
    const s = start(cleric(['Bless']));
    const r = cast(s, { spellName: 'Bless', targetIds: ['A', 'C'] });
    expect(fx(r.state, 'C')).toEqual([expect.objectContaining({ id: 'spells:bless', name: 'Bless', sourceId: 'A', concentration: 'Bless', dice: { die: '1d4', sign: 1, on: ['attack', 'save'] } })]);
    // C saldırır: d20 10 + 5 + d4 3 = 18.
    const atC = toTurn(r.state, 'C');
    const hit = ok(execute(atC, { type: 'attack', actorId: 'C', targetId: 'B', option: sword }, { playerId: 'p2', isGm: false }, pad([20, 10], [4, 3], [8, 4])));
    expect(hit.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ total: 18, bonusDice: [{ label: 'Bless', die: '1d4', value: 3 }] });
    // Hedef sayısı: 1. seviye slotla en çok 3.
    expect(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Bless', targetIds: ['A', 'C', 'B', 'x'] }, P1, pad()).ok).toBe(false);
    // Konsantrasyon bitince (A 0 HP) etkiler kalkar.
    const down = applyEvents(r.state, [{ type: 'hp_adjusted', targetId: 'A', hpAfter: 0, life: 'dying' }]);
    expect(fx(down, 'C')).toEqual([]);
  });
  it('Bane: CHA save başarısızsa saldırı zarına −1d4; başarılıysa etki yok', () => {
    const s = start(fields(sheet('warlock', 1, ['Bane'])), { saves: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } });
    const fail = cast(s, { spellName: 'Bane', targetIds: ['B'] }, pad([20, 2]));
    expect(fx(fail.state, 'B')[0]).toMatchObject({ id: 'spells:bane', dice: { sign: -1 } });
    const atB = toTurn(fail.state, 'B');
    const r = ok(execute(atB, { type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM, pad([20, 10], [4, 4], [8, 3])));
    expect(r.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ total: 10, bonusDice: [{ label: 'Bane', value: -4 }] });
    const pass = cast(s, { spellName: 'Bane', targetIds: ['B'] }, pad([20, 19]));
    expect(fx(pass.state, 'B')).toEqual([]);
  });
  it('save zarına da eklenir (Bless ile konsantrasyon CON save\'i)', () => {
    const s = start(cleric(['Bless']));
    const r = cast(s, { spellName: 'Bless', targetIds: ['A'] });
    const atB = toTurn(r.state, 'B');
    const hit = ok(execute(atB, { type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM, pad([20, 18], [8, 4], [20, 7], [4, 2])));
    const atk = hit.events.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(atk.effects.find((e) => e.kind === 'concentration')).toMatchObject({ natural: 7, extra: [{ label: 'Bless', value: 2 }] });
  });
});

describe('süre, tek kullanım, elle zar ve replay', () => {
  it('süre dolunca biter (until); tek kullanımlık eklenti ilk kullanımda biter', () => {
    const one: ActiveEffect = { id: 'test:once', name: 'Once', sourceId: 'A', until: 1, dice: { die: '1d4', sign: 1, on: ['attack'], single: true } };
    let s = start({}, {}, { effects: [one] });
    s = toTurn(s, 'C');
    const r = ok(execute(s, { type: 'attack', actorId: 'C', targetId: 'B', option: sword }, { playerId: 'p2', isGm: false }, pad([20, 10], [4, 1], [8, 1])));
    expect(fx(r.state, 'C')).toEqual([]);
    const timed: ActiveEffect = { id: 'test:t', name: 'T', sourceId: 'A', until: 1, dice: { die: '1d4', sign: 1, on: ['save'] } };
    const s2 = start({}, {}, { effects: [timed] });
    const next = ok(execute(toTurn(s2, 'A'), { type: 'end_turn', actorId: 'A' }, P1, scripted()));
    expect(fx(next.state, 'C')).toEqual([]);
  });
  it('elle zar: eklenti zarı da istenir; olaylar baştan oynatılınca aynı durum', () => {
    const s = start(cleric(['Bless']));
    const blessed = cast(s, { spellName: 'Bless', targetIds: ['C'] });
    const atC = toTurn(blessed.state, 'C');
    const cmd: Command = { type: 'attack', actorId: 'C', targetId: 'B', option: sword };
    const run = runWithDice((rng) => execute(atC, cmd, { playerId: 'p2', isGm: false }, rng), newBook(), { ask: askFor('everyone', () => true), auto: pad() });
    expect(run.ok).toBe(false);
    // Önce d20, sonra d4 istenir.
    const book = { entries: [{ group: { sides: 20, count: 1, values: [12] } }] };
    const second = runWithDice((rng) => execute(atC, cmd, { playerId: 'p2', isGm: false }, rng), book, { ask: askFor('everyone', () => true), auto: pad() });
    expect(second.ok ? null : second.need).toMatchObject({ sides: 4, count: 1, kind: 'attack', by: 'C' });
    const all = [{ type: 'battle_started', state: s } as BattleEvent, ...blessed.events];
    expect(replay(all)).toEqual(blessed.state);
  });
});

describe('dost etkileri', () => {
  it('Guidance: seçilen beceriyle kontrole +1d4', () => {
    const s = start(cleric(['Guidance']));
    const r = cast(s, { spellName: 'Guidance', targetId: 'C', choice: 'perception' });
    const chk = ok(execute(r.state, { type: 'skill_check', actorId: 'C', skill: 'perception', dc: 15 }, GM, pad([20, 10], [4, 4])));
    expect(chk.events[0]).toMatchObject({ type: 'skill_checked', total: 14, bonusDice: [{ label: 'Guidance', value: 4 }] });
    const other = ok(execute(r.state, { type: 'skill_check', actorId: 'C', skill: 'athletics', dc: 15 }, GM, pad([20, 10])));
    expect(other.events[0]).not.toHaveProperty('bonusDice');
  });
  it('Resistance: seçilen türde hasar turda bir kez 1d4 azalır', () => {
    const s = start(cleric(['Resistance']));
    const r = cast(s, { spellName: 'Resistance', targetId: 'A', choice: 'slashing' });
    const atB = toTurn(r.state, 'B');
    const hit = ok(execute(atB, { type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM, pad([20, 18], [8, 6], [4, 3], [20, 15])));
    const ev = hit.events.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(ev.effects).toContainEqual({ kind: 'reduced', label: 'Resistance', effectId: 'spells:resistance', roll: 3, amount: 3 });
    expect(hit.state.combatants.A?.hp).toBe((atB.combatants.A?.hp ?? 0) - 5);
    expect(fx(hit.state, 'A')[0]?.reduce?.spent).toBe(true);
  });
  it('Heroism: her tur başında geçici HP (önce o harcanır), Frightened bağışıklığı', () => {
    const s = start(fields(sheet('paladin', 3, ['Heroism'], { subclassId: 'oath-of-devotion' })));
    const r = cast(s, { spellName: 'Heroism', targetId: 'C' });
    const atC = toTurn(r.state, 'C');
    expect(atC.combatants.C?.tempHp).toBe(3);
    const fear = applyEvents(atC, [{ type: 'condition_changed', targetId: 'C', condition: 'Frightened', present: true, reason: 'x' }]);
    expect(fear.combatants.C?.conditions).not.toContain('Frightened');
    const hpBefore = atC.combatants.C?.hp ?? 0;
    const atB = toTurn(atC, 'B');
    const hit = ok(execute(atB, { type: 'monster_attack', actorId: 'B', targetId: 'C', attackIndex: 0 }, GM, pad([20, 18], [8, 3])));
    expect(hit.state.combatants.C).toMatchObject({ tempHp: 0, hp: hpBefore - 2 });
  });
  it('Aid: en çok HP ve HP +5', () => {
    const s = start(cleric(['Aid']));
    const r = cast(s, { spellName: 'Aid', targetIds: ['A', 'C'] });
    expect(r.state.combatants.C).toMatchObject({ maxHp: 25, hp: 25 });
  });
});

describe('düşman etkileri ve süregelen hasar', () => {
  it('Command (Grovel): WIS save başarısızsa sonraki turunda yere düşer ve turunu kaybeder', () => {
    const s = start(cleric(['Command']), { saves: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } });
    const r = cast(s, { spellName: 'Command', targetId: 'B', choice: 'grovel' }, pad([20, 3]));
    // A'nın turu biter: sıra C'de (B atlanır mı? sıra C, B, A → A'dan sonra C).
    const atC = ok(execute(r.state, { type: 'end_turn', actorId: 'A' }, P1, scripted())).state;
    const after = ok(execute(atC, { type: 'end_turn', actorId: 'C' }, { playerId: 'p2', isGm: false }, scripted()));
    expect(after.events).toContainEqual({ type: 'turn_lost', actorId: 'B', label: 'Command', command: 'grovel' });
    expect(after.state.combatants.B?.conditions).toContain('Prone');
    expect(after.state.order[after.state.turnIndex]).toBe('A');
    expect(fx(after.state, 'B')).toEqual([]);
  });
  it('Searing Smite: isabette ek hasar; hedefin her tur başında 1d6 fire, sonra CON save (başarıda biter)', () => {
    const pal = fields(sheet('paladin', 2, ['Searing Smite'], { weapons: [{ name: 'Longsword' }] }));
    let s = start(pal, { saves: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }, ac: 5 });
    const option = (s.combatants.A as Combatant).weaponOptions[0] as NonNullable<Combatant['bonusStrike']>;
    s = ok(execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option }, P1, pad([20, 15], [8, 4]))).state;
    const smite = cast(s, { spellName: 'Searing Smite' }, pad([6, 3]));
    expect(fx(smite.state, 'B')[0]).toMatchObject({ id: 'spells:searing-smite', ongoing: { dice: '1d6', type: 'fire', save: 'con' } });
    const hp = smite.state.combatants.B?.hp ?? 0;
    const atC = ok(execute(smite.state, { type: 'end_turn', actorId: 'A' }, P1, scripted())).state;
    const tick = ok(execute(atC, { type: 'end_turn', actorId: 'C' }, { playerId: 'p2', isGm: false }, pad([6, 5], [20, 3])));
    expect(tick.events.find((e) => e.type === 'effect_tick')).toMatchObject({ targetId: 'B', appliedDamage: 5, save: { ability: 'con', success: false } });
    expect(tick.state.combatants.B?.hp).toBe(hp - 5);
    expect(fx(tick.state, 'B')).toHaveLength(1);
    // Başarılı save'de biter.
    const tick2 = ok(execute(atC, { type: 'end_turn', actorId: 'C' }, { playerId: 'p2', isGm: false }, pad([6, 2], [20, 19])));
    expect(tick2.events).toContainEqual({ type: 'effect_ended', targetId: 'B', effectId: 'spells:searing-smite', name: 'Searing Smite', reason: 'save' });
  });
  it('Hex: işaretli hedefe her isabette +1d6 necrotic', () => {
    const s = start(fields(sheet('warlock', 1, ['Hex', 'Eldritch Blast'])), { ac: 5 });
    const r = cast(s, { spellName: 'Hex', targetId: 'B' });
    const blast = cast(r.state, { spellName: 'Eldritch Blast', targetId: 'B' }, pad([20, 15], [10, 5], [6, 4]));
    expect((blast.events.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>).extra).toEqual([expect.objectContaining({ label: 'Hex', type: 'necrotic', applied: 4 })]);
  });
});
