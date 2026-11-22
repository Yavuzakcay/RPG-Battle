/**
 * Görev D (yalnız arayüz): savaş ekranının çerçevesi pencere boyutuna göre. Yatay telefon ve masaüstünde Görev D öncesi
 * DOM (`.mb-screen` > `.mb-stage` + `.portrait-hint`, dikey parçası yok, eylem menüsü haritanın üstünde radyal);
 * telefon dikeyde üst şerit, harita alanı ve çekmece (kapalı çubuk ≥ 44 px), radyal menü haritada değil.
 * Sunucu çizimi (efektler çalışmaz): pencere ölçüsü taklit edilir.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, describe, expect, it } from 'vitest';
import { createMapSession } from '../demo';
import { dispatch } from './session';
import { Battle } from '../MapBattle';
import type { Session } from './session';

const g = globalThis as unknown as { window?: unknown };
const had = 'window' in g;
const old = g.window;
afterAll(() => { if (had) g.window = old; else delete g.window; });

function render(w: number, h: number, session: Session): string {
  g.window = { innerWidth: w, innerHeight: h, addEventListener() {}, removeEventListener() {}, setTimeout, clearTimeout, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) };
  return renderToStaticMarkup(<Battle initial={session} onExit={() => undefined} />);
}

const started = (): Session => {
  let s = createMapSession('orman', 'orman', false, () => 0.5);
  s = dispatch(s, { type: 'start_battle' }, () => 0.5);
  return s;
};

describe('Görev D: savaş ekranı çerçevesi', () => {
  it('yatay telefon ve masaüstü: dikey parçası yok, sahne eski oranda, ipucu yerinde', () => {
    const s = started();
    const R = 1280 / 715;
    for (const [w, h] of [[844, 390], [740, 360], [1280, 800], [1920, 1080]] as const) {
      const html = render(w, h, s);
      expect(html.startsWith('<div class="mb-screen"><div class="mb-stage" data-testid="battle-stage"')).toBe(true);
      // Görev D öncesi formül: min(genişlik, yükseklik × oran) ve oranla yükseklik.
      const m = html.match(/data-testid="battle-stage" style="width:([\d.]+)px;height:([\d.]+)px"/);
      const sw = Math.min(w, h * R);
      expect(Number(m?.[1])).toBeCloseTo(sw, 6);
      expect(Number(m?.[2])).toBeCloseTo(sw / R, 6);
      // Radyal eylem menüsü haritanın üstünde (sıradaki yaratığın çevresinde).
      expect(html).toMatch(/<div class="hud">/);
      expect(html).not.toMatch(/class="pt-|mb-screen portrait/);
      expect(html).toContain('class="portrait-hint"');
      expect(html).toContain('class="turn-strip"');
    }
  });
  it('telefon dikey: üst şerit, harita alanı, kapalı çekmece çubuğu; radyal düğme haritada yok', () => {
    const s = started();
    for (const [w, h] of [[390, 844], [360, 740], [412, 915]] as const) {
      const html = render(w, h, s);
      expect(html.startsWith('<div class="mb-screen portrait"><div class="pt-top"></div><div class="pt-map">')).toBe(true);
      expect(html).toContain('data-testid="sheet"');
      expect(html).toMatch(/class="pt-sheet" data-testid="sheet"[^>]*style="height:calc\(52px \+ env\(safe-area-inset-bottom, 0px\)\)"/);
      expect(html).toContain('data-testid="sheet-handle"');
      expect(html).toContain('aria-expanded="false"');
      expect(html).not.toContain('portrait-hint');
      expect(html.split('class="pt-sheet')[0]).not.toContain('radial-btn');
      // Harita alanı ölçülmeden önce tahmin: ekran − üst şerit − çubuk (ekranın %55'inden çok).
      const m = html.match(/data-testid="battle-stage" style="width:(\d+(?:\.\d+)?)px;height:(\d+(?:\.\d+)?)px"/);
      expect(Number(m?.[2])).toBeGreaterThanOrEqual(h * 0.55);
    }
  });
});
