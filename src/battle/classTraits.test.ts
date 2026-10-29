/**
 * Görev F: Fighter (Champion), Rogue (Thief) ve Ranger (Hunter) özellik kancaları (SRD 5.2.1): kritik aralığı, Studied
 * Attacks, Remarkable Athlete, Survivor, Indomitable, Tactical Mind/Shift, Steady Aim, Cunning Strike, Evasion, Reliable
 * Talent, Elusive, Stroke of Luck, Hunter seçenekleri, Precise Hunter, Foe Slayer, herkesin 1 + STR silahsız vuruşu.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet } from './create';
import { applyEvents } from './reduce';
import { advanceTo, P1, scripted, setup, sword } from './fixtures';
import { afterAttackMarks, cunningOptions, cunningProblem, elusiveFilter, hordeProblem, markDie, saveDamage, traitSources } from './classTraits';
import { finishCheck, saveDice } from './effectDice';
import { resolveSave } from '../rules/attack';
import { parseDice, rollDice } from '../rules/dice';
import { classKit, missingFeatures } from '../rules/classFeatures';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const base = { armorName: 'Zırhsız', shield: false, itemNames: [] as string[], backgroundBonuses: { dex: 2, con: 1 } };
const fighter = (level: number, p: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...base, name: 'Bor', raceId: 'human', classId: 'fighter', level, armorName: 'Chain Mail',
  baseScores: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 }, weapons: [{ name: 'Longsword' }],
  ...(level >= 3 ? { subclassId: 'champion' } : {}), ...p,
});
const rogue = (level: number, p: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...base, name: 'Sela', raceId: 'human', classId: 'rogue', level, armorName: 'Leather Armor',
  baseScores: { str: 8, dex: 15, con: 14, int: 10, wis: 12, cha: 13 }, weapons: [{ name: 'Rapier' }],
  ...(level >= 3 ? { subclassId: 'thief' } : {}), ...p,
});
const ranger = (level: number, p: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...base, name: 'Kael', raceId: 'human', classId: 'ranger', level, armorName: 'Leather Armor',
  baseScores: { str: 10, dex: 15, con: 14, int: 8, wis: 13, cha: 12 }, weapons: [{ name: 'Longbow' }, { name: 'Shortsword' }],
  ...(level >= 3 ? { subclassId: 'hunter' } : {}), ...p,
});
const mk = (s: CharacterSheet) => combatantFromSheet(s, { id: 'a', ownerId: 'p' });

/** A karakter (sıra A'da), B düşman (haritasız, bitişik sayılır). */
function battle(sheet: CharacterSheet, b: Partial<Combatant> = {}, a: Partial<Combatant> = {}): BattleState {
  const m = combatantFromSheet(sheet, { id: 'A', ownerId: 'p1' });
  const { id: _i, name: _n, ownerId: _o, initiativeBonus: _b, ...fields } = m;
  return advanceTo(setup('Düz', { A: { ...fields, ...a } as Partial<Combatant>, B: { hp: 80, maxHp: 80, ac: 10, ...b } }), 'A');
}
const pad = (...xs: Array<[number, number]>) => scripted(...xs, ...Array.from({ length: 30 }, () => [20, 10] as [number, number]));
const run = (s: BattleState, cmd: Command, rng = pad()) => {
  const r = execute(s, cmd, P1, rng);
  if (!r.ok) throw new Error(r.error);
  return r;
};
const err = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, pad()); return r.ok ? null : r.error; };
const A = (s: BattleState) => s.combatants.A as Combatant;
const B = (s: BattleState) => s.combatants.B as Combatant;
const opt = (s: BattleState, label: string) => {
  const o = A(s).weaponOptions.find((x) => x.label === label);
  if (!o) throw new Error(`seçenek yok: ${label}`);
  return o;
};
const resolved = (r: { events: Array<{ type: string }> }) => r.events.filter((e) => e.type === 'attack_resolved') as Array<Record<string, unknown>>;

