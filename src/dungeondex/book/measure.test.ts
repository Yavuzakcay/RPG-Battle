/**
 * Dungeondex Kitap ölçümü (Görev DD-Kitap): sentetik macenta zeminli tamponlarda şeffaflaştırma + kutu ölçümü, ve
 * data/dungeondex-kitap.json kayıtlarının doğrulaması (görsel dosyası testlere girmez; yalnız dosya adları listelenir).
 */
import { describe, expect, it } from 'vitest';
import type { Raw } from '../../ui/logoKey';
import { coverProblems, keyMagenta, measureCover, measureMobile, measureSpread, spreadProblems, type Box } from './measure';
import kitap from '../../../data/dungeondex-kitap.json';
import { bookData, frameFor } from './kitapData';

type RGB = [number, number, number];
const MAG: RGB = [255, 0, 255], GRAFIT: RGB = [43, 43, 46], VITRIN: RGB = [18, 20, 24], KREM: RGB = [235, 217, 195], KOR: RGB = [255, 90, 31];

function canvas(w: number, h: number): Raw & { fill: (pred: (x: number, y: number) => boolean, c: RGB) => void } {
  const data = new Uint8Array(w * h * 3);
  const img = {
    data, width: w, height: h, channels: 3,
    fill(pred: (x: number, y: number) => boolean, c: RGB) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (pred(x, y)) data.set(c, (y * w + x) * 3);
    },
  };
  img.fill(() => true, MAG);
  return img;
}
const rect = (x0: number, y0: number, x1: number, y1: number) => (x: number, y: number) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const near = (b: Box, e: Box, tol = 0.012) => {
  for (const k of ['x', 'y', 'w', 'h'] as const) expect(Math.abs(b[k] - e[k]), `${k}: ${b[k]} ~ ${e[k]}`).toBeLessThan(tol);
};

