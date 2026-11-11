/**
 * Kuyruk MB1 (kural sürümü 68; `harita/belgeler/BINEK-PLAN.md` §7.2 MB1): binek çekirdek SRD kuralları.
 * Görev 0: BINEK-PLAN §1.1'deki açıkların her biri önce başarısız bir testle doğrulandı; düzeltmeden sonra yeşil.
 * 67'de eski davranış (her açığın eşi `v67` testleri).
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { occupantAt } from './movement';
import { GM, P1, mk } from './fixtures';
import { combatantFromSheet } from './create';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { Offset } from '../rules/hex';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';
import type { Rng } from '../rules/dice';

const o = (col: number, row: number): Offset => ({ col, row });
const SLOTS = [4, 3, 3, 0, 0, 0, 0, 0, 0];
const lo = () => 0.5;

/** Düz 15×7 harita: A binici (4,3), H binek (5,3), B düşman (6,3). Sıra A, H, B. */
function scene(v: number, a: Partial<Combatant> = {}, h: Partial<Combatant> = {}, b: Partial<Combatant> = {}, side: 'party' | 'enemies' = 'party'): BattleState {
  const foe = side === 'party' ? 'enemies' : 'party';
  const parts = [
    mk('A', { ownerId: side === 'party' ? 'p1' : null, side, size: 'M', speed: 30, spellSlots: SLOTS, spellNames: ['Misty Step'], spellAttack: 5, spellSaveDc: 13, spellMod: 3, ...a }),
    mk('H', { ownerId: side === 'party' ? 'p1' : null, side, size: 'L', speed: 60, hp: 30, maxHp: 30, ...h }),
    mk('B', { side: foe, ownerId: foe === 'party' ? 'p1' : null, hp: 50, maxHp: 50, strScore: 18, modifiers: { str: 4, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }, ...b }),
  ];
  const s0 = startBattle('b', 'd-z-zemin', parts, lo, { kuralSurumu: v, map: { id: 'col' } }).state;
  const cs = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: o(4, 3), H: o(5, 3), B: o(6, 3) })) cs[id] = { ...(cs[id] as Combatant), pos: p };
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, order: ['A', 'H', 'B'], turnIndex: 0, combatants: cs,
    map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
}
const ctxOf = (s: BattleState, cmd: Command) => ('actorId' in cmd && s.combatants[cmd.actorId]?.ownerId === 'p1' ? P1 : GM);
function run(s: BattleState, cmd: Command, rng: Rng = lo): { state: BattleState; events: BattleEvent[] } {
  const r = execute(s, cmd, ctxOf(s, cmd), rng);
  if (!r.ok) throw new Error(r.error);
  return r;
}
const err = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, ctxOf(s, cmd), lo); return r.ok ? null : r.error; };
const turn = (s: BattleState, id: string): BattleState => ({ ...s, turnIndex: s.order.indexOf(id) });
/** A bineğe biner; olay listesi replay için birikir. */
function mounted(v: number, a: Partial<Combatant> = {}, h: Partial<Combatant> = {}, b: Partial<Combatant> = {}, side: 'party' | 'enemies' = 'party') {
  const s = scene(v, a, h, b, side);
  const r = run(s, { type: 'mount', actorId: 'A', mountId: 'H' });
  return { start: s, state: r.state, events: [...r.events] };
}
/** Replay: komuttan önceki durumdan olaylar baştan oynanınca aynı durum. */
const chain = (before: BattleState, more: BattleEvent[]) => replay([{ type: 'battle_started', state: before }, ...more]);
const riding = (s: BattleState) => s.combatants.A?.riding;
const SAVES = (n: number) => ({ str: n, dex: n, con: n, int: n, wis: n, cha: n });

