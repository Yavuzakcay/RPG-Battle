/**
 * Alt sınıf kaydı (Görev E1): SRD alt sınıfları (`data/subclasses.json`, sınıf verisiyle tembel) ve dış içerik
 * paketlerinden gelenler (`setExternalSubclasses`; yalnızca JSON veri, kod çalıştırılmaz). İkisi de aynı jenerik
 * şemada; motor ve oluşturucu ayrım yapmaz. Saf: depolama ve dosya okuma `src/content/`.
 */
import { classData, classDataLoaded, type FeatureMechanic, type LocalText, type SubclassDef } from '../data';
import view from '../../data/alt-sinif-gorunum.json';

let external: SubclassDef[] = [];

/** Etkin dış içerik alt sınıfları (uygulama açılışta ve ayarlar değişince yazar; testler sıfırlar). */
export function setExternalSubclasses(list: SubclassDef[]): void {
  external = [...list];
}
export const externalSubclasses = (): SubclassDef[] => external;

/** Sınıfın alt sınıfları: önce SRD, sonra dış içerik. */
export function subclassDefs(classId: string): SubclassDef[] {
  return [...classData.subclasses.filter((s) => s.class === classId), ...external.filter((s) => s.class === classId)];
}

/**
 * Kuyruk 25: dış paket alt sınıfı SRD alt sınıfının kopyası mı (aynı sınıf ve aynı kimlik ya da aynı TR/EN ad). Seçimde
 * yalnızca politikanın sürümü görünür: `paket` (varsayılan; SRD gizlenir), `srd` (paket gizlenir), `ikisi`. Veri silinmez.
 */
export type DuplicatePolicy = 'paket' | 'srd' | 'ikisi';
export const DUPLICATE_POLICIES: DuplicatePolicy[] = ['paket', 'srd', 'ikisi'];
let policy: DuplicatePolicy = 'paket';
export const setDuplicatePolicy = (p: DuplicatePolicy): void => { policy = DUPLICATE_POLICIES.includes(p) ? p : 'paket'; };
export const duplicatePolicy = (): DuplicatePolicy => policy;
const norm = (x: string | undefined) => (x ?? '').trim().toLocaleLowerCase('tr');
const sameAs = (a: SubclassDef, b: SubclassDef) => a.class === b.class
  && (a.id === b.id || (!!norm(a.name.tr) && norm(a.name.tr) === norm(b.name.tr)) || (!!norm(a.name.en) && norm(a.name.en) === norm(b.name.en)));

/**
 * Kuyruk K48: ev kuralı alt sınıfı oluşturucuda görünür mü (Ayarlar anahtarı; kadın kısıtı açıkken yalnız kadın
 * karakter). Karakterin mevcut seçimi her zaman görünür (eski kayıt bozulmaz). SRD/dış içerik alt sınıfı hep görünür.
 */
export function houseSubclassVisible(sub: SubclassDef, sheet: { subclassId?: string; gender?: string }, enabled: boolean, womenOnly: boolean): boolean {
  return !sub.ev || sub.id === sheet.subclassId || (enabled && (!womenOnly || sheet.gender === 'kadin'));
}

/**
 * Görev P0: ek paket alt sınıfının hiç çalışan (çalışır/kısmi) özelliği yoksa seçim listesinde görünmez (veri silinmez;
 * çalışır oldukça görünür; seçili eski karakter `findSubclass` ile bulunur). Tam çalışmayan alt sınıf "Deneysel".
 */
export const packSelectable = (s: SubclassDef): boolean => !s.pack || s.features.some((f) => f.status === 'calisir' || f.status === 'kismi');
export const packExperimental = (s: SubclassDef): boolean => !!s.pack && s.features.some((f) => f.status !== 'calisir' && f.status !== 'hikaye');

/** Seçimde görünen alt sınıflar (kopyalarda politikaya göre tek sürüm). */
export function visibleSubclasses(classId: string, p: DuplicatePolicy = policy): SubclassDef[] {
  const srd = classData.subclasses.filter((s) => s.class === classId);
  const ext = external.filter((s) => s.class === classId && packSelectable(s));
  if (p === 'ikisi') return withoutRemoved([...srd, ...ext]);
  if (p === 'srd') return withoutRemoved([...srd, ...ext.filter((e) => !srd.some((x) => sameAs(e, x)))]);
  return withoutRemoved([...srd.filter((x) => !ext.some((e) => sameAs(e, x))), ...ext]);
}

/**
 * Kuyruk K49 B5 (kullanıcı kararı): listeden kaldırılan alt sınıflar (`data/alt-sinif-gorunum.json` `kaldirilan`; kimlik
 * ya da EN ad, SRD ve dış paket kopyası birlikte). Sınıfın başka seçeneği kalmıyorsa liste olduğu gibi (son alt sınıf
 * kalır). Veri silinmez: kayıtlı karakter açılır, motor bulur (`findSubclass` → `subclassDefs`).
 */
export const isRemovedSubclass = (s: SubclassDef): boolean =>
  view.kaldirilan.some((r) => r.id === s.id || (!!r.en && norm(r.en) === norm(s.name.en)));
function withoutRemoved(list: SubclassDef[]): SubclassDef[] {
  const kept = list.filter((s) => !isRemovedSubclass(s));
  // Kuyruk K50: ev kuralı alt sınıfları (Karadul, imza) seçenek sayılmaz: SRD/paket seçeneği kalmazsa kaldırılan kalır.
  return kept.some((s) => !s.ev) ? kept : list;
}

/** Kuyruk K49 B4/B7: görünen ad: parantezli takma ad yalnız takma adla; Cleric "… Alanı" → "… Manastırı"; istisnalar (Barış → Birlik). */
export function displayName(name: LocalText, classId?: string): LocalText {
  const alias = (x: string) => /^.+\s*\(([^()]+)\)\s*$/.exec(x)?.[1]?.trim() ?? x;
  let tr = alias(name.tr ?? '');
  const en = alias(name.en ?? '');
  for (const k of view.adKurallari) if ((!classId || k.sinif === classId) && tr.endsWith(k.sonEk)) tr = `${tr.slice(0, -k.sonEk.length)}${k.yeni}`;
  const ex = (view.istisnalar as Record<string, LocalText>)[tr] ?? (view.istisnalar as Record<string, LocalText>)[name.tr ?? ''];
  return ex ? { tr: ex.tr, en: ex.en } : { tr, en };
}

/** Kimlikle alt sınıf: aynı kimlikte görünen sürüm önce (paket politikasında paket). */
export const findSubclass = (classId: string, id0: string | undefined): SubclassDef | undefined => {
  // Kuyruk K50: eski kimlik (dış paketin Barış Alanı) imza alt sınıfına (Birlik Manastırı) yönlenir.
  const id = id0 ? (view.eskiKimlik as Record<string, string>)[id0] ?? id0 : undefined;
  return id ? visibleSubclasses(classId).find((s) => s.id === id) ?? subclassDefs(classId).find((s) => s.id === id) : undefined;
};

/** Karakterin alt sınıfı seçilmiş ama kayıtta yok (dış içerik silindi ya da kapalı): "içerik eksik". */
export const subclassMissing = (classId: string, id: string | undefined): boolean =>
  !!id && classDataLoaded() && !findSubclass(classId, id);

/** Bütün alt sınıf kimlikleri (çakışma denetimi için; SRD + dış içerik). */
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
