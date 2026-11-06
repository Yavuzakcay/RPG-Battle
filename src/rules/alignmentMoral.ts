/**
 * Kuyruk K52: Hizalanma ↔ Moral (Motivasyon) bağı (ev kuralı `hizalanmaMoral`; yalnız `hizalanma` ve `moralSistemi` de
 * açıkken; `docs/hizalanma-sistemi-taslak.md` "Moral bağı"). Savaş motoruna girmez, kural sürümü yok: Game Master
 * olay düğmesi / serbest giriş uygulanırken karakterin Moral'i buradan hesaplanır. Saf.
 * - Vicdan çatışması: eksen |değer| ≥ 17 iken olay ibreyi ters yöne ≥ 3 çekerse Moral −1 (≥ 5 ise −2); olay başına en
 *   çok −2, günde en çok −3; Moral'i 1'in altına indirmez.
 * - İç huzur: aynı koşulda aynı yöne ≥ 3 → Moral +1; uzun dinlenme başına en çok bir kez.
 * - Yeni yol: etiket bir eksende eşiği aşarak değişirse tek seferlik Moral +2 (eksen başına bir kez).
 * - Savrulma: Moral ≤ 1/3 iken olay puanı ×1.5.
 * Hesap yalnız olayın `hizalanmaEtki`sinden (günlük kaydının eksen puanları) türer; ayrı moral etkisi yok.
 */
import cfg from '../../data/hizalanma.json';
import { addEvent, addFree, bucketOf, type Alignment, type Axis, type ConscienceBook, type MoralReasonA } from './alignment';
import { moralMaxFrom, moralNow, moralThird } from './moral';
import { deriveStats, type CharacterSheet } from './stats';
import type { CharacterStatus } from './characterRest';

export const ALIGN_MORAL = cfg.moral;
const AXES: Axis[] = ['duzen', 'iyilik'];

/** Kuyruk K52: Moral bağı çalışır mı (üç ev kuralı birden). */
export const alignmentMoralOn = (rules: Partial<Record<string, boolean>>): boolean => !!(rules.hizalanma && rules.moralSistemi && rules.hizalanmaMoral);

export interface MoralCtx { moral: number; max: number; /** Gün (YYYY-MM-DD): günlük kayıp sınırı. */ day: string }
/** Karakterin Moral'i ve en çoğu (kayıtta yoksa dolu). */
export function characterMoral(sheet: CharacterSheet, status: CharacterStatus | undefined): { moral: number; max: number } {
  const d = deriveStats(sheet);
  const max = moralMaxFrom(d.modifiers, d.proficiency);
  return { moral: moralNow(status?.moral, max), max };
}
/** Savrulma çarpanı: Moral ≤ 1/3 iken ×1.5. */
export const swingOf = (ctx: Pick<MoralCtx, 'moral' | 'max'>): number => (moralThird(ctx.moral, ctx.max) ? ALIGN_MORAL.savrulmaCarpan : 1);

export type AlignAct = { kind: 'olay'; olayId: string } | { kind: 'serbest'; eksen: Axis; miktar: number; gerekce: string };
export interface MoralResult { alignment: Alignment; moral: number; delta: number; nedenler: MoralReasonA[]; changed: boolean }

/**
 * Hizalanma olayı + Moral bağı. `ctx` yoksa (bağ kapalı) yalnız hizalanma (K51 davranışı). `moralKapali`: Game Master bu
 * olay için Moral etkisini kapattı (savrulma çarpanı yine uygulanır).
 */
export function applyAlignAct(a: Alignment, act: AlignAct, kim: string, zaman: string, ctx: MoralCtx | null, moralKapali = false): MoralResult {
  const k = ctx ? swingOf(ctx) : 1;
  const day = ctx?.day;
  const next = act.kind === 'olay' ? addEvent(a, act.olayId, kim, zaman, day, '', k) : addFree(a, act.eksen, act.miktar, act.gerekce, kim, zaman, day, k);
  const base = { alignment: next, moral: ctx?.moral ?? 0, delta: 0, nedenler: [] as MoralReasonA[], changed: next !== a };
  if (!ctx || moralKapali || next === a) return base;
  const e = next.gunluk[next.gunluk.length - 1]!;
  const M = ALIGN_MORAL;
  const book: ConscienceBook = { ...(a.vicdan ?? {}) };
  if (book.gun !== ctx.day) { book.gun = ctx.day; book.kayip = 0; }
  let loss = 0, gain = 0;
  for (const ax of AXES) {
    const v = a[ax], d = e[ax];
    if (Math.abs(v) < M.esik || Math.abs(d) < M.catismaEnAz) continue;
    if (Math.sign(d) !== Math.sign(v)) loss += Math.abs(d) >= M.catismaBuyuk ? M.kayipBuyuk : M.kayip;
    else if (Math.abs(d) >= M.huzurEnAz) gain = M.huzur;
  }
  loss = Math.max(0, Math.min(loss, M.olayEnCok, M.gunlukEnCok - (book.kayip ?? 0)));
  if (book.huzurAlindi) gain = 0;
  let road = 0;
  const yeni: Partial<Record<Axis, true>> = { ...(book.yeniYol ?? {}) };
  for (const ax of AXES) {
    const before = a.kova?.[ax] ?? bucketOf(a[ax]);
    if (next.kova && next.kova[ax] !== before && !yeni[ax]) { road += M.yeniYol; yeni[ax] = true; }
  }
  // Vicdan Moral'i tabanın (1) altına indirmez; kazançlar en çoğa kırpılır.
  const lossNow = ctx.moral > M.taban ? Math.min(loss, ctx.moral - M.taban) : 0;
  const afterLoss = ctx.moral - lossNow;
  const gainNow = Math.max(0, Math.min(gain, ctx.max - afterLoss));
  const moral = Math.min(ctx.max, afterLoss + gainNow + road);
  const nedenler: MoralReasonA[] = [...(lossNow ? ['vicdan' as const] : []), ...(gainNow ? ['huzur' as const] : []), ...(road ? ['yeniYol' as const] : [])];
  book.kayip = (book.kayip ?? 0) + lossNow;
  if (gainNow) book.huzurAlindi = true;
  if (Object.keys(yeni).length) book.yeniYol = yeni;
  const delta = moral - ctx.moral;
  const gunluk = nedenler.length ? [...next.gunluk.slice(0, -1), { ...e, moral: { delta, nedenler } }] : next.gunluk;
  return { alignment: { ...next, gunluk, vicdan: book }, moral, delta, nedenler, changed: true };
}

export { alignmentLongRest } from './alignmentRest';
