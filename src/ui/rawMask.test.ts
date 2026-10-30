/**
 * Görev K24: yapay zekâ ham maskesi içe aktarma (saf çekirdek; görsel okunmaz, sentetik pikseller). Ölçek farkı,
 * çerçeve ve boşluk kırpma, kayma uyarısı, JPG gürültüsü, gri tonlar ve eşik, jeton dışına taşan beyaz, küçük bileşen
 * ve delik temizliği, ad eşleşmesi ve var olan elle maskeyi ezmeme.
 */
import { describe, expect, it } from 'vitest';
import { cropFrame, importRawMask, rawMaskName, RAW_MASK, writeDecision, type Gray } from './rawMask';

const W = 16, H = 16;
/** Jeton: (2..13, 2..13) opak. */
const alpha = () => { const a = new Uint8Array(W * H); for (let y = 2; y <= 13; y++) for (let x = 2; x <= 13; x++) a[y * W + x] = 255; return a; };
/** Jeton boyutunda ten deseni: (4..9, 4..9) beyaz. */
const pattern = (dx = 0, dy = 0, v = 255) => { const m = new Uint8Array(W * H); for (let y = 4; y <= 9; y++) for (let x = 4; x <= 9; x++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H) m[Y * W + X] = v; } return m; };
/** Deseni k kat büyütür (yapay zekânın büyük çıktısı). */
const scaled = (m: Uint8Array, k: number): Gray => { const w = W * k, h = H * k, d = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[y * w + x] = m[Math.floor(y / k) * W + Math.floor(x / k)]!; return { data: d, w, h }; };
const white = (m: Uint8Array) => m.reduce((n, v) => n + (v ? 1 : 0), 0);

