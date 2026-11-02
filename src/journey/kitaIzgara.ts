/**
 * Kuyruk 44b: kıta ızgarası (`data/kita-izgara.json`): yerleşimlerin bütün kıtadaki hücresi (sütun A–L batıdan doğuya,
 * satır 1–6 kuzeyden güneye; Kuyruk 44c genişletme), Serüven sayfası/düğümü ve kıta simgesi tek tabloda. Saf.
 */
import data from '../../data/kita-izgara.json';
import { yerlesimById } from '../yerlesim/yerlesim';

export interface IzgaraYeri { hucre: string | null; sayfa?: string; dugum?: string; ikon?: string; not?: string; /** Kuyruk 44c: kaplanan hücre aralığı [sol üst, sağ alt]. */ alan?: [string, string] }
interface Izgara { sutunlar: string; satirlar: number; ikonlar: Record<string, string>; yerlesimler: Record<string, IzgaraYeri> }
export const KITA_IZGARA = data as unknown as Izgara;

/** Hücre ("D3") → sütun/satır (0 tabanlı); ızgara dışıysa null. */
export function hucreKonum(h: string): { sutun: number; satir: number } | null {
  const m = /^([A-Z])(\d+)$/.exec(h);
  if (!m) return null;
  const sutun = KITA_IZGARA.sutunlar.indexOf(m[1] as string);
  const satir = Number(m[2]) - 1;
  return sutun >= 0 && satir >= 0 && satir < KITA_IZGARA.satirlar ? { sutun, satir } : null;
}

/** Yerleşim düğümünün kıta simgesi: tabloda özel simge, yoksa şablona göre; bilinmeyen yerleşimde ⌂. */
export function yerlesimIkonu(id: string): string {
  const own = KITA_IZGARA.yerlesimler[id]?.ikon;
  if (own) return own;
  const y = yerlesimById(id);
  return (y && KITA_IZGARA.ikonlar[y.sablon]) || '⌂';
}
