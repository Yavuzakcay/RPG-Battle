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

  it('kapalı gölgeli macenta cep: yalnız cepTemizle ile saydam; nesnenin pembe taşı kalır', () => {
    const rgb = sayfa([128, 128, 128], [128, 128, 128], MACENTA, 15);
    for (let y = 12; y < 20; y++) for (let x = 12; x < 20; x++) rgb.set([88, 0, 88], (y * W + x) * 3); // zeminin karartılmışı (s ≈ 0,35)
    for (let y = 22; y < 27; y++) for (let x = 22; x < 27; x++) rgb.set([230, 60, 210], (y * W + x) * 3); // pembe taş
    const acik = anahtarla(rgb, W, H, MACENTA, false, { x0: 0, y0: 0, x1: W, y1: H }, false, true);
    expect(px(acik, 15, 15)[3]).toBe(0);
    expect(px(acik, 24, 24)).toEqual([230, 60, 210, 255]);
    expect(px(acik, 8, 8)[3]).toBe(255); // gövde
    expect(px(anahtarla(rgb, W, H, MACENTA), 15, 15)[3]).toBe(255); // listede değilse dokunulmaz
  });

  it('komşu hücreden taşan parça: kırpım payındaki gövde, parıltıyla bağlı olsa da atılır; asıl nesne kalır', () => {
    const w = 60; const h = 70; const rgb = new Uint8Array(w * h * 3);
    for (let i = 0; i < w * h; i++) rgb.set(MACENTA, i * 3);
    const boya = (x0: number, y0: number, x1: number, y1: number, c: RGB) => {
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) rgb.set(c, (y * w + x) * 3);
    };
    boya(10, 30, 50, 62, [128, 128, 128]); // asıl nesne (hücre içinde)
    boya(20, 0, 40, 8, [128, 128, 128]); // komşunun ucu (kırpım payında, hücre y ≥ 10)
    boya(28, 8, 32, 30, karisim([128, 128, 128], MACENTA, 0.6)); // yarı saydam köprü (parıltı)
    const out = anahtarla(rgb, w, h, MACENTA, false, { x0: 0, y0: 10, x1: w, y1: h }, false);
    const a = (x: number, y: number) => out[(y * w + x) * 4 + 3];
    expect(a(30, 4)).toBe(0);
    expect(a(30, 45)).toBe(255);
  });
});
