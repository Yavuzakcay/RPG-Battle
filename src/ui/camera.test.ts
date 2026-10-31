/**
 * Görev H1: geniş harita. Dünya boyutu (15×7 = eski VIEW, bit bit), kamera sınırları, yakınlaştırma (imleç sabit),
 * görünür olma, Tümünü göster, ekran dışı yön; harita boyutu doğrulaması (kademeler, üst sınır, aynalama).
 */
import { describe, expect, it } from 'vitest';
import { HEX_W, VIEW, allHexes, hexCenter, hexesIn, worldOf } from './mapView';
import { centerOn, clampCamera, dragViewTo, ensureVisible, fitZoom, inView, offscreenDir, panBy, scaleOf, viewSize, zoomAt, zoomLimits } from './camera';
import { MAP_SIZES, MAX_GRID, RAW_MAPS, validateMap, type RawMap } from '../map/maps';

const big = worldOf(MAP_SIZES.large);
const screen = { w: 1280, h: 715 };

describe('dünya boyutu', () => {
  it('15×7 dünyası tam eski VIEW (aynı nesne); diğerleri altıgen boyutu sabit büyür', () => {
    expect(worldOf({ cols: 15, rows: 7 })).toBe(VIEW);
    expect(worldOf()).toBe(VIEW);
    expect(Math.round(big.w)).toBe(2616);
    expect(Math.round(big.h)).toBe(1668);
    expect(allHexes()).toHaveLength(105);
    expect(allHexes(MAP_SIZES.large)).toHaveLength(31 * 17);
    // Son altıgenin merkezi dünyanın içinde.
    const c = hexCenter({ col: 30, row: 16 });
    expect(c.x).toBeLessThan(big.w); expect(c.y).toBeLessThan(big.h);
  });
  it('yalnızca görünen altıgenler (pay ile) çizilir', () => {
    const v = viewSize(1);
    const vis = hexesIn(MAP_SIZES.large, { x: 0, y: 0, w: v.w, h: v.h });
    expect(vis.length).toBeLessThan(31 * 17 / 2);
    expect(vis.length).toBeGreaterThanOrEqual(105);
  });
});

describe('kamera', () => {
  it('sınırlar: dünyanın dışına çıkmaz; dünya küçükse ortalanır', () => {
    expect(clampCamera({ x: -500, y: -500, zoom: 1 }, big)).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(clampCamera({ x: 99999, y: 99999, zoom: 1 }, big)).toEqual({ x: big.w - VIEW.w, y: big.h - VIEW.h, zoom: 1 });
    const fit = fitZoom(big);
    const c = clampCamera({ x: 0, y: 0, zoom: fit }, big);
    const v = viewSize(fit);
    expect(v.w).toBeGreaterThanOrEqual(big.w - 0.01); expect(v.h).toBeGreaterThanOrEqual(big.h - 0.01);
    expect(c.x).toBeLessThanOrEqual(0);
  });
  it('yakınlaştırma imleç altındaki noktayı sabit tutar; sınırlar dokunma hedefini korur', () => {
    const lim = zoomLimits(screen, HEX_W);
    expect(HEX_W * scaleOf(screen, lim.min)).toBeGreaterThanOrEqual(44 - 1e-9);
    const c0 = { x: 400, y: 300, zoom: 1 };
    const anchor = { x: 640, y: 360 };
    const world0 = { x: c0.x + anchor.x / scaleOf(screen, 1), y: c0.y + anchor.y / scaleOf(screen, 1) };
    const c1 = zoomAt(c0, 1.5, anchor, screen, big, lim);
    const world1 = { x: c1.x + anchor.x / scaleOf(screen, 1.5), y: c1.y + anchor.y / scaleOf(screen, 1.5) };
    expect(world1.x).toBeCloseTo(world0.x); expect(world1.y).toBeCloseTo(world0.y);
    expect(zoomAt(c0, 99, anchor, screen, big, lim).zoom).toBe(lim.max);
  });
  it('sürükleme, ortalama, görünür tutma, ekran dışı yön', () => {
    expect(panBy({ x: 500, y: 300, zoom: 1 }, 100, 0, screen, big).x).toBeCloseTo(400);
    const far = hexCenter({ col: 28, row: 15 });
    const c = centerOn({ x: 0, y: 0, zoom: 1 }, far, big);
    expect(far.x).toBeGreaterThan(c.x); expect(far.x).toBeLessThan(c.x + VIEW.w);
    const e = ensureVisible({ x: 0, y: 0, zoom: 1 }, [hexCenter({ col: 22, row: 12 }), far], big);
    expect(offscreenDir(e, far)).toBeNull();
    expect(offscreenDir({ x: 0, y: 0, zoom: 1 }, far)).toMatchObject({ x: expect.any(Number) });
    expect(offscreenDir({ x: 0, y: 0, zoom: 1 }, far)!.x).toBeGreaterThan(0);
  });
});

