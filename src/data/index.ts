import racesJson from '../../data/races.json';
import classesJson from '../../data/classes.json';
import armorJson from '../../data/armor.json';
import weaponsJson from '../../data/weapons.json';
import itemsJson from '../../data/items.json';
import environmentsJson from '../../data/environments.json';
import spellSlotsJson from '../../data/spell-slots.json';
import conditionsJson from '../../data/conditions.json';
import { betimlemeOf, descriptionShown, type Lang, type SpellDescriptions } from './betimleme';
import type {
  Armor, CharacterClass, ClassMechanics, ClassProgression, ConditionList, Environment, Item, Monster, Race, Spell, SpellSlotTables, SrdFeat, SrdMastery, SrdWeapon, SubclassDef, Weapon,
} from './types';

export * from './types';

export const races = racesJson as Race[];
export const classes = classesJson as CharacterClass[];
export const armor = armorJson as Armor[];
export const weapons = weaponsJson as Weapon[];
/**
 * Büyüler: Kuyruk K57'den beri 0–3. seviye de (`data/spells.json`, ~120 kB) `loadClassData()` ile gelir (ana parça
 * bütçesi); 4.–5. (Kuyruk 40) ve 6.–9. seviye (Kuyruk 19) ardından. Dizi aynı nesnedir, yüklenince içi dolar. Giriş ekranı
 * büyü okumaz; karakter, Game Master ve savaş ekranları sınıf verisini bekler (`App.tsx` `useClassData`).
 */
export const spells: Spell[] = [];
export const items = itemsJson as Item[];
export const environments = environmentsJson as Environment[];
/**
 * Canavarlar (330 kayıt, ~480 KB) açılışta yüklenmez: `loadMonsters()` dinamik import ile doldurur.
 * Liste aynı dizi nesnesidir (yüklenince içi dolar); yüklenmeden `getMonster` "yüklenmedi" hatası verir.
 */
export const monsters: Monster[] = [];
/**
 * Canavar saldırı ek etkileri (`data/attack-riders.json`, battle/riders.ts okur). Yalnızca canavarlarla
 * birlikte gerekir; aynı tembel yüklemede doldurulur.
 */
export const attackRiders: Record<string, unknown> = {};
/** Kuyruk 19: SRD canavar büyüleri (`data/canavar-buyuleri.json`, betik üretir); canavarlarla birlikte yüklenir. */
export const monsterSpells: Record<string, unknown> = {};
let monstersLoading: Promise<Monster[]> | null = null;
export const monstersLoaded = () => monsters.length > 0;
export function loadMonsters(): Promise<Monster[]> {
  monstersLoading ??= Promise.all([import('../../data/monsters.json'), import('../../data/attack-riders.json'), import('../../data/canavar-buyuleri.json')]).then(([m, r, sp]) => {
    if (monsters.length === 0) monsters.push(...(m.default as Monster[]));
    Object.assign(monsterSpells, sp.default);
    Object.assign(attackRiders, (r.default as { attacks: Record<string, unknown> }).attacks);
    return monsters;
  });
  return monstersLoading;
}
/**
 * Sınıf ilerlemesi (SRD tablosu, ~55 KB), özellik mekaniği ve feat'ler açılışta yüklenmez: `loadClassData()`
 * dinamik import ile doldurur (ana parça 500 kB altında kalır). Uygulama karakter ekranlarından önce yükler;
 * testler `test-setup.ts`, simülasyon `await loadClassData()` ile.
 */
export const classData: {
  progression: ClassProgression[]; mechanics: ClassMechanics; feats: SrdFeat[]; srdWeapons: SrdWeapon[]; masteries: SrdMastery[];
  /** SRD alt sınıfları jenerik şemada (data/subclasses.json; Görev E1). */
  subclasses: SubclassDef[];
} = {
  progression: [], mechanics: { resources: {}, features: {}, feats: {}, masteries: {} }, feats: [], srdWeapons: [], masteries: [], subclasses: [],
};
/** Kuyruk B2: büyü kimliği → dil → betimleme (`loadClassData` doldurur; yüklenene dek boş). */
export const spellDescriptions: SpellDescriptions = {};
/** Betimleme verisi erişimi (istenen dil, yoksa tr). Arayüz için `spellDescriptionShown`. */
export const spellDescriptionOf = (id: string, lang: Lang): string | undefined => betimlemeOf(spellDescriptions, id, lang);
/** Arayüz erişimi: yalnız o dilin kendi metni; EN modunda `en` yoksa gizli. */
export const spellDescriptionShown = (id: string, lang: Lang): string | undefined => descriptionShown(spellDescriptions, id, lang);
/**
 * Görev SD4: Türkçe açıklamalar (`data/aciklamalar-tr.json`; ad İngilizce kalır, açıklama Türkçe). Tür → kimlik → metin;
 * `loadClassData` doldurur, yüklenene dek boş. EN arayüzde gösterilmez (yalnız Türkçe notu çıkar).
 */
