/** Görev E: yakalama (Grappled), yere düşme (Prone) ve ayağa kalkma, hücum, süreli hasar, üretilen rider durumları. */
import { describe, it, expect } from 'vitest';
import { combatantFromMonster, execute, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './index';
import { getMonster } from '../data';
import type { Rng } from '../rules/dice';
import type { Offset } from '../rules/hex';
import { GM, P1, envId, mk, scripted, sword } from './fixtures';
import { FRESH_ECONOMY } from './types';
import { grappleCleanup, standUpCost } from './grapple';
import { chooseCommand } from './ai';
import { riderOf } from './riders';
import { describeEvent } from '../ui/log';

const o = (col: number, row: number): Offset => ({ col, row });
const monster = (id: string, cid: string, p: Partial<Combatant> = {}): Combatant => ({ ...combatantFromMonster(getMonster(id), { id: cid }), ...p });
const hero = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', ac: 10, hp: 60, maxHp: 60, weaponOptions: [sword], ...p });
/** Haritalı savaş (boş Çöl zemini); sıra listedeki sırayla. */
function field(parts: Combatant[], positions: Record<string, Offset>): BattleState {
  const { state } = startBattle('g', 'd-z-zemin', parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map: { id: 'col' } });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  const tiles = Array.from({ length: 7 }, () => '.'.repeat(15));
  return { ...state, status: 'active', combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles } };
}
/** Haritasız savaş. */
function arena(parts: Combatant[]): BattleState {
  return startBattle('g', envId('Düz'), parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number]))).state;
}
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const run = (s: BattleState, cmd: Command, ctx: CommandContext, rng: Rng = scripted()) => ok(execute(s, cmd, ctx, rng));
const hit = (s: BattleState, id: string, name: string, rng: Rng) => {
  const i = s.combatants[id]?.attacks.findIndex((a) => a.name === name) ?? -1;
  return run(s, { type: 'monster_attack', actorId: id, targetId: 'A', attackIndex: i }, GM, rng);
};
const ofType = <T extends BattleEvent['type']>(events: BattleEvent[], t: T) => events.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === t);
const endTurn = (s: BattleState, id: string, ctx: CommandContext) => run(s, { type: 'end_turn', actorId: id }, ctx);

