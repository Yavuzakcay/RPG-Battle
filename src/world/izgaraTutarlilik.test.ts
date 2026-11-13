/**
 * Kuyruk K75: dünya haritası ızgaraları arasında tutarlılık (veri değişmedi, yalnız koruma):
 * bölge ızgarası (`bolge-izgara.json`), yürüme ızgarası (`yurume-izgara.json`) ve su katmanı (yüzme hücreleri, deniz rotaları).
 */
import { describe, expect, it } from 'vitest';
import bolge from '../../data/harita/bolge-izgara.json';
import yurume from '../../data/harita/yurume-izgara.json';
import deniz from '../../data/harita/deniz-yollari.json';

const W = bolge.genislik, H = bolge.yukseklik, CELL = bolge.hucre;
const decode = (rows: number[][]): Uint8Array => {
  const out = new Uint8Array(W * H);
  rows.forEach((row, y) => { let x = 0; for (let i = 0; i < row.length; i += 2) { out.fill(row[i] as number, y * W + x, y * W + x + (row[i + 1] as number)); x += row[i + 1] as number; } });
  return out;
};
const reg = decode(bolge.satirlar as number[][]), swim = decode(bolge.yuzme as number[][]), walk = decode(yurume.satirlar as number[][]);
const at = (p: number[]) => Math.min(H - 1, Math.floor((p[1] as number) / CELL)) * W + Math.min(W - 1, Math.floor((p[0] as number) / CELL));

describe('K75: dünya ızgaraları tutarlı', () => {
  it('iki ızgara aynı boyut ve hücre', () => {
    expect([bolge.genislik, bolge.yukseklik, bolge.hucre]).toEqual([yurume.genislik, yurume.yukseklik, yurume.hucre]);
  });
  it('yüzme hücresi yürünür değil; bölgeli her hücre kara ya da yüzme; bölgesiz hücre kara/yüzme değil', () => {
    let a = 0, b = 0, c = 0;
    for (let i = 0; i < W * H; i++) {
      if (swim[i] && walk[i]) a++;
      if (reg[i] && !walk[i] && !swim[i]) b++;
      if (!reg[i] && (walk[i] || swim[i])) c++;
    }
    expect({ yuzmeVeYurunur: a, bolgeliKuru: b, bolgesizKara: c }).toEqual({ yuzmeVeYurunur: 0, bolgeliKuru: 0, bolgesizKara: 0 });
  });
  it('deniz rotaları karadan geçmez (iskele uçlarında 2 örnek tolerans)', () => {
    for (const r of deniz.rotalar) {
      const pts = r.noktalar as number[][];
      const samples: number[] = [];
      for (let k = 0; k + 1 < pts.length; k++) {
        const a = pts[k] as number[], b = pts[k + 1] as number[];
        const n = Math.floor(Math.max(Math.abs((b[0] as number) - (a[0] as number)), Math.abs((b[1] as number) - (a[1] as number))) / 16) + 1;
        for (let s = 0; s <= n; s++) samples.push(at([(a[0] as number) + ((b[0] as number) - (a[0] as number)) * s / n, (a[1] as number) + ((b[1] as number) - (a[1] as number)) * s / n]));
      }
      const inner = samples.slice(2, samples.length - 2);
      expect(inner.filter((i) => walk[i]).length, r.id).toBe(0);
    }
  });
});
