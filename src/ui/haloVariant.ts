/**
 * KQ6-12 (yalnız görünüm): Gece Gözyaşı ve Kırık Kanat uyanışında Celestial jetonun halesiz varyantı. Varyantlar önceden hesaplı
 * (`public/characters/halesiz/<ad>.webp` + `halesiz/kucuk/`, üretici `scripts/hale-uygula.py`); çalışma anında kırpma ya da hesap yok.
 * Güvenli üretilemeyenler (`data/hale-halesiz.json` `bekleyen`, elle karar listesi `data/hale-elle.json`) asıl jetonla kalır: hale görünür.
 */
import data from '../../data/hale-halesiz.json';

const HOLD = new Set<string>(data.bekleyen);

/** `characters/celestial-….webp` → halesiz varyantın yolu; varyantı olmayan (ya da Celestial olmayan) jeton için null. */
export function haloFreeSrc(src: string): string | null {
  const m = /^characters\/(celestial-[^/]+)\.webp$/.exec(src);
  return m && !HOLD.has(m[1] as string) ? `characters/halesiz/${m[1]}.webp` : null;
}