describe('MB1 Görev 0: açıkların doğrulanması (sürüm 68)', () => {
  it('açık 1: binicinin irtifası bineğe eşitlenir (uçan binek yükselince binici de yükselir, düşmez)', () => {
    const m = mounted(68, {}, { fly: 60 });
    const b0 = turn(m.state, 'H');
    const r = run(b0, { type: 'vertical_move', actorId: 'H', toFt: 20 } as Command);
    expect(r.state.combatants.H?.altitudeFt).toBe(20);
    expect(r.state.combatants.A?.altitudeFt).toBe(20);
    expect(riding(r.state)).toBe('H');
    expect(r.events.some((e) => e.type === 'altitude_changed' && e.targetId === 'A' && e.altitudeFt === 0)).toBe(false);
    // Binici hücre kaplamaz: bineğin altıgeninin sakini binek; binek aşağı inebilir (binici hücreyi tıkamaz).
    expect(occupantAt(r.state, o(5, 3), undefined, { lo: 4, hi: 4 })?.id).toBe('H');
    const down = run(r.state, { type: 'vertical_move', actorId: 'H', toFt: 10 } as Command);
    expect(down.state.combatants.A?.altitudeFt).toBe(10);
    expect(chain(b0, [...r.events, ...down.events])).toEqual(down.state);
  });

  it('açık 2: binicinin kendi ışınlanması geri alınmaz; binici iner (B24)', () => {
    const m = mounted(68);
    const r = run(m.state, { type: 'cast_spell', actorId: 'A', spellName: 'Misty Step', targetHex: o(8, 1) });
    expect(r.state.combatants.A?.pos).toEqual(o(8, 1));
    expect(riding(r.state)).toBeUndefined();
    expect(r.state.combatants.H?.rider).toBeUndefined();
    expect(r.events.some((e) => e.type === 'save_resolved' && e.label === 'Binekten düşme')).toBe(false);
    expect(chain(m.state, r.events)).toEqual(r.state);
  });

  it('açık 3: itilen binici geri çekilmez; iner, save yok, Prone yok (B9)', () => {
    const m = mounted(68, {}, {}, {});
    const b0 = turn(m.state, 'B');
    const r = run(b0, { type: 'shove', actorId: 'B', targetId: 'A', effect: 'push' }, () => 0.01);
    expect(r.events.some((e) => e.type === 'pushed' && e.targetId === 'A')).toBe(true);
    expect(r.state.combatants.A?.pos).not.toEqual(r.state.combatants.H?.pos);
    expect(riding(r.state)).toBeUndefined();
    expect(r.state.combatants.A?.conditions).not.toContain('Prone');
    expect(r.events.some((e) => e.type === 'save_resolved' && e.label === 'Binekten düşme')).toBe(false);
    expect(chain(b0, r.events)).toEqual(r.state);
  });

  it('açık 4: binek Prone olunca save başarılıysa binici üstte kalır (B8)', () => {
    const m = mounted(68, { saves: SAVES(20) }, { saves: SAVES(-20) });
    const b0 = turn(m.state, 'B');
    const r = run(b0, { type: 'shove', actorId: 'B', targetId: 'H', effect: 'prone' });
    expect(r.state.combatants.H?.conditions).toContain('Prone');
    expect(r.events.some((e) => e.type === 'save_resolved' && e.label === 'Binekten düşme' && e.success)).toBe(true);
    expect(riding(r.state)).toBe('H');
    expect(r.state.combatants.A?.conditions).not.toContain('Prone');
    // Binek yerde yatarken sonraki komutlar yeni save istemez (tetik yalnız yeni Prone'da).
    const r2 = run(r.state, { type: 'adjust_hp', targetId: 'B', hp: 49 } as Command);
    expect(r2.events.some((e) => e.type === 'save_resolved' && e.label === 'Binekten düşme')).toBe(false);
    expect(chain(b0, [...r.events, ...r2.events])).toEqual(r2.state);
  });

  it('açık 5: bineği isteği dışında itilen binici DEX 10; başarısızsa düşer ve Prone, başarılıysa bineğiyle gider', () => {
    const fail = mounted(68, { saves: SAVES(-20) }, { saves: SAVES(-20) });
    const bf = turn(fail.state, 'B');
    const rf = run(bf, { type: 'shove', actorId: 'B', targetId: 'H', effect: 'push' });
    expect(rf.events.some((e) => e.type === 'pushed' && e.targetId === 'H')).toBe(true);
    expect(rf.events.some((e) => e.type === 'save_resolved' && e.label === 'Binekten düşme' && !e.success)).toBe(true);
    expect(riding(rf.state)).toBeUndefined();
    expect(rf.state.combatants.A?.conditions).toContain('Prone');
    expect(chain(bf, rf.events)).toEqual(rf.state);
    const pass = mounted(68, { saves: SAVES(20) }, { saves: SAVES(-20) });
    const bp = turn(pass.state, 'B');
    const rp = run(bp, { type: 'shove', actorId: 'B', targetId: 'H', effect: 'push' });
    expect(riding(rp.state)).toBe('H');
    expect(rp.state.combatants.A?.pos).toEqual(rp.state.combatants.H?.pos);
    expect(chain(bp, rp.events)).toEqual(rp.state);
  });

  it('açık 6: yere serilen binici DEX 10; başarıda Prone olmaz ve üstte kalır, başarısızsa düşer (B8)', () => {
    const pass = mounted(68, { saves: SAVES(20) });
    // Shove'un kendi save'i STR/DEX en yükseği: +20 binici kurtulur; Prone'u zorlamak için saldıranın zarı değil, ayrı saves.
    const bp = turn(pass.state, 'B');
    const rp = run(bp, { type: 'set_condition', targetId: 'A', condition: 'Prone', present: true } as Command);
    expect(rp.events.some((e) => e.type === 'save_resolved' && e.label === 'Binekten düşme' && e.success)).toBe(true);
    expect(riding(rp.state)).toBe('H');
    expect(rp.state.combatants.A?.conditions).not.toContain('Prone');
    expect(chain(bp, rp.events)).toEqual(rp.state);
    const fail = mounted(68, { saves: SAVES(-20) });
    const bf = turn(fail.state, 'B');
    const rf = run(bf, { type: 'set_condition', targetId: 'A', condition: 'Prone', present: true } as Command);
    expect(riding(rf.state)).toBeUndefined();
    expect(rf.state.combatants.A?.conditions).toContain('Prone');
    expect(chain(bf, rf.events)).toEqual(rf.state);
  });

  it('açık 7: binicinin kendi dikey hareketi (uçuşu olsa da) reddedilir', () => {
    const m = mounted(68, { fly: 30 });
    expect(err(m.state, { type: 'vertical_move', actorId: 'A', toFt: 10 } as Command)).toMatch(/Bineğin üstündesin/);
    expect(err(m.state, { type: 'climb', actorId: 'A', to: o(5, 2) })).toMatch(/Bineğin üstündesin/);
    expect(err(m.state, { type: 'jump_down', actorId: 'A', to: o(5, 2) })).toMatch(/Bineğin üstündesin/);
  });

  it('açık 8: binme maliyeti hızın yarısı, 5 ft\'e aşağı yuvarlanır (B3)', () => {
    expect(mounted(68, { speed: 25 }).state.combatants.A?.movementUsed).toBe(2);
    expect(mounted(68, { speed: 30 }).state.combatants.A?.movementUsed).toBe(3);
    expect(mounted(68, { speed: 5 }).state.combatants.A?.movementUsed).toBe(1);
  });

  it('açık 9: ölen binekten binici save\'siz iner (B10)', () => {
    const m = mounted(68, { saves: SAVES(-20) }, {}, {}, 'enemies');
    const r = run(m.state, { type: 'adjust_hp', targetId: 'H', hp: 0 } as Command);
    expect(r.state.combatants.H?.life === 'dead' || (r.state.combatants.H?.hp ?? 1) <= 0).toBe(true);
    expect(riding(r.state)).toBeUndefined();
    expect(r.events.some((e) => e.type === 'save_resolved' && e.label === 'Binekten düşme')).toBe(false);
    expect(r.state.combatants.A?.conditions).not.toContain('Prone');
    expect(chain(m.state, r.events)).toEqual(r.state);
  });

  it('açık 10: Lance binekte değilken kalkanla kullanılamaz; binekte tek el (GWF yok) (B23)', () => {
    const sheet = { ...blankCharacter('x').sheet, name: 'f', classId: 'fighter', level: 5, baseScores: suggestedScores('fighter'),
      weapons: [{ name: 'Lance' }], shield: true, featureChoices: { 'fighter:fighting-style/1': 'great-weapon-fighting' } };
    const pc = combatantFromSheet(sheet as never, { id: 'A', ownerId: 'p1' });
    const lance = pc.weaponOptions.find((w) => w.weaponId === 'lance') as AttackOption;
    expect(lance).toBeTruthy();
    const s = scene(68, { ...pc, id: 'A', ownerId: 'p1', pos: null, speed: 30 });
    const atk = (st: BattleState): Command => ({ type: 'attack', actorId: 'A', targetId: 'B', option: lance });
    expect(err(s, atk(s))).toMatch(/Lance/);
    const m = run(s, { type: 'mount', actorId: 'A', mountId: 'H' });
    const r = run(m.state, atk(m.state));
    expect(r.events.some((e) => e.type === 'attack_resolved')).toBe(true);
  });
});

