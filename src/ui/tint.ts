/**
 * Soy renkleri (Görev K8b, K15): jeton görselinin ten/pul piksellerini soyun rengine taşır. Saf piksel dönüşümü
 * (`tintPixels`) ve tarayıcıda görseli bir kez boyayıp önbelleğe alan yükleyici (`tintedUrl`). Yeni görsel
 * indirilmez (yalnızca küçük ten maskesi); boyalı görsel nesne URL'si olarak bellekte kalır.
 * - Eski yol (High Elf): `select` ton aralığındaki pikseller HSL hedefine (K8b).
 * - Maskeli yol (K15): yalnızca sprite'ın ten maskesi (`public/characters/maske/<ad>.png`, `npm run soy-maske`);
 *   LCh'de ton ve kroma kaydırılır, açıklık farkları korunur (`lch`) ya da açıklık gradyan haritasına eşlenir (`gradient`).
 */
import type { TintSpec } from '../battle/types';
import { labToRgb, rgbToLab } from './color';
import maskRapor from '../../data/soy-maske-rapor.json';
import basData from '../../data/soy-bas.json';
import { applyHeadOverlay, type Box } from './headOverlay';

/** Görev K22: jetonun kafa kaplaması (data/soy-bas.json; yoksa undefined). */
export const headEntry = (name: string): { box: Box; govdeBoya?: false } | undefined => (basData as unknown as { sprites: Record<string, { box: Box; govdeBoya?: false }> }).sprites[name];
const spriteName = (url: string) => url.match(/characters\/(?:kucuk\/)?([^/]+)\.webp$/)?.[1];
export const basUrlFor = (url: string): string | null => {
  const m = url.match(/^(.*\/)?characters\/(?:kucuk\/)?([^/]+)\.webp$/);
  return m && headEntry(m[2] as string) ? `${m[1] ?? ''}characters/bas/${m[2]}.png` : null;
};

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}

/** Maske gerektiren (K15) boyama mı. */
export const maskedTint = (t: TintSpec) => 'lch' in t.to || 'gradient' in t.to;

/**
 * RGBA piksel dizisini yerinde boyar; değişen piksel sayısını döndürür. `mask` (piksel başına 0/1) maskeli yolda
 * zorunlu; yoksa maskeli boyama hiçbir şeyi değiştirmez. Görev K21: `weights` (0–255, elle çizilmiş maskenin gri
 * değerleri) verilirse seçim ağırlığı 0'dan büyük pikseller ve sonuç ağırlıkla karıştırılır (255: tam boya);
 * verilmezse eski ikili yol (otomatik maske; sonuç bit bit aynı).
 */
export function tintPixels(data: Uint8ClampedArray, tint: TintSpec, mask?: Uint8Array, weights?: Uint8Array): number {
  const to = tint.to;
  if (weights) {
    const sel = new Uint8Array(weights.length);
    for (let p = 0; p < weights.length; p++) sel[p] = weights[p]! > 0 ? 1 : 0;
    const orig = new Uint8ClampedArray(data);
    const n = tintPixels(data, tint, sel);
    for (let p = 0; p < weights.length; p++) {
      const w = weights[p]!;
      if (w === 0 || w === 255) { if (w === 0) { const i = p * 4; data[i] = orig[i]!; data[i + 1] = orig[i + 1]!; data[i + 2] = orig[i + 2]!; } continue; }
      const i = p * 4;
      for (let k = 0; k < 3; k++) data[i + k] = Math.round(orig[i + k]! + ((data[i + k]! - orig[i + k]!) * w) / 255);
    }
    return n;
  }
  if ('lch' in to || 'gradient' in to) return mask ? maskedPixels(data, tint, mask) : 0;
  const { select: sel } = tint;
  // Aralık 360°'yi sarabilir (hMin > hMax; Gnome'un pembe teni).
  const wrap = sel.hMin > sel.hMax;
  const center = ((sel.hMin + sel.hMax + (wrap ? 360 : 0)) / 2) % 360;
  let changed = 0;
  for (let i = 0; i < data.length; i += 4) {
    if ((data[i + 3] ?? 0) < 10) continue;
    const [h, s, l] = rgbToHsl((data[i] ?? 0) / 255, (data[i + 1] ?? 0) / 255, (data[i + 2] ?? 0) / 255);
    const inHue = wrap ? h >= sel.hMin || h <= sel.hMax : h >= sel.hMin && h <= sel.hMax;
    if (!inHue || s < sel.sMin || l < sel.lMin || l > sel.lMax) continue;
    const dh = ((h - center + 540) % 360) - 180;
    const nh = to.h === null ? h : (((to.h + dh * 0.5) % 360) + 360) % 360;
    const [r, g, b] = hslToRgb(nh, Math.min(1, s * to.s), Math.max(0, Math.min(1, l * to.l)));
    data[i] = Math.round(r * 255); data[i + 1] = Math.round(g * 255); data[i + 2] = Math.round(b * 255);
    changed++;
  }
  return changed;
}

