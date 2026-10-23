/**
 * Monk 1–5 (Görev P-Monk; SRD 5.2.1): Martial Arts, Unarmored Defense/Movement, Monk's Focus (Flurry of Blows,
 * Patient Defense, Step of the Wind), Uncanny Metabolism, Deflect Attacks, Slow Fall, Extra Attack, Stunning Strike,
 * Open Hand Technique.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet } from './create';
import { applyEvents } from './reduce';
import { advanceTo, GM, P1, scripted, setup } from './fixtures';
import { chooseCommand } from './ai';
import { fallEffect } from './maprules';
import { metabolismEvents } from './martial';
import { classKit, experimentalFrom, missingFeatures } from '../rules/classFeatures';
import type { CharacterSheet } from '../rules/stats';
import { FRESH_ECONOMY, type BattleState, type Combatant, type Command } from './types';

const sheet = (level: number, p: Partial<CharacterSheet> = {}): CharacterSheet => ({
  name: 'Lin', raceId: 'human', classId: 'monk', level, armorName: 'Zırhsız', shield: false, itemNames: [],
  baseScores: { str: 10, dex: 15, con: 13, int: 8, wis: 14, cha: 12 }, backgroundBonuses: { dex: 2, wis: 1 },
  weapons: [{ name: 'Quarterstaff' }, { name: 'Shortsword' }], ...(level >= 3 ? { subclassId: 'warrior-of-the-open-hand' } : {}), ...p,
});
const mk = (level: number, p: Partial<CharacterSheet> = {}) => combatantFromSheet(sheet(level, p), { id: 'a', ownerId: 'p' });

/** A Monk (sıra A'da), B düşman (bitişik, haritasız, 80 HP, AC 5). */
function battle(level: number, p: Partial<CharacterSheet> = {}, b: Partial<Combatant> = {}): BattleState {
  const m = combatantFromSheet(sheet(level, p), { id: 'A', ownerId: 'p1' });
  const { id: _i, name: _n, ownerId: _o, initiativeBonus: _b, ...fields } = m;
  return advanceTo(setup('Düz', { A: fields as Partial<Combatant>, B: { hp: 80, maxHp: 80, ac: 5, ...b } }), 'A');
}
const pad = (...xs: Array<[number, number]>) => scripted(...xs, ...Array.from({ length: 20 }, () => [20, 10] as [number, number]));
const run = (s: BattleState, cmd: Command, rng = pad()) => {
  const r = execute(s, cmd, P1, rng);
  if (!r.ok) throw new Error(r.error);
  return r;
};
const err = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, pad()); return r.ok ? null : r.error; };
const A = (s: BattleState) => s.combatants.A as Combatant;
const opt = (s: BattleState, label: string) => A(s).weaponOptions.find((o) => o.label === label) as NonNullable<Combatant['bonusStrike']>;
const atk = (s: BattleState, label: string, rng = pad([20, 15], [6, 4])) => run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, label) }, rng);

