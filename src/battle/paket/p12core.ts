/**
 * Kuyruk P12 (kural sürümü 45): ek paket ilkel genişletme 6, hafif çekirdek (oluşturucu `core.ts` ve büyü yolu buradan
 * okur; kancalar `p12.ts`). Sürüm kapısının tek sabiti `p12surum.ts` `P12_VERSION`. Saf.
 * - Rastgele büyü listesi (`buyuVer.rastgeleListe`): düğme `pk12:dilek:<özellik>#<i>`.
 * - Vertigo (`vertigo`): düğmeler `pk12:vertigo:<özellik>#<i>:isinlan|hemen|tekrar`; tablo satırı zar yüzünden.
 */
import type { BattleState, Combatant, UsableFeature } from '../types';
import { resKey, type Ilkel, type PaketOzellik } from './core';

/** P12 kural sürümü kapısı (tek sabit `p12surum.ts`). */
export { P12_VERSION, p12On } from './p12surum';

export interface Ref { feat: PaketOzellik; p: Ilkel; i: number }
export const refsOf = (c: Combatant | undefined, tur: string): Ref[] =>
  (c?.paket?.ozellikler ?? []).flatMap((feat) => feat.ilkeller.map((p, i) => ({ feat, p, i }))).filter((x) => x.p.tur === tur);

export const DILEK = 'pk12:dilek:';
export const VERTIGO = 'pk12:vertigo:';
export const refKey = (r: Ref): string => `${r.feat.key}#${r.i}`;
export const VERTIGO_FX = (id: string): string => `pk-vertigo:${id}`;
export const BOOK = (id: string): string => `pk-kitap:${id}`;

export interface VertigoRow {
  etki: 'patlama' | 'isinlan' | 'isik' | 'acBonusu'; ad?: string; yuzler?: number[]; zar?: unknown; hasarTuru?: string; yaricapFt?: number;
  save?: Record<string, unknown>; durum?: string; sure?: number | 'kalici'; miktar?: unknown; mesafeFt?: number; tekrar?: boolean; hemen?: boolean; suzgec?: 'dusmanlar' | 'hepsi';
}
export const vertigoSides = (p: Ilkel): number => (Number.isInteger(p.zar) ? p.zar as number : 8);
export const vertigoRows = (p: Ilkel): VertigoRow[] => (Array.isArray(p.tablo) ? p.tablo as VertigoRow[] : []);
/** Zar yüzünün satırı: `yuzler` verilmişse o, yoksa satırlar yüzlere eşit dağılır (4 satır d8: 1–2, 3–4, 5–6, 7–8). */
export function vertigoRow(p: Ilkel, face: number): VertigoRow | undefined {
  const rows = vertigoRows(p);
  const byFace = rows.find((r) => r.yuzler?.includes(face));
  if (byFace) return byFace;
  const free = rows.filter((r) => !r.yuzler);
  if (!free.length) return undefined;
  return free[Math.min(free.length - 1, Math.floor(((face - 1) * free.length) / vertigoSides(p)))];
}
export const ETKI_AD: Record<VertigoRow['etki'], string> = { patlama: 'patlama', isinlan: 'ışınlanma', isik: 'kör edici ışık', acBonusu: 'AC' };
export const rowName = (r: VertigoRow): string => r.ad ?? ETKI_AD[r.etki];

/** Savaş başı (sürüm 45+): P12 düğmeleri. */
export function p12Features(c: Combatant): UsableFeature[] {
  const out: UsableFeature[] = [];
  for (const r of refsOf(c, 'buyuVer')) {
    if (!r.p.rastgeleListe) continue;
    const k = r.p.kaynak as { id: string } | undefined;
    // Serbest: zar atılır; seçilen büyü kendi yapım süresiyle (eylem) slotsuz yapılır (düğme eylem boşken açılır).
    out.push({ key: `${DILEK}${refKey(r)}`, name: (r.p.ad as string | undefined) ?? r.feat.ad, type: 'free', ...(k ? { resource: resKey(c, k.id) } : {}), effect: { kind: 'paket' } });
  }
  for (const r of refsOf(c, 'vertigo')) {
    const rows = vertigoRows(r.p);
    const name = (r.p.ad as string | undefined) ?? r.feat.ad;
    if (rows.some((x) => x.etki === 'isinlan')) out.push({ key: `${VERTIGO}${refKey(r)}:isinlan`, name: `${name}: ışınlan`, type: 'bonus', effect: { kind: 'paket', hex: 'hex' } });
    if (rows.some((x) => x.etki === 'isinlan' && x.hemen)) out.push({ key: `${VERTIGO}${refKey(r)}:hemen`, name: `${name}: ışınlan (bedava)`, type: 'free', effect: { kind: 'paket', hex: 'hex' } });
    if (rows.some((x) => x.tekrar && (x.etki === 'patlama' || x.etki === 'isik'))) out.push({ key: `${VERTIGO}${refKey(r)}:tekrar`, name: `${name}: yinele`, type: 'bonus', effect: { kind: 'paket' } });
  }
  return out;
}

/** Düğme anahtarının ilkeli (ve vertigo kipi). */
export function p12Ref(c: Combatant, key: string): { r: Ref; mode?: string } | undefined {
  const rest = key.startsWith(DILEK) ? key.slice(DILEK.length) : key.startsWith(VERTIGO) ? key.slice(VERTIGO.length) : null;
  if (rest === null) return undefined;
  const [rk, mode] = key.startsWith(VERTIGO) ? [rest.slice(0, rest.lastIndexOf(':')), rest.slice(rest.lastIndexOf(':') + 1)] : [rest, undefined];
  const tur = key.startsWith(DILEK) ? 'buyuVer' : 'vertigo';
  const r = refsOf(c, tur).find((x) => refKey(x) === rk);
  return r ? { r, ...(mode ? { mode } : {}) } : undefined;
}

/** Rastgele listenin seçilmiş büyüleri (oluşturucu `featureChoices["<özellik>/dilek<n>"]`; `bag.ts` gömer). */
export const wishList = (p: Ilkel): string[] => (Array.isArray(p.secilenler) ? p.secilenler as string[] : []);
export const wishCount = (p: Ilkel): number => ((p.rastgeleListe as { sayi?: number } | undefined)?.sayi ?? 8);

/** Kitaptan büyü (`buyuDegisimi.kitapCikis`): kitabın altıgeni (taşınıyorsa taşıyanın). */
export function bookHex(state: BattleState, c: Combatant): { col: number; row: number } | null {
  const o = state.map?.objects?.find((x) => x.id === BOOK(c.id) && x.hp > 0);
  if (!o) return null;
  if (o.carriedBy) return state.combatants[o.carriedBy]?.pos ?? null;
  return o.at;
}
export const hasBook = (c: Combatant): boolean => refsOf(c, 'buyuDegisimi').some((x) => x.p.kitapCikis === true);
/** Okul ikiz büyüsü (`buyuDegisimi.ikizOkul`). */
export const twinSchoolOf = (c: Combatant): string | undefined => refsOf(c, 'buyuDegisimi').map((x) => x.p.ikizOkul).find((x): x is string => typeof x === 'string');
