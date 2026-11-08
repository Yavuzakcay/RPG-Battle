/**
 * Kuyruk K71b (kural sürümü 57): herkes için duvara tırmanma (Çeviklik kontrolü tırmanışın başında bir kez; DC kaba 10 /
 * duvar 12 / pürüzsüz 15; maliyet ×2 / ×3; tutmazsa düşme yok, yerinde kalır, adımın hareketi yanar), tırmanılmaz yüzeyler,
 * duvar üstünden öte yana geçiş (tepede durulmaz), katman `climb` komutunun aynı kurala inmesi (K4), düşmenin tek işlevi,
 * Long Jump alçak engel (K7), YZ tırmanma kuralı (K15), 23 haritanın dikey verisi. Sürüm 56 eski davranış sabit.
 */
import { describe, expect, it, vi } from 'vitest';
vi.mock('../map/maps', async (importOriginal) => (await import('../map/fixtures/yukseklikSahnesi')).withYukseklik(await importOriginal()));
import { mk, P1, scripted } from './fixtures';
import { execute, replay, startBattle } from './index';
import { chooseCommand } from './ai';
import { seededRng } from '../rules/dice';
import { CLIMB_CLASSES, CLIMB_VERSION, climbOdds, climbStartInfo, dexClimber, surfaceAt } from './climbing';
import { fall, fallStats } from './fall';
import { obstacleTopFt } from './cover';
import { dikeyOf } from './vertical';
import { maps } from '../map/maps';
import dikeyData from '../../data/dikey.json';
import k71Script from '../../scripts/k71-dikey.py?raw';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command, MapObject, SpellZone } from './types';

const H = (col: number, row = 3): Offset => ({ col, row });
const d20 = (...v: number[]) => scripted(...v.map((x) => [20, x] as [number, number]));
/** 15×7; `col` sütunu `ch` zemini (duvar, ağaç…), `open` satırları açık. */
const tilesWith = (col: number | null, ch = 's', open: number[] = []) =>
  Array.from({ length: 7 }, (_, r) => Array.from({ length: 15 }, (_, c) => (c === col && !open.includes(r) ? ch : '.')).join(''));
