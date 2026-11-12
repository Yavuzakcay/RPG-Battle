/**
 * Görev K18: sihirbazdaki kısa açıklamalar (`data/aciklamalar.json`): sınıf özelliği özeti, Weapon Mastery ve silah
 * özellikleri. Yalnızca oluşturucu (Builder, tembel parça) içe aktarır; ana parçaya girmez.
 */
import { ilkelOzet } from './ilkelOzet';
import data from '../../data/aciklamalar.json';
import TR_DATA from '../../data/aciklamalar-tr.json';
import { t } from '../i18n';
import OZELLIK_ADLARI from '../../data/ozellik-adlari.json';
import DONANIM_ADLARI from '../../data/donanim-adlari.json';
import { findSubclass } from '../rules/subclasses';
import type { Weapon } from '../data/types';
import type { Lang } from '../i18n/strings';

type Texts = Record<Lang, Record<string, string>>;
/** Görev SD4: sınıf özelliği özetleri yalnız Türkçe (eski `en` SRD'nin ilk cümlesiydi, kaldırıldı). */
const FEATURES_TR = data.features.tr as Record<string, string>;
const MASTERY = data.mastery as Texts;
const PROPS = data.properties as Texts;

/**
 * Görev SD4: Türkçe açıklaması olan kaydın gösterilecek metni. Türkçe arayüzde metnin kendisi; İngilizce arayüzde
 * "açıklama yalnız Türkçe" notu (SRD ham metni gösterilmez). Açıklama yoksa boş.
 */
export function trText(tr: string | undefined, lang: Lang): string {
  if (!tr) return '';
  return lang === 'tr' ? tr : t().builder.trOnly;
}

const ITEMS_TR = TR_DATA.esyalar as Record<string, string>;
const SPECIES_TR = TR_DATA.turOzellikleri as Record<string, { ad: string; tr: string }>;

/** Görev SD4: eşyanın kısa Türkçe açıklaması (`data/aciklamalar-tr.json` esyalar; EN'de not). */
export const itemDescription = (id: string, lang: Lang): string => trText(ITEMS_TR[id], lang);

/** Görev SD4: türün SRD özellikleri, adı İngilizce + açıklaması (`species:<tür>/<özellik>`; EN'de not). Tür SRD'de yoksa boş. */
export function speciesTraits(raceId: string, lang: Lang): Array<{ key: string; name: string; text: string }> {
  return Object.entries(SPECIES_TR).filter(([k]) => k.startsWith(`${raceId}/`)).map(([k, v]) => ({ key: k, name: v.ad, text: trText(v.tr, lang) }));
}

const firstSentence = (t: string) => (t.match(/^.+?[.!?](\s|$)/)?.[0] ?? t).trim();

/** Sınıf ya da alt sınıf özelliğinin tek cümlelik özeti (yoksa boş). */
export function featureSummary(f: { key: string; id: string; from: 'class' | 'subclass' }, classId: string, subclassId: string | undefined, lang: Lang): string {
  if (f.from === 'subclass') {
    const feat = findSubclass(classId, subclassId)?.features.find((x) => x.id === f.id);
    const d = feat?.description;
    // Görev P7: ilkelli (ek paket) özellikte ilkel özeti.
    const oz = ilkelOzet(feat?.ilkeller as Array<{ tur: string }> | undefined);
    return [d ? firstSentence(d[lang] ?? d.tr ?? '') : '', oz ? `[${oz}]` : ''].filter(Boolean).join(' ');
  }
  return trText(FEATURES_TR[f.key], lang);
}

/**
 * Görev SD3: sınıf ya da alt sınıf özelliğinin gösterilecek düz Türkçe adı (`data/ozellik-adlari.json`, alt sınıfta
 * `subclasses.json` TR adı) ve İngilizce kural adı (yalnızca ⓘ'de). Veri kimlikleri değişmez.
 */
export function featureLabel(f: { key: string; id: string; name: string; from: 'class' | 'subclass' }, classId: string, subclassId: string | undefined, lang: Lang): { name: string; en: string } {
  if (f.from === 'subclass') {
    const n = findSubclass(classId, subclassId)?.features.find((x) => x.id === f.id)?.name;
    return { name: (lang === 'tr' ? n?.tr : n?.en) || f.name, en: n?.en || f.name };
  }
  const tr = (OZELLIK_ADLARI.tr as Record<string, string>)[f.key];
  return { name: lang === 'tr' && tr ? tr : f.name, en: f.name };
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

/**
 * Görev SD3: silah ve zırhın gösterilecek düz Türkçe adı (`data/donanim-adlari.json`); veride ya da İngilizce arayüzde
 * kayıttaki (SRD) ad. Kayıt alanları ve kimlikler değişmez.
 */
export function gearName(kind: 'silah' | 'zirh', name: string, lang: Lang): string {
  if (lang !== 'tr') return name;
  return (DONANIM_ADLARI[kind] as Record<string, string>)[name] ?? name;
}

/** Görev SD3: sınıf ve türün tek cümlelik oyun dili tanıtımı (`data/aciklamalar.json` classes/races; yoksa boş). */
export const classBlurb = (id: string, lang: Lang): string => (data as unknown as { classes: Texts }).classes?.[lang]?.[id] ?? '';
export const raceBlurb = (id: string, lang: Lang): string => (data as unknown as { races: Texts }).races?.[lang]?.[id] ?? '';
