/**
 * Dungeondex "Kitap" kabuğunun görsel ölçümü (Görev DD-Kitap; `scripts/dungeondex-kitap.ts`, `npm run dd-kitap`). Saf:
 * ham RGBA tamponları üstünde çalışır, sharp ya da DOM bilmez; testler sentetik tamponlarla sınar (görsel dosyası
 * testlere girmez). Şeffaflaştırma logo hattıyla aynı (`src/ui/logoKey.ts` `keyWhite`, zemin yüklemi macenta) + kenar
 * pikselinde macenta yayılması temizliği (`despill`) + saydam kenar kırpma (`cropToAlpha`).
 *
 * Ölçüm: koyu iç alan (vitrin, altıgen pencere) ve krem alan (sayfa) yüklem maskesinin bağlı bileşenleri (4-komşuluk);
 * isim şeritleri geniş (en/boy ≥ `seritOran`) koyu ya da krem bileşen; toka taşı sağ bölgede kor rengi bileşenin
 * ağırlık merkezi; altıgen köşeleri pencere bileşeninin altı yöndeki uç noktaları (sivri ya da düz tepeli; alanı büyük
 * olan yönelim). Sonuçlar görselin 0–1 oranı.
 */
import { keyWhite, type Raw } from '../../ui/logoKey';

export interface Box { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }
export interface Comp { id: number; n: number; x0: number; y0: number; x1: number; y1: number; cx: number; cy: number }

/** Ölçüm eşikleri (`data/dungeondex-kitap.json` `yontem` ile ezilebilir). */
export interface MeasureOpts {
  /** Koyu alan: kanalların en büyüğü ≤ bu ve kanal farkı ≤ `koyuFark`. Vitrin #101418–#121418. */
  koyuMax: number; koyuFark: number;
  /** Krem: parlaklık ≥ bu, R ≥ G ≥ B, R − B aralığı. Krem #EBD9C3. */
  kremLum: number; kremRB: [number, number];
  /** İsim şeridi en/boy oranı alt sınırı. */
  seritOran: number;
  /** Bileşen alt sınırı (görsel alanının oranı). */
  enAz: number;
  /** Güvenli alan: sayfa kenarından içeri (görsel boyutunun oranı). */
  guvenliPay: number;
}
export const MEASURE_DEFAULTS: MeasureOpts = { koyuMax: 40, koyuFark: 16, kremLum: 150, kremRB: [10, 100], seritOran: 2.5, enAz: 0.002, guvenliPay: 0.02 };

const r4 = (v: number) => Math.round(v * 10000) / 10000;

/** Macenta zemin (#FF00FF ve JPEG sapması). */
export const nearMagenta = (d: Raw['data'], i: number): boolean => d[i]! >= 170 && d[i + 2]! >= 170 && d[i + 1]! <= 100 && Math.abs(d[i]! - d[i + 2]!) <= 70;

/**
 * Macenta yayılması temizliği: saydam bölgeye `px` piksel yakın ön plan piksellerinde min(R, B) − G fazlası R ve B'den
 * düşülür (kenardaki pembe hale). Kor ve bakır tonları (B düşük) değişmez.
 */
export function despill(img: Raw, px = 3): number {
  const { data, width: w, height: h } = img;
  let dist = new Uint8Array(w * h).fill(255);
  for (let p = 0; p < w * h; p++) if (data[p * 4 + 3]! < 250) dist[p] = 0;
  for (let k = 0; k < px; k++) {
    const next = dist.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (dist[p]! <= k) continue;
      if ((x > 0 && dist[p - 1] === k) || (x < w - 1 && dist[p + 1] === k) || (y > 0 && dist[p - w] === k) || (y < h - 1 && dist[p + w] === k)) next[p] = k + 1;
    }
    dist = next;
  }
  let changed = 0;
  for (let p = 0; p < w * h; p++) {
    if (dist[p]! > px || data[p * 4 + 3] === 0) continue;
    const r = data[p * 4]!, g = data[p * 4 + 1]!, b = data[p * 4 + 2]!;
    const ex = Math.min(r, b) - g;
    if (ex <= 0) continue;
    data[p * 4] = r - ex; data[p * 4 + 2] = b - ex; changed++;
  }
  return changed;
}

