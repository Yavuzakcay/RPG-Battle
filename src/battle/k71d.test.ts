/**
 * Kuyruk K71d (kural sürümü 59): katman + irtifa tek mutlak yükseklik, katman uçurumunda SRD tırmanması (K71b iç işlevi, çok
 * turlu), düşme birleşimi, K8 yüksek zemin (≥ 10 ft, iki uç yerde), K9 zemin terimli uzaklık (erişim, menzil, fırsat saldırısı,
 * alan), tepedeki okçu (K10 görüş çekirdeği iki uç yerdeyken de; düz yolda hızlı yol), 58 sabit.
 * Fikstür `yukseklik-sahnesi` (sırt 4. sütun satır 0–2 seviye 1; plato 7–9. sütun satır 1–5 seviye 2; seviye 10 ft).
 */
import { describe, expect, it, vi } from 'vitest';
vi.mock('../map/maps', async (importOriginal) => (await import('../map/fixtures/yukseklikSahnesi')).withYukseklik(await importOriginal()));
import { execute } from './commands';
import { startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { applyEvents } from './reduce';
import { attackHeights, lineOfFire, losStats } from './cover';
import { highGroundK8, rangeBonusFt } from './heights';
import { absBand, k9Ft, mutlakFt } from './vertical';
import { altitudeCapFt, areaOriginFt, areaReachesAltitude, reachFt } from './altitude';
import { checkReach } from './range';
import { opportunityAttacks } from './features';
import { occupantAt } from './movement';
import { bandOf } from './cells';
import { shoveHex } from './forced';
import { chooseCommand } from './ai';
import { attackChoices } from '../ui/mapView';
import { attackSources } from '../rules/conditions';
import { line, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const low: Rng = () => 0.01;
const BOW = { label: 'Yay', attackBonus: 5, damage: '1d8+3', damageType: 'piercing', ranged: true, range: [150, 600], spell: false, tag: 'bow' } as never;
const BITE = [{ name: 'Bite', bonus: 5, damageDice: '1d6', damageType: 'piercing', repeat: 1, ranged: false, reachFt: 5, text: 'Bite' }] as never;

interface Opt { v?: number; toggles?: Record<string, boolean>; a?: Partial<Combatant>; b?: Partial<Combatant>; heights?: (c: number, r: number) => number; tiles?: Record<string, string>; levelFt?: number }
function scene(a: Offset, b: Offset, opt: Opt = {}): BattleState {
  const r = startBattle('k71d', 'da-u-urum', [mk('A', { ownerId: 'p1', ...opt.a }), mk('B', { side: 'enemies', attacks: BITE, ...opt.b })], () => 0.5, {
    map: { id: 'yukseklik-sahnesi', ...(opt.toggles ? { ruleToggles: opt.toggles } : {}), ...(opt.levelFt ? { ruleParams: { heightFall: { levelFt: opt.levelFt } } } : {}) },
    kuralSurumu: opt.v ?? 59,
  } as never);
  const st = r.state;
  const map = st.map as NonNullable<BattleState['map']>;
  const heights = opt.heights ? map.heights?.map((row, ri) => row.map((_, ci) => (opt.heights as (c: number, r: number) => number)(ci, ri))) : map.heights;
  const tiles = map.tiles.map((row, ri) => [...row].map((ch, ci) => opt.tiles?.[`${ci},${ri}`] ?? ch).join(''));
  const A0 = opt.a?.altitudeFt;
  const B0 = opt.b?.altitudeFt;
  return { ...st, status: 'active', order: ['A', 'B'], turnIndex: 0, round: 1, map: { ...map, heights, tiles, objects: [] },
    combatants: { A: { ...(st.combatants.A as Combatant), pos: a, movementUsed: 0, ...(A0 ? { altitudeFt: A0 } : {}) }, B: { ...(st.combatants.B as Combatant), pos: b, ...(B0 ? { altitudeFt: B0 } : {}) } } } as BattleState;
}
const A = (s: BattleState) => s.combatants.A as Combatant;
const B = (s: BattleState) => s.combatants.B as Combatant;
const run = (s: BattleState, cmd: Command, rng: Rng = high) => execute(s, cmd, P1, rng);
const climb = (to: Offset): Command => ({ type: 'climb', actorId: 'A', to });
const falls = (evs: BattleEvent[]) => evs.filter((e) => e.type === 'map_effect' && e.rule === 'fall');
/** Batı yarısı 10 ft plato (0–4. sütun seviye 1), doğusu zemin. */
const westLedge = (c: number) => (c <= 4 ? 1 : 0);

describe('K71d mutlak yükseklik (tek işlev)', () => {
  it('mutlakFt = zemin + irtifa; K9 yüksekliği heightMove kapalıyken yalnız irtifa', () => {
    const s = scene(o(8, 2), o(12, 2), { a: { altitudeFt: 15 } });
    expect(mutlakFt(s, A(s))).toBe(35);
    expect(mutlakFt(s, B(s))).toBe(0);
    expect(k9Ft(s, A(s))).toBe(35);
    const off = scene(o(8, 2), o(12, 2), { a: { altitudeFt: 15 }, toggles: { heightMove: false } });
    expect(k9Ft(off, A(off))).toBe(15);
    expect(mutlakFt(off, A(off))).toBe(35);
  });
  it('uçan irtifayı kendi altıgeninin zemininden sayar: platoya yatay uçuşta irtifa aynı, mutlak +20; üst sınır da o zeminden', () => {
    const s = scene(o(5, 2), o(13, 6), { a: { fly: 30, altitudeFt: 10 } });
    const r = run(s, { type: 'move', actorId: 'A', to: o(7, 2), toFt: 10 } as Command);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect([A(r.state).pos, A(r.state).altitudeFt, mutlakFt(r.state, A(r.state))]).toEqual([o(7, 2), 10, 30]);
    expect(altitudeCapFt(r.state, A(r.state))).toBe(altitudeCapFt(s, A(s)));
  });
  it('hücre çözücüsü katmanlı haritada: platodaki yerdeki yaratığın 10 ft üstünde uçan durur; yer sorgusu yalnız yerdekini görür', () => {
    const s = scene(o(6, 1), o(8, 2), { a: { fly: 30, altitudeFt: 10 } });
    const r = run(s, { type: 'move', actorId: 'A', to: o(8, 2), toFt: 10 } as Command);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(occupantAt(r.state, o(8, 2))?.id).toBe('B');
    expect(occupantAt(r.state, o(8, 2), 'B', bandOf(B(r.state)))).toBeUndefined();
    expect(absBand(r.state, A(r.state))).toEqual({ lo: 6, hi: 6 });
  });
});

describe('K71d katman uçurumu: SRD tırmanması (K71b iç işlevi)', () => {
  it('20 ft uçurum 1 + 4 × 2 = 9 altıgen: hız 30 yetmez (gerekçe), hız 60 ile çıkar; 58\'de 5 altıgen', () => {
    const r30 = run(scene(o(6, 2), o(13, 6)), climb(o(7, 2)));
    expect(r30.ok).toBe(false);
    if (!r30.ok) expect(r30.error).toMatch(/9 altıgen gerekli \(20 ft tırmanma\)/);
    const r60 = run(scene(o(6, 2), o(13, 6), { a: { speed: 60 } }), climb(o(7, 2)));
    expect(r60.ok).toBe(true);
    if (r60.ok) expect([A(r60.state).pos, A(r60.state).movementUsed]).toEqual([o(7, 2), 9]);
    const r58 = run(scene(o(6, 2), o(13, 6), { v: 58 }), climb(o(7, 2)));
    expect(r58.ok).toBe(true);
    if (r58.ok) expect(A(r58.state).movementUsed).toBe(5);
  });
  it('zorlu arazili varış: çarpan 3 (1 + 4 × 3 = 13 altıgen)', () => {
    const r = run(scene(o(6, 2), o(13, 6), { a: { speed: 70 }, tiles: { '7,2': 't' } }), climb(o(7, 2)));
    expect(r.ok).toBe(true);
    if (r.ok) expect(A(r.state).movementUsed).toBe(13);
  });
  it('Çeviklik tutmazsa ilk 5 ft yanar (2 altıgen), düşme yok, yerinde kalır', () => {
    const r = run(scene(o(6, 2), o(13, 6), { a: { speed: 60 } }), climb(o(7, 2)), low);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect([A(r.state).pos, A(r.state).movementUsed, A(r.state).hp]).toEqual([o(6, 2), 2, A(scene(o(6, 2), o(13, 6))).hp]);
    expect(r.events.some((e) => e.type === 'map_effect' && e.rule === 'climb' && e.burnMove === 2)).toBe(true);
    expect(falls(r.events)).toHaveLength(0);
  });
  it('iki turda: uçurum yüzünde 10 ft dikey hareket (zar), komut sonunda tutunur; sonraki tur kalan 10 ft (5 altıgen, zarsız)', () => {
    const r1 = run(scene(o(6, 2), o(13, 6)), { type: 'vertical_move', actorId: 'A', toFt: 10 } as Command);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    expect([A(r1.state).altitudeFt, A(r1.state).movementUsed, A(r1.state).climbing]).toEqual([10, 4, true]);
    const next = { ...r1.state, combatants: { ...r1.state.combatants, A: { ...A(r1.state), movementUsed: 0 } } };
    const r2 = run(next, climb(o(7, 2)), low);
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect([A(r2.state).pos, A(r2.state).altitudeFt, A(r2.state).movementUsed]).toEqual([o(7, 2), 0, 5]);
    expect(r2.events.some((e) => e.type === 'map_effect' && e.rule === 'climb')).toBe(false);
  });
  it('YZ: tek turda yetmeyen uçurumda yüzde yükselir (dikey hareket), sonraki tur climb ile çıkar', () => {
    const s0 = scene(o(8, 2), o(10, 2), { b: { skills: { athletics: 20 }, strScore: 3 } as Partial<Combatant> });
    const s = { ...s0, order: ['B', 'A'] } as BattleState;
    const c1 = chooseCommand(s);
    expect(c1).toMatchObject({ type: 'vertical_move', actorId: 'B', toFt: 15 });
    const r1 = execute(s, c1, GM, high);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const t2 = { ...r1.state, combatants: { ...r1.state.combatants, B: { ...B(r1.state), movementUsed: 0 } } };
    expect(chooseCommand(t2)).toMatchObject({ type: 'climb', actorId: 'B' });
  });
});

describe('K71d düşme: katman + irtifa tek düşme', () => {
  it('aşağı atlama 20 ft: tek düşme (2d6), Prone', () => {
    const r = run(scene(o(7, 2), o(13, 6)), climb(o(6, 2)));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(falls(r.events)).toHaveLength(1);
    expect(A(r.state).conditions).toContain('Prone');
  });
  it('duvarda tutunan plato kenarından itilince seviye farkı + irtifa tek düşme (30 ft), irtifa 0; komut sonunda ikinci düşme yok', () => {
    const s = scene(o(8, 2), o(9, 2), { tiles: { '9,1': 's', '10,1': 's' }, b: { altitudeFt: 10, climbing: true } as Partial<Combatant> });
    const to = shoveHex(A(s), B(s));
    expect(to && s.map?.heights?.[to.row]?.[to.col]).toBe(0);
    const r = run(s, { type: 'shove', actorId: 'A', targetId: 'B', effect: 'push' }, low);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const f = falls(r.events);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ text: expect.stringMatching(/30 ft/) });
    expect([B(r.state).pos, B(r.state).altitudeFt ?? 0]).toEqual([to, 0]);
  });
});

