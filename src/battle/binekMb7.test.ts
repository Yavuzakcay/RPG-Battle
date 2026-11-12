/**
 * Kuyruk MB7 (kural sürümü 70; `harita/belgeler/BINEK-PLAN.md` §7.2 MB7): Find Steed / Faithful Steed binek kolu, Phantom Steed,
 * paket yaratığında `binek` alanı. Görev 0: her madde önce sürüm 70 durumunda başarısız testle doğrulandı. 69'da eski davranış.
 */
import { afterEach, describe, expect, it } from 'vitest';
import binekPack from '../../tests/fixtures/paket-binek.json';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { mountProblem } from './mounted';
import { GM, P1, mk, scripted } from './fixtures';
import { validatePack } from '../content/schema';
import { applyPackSubclasses } from '../content/paket';
import { classData } from '../data';
import { kitArena } from './k54bKit';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row = 3): Offset => ({ col, row });
const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
const pad = () => scripted(...Array.from({ length: 40 }, () => [20, 10] as [number, number]));
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const claw = { name: 'Claw', bonus: 4, damageDice: '1d8+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
const SLOTS = [4, 3, 3, 3, 2, 0, 0, 0, 0];

/** A büyücü (3,3), B düşman (10,3), C dost (2,3). */
function arena(v: number, status: BattleState['status'] = 'active', a: Partial<Combatant> = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellAttack: 5, spellSaveDc: 13, spellMod: 3, proficiency: 3, initiative: 0, level: 9,
      spellNames: ['Find Steed', 'Summon Dragon', 'Phantom Steed'], spellSlots: SLOTS, ...a }),
    mk('B', { side: 'enemies', hp: 40, maxHp: 40, attacks: [claw] }),
    mk('C', { ownerId: 'p2' }),
  ];
  const s0 = startBattle('s', 'd-z-zemin', parts, pad(), { kuralSurumu: v, map: { id: 'col' } }).state;
  const cs = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: o(3), B: o(10), C: o(2) })) cs[id] = { ...(cs[id] as Combatant), pos: p };
  return { ...s0, kuralSurumu: v, status, turnIndex: 0, combatants: cs, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: flat } };
}
const cast = (s: BattleState, cmd: Omit<Extract<Command, { type: 'cast_spell' }>, 'type' | 'actorId'>) =>
  execute(s, { type: 'cast_spell', actorId: 'A', ...cmd }, P1, pad());
const summonOf = (s: BattleState) => Object.values(s.combatants).find((c) => c.summon?.by === 'A' && !c.summon.gone) as Combatant;
const chain = (before: BattleState, evs: BattleEvent[]) => replay([{ type: 'battle_started', state: before }, ...evs]);

describe('MB7 Görev 0: açıkların doğrulanması (sürüm 70)', () => {
  it('madde 1: Find Steed atı binek kuralını taşır, çağıran biner; Summon Dragon ruhuna binilmez', () => {
    const s = arena(70);
    const r = ok(cast(s, { spellName: 'Find Steed', choice: 'celestial', targetHex: o(4) }));
    const steed = summonOf(r.state);
    expect(steed.summon?.mount).toBeTruthy();
    expect(mountProblem(r.state, r.state.combatants.A as Combatant, steed.id)).toBeNull();
    const m = ok(execute(r.state, { type: 'mount', actorId: 'A', mountId: steed.id }, P1, pad()));
    expect(m.state.combatants.A?.riding).toBe(steed.id);
    expect(chain(s, [...r.events, ...m.events])).toEqual(m.state);
    const d = ok(cast(arena(70), { spellName: 'Summon Dragon', choice: 'fire', targetHex: o(4) }));
    expect(mountProblem(d.state, d.state.combatants.A as Combatant, summonOf(d.state).id)).toMatch(/binek değil/);
  });

  it('madde 2: Phantom Steed kurulumda (ritüel, slotsuz) Riding Horse + hız 100, uçmaz; hasar alınca kaybolur', () => {
    const s = arena(70, 'setup');
    const r = ok(cast(s, { spellName: 'Phantom Steed', targetHex: o(4) }));
    const steed = summonOf(r.state);
    expect(steed).toMatchObject({ monsterId: 'riding-horse', size: 'L', speed: 100, fly: 0, summon: { spellId: 'phantom-steed', turn: 'after-owner' } });
    expect(r.state.combatants.A?.spellSlots).toEqual(s.combatants.A?.spellSlots);
    expect(mountProblem(r.state, r.state.combatants.A as Combatant, steed.id)).toBeNull();
    const hit = ok(execute({ ...r.state, status: 'active' }, { type: 'adjust_hp', targetId: steed.id, hp: steed.hp - 1 } as Command, GM, pad()));
    expect(hit.events.some((e) => e.type === 'summon_vanished' && e.actorId === steed.id && e.reason === 'damaged')).toBe(true);
    expect(cast(arena(70), { spellName: 'Phantom Steed', targetHex: o(4) }).ok).toBe(false);
  });

  it('madde 3: paket yaratığında `binek` alanı geçerli; şema bilinmeyen ve hatalı değerleri reddeder', () => {
    const r = validatePack(binekPack, { taken: [], packs: [] });
    expect(r.ok, JSON.stringify(r.ok ? [] : r.errors)).toBe(true);
    const bad = JSON.parse(JSON.stringify(binekPack)) as { yaratiklar: Array<Record<string, unknown>> };
    (bad.yaratiklar[0] as Record<string, unknown>).binek = { kural: 'herkes', biniciSayisi: 3, enBuyukBinici: 'Q' };
    const rb = validatePack(bad, { taken: [], packs: [] });
    expect(rb.ok).toBe(false);
  });
});

