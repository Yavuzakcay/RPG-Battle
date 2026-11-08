/**
 * Kuyruk K68b (kural sürümü 52): dikey geometri, orta riskli parça. Tavan (`tavanFt`, 17 iç mekân; irtifa üst sınırı tavan −
 * boy), Levitate tavana tutunma, Spider Climb duvar/tavan (tırmanma, yürüme, düşme, erişim), Call Lightning bulutu (60 ft
 * yarıçap, tavan alçak, yaratığın irtifasına şimşek), Jump yüksek erişimi (yerinde zıplama), yapay zekâ `k68:tirman`.
 * Her madde için sürüm 51 eski davranış sabitlenir. `run` replay'i denetler.
 */
import { describe, expect, it } from 'vitest';
import { getMap, maps } from '../map/maps';
import { mk, P1 } from './fixtures';
import { execute, replay, startBattle } from './index';
import { seededRng } from '../rules/dice';
import { altitudeCapFt, atCeiling, ceilingFt, wallHex } from './altitude';
import { applyEvents } from './reduce';
import { checkReach } from './range';
import { highJumpReachFt, moveCostFn } from './movement';
import { chooseCommand } from './ai';
import { cloudOf } from './cloud';
import { spells } from '../data';
import { isAirborne } from './flight';
import { hideInfo } from '../ui/stealthView';
import type { Offset } from '../rules/hex';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, Command } from './types';

const SLOTS = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const SP = (n: string) => spells.find((s) => s.name === n) as NonNullable<(typeof spells)[number]>;
const H = (col: number, row = 3): Offset => ({ col, row });
const caster = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', spellNames: ['Spider Climb', 'Levitate', 'Call Lightning', 'Jump', 'Fly'], spellSlots: SLOTS, spellSaveDc: 30, spellAttack: 10, spellMod: 5, casterTag: 'wizard', hp: 200, maxHp: 200, ...p });
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 200, maxHp: 200, saves: LOW, ...p });
const fx = (id: string, p: Partial<ActiveEffect>): ActiveEffect => ({ id, name: id, sourceId: 'A', until: 99, ...p });

/** `mapId`/`variantId` haritası (kuralları kapalı), 15×7 düz zemin (`tiles` verilirse o). */
function room(parts: Combatant[], pos: Record<string, Offset>, ver = 52, mapId = 'magara', variantId = 'magara', tiles?: string[]): BattleState {
  const s = startBattle('k68b', 'k68b', parts, () => 0.5, { kuralSurumu: ver, map: { id: mapId, variantId, ruleToggles: { darkness: false, trap: false } } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: tiles ?? Array.from({ length: 7 }, () => '.'.repeat(15)) } };
}
/** Açık gök (`col`, tavansız). */
const open = (parts: Combatant[], pos: Record<string, Offset>, ver = 52) => room(parts, pos, ver, 'col', 'gunduz');
const run = (s: BattleState, cmd: Command, seed = 3) => {
  const r = execute(s, cmd, P1, seededRng(seed));
  if (!r.ok) throw new Error(r.error);
  expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  return r;
};
const tryRun = (s: BattleState, cmd: Command) => execute(s, cmd, P1, seededRng(3));
const failOf = (s: BattleState, cmd: Command) => { const r = tryRun(s, cmd); return r.ok ? null : r.error; };
const alt = (s: BattleState, id: string) => s.combatants[id]?.altitudeFt ?? 0;
const climber = (s: BattleState) => run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Spider Climb', targetId: 'A' } as Command).state;
const fresh = (s: BattleState, id = 'A'): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), movementUsed: 0, economy: (mk('x')).economy } } });

