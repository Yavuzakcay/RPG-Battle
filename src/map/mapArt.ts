/**
 * Görev HG1: harita görselinin boyut / en-boy doğrulaması (saf; görsel okumaz, yalnızca boyut alır). İçe aktarma betiği
 * (`npm run harita-gorsel`) Gemini çıktısının piksel boyutunu buna verir. Görsel savaş ekranında dünya boyutuna
 * gerilerek çizilir (`object-fit: fill`), bu yüzden en-boy oranı altıgen hizası için tek kritik ölçüdür; çözünürlük
 * yalnızca netliği etkiler. Sınırlar `data/harita-referans.json` `tolerance`.
 */
import ref from '../../data/harita-referans.json';
import type { GridSize } from '../rules/hex';

export interface ArtTolerance { ratioWarn: number; ratioError: number; minScale: number; maxScale: number; maxKb: number }
export const ART_TOLERANCE: ArtTolerance = ref.tolerance;

/** Altıgen geometrisi (dünya pikseli; `src/ui/mapView.ts` ile aynı formül; 15×7 = 1280×715). */
export const HEX_HALF_W = 1280 / 23;
export const HEX_H = 715 / 7.5;

/** Harita görselinin hedef boyutu (tam piksel): genişlik S·(1,5·sütun + 0,5), yükseklik HH·(satır + 0,5). */
export function artSize(size: GridSize): { w: number; h: number } {
  return { w: Math.round(HEX_HALF_W * (1.5 * size.cols + 0.5)), h: Math.round(HEX_H * (size.rows + 0.5)) };
}

export type ArtLevel = 'ok' | 'warn' | 'error';
export interface ArtCheck {
  level: ArtLevel; target: { w: number; h: number }; ratio: number; ratioDiff: number; scale: number;
  messages: string[];
  /** Mesaj başına düzey (oran hatası `error`, diğerleri `warn`). */
  issues: Array<{ level: Exclude<ArtLevel, 'ok'>; text: string }>;
}

/** Görsel boyutunu (ve isteğe bağlı dosya boyutunu, kB) haritanın hedefine göre denetler. */
export function checkArt(img: { w: number; h: number; kb?: number }, size: GridSize, tol: ArtTolerance = ART_TOLERANCE): ArtCheck {
  const target = artSize(size);
  const want = target.w / target.h, ratio = img.w / img.h;
  const ratioDiff = Math.abs(ratio - want) / want;
  const scale = img.w / target.w;
  const issues: ArtCheck['issues'] = [];
  let level: ArtLevel = 'ok';
  const warn = (m: string) => { issues.push({ level: 'warn', text: m }); if (level === 'ok') level = 'warn'; };
  const fmt = (n: number) => n.toFixed(3);
  if (ratioDiff > tol.ratioError) {
    level = 'error';
    issues.push({ level: 'error', text: `en-boy oranı ${fmt(ratio)}, beklenen ${fmt(want)} (${target.w}×${target.h}); fark %${(ratioDiff * 100).toFixed(1)} > %${(tol.ratioError * 100).toFixed(1)}: altıgen hizası bozulur, görseli ${target.w}×${target.h} oranında yeniden üret ya da kırp` });
  } else if (ratioDiff > tol.ratioWarn) {
    warn(`en-boy oranı ${fmt(ratio)}, beklenen ${fmt(want)}: fark %${(ratioDiff * 100).toFixed(1)}, görsel hafifçe esnetilecek (kenardaki altıgenlerde en çok ${Math.ceil(ratioDiff * Math.max(target.w, target.h))} px kayma)`);
  }
  if (scale < tol.minScale) warn(`çözünürlük düşük: ${img.w}×${img.h}, hedef ${target.w}×${target.h} (×${scale.toFixed(2)}); büyütülünce bulanık olur`);
  if (scale > tol.maxScale) warn(`çözünürlük çok yüksek: ${img.w}×${img.h} (×${scale.toFixed(2)}); ${target.w}×${target.h} boyutuna küçültülecek`);
  if (img.kb !== undefined && img.kb > tol.maxKb) warn(`dosya ${Math.round(img.kb)} kB > ${tol.maxKb} kB: savaş açılışını yavaşlatır, WebP kalitesini düşür`);
  return { level, target, ratio, ratioDiff, scale, messages: issues.map((i) => i.text), issues };
}
