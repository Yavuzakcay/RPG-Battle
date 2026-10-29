/**
 * Görev S1 (SRD 5.2.1): ışınlanma (Misty Step), uçuş (Fly, Levitate), bitkinlik (Exhaustion), yeni büyüler (Invisibility,
 * Haste, Slow, Barkskin, Mage Armor, Lesser Restoration, Spare the Dying, Revivify, Animate Dead), yapay zekâ ve replay.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { applyEvents, replay, speedHexes } from './reduce';
import { chooseCommand } from './ai';
import { GM, P1, mk, scripted, sword } from './fixtures';
import { flySpeed, isAirborne } from './flight';
import { moveCostFn } from './movement';
import { effectiveAc } from './divine';
import { attackDice, saveDice } from './effectDice';
import { teleportHexes, teleportProblem } from './teleport';
import { MAX_EXHAUSTION, exhaustionAfterLongRest, exhaustionD20Penalty, exhaustionSpeedFt } from '../rules/exhaustion';
import { resolveSave } from '../rules/attack';
import { spells } from '../data';
import srdSpells from '../../data/srd/spells.json';
import { restoreSession, SAVE_VERSION } from '../app/battleSave';
import { tokenFilters } from '../ui/statusFx';
import { statusIcons } from '../ui/damageFloats';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const pad = (...xs: Array<[number, number]>) => scripted(...xs, ...Array.from({ length: 40 }, () => [20, 10] as [number, number]));
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const err = (r: ReturnType<typeof execute>) => (r.ok ? null : r.error);
const claw = { name: 'Claw', bonus: 4, damageDice: '1d8+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
const SLOTS = [4, 3, 3, 3, 0, 0, 0, 0, 0];

/** Düz harita (isteğe bağlı: 4. sütunda satır 2–4 duvar, satır 3'te 5–9 taşlık); A büyücü (3,3), B düşman, C dost (2,3). */
function arena(a: Partial<Combatant> = {}, b: Partial<Combatant> = {}, opts: { wall?: boolean; rough?: boolean; bPos?: Offset } = {}): { state: BattleState; events: BattleEvent[] } {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellAttack: 5, spellSaveDc: 13, spellMod: 3, proficiency: 3, spellSlots: SLOTS, ...a }),
    mk('B', { side: 'enemies', hp: 40, maxHp: 40, attacks: [claw], ...b }),
    mk('C', { ownerId: 'p2', weaponOptions: [sword] }),
  ];
  const started = startBattle('s', 'd-z-zemin', parts, scripted([20, 18], [20, 12], [20, 5]), { map: { id: 'col' } });
  const tiles = Array.from({ length: 7 }, (_, row) => Array.from({ length: 15 }, (_, col) =>
    opts.wall && row >= 2 && row <= 4 && col === 4 ? 's' : opts.rough && row === 3 && col >= 5 && col <= 9 ? 't' : '.').join(''));
  const pos: Record<string, Offset> = { A: o(3, 3), B: opts.bPos ?? o(6, 3), C: o(2, 3) };
  const combatants = { ...started.state.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const state: BattleState = { ...started.state, status: 'active', turnIndex: started.state.order.indexOf('A'), combatants,
    map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles } };
  return { state, events: [{ type: 'battle_started', state }] };
}
const cast = (s: BattleState, cmd: Omit<Extract<Command, { type: 'cast_spell' }>, 'type' | 'actorId'>, rng = pad()) =>
  execute(s, { type: 'cast_spell', actorId: 'A', ...cmd }, P1, rng);
const A = (s: BattleState) => s.combatants.A as Combatant;
const B = (s: BattleState) => s.combatants.B as Combatant;
const spell = (name: string) => spells.find((x) => x.name === name);

describe('veri: yeni ve dönüştürülen büyüler SRD kaydıyla', () => {
  it('Levitate ve Animate Dead SRD kimliğiyle; Misty Step ışınlanma, Fly uçuş etkisi', () => {
    const ids = new Set((srdSpells.spells as Array<{ id: string }>).map((x) => `spells:${x.id}`));
    for (const n of ['Levitate', 'Animate Dead', 'Misty Step', 'Fly', 'Invisibility', 'Haste', 'Slow', 'Barkskin', 'Mage Armor', 'Lesser Restoration', 'Spare the Dying', 'Revivify']) {
      expect(ids.has(spell(n)?.srd ?? '')).toBe(true);
    }
    expect(spell('Misty Step')?.mechanics).toMatchObject({ kind: 'teleport', teleport: { rangeFt: 30, sight: true } });
    expect(spell('Fly')?.mechanics.effect).toMatchObject({ fly: 60, side: 'ally' });
  });
});

