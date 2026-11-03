/** Kuyruk H1: dünya haritası işaretleri: zoom ölçeği ve etiketten kaçma. */
import { describe, expect, it } from 'vitest';
import { avoidLabels, markerStyle } from './markers';
import yollar from '../../../data/harita/deniz-yollari.json';
import kurallar from '../../../data/harita/gezinti-kurallari.json';

describe('işaretler', () => {
  it('uzakta kaybolur, yaklaştıkça büyür', () => {
    expect(markerStyle(12).size).toBe(0);
    expect(markerStyle(7.5).alpha).toBeCloseTo(0.5);
    expect(markerStyle(1).size).toBeGreaterThan(markerStyle(5).size);
  });
  it('etiket kutusuyla çakışan işaret kutunun altına kaçar; çakışmayan yerinde kalır', () => {
    const label = { x: 90, y: 90, w: 60, h: 20 };
    expect(avoidLabels(100, 100, 12, [label])).toEqual([100, 90 + 20 + 6 + 2]);
    expect(avoidLabels(300, 300, 12, [label])).toEqual([300, 300]);
  });
  it('Khadyrga iskelesi havzada; liman rotaları iskeleden başlar, merkez aynı noktada', () => {
    const at = yollar.iskeleler.liman;
    expect(at).toEqual([3590, 3250]);
    for (const r of yollar.rotalar.filter((x) => x.id.split('-').includes('liman'))) {
      const n = r.noktalar as number[][];
      expect([n[0], n[n.length - 1]]).toContainEqual(at);
    }
    expect(kurallar.hublar.find((h) => h.id === 'liman_iskele')?.px).toEqual(at);
  });
});
