/**
 * Kuyruk K71a (kural sürümü 56; `harita/belgeler/K71-PLAN.md` K1, K9–K13, K16): dikey veri modeli. Harf tablosu
 * (`data/dikey.json`) ve varyant `dikey` ezmeleri engel tepesini verir; irtifası engel tepesine yeten uçan duvar/ağaç/çit
 * üstünden geçer ama orada duramaz (K68 karar 10 geri alındı); görüş hattı katmanlı haritada zemin + engel tepesiyle;
 * altıgen başına tavan (`dikey.tavan`, `tavanBolge`). Sürüm 55 ve altı değişmez. 14 tavanlı haritanın verisi betikle eşit.
 */
import { describe, expect, it } from 'vitest';
import { mk, P1 } from './fixtures';
import { execute, replay, startBattle } from './index';
import { seededRng } from '../rules/dice';
import { lineOfFire, losStats, obstacleTopFt, sightBlockedBetween } from './cover';
import { altitudeCapFt, ceilingFt, climbCapFt } from './altitude';
import { DIKEY_VERSION, dikeyOn, harfFt, tavanEzme, zeminFt } from './vertical';
import { dikeyErrors, maps, type MapDikey } from '../map/maps';
import dikeyData from '../../data/dikey.json';
import k71Script from '../../scripts/k71-dikey.py?raw';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command, MapObject } from './types';