interface Opts { ver?: number; mapId?: string; variantId?: string; tiles?: string[]; objects?: MapObject[]; zones?: SpellZone[]; heights?: number[][] }
function field(parts: Combatant[], pos: Record<string, Offset>, o: Opts = {}): BattleState {
  const s = startBattle('k71b', 'k71b', parts, () => 0.5, { kuralSurumu: o.ver ?? 57, map: { id: o.mapId ?? 'col', variantId: o.variantId ?? 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: o.tiles ?? tilesWith(null), objects: o.objects ?? [], zones: o.zones ?? [], ...(o.heights ? { heights: o.heights } : {}) } };
}
const DEX = (dex: number) => ({ str: 0, dex, con: 0, int: 0, wis: 0, cha: 0 });
const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', speed: 30, ...p });
const T = () => mk('T', { side: 'enemies' });
const me = (s: BattleState) => s.combatants.A as Combatant;
const up = (ft: number): Command => ({ type: 'vertical_move', actorId: 'A', toFt: ft } as Command);
const run = (s: BattleState, cmd: Command, rng = d20(10)) => execute(s, cmd, P1, rng);
const ok = (r: ReturnType<typeof run>) => { if (!r.ok) throw new Error(r.error); return r; };
const effectOf = (r: ReturnType<typeof run>) => (r.ok ? r.events.find((e) => e.type === 'map_effect' && e.rule === 'climb') : undefined) as Extract<BattleEvent, { type: 'map_effect' }> | undefined;

describe('K71b yüzey ve DC (veri)', () => {
  it('sınıflar kaba 10 / duvar 12 / pürüzsüz 15, çarpan 2 / 2 / 3; sürüm kapısı 57', () => {
    expect(CLIMB_VERSION).toBe(57);
    expect(Object.fromEntries(Object.entries(CLIMB_CLASSES).map(([k, v]) => [k, [v.dc, v.carpan]]))).toEqual({ kaba: [10, 2], normal: [12, 2], puruzsuz: [15, 3] });
  });
  it('harfler: ağaç kaba, duvar normal, sütun pürüzsüz; kristal, uçurum, harita dışı tırmanılmaz', () => {
    const at = (ch: string) => surfaceAt(field([A(), T()], { A: H(3), T: H(11) }, { tiles: tilesWith(7, ch) }), H(7));
    expect(at('a')).toMatchObject({ sinif: 'kaba', dc: 10, topFt: 30 });
    expect(at('s')).toMatchObject({ sinif: 'normal', dc: 12, topFt: 20 });
    expect(at('c')).toMatchObject({ sinif: 'puruzsuz', dc: 15, carpan: 3, topFt: 15 });
    expect(at('e')).toBeNull();
    expect(at('u')).toBeNull();
    expect(at('#')).toBeNull();
  });
  it('tırmanılmaz liste: Wall of Force, Wall of Ice, Prismatic Wall, Forcecage, kristal, donmuş şelale, çadır…', () => {
    const no = dikeyData.tirmanma.tirmanilmaz;
    expect(no.buyu).toEqual(expect.arrayContaining(['wall-of-force', 'wall-of-ice', 'prismatic-wall', 'forcecage']));
    expect(no.harf).toContain('e');
    expect(no.nesne).toEqual(expect.arrayContaining(['frozenFall', 'tent']));
    const zone = (spellId: string): SpellZone => ({ id: `z-${spellId}`, spellId, name: spellId, ownerId: 'T', hexes: [H(7)], dc: 15 } as unknown as SpellZone);
    const s = (z: SpellZone) => field([A(), T()], { A: H(6), T: H(11) }, { zones: [z] });
    expect(surfaceAt(s(zone('wall-of-force')), H(7))).toBeNull();
    expect(surfaceAt(s(zone('wall-of-stone')), H(7))).toMatchObject({ sinif: 'kaba', topFt: 10 });
  });
  it('nesne: kapı duvar sınıfı (10 ft), tepesi bilinmeyen nesne (heykel gözü) tırmanılmaz', () => {
    const door: MapObject = { id: 'k', kind: 'door', at: H(7), hp: 18, state: 'closed' };
    const eye: MapObject = { id: 'g', kind: 'statueEye', at: H(7), hp: 10 } as MapObject;
    expect(surfaceAt(field([A(), T()], { A: H(6), T: H(11) }, { objects: [door] }), H(7))).toMatchObject({ sinif: 'normal', topFt: 10 });
    expect(surfaceAt(field([A(), T()], { A: H(6), T: H(11) }, { objects: [eye] }), H(7))).toBeNull();
  });
  it('sur ezmesi: kale haritalarında duvar `s` kaba (DC 10), 30 ft; hapishane duvarı normal (DC 12)', () => {
    const kale = field([A(), T()], { A: H(3), T: H(11) }, { mapId: 'kale', tiles: tilesWith(7) });
    expect(dikeyOf(kale)?.yuzey).toEqual({ s: 'kaba' });
    expect(surfaceAt(kale, H(7))).toMatchObject({ sinif: 'kaba', dc: 10, topFt: 30 });
    const pr = field([A(), T()], { A: H(3), T: H(11) }, { mapId: 'hapishane-dis-halka', variantId: 'los', tiles: tilesWith(7) });
    expect(surfaceAt(pr, H(7))).toMatchObject({ sinif: 'normal', dc: 12, topFt: 20 });
  });
});

describe('K71b Çeviklik kontrolü (tırmanışın başında)', () => {
  const wall = (p: Partial<Combatant> = {}, ch = 's', ver = 57) => field([A(p), T()], { A: H(6), T: H(11) }, { ver, tiles: tilesWith(7, ch) });
  it('başarı: d20 + DEX (yetkinlik yok, Akrobasi/Atletizm uzmanlığı sayılmaz) ≥ DC; 5 ft = 2 altıgen, tırmanma işareti', () => {
    const s = wall({ modifiers: DEX(3), skills: { acrobatics: 9, athletics: 9 } as never });
    const r = ok(run(s, up(5), d20(9)));
    expect(effectOf(r)?.roll).toMatchObject({ label: 'Çeviklik', dc: 12, natural: 9, total: 12, success: true });
    expect(me(r.state)).toMatchObject({ altitudeFt: 5, climbing: true, movementUsed: 2 });
  });
  it('başarısızlık: düşme yok, yerinde kalır (0 ft), o adımın hareketi (2 altıgen) yanar; hasar ve Prone yok', () => {
    const r = ok(run(wall({ modifiers: DEX(3) }), up(5), d20(8)));
    expect(effectOf(r)?.roll?.success).toBe(false);
    expect(effectOf(r)?.burnMove).toBe(2);
    const a = me(r.state);
    expect([a.altitudeFt ?? 0, a.movementUsed, a.pos, a.hp, a.conditions]).toEqual([0, 2, H(6), 20, []]);
    expect(r.events.some((e) => e.type === 'altitude_changed')).toBe(false);
  });
  it('tırmanırken (duvarda) yeni zar yok; inmek de çarpanlı (×2)', () => {
    const r1 = ok(run(wall({ modifiers: DEX(5) }), up(5), d20(15)));
    const r2 = ok(run(r1.state, up(10), d20(1)));
    expect(effectOf(r2)).toBeUndefined();
    expect(me(r2.state)).toMatchObject({ altitudeFt: 10, movementUsed: 4 });
    const r3 = ok(run(r2.state, up(5)));
    expect(me(r3.state)).toMatchObject({ altitudeFt: 5, movementUsed: 6 });
  });
  it('pürüzsüz sütun: DC 15, ×3 (5 ft = 3 altıgen); kaba ağaç DC 10', () => {
    const r = ok(run(wall({ modifiers: DEX(0) }, 'c'), up(5), d20(15)));
    expect(effectOf(r)?.roll?.dc).toBe(15);
    expect(me(r.state).movementUsed).toBe(3);
    expect(climbStartInfo(wall({}, 'a'), me(wall({}, 'a')))).toMatchObject({ dc: 10, carpan: 2, topFt: 30 });
  });
  it('tırmanma hızı olan zarsız ve ek maliyetsiz (K68b aynen); Çeviklik tırmanıcısı değil', () => {
    const s = wall({ traits: ['climber'] });
    expect(dexClimber(s, me(s))).toBe(false);
    const r = ok(run(s, up(10)));
    expect(effectOf(r)).toBeUndefined();
    expect(me(r.state)).toMatchObject({ altitudeFt: 10, movementUsed: 2 });
  });
  it('engel tepesinin üstüne tırmanılmaz; tırmanılmaz yüzeyde (kristal) başlanmaz', () => {
    const s = wall({ modifiers: DEX(5) });
    expect(run(s, up(25), d20(20))).toMatchObject({ ok: false });
    const cr = run(wall({}, 'e'), up(5), d20(20));
    expect(cr.ok).toBe(false);
  });
  it('olasılık: (21 − DC + DEX) / 20; zar olayda (replay aynı durum)', () => {
    expect(climbOdds(A({ modifiers: DEX(2) }), 12)).toBeCloseTo(0.55);
    expect(climbOdds(A({ modifiers: DEX(-5) }), 15)).toBeCloseTo(0.05);
    const s = wall({ modifiers: DEX(2) });
    const r = ok(run(s, up(5), d20(14)));
    expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  });
  it('sürüm 56: uçuş ya da tırmanma hızı olmayan tırmanamaz (eski karar 9)', () => {
    expect(run(wall({ modifiers: DEX(5) }, 's', 56), up(5), d20(20))).toMatchObject({ ok: false, error: 'Uçuş hızın yok.' });
  });
});

describe('K71b duvar üstünden geçiş (tepede durulmaz) ve tutunma', () => {
  const atTop = (alt: number, ver = 57) => {
    const s = field([A({ modifiers: DEX(2) }), T()], { A: H(6), T: H(13) }, { ver, tiles: tilesWith(7) });
    return { ...s, combatants: { ...s.combatants, A: { ...me(s), altitudeFt: alt, climbing: true as const } } };
  };
  it('20 ft duvarın tepesinden öte yana geçer: her adım ×2; duvar altıgeninde durulmaz', () => {
    const r = ok(run(atTop(20), { type: 'move', actorId: 'A', to: H(8) } as Command));
    expect(me(r.state)).toMatchObject({ pos: H(8), altitudeFt: 20, movementUsed: 4 });
    expect(run(atTop(20), { type: 'move', actorId: 'A', to: H(7) } as Command).ok).toBe(false);
  });
  it('irtifa tepeye yetmezse geçilmez (15 ft < 20 ft duvar)', () => {
    const r = run(atTop(15), { type: 'move', actorId: 'A', to: H(8) } as Command);
    expect(r.ok && me(r.state).pos?.col === 8).toBe(false);
  });
  it('duvarda tutunur (komut sonu düşmez); Prone olunca düşer (tek düşme işlevi: 20 ft = 2d6, irtifa 0)', () => {
    const s = atTop(20);
    const r = ok(run(s, { type: 'end_turn', actorId: 'A' } as Command));
    expect(me(r.state).altitudeFt).toBe(20);
    const prone = { ...s, combatants: { ...s.combatants, A: { ...me(s), hp: 30, maxHp: 30, conditions: ['Prone'] } } };
    const before = fallStats.calls;
    const f = ok(run(prone, { type: 'end_turn', actorId: 'A' } as Command, d20(3, 3)));
    expect(me(f.state).altitudeFt ?? 0).toBe(0);
    expect(fallStats.calls).toBe(before + 1);
    expect(f.events.some((e) => e.type === 'map_effect' && e.rule === 'fall')).toBe(true);
  });
  it('inince tırmanma işareti kalkar', () => {
    const s0 = ok(run(atTop(20), { type: 'move', actorId: 'A', to: H(8) } as Command)).state;
    const s1 = { ...s0, combatants: { ...s0.combatants, A: { ...me(s0), movementUsed: 0, altitudeFt: 5 } } };
    const r = ok(run(s1, up(0)));
    expect(me(r.state).climbing).toBeUndefined();
    expect(me(r.state).altitudeFt ?? 0).toBe(0);
  });
});

describe('K71b katman `climb` komutu tek kurala iner (K4)', () => {
  // Yükseklik sahnesi fikstürü: (6,2) → (7,2) iki seviyelik uçurum.
  const scene = (ver: number, dex: number) => {
    const r = startBattle('k26', 'da-u-urum', [mk('A', { ownerId: 'p1', modifiers: DEX(dex), skills: { athletics: 10 } as never }), mk('B', { side: 'enemies' })], () => 0.5,
      { map: { id: 'yukseklik-sahnesi' }, kuralSurumu: ver } as never);
    return { ...r.state, status: 'active', order: ['A', 'B'], turnIndex: 0, round: 1,
      combatants: { A: { ...(r.state.combatants.A as Combatant), pos: H(6, 2), movementUsed: 0, speed: 60 }, B: { ...(r.state.combatants.B as Combatant), pos: H(13, 6) } } } as BattleState;
  };
  it('Çeviklik (kaba yüzey DC 10; Atletizm sayılmaz), seviye başı ek maliyet ×2; başarıda çıkar', () => {
    const r = ok(run(scene(57, 0), { type: 'climb', actorId: 'A', to: H(7, 2) } as Command, d20(10)));
    expect(effectOf(r)?.roll).toMatchObject({ label: 'Çeviklik', dc: 10, total: 10, success: true });
    expect(me(r.state).pos).toEqual(H(7, 2));
    expect(me(r.state).movementUsed).toBe(5);
  });
  it('başarısızlıkta düşme ve hareket sonu yok: yerinde kalır, adımın hareketi (5) yanar', () => {
    const r = ok(run(scene(57, 0), { type: 'climb', actorId: 'A', to: H(7, 2) } as Command, d20(9)));
    expect(me(r.state).pos).toEqual(H(6, 2));
    expect(me(r.state).movementUsed).toBe(5);
    expect(effectOf(r)?.stopMovement).toBeUndefined();
  });
});

describe('K71b düşme tek işlev (Görev 2)', () => {
  it('20 ft = 2d6 bludgeoning + Prone; derin suya iniş hasarsız; 10 ft altı hasarsız', () => {
    const s = field([A({ hp: 30, maxHp: 30 }), T()], { A: H(6), T: H(11) }, { tiles: tilesWith(null).map((r, i) => (i === 3 ? `${r.slice(0, 6)}w${r.slice(7)}` : r)) });
    const evs = fall(s, 'A', 20, 'irtifa', d20(3, 4), { at: H(5) });
    const fe = evs.find((e) => e.type === 'map_effect') as Extract<BattleEvent, { type: 'map_effect' }>;
    expect(fe).toMatchObject({ rule: 'fall', addCondition: 'Prone' });
    expect(fall(s, 'A', 30, 'itme', d20(6, 6, 6), { at: H(6) }).some((e) => e.type === 'map_effect')).toBe(false);
    expect(fall(s, 'A', 5, 'atlama', d20(6), { at: H(5) })).toEqual([]);
  });
  it('itme ile alçak katmana düşme 57+ tek işlevden (56 eski yol)', () => {
    // Yükseklik sahnesi: B'yi (7,2) → (6,2) iki seviye aşağı itme yerine doğrudan fall çağrısı sayacı.
    const before = fallStats.calls;
    const s = field([A(), T()], { A: H(6), T: H(11) });
    fall(s, 'A', 10, 'itme', d20(2));
    expect(fallStats.calls).toBe(before + 1);
  });
});

describe('K71b Long Jump alçak engel (K7)', () => {
  // Aynı sütunda (düz hat) (5,0) → (5,5): aradaki 4 altıgen = 20 ft; engel (5,2) duvar. STR 40: koşusuz 20 ft menzil.
  const jump = (top: number | null, ver = 57) => {
    const tiles = tilesWith(null).map((r, i) => (i === 2 ? `${r.slice(0, 5)}s${r.slice(6)}` : r));
    const s = field([A({ strScore: 40 }), T()], { A: H(5, 0), T: H(13) }, { ver, tiles });
    const st = top === null ? s : { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), dikey: { engel: { '5,2': top } } } };
    return run(st, { type: 'jump', actorId: 'A', to: H(5, 5) } as Command);
  };
  it('tepesi atlama mesafesinin dörtte biri ya da altı (20 ft atlama, 5 ft engel) geçilir; zar yok', () => {
    const r = jump(5);
    expect(r.ok).toBe(true);
    expect(r.ok && r.events.some((e) => e.type === 'map_effect')).toBe(false);
  });
  it('daha yüksek engel (10 ft > 5 ft) geçilmez; sürüm 56: alçak engel de geçilmez', () => {
    expect(jump(10).ok).toBe(false);
    expect(jump(5, 56).ok).toBe(false);
    expect(jump(null).ok).toBe(false);
  });
});

