/** Yan el (Light ek saldırısı), Nick, Two-Weapon Fighting ve Versatile (Görev P1; SRD 5.2.1 silah özellikleri). */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { applyEvents } from './reduce';
import { combatantFromSheet } from './create';
import { offHandAttackOption, weaponAttackOption, weaponAttackOptions } from './weapons';
import { advanceTo, P1, scripted, setup } from './fixtures';
import { offHandOptionProblem, offHandProblem, otherHandFree } from '../rules/hands';
import { characterProblems, blankCharacter, withSkills } from '../rules/builder';
import type { CharacterSheet } from '../rules/stats';
import type { BattleState, Combatant, Command } from './types';

const sc = { str: 10, dex: 16, con: 14, int: 10, wis: 12, cha: 8 };
const rogue = (p: Partial<CharacterSheet> = {}): CharacterSheet => ({
  name: 'Sela', raceId: 'human', classId: 'rogue', level: 1, armorName: 'Zırhsız', shield: false, itemNames: [], baseScores: sc,
  weapons: [{ name: 'Shortsword' }, { name: 'Dagger' }], offHand: 'Dagger', ...p,
});
const fighter = (p: Partial<CharacterSheet> = {}): CharacterSheet => ({
  name: 'Bor', raceId: 'human', classId: 'fighter', level: 1, armorName: 'Zırhsız', shield: false, itemNames: [],
  baseScores: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 }, ...p,
});

/** A'yı verilen karakterle değiştirir; sıra A'da, B düşman (bitişik, haritasız). */
function battle(sheet: CharacterSheet): BattleState {
  const c = combatantFromSheet(sheet, { id: 'A', ownerId: 'p1' });
  const { id: _i, name: _n, ownerId: _o, initiativeBonus: _b, ...fields } = c;
  return advanceTo(setup('Düz', { A: fields as Partial<Combatant>, B: { hp: 80, maxHp: 80, ac: 5 } }), 'A');
}
const run = (s: BattleState, cmd: Command, rng = scripted([20, 15], [8, 4], [6, 3], [4, 2])) => {
  const r = execute(s, cmd, P1, rng);
  if (!r.ok) throw new Error(r.error);
  return r;
};
const err = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, scripted([20, 15], [6, 3])); return r.ok ? null : r.error; };
const opt = (s: BattleState, label: string) => (s.combatants.A as Combatant).weaponOptions.find((o) => o.label === label) as NonNullable<Combatant['offHandOption']>;
const off: Command = { type: 'offhand_attack', actorId: 'A', targetId: 'B' };

describe('eller: yan el silahı kuralları', () => {
  it('Light olmalı; kalkan ve iki elli silahla olmaz; ana elde farklı bir Light silah gerekir', () => {
    expect(offHandProblem(rogue())).toBeNull();
    expect(offHandOptionProblem(rogue({ weapons: [{ name: 'Shortsword' }, { name: 'Rapier' }] }), 'Rapier')).toContain('Light değil');
    expect(offHandProblem(rogue({ shield: true }))).toBe('Kalkan varken yan elde silah tutulamaz.');
    expect(offHandProblem(rogue({ weapons: [{ name: 'Shortsword' }, { name: 'Dagger' }, { name: 'Greatsword' }] }))).toContain('İki elli yakın dövüş silahı taşınıyor (Greatsword)');
    // İki elli menzilli silah (yay) engel değil: saldırıyla çekilip kaldırılır.
    expect(offHandProblem(rogue({ weapons: [{ name: 'Shortsword' }, { name: 'Dagger' }, { name: 'Shortbow' }] }))).toBeNull();
    expect(offHandProblem(rogue({ weapons: [{ name: 'Rapier' }, { name: 'Dagger' }] }))).toBe('Ana elde farklı bir Light silah gerekir.');
    expect(offHandOptionProblem(rogue(), 'Longsword')).toBe('Yan el silahı taşınan silahlardan olmalı.');
  });
  it('oluşturucu geçersiz yan eli sorun olarak gösterir', () => {
    const c = blankCharacter('r');
    const bad = withSkills({ ...c, classSkills: ['stealth', 'perception', 'acrobatics', 'deception'], sheet: { ...c.sheet, ...rogue({ shield: true }) } });
    expect(characterProblems(bad)).toContain('Yan el: Kalkan varken yan elde silah tutulamaz.');
  });
});

describe('Versatile: diğer el boşsa iki elle', () => {
  it('kalkansız Longsword 1d10; kalkanla ya da yan el silahıyla 1d8; fırlatmada tek el', () => {
    expect(weaponAttackOption(fighter(), 'Longsword')).toMatchObject({ damage: '1d10+3', twoHands: true });
    expect(weaponAttackOption(fighter({ shield: true }), 'Longsword').damage).toBe('1d8+3');
    expect(weaponAttackOption(fighter({ shield: true }), 'Longsword').twoHands).toBeUndefined();
    const spear = weaponAttackOptions(fighter(), 'Spear');
    expect(spear.map((o) => o.damage)).toEqual(['1d8+3', '1d6+3']);
    expect(otherHandFree(rogue())).toBe(false);
    expect(otherHandFree(rogue({ offHand: undefined }))).toBe(true);
    const handaxe = fighter({ weapons: [{ name: 'Handaxe' }, { name: 'Light hammer' }, { name: 'Quarterstaff' }], offHand: 'Light hammer' });
    expect(weaponAttackOption(handaxe, 'Quarterstaff').damage).toBe('1d6+3');
  });
});

