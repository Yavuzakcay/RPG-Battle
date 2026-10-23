/** Barbarian 1–5 (SRD 5.2.1): Rage, Danger Sense, Reckless Attack, Primal Knowledge, Frenzy (veriden). */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { applyEvents } from './reduce';
import { saveMode } from './durations';
import { weaponAttackEvents } from './features';
import { monsterAttackEvents } from './monsters';
import { rollSkillCheck } from './checks';
import { combatantFromSheet } from './create';
import { classKit } from '../rules/classFeatures';
import { skillBonus } from '../rules/skills';
import { advanceTo, GM, P1, scripted, setup, sword, zero } from './fixtures';
import type { AttackOption, BattleState, Combatant, Command } from './types';
import type { CharacterSheet } from '../rules/stats';

const barb = (p: Partial<Combatant> = {}): Partial<Combatant> => ({
  hp: 40, maxHp: 40, rageDamage: 2, rageResist: ['bludgeoning', 'piercing', 'slashing'], rageStrAdvantage: true, rage: null,
  resources: { rage: 2 }, saveAdvantage: ['dex'], canReckless: true, modifiers: { ...zero, str: 3, dex: 1 }, ...p,
});
const str: AttackOption = { ...sword, ability: 'str' };
const claw = { name: 'Claw', bonus: 4, damageDice: '1d6+2', damageType: 'slashing', repeat: 1, ranged: false, text: '' };
/** Sıra A'da; A Barbarian, B düşman. */
const ready = (a: Partial<Combatant> = {}, b: Partial<Combatant> = {}) => advanceTo(setup('Düz', { A: barb(a), B: { hp: 60, maxHp: 60, attacks: [claw], ...b } }), 'A');
const run = (s: BattleState, cmd: Command, rng = scripted()) => {
  const r = execute(s, cmd, s.combatants[(cmd as { actorId: string }).actorId]?.side === 'enemies' ? GM : P1, rng);
  if (!r.ok) throw new Error(r.error);
  return r;
};
const err = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, scripted()); return r.ok ? null : r.error; };
const attack = (s: BattleState, a: string, t: string, o: AttackOption, ...rolls: Array<[number, number]>) => {
  const r = weaponAttackEvents(s, s.combatants[a] as Combatant, s.combatants[t] as Combatant, o, scripted(...rolls));
  if (!r.ok) throw new Error(r.error);
  return { events: r.events, state: applyEvents(s, r.events) };
};
const sheet = (level: number, p: Partial<CharacterSheet> = {}): CharacterSheet => ({
  name: 'Grum', raceId: 'human', classId: 'barbarian', level, armorName: 'Zırhsız', shield: false, itemNames: [],
  baseScores: { str: 15, dex: 14, con: 13, int: 8, wis: 12, cha: 10 }, ...p,
});

describe('veri: Barbarian sınıf kiti (SRD tablosundan)', () => {
  it('Rage hasarı 2, B/P/S direnci, Rage sayısı 2→3; Danger Sense, Reckless 2. seviyede; Frenzy ve Primal Knowledge 3.', () => {
    expect(classKit('barbarian', 1).rage).toEqual({ resist: ['bludgeoning', 'piercing', 'slashing'], damage: 2, strAdvantage: true });
    expect(classKit('barbarian', 1).saveAdvantages).toEqual([]);
    expect(classKit('barbarian', 1).reckless).toBe(false);
    expect(classKit('barbarian', 2)).toMatchObject({ saveAdvantages: ['dex'], reckless: true, frenzy: false, extraClassSkills: 0 });
    expect(classKit('barbarian', 3)).toMatchObject({ frenzy: true, extraClassSkills: 1 });
    expect(classKit('barbarian', 5)).toMatchObject({ attacksPerAction: 2 });
    const c3 = combatantFromSheet(sheet(3), { id: 'g', ownerId: 'p1' });
    expect(c3).toMatchObject({ rageDamage: 2, canReckless: true, frenzy: true, saveAdvantage: ['dex'], resources: { rage: 3 } });
    expect(c3.primalSkills).toContain('stealth');
    expect(combatantFromSheet(sheet(1), { id: 'g', ownerId: 'p1' }).resources).toEqual({ rage: 2 });
    // Fighter'da Rage yok.
    expect(combatantFromSheet({ ...sheet(5), classId: 'fighter' }, { id: 'f', ownerId: 'p1' }).rageDamage).toBeUndefined();
  });
  it('silah seçeneğinde saldırı yeteneği: STR, menzilli DEX, Finesse yüksek olan', async () => {
    const { weaponAttackOption } = await import('./weapons');
    expect(weaponAttackOption(sheet(1), 'Greataxe').ability).toBe('str');
    expect(weaponAttackOption(sheet(1), 'Longbow').ability).toBe('dex');
    expect(weaponAttackOption(sheet(1, { baseScores: { str: 10, dex: 16, con: 13, int: 8, wis: 12, cha: 10 } }), 'Rapier').ability).toBe('dex');
  });
});

