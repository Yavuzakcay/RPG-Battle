/**
 * Kuyruk K68c (kural sürümü 52): görüş hattında irtifa. İki ucun göz yüksekliği (irtifa + boyun yarısı) arasında doğrusal hat;
 * hat altıgendeki engelin tepesinden yüksekse engel görüşü kesmez (açık alanda duvar 20 ft, kapı 10 ft; tavanlı haritada
 * duvar aşılamaz). Yoğun örtü (Fog Cloud) tepesinin üstünden bakan görür. İki uç da 0 irtifadaysa hızlı yol (bugünkü kod;
 * `losStats` sayacı artmaz). Sürüm 51 eski davranış sabit. `run` replay'i denetler.
 */
import { describe, expect, it } from 'vitest';
import { mk, P1 } from './fixtures';
import { execute, replay, startBattle } from './index';
import { seededRng } from '../rules/dice';
import { coverFrom, lineOfFire, losStats, obstacleTopFt, sightBlockedBetween } from './cover';
import { checkReach } from './range';
import { terrainInfo } from '../ui/mapView';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command, MapObject } from './types';

const H = (col: number, row = 3): Offset => ({ col, row });
const RANGED = { kind: 'ranged' as const, normalFt: 150, longFt: 600, label: 'yay' };
/** 15×7; `wallCol` sütunu duvar (`s`), varsa. */
const tilesWith = (wallCol: number | null, ch = 's') => Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c === wallCol ? ch : '.')).join(''));
function field(parts: Combatant[], pos: Record<string, Offset>, opts: { ver?: number; mapId?: string; variantId?: string; tiles?: string[]; objects?: MapObject[] } = {}): BattleState {
  const s = startBattle('k68c', 'k68c', parts, () => 0.5, { kuralSurumu: opts.ver ?? 52, map: { id: opts.mapId ?? 'col', variantId: opts.variantId ?? 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: opts.tiles ?? tilesWith(null), objects: opts.objects ?? [] } };
}
const A = (alt: number, p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', altitudeFt: alt, fly: 60, ...p });
const T = (alt = 0) => mk('T', { side: 'enemies', altitudeFt: alt });
const lof = (s: BattleState) => lineOfFire(s, s.combatants.A as Combatant, s.combatants.T as Combatant);
const door = (at: Offset): MapObject => ({ id: 'kapi', kind: 'door', at, hp: 18, state: 'closed' });

describe('K68c duvarın üstünden görme (açık alan, duvar 20 ft)', () => {
  // A (3,3) → T (11,3): duvar 7. sütunda, hattın ortası (i = 4 / 8). T gözü 2,5 ft.
  const at = (alt: number, ver = 52) => field([A(alt), T()], { A: H(3), T: H(11) }, { ver, tiles: tilesWith(7) });
  it('hat duvar hizasında 20 ft\'ten yüksekse görür (40 ft: hat 22,5), eşit ya da alçaksa görmez (35 ft: 20; 30 ft: 17,5)', () => {
    expect(obstacleTopFt(at(40), H(7))).toBe(20);
    expect(lof(at(40)).blocked).toBe(false);
    expect(lof(at(40)).over).toBe('Duvar');
    expect(lof(at(35)).blocked).toBe(true);
    expect(lof(at(30)).blocked).toBe(true);
  });
  it('saldırı hedeflemesi aynı çağrıdan: 40 ft\'ten ok atılır, arayüz notu "Duvar üstünden görünür"', () => {
    const s = at(40);
    const r = checkReach(s, s.combatants.A as Combatant, s.combatants.T as Combatant, RANGED);
    expect('ok' in r && r.ok).toBe(true);
    expect((r as { over?: string }).over).toBe('Duvar');
    const low = at(30);
    expect(checkReach(low, low.combatants.A as Combatant, low.combatants.T as Combatant, RANGED)).toMatchObject({ ok: false });
  });
  it('nokta görüşü (alan büyüsü, ışınlanma) uçtaki yaratığın gözünden; nokta zeminde', () => {
    const s = at(40);
    expect(sightBlockedBetween(s, H(3), H(11), { from: s.combatants.A })).toBeNull();
    expect(sightBlockedBetween(s, H(3), H(11))).toBe('Duvar');
    expect(coverFrom(s, H(3), s.combatants.T as Combatant, ['A'], s.combatants.A as Combatant).blocked).toBe(false);
  });
  it('iki uç havada da (hedef 30 ft uçuyor) duvarın üstünden görür; hareket değişmez (karar 10: duvardan geçilmez)', () => {
    const s = field([A(30), T(30)], { A: H(3), T: H(11) }, { tiles: tilesWith(7) });
    expect(lof(s).blocked).toBe(false);
    const r = execute(s, { type: 'move', actorId: 'A', to: H(8) } as Command, P1, seededRng(3));
    expect(r.ok && (r.state.combatants.A?.pos?.col ?? 0) > 7).toBe(false);
  });
  it('sürüm 51: irtifa görüşe girmez (40 ft\'te de duvar keser)', () => {
    expect(lof(at(40, 51)).blocked).toBe(true);
  });
});

describe('K68c kapı üstünden görme (10 ft)', () => {
  const at = (alt: number) => field([A(alt), T()], { A: H(3), T: H(11) }, { objects: [door(H(7))] });
  it('kapı 10 ft: hat 12,5 ft (20 ft irtifa) görür, 10 ft (15 ft irtifa) görmez', () => {
    expect(obstacleTopFt(at(20), H(7))).toBe(10);
    expect(lof(at(20)).blocked).toBe(false);
    expect(lof(at(15)).blocked).toBe(true);
  });
  it('altıgen bilgisinde "görüşü 10 ft\'e dek keser"; yüksekliği bilinmeyen engel (ağaç) tam engel', () => {
    expect(terrainInfo(at(0), H(7))).toMatch(/görüşü 10 ft'e dek keser/);
    const tree = field([A(100), T()], { A: H(3), T: H(11) }, { tiles: tilesWith(7, 'a') });
    expect(obstacleTopFt(tree, H(7))).toBe(Infinity);
    expect(lof(tree).blocked).toBe(true);
    expect(terrainInfo(tree, H(7))).toMatch(/görüşü keser/);
  });
});

describe('K68c tavanlı harita', () => {
  it('duvar tavana dek: uçan da duvarın üstünden göremez (mağara 20 ft)', () => {
    const s = field([A(15), T()], { A: H(3), T: H(11) }, { mapId: 'magara', variantId: 'magara', tiles: tilesWith(7) });
    expect(obstacleTopFt(s, H(7))).toBe(Infinity);
    expect(lof(s).blocked).toBe(true);
    // Yapay olarak tavanın üstündeki irtifada bile (hat tavanın üstüne çıkamaz).
    const hi = { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), altitudeFt: 100 } } };
    expect(lof(hi).blocked).toBe(true);
  });
  it('kapı (10 ft) tavanlı haritada da nesne yüksekliğiyle: 15 ft\'teki uçan (hat 10,0) görmez', () => {
    const s = field([A(15), T()], { A: H(3), T: H(11) }, { mapId: 'magara', variantId: 'magara', objects: [door(H(7))] });
    expect(lof(s).blocked).toBe(true);
  });
});

