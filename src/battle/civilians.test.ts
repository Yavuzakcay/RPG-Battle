/** Görev F: masumlar hiçbir eylem yapmaz, sıraları atlanır, yerinde durur; hasar alabilir. */
import { describe, it, expect } from 'vitest';
import { execute, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant } from './index';
import type { Offset } from '../rules/hex';
import { GM, P1, mk, scripted, sword } from './fixtures';
import { chooseCommand } from './ai';
import { currentActorId } from './common';
import { replay } from './reduce';
import { CIVILIAN_LOOKS, civilianArt, civilianLook } from './civilianLooks';
import { applyEvent } from './reduce';

const o = (col: number, row: number): Offset => ({ col, row });
const civ = (id = 'M') => mk(id, { civilian: true, hp: 4, maxHp: 4, ac: 10 });
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };

/** Haritalı kurulum; sıra listedeki sırayla; GM herkesi yerleştirip başlatır. */
function begin(parts: Combatant[], at: Record<string, Offset>) {
  const start = startBattle('c', 'd-z-zemin', parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map: { id: 'col' } });
  let s: BattleState = start.state;
  const events = [...start.events];
  for (const [id, pos] of Object.entries(at)) {
    const r = ok(execute(s, { type: 'place', actorId: id, at: pos }, GM, scripted()));
    s = r.state; events.push(...r.events);
  }
  const r = ok(execute(s, { type: 'start_battle' }, GM, scripted()));
  return { state: r.state, events: [...events, ...r.events, ] , started: r.events };
}

describe('masumlar', () => {
  it('sıra masumla başlarsa ve ona gelince atlanır; masum eylem yapamaz, yerinde kalır', () => {
    const parts = [civ(), mk('A', { ownerId: 'p1', weaponOptions: [sword] }), mk('B', { side: 'enemies' })];
    const { state, events, started } = begin(parts, { M: o(4, 6), A: o(2, 6), B: o(12, 6) });
    expect(currentActorId(state)).toBe('A');
    expect(started.map((e) => e.type)).toContain('turn_ended');
    expect(execute(state, { type: 'move', actorId: 'M', to: o(5, 6) }, GM, scripted()).ok).toBe(false);
    // A → B → (M atlanır) → A.
    const a = ok(execute(state, { type: 'end_turn', actorId: 'A' }, P1, scripted()));
    const b = ok(execute(a.state, { type: 'end_turn', actorId: 'B' }, GM, scripted()));
    expect(currentActorId(b.state)).toBe('A');
    expect(b.state.round).toBe(2);
    expect(b.state.combatants.M?.pos).toEqual(o(4, 6));
    // Günlük baştan oynatılınca aynı durum.
    expect(replay([...events, ...a.events, ...b.events])).toEqual(b.state);
  });
  it('yapay zekâ masuma tur vermez; masum hasar alabilir', () => {
    const parts = [mk('B', { side: 'enemies', attacks: [], weaponOptions: [sword] }), civ(), mk('A', { ownerId: 'p1' })];
    const { state } = begin(parts, { B: o(7, 6), M: o(8, 6), A: o(2, 6) });
    const civTurn = { ...state, turnIndex: state.order.indexOf('M') };
    expect(chooseCommand(civTurn)).toEqual({ type: 'end_turn', actorId: 'M' });
    const hurt = ok(execute(state, { type: 'adjust_hp', targetId: 'M', hp: 1 }, GM, scripted()));
    expect(hurt.state.combatants.M?.hp).toBe(1);
  });
});

describe('masum görünümleri', () => {
  const files = Object.keys(import.meta.glob('../../public/masumlar/*.webp')).map((p) => `masumlar/${p.split('/').pop() ?? ''}`).sort();
  it('8 görünüm (data/masumlar.json) ve görselleri; tohumla karışık, aynı tohum aynı sıra', () => {
    expect(CIVILIAN_LOOKS.map((l) => l.name)).toEqual(['Yaşlı köylü', 'Sepetli kadın', 'Tüccar', 'Çiftçi', 'Hancı kızı', 'Han sahibi', 'Köylü oğlan', 'Köylü kız']);
    expect(CIVILIAN_LOOKS.map((l) => l.image).sort()).toEqual(files);
    expect(files).toHaveLength(8);
    expect([...civilianArt(7)].sort()).toEqual(CIVILIAN_LOOKS.map((l) => l.id).sort());
    expect(civilianArt(7)).toEqual(civilianArt(7));
    expect(new Set([1, 2, 3, 4, 5, 6, 7, 8].map((seed) => civilianArt(seed).join())).size).toBeGreaterThan(1);
  });
  const tavern = (seed: number) => startBattle('t', 'd-z-zemin', [mk('A', { ownerId: 'p1' }), mk('B', { side: 'enemies' })], scripted(),
    { map: { id: 'taverna', options: ['objective'], civilians: 6, civilianArtSeed: seed } });
  it('GM seçmezse tohumlu görünüm; başlangıç olayı saklar', () => {
    const s = tavern(42);
    const art = civilianArt(42);
    const civs = Object.values(s.state.combatants).filter((c) => c.civilian);
    expect(civs.map((c) => c.gorselId)).toEqual(art.slice(0, 6));
    expect(civs.map((c) => c.avatar.src)).toEqual(art.slice(0, 6).map((id) => civilianLook(id)?.image));
    expect(replay(s.events).combatants.masum1?.gorselId).toBe(art[0]);
  });
  it('GM kurulumda seçer (aynı görünüm birden çok masumda); olay günlükte, oyuncu ve savaş sırasında seçemez', () => {
    const s = tavern(3);
    const one = ok(execute(s.state, { type: 'choose_civilian_art', actorId: 'masum1', gorselId: 'masum-3' }, GM, scripted()));
    const two = ok(execute(one.state, { type: 'choose_civilian_art', actorId: 'masum2', gorselId: 'masum-3' }, GM, scripted()));
    expect(two.events).toEqual([{ type: 'civilian_art', actorId: 'masum2', gorselId: 'masum-3' }]);
    expect([two.state.combatants.masum1?.avatar.src, two.state.combatants.masum2?.avatar.src]).toEqual(['masumlar/masum-3.webp', 'masumlar/masum-3.webp']);
    expect(replay([...s.events, ...one.events, ...two.events])).toEqual(two.state);
    expect(execute(s.state, { type: 'choose_civilian_art', actorId: 'masum1', gorselId: 'masum-3' }, P1, scripted()).ok).toBe(false);
    expect(execute(s.state, { type: 'choose_civilian_art', actorId: 'A', gorselId: 'masum-3' }, GM, scripted()).ok).toBe(false);
    expect(execute(s.state, { type: 'choose_civilian_art', actorId: 'masum1', gorselId: 'masum-9' }, GM, scripted()).ok).toBe(false);
  });
  it('gorselId alanı olmayan eski kayıt: masum tohumlu varsayılana düşer', () => {
    const s = tavern(3);
    const first = s.events[0] as Extract<BattleEvent, { type: 'battle_started' }>;
    const old = { ...first.state.combatants.masum2 as Combatant, avatar: { src: 'avatars/masum.webp', bg: '#8a7a4a', label: 'M' } };
    delete (old as Partial<Combatant>).gorselId;
    const legacy = { ...first, state: { ...first.state, combatants: { ...first.state.combatants, masum2: old } } };
    const back = applyEvent(first.state, legacy);
    expect(back.combatants.masum2?.gorselId).toBe(civilianArt(1)[1]);
    expect(back.combatants.masum2?.avatar.src).toBe(civilianLook(civilianArt(1)[1])?.image);
  });
});