/** Saydam kenarları kırpar (alfa > `min` olan içeriğin kutusu, `pad` piksel pay). */
export function cropToAlpha(img: Raw, min = 8, pad = 1): Raw {
  const { data, width: w, height: h } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * 4 + 3]! <= min) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0) return img;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const out = new Uint8Array(cw * ch * 4);
  for (let y = 0; y < ch; y++) out.set(data.subarray(((y0 + y) * w + x0) * 4, ((y0 + y) * w + x1 + 1) * 4), y * cw * 4);
  return { data: out, width: cw, height: ch, channels: 4 };
}

/** Macenta zeminli RGB → RGBA: zemin saydam (logo hattı), kenar temizliği, saydam kenar kırpma. */
export function keyMagenta(img: Raw): Raw {
  const keyed = keyWhite(img, { isBg: nearMagenta });
  despill(keyed);
  return cropToAlpha(keyed);
}

/** Yüklem maskesinin bağlı bileşenleri (4-komşuluk); `labels` piksel → bileşen kimliği (0 = yok). */
export function components(mask: Uint8Array, w: number, h: number, minPx = 1): { comps: Comp[]; labels: Int32Array } {
  const labels = new Int32Array(w * h);
  const comps: Comp[] = [];
  const stack: number[] = [];
  let id = 0;
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || labels[s]) continue;
    id++;
    let n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1, sx = 0, sy = 0;
    labels[s] = id; stack.push(s);
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % w, y = (p - x) / w;
      n++; sx += x; sy += y;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of nb) if (q >= 0 && mask[q] && !labels[q]) { labels[q] = id; stack.push(q); }
    }
    if (n >= minPx) comps.push({ id, n, x0, y0, x1, y1, cx: sx / n, cy: sy / n });
  }
  return { comps, labels };
}

type Pred = (r: number, g: number, b: number) => boolean;
function maskOf(img: Raw, pred: Pred): Uint8Array {
  const { data, width: w, height: h } = img;
  const m = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) if (data[p * 4 + 3]! > 200 && pred(data[p * 4]!, data[p * 4 + 1]!, data[p * 4 + 2]!)) m[p] = 1;
  return m;
}
const darkPred = (o: MeasureOpts): Pred => (r, g, b) => Math.max(r, g, b) <= o.koyuMax && Math.max(r, g, b) - Math.min(r, g, b) <= o.koyuFark;
const creamPred = (o: MeasureOpts): Pred => (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) >= o.kremLum && r >= g && g + 6 >= b && r - b >= o.kremRB[0] && r - b <= o.kremRB[1];
const emberPred: Pred = (r, g, b) => r >= 170 && r - g >= 60 && b <= 110;

const boxOf = (c: Comp, w: number, h: number): Box => ({ x: r4(c.x0 / w), y: r4(c.y0 / h), w: r4((c.x1 - c.x0 + 1) / w), h: r4((c.y1 - c.y0 + 1) / h) });
const aspectOf = (c: Comp) => (c.x1 - c.x0 + 1) / (c.y1 - c.y0 + 1);
const overlapX = (a: Comp, b: Comp) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) + 1) / Math.min(a.x1 - a.x0 + 1, b.x1 - b.x0 + 1);
const largest = (cs: Comp[]) => cs.reduce<Comp | null>((a, c) => (!a || c.n > a.n ? c : a), null);

function compsOf(img: Raw, pred: Pred, o: MeasureOpts) {
  const { width: w, height: h } = img;
  return components(maskOf(img, pred), w, h, Math.max(4, Math.round(w * h * o.enAz)));
}

