/**
 * Alt sınıf kaydı (Görev E1; Görev AS2 tek kaynak): oyunun kendi alt sınıfları (imza `data/imza.json` + Karadul
 * `data/karadul.json`; sınıf verisiyle tembel, `classData.subclasses`) ve dış içerik paketlerinden gelenler
 * (`setExternalSubclasses`; yalnızca JSON veri, kod çalıştırılmaz; SRD'nin 12 alt sınıfı da artık pakette). Hepsi aynı
 * jenerik şemada; motor ve oluşturucu ayrım yapmaz. Saf: depolama ve dosya okuma `src/content/`.
 */
import { classData, classDataLoaded, type FeatureMechanic, type LocalText, type SubclassDef } from '../data';
import view from '../../data/alt-sinif-gorunum.json';

let external: SubclassDef[] = [];
const norm = (x: string | undefined) => (x ?? '').trim().toLocaleLowerCase('tr');

/** Etkin dış içerik alt sınıfları (uygulama açılışta ve ayarlar değişince yazar; testler sıfırlar). */
export function setExternalSubclasses(list: SubclassDef[]): void {
  external = [...list];
}
export const externalSubclasses = (): SubclassDef[] => external;

/** Sınıfın alt sınıfları: önce oyunun kendi (imza, Karadul), sonra dış içerik. */
export function subclassDefs(classId: string): SubclassDef[] {
  return [...classData.subclasses.filter((s) => s.class === classId), ...external.filter((s) => s.class === classId)];
}

/**
 * Görev AS2: cinsiyet kuralı alt sınıfın kendisinde (`cinsiyet`; Karadul Çemberi yalnız kadın, İmparator yalnız erkek):
 * oluşturucuda yalnız o cinsiyette görünür. Karakterin mevcut seçimi her zaman görünür (eski kayıt bozulmaz).
 */
export function genderVisible(sub: Pick<SubclassDef, 'id' | 'cinsiyet'>, sheet: { subclassId?: string; gender?: string }): boolean {
  return !sub.cinsiyet || sub.id === sheet.subclassId || sub.cinsiyet === sheet.gender;
}

/**
 * GORSEL-DUZELTME: oluşturucuda cinsiyet DEĞİŞTİRİLİRKEN seçili alt sınıfın cinsiyet kuralı (`cinsiyet`) yeni cinsiyete uymuyorsa
 * yerine geçecek alt sınıf: sınıfın varsayılanı (`alt-sinif-gorunum.json` `varsayilan`; sihirbaz önerisi) yeni cinsiyete uyuyorsa o,
 * yoksa listede yeni cinsiyete uyan ilk alt sınıf (hiçbiri yoksa `to` boş). Kısıt yoksa ya da uyuyorsa null. Yalnız cinsiyet
 * değişiminde çağrılır: kayıtlı karakter açılırken uygulanmaz ("mevcut seçim hep görünür", `genderVisible`).
 */
export function subclassForGender(classId: string, subclassId: string | undefined, gender: 'erkek' | 'kadin'): { from: string; to: string | undefined } | null {
  const cur = subclassId ? findSubclass(classId, subclassId) : undefined;
  if (!cur?.cinsiyet || cur.cinsiyet === gender) return null;
  const fits = (s: Pick<SubclassDef, 'cinsiyet'> | undefined) => !!s && (!s.cinsiyet || s.cinsiyet === gender);
  const list = visibleSubclasses(classId);
  const def = list.find((s) => s.id === defaultSubclassId(classId));
  return { from: cur.id, to: (fits(def) ? def : list.find(fits))?.id };
}

/** Görev P0: tam çalışmayan (kısmi/planlı/çalışmıyor özelliği olan) paket alt sınıfı "Deneysel" (seçilebilir). */
export const packExperimental = (s: SubclassDef): boolean => !!s.pack && s.features.some((f) => f.status !== 'calisir' && f.status !== 'hikaye');
/** Görev AS2: alt sınıfın savaşta çalışmayan (planlı/çalışmıyor) özellik sayısı (kartta etiket; alt sınıf yine seçilir). */
export const notWorkingCount = (s: SubclassDef): number => s.features.filter((f) => f.status === 'planli' || f.status === 'calismiyor').length;

/**
 * Seçimde görünen alt sınıflar (Görev AS2: tek liste, hepsi her zaman seçilebilir; yalnız `kaldirilan` (Barış Alanı, Yaşam
 * Manastırı) çıkar). Kaynak: imza + Karadul (`classData.subclasses`) ve dış paket (`setExternalSubclasses`). Aç/kapa, kopya
 * politikası ve "çalışan özelliği yoksa gizle" ayrımı yok.
 */
export function visibleSubclasses(classId: string): SubclassDef[] {
  return subclassDefs(classId).filter((s) => !isRemovedSubclass(s));
}

/**
 * Kuyruk K49 B5 / Görev AS2: listeden kaldırılan alt sınıflar (`data/alt-sinif-gorunum.json` `kaldirilan`; kimlik ya da
 * EN ad). Veri silinmez: kayıtlı karakter açılır, motor bulur (`findSubclass` → `subclassDefs`).
 */
export const isRemovedSubclass = (s: SubclassDef): boolean =>
  view.kaldirilan.some((r) => r.id === s.id || (!!r.en && norm(r.en) === norm(s.name.en)));

