/**
 * Görev WS92 (kural sürümü 92): Swallow (SRD 5.2.1 Giant Frog s. 351, Giant Toad s. 354): yutulan midede (konum
 * yutanınki, hücre kaplamaz, Total Cover), yakalama biter, yutan Bite'ı kullanamaz, Giant Toad tek yutulan, yutan ölünce
 * cesetten 5 ft ile Prone çıkış, kusulunca/biçim bitince bitişiğe Prone; 91 eski davranış; replay.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster, combatantFromSheet, setDefaultRuleVersion, startBattle } from './create';
import { applyEvents, replay } from './reduce';
import { GM, P1, mk, sword } from './fixtures';
import { getMonster } from '../data';
import { monsterAfterEvents, monsterTurnEvents } from './monsterAbilities';
import { occupantAt } from './movement';
import { isTargetable } from './common';
import { lineOfFire } from './cover';
import { WS92_VERSION, ws92On } from './ws92Surum';
import { CURRENT_RULES } from './ruleVersion';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { distance, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const NEW = WS92_VERSION;
const OLD = WS92_VERSION - 1;
const o = (col: number, row: number): Offset => ({ col, row });
const MID: Rng = () => 0.5;
const flat = () => Array.from({ length: 7 }, () => '.'.repeat(15));
const held = (by = 'X', size: Combatant['size'] = 'S'): Partial<Combatant> => ({ size, conditions: ['Grappled'], grapple: { by, escapeDc: 11, restrained: false } });

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

/** Canavar X (7,3), oyuncular A (6,3) ve B (8,3); sıra X, A, B. */
function arena(monId: string, v: number, a: Partial<Combatant> = {}, b: Partial<Combatant> = {}): BattleState {
  const m = { ...combatantFromMonster(getMonster(monId), { id: 'X', kuralSurumu: CURRENT_RULES }), side: 'enemies' as const };
  const parts = [m, mk('A', { ownerId: 'p1', hp: 60, maxHp: 60, weaponOptions: [sword] }), mk('B', { ownerId: 'p1', hp: 60, maxHp: 60, weaponOptions: [sword] })];
  const { state } = startBattle('ws92', 'd-z-zemin', parts, MID, { kuralSurumu: v, map: { id: 'col' } });
  const c = { ...state.combatants };
  c.X = { ...(c.X as Combatant), pos: o(7, 3) };
  c.A = { ...(c.A as Combatant), pos: o(6, 3), ...a };
  c.B = { ...(c.B as Combatant), pos: o(8, 3), ...b };
  return { ...state, status: 'active', round: 1, order: ['X', 'A', 'B'], turnIndex: 0, combatants: c, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: flat() } };
}
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const swallow = (s: BattleState) => ok(execute(s, { type: 'monster_ability', actorId: 'X', abilityId: 'swallow' }, GM, MID));
const replays = (s0: BattleState, evs: BattleEvent[], after: BattleState) => expect(replay([{ type: 'battle_started', state: s0 }, ...evs])).toEqual(after);
const turnOf = (s: BattleState, id: string): BattleState => ({ ...s, turnIndex: s.order.indexOf(id) });

describe('WS92: sabit', () => {
  it('sürüm 92', () => {
    expect(WS92_VERSION).toBe(92);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(WS92_VERSION);
    expect(ws92On({ kuralSurumu: 92 })).toBe(true);
    expect(ws92On({ kuralSurumu: 91 })).toBe(false);
  });
});

