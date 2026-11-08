/**
 * Kuyruk K70 (kural sürümü 54, büyü verisinde `k70` bloğu): küçük SRD farkları. Her madde sürüm 54'te yeni, sürüm 53'te eski
 * davranışla sabitlenir; replay `run` içinde denetlenir.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { execute } from './index';
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
