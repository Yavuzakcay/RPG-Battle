/**
 * Görev K22: Goliath kafa kaplaması. Kapsam veride; kaplama yalnızca kafa kutusunun içini değiştirir; kaplama yoksa
 * (görsel yok, kapsam dışı sınıf ya da ırk) boyama bit bit aynı; boyama maskesi kutuda kaplamanın opak pikselleri.
 * Görsel okunmaz (yalnızca üretilmiş JSON ve dosya adları).
 */
import { describe, expect, it } from 'vitest';
import { applyHeadOverlay, type Box } from './headOverlay';
import { basUrlFor, headEntry, tintPixels } from './tint';
import { lineageTint } from '../battle/avatar';
import soy from '../../data/soy-renkleri.json';
import bas from '../../data/soy-bas.json';

const files = new Set(Object.keys(import.meta.glob('/public/characters/bas/*.png')).map((f) => f.replace('/public/', '')));
const W = 6, H = 4;
const sprite = () => { const d = new Uint8ClampedArray(W * H * 4); for (let p = 0; p < W * H; p++) d.set([100 + p, 110, 130, 255], p * 4); return d; };

describe('kafa kaplaması', () => {
  it('kapsam veride: yalnızca Goliath Paladin, Fighter, Cleric; üretilen kayıt ve görseller bunlarla sınırlı', () => {
    expect((soy as { basKaplama: Record<string, string[]> }).basKaplama).toEqual({ goliath: ['paladin', 'fighter', 'cleric'] });
    const names = Object.keys((bas as { sprites: Record<string, unknown> }).sprites).sort();
    expect(names.every((n) => /^goliath-(female|male)-(paladin|fighter|cleric)$/.test(n))).toBe(true);
    for (const n of names) expect(files.has(`characters/bas/${n}.png`)).toBe(true);
    expect(headEntry('goliath-male-barbarian')).toBeUndefined();
    expect(headEntry('dragonborn-female-paladin')).toBeUndefined();
    expect(basUrlFor('characters/goliath-male-barbarian.webp')).toBeNull();
    if (headEntry('goliath-male-fighter')) expect(basUrlFor('characters/kucuk/goliath-male-fighter.webp')).toBe('characters/bas/goliath-male-fighter.png');
  });
  it('yalnızca kutu içi değişir; kutu dışındaki her piksel ve maske aynı', () => {
    const data = sprite(), before = new Uint8ClampedArray(data);
    const mask = new Uint8Array(W * H).fill(1);
    const ov = new Uint8ClampedArray(W * H * 4);
    const box: Box = [1, 0, 3, 2];
    for (let y = 0; y <= 1; y++) for (let x = 1; x <= 3; x++) ov.set([200, 200, 210, 255], (y * W + x) * 4);
    ov.set([255, 0, 0, 255], (3 * W + 5) * 4); // kutu dışı: yok sayılmalı
    const r = applyHeadOverlay(data, mask, ov, box, W);
    for (let p = 0; p < W * H; p++) {
      const x = p % W, y = (p / W) | 0;
      const inBox = x >= 1 && x <= 3 && y <= 2;
      if (!inBox) { expect(Array.from(data.slice(p * 4, p * 4 + 4))).toEqual(Array.from(before.slice(p * 4, p * 4 + 4))); expect(r.mask[p]).toBe(mask[p]); }
    }
    expect(Array.from(data.slice((0 * W + 2) * 4, (0 * W + 2) * 4 + 4))).toEqual([200, 200, 210, 255]);
    expect(r.covered).toBe(6);
    // Kutuda kaplamanın örtmediği ten pikseli (2. satır) eski hâlinde kalır.
    expect(Array.from(data.slice((2 * W + 2) * 4, (2 * W + 2) * 4 + 4))).toEqual(Array.from(before.slice((2 * W + 2) * 4, (2 * W + 2) * 4 + 4)));
  });
  it('kaplama yokken boyama bit bit aynı; kaplamada kafa pikselleri boyanır', () => {
    const t = lineageTint('goliath', 'fire', 'erkek')!;
    const mask = new Uint8Array(W * H); mask.fill(1, 0, 6);
    const a = sprite(), b = sprite();
    tintPixels(a, t, mask);
    const empty = new Uint8ClampedArray(W * H * 4);
    const r = applyHeadOverlay(b, mask, empty, [0, 0, W - 1, H - 1], W);
    tintPixels(b, t, r.mask);
    expect(Array.from(b)).toEqual(Array.from(a));
    // Kaplanan kafa pikseli maskeye girer ve boyanır.
    const c = sprite();
    const ov = new Uint8ClampedArray(W * H * 4); ov.set([150, 155, 170, 255], (3 * W + 0) * 4);
    const rc = applyHeadOverlay(c, new Uint8Array(W * H), ov, [0, 3, 0, 3], W);
    expect(rc.mask[3 * W]).toBe(1);
    tintPixels(c, t, rc.mask);
    expect(c[3 * W * 4]).toBeGreaterThan(c[3 * W * 4 + 2]!);
  });
  it('atlanan jeton ve uyarılar kayıtta; kafa görseli boyutları raporda', () => {
    const d = bas as { sprites: Record<string, { head: number[]; need: number[]; scale: number }>; atlanan: Record<string, string>; uyarilar: string[] };
    for (const e of Object.values(d.sprites)) { expect(e.head).toHaveLength(2); expect(e.need).toHaveLength(2); expect(e.scale).toBeGreaterThan(0); }
    expect(typeof d.atlanan).toBe('object');
  });
});