describe('ışınlanma (Misty Step)', () => {
  const mage = { spellNames: ['Misty Step'] };
  it('bonus eylemle görebildiği boş altıgene; fırsat saldırısı yok; konsantrasyon ve sıra korunur; replay aynı', () => {
    const { state, events } = arena({ ...mage, concentration: { spell: 'Bless', slotLevel: 1, turn: '1:0' } as Combatant['concentration'] }, {}, { bPos: o(4, 3) });
    const r = ok(cast(state, { spellName: 'Misty Step', targetHex: o(8, 3) }));
    expect(r.events.map((e) => e.type)).toEqual(['slot_spent', 'spell_cast', 'teleported', 'action_used']);
    expect(r.events.some((e) => e.type === 'attack_resolved')).toBe(false);
    expect(A(r.state).pos).toEqual(o(8, 3));
    expect(A(r.state).concentration?.spell).toBe('Bless');
    expect(A(r.state).economy.bonus).toBe(true);
    expect(r.state.order).toEqual(state.order);
    expect(replay([...events, ...r.events])).toEqual(r.state);
  });
  it('geçersiz hedef: menzil dışı, dolu, engel, görüşü kesilmiş, haritasız', () => {
    const { state } = arena(mage, {}, { wall: true });
    expect(err(cast(state, { spellName: 'Misty Step', targetHex: o(10, 3) }))).toMatch(/menzil/);
    expect(err(cast(state, { spellName: 'Misty Step', targetHex: o(2, 3) }))).toMatch(/dolu/);
    expect(err(cast(state, { spellName: 'Misty Step', targetHex: o(4, 3) }))).toMatch(/engel/);
    expect(err(cast(state, { spellName: 'Misty Step', targetHex: o(5, 3) }))).toMatch(/görülmüyor/);
    expect(err(cast(state, { spellName: 'Misty Step' }))).toMatch(/altıgen/);
    expect(teleportProblem({ ...state, map: undefined }, A(state), o(5, 3), { rangeFt: 30, sight: true })).toMatch(/haritalı/);
    expect(teleportHexes(state, A(state), { rangeFt: 30, sight: true }).every((h) => h.col <= 9)).toBe(true);
  });
  it('yapay zekâ: kıstırılmış, yaralı menzilli büyücü düşmandan uzaklaşmak için ışınlanır', () => {
    const { state } = arena({ ...mage, side: 'party', hp: 10, weaponOptions: [{ ...sword, label: 'Light crossbow', ranged: true, range: [80, 320] }] }, {}, { bPos: o(4, 3) });
    const cmd = chooseCommand(state);
    expect(cmd).toMatchObject({ type: 'cast_spell', spellName: 'Misty Step' });
    const to = (cmd as { targetHex: Offset }).targetHex;
    expect(Math.abs(to.col - 4)).toBeGreaterThan(1);
  });
});

describe('uçuş (Fly, Levitate)', () => {
  it('Fly: dosta 60 ft uçuş; zorlu arazi normal maliyet; konsantrasyon bitince düşme hasarı olmadan biter', () => {
    const { state } = arena({ spellNames: ['Fly'], speed: 30 }, {}, { rough: true });
    const r = ok(cast(state, { spellName: 'Fly', targetIds: ['A'] }));
    const a = A(r.state);
    expect(flySpeed(a)).toBe(60);
    expect(isAirborne(a)).toBe(true);
    expect(speedHexes(a)).toBe(12);
    expect(moveCostFn(r.state, a)(o(5, 3), o(4, 3))).toBe(1);
    expect(moveCostFn(state, A(state))(o(5, 3), o(4, 3))).toBe(2);
    expect(statusIcons(a).map((x) => x.key)).toContain('flying');
    // Konsantrasyon biterse etki kalkar; HP değişmez.
    const ended = applyEvents(r.state, [{ type: 'concentration_started', actorId: 'A', spell: 'Bless', slotLevel: 1, turn: '9:0' }]);
    expect(isAirborne(A(ended))).toBe(false);
    expect(A(ended).hp).toBe(a.hp);
  });
  it('Levitate: düşman CON save; başarısızsa havada ve yürüyemez', () => {
    const { state } = arena({ spellNames: ['Levitate'] });
    const r = ok(cast(state, { spellName: 'Levitate', targetIds: ['B'] }, pad([20, 2])));
    expect(isAirborne(B(r.state))).toBe(true);
    expect(speedHexes(B(r.state))).toBe(0);
    const saved = ok(cast(state, { spellName: 'Levitate', targetIds: ['B'] }, pad([20, 19])));
    expect(isAirborne(B(saved.state))).toBe(false);
  });
});

