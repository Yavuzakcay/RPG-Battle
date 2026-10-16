/** Süreli durumlar, Kaçın (Dodge) ve Yardım (Help). */
import { describe, it, expect } from 'vitest';
import { combatantFromMonster, execute, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './index';
import { getMonster } from '../data';
import type { Rng } from '../rules/dice';
import { GM, P1, P2, envId, mk, scripted, sword } from './fixtures';
import { saveMode, supportedAttackEffects, supportedSpellEffects } from './durations';
import { describeEvent } from '../ui/log';

const monster = (id: string, cid: string, p: Partial<Combatant> = {}): Combatant => ({ ...combatantFromMonster(getMonster(id), { id: cid }), ...p });
/** Haritasız savaş; sıra: listedeki sırayla (ilki en yüksek inisiyatif). */
function arena(parts: Combatant[]): BattleState {
  return startBattle('d', envId('Düz'), parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number]))).state;
}
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const run = (s: BattleState, cmd: Command, ctx: CommandContext, rng: Rng = scripted()) => ok(execute(s, cmd, ctx, rng));
const end = (s: BattleState, id: string, ctx: CommandContext, rng: Rng = scripted()) => run(s, { type: 'end_turn', actorId: id }, ctx, rng);
const ofType = <T extends BattleEvent['type']>(events: BattleEvent[], t: T) => events.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === t);
const hero = (id = 'A', p: Partial<Combatant> = {}) => mk(id, { ownerId: 'p1', ac: 10, hp: 40, maxHp: 40, weaponOptions: [sword], ...p });