describe('K68b tavan verisi', () => {
  const TABLE: Record<string, number> = {
    dungeon: 15, magara: 20, 'magara-genis': 20, 'kasaba-lagim': 10, 'yeralti-nehri': 10, 'derinlikler-magara-karakol': 20,
    'derinlikler-mezar-labirenti': 15, 'derinlikler-mantar-magarasi': 30, 'derinlikler-lav-salonu': 30, 'orman-heykel-magarasi': 20,
    'hapishane-hucre-platformu': 20, 'hapishane-mudur-kulesi': 15, taverna: 12, 'kale-taht-salonu': 30,
  };
  it('14 iç mekân haritasının bütün varyantlarında tavan var, kalanlar (açık üstlü salonlar dahil) açık gök', () => {
    for (const [id, ft] of Object.entries(TABLE)) for (const v of getMap(id).variants) expect([id, v.id, v.tavanFt]).toEqual([id, v.id, ft]);
    const withCeiling = maps.filter((m) => m.variants.some((v) => v.tavanFt !== undefined)).map((m) => m.id).sort();
    expect(withCeiling).toEqual(Object.keys(TABLE).sort());
  });
  it('üst sınır tavan − boy (5 ft adım); sürüm 51\'de tavan yok', () => {
    const s = room([caster()], { A: H(0) });
    expect(ceilingFt(s)).toBe(20);
    expect(altitudeCapFt(s, mk('m', { size: 'M' }))).toBe(15);
    expect(altitudeCapFt(s, mk('l', { size: 'L' }))).toBe(10);
    expect(altitudeCapFt(s, mk('h', { size: 'H' }))).toBe(5);
    expect(altitudeCapFt(s, mk('g', { size: 'G' }))).toBe(0);
    expect(altitudeCapFt(room([caster()], { A: H(0) }, 52, 'taverna', 'ic-mekan'), mk('m'))).toBe(5);
    expect(ceilingFt(room([caster()], { A: H(0) }, 51))).toBeNull();
    expect(altitudeCapFt(room([caster()], { A: H(0) }, 51), mk('m'))).toBe(120);
    expect(ceilingFt(open([caster()], { A: H(0) }))).toBeNull();
  });
  it('uçuş tavana kırpılır (sürüm 52); sürüm 51\'de 30 ft serbest', () => {
    const flyer = caster({ fly: 30 });
    const s = room([flyer], { A: H(7) });
    expect(failOf(s, { type: 'vertical_move', actorId: 'A', toFt: 20 } as Command)).toMatch(/Tavan 20 ft/);
    expect(alt(run(s, { type: 'vertical_move', actorId: 'A', toFt: 15 } as Command).state, 'A')).toBe(15);
    expect(alt(run(room([flyer], { A: H(7) }, 51), { type: 'vertical_move', actorId: 'A', toFt: 30 } as Command).state, 'A')).toBe(30);
  });
  it('Levitate yükselmesi tavana dek (lağım 10 ft: 5 ft); sürüm 51\'de 20 ft', () => {
    const cast = (ver: number) => run(room([caster(), foe('F')], { A: H(1), F: H(4) }, ver, 'kasaba-lagim', 'karanlik'),
      { type: 'cast_spell', actorId: 'A', spellName: 'Levitate', targetId: 'F' } as Command).state;
    expect(alt(cast(52), 'F')).toBe(5);
    expect(alt(cast(51), 'F')).toBe(20);
  });
  it('tavanın üstündeki irtifa komut sonunda hasarsız tavana kırpılır; sürüm 51 aynen', () => {
    const high = (ver: number) => run(room([caster({ fly: 30, altitudeFt: 40 }), foe('F')], { A: H(7), F: H(12) }, ver), { type: 'end_turn', actorId: 'A' } as Command).state;
    const s = high(52);
    expect(alt(s, 'A')).toBe(15);
    expect(s.combatants.A?.hp).toBe(200);
    expect(alt(high(51), 'A')).toBe(40);
  });
});

