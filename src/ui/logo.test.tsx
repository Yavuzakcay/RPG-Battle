/**
 * Görev L: logo hattı (saf anahtarlama, sentetik tamponla), üretilen logo/ikon raporu (data/logo.json), giriş ekranı
 * başlığı (açılış ekranı: splash.test.tsx). Görsel dosyaları testlere girmez: yalnızca adlar listelenir.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import logo from '../../data/logo.json';
import acilisEkrani from '../../data/acilis-ekrani.json';
import { alphaBounds, fillBlob, findEye, haloRatio, hexBounds, inPolygon, keyDark, keyWhite, largestComponent, wingEnds, wingMask, type Raw } from './logoKey';
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

/** 40×40 koyu zemin (30,30,32); ortada siyah kare (8..31), içinde gri leke (14..25) ve kırmızı şerit (x 26..28). */
function darkSynthetic(): Raw {
  const w = 40, h = 40;
  const data = new Uint8Array(w * h * 3);
  for (let p = 0; p < w * h; p++) data.set([30, 30, 32], p * 3);
  const set = (x: number, y: number, rgb: [number, number, number]) => data.set(rgb, (y * w + x) * 3);
  for (let y = 8; y < 32; y++) for (let x = 8; x < 32; x++) set(x, y, [4, 4, 5]);
  for (let y = 14; y < 26; y++) for (let x = 14; x < 26; x++) set(x, y, [35, 34, 38]);
  for (let y = 10; y < 30; y++) for (let x = 26; x < 29; x++) set(x, y, [210, 40, 30]);
  return { data, width: w, height: h, channels: 3 };
}

describe('Kapalı kanatlı logo işlemleri (saf, Görev L3)', () => {
  it('koyu zemin saydam, siyah kontur ve iç opak; zemine yakın ama kapalı gri leke saydamlaşmaz', () => {
    const k = keyDark(darkSynthetic(), [30, 30, 32], 9);
    expect([A(k, 0, 0), A(k, 39, 39), A(k, 3, 20)]).toEqual([0, 0, 0]);
    expect(A(k, 12, 12)).toBe(255);
    expect(A(k, 20, 20)).toBe(255); // leke zemin rengine yakın ama kenara bağlı değil
  });
  it('leke iç siyahla dolar, kırmızı şerit değişmez; altıgen (kare) sınırı ölçülür', () => {
    const k = keyDark(darkSynthetic(), [30, 30, 32], 9);
    const r = fillBlob(k, [0.5, 0.5], [4, 4, 5], { grow: 2, sigma: 1 });
    expect(r.pixels).toBe(144);
    const px = (x: number, y: number) => [0, 1, 2].map((c) => k.data[(y * 40 + x) * 4 + c]);
    expect(px(20, 20)).toEqual([4, 4, 5]);
    expect(px(27, 20)).toEqual([210, 40, 30]);
    const hb = hexBounds(k, 0.5, 0.5);
    expect(hb.left).toBeGreaterThanOrEqual(7);
    expect(hb.left).toBeLessThanOrEqual(9);
    expect(hb.right).toBeGreaterThanOrEqual(31);
    expect(hb.right).toBeLessThanOrEqual(33);
  });
});

describe('Logodaki zar modeli (Görev L5)', () => {
  const m = logo.acilis.dieModel;
  it('9 görünen köşe ölçüldü; silüet altıgen (dikey yanlar), 20 yüzü ortada', () => {
    const v = m.vertices as Record<string, number[]>;
    expect(Object.keys(v).sort()).toEqual(['B', 'Fa', 'Fl', 'Fr', 'LL', 'LR', 'T', 'UL', 'UR']);
    expect(Math.abs(v.UL![0]! - v.LL![0]!)).toBeLessThan(0.004);
    expect(Math.abs(v.UR![0]! - v.LR![0]!)).toBeLessThan(0.004);
    expect(Math.abs(v.T![0]! - 0.5)).toBeLessThan(0.004);
    expect(Math.abs(v.B![0]! - 0.5)).toBeLessThan(0.004);
    expect(Math.abs((v.Fl![0]! + v.Fr![0]!) / 2 - v.Fa![0]!)).toBeLessThan(0.004);
    expect(v.Fa![1]).toBeLessThan(v.Fl![1]!);
  });
  it('10 yüzün rengi ve rakamı (yer, açı, boy); üst yüzler açık, alt yüzler koyu', () => {
    const f = m.faces as Record<string, { top: string; bottom: string; rim: string; number: { c: number[]; heightPx: number; angle: number } }>;
    expect(Object.keys(f).map(Number).sort((a, b) => a - b)).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
    const lum = (h: string) => (parseInt(h.slice(1, 3), 16) + parseInt(h.slice(3, 5), 16) + parseInt(h.slice(5, 7), 16)) / 3;
    expect(lum(f['18']!.top)).toBeGreaterThan(lum(f['6']!.top));
    expect(f['20']!.number.heightPx).toBeGreaterThan(f['4']!.number.heightPx);
    expect(f['20']!.number.angle).toBe(0);
    expect(f['14']!.number.angle).toBeGreaterThan(0);
    expect(f['12']!.number.angle).toBeLessThan(-45);
    for (const x of Object.values(f)) expect(x.number.heightPx).toBeGreaterThan(30);
  });
});

