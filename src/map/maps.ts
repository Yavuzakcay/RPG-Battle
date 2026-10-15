/**
 * Harita verisi: JSON'dan yükleme, doğrulama, başlangıç bölgeleri ve aynalama.
 * Yeni harita eklemek yalnızca `data/maps/` altına JSON ve `public/maps/` altına görsel
 * eklemektir; kod değişmez.
 */
import { environments } from '../data';
import { neighbors, type GridSize, type Offset } from '../rules/hex';
import { TERRAIN, isSafeStart, terrainOf, type TerrainType } from './terrain';

/** Izgara boyutu sabit: 15 sütun × 7 satır. */
export const GRID: GridSize = { cols: 15, rows: 7 };

/** Harita kuralı: kimliği ve JSON'daki parametreleri (DC, hasar, tur sayısı...). */
export interface MapRuleData {
  id: string;
  [param: string]: unknown;
}

export interface MapVariant {
  id: string;
  name: string;
  /** `public/` altındaki yol, örneğin "maps/harita-volkan.webp". */
  image: string;
  /** Bu varyantın ortamı haritanınkinden farklıysa (fırtına gibi). */
  environmentId?: string;
  rules: MapRuleData[];
}

/** Başlangıç bölgesi: 1 tabanlı sütun aralığı ve isteğe bağlı hazır altıgen listesi ([sütun, satır], 1 tabanlı). */
export interface RawZone {
  colRange: number[];
  hexes?: number[][];
}

/** JSON'daki ham biçim. Sütun aralıkları 1 tabanlı ve iki uç dahil. */
export interface RawMap {
  id: string;
  name: string;
  environmentId: string;
  orientation: string;
  offset: string;
  size: { cols: number; rows: number };
  hexFeet: number;
  tiles: string[];
  startZones: { players: RawZone; enemies: RawZone; note?: string };
  variants: MapVariant[];
  mirrorable: boolean;
  /** Haritaya özel gizlenme yerleri: zemin harfi → Stealth bonusu (Çöl'de açık kum). */
  hideTerrain?: Record<string, number>;
  notes?: unknown;
}

export type Side = 'players' | 'enemies';

/** Yüklenmiş, doğrulanmış harita. Koordinatlar 0 tabanlı. */
export interface BattleMap {
  id: string;
  name: string;
  environmentId: string;
  size: GridSize;
  hexFeet: number;
  /** Satır satır zemin harfleri (aynalanmışsa aynalı hâli). */
  tiles: string[];
  variants: MapVariant[];
  mirrorable: boolean;
  /** Yatay aynalı mı (arayüz görseli de çevirmeli). */
  mirrored: boolean;
  /** 1 tabanlı sütun aralıkları (aynalamada değişmez: oyuncular hep solda). */
  zoneRanges: Record<Side, [number, number]>;
  /**
   * Başlangıç altıgenleri: JSON'da hazır liste varsa o, yoksa aralıktaki durulabilir,
   * tehlikesiz ve kaya kümesi olmayan altıgenler.
   */
  startZones: Record<Side, Offset[]>;
  /** Başlangıç altıgenleri JSON'daki hazır listeden mi geldi. */
  explicitZones: boolean;
  /** Haritaya özel gizlenme yerleri (katalogdakilere ek): zemin harfi → Stealth bonusu. */
  hideTerrain: Record<string, number>;
}

const SIDES = ['players', 'enemies'] as const;

/** JSON'daki hazır listeyi 0 tabanlı altıgenlere çevirir. */
const toOffsets = (hexes: number[][]): Offset[] => hexes.map(([c, r]) => ({ col: (c ?? 0) - 1, row: (r ?? 0) - 1 }));
const mirrorHex = (o: Offset): Offset => ({ col: GRID.cols - 1 - o.col, row: o.row });