/** İsim şeridi adayları: koyu ya da krem, geniş bileşen. */
function stripCands(img: Raw, o: MeasureOpts): Comp[] {
  return [...compsOf(img, darkPred(o), o).comps, ...compsOf(img, creamPred(o), o).comps].filter((c) => aspectOf(c) >= o.seritOran);
}

/** Altıgen köşeleri: merkezden altı yönde en uzak pikseller; sivri (90°) ve düz (0°) tepeli yönelimden alanı büyük olan. */
export function hexCorners(labels: Int32Array, id: number, w: number, h: number, c: Comp): Pt[] {
  const sets = [0, 30].map((start) => {
    const dirs = Array.from({ length: 6 }, (_, i) => ((start + 60 * i) * Math.PI) / 180).map((a) => [Math.cos(a), Math.sin(a)] as const);
    const best = dirs.map(() => ({ v: -Infinity, x: 0, y: 0 }));
    for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) {
      if (labels[y * w + x] !== id) continue;
      const dx = x - c.cx, dy = y - c.cy;
      dirs.forEach(([ux, uy], i) => { const v = dx * ux + dy * uy; if (v > best[i]!.v) best[i] = { v, x, y }; });
    }
    const pts = best.map((b) => ({ x: b.x, y: b.y }));
    let area = 0;
    for (let i = 0; i < 6; i++) { const a = pts[i]!, b = pts[(i + 1) % 6]!; area += a.x * b.y - b.x * a.y; }
    return { pts, area: Math.abs(area) / 2 };
  });
  const pick = sets[0]!.area >= sets[1]!.area ? sets[0]! : sets[1]!;
  // Saat yönünde, en üstteki köşeden başlayarak.
  const pts = pick.pts.map((p) => ({ x: r4((p.x + 0.5) / w), y: r4((p.y + 0.5) / h) }));
  const ang = (p: Pt) => Math.atan2(p.y - (c.cy + 0.5) / h, p.x - (c.cx + 0.5) / w);
  pts.sort((a, b) => ang(a) - ang(b));
  const top = pts.reduce((m, p, i) => (p.y < pts[m]!.y ? i : m), 0);
  return [...pts.slice(top), ...pts.slice(0, top)];
}

export interface CoverMeasure { pencere: Box; altigen: Pt[]; ustSerit: Box | null; altSerit: Box | null; toka: Pt | null }
export interface SpreadMeasure { vitrin: Box; serit: Box | null; sayfa: Box; guvenli: Box; mentese?: Box | null }

/** Kapak: ortadaki koyu altıgen pencere, üst/alt isim şeridi, sağdaki kor taş. */
export function measureCover(img: Raw, opts: Partial<MeasureOpts> = {}): CoverMeasure | null {
  const o = { ...MEASURE_DEFAULTS, ...opts };
  const { width: w, height: h } = img;
  const { comps, labels } = compsOf(img, darkPred(o), o);
  const inCenter = comps.filter((c) => c.x0 <= w / 2 && c.x1 >= w / 2 && c.y0 <= h / 2 && c.y1 >= h / 2 && aspectOf(c) < o.seritOran);
  const win = largest(inCenter) ?? largest(comps.filter((c) => Math.abs(c.cx / w - 0.5) < 0.2 && Math.abs(c.cy / h - 0.5) < 0.2 && aspectOf(c) < o.seritOran));
  if (!win) return null;
  const strips = stripCands(img, o).filter((c) => c.id !== win.id && (c.x1 - c.x0 + 1) >= w * 0.2 && c.cx / w > 0.25 && c.cx / w < 0.75);
  const above = strips.filter((c) => c.y1 <= win.y0 + 2).sort((a, b) => b.y1 - a.y1)[0];
  const below = strips.filter((c) => c.y0 >= win.y1 - 2).sort((a, b) => a.y0 - b.y0)[0];
  const ember = components(maskOf(img, emberPred), w, h, Math.max(4, Math.round(w * h * 0.0002))).comps.filter((c) => c.cx / w >= 0.62);
  const stone = largest(ember);
  return {
    pencere: boxOf(win, w, h), altigen: hexCorners(labels, win.id, w, h, win),
    ustSerit: above ? boxOf(above, w, h) : null, altSerit: below ? boxOf(below, w, h) : null,
    toka: stone ? { x: r4((stone.cx + 0.5) / w), y: r4((stone.cy + 0.5) / h) } : null,
  };
}