describe('Kanat maskesi ve uçları (saf, Görev L4)', () => {
  it('kırmızı ve ona yakın koyu (kontur) kanat; uzak siyah ve gri değil; en büyük parça; kök ve uç', () => {
    const w = 30, h = 10;
    const data = new Uint8Array(w * h * 4);
    const set = (x: number, y: number, rgb: [number, number, number]) => data.set([...rgb, 255], (y * w + x) * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set(x, y, [2, 2, 2]); // siyah zemin (opak)
    for (let y = 3; y < 7; y++) for (let x = 2; x < 20; x++) set(x, y, [210, 60, 30]); // kanat
    for (let x = 2; x < 20; x++) set(x, 7, [5, 5, 5]); // alt kontur (koyu, kanada bitişik)
    set(27, 1, [200, 50, 20]); // kopuk kırıntı
    for (let y = 0; y < h; y++) set(24, y, [150, 150, 155]); // gri çerçeve
    const img: Raw = { data, width: w, height: h, channels: 4 };
    const m = largestComponent(wingMask(img, () => true, 2), w, h);
    const at = (x: number, y: number) => m[y * w + x];
    expect(at(10, 5)).toBe(1);
    expect(at(10, 7)).toBe(1); // kontur kanatla
    expect(at(10, 0)).toBe(0); // kanattan uzak siyah
    expect(at(24, 5)).toBe(0); // gri
    expect(at(27, 1)).toBe(0); // kırıntı atıldı
    const e = wingEnds(m, w, h, 'sol')!;
    expect(Math.round(e.root.x)).toBeGreaterThanOrEqual(19);
    expect(e.tip.x).toBeLessThanOrEqual(3);
  });
});

describe('Kapalı ↔ açık kanatlı logo hizalaması (data/logo.json, Görev L3)', () => {
  const c = logo.acilis.closed;
  const al = c.align;
  it('altıgenin dış sınırı iki görüntüde aynı piksele gelir (x ve y ayrı ölçek, fark ≤ %2,5)', () => {
    const map = (px: number, py: number) => [(px - al.hexClosed.left) * al.scale.x + al.hexWide.left, (py - al.hexClosed.top) * al.scale.y + al.hexWide.top];
    const [l, t] = map(al.hexClosed.left, al.hexClosed.top), [r, b] = map(al.hexClosed.right, al.hexClosed.bottom);
    expect(Math.abs(l! - al.hexWide.left)).toBeLessThan(1.5);
    expect(Math.abs(r! - al.hexWide.right)).toBeLessThan(1.5);
    expect(Math.abs(t! - al.hexWide.top)).toBeLessThan(1.5);
    expect(Math.abs(b! - al.hexWide.bottom)).toBeLessThan(1.5);
    expect(Math.abs(al.scale.x / al.scale.y - 1)).toBeLessThan(0.025);
    // Zarlı ve zarsız kare logo aynı kompozisyon (altıgen ±1 px).
    expect(Math.abs(al.hexClosedRef.left - al.hexClosed.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(al.hexClosedRef.top - al.hexClosed.top)).toBeLessThanOrEqual(1);
  });
  it('zar kutusu iki görüntüde ±12 px (geniş logo, 2624 px tuval) içinde örtüşür', () => {
    for (const k of ['x0', 'y0', 'x1', 'y1'] as const) expect(Math.abs(al.dieClosed[k] - al.dieWide[k])).toBeLessThanOrEqual(12);
  });
  it('Görev L5: elle bulunan göz noktaları (data/acilis-ekrani.json): geniş logoda başın üstünde, kapalıda aynı kutuda', () => {
    const e = acilisEkrani.eyes;
    // Geniş: koyu badem göz yarığının ağırlık merkezi; otomatik "en parlak turuncu" nokta (parıltı) bunun sağ üstündeydi.
    expect(e.wide).toEqual({ x: 0.5288, y: 0.2227 });
    expect(logo.acilis.eye.x - e.wide.x).toBeGreaterThan(0.005);
    expect(e.wide.y - logo.acilis.eye.y).toBeGreaterThan(0.01);
    expect(e.closed).toEqual({ x: 0.548, y: 0.2389 });
  });
  it('göz: iki çizimde ejderhanın başı farklı; fark sahnede ≤ %4 (ışık kapalıdakinden çıkıp geniştekine kayar)', () => {
    expect(al.eyeClosed).not.toBe(null);
    expect(Math.abs(al.eyeClosed!.x - al.eyeWide!.x)).toBeLessThan(0.04);
    expect(Math.abs(al.eyeClosed!.y - al.eyeWide!.y)).toBeLessThan(0.04);
  });
  it('kanat katlanması (Görev L4): açık kanadın kökü gövdede (zarın üst köşesi), ucu dışta; katlı pozda kapalı kanada oturur', () => {
    for (const s of ['sol', 'sag'] as const) {
      const f = logo.acilis.fold[`kanat-${s}`];
      // Kök: altıgenin içinde, zarın üst köşesinin yanında (gövdeye en yakın uç).
      expect(Math.abs(f.root.x - 0.5)).toBeLessThan(0.07);
      expect(f.root.y).toBeGreaterThan(0.25);
      expect(f.root.y).toBeLessThan(0.36);
      // Uç: tuvalin kenarında.
      expect(Math.abs(f.tip.x - 0.5)).toBeGreaterThan(0.43);
      // Katlı poz: kapalı kanat yaklaşık yarı boyda, gövdeye ≈70° yatık; kökler ±%4 içinde.
      expect(f.scale).toBeGreaterThan(0.35);
      expect(f.scale).toBeLessThan(0.55);
      expect(Math.abs(f.rotate)).toBeGreaterThan(50);
      expect(Math.abs(f.rotate)).toBeLessThan(90);
      expect(Math.sign(f.rotate)).toBe(s === 'sol' ? -1 : 1);
      expect(Math.hypot(f.dx, f.dy)).toBeLessThan(0.05);
    }
  });
  it('kapalı logo gövde ve kanat olarak ayrıldı (kanatlar solunca altıgenin içi görünür)', () => {
    expect(logo.acilis.closed.body.file).toBe('public/logo/acilis-kapali-govde.webp');
    expect(logo.acilis.closed.wings.file).toBe('public/logo/acilis-kapali-kanat.webp');
    expect(logo.acilis.closed.wingEnds.sol).not.toBe(null);
    expect(logo.acilis.closed.wingEnds.sag).not.toBe(null);
  });
  it('kapalı katman: dosya, leke dolduruldu (iç siyah), zemin anahtarlandı', () => {
    expect(c.file).toBe('assets-ham/logo/uretilen/acilis-kapali.webp');
    expect(c.blob.pixels).toBeGreaterThan(200000);
    expect(Math.max(...c.fill)).toBeLessThan(18);
    expect(c.box.w).toBeGreaterThan(0.4);
    expect(c.box.w).toBeLessThan(0.5);
  });
});

const files = (dir: string) => new Set(Object.keys(import.meta.glob('/public/**/*.{webp,png,ico}')).filter((f) => f.startsWith(dir)).map((f) => f.replace('/public/', '')));

describe('Üretilen logolar (data/logo.json, npm run logo)', () => {
  it('iki şeffaf logo: boyut, saydam köşe, hale yok; harf boşlukları yalnızca yazılı sürümde', () => {
    const o = logo.outputs as Record<string, { file: string; width: number; height: number }>;
    expect(o.acilis).toMatchObject({ file: 'public/logo/logo-acilis.webp', width: 1800 }); // Görev K2b: 2x masaüstü (900 px sahne) için 1400 → 1800
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
    expect(files('/public/logo')).toEqual(new Set(['logo/logo-acilis.webp', 'logo/logo-masaustu.webp', 'logo/acilis-kanat-sol.webp', 'logo/acilis-kanat-sag.webp', 'logo/acilis-govde.webp', 'logo/acilis-yazi.webp', 'logo/acilis-kapali-govde.webp', 'logo/acilis-kapali-kanat.webp']));
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
    // Görev M1: ad "Dice & Hex" (APP_NAME; Görev N1), "&" vurgu renginde ayrı span; erişilebilir ad tam ad.
    expect(html).toContain('class="brand-title" lang="en" aria-label="Dice &amp; Hex">Dice <span class="amp">&amp;</span> Hex</h1>');
    expect(html).not.toContain('logo-mobil');
    expect(html).not.toContain('RPG Battle');
  });
});
