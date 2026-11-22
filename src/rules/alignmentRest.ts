/** Kuyruk K52: uzun dinlenmede iç huzur hakkı yenilenir (yalnız hizalanma kaydı; Moral kendisi dinlenmeyle değişmez). Saf, verisiz (ana parça). */
import type { Alignment } from './alignment';

export function alignmentLongRest<T extends { hizalanma?: Alignment }>(ch: T): T {
  const h = ch.hizalanma;
  if (!h) return ch;
  // Kuyruk AL2: uzun dinlenme tekrar azalımı penceresini de sıfırlar (günlükteki yeni uzunluktan sayılır).
  const v = h.vicdan;
  const { huzurAlindi: _h, ...rest } = v ?? {};
  return { ...ch, hizalanma: { ...h, pencereBas: h.gunluk.length, ...(v ? { vicdan: v.huzurAlindi ? rest : v } : {}) } };
}