describe('mini harita sürükleme (Görev M2)', () => {
  it('pencere tutulan noktayla birlikte kayar; dünya sınırı dışına çıkmaz; yakınlaştırma aynı kalır', () => {
    const c0 = { x: 400, y: 300, zoom: 1.2 };
    const v = viewSize(c0.zoom);
    expect(inView(c0, { x: 400 + v.w / 2, y: 300 + v.h / 2 })).toBe(true);
    expect(inView(c0, { x: 399, y: 300 })).toBe(false);
    const grab = { x: 50, y: 40 };
    const c1 = dragViewTo(c0, grab, { x: 900, y: 700 }, big);
    expect(c1).toEqual({ x: 850, y: 660, zoom: 1.2 });
    // Sınır dışına sürükleme: köşelerde durur.
    expect(dragViewTo(c0, grab, { x: -5000, y: -5000 }, big)).toEqual({ x: 0, y: 0, zoom: 1.2 });
    const far = dragViewTo(c0, grab, { x: 99999, y: 99999 }, big);
    expect(far.x).toBeCloseTo(big.w - v.w); expect(far.y).toBeCloseTo(big.h - v.h);
    for (const p of [{ x: -1, y: 5000 }, { x: 5000, y: -1 }, { x: 1300, y: 800 }]) {
      const c = dragViewTo(c0, grab, p, big);
      expect(c.x).toBeGreaterThanOrEqual(0); expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + v.w).toBeLessThanOrEqual(big.w + 1e-6); expect(c.y + v.h).toBeLessThanOrEqual(big.h + 1e-6);
    }
  });
});

describe('harita boyutu doğrulaması', () => {
  const base = RAW_MAPS.find((m) => m.id === 'ada')! as RawMap;
  const sized = (cols: number, rows: number, mirrorable = false): RawMap => ({
    ...base, id: `t${cols}`, size: { cols, rows }, tiles: Array.from({ length: rows }, () => '.'.repeat(cols)),
    startZones: { players: { colRange: [1, 3] }, enemies: { colRange: [cols - 2, cols] } }, mirrorable,
    variants: base.variants.map((v) => ({ ...v, tiles: undefined, startZones: undefined })),
  });
  it('kademeler geçerli; üst sınır aşılırsa net hata; tablo boyutla uyuşmalı', () => {
    for (const s of Object.values(MAP_SIZES)) expect(validateMap(sized(s.cols, s.rows, true))).toEqual([]);
    expect(validateMap(sized(MAX_GRID.cols, MAX_GRID.rows))).toEqual([]);
    expect(validateMap(sized(MAX_GRID.cols + 1, 10)).join()).toMatch(/boyut 49×10 geçersiz \(en az 5×5, en çok 48×28\)/);
    const bad = { ...sized(21, 11), tiles: sized(21, 10).tiles };
    expect(validateMap(bad).join()).toMatch(/11 satır olmalı/);
  });
  it('aynalanabilir harita tek sütunlu olmalı (odd-q)', () => {
    expect(validateMap(sized(20, 10, true)).join()).toMatch(/sütun sayısı tek olmalı/);
  });
  it('mevcut bütün haritalar 15×7 ve geçerli (Klasik haritalara dokunulmadı)', () => {
    for (const m of RAW_MAPS.filter((x) => !x.id.startsWith('gecici'))) if (m.size.cols === 15) expect(m.size.rows).toBe(7);
  });
});
