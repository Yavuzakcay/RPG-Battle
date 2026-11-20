/**
 * Serüven öncesi (yalnız arayüz): dar ekranda jeton okunabilirliği. Ekran pikseli / dünya pikseli (`k`) verilince jeton ölçeği alt
 * sınırı, HP çubuğu kalınlığı ve durum rozeti büyütmesi; değerler `data/token-sizes.json` `okunabilirlik`. Mekanik ve tıklama alanı
 * (tek altıgen) değişmez; masaüstünde (geniş ekranda) sonuç eskisiyle aynıdır.
 */
import sizes from '../../data/token-sizes.json';

const R = sizes.okunabilirlik;

export interface Readability {
  /** Jetonun görsel ölçeği en az bu (en çok 1: Medium'dan büyütmez). */
  minScale: number;
  /** HP çubuğu kalınlığı (dünya birimi). */
  hpH: number;
  /** Durum rozeti grubunun büyütmesi (≥ 1). */
  badge: number;
}

export function tokenReadability(k: number, tokenR: number): Readability {
  if (!(k > 0) || !(tokenR > 0)) return { minScale: 0, hpH: R.hpDunya, badge: 1 };
  return {
    minScale: Math.min(1, R.minJetonPx / (2 * tokenR * k)),
    hpH: Math.max(R.hpDunya, R.minHpPx / k),
    badge: Math.min(R.rozetAzami, Math.max(1, R.minRozetPx / (R.rozetDunya * k))),
  };
}

/** Görsel ölçek alt sınırla (yalnız küçük jetonlar büyür). */
export const readableScale = (scale: number, r: Readability): number => Math.max(scale, r.minScale);

/** Dar ekranda (altıgen `minHexPx`'ten dar) hedef altıgen genişliği (px); kamera varsayılan yakınlaştırması bundan. */
export const NARROW_HEX_PX: number = R.darEkranAltigenPx;