const inset = (b: Box, px: number, py: number): Box => ({ x: r4(b.x + px), y: r4(b.y + py), w: r4(b.w - 2 * px), h: r4(b.h - 2 * py) });

/** Geniş çift sayfa: sol koyu vitrin, altında isim şeridi, sağ krem sayfa (+ güvenli alan). */
export function measureSpread(img: Raw, opts: Partial<MeasureOpts> = {}): SpreadMeasure | null {
  const o = { ...MEASURE_DEFAULTS, ...opts };
  const { width: w, height: h } = img;
  const vit = largest(compsOf(img, darkPred(o), o).comps.filter((c) => c.cx < w / 2 && aspectOf(c) < o.seritOran));
  const page = largest(compsOf(img, creamPred(o), o).comps.filter((c) => c.cx > w / 2));
  if (!vit || !page) return null;
  const strip = stripCands(img, o).filter((c) => c.y0 >= vit.y1 - 2 && c.y0 - vit.y1 < h * 0.2 && overlapX(c, vit) >= 0.5).sort((a, b) => a.y0 - b.y0)[0];
  const sayfa = boxOf(page, w, h);
  return { vitrin: boxOf(vit, w, h), serit: strip ? boxOf(strip, w, h) : null, sayfa, guvenli: inset(sayfa, o.guvenliPay, o.guvenliPay) };
}

/** Mobil (dikey): üstte vitrin + isim şeridi, ortada menteşe bandı, altta krem sayfa. */
export function measureMobile(img: Raw, opts: Partial<MeasureOpts> = {}): SpreadMeasure | null {
  const o = { ...MEASURE_DEFAULTS, ...opts };
  const { width: w, height: h } = img;
  const vit = largest(compsOf(img, darkPred(o), o).comps.filter((c) => c.cy < h / 2 && aspectOf(c) < o.seritOran));
  if (!vit) return null;
  const page = largest(compsOf(img, creamPred(o), o).comps.filter((c) => c.y0 >= vit.y1));
  if (!page) return null;
  const strip = stripCands(img, o).filter((c) => c.y0 >= vit.y1 - 2 && c.y1 <= page.y0 + 2 && overlapX(c, vit) >= 0.5).sort((a, b) => a.y0 - b.y0)[0];
  const top = (strip ?? vit).y1 + 1, bottom = page.y0 - 1;
  // Menteşe bandı: şerit (yoksa vitrin) ile sayfa arasındaki satırlar, opak içeriğin eni boyunca.
  let x0 = w, x1 = -1;
  for (let y = top; y <= bottom; y++) for (let x = 0; x < w; x++) if (img.data[(y * w + x) * 4 + 3]! > 200) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
  const mentese = bottom > top && x1 >= x0 ? { x: r4(x0 / w), y: r4(top / h), w: r4((x1 - x0 + 1) / w), h: r4((bottom - top + 1) / h) } : null;
  const sayfa = boxOf(page, w, h);
  return { vitrin: boxOf(vit, w, h), serit: strip ? boxOf(strip, w, h) : null, sayfa, guvenli: inset(sayfa, o.guvenliPay, o.guvenliPay), mentese };
}