describe('K71d K8 yüksek zemin', () => {
  it('mutlak zemin farkı ≥ 10 ft, iki uç yerde: yüksekteki avantajlı, alçaktaki dezavantajlı', () => {
    const s = scene(o(4, 1), o(5, 1));
    expect(highGroundK8(s, A(s), B(s))).toEqual({ side: 1, ft: 10 });
    const ctx = (a: Combatant, t: Combatant) => attackSources({ attackerConditions: [], targetConditions: [], ...attackHeights(s, a, t), ranged: false, spell: false });
    expect(ctx(A(s), B(s))).toContainEqual(expect.objectContaining({ effect: 'advantage', reason: 'Yüksek zemin avantajı' }));
    expect(ctx(B(s), A(s))).toContainEqual(expect.objectContaining({ effect: 'disadvantage', reason: 'Alçak zemin dezavantajı' }));
  });
  it('havadaki (irtifa > 0) sayılmaz; 58\'de seviye farkıyla sayılırdı', () => {
    const s = scene(o(4, 1), o(5, 1), { a: { fly: 30, altitudeFt: 10 } });
    expect(attackHeights(s, A(s), B(s))).toEqual({ attackerHeight: 0, targetHeight: 0 });
    const s58 = scene(o(4, 1), o(5, 1), { a: { fly: 30, altitudeFt: 10 }, v: 58 });
    expect(attackHeights(s58, A(s58), B(s58))).toEqual({ attackerHeight: 1, targetHeight: 0 });
  });
  it('seviye 5 ft iken 1 seviye fark: 59\'da yüksek zemin yok (≥ 10 ft), 58\'de var', () => {
    const s = scene(o(4, 1), o(5, 1), { levelFt: 5 });
    expect(attackHeights(s, A(s), B(s))).toEqual({ attackerHeight: 0, targetHeight: 0 });
    const s58 = scene(o(4, 1), o(5, 1), { levelFt: 5, v: 58 });
    expect(attackHeights(s58, A(s58), B(s58))).toEqual({ attackerHeight: 1, targetHeight: 0 });
  });
  it('menzil eki: yerden ≥ 20 ft; 10 ft ya da havadaki için yok', () => {
    const s = scene(o(8, 2), o(12, 2));
    expect(rangeBonusFt(s, o(8, 2), o(12, 2), { a: A(s), t: B(s) })).toBe(5);
    const r = scene(o(4, 1), o(8, 0));
    expect(rangeBonusFt(r, o(4, 1), o(8, 0), { a: A(r), t: B(r) })).toBe(0);
    const f = scene(o(8, 2), o(12, 2), { a: { fly: 30, altitudeFt: 5 } });
    expect(rangeBonusFt(f, o(8, 2), o(12, 2), { a: A(f), t: B(f) })).toBe(0);
  });
  it('arayüz tek satır (hedef önizlemesi): ft farkıyla; havadakine "yüksek zemin yok"', () => {
    const s = scene(o(4, 1), o(8, 0), { a: { weaponOptions: [BOW] } });
    expect(attackChoices(s, 'A', 'B').map((c) => c.detail).join(' ')).toMatch(/yüksek zemin \(\+10 ft\): avantaj/);
    const f = scene(o(4, 1), o(8, 0), { a: { fly: 30, altitudeFt: 5, weaponOptions: [BOW] } });
    expect(attackChoices(f, 'A', 'B').map((c) => c.detail).join(' ')).toMatch(/yüksek zemin yok/);
  });
});

