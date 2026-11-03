/**
 * K46 6b: Hapishane Adası haftalık yüzeye çıkışı. Saf; durum Serüven gününden hesaplanır (gerçek zamanlı döngü yok).
 * Serüven'de saat ve gün sayacı yok: gün = uzun dinlenme sayısı + 1 (`rests`; her uzun dinlenme bir gün). Her
 * `gunAraligi`. gün (7, 14…) yüzeyde; saat çözünürlüğü olmadığından pencere (`pencereSaat`, 6) o günün başı sayılır.
 * Anahtar `hapishaneHaftalik` kapalıyken Hapishane hep yüzeyde. Gemiyle yalnızca yüzeydeki günde çıkılır (K47 gemi).
 */
import type { SeruvenState } from '../journey/seruven';
import { FOG_RULES } from './worldData';

export const seruvenDay = (s: Pick<SeruvenState, 'rests'>): number => (s.rests ?? 0) + 1;

/** Hapishane yüzeyde mi (`weekly` false: anahtar kapalı, hep yüzeyde). */
export function prisonSurfaced(s: Pick<SeruvenState, 'rests'>, weekly = true): boolean {
  if (!weekly) return true;
  return seruvenDay(s) % FOG_RULES.hapishane.gunAraligi === 0;
}

/** Bir sonraki yüzey gününe kalan gün (bugün yüzeydeyse 0). */
export function daysToSurface(s: Pick<SeruvenState, 'rests'>, weekly = true): number {
  if (prisonSurfaced(s, weekly)) return 0;
  const n = FOG_RULES.hapishane.gunAraligi;
  return n - (seruvenDay(s) % n);
}

/** Gemiyle Hapishane'ye gidilebilir mi (yalnızca yüzeydeki gün). */
export const prisonShipOpen = prisonSurfaced;
