/**
 * Kuyruk MB2 (kural sürümü 74; `harita/belgeler/BINEK-PLAN.md` §3.3, §17): kontrollü binek turu. Kontrollü binek kendi turunu
 * almaz, binicinin turunda ve binicinin kararıyla hareket eder; eylemi yalnız Dash, Disengage ya da Dodge. 73'te eski davranış.
 */
import { afterEach, describe, expect, it } from 'vitest';
import binekPack from '../../tests/fixtures/paket-binek.json';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { currentActorId } from './common';
import { chooseCommand } from './ai';
import { bodyOf } from './body';
import { GM, P1, mk } from './fixtures';
import { validatePack } from '../content/schema';
import { applyPackSubclasses } from '../content/paket';
import { classData } from '../data';
import { kitArena } from './k54bKit';
import { distance, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row = 3): Offset => ({ col, row });
const lo: Rng = () => 0.5;
const open = () => Array.from({ length: 7 }, () => '.'.repeat(15));
const SAVES = (n: number) => ({ str: n, dex: n, con: n, int: n, wis: n, cha: n });
const sword: AttackOption = { label: 'Longsword', attackBonus: 9, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'longsword' };
const claw = { name: 'Claw', bonus: 4, damageDice: '1d6+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
const hoof = { name: 'Hooves', bonus: 6, damageDice: '2d6+4', damageType: 'bludgeoning', repeat: 1, ranged: false, reachFt: 5, text: '' };

interface Opts { pos?: Record<string, [Offset, number?]>; multiHex?: boolean }
/** 15×7 düz harita: A binici (4,3), H eğitimli Warhorse (5,3, Large), B düşman (11,3). Sıra A, B, H (binek binicinin ardında değil). */
function scene(v: number, a: Partial<Combatant> = {}, h: Partial<Combatant> = {}, b: Partial<Combatant> = {}, op: Opts = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', size: 'M', speed: 30, hp: 40, maxHp: 40, initiative: 15, weaponOptions: [sword], ...a }),
    mk('H', { ownerId: 'p1', monsterId: 'warhorse', size: 'L', speed: 60, hp: 40, maxHp: 40, initiative: 5, attacks: [hoof], ...h }),
    mk('B', { side: 'enemies', hp: 50, maxHp: 50, initiative: 10, weaponOptions: [sword], attacks: [claw], ...b }),
  ];
  const s0 = startBattle('b', 'd-z-zemin', parts, lo, { kuralSurumu: v, map: { id: 'col', variantId: 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const cs = { ...s0.combatants };
  const pos = { A: [o(4)], H: [o(5)], B: [o(11)], ...op.pos } as Record<string, [Offset, number?]>;
  for (const [id, [p, alt]] of Object.entries(pos)) cs[id] = { ...(cs[id] as Combatant), pos: p, ...(alt ? { altitudeFt: alt } : {}) };
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, order: ['A', 'B', 'H'], turnIndex: 0, combatants: cs, ...(op.multiHex ? { multiHex: true } : {}),
    map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: open(), objects: [] } };
}
const ctxOf = (s: BattleState, cmd: Command) => ('actorId' in cmd && s.combatants[cmd.actorId]?.ownerId === 'p1' ? P1 : GM);
function run(s: BattleState, cmd: Command, rng: Rng = lo): { state: BattleState; events: BattleEvent[] } {
  const r = execute(s, cmd, ctxOf(s, cmd), rng);
  if (!r.ok) throw new Error(r.error);
  return r;
}
const err = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, ctxOf(s, cmd), lo); return r.ok ? null : r.error; };
const chain = (before: BattleState, evs: BattleEvent[]) => replay([{ type: 'battle_started', state: before }, ...evs]);
const C = (s: BattleState, id: string) => s.combatants[id] as Combatant;
const end = (s: BattleState) => run(s, { type: 'end_turn', actorId: currentActorId(s) });
/** Bir komut dizisi; her adımın olayları birikir (replay için). */
function seq(s0: BattleState, cmds: Command[]): { state: BattleState; events: BattleEvent[] } {
  let state = s0; const events: BattleEvent[] = [];
  for (const c of cmds) { const r = c.type === 'end_turn' ? end(state) : run(state, c); state = r.state; events.push(...r.events); }
  return { state, events };
}
const mountA = (s: BattleState) => run(s, { type: 'mount', actorId: 'A', mountId: 'H' });

