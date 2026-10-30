/**
 * Görev K18: sihirbazdaki kısa açıklamalar (`data/aciklamalar.json`): sınıf özelliği özeti, Weapon Mastery ve silah
 * özellikleri. Yalnızca oluşturucu (Builder, tembel parça) içe aktarır; ana parçaya girmez.
 */
import data from '../../data/aciklamalar.json';
import { findSubclass } from '../rules/subclasses';
import type { Weapon } from '../data/types';
import type { Lang } from '../i18n/strings';

type Texts = Record<Lang, Record<string, string>>;
const FEATURES = data.features as Texts;
const MASTERY = data.mastery as Texts;
const PROPS = data.properties as Texts;

const firstSentence = (t: string) => (t.match(/^.+?[.!?](\s|$)/)?.[0] ?? t).trim();

/** Sınıf ya da alt sınıf özelliğinin tek cümlelik özeti (yoksa boş). */
export function featureSummary(f: { key: string; id: string; from: 'class' | 'subclass' }, classId: string, subclassId: string | undefined, lang: Lang): string {
  if (f.from === 'subclass') {
    const d = findSubclass(classId, subclassId)?.features.find((x) => x.id === f.id)?.description;
    return d ? firstSentence(d[lang] ?? d.tr ?? '') : '';
  }
  return FEATURES[lang]?.[f.key] || FEATURES.tr[f.key] || '';
}

/** Görev K20: feat'in "Ne yapar?" ve "Örnek" metni (yoksa null: çeviri yok). */
export function featInfo(id: string, lang: Lang): { what: string; example: string } | null {
  const F = (data as unknown as { feats: Record<Lang, Record<string, { what: string; example: string }>> }).feats;
  return F[lang]?.[id] ?? null;
}

export const masteryDescription = (id: string, lang: Lang): string => MASTERY[lang]?.[id] ?? MASTERY.tr[id] ?? '';

/** Silahın özellik anahtarları (açıklama sırasıyla). */
export function weaponPropertyKeys(w: Weapon): string[] {
  return [w.finesse && 'finesse', w.light && 'light', w.heavy && 'heavy', w.twoHanded && 'twoHanded', w.reach && 'reach',
    w.versatileDamage && 'versatile', w.thrown && 'thrown', w.ammunition && 'ammunition', w.loading && 'loading'].filter((x): x is string => !!x);
}

export const propertyDescription = (key: string, lang: Lang): string => PROPS[lang]?.[key] ?? PROPS.tr[key] ?? '';
