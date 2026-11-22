/**
 * Görev D (yalnız arayüz): telefon dikey savaş yerleşiminin saf hesapları ve dikey kameranın pencere boyutu.
 * Yatay ve masaüstü: dikey yerleşime girmez, sahne kutusu Görev D öncesi formülle bire bir.
 */
import { describe, expect, it } from 'vitest';
import {
  MAP_MIN_RATIO, PORTRAIT_MAX_W, SHEET_BAR_H, SHEET_MAX_RATIO, TOP_STRIP_H, isPortraitPhone, portraitScaleScreen, sheetOpenFor, sheetOpenHeight, stageBox,
} from './battleLayout';
import { clampCamera, fitZoom, scaleOf, viewSize, zoomAt, zoomLimits } from './camera';
import { HEX_W, VIEW } from './mapView';

const RATIO = VIEW.w / VIEW.h;
/** Görev D öncesi `useStage` formülü (karşılaştırma için kopya). */
const oldStage = (vw: number, vh: number) => { const w = Math.min(vw, vh * RATIO); return { w, h: w / RATIO }; };

describe('Görev D: dikey yerleşim seçimi', () => {
  it('telefon dikey (genişlik < yükseklik, genişlik ≤ 520) dikey; yatay, masaüstü ve geniş dikey eski yerleşim', () => {
    for (const [w, h] of [[390, 844], [360, 740], [412, 915], [PORTRAIT_MAX_W, 900]] as const) expect(isPortraitPhone(w, h), `${w}×${h}`).toBe(true);
    for (const [w, h] of [[844, 390], [740, 360], [1280, 800], [1920, 1080], [600, 900], [768, 1024], [500, 500]] as const) expect(isPortraitPhone(w, h), `${w}×${h}`).toBe(false);
  });
  it('yatay ve masaüstünde sahne kutusu eski formülle bit bit aynı', () => {
    for (const [w, h] of [[844, 390], [740, 360], [915, 412], [1280, 800], [1920, 1080], [1366, 768], [2560, 1440]] as const) {
      expect(stageBox(w, h, RATIO)).toEqual(oldStage(w, h));
    }
    // Önce: 390×844 dikeyde sahne 390×218 (raporun "önce" değeri).
    expect(Math.round(oldStage(390, 844).h)).toBe(218);
  });
});

describe('Görev D: çekmece ve harita yüksekliği', () => {
  it('açık çekmece en çok %45, harita (üst şerit hariç) en az %55', () => {
    for (const vh of [740, 844, 915, 640]) {
      const open = sheetOpenHeight(vh);
      expect(open).toBeLessThanOrEqual(Math.round(vh * SHEET_MAX_RATIO));
      expect(vh - TOP_STRIP_H - open).toBeGreaterThanOrEqual(Math.floor(vh * MAP_MIN_RATIO) - 1);
      expect(open).toBeGreaterThanOrEqual(SHEET_BAR_H * 2);
    }
    expect(sheetOpenHeight(844)).toBe(332);
  });
  it('kapalı çubuk dokunma hedefi ≥ 44 px', () => {
    expect(SHEET_BAR_H).toBeGreaterThanOrEqual(44);
  });
  it('ölçek çekmece açılıp kapanınca değişmez (kapalı harita alanı 7,5 satırla dolar)', () => {
    const vh = 844, open = sheetOpenHeight(vh);
    const closedMap = vh - TOP_STRIP_H - SHEET_BAR_H;
    const openMap = vh - TOP_STRIP_H - open;
    const a = portraitScaleScreen(closedMap, false, open, RATIO);
    const b = portraitScaleScreen(openMap, true, open, RATIO);
    expect(a).toEqual(b);
    expect(a.h).toBe(closedMap);
    expect(scaleOf(a, 1)).toBeCloseTo(closedMap / VIEW.h, 9);
  });
  it('çekmece: karar balonu açar, hedefleme kapatır, boşta menüyü izler, elle seçim önce gelir', () => {
    expect(sheetOpenFor({ idle: true, menuOpen: false, decision: false, manual: null })).toBe(false);
    expect(sheetOpenFor({ idle: true, menuOpen: true, decision: false, manual: null })).toBe(true);
    expect(sheetOpenFor({ idle: false, menuOpen: false, decision: false, manual: null })).toBe(false);
    expect(sheetOpenFor({ idle: false, menuOpen: false, decision: true, manual: null })).toBe(true);
    expect(sheetOpenFor({ idle: false, menuOpen: false, decision: false, manual: true })).toBe(true);
    expect(sheetOpenFor({ idle: false, menuOpen: false, decision: true, manual: false })).toBe(false);
  });
});

describe('Görev D: dikey kamera penceresi (Camera.v1)', () => {
  const world = { w: VIEW.w, h: VIEW.h };
  it('v1 yoksa eski davranış: pencere VIEW / zoom, 15×7 dünya tam sığar', () => {
    expect(viewSize(1)).toEqual({ w: VIEW.w, h: VIEW.h });
    expect(clampCamera({ x: 50, y: 20, zoom: 1 }, world)).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(fitZoom(world)).toBe(1);
  });
  it('dikey pencere (390 px, ölçek kapalı haritadan): 15×7 harita yatayda kayar, dikeyde sığar; v1 korunur', () => {
    const sk = portraitScaleScreen(744, false, 332, RATIO);
    const k1 = scaleOf(sk, 1);
    const v1 = { w: 390 / k1, h: 744 / k1 };
    expect(v1.h).toBeCloseTo(VIEW.h, 6);
    expect(v1.w).toBeLessThan(VIEW.w);
    const c = clampCamera({ x: 5000, y: 300, zoom: 1, v1 }, world);
    expect(c.x).toBeCloseTo(VIEW.w - v1.w, 6);
    expect(c.y).toBeCloseTo(0, 6);
    expect(c.v1).toEqual(v1);
    // Yakınlaştırma tutma noktasını sabit tutar ve v1'i korur.
    const z = zoomAt(c, 1.5, { x: 195, y: 372 }, sk, world, zoomLimits(sk, HEX_W));
    expect(z.v1).toEqual(v1);
    // Açık çekmece: pencere kısalır (dikey kaydırma olur), ölçek aynı.
    const v1o = { w: 390 / k1, h: 464 / k1 };
    expect(clampCamera({ x: 0, y: 999, zoom: 1, v1: v1o }, world).y).toBeCloseTo(VIEW.h - v1o.h, 6);
    expect(fitZoom(world, v1)).toBeCloseTo(v1.w / VIEW.w, 9);
  });
  it('dikeyde dokunma alt sınırı: en uzak yakınlaştırmada altıgen ≥ 44 px', () => {
    const sk = portraitScaleScreen(640, false, 285, RATIO);
    const lim = zoomLimits(sk, HEX_W);
    expect(HEX_W * scaleOf(sk, lim.min)).toBeGreaterThanOrEqual(44 - 1e-9);
  });
});