describe('MB1: 67 ve altı eski davranış', () => {
  it('67: binek Prone olunca başarılı save\'de de iner; ışınlanan binici geri çekilir; irtifa eşitlenmez', () => {
    const m = mounted(67, { saves: SAVES(20) }, { saves: SAVES(-20), fly: 60 });
    const b0 = turn(m.state, 'B');
    const r = run(b0, { type: 'shove', actorId: 'B', targetId: 'H', effect: 'prone' });
    expect(riding(r.state)).toBeUndefined();
    const t = mounted(67);
    const rt = run(t.state, { type: 'cast_spell', actorId: 'A', spellName: 'Misty Step', targetHex: o(8, 1) });
    expect(rt.state.combatants.A?.pos).toEqual(o(5, 3));
    expect(riding(rt.state)).toBe('H');
    const f = mounted(67, {}, { fly: 60 });
    const rf = run(turn(f.state, 'H'), { type: 'vertical_move', actorId: 'H', toFt: 20 } as Command);
    expect(rf.state.combatants.A?.altitudeFt ?? 0).toBe(0);
    expect(mounted(67, { speed: 25 }).state.combatants.A?.movementUsed).toBe(3);
    expect(chain(b0, r.events)).toEqual(r.state);
    expect(chain(t.state, rt.events)).toEqual(rt.state);
  });
});

