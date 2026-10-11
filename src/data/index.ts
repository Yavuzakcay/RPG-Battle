import racesJson from '../../data/races.json';
import classesJson from '../../data/classes.json';
import armorJson from '../../data/armor.json';
import weaponsJson from '../../data/weapons.json';
import spellsJson from '../../data/spells.json';
import itemsJson from '../../data/items.json';
import environmentsJson from '../../data/environments.json';
import monstersJson from '../../data/monsters.json';
import spellSlotsJson from '../../data/spell-slots.json';
import conditionsJson from '../../data/conditions.json';
import type {
  Armor, CharacterClass, ConditionList, Environment, Item, Monster, Race, Spell, SpellSlotTables, Weapon,
} from './types';

export * from './types';

export const races = racesJson as Race[];
export const classes = classesJson as CharacterClass[];
export const armor = armorJson as Armor[];
export const weapons = weaponsJson as Weapon[];
export const spells = spellsJson as Spell[];
export const items = itemsJson as Item[];
export const environments = environmentsJson as Environment[];
export const monsters = monstersJson as Monster[];
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
export const getMonster = (id: string) => byId(monsters, id, 'Canavar');