const deg = (a: number, b: number) => (Math.atan2(b, a) * 180) / Math.PI;

function maskedPixels(data: Uint8ClampedArray, tint: TintSpec, mask: Uint8Array): number {
  const idx: number[] = [];
  const labs: Array<[number, number, number]> = [];
  for (let p = 0; p < mask.length; p++) {
    const i = p * 4;
    if (!mask[p] || (data[i + 3] ?? 0) < 10) continue;
    idx.push(i); labs.push(rgbToLab(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0));
  }
  if (!idx.length) return 0;
  const to = tint.to;
  if ('gradient' in to) {
    const Ls = labs.map((l) => l[0]).sort((a, b) => a - b);
    const lo = Ls[Math.floor(Ls.length * 0.05)] ?? 0, hi = Ls[Math.floor(Ls.length * 0.95)] ?? 100;
    const stops = to.gradient;
    labs.forEach((l, k) => {
      const t = Math.max(0, Math.min(1, (l[0] - lo) / Math.max(1, hi - lo))) * (stops.length - 1);
      const j = Math.min(stops.length - 2, Math.floor(t)), u = t - j;
      const A = stops[j]!, B = stops[j + 1]!;
      const [r, g, b] = labToRgb(A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u);
      const i = idx[k]!; data[i] = r; data[i + 1] = g; data[i + 2] = b;
    });
    return idx.length;
  }
  if (!('lch' in to)) return 0;
  const { h, c, hueKeep = 0.3, chromaKeep = 0.5, gain = 1, dL = 0, contrast = 1 } = to.lch;
  // Ten ortalaması: kroma ve ton (dairesel ortalama, kromayla ağırlıklı).
  let sa = 0, sb = 0, sc = 0, sl = 0;
  for (const l of labs) { sa += l[1]; sb += l[2]; sc += Math.hypot(l[1], l[2]); sl += l[0]; }
  const mh = deg(sa, sb), mc = sc / labs.length, ml = sl / labs.length;
  labs.forEach((l, k) => {
    const C = Math.hypot(l[1], l[2]);
    const dh = ((deg(l[1], l[2]) - mh + 540) % 360) - 180;
    const nh = ((h + dh * hueKeep) * Math.PI) / 180;
    const nc = Math.max(0, c + (C - mc) * chromaKeep);
    // K19 `contrast`: açıklığın ten ortalamasından sapması büyütülür (işaret/dövme pikselleri belirginleşir).
    const nl = Math.max(0, Math.min(100, (ml + (l[0] - ml) * contrast) * gain + dL));
    const [r, g, b] = labToRgb(nl, nc * Math.cos(nh), nc * Math.sin(nh));
    const i = idx[k]!; data[i] = r; data[i + 1] = g; data[i + 2] = b;
  });
  return idx.length;
}

const done = new Map<string, string | null>();
const waiting = new Map<string, Promise<string | null>>();
export const tintKey = (url: string, tint: TintSpec) => `${url}|${JSON.stringify(tint)}`;

/** Görev K21: jetonun maskesi elle mi çizildi (data/soy-maske-rapor.json; `npm run soy-maske` / `soy-incele` yazar). */
export const handMasked = (name: string): boolean => (maskRapor as { sprites: Record<string, string> }).sprites[name] === 'el';

/**
 * Görev K15: jetonun ten maskesi (aynı ad, `characters/maske/…png`; küçük kopyalarda da aynı maske ölçeklenir).
 * Görev K21: elle çizilmiş maske varsa önce o (`characters/maske-el/…png`, `assets/soy-maske-el/`'den doğrulanıp kopyalanır).
 */