describe('K68b açık üstlü haritalar (tavansız: Portal Salonu, Lav Tapınağı, Volkanik Demirhane)', () => {
  const OPEN: Array<[string, string]> = [['isinlanma-salonu', 'varsayilan'], ['lav-tapinagi', 'varsayilan'], ['volkanik-demirhane', 'varsayilan']];
  const at = (mapId: string, variantId: string, parts: Combatant[], pos: Record<string, Offset>, ver = 52) => room(parts, pos, ver, mapId, variantId);
  it('varyantta `tavanFt` yok; tavan null, üst sınır açık gökteki 120 ft', () => {
    for (const [id, v] of OPEN) {
      expect(getMap(id).variants.every((x) => x.tavanFt === undefined)).toBe(true);
      const s = at(id, v, [caster()], { A: H(1) });
      expect(ceilingFt(s)).toBeNull();
      expect(altitudeCapFt(s, mk('m'))).toBe(120);
    }
  });
  it('uçuş 30 ft (kırpılmaz), Levitate 20 ft yükselir, komut sonunda irtifa kırpılmaz', () => {
    for (const [id, v] of OPEN) {
      const fly = run(at(id, v, [caster({ fly: 30 })], { A: H(7) }), { type: 'vertical_move', actorId: 'A', toFt: 30 } as Command).state;
      expect(alt(fly, 'A')).toBe(30);
      const lev = run(at(id, v, [caster(), foe('F')], { A: H(1), F: H(4) }), { type: 'cast_spell', actorId: 'A', spellName: 'Levitate', targetId: 'F' } as Command).state;
      expect(alt(lev, 'F')).toBe(20);
      const high = run(at(id, v, [caster({ fly: 60, altitudeFt: 40 }), foe('F')], { A: H(7), F: H(12) }), { type: 'end_turn', actorId: 'A' } as Command).state;
      expect(alt(high, 'A')).toBe(40);
    }
  });
  it('Jump yüksek erişimi 30 ft (tavanla kırpılmaz)', () => {
    const s = at('volkanik-demirhane', 'varsayilan', [caster({ effects: [fx('spells:jump', { jumpFt: 30 })] }), foe('F', { fly: 30, altitudeFt: 30 })], { A: H(3), F: H(4) });
    const r = run(s, { type: 'jump', actorId: 'A', to: H(3) } as Command).state;
    expect(highJumpReachFt(r, r.combatants.A as Combatant)).toBe(30);
    expect((checkReach(r, r.combatants.A as Combatant, r.combatants.F as Combatant, { kind: 'melee', reachFt: 5 }) as { ok: boolean }).ok).toBe(true);
  });
  it('Call Lightning yapılır, bulut tabanı açık gökteki 30 ft', () => {
    for (const [id, v] of OPEN) {
      const s = at(id, v, [caster(), foe('F')], { A: H(0), F: H(5) });
      const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Call Lightning', targetHex: H(5) } as Command);
      expect(cloudOf(r.state, r.state.combatants.A as Combatant, SP('Call Lightning'))?.cloud?.baseFt).toBe(30);
    }
  });
  it('Spider Climb ve YZ açık alan duvar boyuyla (20 ft): tırmanıcı büyücü 20 ft\'e çıkar', () => {
    const s0 = at('lav-tapinagi', 'varsayilan', [caster({ spellNames: ['Fire Bolt'] }), foe('F')], { A: H(0), F: H(1) });
    const s = { ...s0, combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), side: 'enemies' as const, ownerId: null, effects: [fx('spells:spider-climb', { climb: true })] }, F: { ...(s0.combatants.F as Combatant), side: 'party' as const } } };
    expect(chooseCommand(s)).toMatchObject({ type: 'vertical_move', actorId: 'A', toFt: 20 });
  });
  it('altıgen bilgisinde "tavan" satırı yok; tavanlı haritada var', () => {
    for (const [id, v] of OPEN) {
      const s = at(id, v, [caster()], { A: H(1) });
      expect(hideInfo(s, s.combatants.A, H(5))).not.toMatch(/tavan/);
    }
    const cave = room([caster()], { A: H(1) });
    expect(hideInfo(cave, cave.combatants.A, H(5))).toMatch(/tavan 20 ft/);
  });
  it('Su Altı Geçidi tavanı 10 ft: Medium en çok 5 ft, Call Lightning yapılamaz', () => {
    const s = room([caster(), foe('F')], { A: H(0), F: H(5) }, 52, 'yeralti-nehri', 'gunduz');
    expect(ceilingFt(s)).toBe(10);
    expect(altitudeCapFt(s, mk('m'))).toBe(5);
    expect(failOf(s, { type: 'cast_spell', actorId: 'A', spellName: 'Call Lightning', targetHex: H(5) } as Command)).toBe('Call Lightning: bulut için tavan alçak (10 ft).');
  });
});