describe('K71d K9 uzaklık (zemin terimi)', () => {
  const melee = { kind: 'melee' as const, reachFt: 5 };
  it('10 ft basamak: 5 ft erişimle yakın dövüş 59\'da yok, 58\'de var; Large hedefe (2 düzey) var', () => {
    const s = scene(o(4, 1), o(5, 1));
    expect(reachFt(s, A(s), B(s), 5)).toBe(10);
    expect(checkReach(s, A(s), B(s), melee)).toMatchObject({ ok: false });
    const s58 = scene(o(4, 1), o(5, 1), { v: 58 });
    expect(checkReach(s58, A(s58), B(s58), melee)).toMatchObject({ ok: true });
    const big = scene(o(4, 1), o(5, 1), { b: { size: 'L' } });
    expect(reachFt(big, A(big), B(big), 5)).toBe(5);
  });
  it('20 ft uçurumun dibi ile üstü 20 ft (58\'de 5 ft: uçurumdan yukarı yakın dövüş)', () => {
    const s = scene(o(6, 2), o(7, 2));
    expect(reachFt(s, A(s), B(s), 5)).toBe(20);
    const s58 = scene(o(6, 2), o(7, 2), { v: 58 });
    expect(reachFt(s58, A(s58), B(s58), 5)).toBe(5);
  });
  it('heightMove kapalıyken zemin terimi yok (katman fiziksel değil)', () => {
    const s = scene(o(4, 1), o(5, 1), { toggles: { heightMove: false } });
    expect(checkReach(s, A(s), B(s), melee)).toMatchObject({ ok: true });
  });
  it('fırsat saldırısı: aynı seviyeden 10 ft alçak bitişik altıgene inen erişimden çıkar (59), 58\'de çıkmaz', () => {
    const oa = (v: number) => opportunityAttacks(scene(o(4, 0), o(4, 1), { v }), 'A', { from: o(4, 0), to: o(3, 0) }, high);
    expect(oa(59).some((e) => e.type === 'attack_resolved' || e.type === 'reaction_used')).toBe(true);
    expect(oa(58)).toEqual([]);
  });
  it('alan: alçak noktadan 20 ft küre platodaki (20 ft) yaratığı kapsar, 30 ft yukarıdakini kapsamaz; uçanın konisi çıkışından', () => {
    const sphere = { shape: 'sphere', sizeFt: 20, origin: 'point' };
    const s = scene(o(10, 2), o(8, 2));
    expect(areaReachesAltitude(s, sphere, B(s), areaOriginFt(s, A(s), sphere, o(10, 2)))).toBe(true);
    const tall = scene(o(10, 2), o(8, 2), { heights: (c, r) => (c >= 7 && c <= 9 && r >= 1 && r <= 5 ? 3 : 0) });
    expect(areaReachesAltitude(tall, sphere, B(tall), areaOriginFt(tall, A(tall), sphere, o(10, 2)))).toBe(false);
    const cone = { shape: 'cone', sizeFt: 15, origin: 'self' };
    const f = scene(o(11, 2), o(12, 2), { a: { fly: 30, altitudeFt: 30 } });
    expect(areaReachesAltitude(f, cone, B(f), areaOriginFt(f, A(f), cone, o(11, 2)))).toBe(false);
    const f58 = scene(o(11, 2), o(12, 2), { a: { fly: 30, altitudeFt: 30 }, v: 58 });
    expect(areaReachesAltitude(f58, cone, B(f58))).toBe(true);
  });
});

