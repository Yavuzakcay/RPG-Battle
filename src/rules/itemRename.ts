/**
 * Görev BOSS-IMZA-GORSEL: görünen adı değişen eşyalar için kayıt geçişi. Karakter eşyayı adıyla tutar (`itemNames`, `silahBagi`
 * anahtarı); eski ad `data/esya-ad-degisim.json` ile yenisine çevrilir. Kimlikler değişmez. Saf (React, DOM, localStorage yok).
 */
import data from '../../data/esya-ad-degisim.json';
import type { CharacterSheet } from './stats';

const ADLAR = (data as { adlar: Record<string, string> }).adlar;

/** Eski eşya adının bugünkü karşılığı (değişmediyse kendisi). */
export const currentItemName = (name: string): string => ADLAR[name] ?? name;

/** Sayfadaki eski eşya adlarını yeniler; değişiklik yoksa aynı nesne döner. */
export function renameSheetItems(sheet: CharacterSheet): CharacterSheet {
  const names = sheet.itemNames.map(currentItemName);
  const bag = sheet.silahBagi && Object.fromEntries(Object.entries(sheet.silahBagi).map(([k, v]) => [currentItemName(k), v]));
  const itemsChanged = names.some((n, i) => n !== sheet.itemNames[i]);
  const bagChanged = !!sheet.silahBagi && Object.keys(sheet.silahBagi).some((k) => currentItemName(k) !== k);
  if (!itemsChanged && !bagChanged) return sheet;
  return { ...sheet, itemNames: names, ...(bag ? { silahBagi: bag } : {}) };
}

/** Karakter listesinde eski eşya adlarını yeniler; hiçbiri değişmediyse aynı liste döner. */
export function migrateItemNames<T extends { sheet: CharacterSheet }>(list: T[]): T[] {
  let changed = false;
  const out = list.map((c) => {
    const sheet = renameSheetItems(c.sheet);
    if (sheet === c.sheet) return c;
    changed = true;
    return { ...c, sheet };
  });
  return changed ? out : list;
}