const H = (col: number, row = 3): Offset => ({ col, row });
/** 15×7; `col` sütunu `ch` zemini (duvar, ağaç…), varsa. */
const tilesWith = (col: number | null, ch = 's') => Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c === col ? ch : '.')).join(''));
interface Opts { ver?: number; mapId?: string; variantId?: string; tiles?: string[]; objects?: MapObject[]; dikey?: MapDikey; heights?: number[][] }
function field(parts: Combatant[], pos: Record<string, Offset>, o: Opts = {}): BattleState {
  const s = startBattle('k71a', 'k71a', parts, () => 0.5, { kuralSurumu: o.ver ?? 56, map: { id: o.mapId ?? 'col', variantId: o.variantId ?? 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: o.tiles ?? tilesWith(null), objects: o.objects ?? [],
      ...(o.dikey ? { dikey: o.dikey } : {}), ...(o.heights ? { heights: o.heights } : {}) } };
}
const A = (alt: number, p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', altitudeFt: alt, fly: 60, speed: 60, ...p });
const T = (alt = 0) => mk('T', { side: 'enemies', altitudeFt: alt });
const lof = (s: BattleState) => lineOfFire(s, s.combatants.A as Combatant, s.combatants.T as Combatant);
const move = (s: BattleState, to: Offset) => execute(s, { type: 'move', actorId: 'A', to } as Command, P1, seededRng(3));
const colOf = (r: ReturnType<typeof move>) => (r.ok ? (r.state.combatants.A?.pos?.col ?? -1) : -1);

describe('K71a harf tablosu ve ezme (K1, K12)', () => {
  it('tablo: duvar 20, ağaç 30 (K12), kaya sütunu 15; sürüm kapısı 56', () => {
    expect(DIKEY_VERSION).toBe(56);
    expect(dikeyData.harfFt).toMatchObject({ s: 20, O: 20, a: 30, c: 15 });
    const s = field([A(0), T()], { A: H(3), T: H(11) }, { tiles: tilesWith(7, 'a') });
    expect(dikeyOn(s)).toBe(true);
    expect(harfFt(s, 'a')).toBe(30);
    expect(obstacleTopFt(s, H(7))).toBe(30);
    expect(obstacleTopFt(field([A(0), T()], { A: H(3), T: H(11) }, { tiles: tilesWith(7, 's') }), H(7))).toBe(20);
  });
  it('varyant `harfFt` ezmesi tabloyu, altıgen `engel` ezmesi harfi geçer; null tam engel', () => {
    const d: MapDikey = { harfFt: { s: 30 }, engel: { '7,2': 10, '7,4': null } };
    const s = field([A(0), T()], { A: H(3), T: H(11) }, { tiles: tilesWith(7), dikey: d });
    expect(obstacleTopFt(s, H(7, 3))).toBe(30);
    expect(obstacleTopFt(s, H(7, 2))).toBe(10);
    expect(obstacleTopFt(s, H(7, 4))).toBe(Infinity);
  });
  it('nesne yüksekliği ezmeden önce (kapı 10 ft); tavanlı haritada duvar tavana dek (sonsuz)', () => {
    const door: MapObject = { id: 'kapi', kind: 'door', at: H(7), hp: 18, state: 'closed' };
    const s = field([A(0), T()], { A: H(3), T: H(11) }, { objects: [door], dikey: { engel: { '7,3': 40 } } });
    expect(obstacleTopFt(s, H(7))).toBe(10);
    const cave = field([A(0), T()], { A: H(3), T: H(11) }, { mapId: 'magara', variantId: 'magara', tiles: tilesWith(7) });
    expect(ceilingFt(cave, H(7))).toBe(20);
    expect(obstacleTopFt(cave, H(7))).toBe(Infinity);
  });
  it('tabloda olmayan engel harfi sonsuz (bugünkü tam engel)', () => {
    const s = field([A(0), T()], { A: H(3), T: H(11) }, { tiles: tilesWith(7, '#') });
    expect(obstacleTopFt(s, H(7))).toBe(Infinity);
  });
  it('sürüm 55: ağaç sonsuz, ezme okunmaz (K68c değerleri)', () => {
    const s = field([A(0), T()], { A: H(3), T: H(11) }, { ver: 55, tiles: tilesWith(7, 'a'), dikey: { engel: { '7,3': 5 } } });
    expect(dikeyOn(s)).toBe(false);
    expect(obstacleTopFt(s, H(7))).toBe(Infinity);
    expect(obstacleTopFt(field([A(0), T()], { A: H(3), T: H(11) }, { ver: 55, tiles: tilesWith(7) }), H(7))).toBe(20);
  });
});

describe('K71a uçanın engel aşması (K68 karar 10 geri alındı)', () => {
  it('irtifası duvar tepesine (20 ft) yeten uçan duvarın üstünden geçer', () => {
    expect(colOf(move(field([A(20), T()], { A: H(3), T: H(13) }, { tiles: tilesWith(7) }), H(9)))).toBe(9);
    expect(colOf(move(field([A(30), T()], { A: H(3), T: H(13) }, { tiles: tilesWith(7) }), H(9)))).toBe(9);
  });
  it('irtifa yetmezse geçmez (15 ft < 20 ft duvar); ağaçta 25 ft < 30 ft, 30 ft geçer', () => {
    expect(colOf(move(field([A(15), T()], { A: H(3), T: H(13) }, { tiles: tilesWith(7) }), H(9)))).not.toBe(9);
    expect(colOf(move(field([A(25), T()], { A: H(3), T: H(13) }, { tiles: tilesWith(7, 'a') }), H(9)))).not.toBe(9);
    expect(colOf(move(field([A(30), T()], { A: H(3), T: H(13) }, { tiles: tilesWith(7, 'a') }), H(9)))).toBe(9);
  });
  it('engel altıgeninde duramaz (duvarın ve ağacın üstünde yürüyüş biter mi: hayır)', () => {
    const r = move(field([A(40), T()], { A: H(3), T: H(13) }, { tiles: tilesWith(7) }), H(7));
    expect(r.ok).toBe(false);
    const tree = move(field([A(40), T()], { A: H(3), T: H(13) }, { tiles: tilesWith(7, 'a') }), H(7));
    expect(tree.ok).toBe(false);
  });
  it('uçmayan (irtifası olsa da uçuş hızı yok) ve yerdeki uçan geçmez', () => {
    expect(colOf(move(field([A(30, { fly: 0 }), T()], { A: H(3), T: H(13) }, { tiles: tilesWith(7) }), H(9)))).not.toBe(9);
    expect(colOf(move(field([A(0), T()], { A: H(3), T: H(13) }, { tiles: tilesWith(7) }), H(9)))).not.toBe(9);
  });
  it('tavanlı haritada duvar tavana dek: uçan geçmez', () => {
    const cave = field([A(10), T()], { A: H(3), T: H(13) }, { mapId: 'magara', variantId: 'magara', tiles: tilesWith(7) });
    expect(colOf(move(cave, H(9)))).not.toBe(9);
  });
  it('sürüm 55: 40 ft\'te de duvardan geçilmez (eski karar 10)', () => {
    expect(colOf(move(field([A(40), T()], { A: H(3), T: H(13) }, { ver: 55, tiles: tilesWith(7) }), H(9)))).not.toBe(9);
  });
  it('replay aynı durumu verir', () => {
    const s = field([A(30), T()], { A: H(3), T: H(13) }, { tiles: tilesWith(7) });
    const r = move(s, H(9));
    expect(r.ok).toBe(true);
    if (r.ok) expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  });
});

describe('K71a altıgen tavanı (K11)', () => {
  const roof: MapDikey = { tavanBolge: [{ dikdortgen: [5, 0, 9, 6], ft: 15 }], tavan: { '9,3': 0 } };
  it('tavan bölgesi ve altıgen ezmesi; dışında açık gök; 0 = açık gök', () => {
    const s = field([A(0), T()], { A: H(3), T: H(11) }, { dikey: roof });
    expect(ceilingFt(s, H(6))).toBe(15);
    expect(ceilingFt(s, H(3))).toBeNull();
    expect(tavanEzme(s, H(9))).toBeNull();
    expect(ceilingFt(s, H(9))).toBeNull();
  });
  it('irtifa üst sınırı altıgenin tavanından (15 − 5 = 10 ft); dışarıda 120', () => {
    const s = field([A(0), T()], { A: H(6), T: H(11) }, { dikey: roof });
    expect(altitudeCapFt(s, s.combatants.A as Combatant)).toBe(10);
    expect(altitudeCapFt(s, { ...(s.combatants.A as Combatant), pos: H(3) })).toBe(120);
  });
  it('30 ft\'te uçan çatılı alana giremez; 10 ft\'te girer', () => {
    expect(colOf(move(field([A(30), T()], { A: H(3), T: H(13) }, { dikey: roof }), H(6)))).not.toBe(6);
    expect(colOf(move(field([A(10), T()], { A: H(3), T: H(13) }, { dikey: roof }), H(6)))).toBe(6);
  });
  it('varyant tavanFt varsayılan kalır (ezmesiz altıgende); sürüm 55 ezmeyi okumaz', () => {
    const cave = field([A(0), T()], { A: H(3), T: H(11) }, { mapId: 'magara', variantId: 'magara', dikey: { tavan: { '4,3': 30 } } });
    expect(ceilingFt(cave, H(3))).toBe(20);
    expect(ceilingFt(cave, H(4))).toBe(30);
    const old = field([A(0), T()], { A: H(6), T: H(11) }, { ver: 55, dikey: roof });
    expect(ceilingFt(old, H(6))).toBeNull();
    expect(altitudeCapFt(old, old.combatants.A as Combatant)).toBe(120);
  });
  it('görüş: çatının üstünden içeri bakan görmez ("çatı"), çatısız alanda görür', () => {
    expect(lof(field([A(40), T()], { A: H(3), T: H(11) }, { dikey: roof }))).toMatchObject({ blocked: true, blockedBy: 'çatı' });
    expect(lof(field([A(40), T()], { A: H(3), T: H(11) })).blocked).toBe(false);
  });
});

describe('K71a görüş hattında zemin + engel tepesi (K10)', () => {
  /** 15×7 katman: `ridge` sütunu `lvl` seviye, diğerleri `base`. */
  const layer = (base: number, ridgeCol: number | null = null, lvl = 0) => Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c === ridgeCol ? lvl : base)));
  it('katman sırtı geometrik: 30 ft sırtı 40 ft\'ten aşamaz, 80 ft\'ten aşar; sürüm 55 2B sırtta 80 ft\'te de keser', () => {
    const at = (alt: number, ver = 56) => field([A(alt), T()], { A: H(3), T: H(11) }, { ver, heights: layer(0, 7, 3) });
    expect(zeminFt(at(0), H(7))).toBe(30);
    expect(lof(at(40))).toMatchObject({ blocked: true, blockedBy: 'yükselti' });
    expect(lof(at(80)).blocked).toBe(false);
    expect(lof(at(80, 55)).blocked).toBe(true);
  });
  it('zemin uçlara eklenir: 20 ft tepedeki iki yaratık aradaki çukurdaki 20 ft duvarın üstünden görür; sürüm 55 görmez', () => {
    const heights = Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c >= 6 && c <= 8 ? 0 : 2)));
    const at = (ver: number) => field([A(10), T()], { A: H(3), T: H(11) }, { ver, tiles: tilesWith(7), heights });
    expect(lof(at(56)).blocked).toBe(false);
    expect(lof(at(55)).blocked).toBe(true);
  });
  it('nokta görüşü de aynı çekirdekten (sightBlockedBetween)', () => {
    const s = field([A(80), T()], { A: H(3), T: H(11) }, { heights: layer(0, 7, 3) });
    expect(sightBlockedBetween(s, H(3), H(11), { from: s.combatants.A, to: s.combatants.T })).toBeNull();
    const low = field([A(40), T()], { A: H(3), T: H(11) }, { heights: layer(0, 7, 3) });
    expect(sightBlockedBetween(low, H(3), H(11), { from: low.combatants.A, to: low.combatants.T })).toBe('yükselti');
  });
  it('ağaç 30 ft: 60 ft\'ten görülür, 40 ft\'ten görülmez (sürüm 55\'te ağaç her irtifada keser)', () => {
    const at = (alt: number, ver = 56) => field([A(alt), T()], { A: H(3), T: H(11) }, { ver, tiles: tilesWith(7, 'a') });
    expect(lof(at(40)).blocked).toBe(true);
    expect(lof(at(60)).blocked).toBe(false);
    expect(lof(at(60, 55)).blocked).toBe(true);
  });
  it('hızlı yol: iki uç yerde (0 irtifa) irtifalı yola girilmez, sonuç sürüm 55 ile aynı', () => {
    const before = losStats.altPath;
    for (const ver of [55, 56]) {
      expect(lof(field([A(0), T()], { A: H(3), T: H(11) }, { ver, tiles: tilesWith(7) }))).toEqual({ blocked: true, blockedBy: 'Duvar', cover: 0 });
      expect(lof(field([A(0), T()], { A: H(3), T: H(11) }, { ver, heights: layer(0, 7, 3) })).blocked).toBe(true);
    }
    expect(losStats.altPath).toBe(before);
    lof(field([A(5), T()], { A: H(3), T: H(11) }, { tiles: tilesWith(7) }));
    expect(losStats.altPath).toBeGreaterThan(before);
  });
});

