/**
 * Serüven öncesi (yalnız arayüz): dar ekranda jeton okunabilirliği. 390×844 dikeyde (15×7, k ≈ 0,305) Tiny jeton ≈6 px idi; alt
 * sınırla ≥ 18 px; masaüstünde (1280 px) ölçekler, HP çubuğu ve rozet değişmez. Dar ekranda kamera varsayılan yakınlaştırması.
 */
import { describe, expect, it } from 'vitest';
import { readableScale, tokenReadability } from './tokenReadability';
import { MAX_ZOOM, narrowZoom, scaleOf } from './camera';
import { HEX_W, VIEW } from './mapView';

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