/** Ham haritadaki sorunları listeler; boş liste geçerli demektir. */
export function validateMap(raw: RawMap, opts: { images?: ReadonlySet<string> } = {}): string[] {
  const errors: string[] = [];
  const where = `Harita "${raw.id}"`;
  if (raw.orientation !== 'flat-top') errors.push(`${where}: yön "flat-top" olmalı`);
  if (raw.offset !== 'odd-q') errors.push(`${where}: offset "odd-q" olmalı`);
  if (raw.size?.cols !== GRID.cols || raw.size?.rows !== GRID.rows) {
    errors.push(`${where}: boyut ${GRID.cols}×${GRID.rows} olmalı`);
  }
  if (!environments.some((e) => e.id === raw.environmentId)) {
    errors.push(`${where}: ortam bulunamadı "${raw.environmentId}"`);
  }
  if (!Array.isArray(raw.tiles) || raw.tiles.length !== GRID.rows) {
    errors.push(`${where}: ${GRID.rows} satır olmalı`);
  }
  (raw.tiles ?? []).forEach((line, i) => {
    if ([...line].length !== GRID.cols) errors.push(`${where}: satır ${i + 1} ${GRID.cols} karakter olmalı`);
    for (const ch of new Set(line)) {
      if (!TERRAIN[ch]) errors.push(`${where}: satır ${i + 1} bilinmeyen harf "${ch}"`);
    }
  });
  for (const side of ['players', 'enemies'] as const) {
    const r = raw.startZones?.[side]?.colRange;
    const [a, b] = r ?? [];
    if (!r || r.length !== 2 || a === undefined || b === undefined || a < 1 || b > GRID.cols || a > b) {
      errors.push(`${where}: ${side} sütun aralığı 1..${GRID.cols} içinde olmalı`);
    }
  }
  for (const [ch, bonus] of Object.entries(raw.hideTerrain ?? {})) {
    if (!TERRAIN[ch]) errors.push(`${where}: gizlenme yeri bilinmeyen harf "${ch}"`);
    if (!Number.isInteger(bonus)) errors.push(`${where}: "${ch}" gizlenme bonusu tam sayı olmalı`);
  }
  if (!Array.isArray(raw.variants) || raw.variants.length === 0) errors.push(`${where}: en az bir varyant olmalı`);
  for (const v of raw.variants ?? []) {
    if (opts.images && !opts.images.has(v.image)) errors.push(`${where}: görsel yok "${v.image}"`);
    if (v.environmentId !== undefined && !environments.some((e) => e.id === v.environmentId)) {
      errors.push(`${where}: "${v.id}" varyantının ortamı bulunamadı "${v.environmentId}"`);
    }
    for (const rule of v.rules ?? []) {
      if (typeof rule.id !== 'string') errors.push(`${where}: "${v.id}" varyantında kimliksiz kural`);
    }
  }
  // Başlangıç bölgeleri ancak tablo düzgünse denetlenebilir.
  if (errors.length === 0) {
    const seen = new Map<string, Side>();
    for (const side of SIDES) {
      const zone = raw.startZones[side];
      const [a, b] = zone.colRange as [number, number];
      const hexes = zone.hexes ? toOffsets(zone.hexes) : zoneHexes(raw.tiles, [a, b]);
      if (hexes.length === 0) errors.push(`${where}: ${side} başlangıç bölgesi boş`);
      if (!zone.hexes) continue;
      for (const h of hexes) {
        const label = `${side} başlangıç altıgeni ${h.col + 1},${h.row + 1}`;
        const ch = raw.tiles[h.row]?.[h.col];
        if (h.col + 1 < a || h.col + 1 > b || ch === undefined) {
          errors.push(`${where}: ${label} sütun aralığının veya haritanın dışında`);
          continue;
        }
        if (!isSafeStart(terrainOf(ch))) errors.push(`${where}: ${label} başlangıç için uygun değil ("${ch}")`);
        const key = `${h.col},${h.row}`;
        const prev = seen.get(key);
        if (prev) errors.push(`${where}: ${label} ${prev === side ? 'iki kez yazılmış' : 'iki tarafta birden'}`);
        seen.set(key, side);
      }
    }
    // Hazır listeli harita aynalanınca taraflar birbirinin aynalı altıgenlerini alır;
    // bunun için sütun aralıkları da birbirinin aynası olmalı.
    const [pa, pb] = raw.startZones.players.colRange as [number, number];
    const [ea, eb] = raw.startZones.enemies.colRange as [number, number];
    const explicit = raw.startZones.players.hexes !== undefined || raw.startZones.enemies.hexes !== undefined;
    if (raw.mirrorable && explicit && (pa !== GRID.cols + 1 - eb || pb !== GRID.cols + 1 - ea)) {
      errors.push(`${where}: aynalanabilir harita için sütun aralıkları birbirinin aynası olmalı`);
    }
    if (explicit && (!raw.startZones.players.hexes || !raw.startZones.enemies.hexes)) {
      errors.push(`${where}: hazır başlangıç listesi iki tarafta da olmalı`);
    }
  }
  return errors;
}