describe('WS92 Swallow (Giant Frog, SRD s. 351)', () => {
  it('yutulan midede: yakalama biter, Blinded + Restrained, konum yutanınki, eski altıgen boş, dışarıdan hedef alınmaz', () => {
    const s = arena('giant-frog', NEW, held());
    const r = swallow(s);
    const a = r.state.combatants.A as Combatant;
    expect(a.grapple).toBeUndefined();
    expect(a.conditions).toEqual(expect.arrayContaining(['Blinded', 'Restrained']));
    expect(a.conditions).not.toContain('Grappled');
    expect(a.pos).toEqual(o(7, 3));
    expect(occupantAt(r.state, o(6, 3))).toBeUndefined();
    expect(occupantAt(r.state, o(7, 3))?.id).toBe('X');
    expect(isTargetable(a)).toBe(false);
    // Dışarıdan (B) saldırı reddedilir; içeriden (A) yalnız yutan görülür.
    const b = turnOf(r.state, 'B');
    expect(execute(b, { type: 'attack', actorId: 'B', targetId: 'A', option: sword }, P1, MID).ok).toBe(false);
    expect(lineOfFire(r.state, a, r.state.combatants.B as Combatant).blocked).toBe(true);
    expect(lineOfFire(r.state, a, r.state.combatants.X as Combatant).blocked).toBe(false);
    const inside = turnOf(r.state, 'A');
    expect(execute(inside, { type: 'attack', actorId: 'A', targetId: 'X', option: sword }, P1, MID).ok).toBe(true);
    expect(r.events.some((e) => e.type === 'map_effect' && e.swallowLog === 'swallowed')).toBe(true);
    replays(s, r.events, r.state);
  });
  it('yutan Bite kullanamaz (midede yaratık varken); yutan yürüyünce yutulan da taşınır', () => {
    const s = arena('giant-frog', NEW, held());
    const r = swallow(s);
    const fresh = { ...r.state, combatants: { ...r.state.combatants, X: { ...(r.state.combatants.X as Combatant), economy: { ...(r.state.combatants.X as Combatant).economy, action: false } } } };
    const bite = (fresh.combatants.X as Combatant).attacks.findIndex((x) => x.name === 'Bite');
    const res = execute(fresh, { type: 'monster_attack', actorId: 'X', targetId: 'B', attackIndex: bite }, GM, MID);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain('Bite');
    const mv = ok(execute(r.state, { type: 'move', actorId: 'X', to: o(7, 5) }, GM, MID));
    expect(mv.state.combatants.X?.pos).toEqual(o(7, 5));
    expect(mv.state.combatants.A?.pos).toEqual(o(7, 5));
    replays(s, [...r.events, ...mv.events], mv.state);
  });
  it('sonraki turunun sonunda 2d4 Acid; ölmezse kusulur: bitişik boş altıgende Prone', () => {
    const r = swallow(arena('giant-frog', NEW, held()));
    const next = { ...r.state, round: 2 };
    const evs = monsterTurnEvents(next, next.combatants.X as Combatant, 'end', MID);
    expect(evs.some((e) => e.type === 'map_effect' && e.swallowLog === 'disgorged')).toBe(true);
    const after = applyEvents(next, evs);
    const a = after.combatants.A as Combatant;
    expect(a.hp).toBeLessThan(60);
    expect(a.conditions).toContain('Prone');
    expect(a.conditions).not.toContain('Restrained');
    expect(isTargetable(a)).toBe(true);
    expect(distance(a.pos as Offset, o(7, 3))).toBe(1);
    expect(occupantAt(after, a.pos as Offset)?.id).toBe('A');
  });
});

describe('WS92 Swallow (Giant Toad, SRD s. 354)', () => {
  it('bir seferde tek yutulan; yutan ölünce Restrained biter (Blinded sürer), yutulan kendi turunda 5 ft ile cesetten Prone çıkar', () => {
    const s = arena('giant-toad', NEW, held('X', 'M'), held('X', 'M'));
    const r = swallow(s);
    const inside = Object.values(r.state.combatants).filter((c) => c.effects?.some((e) => e.swallowedBy === 'X'));
    expect(inside.length).toBe(1);
    const second = execute({ ...r.state, combatants: { ...r.state.combatants, X: { ...(r.state.combatants.X as Combatant), economy: { ...(r.state.combatants.X as Combatant).economy, action: false } } } },
      { type: 'monster_ability', actorId: 'X', abilityId: 'swallow' }, GM, MID);
    if (second.ok) expect(Object.values(second.state.combatants).filter((c) => c.effects?.some((e) => e.swallowedBy === 'X')).length).toBe(1);
    // Yutan ölür.
    const id = inside[0]!.id;
    const dead = { ...r.state, combatants: { ...r.state.combatants, X: { ...(r.state.combatants.X as Combatant), hp: 0, life: 'dead' as const } } };
    const evs = monsterAfterEvents(dead, MID);
    expect(evs.some((e) => e.type === 'map_effect' && e.swallowLog === 'corpse')).toBe(true);
    const corpse = applyEvents(dead, evs);
    const c1 = corpse.combatants[id] as Combatant;
    expect(c1.conditions).toContain('Blinded');
    expect(c1.conditions).not.toContain('Restrained');
    expect(isTargetable(c1)).toBe(false);
    const start = monsterTurnEvents(corpse, c1, 'start', MID);
    expect(start.some((e) => e.type === 'map_effect' && e.swallowLog === 'exited' && e.burnMove === 1)).toBe(true);
    const out = applyEvents(corpse, start).combatants[id] as Combatant;
    expect(out.conditions).toContain('Prone');
    expect(out.conditions).not.toContain('Blinded');
    expect(out.movementUsed).toBe(c1.movementUsed + 1);
    expect(isTargetable(out)).toBe(true);
  });
  it('her tur sonunda 3d6 Acid; Medium yutulur', () => {
    const r = swallow(arena('giant-toad', NEW, held('X', 'M')));
    const evs = monsterTurnEvents(r.state, r.state.combatants.X as Combatant, 'end', MID);
    expect(evs.some((e) => e.type === 'map_effect' && e.targetId === 'A' && (e.damage?.applied ?? 0) > 0)).toBe(true);
  });
});

