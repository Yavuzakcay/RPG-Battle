/**
 * K46 6b: Hapishane Adası haftalık yüzeye çıkışı. Saf; durum Serüven gününden hesaplanır (gerçek zamanlı döngü yok).
 * Serüven'de saat ve gün sayacı yok: gün = uzun dinlenme sayısı + 1 (`rests`; her uzun dinlenme bir gün). Her
 * `gunAraligi`. gün (7, 14…) yüzeyde; saat çözünürlüğü olmadığından pencere (`pencereSaat`, 6) o günün başı sayılır.
 * Anahtar `hapishaneHaftalik` kapalıyken Hapishane hep yüzeyde. Gemiyle yalnızca yüzeydeki günde çıkılır (K47 gemi).
 */
import type { SeruvenState } from '../journey/seruven';
import { FOG_RULES } from './worldData';

/** K47: saat varsa günü saatten (`saat` / 24), yoksa uzun dinlenme sayısından. */
export const seruvenDay = (s: Pick<SeruvenState, 'rests' | 'saat'>): number => (s.saat !== undefined ? Math.floor(s.saat / 24) : (s.rests ?? 0)) + 1;

/** Hapishane yüzeyde mi (`weekly` false: anahtar kapalı, hep yüzeyde). Saat varsa her 7. günün ilk `pencereSaat` saati. */
export function prisonSurfaced(s: Pick<SeruvenState, 'rests' | 'saat'>, weekly = true): boolean {
  if (!weekly) return true;
  if (seruvenDay(s) % FOG_RULES.hapishane.gunAraligi !== 0) return false;
  return s.saat === undefined || s.saat % 24 < FOG_RULES.hapishane.pencereSaat;
}

/** Bir sonraki yüzey gününe kalan gün (bugün yüzeydeyse 0). */
export function daysToSurface(s: Pick<SeruvenState, 'rests' | 'saat'>, weekly = true): number {
  if (prisonSurfaced(s, weekly)) return 0;
  const n = FOG_RULES.hapishane.gunAraligi;
  return n - (seruvenDay(s) % n);
}

/** Gemiyle Hapishane'ye gidilebilir mi (yalnızca yüzeydeki gün). */
export const prisonShipOpen = prisonSurfaced;
