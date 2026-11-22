/**
 * Kuyruk KQ6-7: jeton doğal yönü (yalnız görünüm). `data/jeton-ayna.json` listesindeki jetonlar (Gulyabani) sola dönük çizildi;
 * çözücü onları yatay aynalar. Savaşta `flip` (en yakın düşmana dönme) bununla XOR'lanır: ayna jetonun doğal yönüdür.
 */
import data from '../../data/jeton-ayna.json';

const NAMES = new Set(data.sinifHucre);
/** `characters/<ırk>-<cinsiyet>-<sınıf>-<kod>.webp` (kucuk/ dahil): doğal yönü sola bakıyorsa true. */
export function naturalLeft(src: string | null | undefined): boolean {
  const m = src ? /(?:^|\/)(?:kucuk\/)?[a-z]+-(?:erkek|kadin|male|female)-([a-z]+-[A-Za-z]+-?\d+)\.webp$/.exec(src) : null;
  return !!m && NAMES.has(m[1] as string);
}