describe('MB2: binince kontrol (sürüm 74)', () => {
  it('eğitimli bineğe binince kontrollü olur: sırası binicinin ardına, inisiyatifi binicininki; geçerli savaşçı aynı', () => {
    const s = scene(74);
    const r = mountA(s);
    expect(r.events.find((e) => e.type === 'mounted')).toMatchObject({ control: 'kontrollu' });
    expect(C(r.state, 'H')).toMatchObject({ controlledBy: 'A', initiative: C(s, 'A').initiative });
    expect(r.state.order).toEqual(['A', 'H', 'B']);
    expect(currentActorId(r.state)).toBe('A');
    expect(chain(s, r.events)).toEqual(r.state);
  });

  it('MB8: Mastiff eğitimli binek (SRD s. 15, 100): Small binici binince kontrollü; Medium binici binemez (bir boy büyük kuralı)', () => {
    const small = mountA(scene(74, { size: 'S', speed: 25 }, { monsterId: 'mastiff', size: 'M', speed: 40 }));
    expect(small.events.find((e) => e.type === 'mounted')).toMatchObject({ control: 'kontrollu' });
    expect(C(small.state, 'H').controlledBy).toBe('A');
    expect(err(scene(74, {}, { monsterId: 'mastiff', size: 'M', speed: 40 }), { type: 'mount', actorId: 'A', mountId: 'H' })).toMatch(/boy büyük/);
  });

  it('eğitimsiz binek (veride yok) bağımsız kalır; 73\'te eğitimli binek de bağımsız', () => {
    const wild = mountA(scene(74, {}, { monsterId: undefined }));
    expect(C(wild.state, 'H').controlledBy).toBeUndefined();
    expect(wild.state.order).toEqual(['A', 'B', 'H']);
    const old = mountA(scene(73));
    expect(old.events.find((e) => e.type === 'mounted')).not.toHaveProperty('control');
    expect(C(old.state, 'H').controlledBy).toBeUndefined();
  });

  it('Find Steed ve Phantom Steed veriden kontrollü; paket yaratığında `kontrol` alanı', () => {
    const steedOf = (spell: string, extra: Record<string, unknown> = {}) => {
      const a = mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellAttack: 5, spellSaveDc: 13, spellMod: 3, level: 9, initiative: 10,
        spellNames: [spell], spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0] });
      const s0 = startBattle('s', 'd-z-zemin', [a, mk('B', { side: 'enemies', hp: 40, maxHp: 40 })], lo, { kuralSurumu: 74, map: { id: 'col' } }).state;
      const cs = { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), pos: o(3) }, B: { ...(s0.combatants.B as Combatant), pos: o(10) } };
      const st: BattleState = { ...s0, status: spell === 'Phantom Steed' ? 'setup' : 'active', turnIndex: 0, combatants: cs, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: open() } };
      const r = execute(st, { type: 'cast_spell', actorId: 'A', spellName: spell, targetHex: o(4), ...extra } as Command, P1, lo);
      if (!r.ok) throw new Error(r.error);
      return Object.values(r.state.combatants).find((c) => c.summon?.by === 'A' && !c.summon.gone) as Combatant;
    };
    expect(steedOf('Find Steed', { choice: 'celestial' }).summon?.mount?.controlled).toBe(true);
    expect(steedOf('Phantom Steed').summon?.mount?.controlled).toBe(true);
    const pack = JSON.parse(JSON.stringify(binekPack)) as { yaratiklar: Array<Record<string, unknown>> };
    (pack.yaratiklar[0] as Record<string, unknown>).binek = { kural: 'sahip', kontrol: 'kontrollu' };
    const ok = validatePack(pack, { taken: classData.subclasses.map((s) => s.id), packs: [] });
    expect(ok.ok).toBe(true);
    (pack.yaratiklar[0] as Record<string, unknown>).binek = { kontrol: 'yarim' };
    expect(validatePack(pack, { taken: [], packs: [] }).ok).toBe(false);
  });
});

