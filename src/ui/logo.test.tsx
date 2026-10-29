/**
 * Görev L: logo hattı (saf anahtarlama, sentetik tamponla), üretilen logo/ikon raporu (data/logo.json), giriş ekranı
 * başlığı (açılış ekranı: splash.test.tsx). Görsel dosyaları testlere girmez: yalnızca adlar listelenir.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import logo from '../../data/logo.json';
import { alphaBounds, findEye, haloRatio, inPolygon, keyWhite, type Raw } from './logoKey';
import { Home } from '../screens/Screens';

/** 40×30 beyaz zemin; ortada koyu kırmızı dikdörtgen (8..31 × 6..23), içinde kapalı beyaz vurgu ve turuncu göz. */
function synthetic(): Raw {
  const w = 40, h = 30;
  const data = new Uint8Array(w * h * 3).fill(255);
  const set = (x: number, y: number, rgb: [number, number, number]) => data.set(rgb, (y * w + x) * 3);
  for (let y = 6; y < 24; y++) for (let x = 8; x < 32; x++) set(x, y, [150, 30, 20]);
  for (let y = 10; y < 13; y++) for (let x = 12; x < 16; x++) set(x, y, [250, 250, 250]); // kapalı parlak vurgu
  for (let y = 16; y < 21; y++) for (let x = 24; x < 29; x++) set(x, y, [255, 170, 40]); // göz
  // Zemine karışmış açık pembe kenar pikseli (JPG geçişi): daraltmayla atılır.
  set(8, 15, [240, 200, 200]);
  return { data, width: w, height: h, channels: 3 };
}
const A = (img: Raw, x: number, y: number) => img.data[(y * img.width + x) * 4 + 3]!;

describe('Logo şeffaflaştırma (saf)', () => {
  const k = keyWhite(synthetic());
  it('kenara bağlı beyaz saydam, gövde opak, kenar yumuşak; kapalı parlak vurgu korunur', () => {
    expect(k.channels).toBe(4);
    expect([A(k, 0, 0), A(k, 39, 29), A(k, 3, 15)]).toEqual([0, 0, 0]);
    expect(A(k, 20, 15)).toBe(255);
    expect(A(k, 13, 11)).toBe(255);
    expect(k.data[(11 * 40 + 13) * 4]).toBe(250);
    // 1 px daralma + σ 0,8: dış sıra yarı saydam, bir içerisi neredeyse opak.
    const edge = A(k, 8, 10);
    expect(edge).toBeGreaterThan(0);
    expect(edge).toBeLessThan(200);
    expect(A(k, 10, 10)).toBeGreaterThan(240);
  });
  it('yarı saydam kenarda beyaz kalıntı yok (koyu zeminde hale olmaz)', () => {
    const h = haloRatio(k);
    expect(h.edge).toBeGreaterThan(0);
    expect(h.halo).toBe(0);
  });
  it('enclosed bölgesi verilince kapalı beyaz da saydam (yazı bandındaki harf boşlukları)', () => {
    const k2 = keyWhite(synthetic(), { enclosed: (_x, y) => y < 0.5 });
    expect(A(k2, 13, 11)).toBe(0);
    expect(A(k2, 20, 15)).toBe(255);
  });
  it('göz: en parlak turuncu nokta; kutuda yoksa null', () => {
    const eye = findEye(k, { x0: 0, y0: 0, x1: 1, y1: 1 });
    expect(eye).not.toBe(null);
    expect(eye!.x * 40).toBeGreaterThanOrEqual(24);
    expect(eye!.x * 40).toBeLessThan(29);
    expect(findEye(k, { x0: 0, y0: 0, x1: 0.3, y1: 0.3 })).toBe(null);
  });
  it('sınır ve çokgen', () => {
    const b = alphaBounds(k, 200);
    expect(b.x0).toBeGreaterThanOrEqual(8);
    expect(b.x1).toBeLessThanOrEqual(31);
    expect(inPolygon(0.5, 0.5, [[0, 0], [1, 0], [1, 1], [0, 1]])).toBe(true);
    expect(inPolygon(1.5, 0.5, [[0, 0], [1, 0], [1, 1], [0, 1]])).toBe(false);
  });
});

const files = (dir: string) => new Set(Object.keys(import.meta.glob('/public/**/*.{webp,png,ico}')).filter((f) => f.startsWith(dir)).map((f) => f.replace('/public/', '')));