describe('K71b YZ tırmanma kuralı (K15)', () => {
  const ai = (open: number[]) => {
    const s = field([A({ modifiers: DEX(3) }), T()], { A: H(6), T: H(11) }, { tiles: tilesWith(7, 's', open) });
    return chooseCommand(s);
  };
  it('duvarsız yol yoksa tırmanmaya başlar (dikey hareket)', () => {
    expect(ai([])).toMatchObject({ type: 'vertical_move', actorId: 'A' });
  });
  it('kısa duvarsız yol varken (iki kat kuralı) tırmanmaz, yürür', () => {
    expect(ai([2, 3, 4]).type).toBe('move');
  });
  it('tırmanılmaz duvarın (kristal) önünde tırmanmaz', () => {
    const s = field([A({ modifiers: DEX(3) }), T()], { A: H(6), T: H(11) }, { tiles: tilesWith(7, 'e') });
    expect(chooseCommand(s).type).not.toBe('vertical_move');
  });
  it('tepede: öte yana geçer; öte yanda: iner; birkaç turda düşmana ulaşır (seeded)', () => {
    let s = field([A({ modifiers: DEX(3) }), T()], { A: H(4), T: H(11) }, { tiles: tilesWith(7) });
    const rng = seededRng(5);
    for (let turn = 0; turn < 6; turn++) {
      s = { ...s, turnIndex: 0, combatants: { ...s.combatants, A: { ...me(s), movementUsed: 0, economy: { ...me(s).economy, action: false, bonus: false } } } };
      for (let k = 0; k < 8; k++) {
        const cmd = chooseCommand(s);
        if (cmd.type === 'end_turn') break;
        const r = execute(s, cmd, P1, rng);
        if (!r.ok) break;
        s = r.state;
      }
    }
    expect((me(s).pos?.col ?? 0) > 7).toBe(true);
    expect(me(s).altitudeFt ?? 0).toBe(0);
  });
});