describe('K68b Levitate tavana tutunma', () => {
  const lev = (altitudeFt: number, ver = 52) => room([caster({ altitudeFt, effects: [fx('spells:levitate', { levitate: true, airborne: true })] })], { A: H(0) }, ver);
  it('tavana değen Levitate\'li her yerde itinerek (iki kat) ilerler; tavana değmeyen yalnız duvar dibinde', () => {
    const top = lev(15);
    expect(atCeiling(top, top.combatants.A as Combatant)).toBe(true);
    const cost = moveCostFn(top, top.combatants.A as Combatant);
    expect(cost(H(5), H(4))).toBe(2);
    const mid = lev(10);
    expect(moveCostFn(mid, mid.combatants.A as Combatant)(H(5), H(4))).toBeNull();
  });
  it('sürüm 51: tavan yok, açık alanın ortasında tutunamaz', () => {
    const old = lev(15, 51);
    expect(moveCostFn(old, old.combatants.A as Combatant)(H(5), H(4))).toBeNull();
  });
});

describe('K68b Spider Climb', () => {
  it('açık alanda duvar dibinde 20 ft\'e dek tırmanır (hareketten, ek maliyetsiz); ortada tırmanılmaz', () => {
    const s = climber(open([caster(), foe('F')], { A: H(0), F: H(12) }));
    const r = run(s, { type: 'vertical_move', actorId: 'A', toFt: 20 } as Command);
    expect(alt(r.state, 'A')).toBe(20);
    expect(r.state.combatants.A?.climbing).toBe(true);
    expect(r.state.combatants.A?.movementUsed).toBe(4);
    expect(failOf(fresh(r.state), { type: 'vertical_move', actorId: 'A', toFt: 25 } as Command)).toMatch(/Duvar boyu 20 ft/);
    const mid = climber(open([caster(), foe('F')], { A: H(7), F: H(12) }));
    expect(wallHex(mid, H(7))).toBe(false);
    expect(failOf(mid, { type: 'vertical_move', actorId: 'A', toFt: 10 } as Command)).toMatch(/duvara/);
  });
  it('engel zemini de duvardır; uçurum ve coşkun nehir değil', () => {
    const tiles = ['...............', '...............', '.......s.......', '...............', '...........u...', '...............', '...............'];
    const s = room([caster()], { A: H(1) }, 52, 'col', 'gunduz', tiles);
    expect(wallHex(s, H(7, 3))).toBe(true);
    expect(wallHex(s, H(10, 4))).toBe(false);
  });
  it('duvarda yalnız duvar altıgenlerine, tavanda her yere yürür; komut sonunda düşmez', () => {
    const s = climber(room([caster(), foe('F')], { A: H(0), F: H(12) }));
    const up = run(s, { type: 'vertical_move', actorId: 'A', toFt: 10 } as Command).state;
    expect(failOf(up, { type: 'move', actorId: 'A', to: H(2) } as Command)).not.toBeNull();
    const along = run(up, { type: 'move', actorId: 'A', to: H(0, 5) } as Command).state;
    expect(alt(along, 'A')).toBe(10);
    const top = run(fresh(along), { type: 'vertical_move', actorId: 'A', toFt: 15 } as Command).state;
    expect(atCeiling(top, top.combatants.A as Combatant)).toBe(true);
    const walked = run(top, { type: 'move', actorId: 'A', to: H(3, 4) } as Command).state;
    expect(walked.combatants.A?.pos).toEqual(H(3, 4));
    expect(alt(walked, 'A')).toBe(15);
    // Tavanın ortasından inilmez.
    expect(failOf(fresh(walked), { type: 'vertical_move', actorId: 'A', toFt: 0 } as Command)).toMatch(/İnmek için duvara/);
  });
  it('büyü biterse (konsantrasyon) ya da Prone olursa düşer (SRD düşme hasarı); tavandaki zemin etkisinden kurtulur', () => {
    const s = climber(room([caster(), foe('F')], { A: H(0), F: H(12) }));
    const up = run(s, { type: 'vertical_move', actorId: 'A', toFt: 15 } as Command).state;
    expect(isAirborne(up.combatants.A as Combatant)).toBe(true);
    const ended = applyEvents(up, [{ type: 'concentration_ended', actorId: 'A', label: 'test' } as BattleEvent]);
    const r = run(ended, { type: 'end_turn', actorId: 'A' } as Command);
    expect(alt(r.state, 'A')).toBe(0);
    expect(r.state.combatants.A?.climbing).toBeUndefined();
    expect(r.events.some((e) => e.type === 'map_effect' && e.rule === 'fall' && e.targetId === 'A')).toBe(true);
    const prone = applyEvents(up, [{ type: 'condition_changed', targetId: 'A', condition: 'Prone', present: true, reason: 'test' } as BattleEvent]);
    expect(alt(run(prone, { type: 'end_turn', actorId: 'A' } as Command).state, 'A')).toBe(0);
  });
  it('erişim: tavandaki tırmanıcıya yerden 5 ft yakın dövüş ulaşmaz, menzilli saldırı ulaşır', () => {
    const s = climber(room([caster(), foe('F')], { A: H(0), F: H(1) }));
    const up = run(s, { type: 'vertical_move', actorId: 'A', toFt: 15 } as Command).state;
    const a = up.combatants.A as Combatant; const f = up.combatants.F as Combatant;
    expect('ok' in checkReach(up, f, a, { kind: 'melee', reachFt: 5 }) && !(checkReach(up, f, a, { kind: 'melee', reachFt: 5 }) as { ok: boolean }).ok).toBe(true);
    expect((checkReach(up, f, a, { kind: 'ranged', normalFt: 80, longFt: 320, label: 'yay' }) as { ok: boolean }).ok).toBe(true);
  });
  it('sürüm 51: tırmanıcı dikey hareket yapamaz (uçuş hızı yok)', () => {
    const s = climber(room([caster(), foe('F')], { A: H(0), F: H(12) }, 51));
    expect(failOf(s, { type: 'vertical_move', actorId: 'A', toFt: 10 } as Command)).toMatch(/Uçuş hızın yok/);
  });
});

