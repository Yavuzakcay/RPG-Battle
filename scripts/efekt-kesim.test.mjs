// Görev V: sprite sheet kesimi (sentetik pikseller; görsel dosyası okunmaz).
import { describe, it, expect } from 'vitest';
import { findCells, isHalo, isMagenta, bestPeriod } from './efekt-kesim.mjs';

const MAG = [255, 0, 255], GRAY = [70, 70, 70], DARK = [10, 10, 10], YEL = [250, 230, 40], WHITE = [240, 240, 240];

/** Tuval: fill(x0, y0, w, h, renk) ile çizilir; px(x, y) okur. */
function canvas(w, h, bg) {
  const a = Array.from({ length: w * h }, () => bg);
  return {
    w, h, px: (x, y) => a[y * w + x],
    fill(x0, y0, fw, fh, c) { for (let y = y0; y < y0 + fh; y++) for (let x = x0; x < x0 + fw; x++) a[y * w + x] = c; },
    ring(cx, cy, r, c) { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) { const d = Math.hypot(x - cx, y - cy); if (d <= r && d >= r - 3) a[y * w + x] = c; } },
  };
}

describe('efekt sheet kesimi', () => {
  it('4×2 etiketli ızgara (gri zemin, alt etiket): 8 kare, 2×4', () => {
    const c = canvas(4 * 50 + 10, 2 * 60 + 10, GRAY);
    for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
      const x = 10 + col * 50, y = 5 + row * 60;
      c.fill(x, y, 40, 40, MAG);
      c.ring(x + 20, y + 20, 12, YEL);
      c.fill(x + 5, y + 44, 30, 6, WHITE); // etiket (gri zeminde, macenta yok)
    }
    const r = findCells(c.w, c.h, c.px);
    expect(r.frames).toHaveLength(8);
    expect(r.grid).toEqual({ rows: 2, cols: 4 });
    expect(r.frames.every((f) => f.x1 - f.x0 + 1 === 40 && f.y1 - f.y0 + 1 === 40)).toBe(true);
  });
  it('ince koyu ayraçlı şerit: ayraçlar kareleri böler; boş hücre atılır', () => {
    const c = canvas(7 * 40 + 6, 40, MAG);
    for (let k = 1; k < 7; k++) c.fill(k * 41 - 1, 0, 1, 40, DARK);
    for (let k = 1; k < 6; k++) c.ring(k * 41 + 19, 20, 12, YEL); // ilk ve son hücre boş
    const r = findCells(c.w, c.h, c.px);
    expect(r.frames).toHaveLength(5);
    expect(r.notes.filter((n) => n.startsWith('boş hücre'))).toHaveLength(2);
  });
  it('ayraçsız şerit: kare sayısı içerik periyodundan (kareler kare değil, 10 × 30×40)', () => {
    const c = canvas(300, 40, MAG);
    for (let k = 0; k < 10; k++) c.ring(k * 30 + 15, 20, 11, YEL);
    const r = findCells(c.w, c.h, c.px);
    expect(r.frames).toHaveLength(10);
    expect(r.frames[0]).toMatchObject({ x0: 0, x1: 29 });
  });
  it('periyot katı (iki kare) seçilmez', () => {
    const prof = Array.from({ length: 600 }, (_, i) => (i % 60 < 20 ? 1 : 0) + (i % 120 < 20 ? 0.2 : 0));
    expect(bestPeriod(prof, 30, 130)).toBe(60);
  });
  it('içerikten bölme (düzensiz genişlikli engel): macenta boşluklar kareleri ayırır, parçacık en yakın kareye katılır', () => {
    const c = canvas(400, 60, MAG);
    c.fill(10, 10, 60, 45, YEL); c.fill(100, 10, 90, 45, YEL); c.fill(194, 50, 3, 3, WHITE); c.fill(220, 5, 70, 50, YEL); c.fill(320, 20, 50, 35, YEL);
    const r = findCells(c.w, c.h, c.px, { split: 'content' });
    expect(r.frames).toHaveLength(4);
  });
  it('macenta toleransı ve JPG halosu: saf ve gürültülü macenta arka plan, parlak karışım halo; içerik renkleri değil', () => {
    expect(isMagenta(255, 0, 255)).toBe(true);
    expect(isMagenta(232, 28, 246)).toBe(true);
    expect(isHalo(200, 120, 190)).toBe(true);
    // Kalp pembesi, mor duman, sarı yıldız, gri zincir: içerik.
    for (const c of [[240, 90, 140], [80, 40, 110], [250, 230, 40], [120, 120, 125], [60, 160, 240]]) expect(isMagenta(...c)).toBe(false);
  });
});