describe('yan el saldırısı (Light ek saldırısı)', () => {
  it('hasara yetenek değiştiricisi eklenmez (negatifse eklenir); Two-Weapon Fighting ekler', () => {
    expect(offHandAttackOption(rogue())).toMatchObject({ label: 'Dagger (yan el)', damage: '1d4', offhand: true, light: true });
    const weak = rogue({ baseScores: { ...sc, str: 8, dex: 8 } });
    expect(offHandAttackOption(weak)?.damage).toBe('1d4-1');
    const twf = fighter({ weapons: [{ name: 'Shortsword' }, { name: 'Scimitar' }], offHand: 'Scimitar', advancements: [{ level: 1, featId: 'two-weapon-fighting' }] });
    expect(offHandAttackOption(twf)?.damage).toBe('1d6+3');
    expect(offHandAttackOption(rogue({ offHand: undefined }))).toBeNull();
    expect(offHandAttackOption(rogue({ shield: true }))).toBeNull();
  });
  it('Attack eyleminde Light silahla saldırınca açılır; bonus eylem harcar; turda bir kez', () => {
    const s = battle(rogue());
    expect(err(s, off)).toBe('Önce Attack eylemiyle (yan eldekinden farklı) bir Light silahla saldırmalısın.');
    const a = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Shortsword') }).state;
    expect(a.combatants.A?.economy.lightAttack).toBe(true);
    const r = run(a, off);
    expect(r.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ label: 'Dagger (yan el)' });
    expect(r.events.at(-1)).toMatchObject({ type: 'action_used', kind: 'bonus', offhand: true });
    expect(r.state.combatants.A?.economy).toMatchObject({ bonus: true, offhandUsed: true });
    expect(err(r.state, off)).toBe('Light ek saldırısı bu tur yapıldı.');
  });
  it('bonus eylem kullanıldıysa yapılamaz; Light olmayan ya da yan el silahıyla saldırı açmaz', () => {
    const s = battle(rogue({ level: 2, weapons: [{ name: 'Shortsword' }, { name: 'Dagger' }, { name: 'Rapier' }] }));
    const rapier = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Rapier') }).state;
    expect(err(rapier, off)).toContain('Önce Attack eylemiyle');
    const dagger = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Dagger') }).state;
    expect(err(dagger, off)).toContain('Önce Attack eylemiyle');
    const hidden = run(s, { type: 'dash', actorId: 'A', bonus: true }).state;
    const a = run(hidden, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Shortsword') }).state;
    expect(err(a, off)).toBe('Bonus eylem bu tur kullanıldı.');
  });
  it('Nick: yan el silahında Nick ustalığı varsa ek saldırı Attack eyleminin içinde, bonus eylem boş kalır', () => {
    const s = battle(rogue({ level: 2, weaponMasteries: ['dagger', 'shortsword'] }));
    expect(s.combatants.A?.nickOffhand).toBe(true);
    const a = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Shortsword') }).state;
    const r = run(a, off);
    expect(r.events.at(-1)).toMatchObject({ type: 'action_used', kind: 'attack', what: 'Nick', offhand: true });
    expect(r.state.combatants.A?.economy).toMatchObject({ bonus: false, offhandUsed: true });
    expect(err(r.state, off)).toBe('Light ek saldırısı bu tur yapıldı.');
    // Bonus eylem hâlâ kullanılabilir.
    expect(err(r.state, { type: 'dash', actorId: 'A', bonus: true })).toBeNull();
    // Nick'siz yan el (Shortsword yan elde, Dagger ana el) bonus eylem harcar.
    const noNick = battle(rogue({ offHand: 'Shortsword', weaponMasteries: ['dagger', 'shortsword'] }));
    expect(noNick.combatants.A?.nickOffhand).toBeUndefined();
  });
  it('olaylar yeniden uygulanınca aynı durum (kayıt/replay)', () => {
    const s = battle(rogue({ level: 2, weaponMasteries: ['dagger', 'shortsword'] }));
    const a = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Shortsword') });
    const r = run(a.state, off);
    expect(applyEvents(applyEvents(s, a.events), r.events)).toEqual(r.state);
  });
  it('tur değişince yeniden açılır', () => {
    let s = battle(rogue());
    s = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Shortsword') }).state;
    s = run(s, off).state;
    s = run(s, { type: 'end_turn', actorId: 'A' }).state;
    s = advanceTo(s, 'A');
    expect(s.combatants.A?.economy.lightAttack).toBeFalsy();
    expect(s.combatants.A?.economy.offhandUsed).toBeFalsy();
  });
});

describe('yapay zekâ: yan el', () => {
  it('Nick varsa ilk Light saldırıdan hemen sonra; yoksa eylem bitince bonus eylemle', async () => {
    const { chooseCommand } = await import('./ai');
    let s = battle(rogue({ weaponMasteries: ['dagger', 'shortsword'] }));
    const first = chooseCommand(s);
    expect(first).toMatchObject({ type: 'attack', option: { label: 'Shortsword' } });
    s = run(s, first).state;
    expect(chooseCommand(s)).toEqual(off);
    let t = battle(rogue());
    t = run(t, chooseCommand(t)).state;
    expect(chooseCommand(t)).toEqual(off);
  });
});
