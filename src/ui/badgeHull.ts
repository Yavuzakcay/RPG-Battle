/**
 * ROZET-CERCEVE-KIRPMA: rozet görselinin alfa zarfı (tarayıcıda, görsel yüklenince bir kez; görsel yolu başına önbellek). Boya (soy
 * rengi) alfayı değiştirmez: zarf boyasız yoldan anahtarlanır, yüklenen (boyalı olabilir) görselden ölçülür. Canvas yoksa (test ortamı)
 * ya da okunamazsa zarf boş: rozet yalnız kemer kırpmasıyla çizilir (sığdırma yok). Saf hesap `badgeFit.ts`'te.
 */
import { alphaHull, type Pt } from './badgeFit';

const hulls = new Map<string, Pt[]>();
/** Ölçüm boyu üst sınırı (px): büyük görsel küçültülerek okunur (256 px jeton olduğu gibi). */
const MAX_SIDE = 256;

export const knownHull = (key: string): Pt[] | undefined => hulls.get(key);

/** Yüklenmiş görselden zarf (önbelleğe yazar). Okunamazsa boş zarf (bir daha denenmez). */
export function measureHull(key: string, img: HTMLImageElement): Pt[] {
  const have = hulls.get(key);
  if (have) return have;
  let hull: Pt[] = [];
  try {
    const w0 = img.naturalWidth, h0 = img.naturalHeight;
    if (w0 > 0 && h0 > 0 && typeof document !== 'undefined') {
      const s = Math.min(1, MAX_SIDE / Math.max(w0, h0));
      const w = Math.max(1, Math.round(w0 * s)), h = Math.max(1, Math.round(h0 * s));
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      if (ctx) { ctx.drawImage(img, 0, 0, w, h); hull = alphaHull(ctx.getImageData(0, 0, w, h).data, w, h); }
    }
  } catch { hull = []; }
  hulls.set(key, hull);
  return hull;
}

/**
 * Önbellekte yoksa tarayıcının bellek önbelleğindeki görselden hemen ölçmeyi dener (yüklenmiş görsel `complete`): rozet ilk çizimde
 * doğru yerde açılır. Olmazsa undefined (görsel yüklenince `measureHull`).
 */
export function tryHull(key: string, url: string): Pt[] | undefined {
  const have = hulls.get(key);
  if (have || typeof Image === 'undefined' || typeof document === 'undefined' || /jsdom/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '')) return have;
  const img = new Image();
  img.src = url;
  return img.complete && img.naturalWidth > 0 ? measureHull(key, img) : undefined;
}
