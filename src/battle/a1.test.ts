/**
 * A1 hata paketi: Heal (sabit iyileştirme, sabit yukarı slot eki), Eyebite (Self menzil + 60 ft hedef, seçilen etki,
 * sonraki turlarda Magic eylemiyle yeni hedef, save'i başaran yeniden hedeflenmez), Grappled saldırı dezavantajı (kural
 * sürümü 29), oyuncunun "Nesne fırlat" komutu (K53 nesne hareketi, eylem), sabit zar ifadesi yazımı.
 */
import { describe, expect, it } from 'vitest';
import { execute, replay, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command } from './index';
import type { Offset } from '../rules/hex';
import { applyEvents } from './reduce';
import { makeObject } from './objects';
import { FRESH_ECONOMY } from './types';
import { formatDice, parseDice } from '../rules/dice';
import { P1, mk, scripted, sword, zero } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });
const high = () => 0.99;
const mid = () => 0.5;
const board = () => Array.from({ length: 9 }, () => '.'.repeat(15));
function field(parts: Combatant[], positions: Record<string, Offset>, version?: number, toggles?: Record<string, boolean>): BattleState {
  const { state } = startBattle('a1', 'd-z-zemin', parts.map((c) => ({ ...c, initiativeBonus: 0 })), scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map: { id: 'kale' } });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  const map = { ...(state.map as NonNullable<BattleState['map']>), tiles: board(), objects: [], zones: [], ...(toggles ? { ruleToggles: toggles } : {}) };
  return { ...state, status: 'active', order: Object.keys(combatants), turnIndex: 0, combatants, map, ...(version ? { kuralSurumu: version } : {}) };
}
const caster = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 80, maxHp: 80, level: 20, spellAttack: 9, spellSaveDc: 17, spellMod: 5, proficiency: 6,
  spellSlots: [4, 4, 4, 4, 4, 4, 4, 4, 4], ...p });
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 60, maxHp: 60, saves: { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 }, ...p });
const ok = (s: BattleState, cmd: Command, rng = mid, ctx = P1) => { const r = execute(s, cmd, ctx, rng); if (!r.ok) throw new Error(r.error); return r; };
const nextTurn = (s: BattleState, id = 'A'): BattleState => ({ ...s, round: s.round + 1, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), economy: FRESH_ECONOMY } } });

describe('A1 Görev 1: sabit zar ifadesi (Heal çökmesi)', () => {
  it('formatDice: zar sayısı 0 ise yalnızca sabit; parseDice geri okur', () => {
    expect(formatDice(0, 1, 70)).toBe('70');
    expect(formatDice(2, 6, 3)).toBe('2d6+3');
    expect(formatDice(1, 8, -1)).toBe('1d8-1');
    expect(parseDice(formatDice(0, 1, 70))).toEqual({ count: 0, sides: 1, bonus: 70 });
  });
  it('Heal: 70 iyileştirir, Blinded/Poisoned kalkar; 7. seviye slotta +10', () => {
    const s = field([caster({ spellNames: ['Heal'] }), mk('C', { ownerId: 'p1', hp: 5, maxHp: 200, conditions: ['Blinded', 'Poisoned'] })], { A: o(3, 3), C: o(5, 3) });
    const r = ok(s, { type: 'cast_spell', actorId: 'A', spellName: 'Heal', targetId: 'C', slotLevel: 6 });
    expect(r.state.combatants.C?.hp).toBe(75);
    expect(r.state.combatants.C?.conditions).not.toContain('Blinded');
    const r7 = ok(s, { type: 'cast_spell', actorId: 'A', spellName: 'Heal', targetId: 'C', slotLevel: 7 });
    expect(r7.state.combatants.C?.hp).toBe(85);
  });
});

