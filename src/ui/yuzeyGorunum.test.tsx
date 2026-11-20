/** Kuyruk KQ5 YZ1: yüzey görünümü: kırpma, dış kenar, yedek renk, ayarlar JSON'dan, animasyon. */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import gorunum from '../../data/yuzey-gorunum.json';
import { SURFACE_PRIORITY, surfaceStyle, zoneLook } from './sprites';
import { SurfaceLayer, hexUnionPath, outerEdgePath, type SurfaceItem } from './SpriteZone';
import type { Offset } from '../rules/hex';
import { hexKey } from '../rules/hex';

// Basit altıgen çizimi (sütun-satır odd-q, düz tepe): test için yeterli geometri.
const W = 40;
const center = (h: Offset) => ({ x: h.col * W * 0.75, y: h.row * W * 0.866 + (h.col % 2 ? W * 0.433 : 0) });
const pts = (h: Offset, scale = 1) => {
  const c = center(h);
  return Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i; return `${(c.x + Math.cos(a) * (W / 2) * scale).toFixed(1)},${(c.y + Math.sin(a) * (W / 2) * scale).toFixed(1)}`; }).join(' ');
};
const hexes = (n: number, row = 0): Offset[] => Array.from({ length: n }, (_, i) => ({ col: i, row }));

const render = (items: SurfaceItem[], animate = true) => renderToStaticMarkup(createElement(SurfaceLayer, { items, animate, hexW: W, base: '/', hexPoints: pts, hexCenter: center }));

describe('YZ1 yüzey görünümü', () => {
  it('ayarlar JSON\'dan: her yüzey türünün stili var; opaklık, kenar kalınlığı, karışım, renk okunur', () => {
    for (const kind of SURFACE_PRIORITY) {
      const st = surfaceStyle(kind);
      expect(st.dolguOpak, kind).toBeGreaterThan(0); expect(st.dolguOpak, kind).toBeLessThanOrEqual(1);
      expect(st.kenarKalinlik, kind).toBeGreaterThan(0); expect(st.renk, kind).toMatch(/^#/); expect(st.karisim, kind).toBeTruthy();
    }
    expect(surfaceStyle('alev').karisim).toBe('screen');
    expect(surfaceStyle('buz').dolguOpak).toBe((gorunum.tur as Record<string, { dolguOpak: number }>).buz?.dolguOpak);
    expect(surfaceStyle('bilinmeyen-tur').dolguOpak).toBe(gorunum.varsayilan.dolguOpak);
  });
  it('her alan kendi altıgenlerine kırpılır (clipPath), dolgu opaklığı ve kenar ayarları uygulanır', () => {
    const look = zoneLook({ spellId: 'surface:water', surface: 'water' }, hexes(3))!;
    const html = render([{ id: 'z1', look, hexes: hexes(3) }]);
    expect(html).toContain('<clipPath'); expect(html).toContain('clip-path="url(#'); expect(html).toContain('data-clipped="true"');
    expect(html).toContain(`fill-opacity="${surfaceStyle('su').dolguOpak}"`);
    expect(html).toContain(`fill="${surfaceStyle('su').renk}"`);
    expect(html).toContain('class="surface-edge"');
    expect(html).not.toContain('filter'); // eski bulanık hale yok
  });
  it('komşu aynı tür tek şekil: kenar çizgisi yalnız dış sınırda (iç ortak kenar yok)', () => {
    const hs = hexes(2);
    const owner = new Map(hs.map((h) => [hexKey(h), 'a']));
    const solo = outerEdgePath([hs[0]!], new Map([[hexKey(hs[0]!), 'a']]), 'a', pts, center, W);
    const both = outerEdgePath(hs, owner, 'a', pts, center, W);
    const segs = (d: string) => (d.match(/M/g) ?? []).length;
    expect(segs(solo)).toBe(6); // tek altıgen: 6 kenar
    expect(segs(both)).toBe(10); // iki komşu: 12 − 2 ortak kenar
    expect(hexUnionPath(hs, pts).match(/Z/g)).toHaveLength(2);
  });
  it('yedek: sprite yoksa düz renk dolgu ve kenar yine çizilir, doku yok', () => {
    const look = zoneLook({ spellId: 'surface:fire', surface: 'fire' }, hexes(2), new Set())!;
    expect(look.patches).toEqual([]);
    const html = render([{ id: 'f', look, hexes: hexes(2) }]);
    expect(html).toContain('surface-fill'); expect(html).toContain('surface-edge'); expect(html).not.toContain('<image');
  });
  it('sprite varsa yalnız doku olarak düşük opaklıkta içeride (kırpma grubunda)', () => {
    const look = zoneLook({ spellId: 'surface:water', surface: 'water' }, hexes(2))!;
    const html = render([{ id: 'w', look, hexes: hexes(2) }]);
    expect(html).toContain('<image'); expect(html).toContain(`opacity="${surfaceStyle('su').dokuOpak}"`);
    expect(html.indexOf('clip-path')).toBeLessThan(html.indexOf('<image'));
  });
  it('animasyon: açıkken adımlı sınıf, hareketi azalt/Efekt animasyonu kapalıyken statik', () => {
    const look = zoneLook({ spellId: 'surface:fire', surface: 'fire' }, hexes(2))!;
    expect(render([{ id: 'f', look, hexes: hexes(2) }], true)).toContain('anim-titrek');
    const off = render([{ id: 'f', look, hexes: hexes(2) }], false);
    expect(off).not.toContain('anim-'); expect(off).not.toContain('drift-a');
  });
  it('çakışma: aynı altıgende yalnız yüksek öncelikli tür çizilir (alev su üstünde)', () => {
    const a = zoneLook({ spellId: 'surface:fire', surface: 'fire' }, hexes(1))!;
    const b = zoneLook({ spellId: 'surface:water', surface: 'water' }, hexes(2))!;
    const html = render([{ id: 'su', look: b, hexes: hexes(2) }, { id: 'alev', look: a, hexes: hexes(1) }]);
    expect(html).toContain('data-zone="alev"'); expect(html).toContain('data-zone="su"');
  });
});