describe('Monk: sınıf kiti ve Martial Arts', () => {
  it('Martial Arts zarı (1d6 → 5. seviyede 1d8), Focus Points, Unarmored Defense/Movement, Extra Attack', () => {
    expect(classKit('monk', 1).martialArts?.die).toBe('1d6');
    expect(classKit('monk', 5).martialArts?.die).toBe('1d8');
    expect(mk(1).resources.focus).toBeUndefined();
    expect(mk(2).resources).toMatchObject({ focus: 2, uncannyMetabolism: 1 });
    expect(mk(5).resources.focus).toBe(5);
    // AC 10 + DEX 3 + WIS 2; hız 30 + 10 (2. seviye).
    expect(mk(1).ac).toBe(15);
    expect(mk(2).speed).toBe(40);
    expect(mk(4).attacksPerAction).toBe(1);
    expect(mk(5).attacksPerAction).toBe(2);
  });
  it('Unarmed Strike Martial Arts zarı + DEX; Monk silahında zar büyükse Martial Arts, DEX; zırh ya da kalkanla yok', () => {
    const m = mk(1);
    expect(m.weaponOptions.find((o) => o.label === 'Unarmed Strike')).toMatchObject({ damage: '1d6+3', attackBonus: 5, martialArts: true });
    // Shortsword (Light martial) 1d6 DEX; Quarterstaff (basit) Versatile 1d8 iki elle.
    expect(m.weaponOptions.find((o) => o.label === 'Shortsword')).toMatchObject({ damage: '1d6+3', martialArts: true });
    expect(m.weaponOptions.find((o) => o.label === 'Quarterstaff')).toMatchObject({ damage: '1d8+3', martialArts: true });
    expect(mk(5).weaponOptions.find((o) => o.label === 'Shortsword')?.damage).toBe('1d8+3');
    expect(m.bonusStrike).toBeTruthy();
    const armored = mk(1, { armorName: 'Leather Armor' });
    expect(armored.weaponOptions.some((o) => o.label === 'Unarmed Strike')).toBe(false);
    expect(armored.bonusStrike).toBeUndefined();
    expect(armored.weaponOptions.find((o) => o.label === 'Shortsword')?.martialArts).toBeUndefined();
  });
  it('1–5 eksiksiz (alt sınıflı): "deneysel" uyarısı 6. seviyeden', () => {
    expect(missingFeatures('monk', 5, 'warrior-of-the-open-hand')).toEqual([]);
    expect(experimentalFrom('monk', 'warrior-of-the-open-hand')).toBe(6);
  });
});

describe('bonus eylemle Unarmed Strike ve Flurry of Blows', () => {
  it('Martial Arts: bonus eylemle bir Unarmed Strike (Attack eylemi gerekmez)', () => {
    const s = battle(1);
    const r = run(s, { type: 'bonus_strike', actorId: 'A', targetId: 'B' }, pad([20, 15], [6, 4]));
    expect(r.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ label: 'Unarmed Strike (bonus)', rawDamage: 7 });
    expect(A(r.state).economy.bonus).toBe(true);
    expect(err(r.state, { type: 'bonus_strike', actorId: 'A', targetId: 'B' })).toBe('Bonus eylem bu tur kullanıldı.');
  });
  it('Flurry of Blows: 1 Focus, bonus eylem, iki Unarmed Strike; Topple (Open Hand Technique) DEX save', () => {
    let s = battle(3, {}, { saves: { str: 0, dex: -5, con: 0, int: 0, wis: 0, cha: 0 } });
    s = run(s, { type: 'focus_action', actorId: 'A', action: 'flurry-of-blows' }).state;
    expect(A(s).resources.focus).toBe(2);
    expect(A(s).economy).toMatchObject({ bonus: true, flurryLeft: 2 });
    const r1 = run(s, { type: 'bonus_strike', actorId: 'A', targetId: 'B', technique: 'topple' }, pad([20, 15], [6, 4], [20, 2]));
    expect(r1.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ label: 'Flurry of Blows' });
    expect(r1.events.find((e) => e.type === 'save_resolved')).toMatchObject({ label: 'Open Hand Technique (Topple)', ability: 'dex', success: false });
    expect(r1.state.combatants.B?.conditions).toContain('Prone');
    const r2 = run(r1.state, { type: 'bonus_strike', actorId: 'A', targetId: 'B', technique: 'addle' });
    expect(A(r2.state).economy.flurryLeft).toBe(0);
    expect(err(r2.state, { type: 'bonus_strike', actorId: 'A', targetId: 'B' })).toBe('Bonus eylem bu tur kullanıldı.');
  });
  it('Addle: hedef sonraki turunun başına dek fırsat saldırısı yapamaz', () => {
    let s = battle(3);
    s = run(s, { type: 'focus_action', actorId: 'A', action: 'flurry-of-blows' }).state;
    s = run(s, { type: 'bonus_strike', actorId: 'A', targetId: 'B', technique: 'addle' }, pad([20, 15], [6, 4])).state;
    expect(s.combatants.B?.conditions).toContain('Addled');
  });
});

