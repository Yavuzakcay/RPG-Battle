/**
 * Görev MC1: çoklu sınıf veri modeli ve saf yardımcılar (SRD 5.2.1 s. 24–26; plan harita/belgeler/MULTICLASS-PLAN.md).
 * Karakterin sınıfları `CharacterSheet.classes` (yalnız 2+ sınıfta yazılır); kod alanı doğrudan okumaz, `classesOf`'tan
 * okur. Tek sınıflı karakterde her yardımcı eski üç alanla (`classId`, `level`, `subclassId`) aynı sonucu verir.
 *
 * MC1 yalnız modeli tanımlar: hesaplar (`deriveStats`, savaş kurulumu, büyü yuvası) bu modülü MC2–MC4'te kullanacak.
 * Ön koşul ve sınır denetimi yapılandırılmış sorun döner; metne çevirmek oluşturucunun işi (MC2, `characterIssues`).
 * Kod sınıf adı içermez: sınıfa özgü her şey `data/cok-sinif.json`'dan.
 */
import data from '../../data/cok-sinif.json';
import type { Ability } from './abilities';
import type { Skill } from './skills';
import type { CharacterSheet, ClassEntry, Scores } from './stats';
import { LEVEL_CAP, MAX_CLASSES } from '../app/limits';

/** Ana yetenek: `hepsi` ("and": hepsi ≥ ön koşul) ya da `biri` ("or": en az biri). */
export type PrimaryAbility = { hepsi: Ability[]; biri?: never } | { biri: Ability[]; hepsi?: never };
/** Multiclass Spellcaster tablosuna katkı (SRD 5.2.1 s. 25): tam, yarı (yukarı yuvarla), ayrı Pact havuzu ya da yok. */
export type SlotShare = 'tam' | 'yari' | 'pact' | null;
export interface MulticlassGrants {
  silah?: string[];
  zirh?: Array<'light' | 'medium' | 'heavy' | 'shield'>;
  beceri?: { sayi: number; liste: 'hepsi' | 'sinif' };
  alet?: string[];
  calgi?: number;
}
export interface MulticlassInfo { anaYetenek: PrimaryAbility; ek: MulticlassGrants; yuva: SlotShare; sayfa: number }
interface MulticlassData { onKosul: number; siniflar: Record<string, MulticlassInfo> }

const DATA = data as unknown as MulticlassData;
/** SRD 5.2.1 s. 24: çoklu sınıf ön koşulunun yetenek eşiği (13). */
export const MULTICLASS_MIN_SCORE = DATA.onKosul;

/** Sınıfın çoklu sınıf verisi (bilinmeyen sınıf: undefined; ör. dış içerikten gelen sınıf kimliği). */
export const multiclassInfo = (classId: string): MulticlassInfo | undefined => DATA.siniflar[classId];
/** Veride kayıtlı sınıflar (test ve oluşturucu için). */
export const multiclassClassIds = (): string[] => Object.keys(DATA.siniflar);

type ClassFields = Pick<CharacterSheet, 'classId' | 'level' | 'subclassId' | 'classes'>;

/** Karakterin sınıfları; `classes` yoksa (tek sınıf) eski üç alandan tek öğe. */
export function classesOf(sheet: ClassFields): ClassEntry[] {
  if (sheet.classes && sheet.classes.length > 0) return sheet.classes;
  return [{ classId: sheet.classId, level: sheet.level, ...(sheet.subclassId !== undefined ? { subclassId: sheet.subclassId } : {}) }];
}
/** Bu sınıftaki seviye (sınıf karakterde yoksa 0). */
export const classLevel = (sheet: ClassFields, classId: string): number => classesOf(sheet).find((c) => c.classId === classId)?.level ?? 0;
/** Karakterin 2+ sınıfı var mı. */
export const isMulticlass = (sheet: ClassFields): boolean => classesOf(sheet).length > 1;
/** Toplam karakter seviyesi (SRD: XP, yeterlilik bonusu, cantrip gücü bundan). */
export const totalLevel = (sheet: ClassFields): number => classesOf(sheet).reduce((n, c) => n + c.level, 0);

/**
 * Değişmezleri kurar: 2+ sınıfta `classId`/`subclassId` ilk öğeden, `level` toplamdan; tek öğeli `classes` eski üç alana
 * katlanır ve alan silinir (tek sınıflı kayıt eskisiyle bayt bayt aynı kalır); `classes` yok ya da boşsa sayfa değişmez
 * (boş dizi silinir). Değişiklik yoksa aynı nesne döner.
 */
