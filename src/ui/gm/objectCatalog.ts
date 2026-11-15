/**
 * Kuyruk KQ5 NU1: tek "Nesne" paneli için katalog (saf): kategori, arama ve "1 kişi / 2+ kişi" ipucu. Veri `data/nesneler.json`
 * (`agirlikLb`, `carryable`, `weapon`, `buyulu`, `dekor`); yeni veri yok.
 */
import { OBJECTS, OBJECT_KINDS } from '../../battle/objectData';
import type { ObjectKind } from '../../battle/types';

export type ObjectCategory = 'tasinabilir' | 'dekor' | 'silah' | 'buyulu' | 'mekanik';
export const OBJECT_CATEGORIES: readonly ObjectCategory[] = ['tasinabilir', 'dekor', 'silah', 'buyulu', 'mekanik'];

/** Bir nesne türünün kategorileri (birden çok olabilir: kılıç hem silah hem taşınabilir). */
export function categoriesOf(kind: ObjectKind): ObjectCategory[] {
  const d = OBJECTS[kind];
  if (!d) return [];
  const out: ObjectCategory[] = [];
  if (d.carryable) out.push('tasinabilir');
  if (d.dekor) out.push('dekor');
  if (d.weapon) out.push('silah');
  if (d.buyulu) out.push('buyulu');
  if (!d.carryable && !d.dekor) out.push('mekanik');
  return out;
}

/** "1 kişi" (STR 10 kapasitesi 150 lb içinde) ya da "2+ kişi". */
export const peopleHint = (lb: number | undefined): 1 | 2 => ((lb ?? 0) <= 150 ? 1 : 2);

export interface CatalogCard { kind: ObjectKind; tr: string; en: string; icon: string; weight: number | null; people: 1 | 2 | null; categories: ObjectCategory[] }

/** Kartlar: kategori çipi (boş = hepsi) ve arama (ad TR/EN ya da kimlik, büyük-küçük harf duyarsız). */
export function catalog(opts: { category?: ObjectCategory | null; query?: string } = {}): CatalogCard[] {
  const q = (opts.query ?? '').trim().toLocaleLowerCase('tr');
  return OBJECT_KINDS.map((kind) => {
    const d = OBJECTS[kind];
    const w = d.agirlikLb ?? null;
    return { kind, tr: d.tr, en: d.en, icon: d.icon ?? '▫', weight: w, people: w === null ? null : peopleHint(w), categories: categoriesOf(kind) };
  }).filter((c) => (!opts.category || c.categories.includes(opts.category))
    && (!q || `${c.tr} ${c.en} ${c.kind}`.toLocaleLowerCase('tr').includes(q)));
}