describe('K68c hızlı yol (iki uç zeminde)', () => {
  it('iki uç 0 irtifada: irtifalı yola hiç girilmez (sayaç), sonuç sürüm 51 ile aynı', () => {
    const before = losStats.altPath;
    for (const ver of [51, 52]) {
      const s = field([A(0), T()], { A: H(3), T: H(11) }, { ver, tiles: tilesWith(7) });
      expect(lof(s)).toEqual({ blocked: true, blockedBy: 'Duvar', cover: 0 });
      expect(sightBlockedBetween(s, H(3), H(11), { from: s.combatants.A, to: s.combatants.T })).toBe('Duvar');
      const open = field([A(0), T()], { A: H(3), T: H(11) }, { ver, objects: [door(H(7))] });
      expect(lof(open).blocked).toBe(true);
      checkReach(open, open.combatants.A as Combatant, open.combatants.T as Combatant, RANGED);
    }
    expect(losStats.altPath).toBe(before);
    // Bir uç havadaysa girilir.
    lof(field([A(5), T()], { A: H(3), T: H(11) }, { tiles: tilesWith(7) }));
    expect(losStats.altPath).toBeGreaterThan(before);
  });
});

describe('K68c yarıkta eksi irtifa', () => {
  it('eksi irtifa zeminde sayılmaz (irtifalı yol); hat daha alçak: duvar ve kapı yine keser, açık hat açık kalır', () => {
    const before = losStats.altPath;
    const wall = field([A(-10, { fly: 0 }), T()], { A: H(3), T: H(11) }, { tiles: tilesWith(7) });
    expect(lof(wall).blocked).toBe(true);
    expect(losStats.altPath).toBeGreaterThan(before);
    const clear = field([A(-10, { fly: 0 }), T()], { A: H(3), T: H(11) });
    expect(lof(clear).blocked).toBe(false);
  });
});

describe('K68c yoğun örtü (Fog Cloud) tepesi', () => {
  // C sisi A'nın çevresine yapar (merkez 2,3; yarıçap 20 ft = 4 altıgen, tepe 20 ft). A (0,3) uçuyor, T (14,3) yerde.
  const fog = (alt: number, ver = 52) => {
    const caster = mk('C', { ownerId: 'p1', spellNames: ['Fog Cloud'], spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0], spellSaveDc: 13, spellAttack: 5, spellMod: 3, casterTag: 'wizard' });
    const s = field([caster, A(alt), T()], { C: H(1, 0), A: H(0), T: H(14) }, { ver });
    const r = execute(s, { type: 'cast_spell', actorId: 'C', spellName: 'Fog Cloud', targetHex: H(2) } as Command, P1, seededRng(3));
    if (!r.ok) throw new Error(r.error);
    expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
    const st = r.state;
    const reach = checkReach(st, st.combatants.A as Combatant, st.combatants.T as Combatant, RANGED);
    return 'ok' in reach && reach.ok ? reach.sources.map((x) => x.reason) : [];
  };
  it('sisin tepesinin (20 ft) üstündeki 40 ft\'ten bakan sis etkisi almaz; 25 ft\'te hat sisin içinden geçer', () => {
    expect(fog(40)).toEqual([]);
    expect(fog(25)).toEqual(expect.arrayContaining(['Görülmeyen hedef (arada yoğun örtü)']));
  });
  it('sürüm 51: sis altıgenindeki uçan (40 ft) yine örtüde sayılır', () => {
    expect(fog(40, 51)).toEqual(expect.arrayContaining(['Görülmeyen saldıran (yoğun örtü)']));
  });
});