describe('Patient Defense ve Step of the Wind', () => {
  it('bonus eylemle Dash/Disengage bedava; 1 Focus ile Disengage + Dodge ya da Disengage + Dash', () => {
    const s = battle(2);
    expect(A(s).bonusActions).toEqual(expect.arrayContaining(['dash', 'disengage']));
    const pd = run(s, { type: 'focus_action', actorId: 'A', action: 'patient-defense' });
    expect(pd.events.map((e) => e.type)).toEqual(expect.arrayContaining(['feature_used', 'disengaged', 'condition_changed']));
    expect(pd.state.combatants.A?.conditions).toContain('Dodge');
    expect(A(pd.state).economy.disengaged).toBe(true);
    const sw = run(s, { type: 'focus_action', actorId: 'A', action: 'step-of-the-wind' });
    expect(sw.events.map((e) => e.type)).toEqual(expect.arrayContaining(['disengaged', 'dashed']));
    expect(A(sw.state).resources.focus).toBe(1);
  });
});

describe('Stunning Strike', () => {
  it('Monk silahı isabetinden sonra 1 Focus, CON save; başarısızsa Stunned (Monk\'un sonraki turunun başına dek); turda bir kez', () => {
    let s = battle(5, {}, { saves: { str: 0, dex: 0, con: -5, int: 0, wis: 0, cha: 0 } });
    expect(err(s, { type: 'stunning_strike', actorId: 'A', targetId: 'B' })).toContain('Önce bu tur');
    s = atk(s, 'Unarmed Strike').state;
    const r = run(s, { type: 'stunning_strike', actorId: 'A', targetId: 'B' }, pad([20, 3]));
    // DC 8 + WIS 2 + yetkinlik 3 = 13.
    expect(r.events.find((e) => e.type === 'save_resolved')).toMatchObject({ label: 'Stunning Strike', ability: 'con', dc: 13, success: false });
    expect(r.state.combatants.B?.conditions).toContain('Stunned');
    expect(A(r.state).resources.focus).toBe(4);
    expect(err(r.state, { type: 'stunning_strike', actorId: 'A', targetId: 'B' })).toContain('turda bir kez');
  });
  it('başarılı save: ona sonraki saldırı avantajlı; Monk silahı olmayan silahla açılmaz', () => {
    let s = battle(5, { weapons: [{ name: 'Quarterstaff' }, { name: 'Longsword' }] }, { saves: { str: 0, dex: 0, con: 10, int: 0, wis: 0, cha: 0 } });
    s = atk(s, 'Unarmed Strike').state;
    const r = run(s, { type: 'stunning_strike', actorId: 'A', targetId: 'B' }, pad([20, 15]));
    expect(r.state.combatants.B?.conditions).toContain('Help:party');
    const next = run(r.state, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(r.state, 'Unarmed Strike') }, pad([20, 3], [20, 15], [8, 4]));
    expect(next.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ mode: 'advantage' });
    const sword = battle(5, { weapons: [{ name: 'Longsword' }] });
    const hitLong = atk(sword, 'Longsword', pad([20, 15], [8, 4])).state;
    expect(err(hitLong, { type: 'stunning_strike', actorId: 'A', targetId: 'B' })).toContain('Monk silahı');
  });
});

