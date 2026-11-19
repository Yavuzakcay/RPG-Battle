/**
 * KW2 (yalnız görünüm; kural sürümü değişmez): Dragonborn kanadının iki ek katmanı. Taban görsel (kol ve ön kenar kemiği: soy renginde) üstüne
 * `zar` (kanat zarı: soy rengi + pembe karışımı) ve `pence` (pençe uçları: boynuz beyazı) saydam katmanları çizilir (`public/kanat/dragonborn-zar.webp`,
 * `dragonborn-pence.webp`, üretici `scripts/dragonborn-kanat-katman.py`; paletler `scripts/dragonborn-kanat-palet.ts`). `katmanlar.zar.etkin: false`
 * karışımsız hal (karşılaştırma); pençe iki halde de beyaz.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import { AvatarBadge, TokenFigure } from './Avatar';
import { LookFrame } from './LookFrame';
import { lineageLook, wingFilterId, wingParts, type WingSlotData } from './lineageLook';
import { deltaE, rgbToLab } from './color';
import kanat from '../../data/kanat-esleme.json';

const SLOT = kanat.slotlar.dragonborn as unknown as WingSlotData & { pembe: { L: number; a: number; b: number; ab: number; aciklik: number } };
const SOY = ['black', 'blue', 'brass', 'bronze', 'copper', 'gold', 'green', 'red', 'silver', 'white'];
const look = (lineageId = 'gold') => ({ raceId: 'dragonborn', lineageId, level: 5 });
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Katman görselinin alfa ağırlıklı parlaklık histogramı + alfa kanalı. */
async function layer(file: string) {
  const { data, info } = await sharp(`public/kanat/${file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const hist = new Array<number>(256).fill(0), alpha = new Uint8Array(info.width * info.height);
  for (let p = 0; p < info.width * info.height; p++) { hist[data[p * 4]!]! += data[p * 4 + 3]! / 255; alpha[p] = data[p * 4 + 3]!; }
  return { hist, alpha, w: info.width, h: info.height };
}
/** Histogramın palet (golge→isik, eşikli) altındaki Lab ortalaması. */
function meanLab(hist: number[], p: { golge: string; isik: string; esik?: number }): [number, number, number] {
  const lo = hexRgb(p.golge), hi = hexRgb(p.isik), e = p.esik ?? 0;
  let n = 0, L = 0, a = 0, b = 0;
  hist.forEach((c, v) => {
    if (!c) return;
    const t = Math.max(0, Math.min(1, (v / 255 - e) / (1 - e)));
    const [l, aa, bb] = rgbToLab(...(lo.map((x, i) => Math.round(x + (hi[i]! - x) * t)) as [number, number, number]));
    n += c; L += l * c; a += aa * c; b += bb * c;
  });
  return [L / n, a / n, b / n];
}

describe('KW2 katman çözümü', () => {
  it('Dragonborn katmanları: önce zar (soya özgü pembe karışımlı palet), sonra pençe (tüm soylarda aynı boynuz beyazı paleti)', () => {
    const pence = new Set<string>();
    for (const soy of SOY) {
      const wing = lineageLook(look(soy), { ability: true }).wing!;
      expect(wing.katmanlar?.map((k) => k.ad), soy).toEqual(['zar', 'pence']);
      expect(wing.katmanlar![0]!.src).toBe('kanat/dragonborn-zar.webp'); expect(wing.katmanlar![1]!.src).toBe('kanat/dragonborn-pence.webp');
      expect(wingFilterId(wing.katmanlar![0]!.palet), soy).not.toBe(wingFilterId(wing.palet!)); // zar taban paletinden farklı
      pence.add(wingFilterId(wing.katmanlar![1]!.palet));
    }
    expect(pence.size).toBe(1);
  });
  it('karışımsız hal (zar.etkin: false): yalnız pençe katmanı (pençe iki halde de beyaz); katmansız slot (Tiefling) katman almaz', () => {
    const kapali: WingSlotData = { ...SLOT, katmanlar: { ...SLOT.katmanlar!, zar: { dosya: 'dragonborn-zar.webp', etkin: false } } };
    expect(wingParts(kapali, 'kanat', 'gold').map((k) => k.ad)).toEqual(['pence']);
    expect(wingParts(SLOT, 'kanat', 'gold').map((k) => k.ad)).toEqual(['zar', 'pence']);
    expect(wingParts({ ...SLOT, katmanlar: undefined }, 'kanat', 'gold')).toEqual([]);
    expect(wingParts(SLOT, 'kanat', 'bilinmeyen-soy').map((k) => k.ad)).toEqual(['pence']); // soy paleti yoksa zar yok, pençe var
    expect(lineageLook({ raceId: 'tiefling', lineageId: 'winged' }, { flying: true }).wing!.katmanlar).toBeUndefined();
  });
});

describe('KW2 çizim: taban → zar → pençe, her kanatta aynı kutu ve dönüş', () => {
  const svg = renderToStaticMarkup(<svg><TokenFigure href="x.webp" cx={50} cy={50} w={40} look={look()} flying /></svg>);
  it('savaş jetonu (SVG): her kanat grubunda sırayla taban, zar, pençe; ikisi de figürden önce', () => {
    expect(svg.match(/data-wing="dragonborn"/g)).toHaveLength(2); // grup başına bir
    expect(svg.match(/data-part="zar"/g)).toHaveLength(2); expect(svg.match(/data-part="pence"/g)).toHaveLength(2);
    for (const side of ['sag', 'sol']) {
      const g = svg.slice(svg.indexOf(`data-side="${side}"`));
      const a = g.indexOf('kanat/dragonborn.webp'), b = g.indexOf('kanat/dragonborn-zar.webp'), c = g.indexOf('kanat/dragonborn-pence.webp');
      expect(a, side).toBeGreaterThan(-1); expect(a, side).toBeLessThan(b); expect(b, side).toBeLessThan(c);
    }
    expect(svg.lastIndexOf('kanat/dragonborn-pence.webp')).toBeLessThan(svg.indexOf('x.webp'));
    expect(svg.match(/<image /g)).toHaveLength(7); // 2 kanat × 3 katman + figür
  });
  it('filtreler: zar ve pençe katmanları kendi paletleriyle, hepsi tanımlı', () => {
    const wing = lineageLook(look(), { flying: true }).wing!;
    for (const p of [wing.palet!, ...wing.katmanlar!.map((k) => k.palet)]) expect(svg).toContain(`id="${wingFilterId(p)}"`);
    expect(svg).toContain(`url(#${wingFilterId(wing.katmanlar![1]!.palet)})`);
  });
  it('rozet (LookFrame içinde): üç katman da rozetin içinde, figürden önce', () => {
    const a = { src: 'characters/dragonborn-erkek-fighter-ID12.webp', bg: '#a44030', label: 'F', look: look() };
    const h = renderToStaticMarkup(<LookFrame sheet={look()} size={96} ability><AvatarBadge avatar={a} size={96} /></LookFrame>);
    expect(h.match(/data-part="pence"/g)).toHaveLength(2);
    expect(h.lastIndexOf('dragonborn-pence.webp')).toBeLessThan(h.indexOf('<img'));
  });
});