describe('K68b Call Lightning bulutu', () => {
  const cl = (_s: BattleState, p: Partial<Command>) => ({ type: 'cast_spell', actorId: 'A', spellName: 'Call Lightning', ...p }) as Command;
  it('bulut döküm yerinin üstünde sabit (60 ft yarıçap, açık gökte taban 30 ft); nokta bulutun altında olmalı', () => {
    const s = open([caster(), foe('F'), foe('G')], { A: H(0), F: H(13), G: H(12) });
    expect(failOf(s, cl(s, { targetHex: H(13) }))).toMatch(/bulutun altında/);
    const r = run(s, cl(s, { targetHex: H(12) }));
    const z = cloudOf(r.state, r.state.combatants.A as Combatant, SP('Call Lightning'));
    expect(z?.center).toEqual(H(0));
    expect(z?.cloud).toEqual({ radiusHexes: 12, baseFt: 30 });
    // Büyücü yürür; bulut yürümez: tekrarın noktası bulut merkezinden ölçülür.
    const next = { ...r.state, round: r.state.round + 1, combatants: { ...r.state.combatants, A: { ...(r.state.combatants.A as Combatant), pos: H(6), economy: mk('x').economy } } };
    expect(failOf(next, { type: 'spell_followup', actorId: 'A', targetHex: H(13), targetId: 'F' } as Command)).toMatch(/bulutun altında/);
    expect(tryRun(next, { type: 'spell_followup', actorId: 'A', targetHex: H(11), targetId: 'G' } as Command).ok).toBe(true);
  });
  it('yaratık seçilince şimşek onun irtifasında: uçan vurulur, altındaki yerdeki vurulmaz; sürüm 51\'de uçan 20 ft\'te vurulmaz', () => {
    const hit = (ver: number) => {
      const s = open([caster(), foe('F', { fly: 30, altitudeFt: 20 }), foe('G')], { A: H(0), F: H(6), G: H(7) }, ver);
      return run(s, cl(s, { targetId: 'F' })).events.filter((e) => e.type === 'save_resolved').map((e) => (e as { targetId: string }).targetId);
    };
    expect(hit(52)).toEqual(['F']);
    expect(() => hit(51)).toThrow(/alanın dışında/);
  });
  it('bulutun tabanından yüksekteki yaratık seçilemez', () => {
    const s = open([caster(), foe('F', { fly: 60, altitudeFt: 40 })], { A: H(0), F: H(6) });
    expect(failOf(s, cl(s, { targetId: 'F' }))).toMatch(/bulutun \(taban 30 ft\) üstünde/);
  });
  it('alçak tavanda yapılamaz (lağım 10 ft); zindanda (15 ft) taban 5 ft; sürüm 51\'de tavan yok', () => {
    const sewer = (ver: number) => room([caster(), foe('F')], { A: H(0), F: H(5) }, ver, 'kasaba-lagim', 'karanlik');
    expect(failOf(sewer(52), cl(sewer(52), { targetHex: H(5) }))).toBe('Call Lightning: bulut için tavan alçak (10 ft).');
    expect(tryRun(sewer(51), cl(sewer(51), { targetHex: H(5) })).ok).toBe(true);
    const dun = room([caster(), foe('F')], { A: H(0), F: H(5) }, 52, 'dungeon', 'mesale');
    const r = run(dun, cl(dun, { targetHex: H(5) }));
    expect(cloudOf(r.state, r.state.combatants.A as Combatant, SP('Call Lightning'))?.cloud?.baseFt).toBe(5);
  });
  it('konsantrasyon bitince bulut kalkar', () => {
    const s = open([caster(), foe('F')], { A: H(0), F: H(5) });
    const r = run(s, cl(s, { targetHex: H(5) }));
    const ended = applyEvents(r.state, [{ type: 'concentration_ended', actorId: 'A', label: 'test' } as BattleEvent]);
    expect(cloudOf(ended, ended.combatants.A as Combatant, SP('Call Lightning'))).toBeUndefined();
  });
});