describe('MB1: binekli sahneler (sürüm 68)', () => {
  const claw = { name: 'Claw', bonus: 4, damageDice: '1d6+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
  it('fırsat saldırısı yalnız bineğe (B7); binici bineğiyle taşınır', () => {
    const m = mounted(68, {}, {}, { attacks: [claw] });
    const b0 = turn(m.state, 'H');
    const r = run(b0, { type: 'move', actorId: 'H', to: o(2, 3) });
    const opp = r.events.filter((e) => e.type === 'attack_resolved' && e.opportunity);
    expect(opp.length).toBe(1);
    expect(opp.every((e) => e.type === 'attack_resolved' && e.targetId === 'H')).toBe(true);
    expect(r.state.combatants.A?.pos).toEqual(o(2, 3));
    expect(riding(r.state)).toBe('H');
    expect(chain(b0, r.events)).toEqual(r.state);
  });

  it('alan büyüsü binici ve bineği ayrı hedef sayar (iki save)', () => {
    const m = mounted(68, {}, {}, { spellSlots: [0, 0, 1, 0, 0, 0, 0, 0, 0], spellNames: ['Fireball'], spellSaveDc: 13, spellMod: 3 });
    const b0 = turn(m.state, 'B');
    const r = run(b0, { type: 'cast_spell', actorId: 'B', spellName: 'Fireball', targetHex: o(4, 1) } as Command);
    const saved = r.events.filter((e) => e.type === 'save_resolved' && e.label !== 'Binekten düşme').map((e) => e.type === 'save_resolved' ? e.targetId : '');
    expect(saved).toContain('A');
    expect(saved).toContain('H');
    expect(chain(b0, r.events)).toEqual(r.state);
  });

  it('B13: binicisi üstündeki binek kazamaz; binicisiz kazar', () => {
    const m = mounted(68, {}, { burrowFt: 20 });
    expect(err(turn(m.state, 'H'), { type: 'vertical_move', actorId: 'H', toFt: -5 } as Command)).toMatch(/kazılamaz/);
    expect(err(turn(scene(68, {}, { burrowFt: 20 }), 'H'), { type: 'vertical_move', actorId: 'H', toFt: -5 } as Command)).toBeNull();
  });

  it('B11: tavan bineğin ve binicinin boyunu birlikte sığdırmalı; binicili uçan binek tavana göre kırpılır', () => {
    const low = (id: string, v: number): BattleState => {
      const s = scene(v, {}, { fly: 60 });
      return { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), id, variantId: undefined as never } };
    };
    // 10 ft tavan: Large binek (10 ft) + Medium binici (5 ft) sığmaz.
    expect(err(low('kasaba-lagim', 68), { type: 'mount', actorId: 'A', mountId: 'H' })).toMatch(/Tavan alçak/);
    expect(err(low('kasaba-lagim', 67), { type: 'mount', actorId: 'A', mountId: 'H' })).toBeNull();
    // 15 ft tavan: binilir; binicisiz Large uçan 5 ft'e çıkabilir, binicisiyle çıkamaz (yığın 15 ft).
    const d = low('dungeon', 68);
    const free = run(turn(d, 'H'), { type: 'vertical_move', actorId: 'H', toFt: 5 } as Command);
    expect(free.state.combatants.H?.altitudeFt).toBe(5);
    const md = run(d, { type: 'mount', actorId: 'A', mountId: 'H' });
    const up = execute(turn(md.state, 'H'), { type: 'vertical_move', actorId: 'H', toFt: 5 } as Command, P1, lo);
    expect(up.ok ? up.state.combatants.H?.altitudeFt ?? 0 : 0).toBe(0);
  });
});