export type AciklamaTuru = 'buyu' | 'esya' | 'tur' | 'yetenek' | 'altsinif' | 'invocation';
export const trDescriptions: Record<AciklamaTuru, Record<string, string>> = { buyu: {}, esya: {}, tur: {}, yetenek: {}, altsinif: {}, invocation: {} };
export const trAciklama = (tur: AciklamaTuru, id: string): string | undefined => trDescriptions[tur][id];
let classLoading: Promise<void> | null = null;
export const classDataLoaded = () => classData.progression.length > 0;
export function loadClassData(): Promise<void> {
  classLoading ??= Promise.all([
    import('../../data/srd/progression.json'), import('../../data/class-features.json'), import('../../data/srd/feats.json'),
    import('../../data/srd/weapons.json'), import('../../data/subclasses.json'), import('../../data/spells-45.json'),
    import('../../data/items-srd.json'), import('../../data/spells-69.json'), import('../../data/karadul.json'), import('../../data/imza.json'),
    import('../../data/spells.json'), import('../../data/buyu-betimleme.json'), import('../../data/aciklamalar-tr.json'),
  ]).then(([p, m, f, w, sc, s45, isrd, s69, kd, imza, s03, bet, atr]) => {
    if (classDataLoaded()) return;
    // Kuyruk B2: büyü betimlemeleri (yalnız görünüm; ana parçaya girmez, sınıf verisiyle tembel gelir).
    const { _aciklama: _a, ...descriptions } = bet.default as unknown as SpellDescriptions & { _aciklama?: unknown };
    Object.assign(spellDescriptions, descriptions);
    // Görev SD4: Türkçe açıklamalar (büyü, eşya, tür özelliği, sınıf/alt sınıf özelliği, Invocation).
    const { _aciklama: _b, ...turler } = atr.default as unknown as Record<string, unknown>;
    for (const k of Object.keys(trDescriptions) as AciklamaTuru[]) Object.assign(trDescriptions[k], (turler[k] ?? {}) as Record<string, string>);
    // Kuyruk 19 (görev 7): SRD'nin geri kalan eşyaları (ana parça sınırı; oluşturucu ve savaştan önce yüklenir).
    const moreItems = (isrd.default as unknown as Item[]).filter((x) => !items.some((y) => y.id === x.id));
    items.push(...moreItems);
    // Kuyruk 40: 4.–5. seviye büyüler (yalnızca 7+ seviye karakterler; ana parça sınırı) sınıf verisiyle gelir.
    // Kuyruk 19 (görev 3): 6.–9. seviye büyüler (`data/spells-69.json`, scripts/k19-buyu-69.py).
    // Kuyruk K57: 0–3. seviye büyüler önce (sıra eskisi gibi: 0–3, 4–5, 6–9).
    if (spells.length === 0) spells.push(...(s03.default as unknown as Spell[]));
    const more = [...(s45.default as unknown as Spell[]), ...(s69.default as unknown as Spell[])].filter((s) => !spells.some((x) => x.id === s.id));
    spells.push(...more);
    // Kuyruk K48: ev kuralı alt sınıfı Karadul Çemberi (data/karadul.json) SRD alt sınıflarının ardından.
    // Kuyruk K50: imza alt sınıflar (data/imza.json; ev kuralı) ve kaynakları (dinlenme yenilemesi sınıf kaynaklarıyla aynı yoldan).
    const im = imza.default as unknown as { altSiniflar: SubclassDef[]; kaynaklar: ClassMechanics['resources'] };
    classData.subclasses = [...(sc.default as unknown as { subclasses: SubclassDef[] }).subclasses, (kd.default as unknown as { subclass: SubclassDef }).subclass, ...im.altSiniflar];
    const mech = m.default as unknown as ClassMechanics;
    classData.mechanics = { ...mech, resources: { ...mech.resources, ...im.kaynaklar } };
    classData.feats = (f.default as unknown as { feats: SrdFeat[] }).feats;
    const sw = w.default as unknown as { weapons: SrdWeapon[]; masteries: SrdMastery[] };
    classData.srdWeapons = sw.weapons;
    classData.masteries = sw.masteries;
    classData.progression = (p.default as unknown as { classes: ClassProgression[] }).classes;
  });
  return classLoading;
}
/** Sınıfın SRD ilerleme tablosu; veri yüklenmediyse anlaşılır hata. */
export function getProgression(classId: string): ClassProgression {
  if (!classDataLoaded()) throw new Error('Sınıf verisi henüz yüklenmedi (önce loadClassData).');
  return byId(classData.progression, classId, 'Sınıf ilerlemesi');
}
export const spellSlots = spellSlotsJson as SpellSlotTables;
export const conditions = conditionsJson as ConditionList;

/** id'ye göre kayıt bulur, yoksa anlaşılır bir hata verir. */
function byId<T extends { id: string }>(list: T[], id: string, what: string): T {
  const found = list.find((x) => x.id === id);
  if (!found) throw new Error(`${what} bulunamadı: "${id}"`);
  return found;
}

export const getRace = (id: string) => byId(races, id, 'Irk');
export const getClass = (id: string) => byId(classes, id, 'Sınıf');
export const getEnvironment = (id: string) => byId(environments, id, 'Ortam');
export const getMonster = (id: string) => {
  if (!monstersLoaded()) throw new Error('Canavar verisi henüz yüklenmedi (önce loadMonsters).');
  return byId(monsters, id, 'Canavar');
};