describe('Rage', () => {
  it('bonus eylem; kullanım düşer, B/P/S direnci eklenir, konsantrasyon biter', () => {
    const s = ready({ concentration: { spell: 'Bless', slotLevel: 1, turn: '1:0' } });
    const r = run(s, { type: 'rage', actorId: 'A' });
    expect(r.events.map((e) => e.type)).toEqual(['feature_used', 'rage_started', 'action_used']);
    const a = r.state.combatants.A as Combatant;
    expect(a.resources.rage).toBe(1);
    expect(a.rage).toEqual({ refreshed: true, added: ['bludgeoning', 'piercing', 'slashing'] });
    expect(a.resistances).toEqual(['bludgeoning', 'piercing', 'slashing']);
    expect(a.concentration).toBeNull();
    expect(a.economy.bonus).toBe(true);
    expect(err(r.state, { type: 'rage', actorId: 'A' })).toBe('Bonus eylem bu tur kullanıldı.');
  });
  it('ağır zırhla ya da kullanım kalmadıysa başlatılamaz; özelliği olmayan başlatamaz', () => {
    expect(err(ready({ heavyArmor: true }), { type: 'rage', actorId: 'A' })).toBe('Ağır zırhla Rage başlatılamaz.');
    expect(err(ready({ resources: { rage: 0 } }), { type: 'rage', actorId: 'A' })).toBe('Rage kalmadı.');
    expect(err(ready({ rageDamage: undefined, rageResist: undefined }), { type: 'rage', actorId: 'A' })).toBe('Rage özelliği yok.');
  });
  it('STR saldırısına Rage hasarı; DEX saldırısına değil', () => {
    const s = run(ready(), { type: 'rage', actorId: 'A' }).state;
    expect(attack(s, 'A', 'B', str, [20, 15], [8, 5]).events[0]).toMatchObject({ rawDamage: 5 + 3 + 2 });
    expect(attack(s, 'A', 'B', { ...str, ability: 'dex' }, [20, 15], [8, 5]).events[0]).toMatchObject({ rawDamage: 5 + 3 });
    expect(attack(ready(), 'A', 'B', str, [20, 15], [8, 5]).events[0]).toMatchObject({ rawDamage: 8 });
  });
  it('direnç: kesici hasar yarıya iner; Rage bitince direnç kalkar (önceden olan direnç kalır)', () => {
    let s = run(ready({ resistances: ['fire'] }), { type: 'rage', actorId: 'A' }).state;
    const hit = monsterAttackEvents(s, s.combatants.B as Combatant, s.combatants.A as Combatant, 0, scripted([20, 18], [6, 6]));
    if (!hit.ok) throw new Error(hit.error);
    expect(hit.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ rawDamage: 8, appliedDamage: 4 });
    s = applyEvents(s, [{ type: 'rage_ended', actorId: 'A', reason: 'test' }]);
    expect(s.combatants.A?.resistances).toEqual(['fire']);
  });
  it('STR save ve Athletics avantajlı; büyü yapılamaz', () => {
    const s = run(ready({ spellNames: ['Fire Bolt'] }), { type: 'rage', actorId: 'A' }).state;
    const a = s.combatants.A as Combatant;
    expect(saveMode('normal', a, 'str')).toBe('advantage');
    expect(saveMode('normal', a, 'con')).toBe('normal');
    expect(rollSkillCheck(a, 'athletics', 10, scripted([20, 3], [20, 12]))).toMatchObject({ mode: 'advantage', natural: 12 });
    expect(err(s, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' })).toBe('Rage sürerken büyü yapılamaz.');
  });
  it('süre: sonraki turunun sonunda biter; düşmana saldırı ya da bonus eylem uzatır; Incapacitated olunca biter', () => {
    let s = run(ready(), { type: 'rage', actorId: 'A' }).state;
    s = run(s, { type: 'end_turn', actorId: 'A' }).state;
    expect(s.combatants.A?.rage).toEqual({ refreshed: false, added: ['bludgeoning', 'piercing', 'slashing'] });
    // Saldırı uzatır.
    let t = advanceTo(s, 'A');
    t = attack(t, 'A', 'B', str, [20, 2]).state;
    expect(t.combatants.A?.rage?.refreshed).toBe(true);
    t = run(t, { type: 'end_turn', actorId: 'A' }).state;
    expect(t.combatants.A?.rage).toBeTruthy();
    // Uzatılmazsa biter.
    let u = advanceTo(s, 'A');
    const end = run(u, { type: 'end_turn', actorId: 'A' });
    expect(end.events.map((e) => e.type)).toContain('rage_ended');
    expect(end.state.combatants.A?.rage).toBeNull();
    expect(end.state.combatants.A?.resistances).toEqual([]);
    // Bonus eylemle uzatma.
    u = run(advanceTo(s, 'A'), { type: 'rage', actorId: 'A' }).state;
    expect(u.combatants.A?.resources.rage).toBe(1);
    expect(u.combatants.A?.rage?.refreshed).toBe(true);
    // Incapacitated.
    const inc = applyEvents(s, [{ type: 'condition_changed', targetId: 'A', condition: 'Stunned', present: true, reason: 'test' }]);
    expect(inc.combatants.A?.rage).toBeNull();
  });
});

describe('Danger Sense', () => {
  it('DEX save avantajlı; Incapacitated iken değil', () => {
    const a = ready().combatants.A as Combatant;
    expect(saveMode('normal', a, 'dex')).toBe('advantage');
    expect(saveMode('disadvantage', a, 'dex')).toBe('normal');
    expect(saveMode('normal', { ...a, conditions: ['Stunned'] }, 'dex')).toBe('normal');
    expect(saveMode('normal', a, 'wis')).toBe('normal');
  });
});

describe('Reckless Attack', () => {
  it('ilk saldırıdan önce; STR saldırıları avantajlı, ona yapılan saldırılar avantajlı; sonraki turunun başında biter', () => {
    let s = run(ready(), { type: 'reckless', actorId: 'A' }).state;
    expect(s.combatants.A?.marks).toEqual([{ kind: 'reckless', by: 'A', end: 'turnStart', count: 1 }]);
    expect(attack(s, 'A', 'B', str, [20, 3], [20, 17], [8, 4]).events[0]).toMatchObject({ mode: 'advantage', natural: 17 });
    expect(attack(s, 'A', 'B', { ...str, ability: 'dex' }, [20, 3]).events[0]).toMatchObject({ mode: 'normal' });
    const hit = monsterAttackEvents(s, s.combatants.B as Combatant, s.combatants.A as Combatant, 0, scripted([20, 2], [20, 15], [6, 1]));
    if (!hit.ok) throw new Error(hit.error);
    expect(hit.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ mode: 'advantage' });
    expect(err(s, { type: 'reckless', actorId: 'A' })).toBe('Reckless Attack zaten etkin.');
    s = run(s, { type: 'end_turn', actorId: 'A' }).state;
    expect(s.combatants.A?.marks?.length).toBe(1);
    s = advanceTo(s, 'A');
    expect(s.combatants.A?.marks).toEqual([]);
  });
  it('saldırıdan sonra seçilemez; özelliği olmayan seçemez', () => {
    const s = run(ready(), { type: 'attack', actorId: 'A', targetId: 'B', option: str }, scripted([20, 2])).state;
    expect(err(s, { type: 'reckless', actorId: 'A' })).toBe('Reckless Attack turun ilk saldırısından önce seçilir.');
    expect(err(ready({ canReckless: undefined }), { type: 'reckless', actorId: 'A' })).toBe('Reckless Attack özelliği yok.');
  });
});