describe('ham maske içe aktarma', () => {
  it('ölçek farkı: 4× büyük ham maske jeton boyutuna en yakın komşuyla iner; otomatik maskeyle IoU 1', () => {
    const r = importRawMask(scaled(pattern(), 4), alpha(), W, H, { auto: pattern() });
    expect(Array.from(r.mask)).toEqual(Array.from(pattern()));
    expect(r.metrics.iou).toBe(1);
    expect(r.fit).toBe('canvas');
    expect(r.warnings).toEqual([]);
  });
  it('gri çerçeve kırpılır; en-boy farkında siyah boşluk (letterbox) kırpılıp uyarı verilir', () => {
    const big = scaled(pattern(), 4);
    const fw = big.w + 8, fh = big.h + 8, framed = new Uint8Array(fw * fh).fill(128);
    for (let y = 0; y < big.h; y++) for (let x = 0; x < big.w; x++) framed[(y + 4) * fw + x + 4] = big.data[y * big.w + x]!;
    expect(Array.from(importRawMask({ data: framed, w: fw, h: fh }, alpha(), W, H).mask)).toEqual(Array.from(pattern()));
    const lw = big.w + 32, wide = new Uint8Array(lw * big.h);
    for (let y = 0; y < big.h; y++) for (let x = 0; x < big.w; x++) wide[y * lw + x + 16] = big.data[y * big.w + x]!;
    const g: Gray = { data: wide, w: lw, h: big.h };
    expect(cropFrame(g, 1).rect).toEqual([16, 0, 16 + big.w - 1, big.h - 1]);
    const r = importRawMask(g, alpha(), W, H);
    expect(Array.from(r.mask)).toEqual(Array.from(pattern()));
    expect(r.warnings.join()).toContain('en-boy oranı');
  });
  it('yalnızca karakter kırpılmışsa (oran opak kutuya uyuyor) jetonun opak kutusuna eşlenir', () => {
    const a = new Uint8Array(W * H); for (let y = 0; y <= 15; y++) for (let x = 4; x <= 11; x++) a[y * W + x] = 255; // kutu 8×16
    const raw: Gray = { data: new Uint8Array(8 * 16).fill(255), w: 8, h: 16 };
    const r = importRawMask(raw, a, W, H);
    expect(r.fit).toBe('box');
    expect(r.dst).toEqual([4, 0, 11, 15]);
    expect(white(r.mask)).toBe(8 * 16);
  });
  it('kayma: hizasız ham maske otomatik maskeyle IoU < 0,3 → "büyük olasılıkla hizasız"', () => {
    const r = importRawMask(scaled(pattern(6, 6), 2), alpha(), W, H, { auto: pattern() });
    expect(r.metrics.iou).toBeLessThan(RAW_MASK.minIoU);
    expect(r.warnings.join()).toContain('büyük olasılıkla hizasız');
  });
  it('JPG girdisi: ad .jpg/.jpeg kabul edilir; sıkıştırma gürültüsü eşikle ve küçük bileşen temizliğiyle gider', () => {
    const sprites = new Set(['goliath-male-barbarian']);
    expect(rawMaskName('goliath-male-barbarian.jpg', sprites)).toBe('goliath-male-barbarian');
    expect(rawMaskName('goliath-male-barbarian.JPEG', sprites)).toBe('goliath-male-barbarian');
    expect(rawMaskName('goliath-fire-male-barbarian.png', sprites)).toBeNull();
    expect(rawMaskName('goliath-male-barbarian.webp', sprites)).toBeNull();
    const m = pattern();
    const noisy = new Uint8Array(W * H);
    for (let p = 0; p < W * H; p++) noisy[p] = m[p] ? 230 + (p % 25) : p % 7 === 0 ? 30 : 5 + (p % 11);
    noisy[12 * W + 12] = 200; // tek beyaz benek (jeton içinde)
    noisy[6 * W + 6] = 40; // ten içinde tek siyah delik
    const r = importRawMask({ data: noisy, w: W, h: H }, alpha(), W, H);
    expect(Array.from(r.mask)).toEqual(Array.from(m));
    expect(r.metrics.removed).toBe(1);
    expect(r.metrics.filled).toBe(1);
  });
  it('gri tonlar: varsayılan eşik 128; eşik parametresiyle değişir; çıktı yalnızca 0/255', () => {
    const g = pattern(0, 0, 200);
    for (let y = 10; y <= 12; y++) for (let x = 4; x <= 9; x++) g[y * W + x] = 100;
    const def = importRawMask({ data: g, w: W, h: H }, alpha(), W, H);
    expect(white(def.mask)).toBe(36);
    const low = importRawMask({ data: g, w: W, h: H }, alpha(), W, H, { threshold: 90 });
    expect(white(low.mask)).toBe(36 + 18);
    expect(new Set(low.mask)).toEqual(new Set([0, 255]));
  });
  it('jeton dışına taşan beyaz silinir; çoksa uyarı; beyaz oranı sınırları', () => {
    const g = new Uint8Array(W * H).fill(255);
    const r = importRawMask({ data: g, w: W, h: H }, alpha(), W, H);
    for (let p = 0; p < W * H; p++) expect(r.mask[p]).toBe(alpha()[p] ? 255 : 0);
    expect(r.metrics.spill).toBe(W * H - 144);
    expect(r.warnings.join()).toContain('jetonun dışına taşıyordu');
    expect(r.warnings.join()).toContain('%80\'den çok');
    const empty = importRawMask({ data: new Uint8Array(W * H), w: W, h: H }, alpha(), W, H);
    expect(empty.warnings.join()).toContain('%2\'sinden az');
  });
  it('var olan elle maske --zorla olmadan ezilmez; bu araçla yazılmış ve değişmemişse yenilenir', () => {
    expect(writeDecision(false, false, false)).toBe('yaz');
    expect(writeDecision(true, false, false)).toBe('atla');
    expect(writeDecision(true, true, false)).toBe('yaz');
    expect(writeDecision(true, false, true)).toBe('yaz');
  });
});