describe('yakalama (Grappled)', () => {
  it('Bugbear Grab: Medium hedef yakalanır (DC 12), hızı 0; Large hedef yakalanmaz', () => {
    const s = field([monster('bugbear-warrior', 'B'), hero()], { B: o(5, 3), A: o(5, 2) });
    const r = hit(s, 'B', 'Grab', scripted([20, 15], [6, 3], [6, 3]));
    expect(ofType(r.events, 'grappled')[0]).toMatchObject({ targetId: 'A', by: 'B', escapeDc: 12, restrained: false });
    expect(r.state.combatants.A?.conditions).toContain('Grappled');
    expect(describeEvent(ofType(r.events, 'grappled')[0] as BattleEvent, r.state)).toContain('kaçış DC 12');
    const big = field([monster('bugbear-warrior', 'B'), hero({ size: 'L' })], { B: o(5, 3), A: o(5, 2) });
    expect(ofType(hit(big, 'B', 'Grab', scripted([20, 15], [6, 3], [6, 3])).events, 'grappled')).toEqual([]);
    // Yakalanan yürüyemez.
    const mine = endTurn(r.state, 'B', GM).state;
    expect(execute(mine, { type: 'move', actorId: 'A', to: o(6, 1) }, P1, scripted()).ok).toBe(false);
  });
  it('kaçış: eylem; d20 + Athletics/Acrobatics (yüksek olan) ≥ DC ise kurtulur', () => {
    const s0 = field([monster('bugbear-warrior', 'B'), hero({ skills: { acrobatics: 3 } })], { B: o(5, 3), A: o(5, 2) });
    const s = endTurn(hit(s0, 'B', 'Grab', scripted([20, 15], [6, 3], [6, 3])).state, 'B', GM).state;
    const fail = run(s, { type: 'escape_grapple', actorId: 'A' }, P1, scripted([20, 8]));
    expect(ofType(fail.events, 'grapple_escape')[0]).toMatchObject({ skill: 'acrobatics', total: 11, dc: 12, success: false });
    expect(fail.state.combatants.A?.conditions).toContain('Grappled');
    expect(fail.state.combatants.A?.economy.action).toBe(true);
    expect(execute(fail.state, { type: 'escape_grapple', actorId: 'A' }, P1, scripted([20, 20])).ok).toBe(false);
    const win = run(s, { type: 'escape_grapple', actorId: 'A' }, P1, scripted([20, 9]));
    expect(ofType(win.events, 'grapple_ended')[0]).toMatchObject({ targetId: 'A', reason: 'kaçtı' });
    expect(win.state.combatants.A?.conditions).not.toContain('Grappled');
    expect(win.state.combatants.A?.grapple).toBeUndefined();
  });
  it('yakalayan düşer, uyur ya da etkisiz kalırsa ya da araya mesafe girerse yakalama biter', () => {
    const s = hit(field([monster('bugbear-warrior', 'B'), hero()], { B: o(5, 3), A: o(5, 2) }), 'B', 'Grab', scripted([20, 15], [6, 3], [6, 3])).state;
    const B = s.combatants.B as Combatant;
    const withB = (p: Partial<Combatant>) => ({ ...s, combatants: { ...s.combatants, B: { ...B, ...p } } });
    expect(grappleCleanup(s)).toEqual([]);
    expect(grappleCleanup(withB({ hp: 0, life: 'dead' }))[0]).toMatchObject({ reason: 'yakalayan düştü' });
    expect(grappleCleanup(withB({ asleep: true }))[0]).toMatchObject({ reason: 'yakalayan uyuyor' });
    expect(grappleCleanup(withB({ conditions: ['Stunned'] }))[0]).toMatchObject({ reason: 'yakalayan etkisiz' });
    expect(grappleCleanup(withB({ pos: o(9, 3) }))[0]).toMatchObject({ reason: 'aralarında mesafe açıldı' });
  });
  it('yakalayan yürürse hedefi sürükler; her adımı iki kat hareket harcar', () => {
    const s = hit(field([monster('bugbear-warrior', 'B'), hero()], { B: o(5, 3), A: o(5, 2) }), 'B', 'Grab', scripted([20, 15], [6, 3], [6, 3])).state;
    const r = run(s, { type: 'move', actorId: 'B', to: o(5, 5) }, GM);
    expect(r.state.combatants.B).toMatchObject({ pos: o(5, 5), movementUsed: 4 });
    expect(r.state.combatants.A?.pos).toEqual(o(5, 4));
    expect(r.state.combatants.A?.conditions).toContain('Grappled');
  });
  it('kavrama sürerken Restrained (Couatl Constrict, STR save başarısızsa); bitince ikisi de kalkar', () => {
    const s = arena([monster('couatl', 'C'), hero()]);
    const r = hit(s, 'C', 'Constrict', scripted([20, 3], [6, 3]));
    expect(r.state.combatants.A?.conditions).toEqual(expect.arrayContaining(['Grappled', 'Restrained']));
    const freed = run(endTurn(r.state, 'C', GM).state, { type: 'escape_grapple', actorId: 'A' }, P1, scripted([20, 20]));
    expect(freed.state.combatants.A?.conditions).not.toContain('Restrained');
    expect(riderOf('crocodile', 'Bite')?.grapple).toMatchObject({ escapeDc: 12, restrained: true, maxSize: 'M' });
  });
  it('yapay zekâ: yakalanan önce kaçmayı dener; yakalayan önce yakaladığına vurur', () => {
    // X daha yaralı, ama yakalayan önce yakaladığı A'ya vurur (sonraki turunda, eylemi tazeyken).
    const s = hit(field([monster('bugbear-warrior', 'B'), hero(), mk('X', { ownerId: 'p1', hp: 5, maxHp: 50 })], { B: o(5, 3), A: o(5, 2), X: o(4, 3) }),
      'B', 'Grab', scripted([20, 15], [6, 3], [6, 3])).state;
    const fresh = { ...s, combatants: { ...s.combatants, B: { ...(s.combatants.B as Combatant), economy: FRESH_ECONOMY } } };
    expect(chooseCommand(fresh)).toMatchObject({ actorId: 'B', targetId: 'A' });
    const mine = endTurn(s, 'B', GM).state;
    expect(chooseCommand(mine)).toEqual({ type: 'escape_grapple', actorId: 'A' });
  });
});

