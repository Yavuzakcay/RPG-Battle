/** Kuyruk 19 (0a): 4–5. seviye büyülerin tam SRD yan etkileri (anahtar `spellsK19`, kural sürümü 16). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, mk } from './fixtures';
import { seededRng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const SPELLS = ['Ice Storm', 'Flame Strike', 'Vitriolic Sphere', 'Blight'];
export function caster(extra: Partial<Combatant> = {}): Combatant {
  return mk('A', { ownerId: 'p1', spellNames: SPELLS, spellSlots: [4, 3, 3, 3, 3, 0, 0, 0, 0], spellSaveDc: 30, spellAttack: 10, spellMod: 5, casterTag: 'wizard', ...extra });
}
export function field(parts: Combatant[], pos: Record<string, { col: number; row: number }>, kuralSurumu = 16, toggles?: Record<string, boolean>): BattleState {
  const s = startBattle('k19', 'd-z-zemin', parts, () => 0.5, { kuralSurumu, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
}
export function run(s: BattleState, cmd: Command, seed = 3) {
  const r = execute(s, cmd, cmd.type === 'cast_spell' && s.combatants[cmd.actorId]?.side === 'enemies' ? GM : P1, seededRng(seed));
  if (!r.ok) throw new Error(r.error);
  expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  return r;
}
const foes = (n: number, p: Partial<Combatant> = {}) => Array.from({ length: n }, (_, i) => mk(`F${i}`, { side: 'enemies', hp: 200, maxHp: 200, ...p }));

describe('Kuyruk 19: Ice Storm ve Flame Strike (iki hasar türü)', () => {
  const pos = { A: { col: 1, row: 3 }, F0: { col: 8, row: 3 }, F1: { col: 8, row: 4 } };
  it('Ice Storm: Bludgeoning + Cold ayrı, alanda zorlu arazi; anahtar kapalı/eski sürüm: tek Cold zarı, zemin yok', () => {
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Ice Storm', targetHex: { col: 8, row: 3 } };
    const r = run(field([caster(), ...foes(2)], pos), cmd);
    const sv = r.events.find((e) => e.type === 'save_resolved') as Extract<BattleEvent, { type: 'save_resolved' }>;
    expect(sv.damageType).toBe('bludgeoning');
    expect(sv.secondary?.type).toBe('cold');
    expect(sv.appliedDamage).toBe(sv.rawDamage + (sv.secondary?.raw ?? 0));
    expect(r.events.some((e) => e.type === 'zone_created' && e.zone.spellId === 'ice-storm')).toBe(true);
    for (const s of [field([caster(), ...foes(2)], pos, 16, { spellsK19: false }), field([caster(), ...foes(2)], pos, 15)]) {
      const q = run(s, cmd);
      const sv2 = q.events.find((e) => e.type === 'save_resolved') as Extract<BattleEvent, { type: 'save_resolved' }>;
      expect([sv2.damageType, sv2.secondary]).toEqual(['cold', undefined]);
      expect(q.events.some((e) => e.type === 'zone_created')).toBe(false);
    }
  });
  it('Flame Strike: Fire + Radiant; Fire\'a bağışık hedef yalnızca Radiant alır', () => {
    const r = run(field([caster(), ...foes(1, { immunities: ['fire'] })], pos), { type: 'cast_spell', actorId: 'A', spellName: 'Flame Strike', targetHex: { col: 8, row: 3 } });
    const sv = r.events.find((e) => e.type === 'save_resolved') as Extract<BattleEvent, { type: 'save_resolved' }>;
    expect([sv.damageType, sv.secondary?.type]).toEqual(['fire', 'radiant']);
    expect(sv.appliedDamage).toBe(sv.secondary?.applied);
  });
});

describe('Kuyruk 19: Vitriolic Sphere ve Blight', () => {
  const pos = { A: { col: 1, row: 3 }, F0: { col: 8, row: 3 } };
  it('Vitriolic Sphere: başarısız hedefe gecikmeli 5d4 Acid etkisi; anahtar kapalıyken yok', () => {
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Vitriolic Sphere', targetHex: { col: 8, row: 3 } };
    const r = run(field([caster(), ...foes(1)], pos), cmd);
    expect(r.state.combatants.F0?.effects?.some((e) => e.delayed?.dice === '5d4' && e.delayed.type === 'acid')).toBe(true);
    const off = run(field([caster(), ...foes(1)], pos, 16, { spellsK19: false }), cmd);
    expect(off.state.combatants.F0?.effects?.some((e) => e.delayed) ?? false).toBe(false);
  });
  it('Blight: Plant save\'i otomatik kaçırır; eski sürümde zar atar', () => {
    const plant = mk('F0', { side: 'enemies', hp: 200, maxHp: 200, creatureType: 'plant', saves: { str: 0, dex: 0, con: 40, int: 0, wis: 0, cha: 0 } });
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Blight', targetId: 'F0' };
    const sv = (q: ReturnType<typeof run>) => q.events.find((e) => e.type === 'save_resolved') as Extract<BattleEvent, { type: 'save_resolved' }>;
    const on = sv(run(field([caster(), plant], { A: { col: 1, row: 3 }, F0: { col: 4, row: 3 } }), cmd));
    expect([on.success, on.natural]).toEqual([false, null]);
    const old = sv(run(field([caster(), plant], { A: { col: 1, row: 3 }, F0: { col: 4, row: 3 } }, 15), cmd));
    expect(old.success).toBe(true);
  });
});

import { effectTurnEndEvents } from './effects';

describe('Kuyruk 19: Phantasmal Killer', () => {
  const pos = { A: { col: 1, row: 3 }, F0: { col: 4, row: 3 } };
  const low = { str: -9, dex: -9, con: -9, int: -9, wis: -9, cha: -9 };
  it('başarısızlıkta saldırı/kontrol dezavantajı ve tur sonu save: başarısızsa hasar yinelenir; eski sürümde etki yok', () => {
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Phantasmal Killer', targetId: 'F0' };
    const c = caster({ spellNames: [...SPELLS, 'Phantasmal Killer'] });
    const r = run(field([c, ...foes(1, { saves: low })], pos), cmd);
    const eff = r.state.combatants.F0?.effects?.find((e) => e.id === 'spells:phantasmal-killer');
    expect(eff?.attackDis).toBeDefined();
    expect(eff?.checkDis).toContain('wis');
    expect(eff?.repeatSave?.failDamage?.type).toBe('psychic');
    const hp0 = r.state.combatants.F0?.hp ?? 0;
    const tick = effectTurnEndEvents(r.state, 'F0', seededRng(5));
    const t = tick.find((e) => e.type === 'effect_tick') as Extract<BattleEvent, { type: 'effect_tick' }>;
    expect(t.save?.success).toBe(false);
    expect(t.appliedDamage).toBeGreaterThan(0);
    expect(t.targetHpAfter).toBe(hp0 - t.appliedDamage);
    const old = run(field([c, ...foes(1, { saves: low })], pos, 15), cmd);
    expect(old.state.combatants.F0?.effects?.some((e) => e.id === 'spells:phantasmal-killer') ?? false).toBe(false);
  });
});

import { effectTurnStartEvents } from './effects';

describe('Kuyruk 19: Aura of Life ve Black Tentacles', () => {
  it('Aura of Life: 30 ft içindeki dostlar Necrotic dirençli; 0 HP\'deki dost tur başında 1 HP; eski sürümde 6 hedefli etki', () => {
    const c = caster({ spellNames: ['Aura of Life'] });
    const ally = mk('B', { ownerId: 'p1', hp: 0, maxHp: 20, life: 'dying' });
    const far = mk('C', { ownerId: 'p1', hp: 10, maxHp: 20 });
    const s = field([c, ally, far, ...foes(1)], { A: { col: 2, row: 3 }, B: { col: 3, row: 3 }, C: { col: 14, row: 0 }, F0: { col: 10, row: 3 } });
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Aura of Life', targetIds: ['A'] });
    expect(r.state.combatants.A?.auraResist).toEqual(['necrotic']);
    expect(r.state.combatants.B?.auraResist).toEqual(['necrotic']);
    expect(r.state.combatants.C?.auraResist).toBeUndefined();
    const st = effectTurnStartEvents(r.state, 'B', seededRng(1));
    expect(st.events.some((e) => e.type === 'healed' && e.targetId === 'B' && e.targetHpAfter === 1)).toBe(true);
    const old = run(field([c, ally, far, ...foes(1)], { A: { col: 2, row: 3 }, B: { col: 3, row: 3 }, C: { col: 14, row: 0 }, F0: { col: 10, row: 3 } }, 15),
      { type: 'cast_spell', actorId: 'A', spellName: 'Aura of Life', targetIds: ['A'] });
    expect(old.state.combatants.A?.effects?.some((e) => e.auraLife) ?? false).toBe(false);
  });
});
