/**
 * Görev K18: sihirbazdaki kısa açıklamalar (`data/aciklamalar.json`): sınıf özelliği özeti, Weapon Mastery ve silah
 * özellikleri. Yalnızca oluşturucu (Builder, tembel parça) içe aktarır; ana parçaya girmez.
 */
import { ilkelOzet } from './ilkelOzet';
import data from '../../data/aciklamalar.json';
import srdSpecies from '../../data/srd/species.json';
import { trAciklama } from '../data';
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
  // Görev SD4: elle yazılmış Türkçe açıklama (data/aciklamalar-tr.json) önce; yalnız Türkçe arayüzde.
  const sd4 = lang === 'tr' ? trAciklama(f.from === 'subclass' ? 'altsinif' : 'yetenek', f.key) : undefined;
  if (sd4) return sd4;
  if (f.from === 'subclass') {
    const feat = findSubclass(classId, subclassId)?.features.find((x) => x.id === f.id);
    const d = feat?.description;
    // Görev P7: ilkelli (ek paket) özellikte ilkel özeti.
    const oz = ilkelOzet(feat?.ilkeller as Array<{ tur: string }> | undefined);
    return [d ? firstSentence(d[lang] ?? d.tr ?? '') : '', oz ? `[${oz}]` : ''].filter(Boolean).join(' ');
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

/** Görev SD3: sınıf ve türün tek cümlelik oyun dili tanıtımı (`data/aciklamalar.json` classes/races; yoksa boş). */
export const classBlurb = (id: string, lang: Lang): string => (data as unknown as { classes: Texts }).classes?.[lang]?.[id] ?? '';
export const raceBlurb = (id: string, lang: Lang): string => (data as unknown as { races: Texts }).races?.[lang]?.[id] ?? '';

/**
 * Görev SD4: türün SRD özelliklerinin Türkçe açıklamaları ("Breath Weapon: …", ad İngilizce) satır satır (ⓘ metni).
 * İngilizce arayüzde boş (açıklama yalnız Türkçe; ⓘ başka metin gösterir).
 */
export function raceTraitLines(raceId: string, lang: Lang): string[] {
  if (lang !== 'tr') return [];
  const race = srdSpecies.species.find((x) => x.id === raceId);
  return (race?.traits ?? []).flatMap((tr) => { const d = trAciklama('tur', `${raceId}/${tr.id}`); return d ? [`${tr.name}: ${d}`] : []; });
}