describe('Primal Knowledge', () => {
  it('Rage sürerken Stealth STR ile (yüksekse) ve STR avantajıyla', () => {
    const base = ready({ primalSkills: ['stealth', 'perception'], skills: { stealth: 3 } });
    expect(skillBonus(base.combatants.A as Combatant, 'stealth')).toBe(3);
    const s = run(base, { type: 'rage', actorId: 'A' }).state;
    const a = s.combatants.A as Combatant;
    expect(skillBonus(a, 'stealth')).toBe(3 - 1 + 3);
    expect(rollSkillCheck(a, 'stealth', 10, scripted([20, 4], [20, 9]))).toMatchObject({ mode: 'advantage' });
    expect(skillBonus(a, 'perception')).toBe(3);
  });
});

describe('Frenzy (Path of the Berserker)', () => {
  it('Rage + Reckless: turunda ilk isabete Rage hasarı kadar d6; turda bir kez; Reckless olmadan yok', () => {
    let s = run(ready({ frenzy: true }), { type: 'rage', actorId: 'A' }).state;
    s = run(s, { type: 'reckless', actorId: 'A' }).state;
    const first = attack(s, 'A', 'B', str, [20, 10], [20, 15], [8, 5], [6, 4], [6, 6]);
    expect(first.events[0]).toMatchObject({ extra: [{ label: 'Frenzy', rolls: [4, 6], raw: 10 }] });
    const second = attack(first.state, 'A', 'B', str, [20, 10], [20, 15], [8, 5]);
    expect((second.events[0] as { extra?: unknown }).extra).toBeUndefined();
    const noReckless = run(ready({ frenzy: true }), { type: 'rage', actorId: 'A' }).state;
    expect((attack(noReckless, 'A', 'B', str, [20, 15], [8, 5]).events[0] as { extra?: unknown }).extra).toBeUndefined();
  });
});

describe('yapay zekâ: Rage ve Reckless Attack (basit kural)', () => {
  it('düşman yakındaysa Rage; sonra HP yarıdan fazlaysa Reckless; HP düşükse Reckless yok', async () => {
    const { chooseCommand } = await import('./ai');
    const s = ready({ weaponOptions: [str] });
    expect(chooseCommand(s)).toEqual({ type: 'rage', actorId: 'A' });
    const raged = run(s, { type: 'rage', actorId: 'A' }).state;
    expect(chooseCommand(raged)).toEqual({ type: 'reckless', actorId: 'A' });
    const hurt = run(ready({ weaponOptions: [str], hp: 15 }), { type: 'rage', actorId: 'A' }).state;
    expect(chooseCommand(hurt)).toMatchObject({ type: 'attack', actorId: 'A' });
  });
});