/**
 * Görev AS2: alt sınıf seviyesindeki eski kayıtta boş kalan alt sınıfa atanan ve sihirbazın önerdiği alt sınıf
 * (`data/alt-sinif-gorunum.json` `varsayilan`; eskiden SRD'nin tek alt sınıfı, kimlikler aynı). Kayıtta yoksa (içerik
 * yüklenmemiş) undefined: atama yapılmaz.
 */
export const defaultSubclassId = (classId: string): string | undefined => {
  const id = (view.varsayilan as Record<string, string | undefined>)[classId];
  return id && visibleSubclasses(classId).some((s) => s.id === id) ? id : undefined;
};

/** Kuyruk K49 B4/B7: görünen ad: parantezli takma ad yalnız takma adla; Cleric "… Alanı" → "… Manastırı"; istisnalar (Barış → Birlik). */
export function displayName(name: LocalText, classId?: string): LocalText {
  const alias = (x: string) => /^.+\s*\(([^()]+)\)\s*$/.exec(x)?.[1]?.trim() ?? x;
  let tr = alias(name.tr ?? '');
  const en = alias(name.en ?? '');
  for (const k of view.adKurallari) if ((!classId || k.sinif === classId) && tr.endsWith(k.sonEk)) tr = `${tr.slice(0, -k.sonEk.length)}${k.yeni}`;
  const ex = (view.istisnalar as Record<string, LocalText>)[tr] ?? (view.istisnalar as Record<string, LocalText>)[name.tr ?? ''];
  return ex ? { tr: ex.tr, en: ex.en } : { tr, en };
}

/**
 * 2026-11-21: paketten silinen alt sınıfın yedek karşılığı (`data/alt-sinif-gorunum.json` `yedekKimlik`: Yaşam Manastırı
 * `life-domain` → Birlik Manastırı). Kayıtlı karakter açılışta bir kez yeni kimliğe yazılır (`migrateSubclasses`). Yedek değilse undefined.
 */
export const legacySubclassTarget = (id: string | undefined): string | undefined =>
  id ? (view.yedekKimlik as Record<string, string | undefined>)[id] : undefined;

/**
 * Etkin alt sınıf kimliği: `yedekKimlik`teki kimlik kayıtta yoksa (uygulamada hep; test fikstüründe mekanik yüklü kalır)
 * yeni karşılığına yönlenir. Savaş kurulumu (`create.ts`) imza denetimini bununla yapar.
 */
export const effectiveSubclassId = (classId: string, id: string | undefined): string | undefined => {
  const to = legacySubclassTarget(id);
  return to && !subclassDefs(classId).some((s) => s.id === id) ? to : id;
};

/** Kimlikle alt sınıf (görünen liste önce, sonra bütün kayıt). */
export const findSubclass = (classId: string, id0: string | undefined): SubclassDef | undefined => {
  // Kuyruk K50: eski kimlik (dış paketin Barış Alanı) imza alt sınıfına (Birlik Manastırı) her zaman yönlenir;
  // 2026-11-21 Yaşam Manastırı kayıtta yoksa (`effectiveSubclassId`).
  const id = id0 ? (view.eskiKimlik as Record<string, string>)[id0] ?? effectiveSubclassId(classId, id0) : undefined;
  return id ? visibleSubclasses(classId).find((s) => s.id === id) ?? subclassDefs(classId).find((s) => s.id === id) : undefined;
};

/** Karakterin alt sınıfı seçilmiş ama kayıtta yok (dış içerik silindi ya da kapalı): "içerik eksik". */
export const subclassMissing = (classId: string, id: string | undefined): boolean =>
  !!id && classDataLoaded() && !findSubclass(classId, id);

/** Görev AS2: kimlik başka bir sınıfın alt sınıfı mı (oluşturucu yalnız bunu temizler; kayıtta olmayan kimlik "içerik eksik" kalır). */
export const isOtherClassSubclass = (classId: string, id: string): boolean => [...classData.subclasses, ...external].some((s) => s.id === id && s.class !== classId);

/** Bütün alt sınıf kimlikleri (çakışma denetimi için; kendi + dış içerik). */
export const allSubclassIds = (): string[] => [...classData.subclasses, ...external].map((s) => s.id);

/** Alt sınıf özelliğinin mekaniği (`sınıf/altsınıf:özellik`). */
export function subclassMechanic(key: string): FeatureMechanic | undefined {
  const m = /^([^/]+)\/([^:]+):(.+)$/.exec(key);
  if (!m) return undefined;
  return findSubclass(m[1] as string, m[2])?.features.find((f) => f.id === m[3])?.effect;
}

/** Dile göre metin (eksikse öbür dil). */
export const textOf = (x: LocalText, lang: 'tr' | 'en'): string => x[lang] || x[lang === 'tr' ? 'en' : 'tr'];

/** Görev K4: alt sınıfın seçim listesindeki adı; Türkçede İngilizce SRD adı ayraç içinde ("Evokasyon Ustası (Evoker)"). */
export const subclassLabel = (name0: LocalText, lang: 'tr' | 'en', classId?: string): string => {
  const name = displayName(name0, classId);
  return lang === 'tr' && name.tr && name.en && name.tr !== name.en ? `${name.tr} (${name.en})` : textOf(name, lang);
};

/** SD5: oyuncu ekranında alt sınıf adı, parantezli ek (İngilizce ad, durum etiketi) olmadan. */
export const subclassPlainName = (name0: LocalText, lang: 'tr' | 'en', classId?: string): string => textOf(displayName(name0, classId), lang);