describe('KW2 katman görselleri', () => {
  it('zar ve pençe taban görselle aynı boyutta; pençe yalnız iki üst çıkıntıda (büyük kanca + küçük pençe), zar pençeye boya vermez', async () => {
    const base = await layer('dragonborn.webp'), zar = await layer('dragonborn-zar.webp'), pence = await layer('dragonborn-pence.webp');
    expect([zar.w, zar.h, pence.w, pence.h]).toEqual([base.w, base.h, base.w, base.h]);
    let c1 = 0, c2 = 0, diger = 0, zarPencede = 0;
    for (let y = 0; y < base.h; y++) for (let x = 0; x < base.w; x++) {
      const i = y * base.w + x;
      if (pence.alpha[i]! > 128) {
        if (x >= 120 && x <= 170 && y <= 28) c1++; else if (x >= 250 && x <= 290 && y <= 40) c2++; else diger++;
        if (zar.alpha[i]! > 8) zarPencede++;
      }
    }
    expect(c1).toBeGreaterThan(300); expect(c2).toBeGreaterThan(60); expect(diger).toBe(0); expect(zarPencede).toBe(0);
    // zar büyük bölge (kanat zarı), çerçeve (kol, ön kenar) dışarıda: taban alfasının %70–90'ı
    const nb = base.alpha.filter((v) => v > 128).length, nz = zar.alpha.filter((v) => v > 128).length;
    expect(nz / nb).toBeGreaterThan(0.7); expect(nz / nb).toBeLessThan(0.92);
  });
});

describe('KW2 paletler', () => {
  it('pençe boynuz beyazı: ortalama açıklık 80,4 ± 3 (jetonların boyanmamış boynuz pikselleri), nötr-sıcak (kroma < 6)', async () => {
    const [L, a, b] = meanLab((await layer('dragonborn-pence.webp')).hist, SLOT.katmanlar!.pence!.palet);
    expect(Math.abs(L - 80.4)).toBeLessThan(3); expect(Math.hypot(a, b)).toBeLessThan(6); expect(b).toBeGreaterThan(0);
  });
  it('zar pembe karışımı: her soyda zar ortalaması pembeye taban paletten ≥ 5 (a*, b* düzleminde) yaklaşır, açıklık ≤ 10 oynar, belirgin kayar (ΔE ≥ 8); White ↔ Silver zar ΔE ≥ 12', async () => {
    const { hist } = await layer('dragonborn-zar.webp');
    const pembe = [SLOT.pembe.a, SLOT.pembe.b];
    const mix: Record<string, [number, number, number]> = {};
    for (const soy of SOY) {
      const p = SLOT.renkPaletleri![soy]!;
      const once = meanLab(hist, { golge: p.golge, isik: p.isik, ...(p.esik ? { esik: p.esik } : {}) }), sonra = meanLab(hist, p.zar!);
      mix[soy] = sonra;
      const uz = (x: number[]) => Math.hypot(x[1]! - pembe[0]!, x[2]! - pembe[1]!);
      expect(uz(once) - uz(sonra), `${soy} pembeye yaklaşma`).toBeGreaterThanOrEqual(5);
      expect(Math.abs(sonra[0] - once[0]), `${soy} açıklık`).toBeLessThanOrEqual(10);
      expect(deltaE(once, sonra), `${soy} kayma`).toBeGreaterThanOrEqual(8);
    }
    expect(deltaE(mix.white!, mix.silver!), 'White ↔ Silver zar').toBeGreaterThanOrEqual(12);
    expect(SLOT.pembe.ab).toBeGreaterThan(0); expect(SLOT.pembe.ab).toBeLessThan(1);
  });
});