function zoneHexes(tiles: string[], [a, b]: [number, number]): Offset[] {
  const out: Offset[] = [];
  for (let row = 0; row < tiles.length; row++) {
    for (let col = a - 1; col <= b - 1; col++) {
      const ch = tiles[row]?.[col];
      if (ch !== undefined && isSafeStart(terrainOf(ch))) out.push({ col, row });
    }
  }
  return out;
}

function build(raw: RawMap, tiles: string[], mirrored: boolean): BattleMap {
  const zoneRanges = {
    players: raw.startZones.players.colRange as [number, number],
    enemies: raw.startZones.enemies.colRange as [number, number],
  };
  return {
    id: raw.id,
    name: raw.name,
    environmentId: raw.environmentId,
    size: { ...GRID },
    hexFeet: raw.hexFeet,
    tiles,
    variants: raw.variants,
    mirrorable: raw.mirrorable,
    mirrored,
    zoneRanges,
    startZones: {
      players: raw.startZones.players.hexes ? toOffsets(raw.startZones.players.hexes) : zoneHexes(tiles, zoneRanges.players),
      enemies: raw.startZones.enemies.hexes ? toOffsets(raw.startZones.enemies.hexes) : zoneHexes(tiles, zoneRanges.enemies),
    },
    explicitZones: raw.startZones.players.hexes !== undefined,
    hideTerrain: { ...(raw.hideTerrain ?? {}) },
  };
}

/** Ham haritayı doğrular ve yükler; sorun varsa hepsini tek hatada listeler. */
export function loadMap(raw: RawMap, opts: { images?: ReadonlySet<string> } = {}): BattleMap {
  const errors = validateMap(raw, opts);
  if (errors.length > 0) throw new Error(errors.join('\n'));
  return build(raw, [...raw.tiles], false);
}

/**
 * Yatay aynalama: her satır ters çevrilir (sütun c → 14 - c). Son sütun indeksi (14) çift
 * olduğu için sütunların tek/çift kayması korunur ve komşuluklar bozulmaz. Başlangıç sütun
 * aralıkları aynı kalır (oyuncular yine solda), altıgenleri aynalı zeminden yeniden
 * hesaplanır; böylece Çöl'de taraflar zeminin öbür yarısında başlar. Hazır listeli
 * haritalarda oyuncular düşmanların, düşmanlar oyuncuların listesinin aynasını alır
 * (aynı sonuç: sol taraftaki zeminin hazır altıgenleri).
 */
export function mirrorMap(map: BattleMap): BattleMap {
  if (!map.mirrorable) throw new Error(`Harita "${map.id}" aynalanamaz`);
  const tiles = map.tiles.map((line) => [...line].reverse().join(''));
  const startZones = map.explicitZones
    ? { players: map.startZones.enemies.map(mirrorHex), enemies: map.startZones.players.map(mirrorHex) }
    : { players: zoneHexes(tiles, map.zoneRanges.players), enemies: zoneHexes(tiles, map.zoneRanges.enemies) };
  return { ...map, tiles, mirrored: !map.mirrored, startZones };
}

/** Altıgenin zemin türü; ızgara dışıysa oyun alanı dışı (#) sayılır. */
export function tileAt(map: BattleMap, o: Offset): TerrainType {
  return terrainOf(map.tiles[o.row]?.[o.col] ?? '#');
}

/** Gölgede mi: kendisi veya bitişiklerinden biri gölge veren bir altıgen. */
export function isShaded(map: BattleMap, o: Offset): boolean {
  return [o, ...neighbors(o, map.size)].some((h) => tileAt(map, h).shade === true);
}

/** `data/maps/` altındaki bütün haritalar, kimliğe göre sıralı. Yeni JSON eklemek yeter. */
export const RAW_MAPS: readonly RawMap[] = Object.values(
  import.meta.glob<RawMap>('../../data/maps/*.json', { eager: true, import: 'default' }),
).sort((a, b) => a.id.localeCompare(b.id));

export const maps: readonly BattleMap[] = RAW_MAPS.map((m) => loadMap(m));

/** Haritayı kimliğiyle getirir; istenirse aynalı hâlini verir. */
export function getMap(id: string, opts: { mirrored?: boolean } = {}): BattleMap {
  const found = maps.find((m) => m.id === id);
  if (!found) throw new Error(`Harita bulunamadı: "${id}"`);
  return opts.mirrored ? mirrorMap(found) : found;
}

/** Varyantın ortamı: varyant kendi ortamını veriyorsa o, yoksa haritanınki. */
export function environmentFor(map: BattleMap, variantId: string): string {
  return map.variants.find((v) => v.id === variantId)?.environmentId ?? map.environmentId;
}