describe('sınıf kitleri: özellik işaretleri veriden', () => {
  it('Fighter/Champion: kritik 19 (3), Remarkable Athlete, Survivor (18), Indomitable (9), Tactical Mind (2), Studied Attacks (13)', () => {
    expect(mk(fighter(2)).traits).toContain('tactical-mind');
    expect(mk(fighter(3)).critOn).toBe(19);
    expect(mk(fighter(3)).traits).toContain('remarkable-athlete');
    expect(mk(fighter(5)).traits).toContain('tactical-shift');
    expect(mk(fighter(9)).resources.indomitable).toBe(1);
    expect(mk(fighter(13)).traits).toContain('studied-attacks');
    expect(mk(fighter(15)).critOn).toBe(18);
    expect(mk(fighter(18)).traits).toContain('survivor');
  });
  it('Rogue/Thief: Steady Aim (3), Cunning Strike (5), Evasion (7), Reliable Talent (7), Slippery Mind (15: WIS ve CHA save yetkinliği), Elusive, Stroke of Luck', () => {
    expect(mk(rogue(3)).traits).toEqual(expect.arrayContaining(['steady-aim', 'climber']));
    expect(mk(rogue(5)).traits).toContain('cunning-strike');
    expect(mk(rogue(7)).traits).toEqual(expect.arrayContaining(['evasion', 'reliable-talent']));
    const r15 = mk(rogue(15));
    expect(r15.saves.wis).toBe(r15.modifiers.wis + r15.proficiency);
    expect(r15.saves.cha).toBe(r15.modifiers.cha + r15.proficiency);
    expect(mk(rogue(18)).traits).toContain('elusive');
    expect(mk(rogue(20)).resources.strokeOfLuck).toBe(1);
  });
  it('Ranger/Hunter: Hunter\'s Prey seçimi (varsayılan Colossus Slayer), Defensive Tactics, Precise Hunter, Feral Senses, Foe Slayer', () => {
    expect(mk(ranger(3)).traits).toContain('colossus-slayer');
    expect(mk(ranger(3, { featureChoices: { 'ranger/hunter:hunters-prey': 'horde-breaker' } })).traits).toContain('horde-breaker');
    expect(mk(ranger(7)).traits).toContain('escape-the-horde');
    expect(mk(ranger(17)).traits).toContain('precise-hunter');
    expect(mk(ranger(18)).traits).toContain('feral-senses');
    expect(mk(ranger(20)).traits).toContain('foe-slayer');
    expect(mk(ranger(10)).resources.tireless).toBeGreaterThan(0);
    expect(mk(ranger(14)).resources.naturesVeil).toBeGreaterThan(0);
  });
  it('1–5 eksiksiz (alt sınıflı)', () => {
    expect(missingFeatures('fighter', 5, 'champion')).toEqual([]);
    expect(missingFeatures('rogue', 5, 'thief')).toEqual([]);
    expect(missingFeatures('ranger', 5, 'hunter')).toEqual([]);
    expect(classKit('fighter', 1).traits ?? []).not.toContain('tactical-mind');
  });
});

describe('herkesin silahsız vuruşu ve sabit zar', () => {
  it('Unarmed Strike: 1 + STR (en az 0), STR + yetkinlik isabet', () => {
    const f = mk(fighter(1));
    expect(f.weaponOptions.find((o) => o.label === 'Unarmed Strike')).toMatchObject({ damage: '3', attackBonus: 4, weaponId: 'unarmed-strike' });
    const r = mk(rogue(1));
    expect(r.weaponOptions.find((o) => o.label === 'Unarmed Strike')?.damage).toBe('0');
  });
  it('sabit zar ifadesi zar atmaz', () => {
    expect(parseDice('4')).toMatchObject({ count: 0, bonus: 4 });
    expect(rollDice('3', scripted()).total).toBe(3);
  });
});

describe('Champion', () => {
  it('Improved Critical: doğal 19 kritik (yalnızca silah)', () => {
    const s = battle(fighter(3), { ac: 30 });
    const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Longsword') }, pad([20, 19]));
    expect(resolved(r)[0]).toMatchObject({ hit: true, critical: true });
  });
  it('Survivor: Bloodied iken tur başında 5 + CON HP', () => {
    const s = battle(fighter(18));
    const hurt: BattleState = { ...s, combatants: { ...s.combatants, A: { ...A(s), hp: 10 } } };
    // Sıra A'dan B'ye, C'ye, yeniden A'ya.
    let t = hurt;
    for (let i = 0; i < 3; i++) {
      const id = t.order[t.turnIndex] as string;
      const c = t.combatants[id] as Combatant;
      const ctx = c.side === 'enemies' ? { playerId: 'gm', isGm: true } : { playerId: c.ownerId, isGm: false };
      const r = execute(t, { type: 'end_turn', actorId: id }, ctx, pad());
      if (!r.ok) throw new Error(r.error);
      t = r.state;
      if (t.order[t.turnIndex] === 'A') {
        expect(r.events).toContainEqual(expect.objectContaining({ type: 'healed', targetId: 'A', label: 'Survivor', amount: 5 + A(s).modifiers.con }));
        break;
      }
    }
    expect(A(t).hp).toBe(10 + 5 + A(s).modifiers.con);
  });
});

