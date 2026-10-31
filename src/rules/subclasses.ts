/**
 * Alt sınıf kaydı (Görev E1): SRD alt sınıfları (`data/subclasses.json`, sınıf verisiyle tembel) ve dış içerik
 * paketlerinden gelenler (`setExternalSubclasses`; yalnızca JSON veri, kod çalıştırılmaz). İkisi de aynı jenerik
 * şemada; motor ve oluşturucu ayrım yapmaz. Saf: depolama ve dosya okuma `src/content/`.
 */
import { classData, classDataLoaded, type FeatureMechanic, type LocalText, type SubclassDef } from '../data';

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

/** Seçimde görünen alt sınıflar (kopyalarda politikaya göre tek sürüm). */
export function visibleSubclasses(classId: string, p: DuplicatePolicy = policy): SubclassDef[] {
  const srd = classData.subclasses.filter((s) => s.class === classId);
  const ext = external.filter((s) => s.class === classId);
  if (p === 'ikisi') return [...srd, ...ext];
  if (p === 'srd') return [...srd, ...ext.filter((e) => !srd.some((x) => sameAs(e, x)))];
  return [...srd.filter((x) => !ext.some((e) => sameAs(e, x))), ...ext];
}

/** Kimlikle alt sınıf: aynı kimlikte görünen sürüm önce (paket politikasında paket). */
export const findSubclass = (classId: string, id: string | undefined): SubclassDef | undefined =>
  id ? visibleSubclasses(classId).find((s) => s.id === id) ?? subclassDefs(classId).find((s) => s.id === id) : undefined;

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
export const subclassLabel = (name: LocalText, lang: 'tr' | 'en'): string =>
  (lang === 'tr' && name.tr && name.en && name.tr !== name.en ? `${name.tr} (${name.en})` : textOf(name, lang));