export const maskUrlFor = (url: string): string | null => {
  const m = url.match(/^(.*\/)?characters\/(?:kucuk\/)?([^/]+)\.webp$/);
  return m ? `${m[1] ?? ''}characters/${handMasked(m[2] as string) ? 'maske-el' : 'maske'}/${m[2]}.png` : null;
};

const loadImage = (src: string) => new Promise<HTMLImageElement | null>((resolve) => {
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});

/** Görseli yükleyip boyar (bir kez); nesne URL'si ya da hata/ortam yoksa null. */
export function tintedUrl(url: string, tint: TintSpec): Promise<string | null> {
  const key = tintKey(url, tint);
  const ready = done.get(key);
  if (ready !== undefined) return Promise.resolve(ready);
  let p = waiting.get(key);
  if (!p) {
    p = (async (): Promise<string | null> => {
      if (typeof document === 'undefined' || typeof Image === 'undefined') return null;
      const img = await loadImage(url);
      if (!img) return null;
      const maskSrc = maskedTint(tint) ? maskUrlFor(url) : null;
      const maskImg = maskSrc ? await loadImage(maskSrc) : null;
      // Görev K22: kafa kaplaması (kapsamdaki Goliath jetonları; görsel yoksa eski yol, bit bit aynı).
      const basSrc = maskSrc ? basUrlFor(url) : null;
      const basImg = basSrc ? await loadImage(basSrc) : null;
      if (maskedTint(tint) && !maskImg) return null;
      try {
        const W = img.naturalWidth, H = img.naturalHeight;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;
        let mask: Uint8Array | undefined;
        let weights: Uint8Array | undefined;
        if (maskImg) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(maskImg, 0, 0, W, H);
          const m = ctx.getImageData(0, 0, W, H).data;
          // Elle maske: gri × saydamlık ağırlık (yumuşak kenar); otomatik maske: ikili (eski yol).
          const hand = maskSrc?.includes('/maske-el/') ?? false;
          if (hand) {
            weights = new Uint8Array(W * H);
            for (let i = 0; i < W * H; i++) weights[i] = Math.round(((m[i * 4] ?? 0) * (m[i * 4 + 3] ?? 0)) / 255);
          } else {
            mask = new Uint8Array(W * H);
            for (let i = 0; i < W * H; i++) mask[i] = (m[i * 4] ?? 0) > 127 ? 1 : 0;
          }
          ctx.clearRect(0, 0, W, H);
        }
        let overlay: Uint8ClampedArray | undefined;
        if (basImg) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(basImg, 0, 0, W, H);
          overlay = ctx.getImageData(0, 0, W, H).data;
          ctx.clearRect(0, 0, W, H);
        }
        ctx.drawImage(img, 0, 0);
        const px = ctx.getImageData(0, 0, W, H);
        const entry = spriteName(url) ? headEntry(spriteName(url) as string) : undefined;
        if (overlay && entry && (mask || weights)) {
          const base = mask ?? Uint8Array.from(weights as Uint8Array, (w) => (w > 0 ? 1 : 0));
          const r = applyHeadOverlay(px.data, base, overlay, entry.box, W, { body: entry.govdeBoya !== false });
          // Görev K23: gövde boyası kapalı: yalnızca kafa (boyun geçişi yumuşak ağırlıkla).
          if (r.weights) { weights = r.weights; mask = undefined; }
          else if (weights) { const [x0, y0, x1, y1] = entry.box; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const p = y * W + x; weights[p] = r.mask[p] ? (weights[p] || 255) : 0; } }
          else mask = r.mask;
        }
        tintPixels(px.data, tint, mask, weights);
        ctx.putImageData(px, 0, 0);
        return await new Promise<string | null>((resolve) => canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : null), 'image/png'));
      } catch { return null; }
    })().then((v) => { done.set(key, v); waiting.delete(key); return v; });
    waiting.set(key, p);
  }
  return p;
}

/** Önbellekteki boyalı URL (hazırsa), hazır değilse undefined; boyanamadıysa null (asıl görsel gösterilir). */
export const tintedReady = (url: string, tint: TintSpec): string | null | undefined => done.get(tintKey(url, tint));