describe('Fighter: Studied Attacks, Indomitable, Tactical Mind, Tactical Shift', () => {
  it('Studied Attacks: ıskalayınca o hedefe sonraki saldırı avantajlı ve işaret harcanır', () => {
    const s = battle(fighter(13), { ac: 30 });
    const miss = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Longsword') }, pad([20, 2]));
    expect(miss.events.some((e) => e.type === 'mark_added')).toBe(true);
    const next = run(miss.state, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Longsword') }, pad([20, 3], [20, 15]));
    expect(resolved(next)[0]?.mode).toBe('advantage');
    expect(next.events).toContainEqual(expect.objectContaining({ type: 'mastery_mark_used', kind: 'studied', targetId: 'B' }));
  });
  it('Indomitable: başarısız save yeniden atılır, + Fighter seviyesi, kaynak harcanır', () => {
    const f = mk(fighter(9));
    const r = resolveSave({ extra: saveDice(f), modifier: 0, dc: 15, mode: 'normal' }, scripted([20, 2], [20, 8]));
    expect(r.success).toBe(true);
    expect(r.total).toBe(8 + 9);
    expect(r.extra?.[0]).toMatchObject({ label: 'Indomitable', resource: 'indomitable' });
    expect(saveDice({ ...f, resources: { ...f.resources, indomitable: 0 } })).toEqual([]);
  });
  it('Tactical Mind: başarısız kontrole 1d10; tutarsa Second Wind harcanır, tutmazsa harcanmaz', () => {
    const f = mk(fighter(2));
    const ok = finishCheck(f, 'athletics', 5, 0, 10, 'normal', scripted([10, 6]));
    expect(ok.total).toBe(11);
    expect(ok.extra[0]).toMatchObject({ label: 'Tactical Mind', resource: 'secondWind' });
    const no = finishCheck(f, 'athletics', 2, 0, 15, 'normal', scripted([10, 3]));
    expect(no.extra[0]?.resource).toBeUndefined();
  });
  it('Tactical Shift: Second Wind ile fırsat saldırısı almadan hareket', () => {
    const s = battle(fighter(5));
    const r = run(s, { type: 'second_wind', actorId: 'A' } as Command, pad([10, 5]));
    expect(r.events.some((e) => e.type === 'disengaged')).toBe(true);
  });
  it('Remarkable Athlete: Athletics kontrolü avantajlı (kit işareti)', () => {
    expect(mk(fighter(3)).traits).toContain('remarkable-athlete');
  });
});

describe('Rogue: Steady Aim ve Cunning Strike', () => {
  it('Steady Aim: bonus eylem, hareket etmemişken; sonraki saldırı avantajlı ve bu tur hareket yok', () => {
    const s = battle(rogue(3));
    const r = run(s, { type: 'steady_aim', actorId: 'A' });
    expect(A(r.state).economy.bonus).toBe(true);
    expect(err(r.state, { type: 'steady_aim', actorId: 'A' })).toBeTruthy();
    const atk = run(r.state, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Rapier') }, pad([20, 3], [20, 15]));
    expect(resolved(atk)[0]?.mode).toBe('advantage');
    const moved: BattleState = { ...s, combatants: { ...s.combatants, A: { ...A(s), movementUsed: 5 } } };
    expect(err(moved, { type: 'steady_aim', actorId: 'A' })).toMatch(/hareket/);
    expect(err(battle(rogue(2)), { type: 'steady_aim', actorId: 'A' })).toBeTruthy();
  });
  it('seçenekler seviyeye göre: 5 Trip/Withdraw, 14 Devious, 11 Improved (2 seçenek)', () => {
    expect(cunningOptions(mk(rogue(5)))).toEqual({ options: ['trip', 'withdraw'], max: 1 });
    expect(cunningOptions(mk(rogue(11))).max).toBe(2);
    expect(cunningOptions(mk(rogue(14))).options).toEqual(['trip', 'withdraw', 'daze', 'knock-out', 'obscure']);
    expect(cunningProblem(mk(rogue(5)), ['daze'])).toBeTruthy();
    expect(cunningProblem(mk(rogue(5)), ['trip', 'withdraw'])).toBeTruthy();
    expect(cunningProblem(mk(rogue(14)), ['knock-out'])).toBeNull();
    expect(cunningProblem(mk(rogue(4)), ['trip'])).toBeTruthy();
  });
  it('Trip: Sneak Attack zarı bir eksik; DEX save başarısızsa Prone', () => {
    const s = run(battle(rogue(5)), { type: 'steady_aim', actorId: 'A' }).state;
    const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Rapier'), cunning: ['trip'] }, pad([20, 15], [20, 15], [8, 4], [6, 3], [6, 3], [20, 2]));
    const a = resolved(r)[0] as { extra?: Array<{ label: string; rolls: number[] }>; cunning?: unknown };
    expect(a.extra?.find((x) => x.label === 'Sneak Attack')?.rolls).toHaveLength(2);
    expect(a.cunning).toEqual({ options: ['trip'], dice: 1 });
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'condition_save', condition: 'Prone', ability: 'dex', success: false }));
    expect(B(r.state).conditions).toContain('Prone');
  });
  it('Withdraw: bu tur fırsat saldırısı tetiklemez', () => {
    const s = run(battle(rogue(5)), { type: 'steady_aim', actorId: 'A' }).state;
    const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Rapier'), cunning: ['withdraw'] }, pad([20, 15], [20, 15]));
    expect(r.events.some((e) => e.type === 'disengaged')).toBe(true);
  });
  it('Sneak Attack yoksa Cunning Strike etkisiz (ıskalama)', () => {
    const s = battle(rogue(5), { ac: 30 });
    const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Rapier'), cunning: ['trip'] }, pad([20, 2]));
    expect(r.events.some((e) => e.type === 'condition_save')).toBe(false);
  });
});