describe('Dungeondex Kitap ölçümü', () => {
  it('macenta zemin saydam, kenar kırpılır, pembe hale temizlenir', () => {
    const c = canvas(60, 40);
    c.fill(rect(10, 10, 49, 29), GRAFIT);
    // Kenarda macentaya karışmış piksel (JPEG hale).
    c.fill(rect(10, 10, 49, 10), [150, 40, 150]);
    const k = keyMagenta(c);
    expect(k.width).toBeLessThanOrEqual(42);
    expect(k.height).toBeLessThanOrEqual(22);
    let pink = 0;
    for (let p = 0; p < k.width * k.height; p++) {
      const [r, g, b, a] = [k.data[p * 4]!, k.data[p * 4 + 1]!, k.data[p * 4 + 2]!, k.data[p * 4 + 3]!];
      if (a > 0 && Math.min(r, b) - g > 20) pink++;
    }
    expect(pink).toBe(0);
    expect(k.data[(Math.floor(k.height / 2) * k.width + Math.floor(k.width / 2)) * 4 + 3]).toBe(255);
  });

  it('kapak: altıgen pencere ve köşeleri, üst/alt şerit, toka taşı', () => {
    const W = 300, H = 400, c = canvas(W, H);
    c.fill(rect(20, 20, 279, 379), GRAFIT);
    // Sivri tepeli altıgen, merkez (150, 200), yarıçap 80.
    const R = 80, cx = 150, cy = 200;
    const corners = Array.from({ length: 6 }, (_, i) => [cx + R * Math.cos(((-90 + 60 * i) * Math.PI) / 180), cy + R * Math.sin(((-90 + 60 * i) * Math.PI) / 180)] as const);
    const inHex = (x: number, y: number) => {
      let s = 0;
      for (let i = 0; i < 6; i++) { const [ax, ay] = corners[i]!, [bx, by] = corners[(i + 1) % 6]!; const cr = (bx - ax) * (y - ay) - (by - ay) * (x - ax); if (cr < 0) return false; s++; }
      return s === 6;
    };
    c.fill(inHex, VITRIN);
    c.fill(rect(90, 50, 210, 80), VITRIN);
    c.fill(rect(90, 320, 210, 350), KREM);
    c.fill((x, y) => (x - 258) ** 2 + (y - 200) ** 2 <= 64, KOR);
    const k = keyMagenta(c);
    const m = measureCover(k)!;
    expect(m).not.toBeNull();
    const aspect = k.width / k.height;
    expect(coverProblems(m, aspect)).toEqual([]);
    const sx = (x: number) => (x - 19) / k.width, sy = (y: number) => (y - 19) / k.height;
    near(m.pencere, { x: sx(cx - R * Math.cos(Math.PI / 6)), y: sy(cy - R), w: (2 * R * Math.cos(Math.PI / 6)) / k.width, h: (2 * R) / k.height }, 0.02);
    expect(m.altigen).toHaveLength(6);
    expect(Math.abs(m.altigen[0]!.x - sx(cx))).toBeLessThan(0.02);
    expect(Math.abs(m.altigen[0]!.y - sy(cy - R))).toBeLessThan(0.02);
    near(m.ustSerit!, { x: sx(90), y: sy(50), w: 121 / k.width, h: 31 / k.height });
    near(m.altSerit!, { x: sx(90), y: sy(320), w: 121 / k.width, h: 31 / k.height });
    expect(Math.abs(m.toka!.x - sx(258.5))).toBeLessThan(0.01);
    expect(Math.abs(m.toka!.y - sy(200.5))).toBeLessThan(0.01);
  });

  it('geniş çerçeve: vitrin, vitrin altı şerit, sağ krem sayfa ve %2 güvenli alan', () => {
    const W = 600, H = 400, c = canvas(W, H);
    c.fill(rect(10, 10, 589, 389), GRAFIT);
    c.fill(rect(40, 40, 259, 279), VITRIN);
    c.fill(rect(60, 300, 239, 330), VITRIN);
    c.fill(rect(320, 30, 569, 369), KREM);
    const k = keyMagenta(c);
    const m = measureSpread(k)!;
    expect(spreadProblems(m, k.width / k.height, 'genis')).toEqual([]);
    const sx = (x: number) => (x - 9) / k.width, sy = (y: number) => (y - 9) / k.height;
    near(m.vitrin, { x: sx(40), y: sy(40), w: 220 / k.width, h: 240 / k.height });
    near(m.serit!, { x: sx(60), y: sy(300), w: 180 / k.width, h: 31 / k.height });
    near(m.sayfa, { x: sx(320), y: sy(30), w: 250 / k.width, h: 340 / k.height });
    near(m.guvenli, { x: m.sayfa.x + 0.02, y: m.sayfa.y + 0.02, w: m.sayfa.w - 0.04, h: m.sayfa.h - 0.04 }, 0.0002);
  });

  it('mobil çerçeve: vitrin, şerit, menteşe bandı, alt krem sayfa', () => {
    const W = 300, H = 600, c = canvas(W, H);
    c.fill(rect(10, 10, 289, 589), GRAFIT);
    c.fill(rect(30, 30, 269, 249), VITRIN);
    c.fill(rect(50, 262, 249, 292), VITRIN);
    c.fill(rect(25, 340, 274, 579), KREM);
    const k = keyMagenta(c);
    const m = measureMobile(k)!;
    expect(spreadProblems(m, k.width / k.height, 'mobil')).toEqual([]);
    const sy = (y: number) => (y - 9) / k.height;
    expect(m.serit).not.toBeNull();
    expect(m.mentese).toBeTruthy();
    expect(Math.abs(m.mentese!.y - sy(293))).toBeLessThan(0.01);
    expect(Math.abs(m.mentese!.y + m.mentese!.h - sy(340))).toBeLessThan(0.01);
    expect(m.mentese!.w).toBeGreaterThan(0.9);
  });

  it('veri dosyası: kayıtlı kutular geçerli, görseller public/dungeondex altında', () => {
    const files = Object.keys(import.meta.glob('../../../public/dungeondex/*.webp')).map((f) => f.split('/').pop());
    const d = kitap as unknown as Record<string, unknown>;
    for (const k of ['kanatMs', 'kapakMs', 'solmaMs', 'nabizMs', 'logoOlcek']) expect(typeof (kitap.animasyon as Record<string, number>)[k]).toBe('number');
    for (const kind of ['kapak', 'genis', 'mobil'] as const) {
      const e = d[kind] as ({ file: string; aspect: number } & Record<string, unknown>) | null;
      if (!e) continue;
      expect(files).toContain(e.file.split('/').pop());
      expect(e.aspect).toBeGreaterThan(0.3);
      expect(e.aspect).toBeLessThan(3);
      const p = kind === 'kapak' ? coverProblems(e as never, e.aspect) : spreadProblems(e as never, e.aspect, kind);
      expect(p, kind).toEqual([]);
    }
  });

  it('çerçeve seçimi: dar/dik ekranda mobil, yoksa düz düzen', () => {
    const b = bookData();
    expect(frameFor(1200, 800, b)).toBe(b.genis ? 'genis' : b.mobil ? 'mobil' : 'duz');
    expect(frameFor(650, 900, b)).toBe(b.mobil ? 'mobil' : b.genis ? 'genis' : 'duz');
    expect(frameFor(1000, 1400, { genis: null, mobil: null, kapak: null })).toBe('duz');
    expect(frameFor(1000, 1400, { genis: {} as never, mobil: {} as never, kapak: null })).toBe('mobil');
    expect(frameFor(1400, 900, { genis: {} as never, mobil: {} as never, kapak: null })).toBe('genis');
    expect(frameFor(690, 500, { genis: {} as never, mobil: {} as never, kapak: null })).toBe('mobil');
  });
});