describe('Uncanny Metabolism, Deflect Attacks, Slow Fall', () => {
  it('Uncanny Metabolism: Focus eksik ya da yaralıysa savaş başında doldurur ve Martial Arts zarı + seviye iyileştirir', () => {
    const full = mk(2);
    expect(metabolismEvents(full, pad())).toEqual([]);
    const hurt = { ...full, hp: 5, resources: { ...full.resources, focus: 0 } };
    const ev = metabolismEvents(hurt, pad([6, 4]));
    expect(ev).toEqual([
      { type: 'feature_used', actorId: 'a', feature: 'uncannyMetabolism', remaining: 0 },
      { type: 'feature_used', actorId: 'a', feature: 'focus', remaining: 2 },
      { type: 'healed', actorId: 'a', targetId: 'a', label: 'Uncanny Metabolism', amount: 6, targetHpAfter: 11 },
    ]);
  });
  it('Deflect Attacks: B/P/S isabette tepkiyle 1d10 + DEX + seviye azalır; tepki bir kez', () => {
    let s = battle(3, {}, { attacks: [{ name: 'Club', bonus: 10, damage: '2d6', damageDice: '2d6', damageType: 'bludgeoning', ranged: false, reachFt: 5 }] as never });
    s = advanceTo(run(s, { type: 'end_turn', actorId: 'A' }).state, 'B');
    const r = execute(s, { type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM, pad([20, 15], [6, 6], [6, 6], [10, 1]));
    if (!r.ok) throw new Error(r.error);
    // 12 hasar − (1 + DEX 3 + seviye 3 = 7) = 5.
    expect(r.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ rawDamage: 12, appliedDamage: 5, deflected: 7 });
    expect(A(r.state).economy.reaction).toBe(true);
    const fresh: BattleState = { ...r.state, combatants: { ...r.state.combatants, B: { ...(r.state.combatants.B as Combatant), economy: FRESH_ECONOMY } } };
    const again = execute(fresh, { type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM, pad([20, 15], [6, 6], [6, 6]));
    if (!again.ok) throw new Error(again.error);
    expect(again.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ appliedDamage: 12 });
  });
  it('Slow Fall: düşme hasarı 5 × seviye azalır', () => {
    const m = mk(4);
    expect(m.fallReduction).toBe(20);
    // Görev R1: Slow Fall artık tepki (`fallReactions` karar verir, tepki harcanır); azaltma düşme etkisine verilir.
    const ev = fallEffect(m, 40, pad([6, 6], [6, 6], [6, 6], [6, 6]), { reduce: 20, negate: false });
    expect(ev).toMatchObject({ damage: { raw: 4 } });
    expect(mk(3).fallReduction).toBeUndefined();
  });
});

describe('yapay zekâ (basit kurallar)', () => {
  it('saldırıdan sonra Flurry of Blows; Monk silahı isabetinde Stunning Strike (yüksek HP\'li hedef)', () => {
    let s = battle(5);
    s = atk(s, 'Unarmed Strike').state;
    expect(chooseCommand(s)).toMatchObject({ type: 'stunning_strike', targetId: 'B' });
    s = run(s, { type: 'stunning_strike', actorId: 'A', targetId: 'B' }, pad([20, 20])).state;
    s = atk(s, 'Unarmed Strike').state;
    expect(chooseCommand(s)).toMatchObject({ type: 'focus_action', action: 'flurry-of-blows' });
    s = run(s, { type: 'focus_action', actorId: 'A', action: 'flurry-of-blows' }).state;
    expect(chooseCommand(s)).toMatchObject({ type: 'bonus_strike', targetId: 'B' });
  });
});

describe('kayıt', () => {
  it('olaylar yeniden uygulanınca aynı durum', () => {
    const s = battle(5);
    const a = atk(s, 'Unarmed Strike');
    const b = run(a.state, { type: 'focus_action', actorId: 'A', action: 'flurry-of-blows' });
    const c = run(b.state, { type: 'bonus_strike', actorId: 'A', targetId: 'B' }, pad([20, 15], [8, 4], [20, 2]));
    expect(applyEvents(applyEvents(applyEvents(s, a.events), b.events), c.events)).toEqual(c.state);
  });
});
