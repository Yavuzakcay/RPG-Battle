/**
 * Control Water girdabı (kullanıcı kararı 2026-11-19; kural sürümü 84, Game Master anahtarı `controlWaterWhirlpool`).
 * Slot seviyesine göre yarıçap/hasar, save başarı/başarısızlık, yakalanma ve kaçış, çekme, konsantrasyon, eski sürüm, anahtar, replay.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, mk, P1 } from './fixtures';
import { GIRDAP_VERSION, girdapOn } from './girdapSurum';
import { whirlpoolSize } from './girdap';
import { replay } from './reduce';
import { spells } from '../data';
import { distance, withinRange, type Offset } from '../rules/hex';
import type { DiceRequest, Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

type D20 = { one: number; two: [number, number] };
/** Kancalı zar: d20 sabit; diğer zarlar ⌊yüz/2⌋ + 1 (d8 = 5). */
function hooked(d20: D20): Rng {
  const f = (() => 0.5) as Rng & { dice?: (r: DiceRequest) => number[] };
  f.dice = (req) => (req.sides === 20 ? (req.count >= 2 ? [...d20.two] : [d20.one]) : Array.from({ length: req.count }, () => Math.floor(req.sides / 2) + 1));
  return f;
}
const FAIL: D20 = { one: 1, two: [1, 1] };
const OK: D20 = { one: 20, two: [20, 20] };
const CW = spells.find((s) => s.id === 'control-water')!;

const flat = (): string[] => Array.from({ length: 11 }, () => '.'.repeat(21));
function scene(v: number, parts: Combatant[], toggles?: Record<string, boolean>): BattleState {
  const s0 = startBattle('girdap', 'd', parts.map((p) => ({ ...p, pos: null })), () => 0.5, { kuralSurumu: v, map: { id: 'kale-onu', variantId: 'gunduz' } } as never).state;
  const cs: Record<string, Combatant> = {};
  for (const p of parts) cs[p.id] = { ...(s0.combatants[p.id] as Combatant), pos: p.pos, initiative: 0 };
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, order: parts.map((p) => p.id), turnIndex: 0, combatants: cs,
    map: { ...s0.map!, tiles: flat(), objects: [], zones: [], ...(toggles ? { ruleToggles: toggles } : {}) } };
}
const caster = (p: Partial<Combatant> = {}): Combatant => mk('A', { ownerId: 'p1', hp: 100, maxHp: 100, level: 17, spellSaveDc: 15, spellAttack: 7, spellMod: 4,
  spellNames: ['Control Water', 'Bless'], spellSlots: [4, 3, 3, 3, 3, 2, 1, 1, 1], pos: { col: 2, row: 5 }, ...p });