describe('MB2: binicinin turunda binek (sürüm 74)', () => {
  it('binek binicinin turunda yürür, Dash ve Disengage ile Dodge yapar; başka eylem ve tur bitirme reddedilir', () => {
    const s = mountA(scene(74)).state;
    const mv = run(s, { type: 'move', actorId: 'H', to: o(8) });
    expect(C(mv.state, 'H').pos).toEqual(o(8));
    expect(C(mv.state, 'A').pos).toEqual(o(8));
    expect(currentActorId(mv.state)).toBe('A');
    expect(err(mv.state, { type: 'monster_attack', actorId: 'H', targetId: 'B', attackIndex: 0 } as Command)).toMatch(/Dash, Disengage ya da Dodge/);
    expect(err(mv.state, { type: 'end_turn', actorId: 'H' })).toMatch(/binicinin turuyla biter/);
    expect(err(mv.state, { type: 'dash', actorId: 'H' })).toBeNull();
    expect(err(mv.state, { type: 'disengage', actorId: 'H' })).toBeNull();
    const dodge = run(mv.state, { type: 'dodge', actorId: 'H' });
    expect(C(dodge.state, 'H').conditions).toContain('Dodge');
    // Binicinin kendi eylemi serbest (vur-kaç: binek gitti, binici saldırır).
    expect(err(dodge.state, { type: 'attack', actorId: 'A', targetId: 'B', option: sword })).not.toBeNull(); // menzil dışı
    expect(chain(s, [...mv.events, ...dodge.events])).toEqual(dodge.state);
  });

  it('binicinin yürüyüş komutu kontrollü bineğine gider (arayüzün mevcut "yürü" dokunuşu); 73\'te binici yürüyemez', () => {
    const s = mountA(scene(74)).state;
    const r = run(s, { type: 'move', actorId: 'A', to: o(9) });
    expect(r.events.find((e) => e.type === 'moved')).toMatchObject({ actorId: 'H' });
    expect(C(r.state, 'H').pos).toEqual(o(9));
    expect(C(r.state, 'A').movementUsed).toBe(C(s, 'A').movementUsed);
    expect(err(mountA(scene(73)).state, { type: 'move', actorId: 'A', to: o(9) })).not.toBeNull();
  });

  it('binek kendi turunu almaz; binicinin turunun başında hareketi tazelenir; binicinin turu dışında komut almaz', () => {
    const s = mountA(scene(74)).state;
    const r = seq(s, [{ type: 'move', actorId: 'H', to: o(14) } as Command, { type: 'end_turn', actorId: 'A' }]);
    expect(currentActorId(r.state)).toBe('B');
    expect(err(r.state, { type: 'move', actorId: 'H', to: o(13) })).toMatch(/yalnız binicisinin/);
    const back = end(r.state);
    expect(currentActorId(back.state)).toBe('A');
    expect(back.state.round).toBe(2);
    expect(C(back.state, 'H').movementUsed).toBe(0);
    expect(C(back.state, 'H').ridTurn).toMatchObject({ by: 'A', round: 2 });
    expect(chain(s, [...r.events, ...back.events])).toEqual(back.state);
  });

  it('bineğin tur başı kancaları binicininkiyle çalışır: Dodge binicinin sonraki turunun başında biter', () => {
    const s = mountA(scene(74)).state;
    const r = seq(s, [{ type: 'dodge', actorId: 'H' } as Command, { type: 'end_turn', actorId: 'A' }]);
    expect(C(r.state, 'H').conditions).toContain('Dodge');
    const b = end(r.state);
    expect(currentActorId(b.state)).toBe('A');
    expect(C(b.state, 'H').conditions).not.toContain('Dodge');
  });

  it('fırsat saldırısı yalnız bineğe (B7): kontrollü binek düşmanın erişiminden çıkar', () => {
    const s = mountA(scene(74, {}, {}, {}, { pos: { B: [o(6)] } })).state;
    const r = run(s, { type: 'move', actorId: 'H', to: o(1) });
    const opp = r.events.filter((e) => e.type === 'attack_resolved' && e.opportunity);
    expect(opp.length).toBe(1);
    expect(opp.every((e) => e.type === 'attack_resolved' && e.targetId === 'H')).toBe(true);
    expect(chain(s, r.events)).toEqual(r.state);
    // Disengage ile fırsat saldırısı yok.
    const d = seq(s, [{ type: 'disengage', actorId: 'H' } as Command, { type: 'move', actorId: 'H', to: o(1) } as Command]);
    expect(d.events.some((e) => e.type === 'attack_resolved' && e.opportunity)).toBe(false);
  });
});