describe('Exhaustion (SRD 5.2.1)', () => {
  it('kural sabitleri: d20 −2×, hız −5 ft×, 6 en çok, uzun dinlenme −1', () => {
    expect([exhaustionD20Penalty(0), exhaustionD20Penalty(3), exhaustionSpeedFt(2), MAX_EXHAUSTION, exhaustionAfterLongRest(2), exhaustionAfterLongRest(0)]).toEqual([0, 6, 10, 6, 1, 0]);
  });
  it('Game Master ayarlar; d20 Testlerine ve hıza işler; birikir; 6. seviyede ölüm', () => {
    const { state, events } = arena({ speed: 30 });
    expect(err(execute(state, { type: 'set_exhaustion', targetId: 'A', level: 2 }, P1, pad()))).toMatch(/Game Master/);
    const r = ok(execute(state, { type: 'set_exhaustion', targetId: 'A', level: 2 }, GM, pad()));
    const a = A(r.state);
    expect(a.exhaustion).toBe(2);
    expect(speedHexes(a)).toBe(4);
    expect(attackDice(a)).toContainEqual(expect.objectContaining({ label: 'Exhaustion 2', die: '4', sign: -1 }));
    const save = resolveSave({ extra: saveDice(a), modifier: 0, dc: 10, mode: 'normal' }, scripted([20, 12]));
    expect(save.total).toBe(8);
    expect(save.success).toBe(false);
    expect(tokenFilters(a)).toContain('exhaustion');
    expect(statusIcons(a).map((x) => x.key)).toContain('exhaustion');
    const dead = ok(execute(r.state, { type: 'set_exhaustion', targetId: 'A', level: 6 }, GM, pad()));
    expect(A(dead.state)).toMatchObject({ life: 'dead', hp: 0, exhaustion: 6 });
    expect(err(execute(state, { type: 'set_exhaustion', targetId: 'A', level: 7 }, GM, pad()))).toMatch(/0–6/);
    expect(replay([...events, ...r.events, ...dead.events])).toEqual(dead.state);
  });
  it('etkiyle birlikte: Bless +1d4 ve Exhaustion −2 aynı save\'de', () => {
    const { state } = arena({ exhaustion: 1, effects: [{ id: 'spells:bless', name: 'Bless', sourceId: 'C', dice: { die: '1d4', sign: 1, on: ['attack', 'save'] } }] });
    const save = resolveSave({ extra: saveDice(A(state)), modifier: 0, dc: 10, mode: 'normal' }, scripted([20, 10], [4, 3]));
    expect(save.total).toBe(10 + 3 - 2);
  });
});

