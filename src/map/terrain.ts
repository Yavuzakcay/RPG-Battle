/**
 * Zemin türü kataloğu: bütün haritalar aynı harfleri paylaşır. Yeni harita yalnızca
 * bu harfleri kullanan veri ekler; yeni bir zemin türü gerekirse buraya bir satır eklenir.
 */
import type { Height } from '../rules/conditions';

/** normal: 1 adım, zorlu: 2 adım, engel: girilemez, ölümcül: girene ölüm (lav). */
export type Movement = 'normal' | 'difficult' | 'blocked' | 'deadly';

/** Siperin AC'ye katkısı: yok 0, yarım +2, 3/4 +5 (5e kuralı). */
export type Cover = 0 | 2 | 5;

export interface TerrainType {
  char: string;
  name: string;
  /** Mevcut yükseklik kuralının ölçeğinde (-1/0/1). */
  height: Height;
  movement: Movement;
  cover: Cover;
  /** Kendisi ve bitişik altıgenler gölgedir (çöl sıcağı). */
  shade?: boolean;
  /** Kumun altına gizlenme denenebilir (haritanın kuralı açıksa). */
  hideable?: boolean;
  /** Girince veya turu orada bitirince alınan hasar (alev). */
  hazard?: { damage: string; damageType: string };
  /** Oyun alanı dışı. */
  outOfBounds?: boolean;
  /** Durulabilir olsa da başlangıç yeri sayılmaz (3/4 siperli kaya kümesi). */
  noStart?: boolean;
}

const TYPES: TerrainType[] = [
  { char: '.', name: 'Açık zemin', height: 0, movement: 'normal', cover: 0, hideable: true },
  { char: 'd', name: 'Kum tepesi', height: 0, movement: 'normal', cover: 2, hideable: true },
  { char: 'r', name: 'Kaya kümesi', height: 0, movement: 'difficult', cover: 5, shade: true, noStart: true },
  { char: 'c', name: 'Ayakta sütun', height: 0, movement: 'blocked', cover: 5, shade: true },
  { char: 'k', name: 'Yıkık sütun', height: 0, movement: 'difficult', cover: 2, shade: true },
  { char: 't', name: 'Taşlık', height: 0, movement: 'difficult', cover: 0 },
  { char: 'H', name: 'Yüksek bazalt', height: 1, movement: 'normal', cover: 0 },
  { char: '~', name: 'Lav', height: 0, movement: 'deadly', cover: 0 },
  { char: 'f', name: 'Alev', height: 0, movement: 'normal', cover: 0, hazard: { damage: '1d6', damageType: 'fire' } },
  { char: '#', name: 'Dış kayalık', height: 0, movement: 'blocked', cover: 0, outOfBounds: true },
];

export const TERRAIN: Readonly<Record<string, TerrainType>> = Object.fromEntries(TYPES.map((t) => [t.char, t]));

export function terrainOf(char: string): TerrainType {
  const t = TERRAIN[char];
  if (!t) throw new Error(`Bilinmeyen zemin harfi: "${char}"`);
  return t;
}

/** Yürüyerek durulabilir mi (engel ve lav değil). */
export const isStandable = (t: TerrainType): boolean => t.movement !== 'blocked' && t.movement !== 'deadly';

/** Başlangıç için uygun mu: durulabilir, tehlikesiz (alev değil) ve kaya kümesi değil. */
export const isSafeStart = (t: TerrainType): boolean => isStandable(t) && !t.hazard && !t.noStart;

/**
 * Yürüyen bir yaratık için girme maliyeti (altıgen): normal 1, zorlu 2. Engel ve lav
 * null (girilemez; lava gönüllü girmek reddedilir). Uçan yaratık zorlu zeminden ve
 * lavdan etkilenmez, engelden etkilenir.
 */
export function enterCost(t: TerrainType, flying = false): number | null {
  if (t.movement === 'blocked') return null;
  if (flying) return 1;
  if (t.movement === 'deadly') return null;
  return t.movement === 'difficult' ? 2 : 1;
}