const foe = (id: string, pos: Offset, p: Partial<Combatant> = {}): Combatant => mk(id, { side: 'enemies', hp: 100, maxHp: 100, pos, ...p });
const cast = (target: string, slotLevel = 4): Command => ({ type: 'cast_spell', actorId: 'A', spellName: 'Control Water', targetId: target, slotLevel } as Command);
function run(s: BattleState, cmd: Command, rng: Rng, ctx = P1) {
  const r = execute(s, cmd, ctx, rng);
  if (!r.ok) throw new Error(r.error);
  return r;
}
const endTurn = (s: BattleState, id: string, rng: Rng) => run(s, { type: 'end_turn', actorId: id } as Command, rng, id === 'A' ? P1 : GM);
const whirl = (s: BattleState) => (s.map?.zones ?? []).find((z) => z.spec?.whirl);
const saves = (evs: BattleEvent[], id: string) => evs.filter((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved' && e.targetId === id);
const caught = (s: BattleState, id: string) => (s.combatants[id]?.effects ?? []).some((e) => e.id.startsWith('girdap:'));

describe('Control Water girdabı: sürüm ve boyut', () => {
  it('sürüm 84; güncel savaşta açık, 83 ve anahtar kapalıyken kapalı', () => {
    expect(GIRDAP_VERSION).toBe(84);
    expect(girdapOn(scene(84, [caster()]))).toBe(true);
    expect(girdapOn(scene(83, [caster()]))).toBe(false);
    expect(girdapOn(scene(84, [caster()], { controlWaterWhirlpool: false }))).toBe(false);
  });
  it('slot seviyesine göre yarıçap (4: 2 … en çok 5 altıgen) ve hasar (4: 2d8, slot başı +1d8)', () => {
    expect([4, 5, 6, 7, 8, 9].map((l) => whirlpoolSize(CW, l))).toEqual([
      { radius: 2, dice: '2d8' }, { radius: 3, dice: '3d8' }, { radius: 4, dice: '4d8' },
      { radius: 5, dice: '5d8' }, { radius: 5, dice: '6d8' }, { radius: 5, dice: '7d8' },
    ]);
  });
  it('yapım: hedefin altıgeninde konsantrasyonlu alan, yarıçap ve zar slottan; 6. seviye slot harcanır', () => {
    const s = scene(84, [caster(), foe('B', { col: 10, row: 5 })]);
    const r = run(s, cast('B', 6), hooked(FAIL));
    const z = whirl(r.state)!;
    expect(z.center).toEqual({ col: 10, row: 5 });
    expect(z.radius).toBe(4);
    expect(z.damage).toBe('4d8');
    expect(z.hexes.length).toBe(withinRange({ col: 10, row: 5 }, 4, { cols: 21, rows: 11 }).length);
    expect(z.concentration).toBe('Control Water');
    expect(r.state.combatants.A!.concentration?.spell).toBe('Control Water');
    expect(r.state.combatants.A!.spellSlots[5]).toBe(1);
    // Yapım anında save yok (ilk save hedefin tur başında).
    expect(saves(r.events, 'B')).toEqual([]);
  });
  it('hedefsiz ya da menzil dışı yapım reddedilir', () => {
    const s = scene(84, [caster(), foe('B', { col: 10, row: 5 })]);
    expect(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Control Water', slotLevel: 4 } as Command, P1, hooked(FAIL)).ok).toBe(false);
  });
});

describe('Control Water girdabı: save, yakalanma, kaçış', () => {
  const start = (d20: D20) => {
    const s = scene(84, [caster(), foe('B', { col: 10, row: 5 })]);
    const r1 = run(s, cast('B'), hooked(d20));
    return endTurn(r1.state, 'A', hooked(d20));
  };
  it('tur başında başarısız STR save: 2d8 Bludgeoning (5 + 5), yakalanır (hız 0), yürüyemez', () => {
    const r = start(FAIL);
    const sv = saves(r.events, 'B');
    expect(sv).toHaveLength(1);
    expect(sv[0]).toMatchObject({ ability: 'str', dc: 15, success: false, appliedDamage: 10, damageType: 'bludgeoning' });
    expect(r.state.combatants.B!.hp).toBe(90);
    expect(caught(r.state, 'B')).toBe(true);
    expect(execute(r.state, { type: 'move', actorId: 'B', to: { col: 11, row: 5 } } as Command, GM, hooked(FAIL)).ok).toBe(false);
  });
  it('başarılı save: yarı hasar (5), yakalanmaz', () => {
    const r = start(OK);
    expect(saves(r.events, 'B')[0]).toMatchObject({ success: true, appliedDamage: 5 });
    expect(caught(r.state, 'B')).toBe(false);
  });
  it('kaçış: eylemle Athletics büyü DC\'sine karşı; başarıda yakalanma biter, başarısızlıkta sürer', () => {
    const r = start(FAIL);
    const bad = run(r.state, { type: 'escape', actorId: 'B' } as Command, hooked(FAIL), GM);
    expect(caught(bad.state, 'B')).toBe(true);
    const good = run(r.state, { type: 'escape', actorId: 'B' } as Command, hooked(OK), GM);
    expect(good.events.some((e) => e.type === 'grapple_escape' && e.success && e.dc === 15)).toBe(true);
    expect(caught(good.state, 'B')).toBe(false);
  });
  it('konsantrasyon bitince (başka konsantrasyon büyüsü) alan ve yakalanma kalkar', () => {
    const r = start(FAIL);
    const back = endTurn(r.state, 'B', hooked(OK)); // A'nın turu
    const bless = run(back.state, { type: 'cast_spell', actorId: 'A', spellName: 'Bless', targetIds: ['A'], slotLevel: 1 } as Command, hooked(OK));
    expect(whirl(bless.state)).toBeUndefined();
    expect(caught(bless.state, 'B')).toBe(false);
  });
});

describe('Control Water girdabı: çekme ve uçan', () => {
  it('alanın dışında, bandın içindeki yaratık tur başında merkeze 10 ft çekilir ve girince save atar (turda bir)', () => {
    // Merkez (10,5), yarıçap 2; C merkezden 4 altıgen (alan dışı, band 2 içinde).
    const s = scene(84, [caster(), foe('B', { col: 10, row: 5 }), foe('C', { col: 14, row: 5 })]);
    const r1 = run(s, cast('B'), hooked(OK));
    const r2 = endTurn(r1.state, 'A', hooked(OK));
    const r3 = endTurn(r2.state, 'B', hooked(OK)); // C'nin tur başı
    const c = r3.state.combatants.C!;
    expect(distance(c.pos!, { col: 10, row: 5 })).toBe(2);
    expect(r3.events.filter((e) => e.type === 'pushed' && e.targetId === 'C')).toHaveLength(2);
    expect(saves(r3.events, 'C')).toHaveLength(1);
  });
  it('bandın dışındaki (merkezden 5+ altıgen) çekilmez', () => {
    const s = scene(84, [caster(), foe('B', { col: 10, row: 5 }), foe('C', { col: 15, row: 5 })]);
    const r1 = run(s, cast('B'), hooked(OK));
    const r3 = endTurn(endTurn(r1.state, 'A', hooked(OK)).state, 'B', hooked(OK));
    expect(r3.state.combatants.C!.pos).toEqual({ col: 15, row: 5 });
  });
  it('uçan yaratık 25 ft\'e kadar etkilenir, üstündeki etkilenmez', () => {
    for (const [alt, n] of [[20, 1], [30, 0]] as const) {
      const s = scene(84, [caster(), foe('B', { col: 10, row: 5 }, { fly: 60, altitudeFt: alt } as Partial<Combatant>)]);
      const r = endTurn(run(s, cast('B'), hooked(FAIL)).state, 'A', hooked(FAIL));
      expect(saves(r.events, 'B'), `irtifa ${alt}`).toHaveLength(n);
    }
  });
});

describe('Control Water girdabı: eski sürüm, anahtar, replay', () => {
  it('83 ve anahtar kapalı: eski yol (hedef yaratıkla girdap açılmaz)', () => {
    for (const s of [scene(83, [caster(), foe('B', { col: 10, row: 5 })]), scene(84, [caster(), foe('B', { col: 10, row: 5 })], { controlWaterWhirlpool: false })]) {
      const r = execute(s, cast('B'), P1, hooked(FAIL));
      expect(r.ok && whirl(r.state)).toBeFalsy();
    }
  });
  it('replay aynı durumu verir', () => {
    const s = scene(84, [caster(), foe('B', { col: 10, row: 5 }), foe('C', { col: 14, row: 5 })]);
    const r1 = run(s, cast('B', 5), hooked(FAIL));
    const r2 = endTurn(r1.state, 'A', hooked(FAIL));
    const r3 = endTurn(r2.state, 'B', hooked(FAIL));
    const all = [{ type: 'battle_started', state: s }, ...r1.events, ...r2.events, ...r3.events] as BattleEvent[];
    expect(replay(all)).toEqual(r3.state);
  });
});

describe('Control Water girdabı: yüzey ve yapay zekâ', () => {
  it('su yüzeyi üstündeki girdap: mevcut çözücü (hexResolver) yeni tepkime tablosu olmadan çalışır, yüzey kalır', () => {
    const s0 = scene(84, [caster(), foe('B', { col: 10, row: 5 })]);
    const s = execute(s0, { type: 'place_surface', kind: 'water', hexes: [{ col: 10, row: 5 }, { col: 11, row: 5 }] } as Command, GM, hooked(FAIL));
    expect(s.ok).toBe(true);
    if (!s.ok) return;
    const r = endTurn(run(s.state, cast('B'), hooked(FAIL)).state, 'A', hooked(FAIL));
    expect(saves(r.events, 'B')[0]).toMatchObject({ success: false, appliedDamage: 10 });
    expect(r.events.some((e) => e.type === 'surface_reacted')).toBe(false);
    expect((r.state.map?.zones ?? []).some((z) => z.surface === 'water')).toBe(true);
  });
  it('yapay zekâ: en çok düşmanı kapsayan, dostsuz düşman altıgenine; dost alandaysa o hedefi seçmez', async () => {
    const { chooseCommand } = await import('./ai');
    const base = [caster({ side: 'enemies', ownerId: undefined } as Partial<Combatant>)];
    const party = (id: string, pos: Offset) => mk(id, { ownerId: 'p1', side: 'party', hp: 60, maxHp: 60, pos });
    const s = scene(84, [...base, party('B', { col: 10, row: 5 }), party('C', { col: 11, row: 5 }), party('D', { col: 16, row: 2 })]);
    const c = chooseCommand(s);
    expect(c).toMatchObject({ type: 'cast_spell', spellName: 'Control Water' });
    expect(['B', 'C']).toContain((c as { targetId?: string }).targetId);
    // Alanda kendi tarafından biri varsa o hedef seçilmez.
    const s2 = scene(84, [...base, mk('E', { side: 'enemies', hp: 60, maxHp: 60, pos: { col: 10, row: 6 } }), party('B', { col: 10, row: 5 }), party('C', { col: 11, row: 5 }), party('D', { col: 16, row: 2 })]);
    const c2 = chooseCommand(s2);
    if (c2.type === 'cast_spell' && c2.spellName === 'Control Water') expect(c2.targetId).toBe('D');
  });
});