describe('K68b Jump yüksek erişim', () => {
  const jumper = (ver = 52, mapId = 'col', variantId = 'gunduz') => room([caster({ effects: [fx('spells:jump', { jumpFt: 30 })] }), foe('F', { fly: 30, altitudeFt: 20 })], { A: H(3), F: H(4) }, ver, mapId, variantId);
  const meleeOk = (s: BattleState) => (checkReach(s, s.combatants.A as Combatant, s.combatants.F as Combatant, { kind: 'melee', reachFt: 5 }) as { ok: boolean }).ok;
  it('yerinde zıplayan bu tur yakın dövüşte 20 ft yukarıdakine ulaşır (10 ft hareket); sonraki tur bitmiş', () => {
    const s = jumper();
    expect(meleeOk(s)).toBe(false);
    const r = run(s, { type: 'jump', actorId: 'A', to: H(3) } as Command);
    expect(r.state.combatants.A?.movementUsed).toBe(2);
    expect(alt(r.state, 'A')).toBe(0);
    expect(meleeOk(r.state)).toBe(true);
    expect(failOf(r.state, { type: 'jump', actorId: 'A', to: H(3) } as Command)).toMatch(/Jump bu tur/);
    expect(meleeOk({ ...r.state, round: r.state.round + 1 })).toBe(false);
  });
  it('tavanla sınırlı (mağara: 15 ft); sürüm 51\'de yerinde zıplama yok', () => {
    const cave = run(jumper(52, 'magara', 'magara'), { type: 'jump', actorId: 'A', to: H(3) } as Command).state;
    // Uçan F mağarada en çok 15 ft'e çıkar; 20 ft'teki yerine 15'te dursun.
    const f15 = { ...cave, combatants: { ...cave.combatants, F: { ...(cave.combatants.F as Combatant), altitudeFt: 15 } } };
    expect(meleeOk(f15)).toBe(true);
    expect(failOf(jumper(51), { type: 'jump', actorId: 'A', to: H(3) } as Command)).toBe('Zaten bu altıgende.');
  });
});

describe('K68b yapay zekâ k68:tirman', () => {
  it('tırmanıcı büyücü bitişik yerdeki düşmandan tavana tırmanır; sürüm 51\'de yok', () => {
    const at = (ver: number) => {
      const s0 = room([caster({ spellNames: ['Fire Bolt'] }), foe('F', { attacks: [{ name: 'Pençe', toHit: 5, damageDice: '1d6', damageType: 'slashing', reachFt: 5 }] as never })], { A: H(0), F: H(1) }, ver);
      return { ...s0, combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), side: 'enemies' as const, ownerId: null, effects: [fx('spells:spider-climb', { climb: true })] }, F: { ...(s0.combatants.F as Combatant), side: 'party' as const } } };
    };
    expect(chooseCommand(at(52))).toMatchObject({ type: 'vertical_move', actorId: 'A', toFt: 15 });
    expect(chooseCommand(at(51))).not.toMatchObject({ type: 'vertical_move' });
  });
});

