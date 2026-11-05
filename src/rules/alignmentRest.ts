/** Kuyruk K52: uzun dinlenmede iç huzur hakkı yenilenir (yalnız hizalanma kaydı; Moral kendisi dinlenmeyle değişmez). Saf, verisiz (ana parça). */
import type { Alignment } from './alignment';

export function alignmentLongRest<T extends { hizalanma?: Alignment }>(ch: T): T {
  const v = ch.hizalanma?.vicdan;
  if (!v?.huzurAlindi) return ch;
  const { huzurAlindi: _h, ...rest } = v;
  return { ...ch, hizalanma: { ...ch.hizalanma!, vicdan: rest } };
}
