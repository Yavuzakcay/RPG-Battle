/**
 * Eşya ikon hattının zemin kipi (scripts/esya-ikon.mjs): köşe rengi macentaysa macenta kipi, değilse yeşil. Sentetik tamponla:
 * macenta zemin ve macenta-pembe hale silinir, nesnenin mavi/altın parıltısı (yarı saydam) korunur ve macenta taşması kalmaz.
 * Görsel dosyası açılmaz.
 */
import { describe, expect, it } from 'vitest';
import { anahtarla, zeminKipi } from '../../scripts/esya-ikon.mjs';

const W = 40; const H = 40;
type RGB = [number, number, number];
const MACENTA: RGB = [255, 0, 255];
const karisim = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((k) => Math.round(a[k]! * t + b[k]! * (1 - t))) as RGB;

/** Ortada (2·yari)² opak nesne, çevresinde 4 px parıltı halkası (renk %50 zemine karışık), kalanı zemin. */
function sayfa(nesne: RGB, parilti: RGB, zemin: RGB, yari = 6) {
  const rgb = new Uint8Array(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.max(Math.abs(x - 19.5), Math.abs(y - 19.5));
    const c = d < yari ? nesne : d < yari + 4 ? karisim(parilti, zemin, 0.5) : zemin;
    rgb.set(c, (y * W + x) * 3);
  }
  return rgb;
}
const px = (out: Uint8Array, x: number, y: number) => Array.from(out.subarray((y * W + x) * 4, (y * W + x) * 4 + 4));

describe('Eşya ikon hattı: zemin kipi', () => {
  it('kip köşe renginden: macenta → macenta, yeşil ve diğerleri → yeşil', () => {
    expect(zeminKipi([255, 0, 255])).toBe('macenta');
    expect(zeminKipi([250, 8, 247])).toBe('macenta');
    expect(zeminKipi([2, 252, 3])).toBe('yesil');
    expect(zeminKipi([22, 193, 8])).toBe('yesil');
  });

  it.each([
    ['mavi', [90, 170, 255] as RGB],
    ['altın', [255, 210, 70] as RGB],
  ])('macenta zemin: %s parıltı yarı saydam kalır, macenta taşması yok', (_ad, parilti) => {
    const out = anahtarla(sayfa([180, 180, 190], parilti, MACENTA), W, H, MACENTA);
    expect(px(out, 0, 0)[3]).toBe(0); // zemin
    expect(px(out, 19, 19)).toEqual([180, 180, 190, 255]); // nesne aynen
    const [r, g, b, a] = px(out, 19, 12); // parıltı halkası
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(255);
    expect(Math.min(r!, b!)).toBeLessThanOrEqual(g!); // macenta-pembe değil
    if (parilti[2] > parilti[0]) expect(b).toBeGreaterThan(r!); else expect(r).toBeGreaterThan(b!);
  });

  it('macenta zemin: opak parıltı halkasının dışındaki karışık hale parıltı rengine izdüşer (pembe kalmaz)', () => {
    const altin: RGB = [254, 213, 149];
    const rgb = new Uint8Array(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.max(Math.abs(x - 19.5), Math.abs(y - 19.5));
      // nesne | 5 px opak altın parıltı | %70 ve %35 altın + macenta | zemin
      const c = d < 6 ? [120, 90, 60] as RGB : d < 11 ? altin : d < 12 ? karisim(altin, MACENTA, 0.7) : d < 13 ? karisim(altin, MACENTA, 0.35) : MACENTA;
      rgb.set(c, (y * W + x) * 3);
    }
    const out = anahtarla(rgb, W, H, MACENTA);
    const [r, g, b, a] = px(out, 19, 8); // %70 halka (d = 11,5)
    expect([r, g, b]).toEqual(altin);
    expect(a).toBeGreaterThan(150);
    expect(a).toBeLessThan(205);
    expect(px(out, 19, 7)[3]).toBeLessThan(a!); // %35 halka daha saydam
  });

  it('macenta zemin: nesnenin kendi pembe taşı (despill bandının dışında) korunur', () => {
    const rgb = sayfa([180, 180, 190], [180, 180, 190], MACENTA, 14);
    rgb.set([230, 60, 210], (19 * W + 19) * 3); // iç pembe benek
    const out = anahtarla(rgb, W, H, MACENTA);
    expect(px(out, 19, 19)).toEqual([230, 60, 210, 255]);
  });
});
