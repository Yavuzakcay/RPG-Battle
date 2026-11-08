/**
 * Kuyruk K70 (kural sürümü 54, büyü verisinde `k70` bloğu): küçük SRD farkları. Her madde sürüm 54'te yeni, sürüm 53'te eski
 * davranışla sabitlenir; replay `run` içinde denetlenir.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { execute } from './index';
import { destroyForceProblem } from './spells';
import { GM, mk, P1 } from './fixtures';
import { caster, field, run } from './k19spells.test';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const HIGH = { str: 30, dex: 30, con: 30, int: 30, wis: 30, cha: 30 };
const ALL = [4, 3, 3, 3, 3, 3, 2, 2, 1];
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 400, maxHp: 400, saves: LOW, ...p });
const pos = { A: { col: 2, row: 3 }, F0: { col: 5, row: 3 } };
const cast = (spellName: string, extra: Record<string, unknown> = {}) => ({ type: 'cast_spell', actorId: 'A', spellName, ...extra }) as Command;
const wiz = (names: string[], p: Partial<Combatant> = {}) => caster({ spellNames: names, spellSlots: ALL, concentration: null, ...p });
const saves = (evs: BattleEvent[]) => evs.filter((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved');
const endTurn = (s: BattleState, id: string) => { const r = execute(s, { type: 'end_turn', actorId: id }, id === 'A' ? P1 : GM, () => 0.5); if (!r.ok) throw new Error(r.error); return r; };
const fx = (s: BattleState, id: string, srd: string) => s.combatants[id]?.effects?.find((e) => e.id === srd);
const setC = (s: BattleState, id: string, p: Partial<Combatant>): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), ...p } } });

describe('K70 madde 1: Flesh to Stone, Construct otomatik başarır', () => {
  const stone = (k: number, type: string) => run(field([wiz(['Flesh to Stone']), foe('F0', { creatureType: type })], pos, k), cast('Flesh to Stone', { targetId: 'F0' }));
  it('veri: SRD metni (Constructs automatically succeed) ile `k70.autoSuccessTypes`', () => {
    const s = spells.find((x) => x.name === 'Flesh to Stone');
    expect(s?.mechanics.k70?.autoSuccessTypes).toEqual(['construct']);
  });
  it('sürüm 54: Construct zar atmadan başarır (yalnız başarı etkisi: hız 0), Restrained yok', () => {
    const r = stone(54, 'construct');
    const sv = saves(r.events)[0];
    expect(sv).toMatchObject({ success: true, natural: null, d20: [] });
    expect(r.state.combatants.F0?.conditions).not.toContain('Restrained');
    expect(fx(r.state, 'F0', 'spells:flesh-to-stone:ok')).toMatchObject({ speedZero: true });
  });
  it('sürüm 54: diğer türler zar atar (Humanoid düşük save ile başarısız, Restrained)', () => {
    const r = stone(54, 'humanoid');
    expect(saves(r.events)[0]?.d20.length).toBeGreaterThan(0);
    expect(saves(r.events)[0]?.success).toBe(false);
    expect(r.state.combatants.F0?.conditions).toContain('Restrained');
  });
  it('sürüm 53 sabit: Construct da zar atar ve düşük save ile Restrained olur', () => {
    const r = stone(53, 'construct');
    expect(saves(r.events)[0]?.d20.length).toBeGreaterThan(0);
    expect(r.state.combatants.F0?.conditions).toContain('Restrained');
    expect(fx(r.state, 'F0', 'spells:flesh-to-stone')?.repeatSave?.autoTypes).toBeUndefined();
  });
  it('tur sonu save\'leri: etkideki tür listesiyle sonradan Construct olan da otomatik başarır (sürüm 53 listesiz)', () => {
    const turn = (s: BattleState) => endTurn(endTurn(s, 'A').state, 'F0');
    const tally = (k: number) => {
      let s = stone(k, 'humanoid').state;
      expect(s.combatants.F0?.conditions).toContain('Restrained');
      s = setC(s, 'F0', { creatureType: 'construct' });
      const r = turn(s);
      const tick = r.events.find((e) => e.type === 'effect_tick') as Extract<BattleEvent, { type: 'effect_tick' }> | undefined;
      return { tick, tally: fx(r.state, 'F0', 'spells:flesh-to-stone')?.repeatSave?.tally };
    };
    const v54 = tally(54);
    expect(v54.tick?.save).toMatchObject({ success: true, d20: [] });
    expect(v54.tally).toMatchObject({ s: 1, f: 0 });
    const v53 = tally(53);
    expect(v53.tick?.save?.success).toBe(false);
    expect(v53.tally).toMatchObject({ s: 0, f: 1 });
  });
  it('yüksek save\'li Humanoid sürüm 54\'te de zarla başarır (tür listesi yalnız Construct)', () => {
    const r = run(field([wiz(['Flesh to Stone']), foe('F0', { creatureType: 'humanoid', saves: HIGH })], pos, 54), cast('Flesh to Stone', { targetId: 'F0' }));
    expect(saves(r.events)[0]).toMatchObject({ success: true });
    expect(saves(r.events)[0]?.d20.length).toBeGreaterThan(0);
  });
});

describe('K70 madde 2: Disintegrate Wall of Force\'u yok eder (Forcecage değil)', () => {
  const PATH = [{ col: 5, row: 1 }, { col: 5, row: 2 }, { col: 5, row: 3 }, { col: 5, row: 4 }, { col: 5, row: 5 }];
  const P2 = { A: { col: 2, row: 3 }, D: { col: 9, row: 3 }, F0: { col: 7, row: 3 } };
  const disin = (p: Partial<Combatant> = {}) => mk('D', { side: 'enemies', hp: 200, maxHp: 200, spellNames: ['Disintegrate'], spellSlots: ALL, spellSaveDc: 18, spellAttack: 10, spellMod: 5, casterTag: 'sorcerer', ...p });
  /** A duvarı yapar, sıra D'ye geçer. */
  const walled = (k: number, name = 'Wall of Force', extra: Record<string, unknown> = { targetHex: PATH[0], targetHexes: PATH }) => {
    const s0 = field([wiz(['Wall of Force', 'Forcecage']), disin(), foe('F0', { speed: 30 })], P2, k);
    const r = run(s0, cast(name, extra));
    return { ...r.state, turnIndex: 1 } as BattleState;
  };
  const zap = (s: BattleState, at: { col: number; row: number }) => execute(s, { type: 'cast_spell', actorId: 'D', spellName: 'Disintegrate', targetHex: at } as Command, GM, () => 0.5);
  it('veri: SRD metni Wall of Force "A Disintegrate spell destroys the wall instantly"; liste yalnız wall-of-force', () => {
    expect(spells.find((x) => x.name === 'Disintegrate')?.mechanics.k70?.destroysForce).toEqual(['wall-of-force']);
  });
  it('sürüm 54: duvarın bir altıgenine Disintegrate bütün duvarı kaldırır; konsantrasyon biter; günlükte not; replay aynı', () => {
    const s = walled(54);
    expect(s.combatants.A?.concentration?.spell).toBe('Wall of Force');
    const r = run(s, { type: 'cast_spell', actorId: 'D', spellName: 'Disintegrate', targetHex: PATH[2] } as Command);
    expect(r.state.map?.zones?.some((z) => z.spellId === 'wall-of-force')).toBe(false);
    expect(r.state.combatants.A?.concentration ?? null).toBeNull();
    expect(r.events).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'zone_ended', reason: 'destroyed' }),
      expect.objectContaining({ type: 'spell_cast', label: 'Disintegrate', note: expect.stringMatching(/Wall of Force yok edildi/) })]));
    // Slot harcandı (6. seviye).
    expect(r.state.combatants.D?.spellSlots[5]).toBe((s.combatants.D?.spellSlots[5] ?? 0) - 1);
  });
  it('yok edilen altıgenler yürünebilir: F0 duvar hattının ötesine geçer (önce geçemez)', () => {
    const s = walled(54);
    const cross = (st: BattleState) => { const r = execute({ ...st, turnIndex: 2 }, { type: 'move', actorId: 'F0', to: { col: 4, row: 3 } } as Command, GM, () => 0.5); return r.ok ? r.state.combatants.F0?.pos?.col : null; };
    expect(cross(s)).not.toBe(4);
    const opened = run(s, { type: 'cast_spell', actorId: 'D', spellName: 'Disintegrate', targetHex: PATH[2] } as Command).state;
    expect(cross(opened)).toBe(4);
  });
  it('menzil ve hedef: duvarsız altıgen ya da 60 ft ötesi reddedilir', () => {
    const s = walled(54);
    const r1 = zap(s, { col: 7, row: 1 });
    expect(r1.ok ? null : r1.error).toMatch(/kuvvet duvarı yok/);
    // 15×7 alanda 60 ft'ten uzak altıgen yok: menzil denetimi kısa menzilli kopya büyüyle (aynı doğrulayıcı).
    const dis = spells.find((x) => x.name === 'Disintegrate') as NonNullable<(typeof spells)[number]>;
    expect(destroyForceProblem(s, s.combatants.D as Combatant, { ...dis, rangeFt: 15 }, PATH[2] as { col: number; row: number }, ['wall-of-force'])).toMatch(/menzili 15 ft/);
    expect(destroyForceProblem(s, s.combatants.D as Combatant, dis, PATH[2] as { col: number; row: number }, ['wall-of-force'])).toBeNull();
  });
  it('⚠ Forcecage etkilenmez (SRD Forcecage metninde Disintegrate yok): kafes kalır, büyü reddedilir', () => {
    const s = walled(54, 'Forcecage', { targetHex: { col: 7, row: 3 }, choice: 'kafes' });
    const cage = s.map?.zones?.find((z) => z.spellId === 'forcecage');
    expect(cage).toBeDefined();
    const r = zap(s, { col: 7, row: 3 });
    expect(r.ok).toBe(false);
    expect(s.map?.zones?.some((z) => z.spellId === 'forcecage')).toBe(true);
  });
  it('sürüm 53 sabit: altıgene Disintegrate yapılamaz (hedef ister), duvar kalır', () => {
    const s = walled(53);
    const r = zap(s, PATH[2] as { col: number; row: number });
    expect(r.ok ? null : r.error).toMatch(/Hedef seçmelisin/);
    expect(s.map?.zones?.some((z) => z.spellId === 'wall-of-force')).toBe(true);
  });
});
