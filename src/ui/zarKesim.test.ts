/**
 * Görev SD9b: zar sayfası bölütleme (`scripts/lib/zar-kesim.mjs`). Görsel dosya yok: yapay RGB sayfalar (macenta zemin, daire "zarlar").
 * Yedi zar ayrışmayan sayfalar için sıra: temel → gevşek zemin → aşındırma → şablon (kutu elle verilirse önce); hiçbiri tutmazsa ok=false.
 */
import { describe, expect, it } from 'vitest';
// @ts-ignore: saf JS betik kütüphanesi (tür bildirimi yok)
import * as lib from '../../scripts/lib/zar-kesim.mjs';

const W = 760, H = 140;
type Draw = (x: number, y: number) => boolean;
function sheet(bg: [number, number, number], inside: Draw, dieColor: [number, number, number] = [200, 170, 60]): Uint8Array {
  const d = new Uint8Array(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = inside(x, y) ? dieColor : bg; d.set(c, (y * W + x) * 3); }
  return d;
}
const circles = (gap: number, r: number): Draw => (x, y) => { for (let k = 0; k < 7; k++) { const cx = 60 + k * gap, dx = x - cx, dy = y - 70; if (dx * dx + dy * dy <= r * r) return true; } return false; };
const MAG: [number, number, number] = [255, 0, 255];

describe('zar sayfası bölütleme', () => {
  it('temiz sayfa: yedi bileşen, soldan sağa', () => {
    const r = lib.segment(sheet(MAG, circles(100, 40)), W, H);
    expect(r.ok).toBe(true); expect(r.method).toBe('temel'); expect(r.kept.length).toBe(7);
    expect(r.kept.map((p: { minX: number }) => p.minX)).toEqual([...r.kept.map((p: { minX: number }) => p.minX)].sort((a: number, b: number) => a - b));
  });
  it('zarlar birbirine değiyor (1 bileşen): aşındırma yedi parçaya ayırır, parçalar dolu', () => {
    const data = sheet(MAG, circles(72, 40));
    expect(lib.components(Uint8Array.from(lib.background(data, W, H, { magenta: (r: number, g: number, b: number) => g <= 70 && r >= 150 && b >= 150, pure: () => false, spill: () => false }), (v: number) => (v ? 0 : 1)), W, H).parts.length).toBe(1);
    const r = lib.segment(data, W, H);
    expect(r.ok).toBe(true); expect(r.method).toMatch(/asindirma/); expect(r.kept.length).toBe(7);
    for (const p of r.kept) expect(p.count).toBeGreaterThan(1500);
  });
  it('zemin saf macenta değil (sıkı eşik tutmaz): gevşek eşik zemini temizler', () => {
    const r = lib.segment(sheet([140, 50, 150], circles(100, 40)), W, H);
    expect(r.ok).toBe(true); expect(r.method).toBe('gevsek'); expect(r.kept.length).toBe(7);
  });
  it('aşındırmanın ayıramadığı birleşik çubuk: oransal şablon (gözle doğrulanacak)', () => {
    const bar: Draw = (x, y) => x >= 30 && x < 730 && y >= 40 && y < 110;
    const r = lib.segment(sheet(MAG, bar), W, H, { erodeMax: 10 });
    expect(r.ok).toBe(true); expect(r.method).toBe('sablon'); expect(r.kept.length).toBe(7);
  });
  it('elle kutu verilirse önce o kullanılır', () => {
    const bar: Draw = (x, y) => x >= 30 && x < 730 && y >= 40 && y < 110;
    const kutu = Array.from({ length: 7 }, (_, k) => [30 + k * 100, 40, 30 + k * 100 + 99, 109]);
    const r = lib.segment(sheet(MAG, bar), W, H, { kutu });
    expect(r.ok).toBe(true); expect(r.method).toBe('kutu'); expect(r.kept.length).toBe(7);
  });
  it('hiçbir yöntem tutmazsa yeniden üretilmeli (ok=false)', () => {
    const thin: Draw = (x, y) => x >= 30 && x < 730 && y >= 68 && y < 71;
    const r = lib.segment(sheet(MAG, thin), W, H, { erodeMax: 4 });
    expect(r.ok).toBe(false); expect(r.method).toBe('yok');
  });
  it('başarılı sayfalardan şablon: ≥ 3 sayfa medyan kesim, aksi halde eşit 7 şerit', () => {
    expect(lib.templateFrom([]).length).toBe(7); expect(lib.templateFrom([])[0][1]).toBeCloseTo(1 / 7);
    const good = lib.segment(sheet(MAG, circles(100, 40)), W, H);
    const tpl = lib.templateFrom([good, good, good]);
    expect(tpl.length).toBe(7); expect(tpl[0][0]).toBe(0); expect(tpl[6][1]).toBe(1);
  });
});