describe('Üretilen logolar (data/logo.json, npm run logo)', () => {
  it('iki şeffaf logo: boyut, saydam köşe, hale yok; harf boşlukları yalnızca yazılı sürümde', () => {
    const o = logo.outputs as Record<string, { file: string; width: number; height: number }>;
    expect(o.acilis).toMatchObject({ file: 'public/logo/logo-acilis.webp', width: 1400 });
    expect(o.masaustu).toMatchObject({ file: 'public/logo/logo-masaustu.webp', width: 1200 });
    expect(Math.abs(o.acilis!.width / o.acilis!.height - 2624 / 1632)).toBeLessThan(0.01);
    for (const c of [logo.checks.acilis, logo.checks.masaustu]) {
      expect(c.cornerAlpha).toBe(0);
      expect(c.edgePixels).toBeGreaterThan(1000);
      expect(c.haloRatio).toBeLessThan(0.001);
    }
    expect(logo.checks.acilis.textCounters).toBe(2);
    expect(logo.checks.masaustu.textCounters).toBe(0);
    // Zar yüzlerindeki parlak vurgular kapalı beyaz olarak korunur (altıgenin içinde).
    expect(logo.checks.masaustu.keptWhite.length).toBeGreaterThan(0);
    expect(logo.method).toEqual({ whiteMin: 232, erodePx: 1, alphaSigma: 0.8 });
    expect(files('/public/logo')).toEqual(new Set(['logo/logo-acilis.webp', 'logo/logo-masaustu.webp', 'logo/acilis-kanat-sol.webp', 'logo/acilis-kanat-sag.webp', 'logo/acilis-govde.webp', 'logo/acilis-yazi.webp']));
  });
  it('açılış katmanları: kutular tuvalde, kanatlar iki yanda, yazı altta; göz başta bulundu', () => {
    const L = logo.acilis.layers as Record<string, { box: { x: number; y: number; w: number; h: number } }>;
    for (const l of Object.values(L)) {
      expect(l.box.x).toBeGreaterThanOrEqual(0);
      expect(l.box.x + l.box.w).toBeLessThanOrEqual(1.0001);
      expect(l.box.y + l.box.h).toBeLessThanOrEqual(1.0001);
    }
    expect(L['kanat-sol']!.box.x + L['kanat-sol']!.box.w).toBeLessThan(0.5);
    expect(L['kanat-sag']!.box.x).toBeGreaterThan(0.5);
    expect(L.yazi!.box.y).toBeGreaterThanOrEqual(logo.acilis.textTop - 0.002);
    expect(logo.acilis.eye.found).toBe(true);
    expect(logo.acilis.eye.x).toBeGreaterThan(0.48);
    expect(logo.acilis.eye.y).toBeLessThan(0.32);
    // Görev L2: logodaki d20 altıgenin ortasında, ≈440×487 kaynak piksel.
    const d = logo.acilis.die;
    expect(Math.abs(d.x + d.w / 2 - 0.5)).toBeLessThan(0.01);
    expect(d.w * 2624).toBeGreaterThan(400);
    expect(d.w * 2624).toBeLessThan(480);
    expect((d.h * 1632) / (d.w * 2624)).toBeGreaterThan(1.0);
    expect((d.h * 1632) / (d.w * 2624)).toBeLessThan(1.2);
  });
  it('ikon seti yalnızca projedeki platform (web): favicon.ico 16/32/48 + apple-touch-icon 180; 1024 ana ikon opak, sanat ≈%68', () => {
    expect(logo.icon.platform).toBe('web');
    expect(logo.icon.files.map((f) => [f.file, f.sizes])).toEqual([['public/favicon.ico', [16, 32, 48]], ['public/ikon/apple-touch-icon.png', [180]]]);
    expect(logo.icon.master).toMatchObject({ size: 1024, opaque: true, background: '#1A1A1C' });
    const a = logo.icon.master.art;
    expect(Math.max(a.x1 - a.x0, a.y1 - a.y0)).toBeCloseTo(0.68, 2);
    expect((a.x0 + a.x1) / 2).toBeCloseTo(0.5, 2);
    expect((a.y0 + a.y1) / 2).toBeCloseTo(0.5, 2);
    expect(files('/public/ikon')).toEqual(new Set(['ikon/apple-touch-icon.png']));
    expect(files('/public/favicon')).toEqual(new Set(['favicon.ico']));
    // Android/iOS/Windows yapısı ya da PWA manifesti yok: onlara ait dosya üretilmez.
    expect(Object.keys(import.meta.glob('/public/**/*.webmanifest')).length + Object.keys(import.meta.glob('/public/**/manifest.json')).length).toBe(0);
  });
});

describe('Giriş ekranı başlığı', () => {
  it('yazısız açık kanatlı logo (logo-masaustu) ve canlı ad APP_NAME; kare ikon logosu yok', () => {
    const html = renderToStaticMarkup(<Home onPlayer={() => {}} onGm={() => {}} onStatus={() => {}} />);
    expect(html).toContain('logo/logo-masaustu.webp');
    expect(html).toContain('class="brand-title" lang="en">Dice &amp; Hex</h1>');
    expect(html).not.toContain('logo-mobil');
    expect(html).not.toContain('RPG Battle');
  });
});
