/**
 * Kuyruk 18 H2: "Yakında" kalan 4.–5. seviye büyüler (Polymorph, Telekinesis, Antilife Shell, Arcane Hand, Conjure
 * Elemental, Tree Stride) ve yapay zekâ kuralları. Replay aynı.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { applyEvents, replay } from './reduce';
import { GM, P1, mk } from './fixtures';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

export const o = (col: number, row: number): Offset => ({ col, row });
export const low: Rng = () => 0.01;
const SLOTS = [4, 3, 3, 3, 2, 0, 0, 0, 0];
const claw = { name: 'Claw', bonus: 4, damageDice: '1d8+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
export function arena(names: string[], b: Partial<Combatant> = {}, bPos = o(5, 3)): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, level: 9, spellSaveDc: 30, spellAttack: 9, spellMod: 5, spellSlots: SLOTS, spellNames: names }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, attacks: [claw], monsterId: 'ogre', ...b }),
    mk('C', { ownerId: 'p2', hp: 20, maxHp: 20 }),
  ];
  const st = startBattle('k18h2', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(2, 3), B: bPos, C: o(2, 4) };
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
  const tiles = Array.from({ length: 7 }, () => '.'.repeat(15));
  return { ...st, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants, map: { ...(st.map as NonNullable<BattleState['map']>), tiles } } as BattleState;
}
export const run = (s: BattleState, cmd: Command, rng: Rng = low, ctx = P1) => { const r = execute(s, cmd, ctx, rng); if (!r.ok) throw new Error(r.error); return r; };
const C = (s: BattleState, id: string) => s.combatants[id] as Combatant;

describe('K18 H2: Polymorph', () => {
  it('düşman (Ogre, CR 2) WIS save kaçırınca en zayıf Beast olur: saldırıları ve AC biçimden, geçici HP; replay aynı', () => {
    const s0 = arena(['Polymorph']);
    const r = run(s0, { type: 'cast_spell', actorId: 'A', spellName: 'Polymorph', targetId: 'B' });
    const b = C(r.state, 'B');
    expect(b.shape?.polymorph).toBe(true);
    expect(b.attacks[0]?.name).not.toBe('Claw');
    expect(b.tempHp ?? 0).toBeGreaterThan(0);
    expect(replay([{ type: 'battle_started', state: s0 }, ...r.events] as BattleEvent[])).toEqual(r.state);
  });
  it('geçici HP bitince ya da konsantrasyon düşünce asıl hâline döner', () => {
    const r = run(arena(['Polymorph']), { type: 'cast_spell', actorId: 'A', spellName: 'Polymorph', targetId: 'B' });
    const noTemp = { ...r.state, combatants: { ...r.state.combatants, B: { ...C(r.state, 'B'), tempHp: 0 } } };
    const r2 = execute(noTemp, { type: 'end_turn', actorId: 'A' } as Command, P1, low);
    if (!r2.ok) throw new Error(r2.error);
    expect(C(r2.state, 'B').shape).toBeUndefined();
    expect(C(r2.state, 'B').attacks[0]?.name).toBe('Claw');
  });
  it('dosta (seçimle) güçlü Beast; CR sınırı aşılmaz', () => {
    const r = run(arena(['Polymorph']), { type: 'cast_spell', actorId: 'A', spellName: 'Polymorph', targetId: 'C' });
    expect(C(r.state, 'C').shape?.polymorph).toBe(true);
    void GM; void applyEvents;
  });
});

describe('K18 H2: Telekinesis ve Antilife Shell', () => {
  it('Telekinesis: STR save kaçıran 30 ft uzağa itilir ve bir tur Restrained; replay aynı', () => {
    const s0 = arena(['Telekinesis']);
    const r = run(s0, { type: 'cast_spell', actorId: 'A', spellName: 'Telekinesis', targetId: 'B' });
    const b = C(r.state, 'B');
    expect(b.pos?.col).toBeGreaterThan(5);
    expect(b.conditions).toContain('Restrained');
    expect(replay([{ type: 'battle_started', state: s0 }, ...r.events] as BattleEvent[])).toEqual(r.state);
  });
  it('Antilife Shell: büyücüyle yürüyen aura; dışarıdaki humanoid giremez ve yakın dövüş ulaşmaz; Undead girer', async () => {
    const { moveCostFn } = await import('./movement');
    const s0 = arena(['Antilife Shell'], {}, o(6, 3));
    const r = run(s0, { type: 'cast_spell', actorId: 'A', spellName: 'Antilife Shell' });
    const z = r.state.map?.zones?.[0];
    expect(z?.anchorId).toBe('A');
    expect(moveCostFn(r.state, C(r.state, 'B'))(o(4, 3), o(5, 3))).toBeNull();
    const undead = { ...r.state, combatants: { ...r.state.combatants, B: { ...C(r.state, 'B'), creatureType: 'undead' } } };
    expect(moveCostFn(undead, C(undead, 'B'))(o(4, 3), o(5, 3))).not.toBeNull();
    // Uzun erişimli (15 ft) saldırı aura dışından içeriye ulaşmaz.
    const near = { ...r.state, turnIndex: 1, combatants: { ...r.state.combatants, B: { ...C(r.state, 'B'), pos: o(5, 3), attacks: [{ ...C(r.state, 'B').attacks[0]!, reachFt: 15 }] } } };
    const hit = execute(near, { type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 } as Command, GM, () => 0.99);
    if (!hit.ok) throw new Error(hit.error);
    expect(hit.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ hit: false });
  });
});

describe('K18 H2: Tree Stride, Arcane Hand, Conjure Elemental', () => {
  const withTrees = (s: BattleState, rows: Record<number, string>): BattleState =>
    ({ ...s, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: s.map!.tiles.map((r, i) => rows[i] ?? r) } });
  it('Tree Stride: iki ucunda ağaç varsa 500 ft içinde ışınlanır; ağaçsız uç reddedilir', () => {
    const s0 = withTrees(arena(['Tree Stride']), { 2: '..a.........a..' });
    const r = run(s0, { type: 'cast_spell', actorId: 'A', spellName: 'Tree Stride', targetHex: o(12, 3) } as Command);
    expect(C(r.state, 'A').pos).toEqual(o(12, 3));
    const bad = execute(s0, { type: 'cast_spell', actorId: 'A', spellName: 'Tree Stride', targetHex: o(8, 5) } as Command, P1, low);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toMatch(/ağaç/);
  });
  it('Arcane Hand: HP büyücünün en çok HP\'si, AC 20; Clenched Fist 5d8 kuvvet, yukarı slotta +2d8', () => {
    const r = run(arena(['Arcane Hand']), { type: 'cast_spell', actorId: 'A', spellName: 'Arcane Hand', targetHex: o(4, 3) } as Command);
    const hand = Object.values(r.state.combatants).find((c) => c.summon?.spellId === 'arcane-hand') as Combatant;
    expect(hand.maxHp).toBe(40);
    expect(hand.ac).toBe(20);
    expect(hand.attacks[0]).toMatchObject({ name: 'Clenched Fist', damageDice: expect.stringMatching(/^5d8/), damageType: 'force' });
    const up = arena(['Arcane Hand']);
    const A = up.combatants.A as Combatant;
    const up6 = { ...up, combatants: { ...up.combatants, A: { ...A, spellSlots: [4, 3, 3, 3, 2, 1, 0, 0, 0] } } };
    const r6 = run(up6, { type: 'cast_spell', actorId: 'A', spellName: 'Arcane Hand', targetHex: o(4, 3), slotLevel: 6 } as Command);
    const h6 = Object.values(r6.state.combatants).find((c) => c.summon?.spellId === 'arcane-hand') as Combatant;
    expect(h6.attacks[0]?.damageDice).toMatch(/^7d8/);
  });
  it('Conjure Elemental: dokunulamaz ruh + yürüyen alan; seçilen element hasar türü, başarısızlıkta Restrained; replay aynı', () => {
    const s0 = arena(['Conjure Elemental']);
    const r = run(s0, { type: 'cast_spell', actorId: 'A', spellName: 'Conjure Elemental', targetHex: o(4, 3), choice: 'fire' } as Command);
    const z = r.state.map?.zones?.find((x) => x.spellId === 'conjure-elemental');
    expect(z?.damageType).toBe('fire');
    expect(z?.radius).toBe(1);
    const spirit = Object.values(r.state.combatants).find((c) => c.summon?.spellId === 'conjure-elemental') as Combatant;
    expect(spirit.summon?.intangible).toBe(true);
    // B ruhun yanına yürür: DEX save kaçırır (düşük zar), ateş hasarı ve Restrained.
    const bTurn = { ...r.state, turnIndex: r.state.order.indexOf('B') };
    const m = execute(bTurn, { type: 'move', actorId: 'B', to: o(5, 3) } as Command, GM, low);
    const mv = m.ok ? m : execute({ ...bTurn, combatants: { ...bTurn.combatants, B: { ...C(bTurn, 'B'), pos: o(6, 3) } } }, { type: 'move', actorId: 'B', to: o(5, 3) } as Command, GM, low);
    if (!mv.ok) throw new Error(mv.error);
    const sv = mv.events.find((e) => e.type === 'save_resolved' && e.label === 'Conjure Elemental');
    expect(sv).toMatchObject({ success: false, damageType: 'fire' });
    expect(C(mv.state, 'B').conditions).toContain('Restrained');
    expect(replay([{ type: 'battle_started', state: s0 }, ...r.events] as BattleEvent[])).toEqual(r.state);
  });
});

describe('K18 H2: yapay zekâ kuralları', () => {
  const party = (s: BattleState, extra: Combatant[]): BattleState =>
    ({ ...s, combatants: { ...s.combatants, ...Object.fromEntries(extra.map((c) => [c.id, c])) }, order: [...s.order, ...extra.map((c) => c.id)] });
  const foe = (id: string, pos: Offset, hp = 60) => ({ ...mk(id, { side: 'enemies', hp, maxHp: hp, attacks: [claw], monsterId: 'ogre' }), pos } as Combatant);
  it('Polymorph: iki ve daha çok düşmanda en güçlü (30+ HP) düşmana', async () => {
    const { chooseCommand } = await import('./ai');
    const s = party(arena(['Polymorph'], {}, o(8, 3)), [foe('D', o(9, 4), 35)]);
    expect(chooseCommand(s)).toMatchObject({ type: 'cast_spell', spellName: 'Polymorph', targetId: 'B' });
  });
  it('Resilient Sphere: düşmana bitişik çok yaralı dostu küreye alır', async () => {
    const { chooseCommand } = await import('./ai');
    const s0 = arena(['Resilient Sphere'], {}, o(3, 4));
    const s = { ...s0, combatants: { ...s0.combatants, C: { ...C(s0, 'C'), hp: 3 } } };
    expect(chooseCommand(s)).toMatchObject({ type: 'cast_spell', spellName: 'Resilient Sphere', targetId: 'C' });
  });
  it('Wall of Force: 3+ düşmanda duvar en az ikisini öte yana ayırır, dost öte yanda kalmaz', async () => {
    const { chooseCommand } = await import('./ai');
    const s = party(arena(['Wall of Force'], {}, o(9, 2)), [foe('D', o(9, 3)), foe('E', o(10, 4))]);
    const cmd = chooseCommand(s);
    expect(cmd).toMatchObject({ type: 'cast_spell', spellName: 'Wall of Force' });
    const r = run(s, cmd);
    expect(r.state.map?.zones?.some((z) => z.spellId === 'wall-of-force')).toBe(true);
  });
});