describe('diğer büyüler', () => {
  it('Invisibility: Invisible verir, saldırınca biter', () => {
    const { state } = arena({ spellNames: ['Invisibility'], weaponOptions: [sword] }, {}, { bPos: o(4, 3) });
    const r = ok(cast(state, { spellName: 'Invisibility', targetIds: ['A'] }));
    expect(A(r.state).conditions).toContain('Invisible');
    const next = { ...r.state, combatants: { ...r.state.combatants, A: { ...A(r.state), economy: { ...A(r.state).economy, action: false } } } };
    const hit = ok(execute(next, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, pad([20, 15])));
    expect(A(hit.state).conditions).not.toContain('Invisible');
    expect(A(hit.state).effects ?? []).toHaveLength(0);
  });
  it('Haste AC +2 ve hız ×2; Slow AC −2 ve hız yarı (WIS save); Barkskin AC en az 17; Mage Armor 13 + DEX', () => {
    const { state } = arena({ spellNames: ['Haste', 'Slow', 'Barkskin', 'Mage Armor'], speed: 30, ac: 12, modifiers: { str: 0, dex: 3, con: 0, int: 0, wis: 0, cha: 0 } }, { ac: 14, speed: 30 });
    const h = ok(cast(state, { spellName: 'Haste', targetIds: ['A'] }));
    expect(effectiveAc(h.state, A(h.state))).toBe(14);
    expect(speedHexes(A(h.state))).toBe(12);
    const sl = ok(cast(state, { spellName: 'Slow', targetIds: ['B'] }, pad([20, 2])));
    expect(effectiveAc(sl.state, B(sl.state))).toBe(12);
    expect(speedHexes(B(sl.state))).toBe(3);
    const bk = ok(cast(state, { spellName: 'Barkskin', targetIds: ['A'] }));
    expect(effectiveAc(bk.state, A(bk.state))).toBe(17);
    const ma = ok(cast(state, { spellName: 'Mage Armor', targetIds: ['A'] }));
    expect(effectiveAc(ma.state, A(ma.state))).toBe(16);
  });
  it('Lesser Restoration bir durumu kaldırır; Spare the Dying stabil eder; Revivify ölü dostu 1 HP ile kaldırır', () => {
    const { state } = arena({ spellNames: ['Lesser Restoration', 'Spare the Dying', 'Revivify'] });
    const sick: BattleState = { ...state, combatants: { ...state.combatants, C: { ...(state.combatants.C as Combatant), conditions: ['Poisoned', 'Prone'] } } };
    const lr = ok(cast(sick, { spellName: 'Lesser Restoration', targetId: 'C' }));
    expect(lr.state.combatants.C?.conditions).toEqual(['Prone']);
    expect(err(cast(state, { spellName: 'Lesser Restoration', targetId: 'C' }))).toMatch(/durum yok/);
    const dying: BattleState = { ...state, combatants: { ...state.combatants, C: { ...(state.combatants.C as Combatant), hp: 0, life: 'dying', conditions: ['Unconscious'] } } };
    const st = ok(cast(dying, { spellName: 'Spare the Dying', targetId: 'C' }));
    expect(st.state.combatants.C).toMatchObject({ life: 'stable', hp: 0 });
    const dead: BattleState = { ...state, combatants: { ...state.combatants, C: { ...(state.combatants.C as Combatant), hp: 0, life: 'dead', conditions: ['Unconscious'] } } };
    const rv = ok(cast(dead, { spellName: 'Revivify' }));
    expect(rv.state.combatants.C).toMatchObject({ life: 'alive', hp: 1 });
    expect(rv.state.combatants.C?.conditions).not.toContain('Unconscious');
    expect(replay([{ type: 'battle_started', state: sick }, ...lr.events])).toEqual(lr.state);
  });
  it('False Life anında geçici HP (yukarı slot +5); Longstrider +10 ft hız; Mind Spike WIS save psişik hasar', () => {
    const { state } = arena({ spellNames: ['False Life', 'Longstrider', 'Mind Spike'], speed: 30 });
    const fl = ok(cast(state, { spellName: 'False Life', targetIds: ['A'], slotLevel: 2 }, pad([4, 2], [4, 3])));
    expect(A(fl.state).tempHp).toBe(2 + 3 + 4 + 5);
    const ls = ok(cast(state, { spellName: 'Longstrider', targetIds: ['A'] }));
    expect(speedHexes(A(ls.state))).toBe(8);
    const ms = ok(cast(state, { spellName: 'Mind Spike', targetId: 'B' }, pad([20, 2], [8, 4], [8, 4], [8, 4])));
    expect(ms.events.find((e) => e.type === 'save_resolved')).toMatchObject({ success: false, appliedDamage: 12, damageType: 'psychic' });
  });
  it('Animate Dead: kurulumda, slot harcayarak Skeleton ya da Zombie', () => {
    const { state } = arena({ spellNames: ['Animate Dead'] });
    const setup: BattleState = { ...state, status: 'setup' };
    const r = ok(cast(setup, { spellName: 'Animate Dead', form: 'zombie' }));
    const z = Object.values(r.state.combatants).find((c) => c.summon?.by === 'A');
    expect(z?.name).toMatch(/Zombie/);
    expect(A(r.state).spellSlots[2]).toBe(2);
    expect(err(cast(state, { spellName: 'Animate Dead', form: 'zombie' }))).toMatch(/kurulumda/);
  });
});

describe('eski kayıtlar', () => {
  it('bitkinlik ve uçuş alanı olmayan kayıt yüklenir; kayıt sürümü 19', () => {
    const { state } = arena();
    expect(SAVE_VERSION).toBe(19);
    const r = restoreSession(JSON.stringify({ version: 14, savedAt: '', events: [{ type: 'battle_started', state }] }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(isAirborne(r.session.state.combatants.A as Combatant)).toBe(false);
  });
});
