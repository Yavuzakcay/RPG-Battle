/** Görev J3: 3D zar şekilleri, sonuç yüzüne oturma, sahte fizik eğrisi ve 3D'ye geçiş kararı (WebGL'siz). */
import { describe, it, expect } from 'vitest';
import { dot, rotate, visualRandom, type Vec3 } from './math';
import { restingQuat, shapeOf, splitPercent, topLabel, visibleDice } from './shapes';
import { bounceTimes, frameAt, hop, layout, makePath } from './throw';
import { deviceCapable, dice3dAllowed, isDice3dSlow, reportDice3dFps } from '../dice3dSupport';
import { onDiceSound, emitDiceSound } from '../diceSound';

const SIDES = [4, 6, 8, 10, 12, 20];

describe('zar şekilleri', () => {
  it('yüz ve köşe sayıları doğru, yüzler dışa bakıyor, etiketler 1..n', () => {
    const faces: Record<number, number> = { 4: 4, 6: 6, 8: 8, 10: 10, 12: 12, 20: 20 };
    for (const n of SIDES) {
      const s = shapeOf(n);
      expect(s.faces.length).toBe(faces[n]);
      for (const f of s.faces) expect(dot(f.normal, f.center)).toBeGreaterThan(0);
      const labels = n === 4 ? s.vertexLabels : s.faces.map((f) => f.label);
      expect([...(labels ?? [])].map(Number).sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i + 1));
    }
    expect(shapeOf(12).faces.every((f) => f.verts.length === 5)).toBe(true);
    expect(shapeOf(10).faces.every((f) => f.verts.length === 4)).toBe(true);
  });
  it('her sonuçta istenen yüz (d4: köşe) yukarı bakar, yazının üstü ekranın üstüne', () => {
    for (const n of SIDES) {
      for (let v = 1; v <= n; v++) {
        const s = shapeOf(n);
        const q = restingQuat(s, String(v), 0.2);
        expect(topLabel(s, q)).toBe(String(v));
        if (n !== 4) {
          const f = s.faces.find((x) => x.label === String(v));
          expect(rotate(q, f!.normal)[1]).toBeCloseTo(1, 5);
          expect(-rotate(q, f!.up)[2]).toBeGreaterThan(0.9); // yazı ekran yukarısına (−z)
        }
      }
    }
  });
  it('d100 iki d10: onlar ve birler (100 = 00 + 0)', () => {
    expect(splitPercent(100)).toEqual({ tens: '00', ones: '0' });
    expect(splitPercent(7)).toEqual({ tens: '00', ones: '7' });
    expect(splitPercent(40)).toEqual({ tens: '40', ones: '0' });
    expect(splitPercent(73)).toEqual({ tens: '70', ones: '3' });
    const d = visibleDice(100, [73]);
    expect(d.map((x) => x.label)).toEqual(['70', '3']);
    expect(topLabel(d[0]!.shape, restingQuat(d[0]!.shape, '70'))).toBe('70');
  });
});

describe('sahte fizik', () => {
  it('atış sonunda zar tam sonuç yöneliminde ve yerinde durur; yolda seker', () => {
    const rand = visualRandom(7);
    const s = shapeOf(20);
    const final = restingQuat(s, '17', 0.1);
    const p = makePath([1, 0, 0.5], 0.6, final, s.inradius * 0.6, rand);
    const end = frameAt(p, 1);
    expect(end.quat.map((x) => x.toFixed(6))).toEqual(final.map((x) => x.toFixed(6)));
    expect(end.pos).toEqual([1, s.inradius * 0.6, 0.5]);
    expect(topLabel(s, end.quat)).toBe('17');
    // Başta havada, değme anlarında yerde, aralarda yükselir; sekmeler gittikçe alçalır.
    expect(hop(0)).toBeGreaterThan(2);
    const b = bounceTimes().map((x) => x.t);
    for (const t of b) expect(hop(t)).toBeCloseTo(0, 6);
    const peaks = [0, 1, 2].map((k) => hop(((b[k] as number) + (b[k + 1] as number)) / 2));
    expect(peaks[0]).toBeGreaterThan(peaks[1] as number);
    expect(peaks[1]).toBeGreaterThan(peaks[2] as number);
  });
  it('çok zar ayrı hücrelere dizilir, birbirine çarpmaz', () => {
    for (const n of [1, 2, 4, 8]) {
      const { centers, size } = layout(n, visualRandom(n));
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const a = centers[i] as Vec3, b = centers[j] as Vec3;
        expect(Math.hypot(a[0] - b[0], a[2] - b[2])).toBeGreaterThan(2 * size);
      }
    }
  });
});

describe('3D kararı ve ses tetikleri', () => {
  it('yalnızca Normal hızda, hareket azaltma kapalıyken ve yeterli cihazda', () => {
    expect(dice3dAllowed('fast', false)).toBe(false);
    expect(dice3dAllowed('off', false)).toBe(false);
    expect(dice3dAllowed('normal', true)).toBe(false);
    expect(deviceCapable({ deviceMemory: 2, hardwareConcurrency: 8 })).toBe(false);
    expect(deviceCapable({ deviceMemory: 8, hardwareConcurrency: 2 })).toBe(false);
    expect(deviceCapable({})).toBe(true);
  });
  it('tek yavaş atış 2D\'ye düşürmez; art arda iki yavaş atış düşürür', () => {
    reportDice3dFps(13);
    reportDice3dFps(50);
    reportDice3dFps(13);
    expect(isDice3dSlow()).toBe(false);
    reportDice3dFps(12);
    expect(isDice3dSlow()).toBe(true);
  });
  it('ses tetik noktası: dinleyiciler sekme ve durma olaylarını alır', () => {
    const got: string[] = [];
    const off = onDiceSound((e) => got.push(e.type));
    emitDiceSound({ type: 'bounce', sides: 20, strength: 1 });
    emitDiceSound({ type: 'settle', sides: 20, crit: true, fumble: false });
    off();
    emitDiceSound({ type: 'bounce', sides: 6, strength: 0.5 });
    expect(got).toEqual(['bounce', 'settle']);
  });
});
