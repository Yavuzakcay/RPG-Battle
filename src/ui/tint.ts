/**
 * Soy renkleri (Görev K8b): jeton görselinin ten/pul piksellerini soyun rengine taşır. Saf piksel dönüşümü
 * (`tintPixels`) ve tarayıcıda görseli bir kez boyayıp önbelleğe alan yükleyici (`tintedUrl`). Yeni görsel
 * indirilmez; boyalı görsel nesne URL'si olarak bellekte kalır.
 */
import type { TintSpec } from '../battle/types';

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

/** RGBA piksel dizisini yerinde boyar; değişen piksel sayısını döndürür. */
export function tintPixels(data: Uint8ClampedArray, tint: TintSpec): number {
  const { select: sel, to } = tint;
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

const done = new Map<string, string | null>();
const waiting = new Map<string, Promise<string | null>>();
export const tintKey = (url: string, tint: TintSpec) => `${url}|${JSON.stringify(tint)}`;

/** Önbellekteki boyalı URL (hazırsa), hazır değilse undefined; boyanamadıysa null (asıl görsel gösterilir). */
export const tintedReady = (url: string, tint: TintSpec): string | null | undefined => done.get(tintKey(url, tint));

/** Görseli yükleyip boyar (bir kez); nesne URL'si ya da hata/ortam yoksa null. */
export function tintedUrl(url: string, tint: TintSpec): Promise<string | null> {
  const key = tintKey(url, tint);
  const ready = done.get(key);
  if (ready !== undefined) return Promise.resolve(ready);
  let p = waiting.get(key);
  if (!p) {
    p = new Promise<string | null>((resolve) => {
      if (typeof document === 'undefined' || typeof Image === 'undefined') { resolve(null); return; }
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) { resolve(null); return; }
          ctx.drawImage(img, 0, 0);
          const px = ctx.getImageData(0, 0, canvas.width, canvas.height);
          tintPixels(px.data, tint);
          ctx.putImageData(px, 0, 0);
          canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : null), 'image/png');
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    }).then((v) => { done.set(key, v); waiting.delete(key); return v; });
    waiting.set(key, p);
  }
  return p;
}