describe('yere düşme (Prone) ve ayağa kalkma', () => {
  it('Wolf Bite: Medium hedef Prone; Large hedef düşmez', () => {
    const s = arena([monster('wolf', 'W'), hero()]);
    expect(hit(s, 'W', 'Bite', scripted([20, 15])).state.combatants.A?.conditions).toContain('Prone');
    expect(hit(arena([monster('wolf', 'W'), hero({ size: 'L' })]), 'W', 'Bite', scripted([20, 15])).state.combatants.A?.conditions).not.toContain('Prone');
  });
  it('kalkmak hızın yarısını harcar; yürürken kendiliğinden kalkar; yerdeyken yakın saldırı avantajlı', () => {
    const s = field([monster('wolf', 'W'), hero()], { W: o(5, 3), A: o(5, 2) });
    const down = endTurn(hit(s, 'W', 'Bite', scripted([20, 15])).state, 'W', GM).state;
    expect(standUpCost(down.combatants.A as Combatant)).toBe(3);
    const up = run(down, { type: 'stand_up', actorId: 'A' }, P1);
    expect(up.state.combatants.A).toMatchObject({ movementUsed: 3, conditions: [] });
    expect(execute(up.state, { type: 'stand_up', actorId: 'A' }, P1, scripted()).ok).toBe(false);
    const walk = run(down, { type: 'move', actorId: 'A', to: o(4, 1) }, P1);
    expect(walk.events.map((e) => e.type).slice(0, 2)).toEqual(['stood_up', 'moved']);
    const moved = ofType(walk.events, 'moved')[0];
    expect(walk.state.combatants.A).toMatchObject({ pos: o(4, 1), movementUsed: 3 + (moved?.cost ?? 0), conditions: [] });
    // Kurt yerdeki kahramana avantajlı saldırır.
    const p0 = hit(s, 'W', 'Bite', scripted([20, 15])).state;
    const prone = { ...p0, combatants: { ...p0.combatants, W: { ...(p0.combatants.W as Combatant), economy: FRESH_ECONOMY } } };
    const again = hit(prone, 'W', 'Bite', scripted([20, 2], [20, 15]));
    expect(ofType(again.events, 'attack_resolved')[0]?.mode).toBe('advantage');
  });
  it('yapay zekâ: yerdeyse (hareketi yetiyorsa) önce kalkar', () => {
    const s = field([hero({ conditions: ['Prone'], initiativeBonus: 10 }), monster('wolf', 'W')], { A: o(5, 2), W: o(5, 3) });
    expect(chooseCommand(s)).toEqual({ type: 'stand_up', actorId: 'A' });
  });
});

describe('hücum (charge)', () => {
  it('Boar Gore: 20+ ft düz koşup vurursa +1d6 ve Prone; koşmadan yalnızca normal hasar', () => {
    const s = field([monster('boar', 'P'), hero()], { P: o(5, 6), A: o(5, 1) });
    const moved = run(s, { type: 'move', actorId: 'P', to: o(5, 2) }, GM).state;
    expect(moved.combatants.P?.run?.hexes).toBe(4);
    const r = hit(moved, 'P', 'Gore', scripted([20, 15], [6, 3], [6, 3]));
    const atk = ofType(r.events, 'attack_resolved')[0];
    expect(atk?.extra?.[0]).toMatchObject({ raw: 3, type: 'piercing' });
    expect(r.state.combatants.A?.conditions).toContain('Prone');
    const still = field([monster('boar', 'P'), hero()], { P: o(5, 2), A: o(5, 1) });
    const plain = hit(still, 'P', 'Gore', scripted([20, 15], [6, 3]));
    expect(ofType(plain.events, 'attack_resolved')[0]?.extra).toBeUndefined();
    expect(plain.state.combatants.A?.conditions).not.toContain('Prone');
  });
});

describe('süreli hasar ve üretilen süreli durumlar', () => {
  it('Bearded Devil Infernal Glaive: CON DC 12 başarısızsa Infernal Wound; hedefin her tur başında 1d10', () => {
    const s = arena([monster('bearded-devil', 'D'), hero()]);
    const r = hit(s, 'D', 'Infernal Glaive', scripted([20, 15], [10, 5], [20, 3]));
    expect(r.state.combatants.A?.conditionTimers?.[0]).toMatchObject({ condition: 'Infernal Wound', dot: { dice: '1d10' } });
    const hp = r.state.combatants.A?.hp ?? 0;
    const next = run(r.state, { type: 'end_turn', actorId: 'D' }, GM, scripted([10, 7]));
    const dot = next.events.find((e) => e.type === 'map_effect' && e.rule === 'condition');
    expect(dot).toMatchObject({ targetId: 'A' });
    expect(next.state.combatants.A?.hp).toBe(hp - 7);
  });
  it('Assassin Shortsword: +5d6 zehir ve Poisoned, suikastçının sonraki turunun başına dek (üretilen)', () => {
    const s = arena([monster('assassin', 'S'), hero()]);
    const r = hit(s, 'S', 'Shortsword', scripted([20, 15]));
    expect(r.state.combatants.A?.conditions).toContain('Poisoned');
    expect(r.state.combatants.A?.conditionTimers?.[0]).toMatchObject({ condition: 'Poisoned', ownerId: 'S', end: 'turnStart' });
    expect(ofType(r.events, 'attack_resolved')[0]?.extra?.[0]).toMatchObject({ type: 'poison' });
  });
});