describe('A1 Görev 2: Eyebite', () => {
  const base = () => field([caster({ spellNames: ['Eyebite'] }), foe('B'), foe('E'), foe('R', { saves: { str: 30, dex: 30, con: 30, int: 30, wis: 30, cha: 30 } }), foe('F')],
    { A: o(1, 4), B: o(9, 4), E: o(10, 2), R: o(8, 6), F: o(14, 4) });
  it('60 ft içindeki yaratık hedeflenir, seçilen etki uygulanır; 60 ft dışı ve kendisi reddedilir', () => {
    const s = base();
    const r = ok(s, { type: 'cast_spell', actorId: 'A', spellName: 'Eyebite', targetId: 'B', slotLevel: 6, choice: 'Frightened' });
    expect(r.state.combatants.B?.conditions).toContain('Frightened');
    expect(r.state.combatants.A?.concentration?.spell).toBe('Eyebite');
    expect(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Eyebite', targetId: 'F', slotLevel: 6 }, P1, mid).ok).toBe(false);
    expect(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Eyebite', targetId: 'A', slotLevel: 6 }, P1, mid).ok).toBe(false);
  });
  it('sonraki turda Magic eylemiyle başka yaratık: ilk seçim (Frightened) sürer; aynı turda tekrar yok; slot harcanmaz', () => {
    const r = ok(base(), { type: 'cast_spell', actorId: 'A', spellName: 'Eyebite', targetId: 'B', slotLevel: 6, choice: 'Frightened' });
    expect(execute(r.state, { type: 'spell_followup', actorId: 'A', targetId: 'E' }, P1, mid).ok).toBe(false);
    const s2 = nextTurn(r.state);
    const r2 = ok(s2, { type: 'spell_followup', actorId: 'A', targetId: 'E' });
    expect(r2.state.combatants.E?.conditions).toContain('Frightened');
    expect(r2.state.combatants.A?.spellSlots[5]).toBe(s2.combatants.A?.spellSlots[5]);
    // Konsantrasyon bitince bütün hedeflerdeki durum kalkar.
    const end = applyEvents(r2.state, [{ type: 'concentration_ended', actorId: 'A', label: 'test' } as BattleEvent]);
    expect(end.combatants.B?.conditions).not.toContain('Frightened');
    expect(end.combatants.E?.conditions).not.toContain('Frightened');
  });
  it('save\'i başaran bu büyüyle yeniden hedeflenemez; Uyku (Unconscious) seçimi', () => {
    const r = ok(base(), { type: 'cast_spell', actorId: 'A', spellName: 'Eyebite', targetId: 'R', slotLevel: 6, choice: 'Unconscious' }, high);
    expect(r.state.combatants.R?.conditions).not.toContain('Unconscious');
    const s2 = nextTurn(r.state);
    const again = execute(s2, { type: 'spell_followup', actorId: 'A', targetId: 'R' }, P1, mid);
    expect(again.ok).toBe(false);
    const other = ok(s2, { type: 'spell_followup', actorId: 'A', targetId: 'B', choice: 'Unconscious' });
    expect(other.state.combatants.B?.conditions).toContain('Unconscious');
  });
});

describe('A1 Görev 3: Grappled saldırı dezavantajı (sürüm 29)', () => {
  const REASON = 'Saldıran yakalanmış (yakalayan dışına)';
  const grabbed = (version?: number) => field([mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, weaponOptions: [sword], conditions: ['Grappled'], grapple: { by: 'B', escapeDc: 30, restrained: false } }),
    foe('B'), foe('C')], { A: o(5, 4), B: o(6, 4), C: o(5, 5) }, version);
  const attack = (s: BattleState, targetId: string) => ok(s, { type: 'attack', actorId: 'A', targetId, option: sword }).events.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
  it('yakalayana normal, başkasına dezavantaj', () => {
    const s = grabbed();
    expect(s.kuralSurumu).toBeGreaterThanOrEqual(29); // A2 sürümü 30 yaptı; kural 29+ geçerli
    expect(attack(s, 'B').reasons).not.toContain(REASON);
    const other = attack(s, 'C');
    expect(other.reasons).toContain(REASON);
    expect(other.mode).toBe('disadvantage');
  });
  it('yakalama bitince normal; eski sürümde (28) eski davranış', () => {
    const s = grabbed();
    const free = { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), conditions: [], grapple: undefined } } };
    expect(attack(free, 'C').reasons).not.toContain(REASON);
    expect(attack(grabbed(28), 'C').reasons).not.toContain(REASON);
  });
});

describe('A1 Görev 5: Nesne fırlat (oyuncu komutu)', () => {
  const put = (s: BattleState, kind: Parameters<typeof makeObject>[1], at: Offset) => applyEvents(s, [{ type: 'object_placed', object: makeObject(s, kind, at) }]);
  const objAt = (s: BattleState, at: Offset) => s.map?.objects?.find((x) => x.at.col === at.col && x.at.row === at.row);
  const scene = (toggles?: Record<string, boolean>, version?: number) =>
    put(put(put(field([mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, modifiers: { ...zero, str: 3 } }), foe('B')], { A: o(3, 3), B: o(6, 3) }, version, toggles), 'chest', o(3, 4)), 'cauldron', o(4, 3)), 'table', o(2, 3));
  const throwCmd = (objectId: string, to: Offset): Command => ({ type: 'object_use', actorId: 'A', objectId, action: 'throw', to });
  it('hafif nesne: eylem harcanır, tek zar + STR (1d4+3), yaratık bir kez hasar alır; nesne yanına düşer', () => {
    const s = scene();
    const chest = objAt(s, o(3, 4))!;
    const r = ok(s, throwCmd(chest.id, o(6, 3)), high);
    const hits = r.events.filter((e) => e.type === 'map_effect' && e.rule === 'objectThrow');
    expect(hits).toHaveLength(1);
    expect(r.state.combatants.B?.hp).toBe(60 - 7);
    expect(r.state.combatants.A?.economy.action).toBe(true);
    expect(r.events.some((e) => e.type === 'map_effect' && e.rule === 'carpmaHasari')).toBe(false);
    expect(execute(r.state, throwCmd(chest.id, o(6, 3)), P1, high).ok).toBe(false);
    expect(JSON.stringify(replay([{ type: 'battle_started', state: s } as BattleEvent, ...r.events]))).toBe(JSON.stringify(r.state));
  });
  it('orta nesne 15 ft, hafif 30 ft; ağır nesne fırlatılmaz; bitişik olmayan nesne ve boş altıgen', () => {
    const s = scene();
    const table = objAt(s, o(2, 3))!;
    expect(execute(s, throwCmd(table.id, o(9, 3)), P1, mid).ok).toBe(false);
    expect(execute(s, throwCmd(objAt(s, o(4, 3))!.id, o(6, 3)), P1, mid).ok).toBe(false);
    const land = ok(s, throwCmd(objAt(s, o(3, 4))!.id, o(8, 6)));
    expect(objAt(land.state, o(8, 6))?.kind).toBe('chest');
  });
  it('Game Master anahtarı kapalı ya da eski sürüm: komut reddedilir', () => {
    expect(execute(scene({ objectMotion: false }), throwCmd(objAt(scene(), o(3, 4))!.id, o(6, 3)), P1, mid).ok).toBe(false);
    const old = scene(undefined, 23);
    expect(execute(old, throwCmd(objAt(old, o(3, 4))!.id, o(6, 3)), P1, mid).ok).toBe(false);
  });
});
