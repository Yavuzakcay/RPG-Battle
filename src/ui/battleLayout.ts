/**
 * Görev D: telefon dikey (portrait) savaş yerleşimi, saf hesaplar (yalnız arayüz; `MapBattle` kullanır).
 * Dikeyde üstte ince sıra şeridi, ortada harita, altta iki konumlu çekmece (eylem menüsü, balonlar, zar, tepki).
 * Masaüstü ve yatay telefon eski yerleşimde: sahne kutusu `stageBox` eski formülle aynı.
 */
import type { Size } from './camera';

/** Dikey yerleşimin en geniş ekranı (px). */
export const PORTRAIT_MAX_W = 520;
/** Kapalı çekmece çubuğunun yüksekliği (px; dokunma hedefi ≥ 44 px). */
export const SHEET_BAR_H = 52;
/** Üst sıra şeridinin yüksekliği (px). */
export const TOP_STRIP_H = 48;
/** Harita ekran yüksekliğinin en az bu oranı (açık çekmecede de). */
export const MAP_MIN_RATIO = 0.55;
/** Açık çekmece ekran yüksekliğinin en çok bu oranı. */
export const SHEET_MAX_RATIO = 0.45;

/** Dikey telefon yerleşimi mi: genişlik < yükseklik ve genişlik ≤ 520 px. */
export const isPortraitPhone = (w: number, h: number): boolean => w < h && w <= PORTRAIT_MAX_W;

/** Masaüstü ve yatay: pencereye sığan, görsel oranını koruyan sahne (Görev D öncesi formül, değişmedi). */
export function stageBox(vw: number, vh: number, ratio: number): Size {
  const w = Math.min(vw, vh * ratio);
  return { w, h: w / ratio };
}

/** Açık çekmecenin yüksekliği (px): en çok ekranın %45'i ve harita en az %55 kalacak kadar (en az iki çubuk boyu). */
export function sheetOpenHeight(vh: number, topH = TOP_STRIP_H): number {
  return Math.max(SHEET_BAR_H * 2, Math.round(Math.min(vh * SHEET_MAX_RATIO, vh * (1 - MAP_MIN_RATIO) - topH)));
}

/**
 * Dikeyde haritanın ölçeğini veren standart oranlı sanal ekran. Ölçek çekmece kapalıyken harita alanının yüksekliğinden
 * (7,5 altıgen satırı onu doldurur: 15×7 haritada boş bant yok) ve çekmece açılıp kapanınca değişmez: açıkken pencere
 * kısalır, harita dikey de kaydırılır (sıradaki yaratık görünür tutulur). `mapH`: ölçülen harita alanı; `open`: çekmece
 * açık mı; `openH`: açık çekmecenin yüksekliği.
 */
export function portraitScaleScreen(mapH: number, open: boolean, openH: number, ratio: number): Size {
  const h = Math.max(1, open ? mapH + (openH - SHEET_BAR_H) : mapH);
  return { w: h * ratio, h };
}

/**
 * Çekmece açık mı: elle seçim (aynı bağlamda) önce; yoksa karar bekleyen balon/soru varsa açık, boşta eylem menüsü
 * açıksa açık; hedefleme sırasında (harita seçimi) kapalı ki harita görünsün.
 */
export function sheetOpenFor(p: { idle: boolean; menuOpen: boolean; decision: boolean; manual: boolean | null }): boolean {
  if (p.manual !== null) return p.manual;
  return p.decision || (p.idle && p.menuOpen);
}