describe('WS92 Swallow: Wild Shape biçimi biterse yutulan çıkar', () => {
  it('Giant Toad biçimindeki druid yutar; biçimden çıkınca yutulan bitişikte Prone', () => {
    const sheet = { ...blankCharacter('d').sheet, name: 'Ayla', classId: 'druid', subclassId: 'circle-of-the-land', level: 8, baseScores: suggestedScores('druid'), wildShapeForms: ['giant-toad'] };
    const d = combatantFromSheet(sheet, { id: 'D', ownerId: 'p1' });
    const foe = mk('T', { side: 'enemies', hp: 40, maxHp: 40 });
    const s0 = startBattle('ws92b', 'd', [d, foe], MID, { kuralSurumu: NEW, map: { id: 'col' } } as never).state;
    let s: BattleState = { ...s0, status: 'active', turnIndex: s0.order.indexOf('D'), map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: flat() },
      combatants: { ...s0.combatants, D: { ...(s0.combatants.D as Combatant), pos: o(3, 3) }, T: { ...(s0.combatants.T as Combatant), pos: o(4, 3), ...held('D', 'M') } } };
    const s1 = s;
    const ws = ok(execute(s, { type: 'wild_shape', actorId: 'D', form: 'giant-toad' } as Command, P1, MID));
    s = ws.state;
    const sw = ok(execute(s, { type: 'monster_ability', actorId: 'D', abilityId: 'swallow' }, P1, MID));
    expect(sw.state.combatants.T?.pos).toEqual(o(3, 3));
    // Sonraki tur: bonus eylemle normal biçime dönüş.
    const d2 = sw.state.combatants.D as Combatant;
    const fresh = { ...sw.state, combatants: { ...sw.state.combatants, D: { ...d2, economy: { ...d2.economy, bonus: false } } } };
    const back = ok(execute(fresh, { type: 'wild_shape', actorId: 'D' } as Command, P1, MID));
    const t = back.state.combatants.T as Combatant;
    expect(back.events.some((e) => e.type === 'map_effect' && e.swallowLog === 'released')).toBe(true);
    expect(t.effects?.some((e) => e.swallowedBy)).toBe(false);
    expect(t.conditions).toContain('Prone');
    expect(distance(t.pos as Offset, o(3, 3))).toBe(1);
    replays(s1, [...ws.events, ...sw.events], sw.state);
  });
});

describe('WS92 Swallow: 91 eski davranış', () => {
  it('91: yutulan yerinde kalır, hedef alınabilir, Bite serbest', () => {
    const r = swallow(arena('giant-frog', OLD, held()));
    const a = r.state.combatants.A as Combatant;
    expect(a.pos).toEqual(o(6, 3));
    expect(isTargetable(a)).toBe(true);
    expect(a.effects?.find((e) => e.swallowedBy)?.swallow?.inside).toBeUndefined();
    const fresh = { ...r.state, combatants: { ...r.state.combatants, X: { ...(r.state.combatants.X as Combatant), economy: { ...(r.state.combatants.X as Combatant).economy, action: false } } } };
    const bite = (fresh.combatants.X as Combatant).attacks.findIndex((x) => x.name === 'Bite');
    expect(execute(fresh, { type: 'monster_attack', actorId: 'X', targetId: 'B', attackIndex: bite }, GM, MID).ok).toBe(true);
  });
});
