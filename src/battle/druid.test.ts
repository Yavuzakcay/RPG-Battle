/**
 * Görev DRUID: Wild Shape (SRD 5.2.1: geçici HP, biçimin değerleri, büyü yok, Incapacitated/0 HP'de biter), Wild
 * Resurgence, Primal Order, Elemental Fury (Primal Strike), Circle of the Land (arazi büyüleri, Land's Aid, Natural
 * Recovery, Nature's Ward).
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { P1, mk, scripted } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { classKit } from '../rules/classFeatures';
import { fullStatus, shortRestStatus } from '../rules/characterRest';
import { monsters } from '../data';
import { availableForms, eligibleForms, wildShapeFeature } from './druid';
import { armorProficient, type CharacterSheet } from '../rules/stats';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const drSheet = (level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('d').sheet, name: 'Ayla', classId: 'druid', subclassId: 'circle-of-the-land', level, baseScores: suggestedScores('druid'),
  spellNames: ['Produce Flame', 'Cure Wounds'], ...patch,
});

class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, ctx: CommandContext = P1, rng: Rng = () => 0.5) {
    const r = execute(this.state, cmd, ctx, rng);
    if (!r.ok) throw new Error(r.error);
    this.state = r.state; this.events.push(...r.events);
    return r.events;
  }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
function arena(a: Combatant, foes: Array<[string, Partial<Combatant>, Offset]> = [], ally?: [Partial<Combatant>, Offset]) {
  const parts = [a, ...foes.map(([id, p]) => mk(id, { side: 'enemies', hp: 40, maxHp: 40, saves: LOW, ac: 10, ...p })), ...(ally ? [mk('C', { ownerId: 'p1', hp: 30, maxHp: 30, ...ally[0] })] : [])];
  const s = startBattle('d', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), ...Object.fromEntries(foes.map(([id, , p]) => [id, p])), ...(ally ? { C: ally[1] } : {}) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return new Run({ ...s, status: 'active', order: Object.keys(pos), turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } });
}
const druid = (level = 5, patch: Partial<CharacterSheet> = {}) => combatantFromSheet(drSheet(level, patch), { id: 'A', ownerId: 'p1' });

describe('Wild Shape', () => {
  it('biçim sınırları SRD tablosundan: 2. seviye CR 1/4 uçuşsuz, 4. seviye 1/2, 8. seviye 1 ve uçuş', () => {
    const f2 = wildShapeFeature(druid(2)) as NonNullable<ReturnType<typeof wildShapeFeature>>;
    const two = eligibleForms(monsters, f2, 2);
    expect(two.some((m) => m.id === 'wolf')).toBe(true);
    expect(two.some((m) => m.id === 'black-bear' || m.fly)).toBe(false);
    expect(eligibleForms(monsters, f2, 4).some((m) => m.id === 'black-bear')).toBe(true);
    expect(eligibleForms(monsters, f2, 8).some((m) => m.id === 'brown-bear')).toBe(true);
    expect(eligibleForms(monsters, f2, 8).some((m) => !!m.fly)).toBe(true);
    expect(availableForms(monsters, druid(2))).toHaveLength(4);
  });
  it('bonus eylemle biçim: HP korunur, seviye kadar geçici HP; AC/hız/saldırı biçimden; büyü yok; bırakınca geri döner', () => {
    const c = druid(5);
    const r = arena(c, [['B', {}, o(4, 3)]]);
    r.do({ type: 'wild_shape', actorId: 'A', form: 'black-bear' });
    const a = r.c('A');
    expect(a.hp).toBe(c.hp);
    expect(a.tempHp).toBe(5);
    expect(a.ac).toBe(11);
    expect(a.attacksPerAction).toBe(2);
    expect(a.weaponOptions[0]?.label).toContain('Rend');
    expect(a.economy.bonus).toBe(true);
    expect(a.resources.wildShape).toBe((c.resources.wildShape ?? 0) - 1);
    const fresh = { ...r.state, combatants: { ...r.state.combatants, A: { ...a, economy: { ...a.economy, bonus: false, action: false } } } };
    const cast = execute(fresh, { type: 'cast_spell', actorId: 'A', spellName: 'Produce Flame', targetId: 'B' }, P1, () => 0.5);
    expect(cast.ok ? '' : cast.error).toContain('Wild Shape');
    const hit = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: a.weaponOptions[0] as Combatant['weaponOptions'][number] }, P1, scripted([20, 15], [6, 3]));
    expect(hit.some((e) => e.type === 'attack_resolved' && e.hit)).toBe(true);
    const back = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), economy: { ...r.c('A').economy, bonus: false } } } };
    const res = execute(back, { type: 'wild_shape', actorId: 'A' }, P1, () => 0.5);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.state.combatants.A?.ac).toBe(c.ac);
      expect(res.state.combatants.A?.weaponOptions).toEqual(c.weaponOptions);
      expect(res.state.combatants.A?.shape).toBeUndefined();
    }
    r.replays();
  });
  it('Incapacitated olunca biçim biter; uygun olmayan biçim reddedilir', () => {
    const r = arena(druid(5), [['B', {}, o(4, 3)]]);
    r.do({ type: 'wild_shape', actorId: 'A', form: 'wolf' });
    const bad = execute(arena(druid(2)).state, { type: 'wild_shape', actorId: 'A', form: 'black-bear' }, P1, () => 0.5);
    expect(bad.ok).toBe(false);
    const st = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), conditions: ['Incapacitated'] } } };
    const res = execute(st, { type: 'end_turn', actorId: 'A' }, P1, () => 0.5);
    expect(res.ok && res.state.combatants.A?.shape).toBeFalsy();
  });
  it('Wild Resurgence: kullanım yoksa slotla bir kullanım; kullanımla 1. seviye slot (uzun dinlenmede bir)', () => {
    const c = druid(5);
    const r = arena({ ...c, resources: { ...c.resources, wildShape: 0 } }, [['B', {}, o(9, 3)]]);
    r.do({ type: 'wild_resurgence', actorId: 'A', mode: 'toShape' });
    expect(r.c('A').resources.wildShape).toBe(1);
    expect(execute(r.state, { type: 'wild_resurgence', actorId: 'A', mode: 'toShape' }, P1, () => 0.5).ok).toBe(false);
    const slots = r.c('A').spellSlots[0] ?? 0;
    r.do({ type: 'wild_resurgence', actorId: 'A', mode: 'toSlot' });
    expect(r.c('A').spellSlots[0]).toBe(slots + 1);
    expect(r.c('A').resources.wildShape).toBe(0);
    r.replays();
  });
});

describe('Druid özellikleri ve Circle of the Land', () => {
  it('Primal Order: Warden Medium zırh ve Martial silah; Magician ek cantrip', () => {
    expect(armorProficient('druid', 'medium', {})).toBe(true);
    expect(armorProficient('druid', 'medium', { 'druid:primal-order': 'magician' })).toBe(false);
  });
  it('Primal Strike: turda bir isabete 1d8 element (Beast saldırısı dahil)', () => {
    const c = druid(7);
    expect(c.traits).toContain('primal-strike');
    const r = arena(c, [['B', {}, o(4, 3)]]);
    r.do({ type: 'wild_shape', actorId: 'A', form: 'wolf' });
    const ev = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: r.c('A').weaponOptions[0] as Combatant['weaponOptions'][number] }, P1,
      scripted([20, 15], [6, 3], [8, 5])).find((e) => e.type === 'attack_resolved') as { extra?: Array<{ label: string }> };
    expect(ev.extra?.some((x) => x.label === 'Primal Strike')).toBe(true);
  });
  it('arazi büyüleri her zaman hazır; Nature\'s Ward seçilen arazinin direnci', () => {
    const k = classKit('druid', 5, 'circle-of-the-land', { 'druid/circle-of-the-land:circle-of-the-land-spells': 'polar' });
    expect(k.alwaysPrepared).toEqual(expect.arrayContaining(['Hold Person', 'Sleet Storm', 'Speak with Animals']));
    const ten = classKit('druid', 10, 'circle-of-the-land', { 'druid/circle-of-the-land:circle-of-the-land-spells': 'arid' });
    expect(ten.resist).toEqual(['fire']);
    expect(classKit('druid', 9, 'circle-of-the-land', { 'druid/circle-of-the-land:circle-of-the-land-spells': 'arid' }).resist).toEqual([]);
  });
  it("Land's Aid: Wild Shape kullanımı; küredeki düşmanlar CON save'li Necrotic, alandaki yaralı dost iyileşir", () => {
    const c = druid(3);
    const r = arena(c, [['B', {}, o(6, 3)]], [{ hp: 10 }, o(6, 4)]);
    const evs = r.do({ type: 'use_feature', actorId: 'A', feature: 'druid/circle-of-the-land:lands-aid', to: o(6, 3) }, P1, () => 0.5);
    expect(evs.some((e) => e.type === 'save_resolved' && e.targetId === 'B' && e.damageType === 'necrotic')).toBe(true);
    expect(evs.some((e) => e.type === 'save_resolved' && e.targetId === 'C')).toBe(false);
    expect(r.c('C').hp).toBeGreaterThan(10);
    expect(r.c('A').resources.wildShape).toBe((c.resources.wildShape ?? 0) - 1);
    r.replays();
  });
  it('Natural Recovery: kısa dinlenmede seviye/2 (yukarı) slot, uzun dinlenmeye dek bir kez', () => {
    const s = drSheet(6);
    const spent = { ...fullStatus(s), slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] };
    const r = shortRestStatus(s, spent, 0, () => 0.5);
    expect(r.status.slots.slice(0, 3)).toEqual([0, 0, 1]);
    expect(r.status.resources.naturalRecovery).toBe(0);
  });
});