describe('Rogue: savunma özellikleri', () => {
  it('Evasion: DEX save yarım hasarlı etkide başarı 0, başarısızlık yarım; Incapacitated iken yok', () => {
    const r = mk(rogue(7));
    expect(saveDamage(r, 'dex', true, 20, true)).toBe(0);
    expect(saveDamage(r, 'dex', false, 20, true)).toBe(10);
    expect(saveDamage(r, 'con', false, 20, true)).toBe(20);
    expect(saveDamage({ ...r, conditions: ['Stunned'] }, 'dex', true, 20, true)).toBe(10);
    expect(saveDamage(mk(rogue(6)), 'dex', true, 20, true)).toBe(10);
  });
  it('Reliable Talent: yetkin beceride 9 ve altı d20 10 sayılır', () => {
    const r = { ...mk(rogue(7)), skills: { stealth: 7 } };
    expect(finishCheck(r, 'stealth', 3, 0, null, 'normal', scripted()).natural).toBe(10);
    expect(finishCheck(r, 'athletics', 3, 0, null, 'normal', scripted()).natural).toBe(3);
    expect(finishCheck({ ...mk(rogue(6)), skills: { stealth: 7 } }, 'stealth', 3, 0, null, 'normal', scripted()).natural).toBe(3);
  });
  it('Elusive: ona yapılan saldırıda avantaj kaynakları düşer (Incapacitated değilken)', () => {
    const r = mk(rogue(18));
    const src = [{ effect: 'advantage' as const, reason: 'x' }, { effect: 'disadvantage' as const, reason: 'y' }];
    expect(elusiveFilter(r, src)).toEqual([src[1]]);
    expect(elusiveFilter({ ...r, conditions: ['Stunned'] }, src)).toEqual(src);
  });
  it('Stroke of Luck: başarısız D20 Testi 20 olur, kaynak harcanır', () => {
    const r = mk(rogue(20));
    const out = resolveSave({ extra: saveDice(r), modifier: 0, dc: 18, mode: 'normal' }, scripted([20, 3]));
    expect(out.success).toBe(true);
    expect(out.extra?.[0]).toMatchObject({ label: 'Stroke of Luck', die: '20', resource: 'strokeOfLuck' });
  });
});