export function syncClassFields<T extends ClassFields>(sheet: T): T {
  const list = sheet.classes;
  if (list === undefined) return sheet;
  const { classes: _c, subclassId: _s, ...rest } = sheet;
  if (list.length === 0) return (sheet.subclassId !== undefined ? { ...rest, subclassId: sheet.subclassId } : rest) as unknown as T;
  const first = list[0]!;
  const head = { ...rest, classId: first.classId, level: list.length === 1 ? first.level : list.reduce((n, c) => n + c.level, 0) };
  const withSub = first.subclassId !== undefined ? { ...head, subclassId: first.subclassId } : head;
  return (list.length === 1 ? withSub : { ...withSub, classes: list }) as unknown as T;
}

/** Ana yetenek ön koşulu tutuyor mu (SRD 5.2.1 s. 24; "and" hepsi, "or" biri ≥ 13). Bilinmeyen sınıf: tutmaz. */
export function meetsPrimary(classId: string, scores: Scores): boolean {
  const a = multiclassInfo(classId)?.anaYetenek;
  if (!a) return false;
  return a.hepsi ? a.hepsi.every((x) => scores[x] >= MULTICLASS_MIN_SCORE) : a.biri.some((x) => scores[x] >= MULTICLASS_MIN_SCORE);
}

/** Çoklu sınıf sorunları (yapılandırılmış; metni oluşturucu verir). */
export type MulticlassProblem =
  | { kind: 'cok'; max: number; count: number }
  | { kind: 'tekrar'; classId: string }
  | { kind: 'bilinmeyen'; classId: string }
  | { kind: 'seviye'; classId: string; level: number }
  | { kind: 'toplam'; total: number; max: number }
  | { kind: 'onKosul'; classId: string; abilities: Ability[]; any: boolean }
  | { kind: 'ekBeceri'; classId: string; skill: Skill };

const prereqProblem = (classId: string, scores: Scores): MulticlassProblem | null => {
  const a = multiclassInfo(classId)?.anaYetenek;
  if (!a) return { kind: 'bilinmeyen', classId };
  return meetsPrimary(classId, scores) ? null : { kind: 'onKosul', classId, abilities: a.hepsi ?? a.biri, any: !a.hepsi };
};

/**
 * Karakterin sınıf listesi kurala uygun mu. `scores`: son yetenek puanları (geçmiş ve ASI dahil). Tek sınıfta ön koşul
 * aranmaz (SRD: ön koşul yeni sınıf alınırken; tek sınıflı karakterde hiç uygulanmaz). Sınıf listesindeki ek beceri
 * doğrulaması için `classSkills` (sınıfın beceri listesi; 'any' serbest) verilir.
 */
export function multiclassProblems(sheet: ClassFields, scores: Scores, classSkills: (classId: string) => readonly Skill[] | 'any'): MulticlassProblem[] {
  const list = classesOf(sheet);
  const out: MulticlassProblem[] = [];
  if (list.length > MAX_CLASSES) out.push({ kind: 'cok', max: MAX_CLASSES, count: list.length });
  const seen = new Set<string>();
  for (const c of list) {
    if (seen.has(c.classId)) out.push({ kind: 'tekrar', classId: c.classId });
    seen.add(c.classId);
    if (!Number.isInteger(c.level) || c.level < 1) out.push({ kind: 'seviye', classId: c.classId, level: c.level });
  }
  const total = list.reduce((n, c) => n + c.level, 0);
  if (total > LEVEL_CAP) out.push({ kind: 'toplam', total, max: LEVEL_CAP });
  if (list.length > 1) {
    for (const id of seen) { const p = prereqProblem(id, scores); if (p) out.push(p); }
    list.forEach((c, i) => {
      if (!c.ekBeceri) return;
      const rule = multiclassInfo(c.classId)?.ek.beceri;
      const from = classSkills(c.classId);
      if (i === 0 || !rule || (rule.liste === 'sinif' && from !== 'any' && !from.includes(c.ekBeceri))) out.push({ kind: 'ekBeceri', classId: c.classId, skill: c.ekBeceri });
    });
  }
  return out;
}

/**
 * Bu sınıf eklenebilir mi (yeni sınıfta 1. seviye; SRD 5.2.1 s. 24): sınır, tekrar, toplam seviye ve ön koşul (yeni sınıf
 * ve mevcut sınıfların hepsi). Sorun yoksa boş liste.
 */
export function addClassProblems(sheet: ClassFields, classId: string, scores: Scores): MulticlassProblem[] {
  const list = classesOf(sheet);
  const out: MulticlassProblem[] = [];
  if (list.some((c) => c.classId === classId)) out.push({ kind: 'tekrar', classId });
  if (list.length + 1 > MAX_CLASSES) out.push({ kind: 'cok', max: MAX_CLASSES, count: list.length + 1 });
  const total = list.reduce((n, c) => n + c.level, 0) + 1;
  if (total > LEVEL_CAP) out.push({ kind: 'toplam', total, max: LEVEL_CAP });
  for (const id of new Set([...list.map((c) => c.classId), classId])) { const p = prereqProblem(id, scores); if (p) out.push(p); }
  return out;
}
