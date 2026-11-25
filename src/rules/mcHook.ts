/**
 * Görev MC3 (paket boyutu): çoklu sınıfın ana parçada kalan tek parçası. Tek sınıflı yol yalnız `isMultiSheet`'e bakar ve
 * çoklu sınıf modülünü (`mcImpl.ts`, `data/cok-sinif.json`) hiç çağırmaz; o modül `loadClassData()` ile tembel parça olarak
 * yüklenip burada kaydolur (`setMcImpl`). Çoklu sınıflı sayfa sınıf verisinden önce türetilemez (tek sınıflı sayfa da
 * zaten `loadClassData` ister).
 */
import type { CharacterSheet, ClassEntry } from './stats';
import type { McImpl } from './mcImpl';

/** Sayfa çoklu sınıflı mı (`classes` yalnız 2+ sınıfta yazılır). */
export const isMultiSheet = (s: { classes?: readonly unknown[] }): boolean => (s.classes?.length ?? 0) > 1;

/** Karakterin sınıfları; `classes` yoksa (tek sınıf) eski üç alandan tek öğe. */
export function classesOf(sheet: Pick<CharacterSheet, 'classId' | 'level' | 'subclassId' | 'classes'>): ClassEntry[] {
  if (sheet.classes && sheet.classes.length > 0) return sheet.classes;
  return [{ classId: sheet.classId, level: sheet.level, ...(sheet.subclassId !== undefined ? { subclassId: sheet.subclassId } : {}) }];
}

let impl: McImpl | null = null;
/** `loadClassData` çoklu sınıf modülünü kaydeder. */
export const setMcImpl = (x: McImpl): void => { impl = x; };
/** Çoklu sınıf modülü (yalnız çoklu sınıflı sayfada çağrılır). */
export function mcImpl(): McImpl {
  if (!impl) throw new Error('mcImpl: loadClassData');
  return impl;
}