describe('süreli durumlar', () => {
  it('Wyvern Sting: Poisoned, wyvernin sonraki turunun başına dek; zehirliyken saldırı dezavantajlı', () => {
    let s = arena([monster('wyvern', 'W'), hero()]);
    const sting = s.combatants.W?.attacks.findIndex((a) => a.name === 'Sting') ?? -1;
    s = run(s, { type: 'monster_attack', actorId: 'W', targetId: 'A', attackIndex: sting }, GM, scripted([20, 19], [6, 3], [6, 3])).state;
    expect(s.combatants.A?.conditions).toContain('Poisoned');
    expect(s.combatants.A?.conditionTimers?.[0]).toMatchObject({ ownerId: 'W', end: 'turnStart', count: 1 });
    s = end(s, 'W', GM).state;
    // A'nın turu: zehirli saldırı dezavantajlı.
    const atk = run(s, { type: 'attack', actorId: 'A', targetId: 'W', option: sword }, P1, scripted([20, 15], [20, 15], [8, 1]));
    expect(ofType(atk.events, 'attack_resolved')[0]?.reasons).toContain('Saldıran Poisoned');
    // A turunu bitirir, W'nin turu başlar: zehir biter.
    const r = end(atk.state, 'A', P1);
    expect(ofType(r.events, 'condition_ended')[0]).toMatchObject({ targetId: 'A', condition: 'Poisoned', reason: 'süre doldu' });
    expect(r.state.combatants.A?.conditions).not.toContain('Poisoned');
    expect(r.state.combatants.A?.conditionTimers).toEqual([]);
  });
  it('Ghoul Claw: CON DC 10 başarısızsa Paralyzed, hedefin sonraki turunun sonuna dek; başarılıysa yok', () => {
    const s0 = arena([monster('ghoul', 'G'), hero()]);
    const claw = s0.combatants.G?.attacks.findIndex((a) => a.name === 'Claw') ?? -1;
    const saved = run(s0, { type: 'monster_attack', actorId: 'G', targetId: 'A', attackIndex: claw }, GM, scripted([20, 18], [4, 2], [20, 15]));
    expect(ofType(saved.events, 'condition_save')[0]).toMatchObject({ ability: 'con', dc: 10, success: true });
    expect(saved.state.combatants.A?.conditions).not.toContain('Paralyzed');
    let s = run(s0, { type: 'monster_attack', actorId: 'G', targetId: 'A', attackIndex: claw }, GM, scripted([20, 18], [4, 2], [20, 3])).state;
    expect(s.combatants.A?.conditions).toContain('Paralyzed');
    expect(s.combatants.A?.conditionTimers?.[0]).toMatchObject({ ownerId: 'A', end: 'turnEnd', count: 1 });
    s = end(s, 'G', GM).state;
    expect(s.combatants.A?.conditions).toContain('Paralyzed');
    const r = end(s, 'A', P1);
    expect(r.state.combatants.A?.conditions).not.toContain('Paralyzed');
  });
  it('"Sahibinin sonraki turunun sonuna dek" sahibi sıradayken: bu turun sonu sayılmaz (Merrow Bite)', () => {
    let s = arena([monster('merrow', 'M'), hero()]);
    const bite = s.combatants.M?.attacks.findIndex((a) => a.name === 'Bite') ?? -1;
    s = run(s, { type: 'monster_attack', actorId: 'M', targetId: 'A', attackIndex: bite }, GM, scripted([20, 19], [4, 2])).state;
    expect(s.combatants.A?.conditionTimers?.[0]).toMatchObject({ ownerId: 'M', end: 'turnEnd', count: 2 });
    s = end(s, 'M', GM).state;
    expect(s.combatants.A?.conditions).toContain('Poisoned');
    s = end(s, 'A', P1).state;
    const r = end(s, 'M', GM);
    expect(ofType(r.events, 'condition_ended').map((e) => e.condition)).toContain('Poisoned');
  });
  it('save ends (Hold Person): her tur sonu WIS save; başarısızsa sürer, başarılıysa biter; konsantrasyon bitince sayaç da düşer', () => {
    const caster = hero('C', { ownerId: 'p2', spellNames: ['Hold Person'], spellSlots: [0, 2, 0, 0, 0, 0, 0, 0, 0], spellSaveDc: 14, spellMod: 3 });
    const foe = mk('B', { side: 'enemies', hp: 30, maxHp: 30 });
    let s = arena([caster, foe]);
    s = run(s, { type: 'cast_spell', actorId: 'C', spellName: 'Hold Person', targetId: 'B' }, P2, scripted([20, 2])).state;
    expect(s.combatants.B?.conditions).toContain('Paralyzed');
    expect(s.combatants.B?.conditionTimers?.[0]).toMatchObject({ ownerId: 'B', end: 'turnEnd', save: { ability: 'wis', dc: 14 } });
    s = end(s, 'C', P2).state;
    const fail = end(s, 'B', GM, scripted([20, 5]));
    expect(ofType(fail.events, 'condition_save')[0]).toMatchObject({ success: false });
    expect(fail.state.combatants.B?.conditions).toContain('Paralyzed');
    s = end(fail.state, 'C', P2).state;
    const pass = end(s, 'B', GM, scripted([20, 18]));
    expect(ofType(pass.events, 'condition_ended')[0]).toMatchObject({ condition: 'Paralyzed', reason: 'kurtarma zarı başarılı' });
    expect(describeEvent(ofType(pass.events, 'condition_ended')[0] as BattleEvent, pass.state)).toContain('bitti');
    // Konsantrasyon bitince (eski kaynak) durum ve sayacı birlikte kalkar.
    const again = run(arena([caster, foe]), { type: 'cast_spell', actorId: 'C', spellName: 'Hold Person', targetId: 'B' }, P2, scripted([20, 2])).state;
    const dropped = run(again, { type: 'set_condition', targetId: 'C', condition: 'Incapacitated', present: true }, GM).state;
    expect(dropped.combatants.B?.conditions).not.toContain('Paralyzed');
    expect(dropped.combatants.B?.conditionTimers ?? []).toEqual([]);
  });
  it('desteklenen etkiler listesi (rapor)', () => {
    expect(supportedAttackEffects().length).toBeGreaterThanOrEqual(15);
    expect(supportedSpellEffects()).toEqual(expect.arrayContaining(['Hold Person', 'Hideous Laughter', 'Blindness/Deafness', 'Fear', 'Entangle', 'Web']));
  });
});

