import racesJson from '../../data/races.json';
import classesJson from '../../data/classes.json';
import armorJson from '../../data/armor.json';
import weaponsJson from '../../data/weapons.json';
import spellsJson from '../../data/spells.json';
import itemsJson from '../../data/items.json';
import environmentsJson from '../../data/environments.json';
import spellSlotsJson from '../../data/spell-slots.json';
import conditionsJson from '../../data/conditions.json';
import type {
  Armor, CharacterClass, ClassMechanics, ClassProgression, ConditionList, Environment, Item, Monster, Race, Spell, SpellSlotTables, SrdFeat, Weapon,
} from './types';

export * from './types';

export const races = racesJson as Race[];
export const classes = classesJson as CharacterClass[];
export const armor = armorJson as Armor[];
export const weapons = weaponsJson as Weapon[];
export const spells = spellsJson as Spell[];
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
let monstersLoading: Promise<Monster[]> | null = null;
export const monstersLoaded = () => monsters.length > 0;
export function loadMonsters(): Promise<Monster[]> {
  monstersLoading ??= Promise.all([import('../../data/monsters.json'), import('../../data/attack-riders.json')]).then(([m, r]) => {
    if (monsters.length === 0) monsters.push(...(m.default as Monster[]));
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
export const classData: { progression: ClassProgression[]; mechanics: ClassMechanics; feats: SrdFeat[] } = {
  progression: [], mechanics: { resources: {}, features: {}, feats: {} }, feats: [],
};
let classLoading: Promise<void> | null = null;
export const classDataLoaded = () => classData.progression.length > 0;
export function loadClassData(): Promise<void> {
  classLoading ??= Promise.all([
    import('../../data/srd/progression.json'), import('../../data/class-features.json'), import('../../data/srd/feats.json'),
  ]).then(([p, m, f]) => {
    if (classDataLoaded()) return;
    classData.mechanics = m.default as unknown as ClassMechanics;
    classData.feats = (f.default as unknown as { feats: SrdFeat[] }).feats;
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