describe('MB2: bağımsıza dönüş (sürüm 74)', () => {
  it('inince kontrol düşer; binek bu tur yeniden oynamaz (çift tur yok), sonraki turdan binicinin ardında oynar', () => {
    const s = mountA(scene(74)).state;
    const r = seq(s, [{ type: 'move', actorId: 'H', to: o(8) } as Command, { type: 'dismount', actorId: 'A' } as Command, { type: 'end_turn', actorId: 'A' }]);
    expect(C(r.state, 'H').controlledBy).toBeUndefined();
    expect(currentActorId(r.state)).toBe('B');
    const r2 = seq(r.state, [{ type: 'end_turn', actorId: 'B' }, { type: 'end_turn', actorId: 'A' }]);
    expect(currentActorId(r2.state)).toBe('H');
    expect(r2.state.round).toBe(2);
    expect(chain(s, [...r.events, ...r2.events])).toEqual(r2.state);
  });

  it('binici Incapacitated iken binek bağımsız: binicinin ardından kendi turunu alır', () => {
    const s = mountA(scene(74)).state;
    const r = seq(s, [{ type: 'end_turn', actorId: 'A' }, { type: 'end_turn', actorId: 'B' }]);
    expect(currentActorId(r.state)).toBe('A');
    const stun = run(r.state, { type: 'set_condition', targetId: 'A', condition: 'Stunned', present: true } as Command);
    expect(err(stun.state, { type: 'move', actorId: 'H', to: o(9) })).not.toBeNull();
    const t = end(stun.state);
    expect(currentActorId(t.state)).toBe('B');
    const t2 = seq(t.state, [{ type: 'end_turn', actorId: 'B' }, { type: 'end_turn', actorId: 'A' }]);
    expect(currentActorId(t2.state)).toBe('H');
  });

  it('binek ölünce binici iner (B10), kontrol düşer; itilen kontrollü binekte DEX 10 aynen (B8)', () => {
    const s = mountA(scene(74)).state;
    const dead = run(s, { type: 'adjust_hp', targetId: 'H', hp: 0 } as Command);
    expect(C(dead.state, 'A').riding).toBeUndefined();
    expect(C(dead.state, 'H').controlledBy).toBeUndefined();
    const p = mountA(scene(74, { saves: SAVES(20) }, { saves: SAVES(-20) }, { size: 'L' }, { pos: { B: [o(6)] } })).state;
    const pb = end(p).state;
    const shove = run(pb, { type: 'shove', actorId: 'B', targetId: 'H', effect: 'push' });
    expect(shove.events.some((e) => e.type === 'save_resolved' && e.label === 'Binekten düşme')).toBe(true);
    expect(C(shove.state, 'A').riding).toBe('H');
    expect(C(shove.state, 'H').controlledBy).toBe('A');
  });
});