describe('Kaçın (Dodge)', () => {
  it('eylem; saldıranlar dezavantajlı, DEX save avantajlı; sonraki turunun başında biter', () => {
    let s = arena([hero(), monster('ogre', 'O')]);
    const d = run(s, { type: 'dodge', actorId: 'A' }, P1);
    expect(ofType(d.events, 'action_used')[0]).toMatchObject({ kind: 'action' });
    expect(execute(d.state, { type: 'attack', actorId: 'A', targetId: 'O', option: sword }, P1, scripted()).ok).toBe(false); // eylem harcandı
    expect(saveMode('normal', d.state.combatants.A?.conditions ?? [], 'dex')).toBe('advantage');
    expect(saveMode('disadvantage', d.state.combatants.A?.conditions ?? [], 'dex')).toBe('normal');
    expect(saveMode('normal', d.state.combatants.A?.conditions ?? [], 'wis')).toBe('normal');
    s = end(d.state, 'A', P1).state;
    const atk = run(s, { type: 'monster_attack', actorId: 'O', targetId: 'A', attackIndex: 0 }, GM, scripted([20, 15], [20, 15], [8, 1]));
    expect(ofType(atk.events, 'attack_resolved')[0]?.reasons).toContain('Hedef kaçınıyor');
    const r = end(atk.state, 'O', GM);
    expect(ofType(r.events, 'condition_ended')[0]).toMatchObject({ targetId: 'A', condition: 'Dodge' });
    expect(r.state.combatants.A?.conditions).not.toContain('Dodge');
  });
  it('etkisiz ya da Restrained iken işe yaramaz; eylem harcandıysa reddedilir', () => {
    let s = arena([hero(), monster('ogre', 'O')]);
    s = run(s, { type: 'dodge', actorId: 'A' }, P1).state;
    expect(execute(s, { type: 'dodge', actorId: 'A' }, P1, scripted()).ok).toBe(false);
    s = end(s, 'A', P1).state;
    s = { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), conditions: [...(s.combatants.A as Combatant).conditions, 'Restrained'] } } };
    const atk = run(s, { type: 'monster_attack', actorId: 'O', targetId: 'A', attackIndex: 0 }, GM, scripted([20, 15], [20, 15], [8, 1]));
    expect(ofType(atk.events, 'attack_resolved')[0]?.reasons).not.toContain('Hedef kaçınıyor');
  });
});

describe('Yardım (Help)', () => {
  it('düşmana işaret; tarafın ilk saldırısı avantajlı, sonra işaret kalkar', () => {
    let s = arena([hero('H'), hero('A', { ownerId: 'p2' }), mk('B', { side: 'enemies', hp: 60, maxHp: 60, ac: 5 })]);
    expect(execute(s, { type: 'help', actorId: 'H', targetId: 'A' }, P1, scripted()).ok).toBe(false); // müttefik hedef olmaz
    s = run(s, { type: 'help', actorId: 'H', targetId: 'B' }, P1).state;
    expect(s.combatants.B?.conditions).toContain('Help:party');
    s = end(s, 'H', P1).state;
    const first = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P2, scripted([20, 3], [20, 15], [8, 1]));
    expect(ofType(first.events, 'attack_resolved')[0]?.reasons).toContain('Yardım');
    expect(first.state.combatants.B?.conditions).not.toContain('Help:party');
  });
  it('kullanılmazsa yardım edenin sonraki turunun başında biter', () => {
    let s = arena([hero('H'), mk('B', { side: 'enemies', hp: 60, maxHp: 60 })]);
    s = run(s, { type: 'help', actorId: 'H', targetId: 'B' }, P1).state;
    s = end(s, 'H', P1).state;
    const r = end(s, 'B', GM);
    expect(ofType(r.events, 'condition_ended')[0]).toMatchObject({ targetId: 'B', condition: 'Help:party' });
  });
});