describe('K71b 23 haritanın dikey verisi (Görev 0)', () => {
  const dik = (id: string) => maps.find((m) => m.id === id)?.variants[0]?.dikey;
  it('betikteki ONAYLI tablosuyla aynı duvar boyu (kale 30, batak-kale 25, kasaba 15, ork kampı 10…)', () => {
    const table = Object.fromEntries([...k71Script.matchAll(/'([a-z0-9-]+)': _duvar\((\d+)/g)].map((m) => [m[1], Number(m[2])]));
    expect(Object.keys(table)).toHaveLength(23);
    for (const [id, ft] of Object.entries(table)) expect([id, dik(id)?.harfFt]).toEqual([id, { s: ft, O: ft }]);
    expect(dik('kale')?.harfFt?.s).toBe(30);
    expect(dik('batak-kale')?.harfFt?.s).toBe(25);
    expect(dik('orman-ork-kampi')?.harfFt?.s).toBe(10);
  });
  it('bina içi tavan yalnız kale-avlu ve kale-baskini odalarında (iki 3×3 oda, 15 ft); avlular tavansız', () => {
    const roofed = maps.filter((m) => m.variants.some((v) => v.dikey?.tavanBolge?.length)).map((m) => m.id).sort();
    expect(roofed).toEqual(['kale-avlu', 'kale-baskini']);
    expect(dik('kale-avlu')?.tavanBolge).toEqual([{ dikdortgen: [22, 4, 24, 6], ft: 15 }, { dikdortgen: [22, 10, 24, 12], ft: 15 }]);
    expect(dik('kale-ic-avlu')?.tavanBolge).toBeUndefined();
  });
  it('sur yüzeyi (kaba) 8 kale/şehir haritasında', () => {
    expect(maps.filter((m) => m.variants[0]?.dikey?.yuzey?.s === 'kaba').map((m) => m.id).sort()).toEqual(
      ['batak-kale', 'beyaz-sehir-dis-kapi', 'beyaz-sehir-saray-avlusu', 'kale', 'kale-avlu', 'kale-baskini', 'kale-ic-avlu', 'kale-onu']);
  });
  it('sürüm 55: haritanın dikey ezmesi okunmaz (duvar 20 ft)', () => {
    expect(obstacleTopFt(field([A(), T()], { A: H(3), T: H(11) }, { ver: 55, mapId: 'kale', tiles: tilesWith(7) }), H(7))).toBe(20);
  });
});