describe('K71a açık alanda tırmanma sınırı ve veri', () => {
  it('tırmanıcının üst sınırı bitişik engelin tepesi (ağaç 30 ft); sürüm 55\'te 20 ft', () => {
    const at = (ver: number) => field([A(0, { fly: 0, climb: 30 } as Partial<Combatant>), T()], { A: H(6), T: H(11) }, { ver, tiles: tilesWith(7, 'a') });
    const s = at(56);
    expect(climbCapFt(s, s.combatants.A as Combatant)).toBe(30);
    const o = at(55);
    expect(climbCapFt(o, o.combatants.A as Combatant)).toBe(20);
  });
  it('dikey ezme doğrulaması: 5 ft adım, 0–120, "c,r" anahtarı, dikdörtgen sırası', () => {
    expect(dikeyErrors({ engel: { '3,4': 20 }, tavan: { '1,1': 0 }, tavanBolge: [{ dikdortgen: [0, 0, 2, 2], ft: 15 }] }, 'x')).toEqual([]);
    expect(dikeyErrors({ engel: { '3,4': 7 } }, 'x').length).toBeGreaterThan(0);
    expect(dikeyErrors({ engel: { 'a': 20 } }, 'x').length).toBeGreaterThan(0);
    expect(dikeyErrors({ tavan: { '1,1': 3 } }, 'x').length).toBeGreaterThan(0);
    expect(dikeyErrors({ tavanBolge: [{ dikdortgen: [4, 0, 2, 2], ft: 15 }] }, 'x').length).toBeGreaterThan(0);
    expect(dikeyErrors({ harfFt: { s: 200 } }, 'x').length).toBeGreaterThan(0);
  });
  it('14 tavanlı haritanın tavanFt verisi betikteki TAVAN tablosuyla aynı (K14: k68-tavan.py taşındı)', () => {
    const block = k71Script.slice(k71Script.indexOf('TAVAN = {'), k71Script.indexOf('}', k71Script.indexOf('TAVAN = {')));
    const table = Object.fromEntries([...block.matchAll(/'([a-z0-9-]+)': \((\d+),/g)].map((m) => [m[1], Number(m[2])]));
    expect(Object.keys(table)).toHaveLength(14);
    const withCeil = maps.filter((m) => m.variants.some((v) => v.tavanFt !== undefined));
    expect(withCeil.map((m) => m.id).sort()).toEqual(Object.keys(table).sort());
    for (const m of withCeil) for (const v of m.variants) expect([m.id, v.tavanFt]).toEqual([m.id, table[m.id]]);
  });
  it('onaylı dikey ezme yalnız 23 duvarlı açık haritada (Kuyruk K71b onayı; tavanlı 14 haritada yok)', () => {
    const withDikey = [...new Set(maps.flatMap((m) => m.variants.filter((v) => v.dikey).map(() => m.id)))];
    expect(withDikey).toHaveLength(23);
    expect(withDikey.some((id) => maps.find((m) => m.id === id)?.variants.some((v) => v.tavanFt !== undefined))).toBe(false);
  });
});