describe('K71d tepedeki okçu (K10 görüş çekirdeği iki uç yerde)', () => {
  it('plato kenarındaki okçu hedefin önündeki alçak kayanın (5 ft) üstünden görür: siper yok (59), 58\'de 3/4', () => {
    const rocks = (v: number) => {
      const marks: Record<string, string> = {};
      for (const side of [1, -1] as const) { const p = line(o(9, 3), o(13, 3), side); const h = p[p.length - 2] as Offset; marks[`${h.col},${h.row}`] = 'r'; }
      return scene(o(9, 3), o(13, 3), { v, tiles: marks });
    };
    const s = rocks(59);
    expect(lineOfFire(s, A(s), B(s))).toMatchObject({ blocked: false, cover: 0 });
    const s58 = rocks(58);
    expect(lineOfFire(s58, A(s58), B(s58)).cover).toBe(5);
  });
  it('alttaki, kenardan bir altıgen gerideki okçuyu kenar siperiyle (yarım) görür; okçu alttakini siper olmadan görür', () => {
    const s = scene(o(10, 3), o(3, 3), { heights: westLedge });
    expect(lineOfFire(s, A(s), B(s))).toMatchObject({ blocked: false, cover: 2, coverBy: 'kaya basamağı' });
    expect(lineOfFire(s, B(s), A(s))).toMatchObject({ blocked: false, cover: 0 });
  });
  it('ölü bölge: kenardan bir altıgen gerideki okçu uçurum dibindekini göremez (59); 58\'de yarım siperle görür', () => {
    const s = scene(o(3, 3), o(5, 3), { heights: westLedge });
    expect(lineOfFire(s, A(s), B(s))).toMatchObject({ blocked: true, blockedBy: 'yükselti' });
    const s58 = scene(o(3, 3), o(5, 3), { heights: westLedge, v: 58 });
    expect(lineOfFire(s58, A(s58), B(s58))).toMatchObject({ blocked: false, cover: 2 });
  });
  it('hızlı yol: aynı zemin ve düz yol losStats.altPath artırmaz (groundFast artar); yüksek altıgenli yol çekirdekten', () => {
    const s = scene(o(10, 1), o(13, 1));
    const a0 = losStats.altPath, g0 = losStats.groundFast;
    lineOfFire(s, A(s), B(s));
    expect(losStats.altPath).toBe(a0);
    expect(losStats.groundFast).toBeGreaterThan(g0);
    const ridge = scene(o(3, 1), o(5, 1));
    lineOfFire(ridge, A(ridge), B(ridge));
    expect(losStats.altPath).toBeGreaterThan(a0);
  });
  it('58 sabit ve katmansız harita: iki uç yerde sayaçlar artmaz (eski 2B kod)', () => {
    const s58 = scene(o(3, 1), o(5, 1), { v: 58 });
    const a0 = losStats.altPath, g0 = losStats.groundFast;
    expect(lineOfFire(s58, A(s58), B(s58))).toMatchObject({ blocked: true, blockedBy: 'yükselti' });
    const flat = { ...s58, kuralSurumu: 59, map: { ...(s58.map as NonNullable<BattleState['map']>), heights: undefined } } as BattleState;
    lineOfFire(flat, A(flat), B(flat));
    expect([losStats.altPath, losStats.groundFast]).toEqual([a0, g0]);
  });
  it('sırt iki uçtan yüksekse 59\'da da kapalı (geometrik), heightSight kapalıyken açık', () => {
    const s = scene(o(3, 1), o(5, 1));
    expect(lineOfFire(s, A(s), B(s))).toMatchObject({ blocked: true, blockedBy: 'yükselti' });
    const off = scene(o(3, 1), o(5, 1), { toggles: { heightSight: false } });
    expect(lineOfFire(off, A(off), B(off)).blocked).toBe(false);
  });
});

describe('K71d olay sırası ve replay', () => {
  it('iki turlu tırmanış ve itme olayları baştan oynatılınca aynı durum', () => {
    const s = scene(o(6, 2), o(13, 6));
    const r1 = run(s, { type: 'vertical_move', actorId: 'A', toFt: 10 } as Command);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    expect(applyEvents(s, r1.events)).toEqual(r1.state);
  });
});