describe('MB7: paket `binek` alanı (sürüm 70)', () => {
  const SUB = 'titan-yolcusu';
  const load = () => {
    const r = validatePack(binekPack, { taken: classData.subclasses.map((s) => s.id), packs: [] });
    if (!r.ok) throw new Error(JSON.stringify(r.errors));
    applyPackSubclasses(r.pack.subclasses);
  };
  afterEach(() => applyPackSubclasses([]));
  const call = (level: number, feat: string, v = 70) => {
    load();
    const r = kitArena({ cls: 'fighter', sub: SUB, level, kuralSurumu: v, place: { B: o(10) } });
    r.do({ type: 'use_feature', actorId: 'A', feature: `pk:${SUB}/${feat}:eylem` });
    const drake = Object.values(r.state.combatants).find((c) => c.summon?.by === 'A' && !c.summon.gone) as Combatant;
    return { r, drake };
  };
  it('binek alanlı yaratığa çağıran biner (seviye eşiği tutunca); başkası (kural: sahip) binemez', () => {
    const { r, drake } = call(14, 'titan-cagrisi');
    expect(drake.summon?.mount).toMatchObject({ ownerOnly: true, minLevel: 14, maxRider: 'M' });
    expect(mountProblem(r.state, r.c('A'), drake.id)).toBeNull();
    const ally = { ...r.c('C'), pos: drake.pos ? { col: drake.pos.col + 1, row: drake.pos.row } : null } as Combatant;
    expect(mountProblem({ ...r.state, combatants: { ...r.state.combatants, C: ally } }, ally, drake.id)).toMatch(/yalnız çağıranı/i);
    r.do({ type: 'mount', actorId: 'A', mountId: drake.id });
    expect(r.c('A').riding).toBe(drake.id);
    expect(JSON.stringify(replay(r.events).combatants)).toBe(JSON.stringify(r.state.combatants));
  });
  it('seviye eşiği tutmuyorsa binilmez; binek alanı olmayan çağrıya binilmez', () => {
    const low = call(13, 'titan-cagrisi');
    expect(mountProblem(low.r.state, low.r.c('A'), low.drake.id)).toMatch(/14/);
    const plain = call(14, 'yaban-cagrisi');
    expect(mountProblem(plain.r.state, plain.r.c('A'), plain.drake.id)).toMatch(/binek değil/);
  });
  it('69: binek alanı yok sayılır, çağrılan her büyük dosta eski kuralla binilir', () => {
    const plain = call(14, 'yaban-cagrisi', 69);
    expect(plain.drake.summon?.mount).toBeUndefined();
    expect(mountProblem(plain.r.state, plain.r.c('A'), plain.drake.id)).toBeNull();
  });
});

describe('MB7: 69 ve altı eski davranış', () => {
  it('69: Summon Dragon ruhuna binilir; Phantom Steed savaş dışı (kurulumda çağrılmaz)', () => {
    const d = ok(cast(arena(69), { spellName: 'Summon Dragon', choice: 'fire', targetHex: o(4) }));
    expect(mountProblem(d.state, d.state.combatants.A as Combatant, summonOf(d.state).id)).toBeNull();
    const p = cast(arena(69, 'setup'), { spellName: 'Phantom Steed', targetHex: o(4) });
    expect(p.ok && !!summonOf(p.state)).toBe(false);
  });
});
