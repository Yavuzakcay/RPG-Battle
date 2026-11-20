/**
 * Serüven öncesi (yalnız arayüz): dar ekranda jeton okunabilirliği. 390×844 dikeyde (15×7, k ≈ 0,305) Tiny jeton ≈6 px idi; alt
 * sınırla ≥ 18 px; masaüstünde (1280 px) ölçekler, HP çubuğu ve rozet değişmez. Dar ekranda kamera varsayılan yakınlaştırması.
 */
import { describe, expect, it } from 'vitest';
import { NARROW_HEX_PX, readableScale, tokenReadability } from './tokenReadability';
import { MAX_ZOOM, narrowZoom, scaleOf } from './camera';
import { HEX_W, VIEW, worldOf } from './mapView';
import { cameraFrame } from './MapCamera';
import { SHEET_BAR_H, TOP_STRIP_H, isPortraitPhone, portraitScaleScreen, sheetOpenHeight, stageBox } from './battleLayout';

const TOKEN_R = (VIEW.h / 7.5) * 0.36; // MapBattle TOKEN_R

describe('jeton okunabilirliği', () => {
  it('masaüstünde (1280×715) hiçbir şey değişmez', () => {
    const r = tokenReadability(scaleOf({ w: 1280, h: 715 }, 1), TOKEN_R);
    expect(readableScale(0.3, r)).toBe(0.3);
    expect(r.hpH).toBe(8);
    expect(r.badge).toBe(1);
    expect(narrowZoom({ w: 1280, h: 715 }, HEX_W, 56)).toBeNull();
    expect(narrowZoom({ w: 844, h: 390 }, HEX_W, 56)).toBeNull(); // telefon yatay
  });
  it('telefon dikey (390 px): varsayılan yakınlaştırma, Tiny ≥ 18 px, Medium büyümez, HP ≥ 5 px, rozet ≥ 12 px', () => {
    const screen = { w: 390, h: 218 };
    const z = narrowZoom(screen, HEX_W, 56);
    expect(z).not.toBeNull();
    expect(z!).toBeGreaterThan(1);
    expect(z!).toBeLessThanOrEqual(MAX_ZOOM);
    expect(HEX_W * scaleOf(screen, z!)).toBeCloseTo(56, 0);
    for (const k of [scaleOf(screen, 1), scaleOf(screen, z!)]) {
      const r = tokenReadability(k, TOKEN_R);
      expect(2 * TOKEN_R * k * readableScale(0.3, r)).toBeGreaterThanOrEqual(18 - 1e-9);
      expect(readableScale(1, r)).toBe(1);
      expect(readableScale(1.5, r)).toBe(1.5);
      expect(r.hpH * k).toBeGreaterThanOrEqual(5 - 1e-9);
      expect(18 * r.badge * k).toBeGreaterThanOrEqual(Math.min(12, 18 * 2.2 * k) - 1e-9);
    }
  });
  it('boyut yokken (ilk çizim) güvenli varsayılan', () => {
    expect(tokenReadability(0, TOKEN_R)).toEqual({ minScale: 0, hpH: 8, badge: 1 });
    expect(narrowZoom({ w: 0, h: 0 }, HEX_W, 56)).toBeNull();
  });
});

// Birleşim (Görev D × Serüven öncesi): `narrowZoom` ölçek ekranından (`cameraFrame` `sk`); dikeyde D'nin ölçeği aynen, çift yakınlaştırma yok.
describe('kamera ölçek çerçevesi (Görev D dikey + narrowZoom)', () => {
  const RATIO = VIEW.w / VIEW.h;
  const world15x7 = worldOf({ cols: 15, rows: 7 });
  /** MapBattle dikey: harita alanı = ekran − üst şerit − kapalı çekmece çubuğu; ölçek `portraitScaleScreen`. */
  const portrait = (vw: number, vh: number, open = false) => {
    const closedH = vh - TOP_STRIP_H - SHEET_BAR_H;
    const openH = sheetOpenHeight(vh);
    const box = { w: vw, h: open ? closedH - (openH - SHEET_BAR_H) : closedH }; // açık çekmecede harita alanı kısalır
    return { box, frame: cameraFrame(world15x7, box, portraitScaleScreen(box.h, open, openH, RATIO)) };
  };
  const hexPx = (f: ReturnType<typeof cameraFrame>, zoom = f.narrow ?? 1) => HEX_W * scaleOf(f.sk, zoom);

  it('telefon dikey (390×844, 360×740, 412×915): 1× altıgen D\'nin değeri, narrowZoom çalışmaz, çekmece ölçeği değiştirmez', () => {
    const olcum: Record<string, number> = {};
    for (const [vw, vh] of [[390, 844], [360, 740], [412, 915]] as const) {
      expect(isPortraitPhone(vw, vh)).toBe(true);
      const { box, frame } = portrait(vw, vh);
      const d = HEX_W * (box.h / VIEW.h); // Görev D: ölçek kapalı çekmeceli harita yüksekliğinden
      expect(frame.narrow, `${vw}×${vh}`).toBeNull();
      expect(hexPx(frame)).toBeCloseTo(d, 9);
      expect(hexPx(frame)).toBeGreaterThanOrEqual(44);
      const acik = portrait(vw, vh, true).frame;
      expect(acik.narrow).toBeNull();
      expect(hexPx(acik)).toBeCloseTo(d, 9);
      expect(frame.big).toBe(true); // 15×7 de kayar
      olcum[`${vw}×${vh}`] = Math.round(hexPx(frame) * 10) / 10;
    }
    expect(olcum['390×844']).toBeCloseTo(115.8, 1); // çift yakınlaştırmada ≈191 olurdu
  });
  it('yatay ve masaüstü: D öncesi (HEAD) davranış; scaleScreen yok, narrowZoom gerçek sahneden', () => {
    for (const [vw, vh] of [[844, 390], [740, 360], [1280, 800], [1920, 1080]] as const) {
      expect(isPortraitPhone(vw, vh)).toBe(false);
      const box = stageBox(vw, vh, RATIO);
      const f = cameraFrame(world15x7, box);
      expect(f.sk).toEqual(box);
      expect(f.v1).toBeUndefined();
      expect(f.narrow).toBe(narrowZoom(box, HEX_W, NARROW_HEX_PX));
      expect(f.narrow).toBeNull();
      expect(f.big).toBe(false); // 15×7'de kamera yok
    }
  });
  it('dar kare pencere (500×500): narrowZoom hâlâ devreye girer, küçük haritada kamera ve ≈56 px', () => {
    expect(isPortraitPhone(500, 500)).toBe(false);
    const f = cameraFrame(world15x7, stageBox(500, 500, RATIO));
    expect(f.narrow).not.toBeNull();
    expect(f.big).toBe(true);
    expect(hexPx(f)).toBeCloseTo(NARROW_HEX_PX, 0);
  });
});