// --- Doğrulama (test ve betik raporu) ---
const inside = (b: Box) => b.x >= 0 && b.y >= 0 && b.w > 0 && b.h > 0 && b.x + b.w <= 1.0001 && b.y + b.h <= 1.0001;
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w - 1e-4 && b.x < a.x + a.w - 1e-4 && a.y < b.y + b.h - 1e-4 && b.y < a.y + a.h - 1e-4;
const contains = (o: Box, i: Box) => i.x >= o.x - 1e-4 && i.y >= o.y - 1e-4 && i.x + i.w <= o.x + o.w + 1e-4 && i.y + i.h <= o.y + o.h + 1e-4;

/** Ölçüm sonucunun sorunları (boşsa geçerli): kutular görselde, çakışmıyor, oranlar makul. `aspect` görselin en/boyu. */
export function coverProblems(m: CoverMeasure, aspect: number): string[] {
  const out: string[] = [];
  const boxes: Array<[string, Box | null]> = [['pencere', m.pencere], ['ustSerit', m.ustSerit], ['altSerit', m.altSerit]];
  for (const [k, b] of boxes) if (b && !inside(b)) out.push(`${k} görselin dışında`);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i]![1], b = boxes[j]![1];
    if (a && b && overlaps(a, b)) out.push(`${boxes[i]![0]} ile ${boxes[j]![0]} çakışıyor`);
  }
  const winAr = (m.pencere.w * aspect) / m.pencere.h;
  if (winAr < 0.6 || winAr > 1.6) out.push(`pencere oranı ${winAr.toFixed(2)}`);
  if (m.pencere.w < 0.15 || m.pencere.w > 0.9) out.push('pencere eni');
  if (m.altigen.length !== 6) out.push('altıgen köşe sayısı');
  for (const p of m.altigen) if (!contains({ ...m.pencere }, { x: p.x, y: p.y, w: 0, h: 0 })) out.push('köşe pencere dışında');
  for (const [k, b] of [['ustSerit', m.ustSerit], ['altSerit', m.altSerit]] as const) if (b && (b.w * aspect) / b.h < 2) out.push(`${k} şerit değil`);
  if (m.ustSerit && m.ustSerit.y + m.ustSerit.h > m.pencere.y + 1e-4) out.push('üst şerit pencerenin altında');
  if (m.altSerit && m.altSerit.y < m.pencere.y + m.pencere.h - 1e-4) out.push('alt şerit pencerenin üstünde');
  if (m.toka && (m.toka.x < 0.5 || m.toka.x > 1 || m.toka.y < 0 || m.toka.y > 1)) out.push('toka sağda değil');
  return out;
}

export function spreadProblems(m: SpreadMeasure, aspect: number, kind: 'genis' | 'mobil'): string[] {
  const out: string[] = [];
  const boxes: Array<[string, Box | null | undefined]> = [['vitrin', m.vitrin], ['serit', m.serit], ['sayfa', m.sayfa], ['mentese', m.mentese]];
  for (const [k, b] of boxes) if (b && !inside(b)) out.push(`${k} görselin dışında`);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i]![1], b = boxes[j]![1];
    if (a && b && overlaps(a, b)) out.push(`${boxes[i]![0]} ile ${boxes[j]![0]} çakışıyor`);
  }
  if (!contains(m.sayfa, m.guvenli)) out.push('güvenli alan sayfanın dışında');
  if (m.vitrin.w * m.vitrin.h < 0.04) out.push('vitrin çok küçük');
  if (m.sayfa.w * m.sayfa.h < 0.1) out.push('sayfa çok küçük');
  if (m.serit && (m.serit.w * aspect) / m.serit.h < 2) out.push('şerit değil');
  if (m.serit && m.serit.y < m.vitrin.y + m.vitrin.h - 1e-4) out.push('şerit vitrinin altında değil');
  if (kind === 'genis' && m.sayfa.x < m.vitrin.x + m.vitrin.w - 1e-4) out.push('sayfa vitrinin sağında değil');
  if (kind === 'mobil' && m.sayfa.y < m.vitrin.y + m.vitrin.h - 1e-4) out.push('sayfa vitrinin altında değil');
  return out;
}
