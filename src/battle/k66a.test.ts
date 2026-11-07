/**
 * Kuyruk K66a (kural sürümü 50): Earthquake yarıkları (SRD 5.2.1 s. 127). Dökümde 1d6, aynı turda yerleştirme, büyücünün
 * tur sonunda açılış (bir sonraki tur başında açık); 2 altıgen geniş düz hat; derinlik 1d10 × 10 ft; save'i kaçıran düşer
 * (SRD Falling, Prone, eksi irtifa), geçen kenara kayar; tırmanma çift maliyet. `run` her komutta replay'i denetler.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { chooseCommand } from './ai';
import { mk } from './fixtures';
import { executeFissureClimb, fissureAim, fissureAt, fissureBudget, fissureLine, fissureProblem, inFissure } from './fissure';
import { caster, field, run } from './k19spells.test';
import { applyEvents } from './reduce';
import { reachFt } from './altitude';
import { moveCostFn } from './movement';
import { mechanicsAt } from './spellVersion';
import { areaActCommand, areaActPreview } from '../ui/hud';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const HIGH = { str: 30, dex: 30, con: 30, int: 30, wis: 30, cha: 30 };
const SLOTS = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const SP = () => spells.find((s) => s.name === 'Earthquake') as NonNullable<(typeof spells)[number]>;
const wiz = (p: Partial<Combatant> = {}) => caster({ spellNames: ['Earthquake'], spellSlots: SLOTS, concentration: null, hp: 300, maxHp: 300, saves: HIGH, ...p });
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 300, maxHp: 300, saves: LOW, ...p });
const ally = (id: string, p: Partial<Combatant> = {}) => mk(id, { ownerId: 'p1', hp: 300, maxHp: 300, saves: LOW, ...p });
const quake = (s: BattleState, seed = 3, at: Offset = { col: 7, row: 3 }) => run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Earthquake', targetHex: at } as Command, seed);
const place = (s: BattleState, at: Offset, dir: number, id = 'A') => run(s, { type: 'spell_followup', actorId: id, targetId: (fissureBudget(s, s.combatants[id] as Combatant)?.quake.id ?? ''), targetHex: at, choice: `fissure:${dir}` } as Command);
const endTurn = (s: BattleState, id = 'A', seed = 3) => run(s, { type: 'end_turn', actorId: id } as Command, seed);
const col = (hexes: Offset[]) => [...new Set(hexes.map((h) => h.col))].sort((a, b) => a - b);
const falls = (evs: BattleEvent[], id: string) => evs.filter((e): e is Extract<BattleEvent, { type: 'map_effect' }> => e.type === 'map_effect' && e.rule === 'fall' && e.targetId === id);
const POS = { A: { col: 1, row: 3 }, F0: { col: 8, row: 2 }, F1: { col: 8, row: 5 } };
const setup = (ver = 50, parts: Combatant[] = [wiz(), foe('F0'), foe('F1')], pos: Record<string, Offset> = POS) => field(parts, pos, ver);
// Sütun 8 + 9 (eksen 2, yan +): bütün satırlar.
const COL8 = 4;

describe('K66a veri ve sürüm', () => {
  it('sürüm 50\'de yarık verisi (1d6, 1d10 × 10 ft, 2 altıgen); 49\'da yok', () => {
    expect(mechanicsAt(setup(), SP()).zone?.fissures).toMatchObject({ count: '1d6', depthDie: '1d10', depthStepFt: 10, widthHexes: 2 });
    expect(mechanicsAt(setup(49), SP()).zone?.fissures).toBeUndefined();
  });
  it('dökümde 1d6 atılır, alana yazılır, günlükte; sürüm 49\'da yarık hakkı yok ve yerleştirme reddedilir', () => {
    const r = quake(setup());
    const b = fissureBudget(r.state, r.state.combatants.A as Combatant)!;
    expect(b.count).toBeGreaterThanOrEqual(1);
    expect(b.count).toBeLessThanOrEqual(6);
    expect(b.open).toBe(true);
    const cast = r.events.find((e) => e.type === 'spell_cast');
    expect(cast?.type === 'spell_cast' && cast.note).toMatch(/yarık/);
    const old = quake(setup(49));
    expect(fissureBudget(old.state, old.state.combatants.A as Combatant)).toBeNull();
    expect(old.state.map?.zones?.some((z) => z.fissures)).toBe(false);
    expect(() => place(old.state, { col: 8, row: 3 }, COL8)).toThrow(/sürüm|Earthquake/);
  });
});

describe('K66a yerleştirme ve açılış', () => {
  it('2 altıgen geniş düz hat kenardan kenara; tur sonunda zemin yarık, derinlik 1d10 × 10 ft, yarık kalıcı', () => {
    const r = quake(setup());
    const line = fissureLine(r.state, fissureBudget(r.state, r.state.combatants.A as Combatant)!.quake, { col: 8, row: 3 }, COL8);
    expect(col(line)).toEqual([8, 9]);
    expect(line).toHaveLength(14);
    const p = place(r.state, { col: 8, row: 3 }, COL8);
    // Henüz açılmadı: zemin aynı, bekleyen alan var.
    expect(p.state.map?.tiles[3]?.[8]).toBe('.');
    expect(p.state.map?.zones?.some((z) => z.fissure?.pending)).toBe(true);
    const e = endTurn(p.state);
    expect(e.state.map?.tiles.every((row) => row[8] === 'u' && row[9] === 'u')).toBe(true);
    const z = fissureAt(e.state, { col: 8, row: 0 })!;
    expect(z.fissure?.depthFt).toBeGreaterThanOrEqual(10);
    expect((z.fissure?.depthFt ?? 0) % 10).toBe(0);
    expect(z.concentration).toBeUndefined();
    expect(e.state.map?.zones?.some((x) => x.fissure?.pending)).toBe(false);
    // Konsantrasyon bitince Earthquake alanı gider, yarık kalır.
    const ended = applyEvents(e.state, [{ type: 'concentration_ended', actorId: 'A', label: 'Earthquake' }]);
    expect(fissureAt(ended, { col: 8, row: 0 })).toBeTruthy();
  });
  it('save\'i kaçıran düşer: derinlik/10 × d6 düşme hasarı, Prone, irtifa eksi derinlik; yüzeyden yakın dövüşle erişilmez', () => {
    const e = endTurn(place(quake(setup()).state, { col: 8, row: 3 }, COL8).state);
    const depth = fissureAt(e.state, { col: 8, row: 0 })?.fissure?.depthFt as number;
    for (const id of ['F0', 'F1']) {
      const f = falls(e.events, id);
      expect(f).toHaveLength(1);
      expect(f[0]?.text).toContain(`${depth} ft`);
      expect(f[0]?.damage?.rolls).toHaveLength(depth / 10);
      const c = e.state.combatants[id] as Combatant;
      expect(c.altitudeFt).toBe(-depth);
      expect(c.conditions).toContain('Prone');
      expect(inFissure(e.state, c)).toBe(true);
    }
    const a = e.state.combatants.A as Combatant;
    expect(reachFt(e.state, a, e.state.combatants.F0 as Combatant, 5)).toBe(depth);
  });
  it('save\'i geçen kenara kayar (yarık olmayan boş altıgen), düşmez; yer yoksa düşer', () => {
    const s = setup(50, [wiz(), foe('F0', { saves: HIGH }), foe('F1')]);
    const e = endTurn(place(quake(s).state, { col: 8, row: 3 }, COL8).state);
    const f0 = e.state.combatants.F0 as Combatant;
    expect(falls(e.events, 'F0')).toHaveLength(0);
    expect(fissureAt(e.state, f0.pos as Offset)).toBeUndefined();
    expect(f0.altitudeFt ?? 0).toBe(0);
    expect(e.events.some((x) => x.type === 'pushed' && x.targetId === 'F0')).toBe(true);
    // Kenarda 3 altıgen içinde yer yok (5–7 ve 10–12. sütunlar duvar): başarılı save'de de düşer.
    const walled = { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: (s.map?.tiles ?? []).map((row) => [...row].map((ch, c) => ([5, 6, 7, 10, 11, 12].includes(c) ? 's' : ch)).join('')) } };
    const w = endTurn(place(quake(walled, 3, { col: 3, row: 3 }).state, { col: 8, row: 3 }, COL8).state);
    expect(falls(w.events, 'F0')).toHaveLength(1);
  });
  it('uçan yaratık etkilenmez (save yok, düşmez); yerleştirme kenar durumları', () => {
    const s = setup(50, [wiz(), foe('F0', { fly: 30 }), foe('F1')]);
    const p = place(quake(s).state, { col: 8, row: 3 }, COL8);
    const e = endTurn(p.state);
    expect(e.events.some((x) => x.type === 'save_resolved' && x.targetId === 'F0' && x.label === 'Yarık')).toBe(false);
    expect(e.state.combatants.F0?.altitudeFt ?? 0).toBe(0);
    const me = p.state.combatants.A as Combatant;
    expect(fissureProblem(p.state, me, { col: 8, row: 3 }, COL8)).toMatch(/zaten/);
    expect(fissureProblem(p.state, me, { col: 8, row: 3 }, 9)).toMatch(/yön/);
    // Yapı altından geçemez (kapı nesnesi).
    const door = { ...p.state, map: { ...(p.state.map as NonNullable<BattleState['map']>), objects: [{ id: 'd1', kind: 'door' as const, at: { col: 3, row: 1 }, hp: 18, state: 'closed' as const }] } } as BattleState;
    expect(fissureProblem(door, me, { col: 3, row: 3 }, COL8)).toMatch(/yapı/);
    // Döküm turu bitince yerleştirilemez; yerleştirilmeyen yitirilir.
    expect(fissureProblem(e.state, e.state.combatants.A as Combatant, { col: 3, row: 3 }, COL8)).toMatch(/turda/);
  });
  it('Feather Fall düşme hasarını keser (tepki), yine de yarıkta kalır', () => {
    const ff = { id: 'spells:feather-fall', name: 'Feather Fall', kind: 'featherFall' as const, spell: 'Feather Fall' };
    const s = setup(50, [wiz(), foe('F0', { spellNames: ['Feather Fall'], spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0], reactions: [ff] }), foe('F1')]);
    const placed = place(quake(s).state, { col: 8, row: 3 }, COL8).state;
    // Yapay zekâ önerisi 20 ft ve üstü düşmede slot harcar: derinliği 20+ ft olan tohum.
    const e = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((seed) => endTurn(placed, 'A', seed)).find((r) => (fissureAt(r.state, { col: 8, row: 0 })?.fissure?.depthFt ?? 0) >= 20)!;
    const f = falls(e.events, 'F0');
    expect(f[0]?.text).toMatch(/Feather Fall/);
    expect(f[0]?.damage).toBeUndefined();
    expect(e.state.combatants.F0?.altitudeFt ?? 0).toBeLessThan(0);
  });
});

describe('K66a yarıkta tırmanma', () => {
  const fallen = () => {
    const s = setup(50, [wiz(), ally('P', { speed: 30 }), foe('F1')], { A: { col: 1, row: 3 }, P: { col: 8, row: 2 }, F1: { col: 12, row: 5 } });
    const e = endTurn(place(quake(s).state, { col: 8, row: 3 }, COL8).state);
    // Derinlik tohuma bağlı: 60 ft'e sabitlenir (tırmanma hesabı için).
    const deep = applyEvents(e.state, [{ type: 'altitude_changed', targetId: 'P', altitudeFt: -60, label: 't' }]);
    return { ...deep, turnIndex: 1, combatants: { ...deep.combatants, P: { ...(deep.combatants.P as Combatant), movementUsed: 0, conditions: [] } } } as BattleState;
  };
  it('çift maliyet: 5 ft = 2 altıgen; yürüme reddedilir; 0 ft\'te çıkış bitişik zemine', () => {
    const s = fallen();
    const p = s.combatants.P as Combatant;
    expect(inFissure(s, p)).toBe(true);
    expect(() => run(s, { type: 'move', actorId: 'P', to: { col: 7, row: 2 } } as Command)).toThrow(/Yarık/);
    const up = run(s, { type: 'vertical_move', actorId: 'P', toFt: (p.altitudeFt as number) + 15 } as Command);
    expect(up.state.combatants.P?.movementUsed).toBe(6);
    expect(() => run(s, { type: 'vertical_move', actorId: 'P', toFt: (p.altitudeFt as number) + 20 } as Command)).toThrow(/Yeterli hareket/);
    const near = applyEvents(s, [{ type: 'altitude_changed', targetId: 'P', altitudeFt: -5, label: 't' }]);
    expect(executeFissureClimb(near, near.combatants.P as Combatant, { toFt: 0 }).ok).toBe(false);
    const out = run(near, { type: 'vertical_move', actorId: 'P', toFt: 0, to: { col: 7, row: 2 } } as Command);
    expect(out.state.combatants.P?.pos).toEqual({ col: 7, row: 2 });
    expect(out.state.combatants.P?.altitudeFt ?? 0).toBe(0);
    expect(inFissure(out.state, out.state.combatants.P as Combatant)).toBe(false);
  });
  it('yarık dışına konan (itme, ışınlanma) yaratığın eksi irtifası komut sonunda sıfırlanır; zemin değişikliği hareket maliyetinde', () => {
    const s = fallen();
    const moved = applyEvents(s, [{ type: 'pushed', targetId: 'P', from: { col: 8, row: 2 }, to: { col: 6, row: 2 }, by: 'A' }]);
    const r = run(moved, { type: 'end_turn', actorId: 'P' } as Command);
    expect(r.state.combatants.P?.altitudeFt ?? 0).toBe(0);
    expect(moveCostFn(s, s.combatants.F1 as Combatant)({ col: 9, row: 5 }, { col: 10, row: 5 })).toBeNull();
  });
});

describe('K66a yükseklik katmanı', () => {
  it('katmanlı haritada yarığa düşen bir kez düşer (zemin çökmesi düşmesi yok)', () => {
    const s0 = setup();
    const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), heights: Array.from({ length: 7 }, () => Array(15).fill(0)) } } as BattleState;
    const e = endTurn(place(quake(s).state, { col: 8, row: 3 }, COL8).state);
    expect(falls(e.events, 'F0')).toHaveLength(1);
  });
});

describe('K66a yapay zekâ', () => {
  const ai = () => {
    const E = caster({ id: 'E', side: 'enemies', ownerId: undefined, spellNames: ['Earthquake'], spellSlots: SLOTS, concentration: null, hp: 300, maxHp: 300, saves: HIGH });
    const parts = [E, mk('W', { side: 'enemies', hp: 50, maxHp: 50 }), ally('P1', { saves: LOW }), ally('P2', { saves: LOW })];
    const s = field(parts, { E: { col: 1, row: 3 }, W: { col: 2, row: 3 }, P1: { col: 7, row: 3 }, P2: { col: 12, row: 3 } }, 50);
    const r = run(s, { type: 'cast_spell', actorId: 'E', spellName: 'Earthquake', targetHex: { col: 7, row: 3 } } as Command);
    return r.state;
  };
  it('dostsuz, düşman kesen hat; dostların düşmana yolunu kesen hat seçilmez (harita bölünmesi)', () => {
    const s = ai();
    const me = s.combatants.E as Combatant;
    const aim = fissureAim(s, me, ['P1', 'P2'].map((id) => s.combatants[id] as Combatant))!;
    expect(aim).toBeTruthy();
    // P1'den geçen her hat W'yi P2'den ayırır: yalnız P2'den geçen hat.
    expect(aim.hexes.some((h) => h.col === 12 && h.row === 3)).toBe(true);
    expect(aim.hexes.some((h) => h.col === 7 && h.row === 3)).toBe(false);
    expect(aim.hexes.some((h) => (h.col === 1 || h.col === 2) && h.row === 3)).toBe(false);
    const t0 = performance.now();
    const cmd = chooseCommand(s);
    const ms = performance.now() - t0;
    expect(cmd).toMatchObject({ type: 'spell_followup', actorId: 'E', choice: `fissure:${aim.dir}` });
    expect(ms).toBeLessThan(5000);
  });
  it('yarıktaki yapay zekâ tırmanır', () => {
    const s0 = setup(50, [wiz(), foe('F0'), foe('F1')]);
    const e = endTurn(place(quake(s0).state, { col: 8, row: 3 }, COL8).state);
    const s = { ...e.state, turnIndex: 1, combatants: { ...e.state.combatants, F0: { ...(e.state.combatants.F0 as Combatant), movementUsed: 0, conditions: [] } } } as BattleState;
    expect(chooseCommand(s)).toMatchObject({ type: 'vertical_move', actorId: 'F0' });
  });
});

describe('K66a seçici (arayüz)', () => {
  it('önizleme motorla aynı ileti; komut spell_followup', () => {
    const r = quake(setup());
    const me = r.state.combatants.A as Combatant;
    const zoneId = fissureBudget(r.state, me)!.quake.id;
    const act = { kind: 'fissure' as const, zoneId };
    const ok = areaActPreview(r.state, me, act, { col: 8, row: 3 }, null, undefined, `fissure:${COL8}`);
    expect(ok.error).toBeNull();
    expect(ok.foes.map((c) => c.id).sort()).toEqual(['F0', 'F1']);
    expect(areaActCommand('A', act, { col: 8, row: 3 }, null, null, `fissure:${COL8}`)).toMatchObject({ type: 'spell_followup', targetId: zoneId, choice: `fissure:${COL8}` });
    const p = place(r.state, { col: 8, row: 3 }, COL8);
    expect(areaActPreview(p.state, me, act, { col: 8, row: 3 }, null, undefined, `fissure:${COL8}`).error).toBe(fissureProblem(p.state, me, { col: 8, row: 3 }, COL8));
  });
});