describe('Hunter ve yüksek seviye Ranger', () => {
  it('Colossus Slayer: HP\'si eksik hedefe +1d8, turda bir kez', () => {
    const s = battle(ranger(3), { hp: 50 });
    const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Shortsword') }, pad([20, 15], [6, 3], [8, 5]));
    const a = resolved(r)[0] as { extra?: Array<{ label: string }> };
    expect(a.extra?.map((x) => x.label)).toContain('Colossus Slayer');
    const full = battle(ranger(3));
    const r2 = run(full, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(full, 'Shortsword') }, pad([20, 15]));
    expect((resolved(r2)[0] as { extra?: Array<{ label: string }> }).extra?.map((x) => x.label) ?? []).not.toContain('Colossus Slayer');
  });
  it('Horde Breaker: önce bir saldırı gerekir, aynı hedefe olmaz, turda bir kez', () => {
    const sheet = ranger(3, { featureChoices: { 'ranger/hunter:hunters-prey': 'horde-breaker' } });
    const s = battle(sheet);
    expect(hordeProblem(s, A(s), s.combatants.C as Combatant)).toMatch(/Önce/);
    const first = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Shortsword') }, pad([20, 15]));
    expect(A(first.state).economy.lastTargetId).toBe('B');
    expect(hordeProblem(first.state, A(first.state), B(first.state))).toBeTruthy();
    const withD: BattleState = { ...first.state, combatants: { ...first.state.combatants, D: { ...B(first.state), id: 'D', name: 'D', hp: 20, maxHp: 20 } } };
    expect(hordeProblem(withD, A(withD), withD.combatants.D as Combatant)).toBeNull();
    const hb = run(withD, { type: 'horde_breaker', actorId: 'A', targetId: 'D', option: opt(s, 'Shortsword') }, pad([20, 15]));
    expect(resolved(hb)).toHaveLength(1);
    expect(err(hb.state, { type: 'horde_breaker', actorId: 'A', targetId: 'D', option: opt(s, 'Shortsword') })).toBeTruthy();
  });
  it('Escape the Horde: ona fırsat saldırısı dezavantajlı; Multiattack Defense: vurana bu tur dezavantaj', () => {
    const r = mk(ranger(7));
    const s = battle(ranger(7));
    expect(traitSources(s, B(s), { ...r, id: 'A' }, { opportunity: true })).toEqual([{ effect: 'disadvantage', reason: 'Escape the Horde' }]);
    expect(traitSources(s, B(s), { ...r, id: 'A' })).toEqual([]);
    const md = { ...mk(ranger(7, { featureChoices: { 'ranger/hunter:defensive-tactics': 'multiattack-defense' } })), id: 'A' };
    expect(afterAttackMarks(s, B(s), md, true)).toEqual([expect.objectContaining({ type: 'mark_added', holderId: 'A', mark: expect.objectContaining({ kind: 'mdefense', targetId: 'B' }) })]);
    expect(afterAttackMarks(s, B(s), md, false)).toEqual([]);
  });
  it('Foe Slayer: Hunter\'s Mark zarı d10', () => {
    expect(markDie(mk(ranger(20)), '1d6')).toBe('1d10');
    expect(markDie(mk(ranger(19)), '1d6')).toBe('1d6');
  });
  it('Precise Hunter: kendi Hunter\'s Mark hedefine avantaj', () => {
    const s = battle(ranger(17), {}, { concentration: { spell: "Hunter's Mark", targetId: 'B' } as Combatant['concentration'] });
    expect(traitSources(s, A(s), B(s))).toEqual([{ effect: 'advantage', reason: 'Precise Hunter' }]);
  });
});

describe('replay', () => {
  it('Cunning Strike, Steady Aim ve Studied Attacks olayları yeniden uygulanınca aynı durum', () => {
    let s = battle(rogue(5));
    const start = s;
    const all: BattleEvent[] = [];
    for (const [cmd, rng] of [
      [{ type: 'steady_aim', actorId: 'A' }, pad()],
      [{ type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Rapier'), cunning: ['trip'] }, pad([20, 15], [20, 15], [8, 4], [6, 3], [6, 3], [20, 2])],
    ] as Array<[Command, ReturnType<typeof pad>]>) {
      const r = run(s, cmd, rng);
      all.push(...r.events);
      s = r.state;
    }
    expect(applyEvents(start, all)).toEqual(s);
  });
});