describe('MB2: uçan, çok altıgenli, Lance, YZ (sürüm 74)', () => {
  it('uçan kontrollü binek binicinin turunda yükselir; binici izler', () => {
    const s = mountA(scene(74, {}, { fly: 60 })).state;
    const up = run(s, { type: 'vertical_move', actorId: 'H', toFt: 20 } as Command);
    expect(C(up.state, 'A').altitudeFt).toBe(20);
    expect(chain(s, up.events)).toEqual(up.state);
  });

  it('çok altıgenli kontrollü binek (Huge) gövdesiyle yürür; iniş gövdenin dışına', () => {
    const s = mountA(scene(74, {}, { size: 'H' }, {}, { multiHex: true, pos: { A: [o(4)], H: [o(6)] } })).state;
    expect(C(s, 'H').controlledBy).toBe('A');
    const mv = run(s, { type: 'move', actorId: 'H', to: o(9) });
    expect(C(mv.state, 'A').pos).toEqual(o(9));
    const d = run(mv.state, { type: 'dismount', actorId: 'A' });
    const fp = bodyOf(d.state, C(d.state, 'H'));
    expect(fp.some((h) => h.col === C(d.state, 'A').pos?.col && h.row === C(d.state, 'A').pos?.row)).toBe(false);
  });

  it('Lance (B23): kontrollü binekte kalkanla tek elle kullanılır', () => {
    const lance: AttackOption = { label: 'Lance', attackBonus: 7, damage: '1d10+4', damageType: 'piercing', ranged: false, spell: false, tag: 'lance', weaponId: 'lance', reachFt: 10, unlessMounted: true, handBusy: true } as AttackOption;
    const s = mountA(scene(74, { weaponOptions: [lance] }, {}, {}, { pos: { B: [o(7)] } })).state;
    expect(err(s, { type: 'attack', actorId: 'A', targetId: 'B', option: lance })).toBeNull();
    expect(err(scene(74, { weaponOptions: [lance] }, {}, {}, { pos: { B: [o(6)] } }), { type: 'attack', actorId: 'A', targetId: 'B', option: lance })).toMatch(/iki el/);
  });

  it('YZ: binicinin turunda kontrollü bineği erişim için yürütür, sonra binici saldırır', () => {
    const s = mountA(scene(74)).state;
    const c1 = chooseCommand(s);
    expect(c1.type).toBe('move');
    expect('actorId' in c1 && c1.actorId).toBe('H');
    let st = run(s, c1).state;
    for (let i = 0; i < 6 && currentActorId(st) === 'A'; i++) {
      const c = chooseCommand(st);
      if (c.type === 'end_turn') break;
      st = run(st, c).state;
    }
    expect(distance(C(st, 'A').pos as Offset, C(st, 'B').pos as Offset)).toBeLessThanOrEqual(1);
    expect(C(st, 'B').hp).toBeLessThan(50);
  });
});

describe('MB2: paket `kontrol` alanı (sürüm 74)', () => {
  const SUB = 'titan-yolcusu';
  afterEach(() => applyPackSubclasses([]));
  it('`kontrol: kontrollu` olan paket yaratığına binince kontrollü olur', () => {
    const pack = JSON.parse(JSON.stringify(binekPack)) as { yaratiklar: Array<Record<string, unknown>> };
    (pack.yaratiklar[0] as Record<string, unknown>).binek = { kural: 'sahip', enBuyukBinici: 'M', minSeviye: 14, kontrol: 'kontrollu' };
    const v = validatePack(pack, { taken: classData.subclasses.map((s) => s.id), packs: [] });
    if (!v.ok) throw new Error(JSON.stringify(v.errors));
    applyPackSubclasses(v.pack.subclasses);
    const r = kitArena({ cls: 'fighter', sub: SUB, level: 14, kuralSurumu: 74, place: { B: o(10) } });
    r.do({ type: 'use_feature', actorId: 'A', feature: `pk:${SUB}/titan-cagrisi:eylem` });
    const drake = Object.values(r.state.combatants).find((c) => c.summon?.by === 'A' && !c.summon.gone) as Combatant;
    expect(drake.summon?.mount?.controlled).toBe(true);
    r.do({ type: 'mount', actorId: 'A', mountId: drake.id });
    expect(r.c(drake.id).controlledBy).toBe('A');
    expect(JSON.stringify(replay(r.events).combatants)).toBe(JSON.stringify(r.state.combatants));
  });
});
