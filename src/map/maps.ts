/**
 * Harita verisi: JSON'dan yükleme, doğrulama, başlangıç bölgeleri ve aynalama.
 * Yeni harita eklemek yalnızca `data/maps/` altına JSON ve `public/maps/` altına görsel
 * eklemektir; kod değişmez.
 */
import { environments } from '../data';
import { neighbors, type GridSize, type Offset } from '../rules/hex';
import { TERRAIN, isSafeStart, terrainOf, type TerrainType } from './terrain';
import { effectErrors, type MapEffect } from './effects';

/** Standart ızgara: 15 sütun × 7 satır (Klasik haritalar; ekran penceresi bu boyutta). */
export const GRID: GridSize = { cols: 15, rows: 7 };
/** Görev H1: harita boyutu veride serbest; kademeler standart 15×7, orta 21×11, geniş 31×17; güvenli üst sınır. */
export const MAP_SIZES = { standard: { cols: 15, rows: 7 }, medium: { cols: 21, rows: 11 }, large: { cols: 31, rows: 17 } } as const;
/** Görev H2: standart (15×7) pencereden büyük harita (Game Master seçicisinde "Geniş haritalar"). */
export const isWideMap = (m: { size: GridSize }): boolean => m.size.cols > GRID.cols || m.size.rows > GRID.rows;
export const MIN_GRID: GridSize = { cols: 5, rows: 5 };
export const MAX_GRID: GridSize = { cols: 48, rows: 28 };

/** Harita kuralı: kimliği ve JSON'daki parametreleri (DC, hasar, tur sayısı...). */
export interface MapRuleData {
  id: string;
  [param: string]: unknown;
}

export interface MapVariant {
  /** Değişmez kimlik (kayıtlar, ses eşlemesi, kontroller buna bağlı). */
  id: string;
  /** Görünen ad (Türkçe). */
  name: string;
  /** Görünen ad (İngilizce); yoksa Türkçe ad. */
  nameEn?: string;
  /** `public/` altındaki yol, örneğin "maps/harita-volkan-adalar.webp". */
  image: string;
  /** Bu varyantın ortamı haritanınkinden farklıysa (fırtına gibi). */
  environmentId?: string;
  rules: MapRuleData[];
  /** Hareketli görsel katman (Adım 10c); kurallara dokunmaz. */
  effects?: MapEffect[];
  /**
   * Varyantın kendi düzeni (Dağ yaz/kış gibi): verilirse haritanınkini ezer. Aynalama
   * varyantın kendi zemini ve başlangıç bölgeleriyle yapılır.
   */
  tiles?: string[];
  startZones?: RawMap['startZones'];
  mirrorable?: boolean;
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
  /** Haritaya özel gizlenme yerleri (data/stealth.json'daki genel kurallara ek; Görev K). */
  hide?: RawHide;
  /** Görev K13B: sefer haritası: açtığı ev kuralları (`data/ev-kurallari.json`, `sefer: true` olanlar). */
  seferKurallari?: string[];
  /** Görev S2: hazır nesne yerleşimi (1 tabanlı [sütun, satır]; Game Master kurulumda değiştirir). */
  objects?: Array<{ id?: string; kind: string; at: [number, number]; state?: string; lockDc?: number }>;
  /** Görev S4: uyuyan/habersiz grup alanları (1 tabanlı altıgenler; durum asleep|calm|alarmed; komşular). */
  groups?: Array<{ id: string; state?: 'asleep' | 'calm' | 'alarmed'; hexes: Array<[number, number]>; links?: string[]; route?: Array<[number, number]>; pause?: number }>;
  /** Görev S3: hazır hedefler (1 tabanlı altıgenler; `battle/types` `Goals` biçimi). */
  goals?: { mode?: 'all' | 'any'; list: Array<Record<string, unknown> & { kind: string; hexes?: Array<[number, number]> }>; fail?: Array<Record<string, unknown> & { kind: string }> };
  /**
   * Kuyruk 16 K16B: savaş başında hazır yüzeyler (1 tabanlı altıgenler): `kind` yüzey türü (`data/yuzeyler.json`) ya da
   * `spell` kalıcı alan büyüsü (fog-cloud, web, grease…; sahipsiz, süresiz, konsantrasyonsuz). Yalnızca bu alanı olan
   * haritalarda (eski haritalar değişmez).
   */
  surfaces?: RawSurface[];
  /** Kuyruk 16 K16B: test/vitrin haritası (seçicide ayrı grup; denge ölçümlerine katılmaz). */
  vitrin?: boolean;
  /** Kuyruk 18 V1: sefer haritası (seçicide seferin grubunda; `data/seferler.json`). */
  sefer?: string;
  notes?: unknown;
}

export interface RawSurface { kind?: string; spell?: string; hexes: Array<[number, number]> }

export type HideCover = 'leaves' | 'sand' | 'shadow';

/**
 * Gizlenme yerleri (veri): üstünde durulan zemin (`terrain`, harf → Stealth bonusu), bitişiğinde durulan
 * engel (`adjacentTo`, harf → bonus; ağaç, direk, sandık arkası) ve gizli jetonun örtü görüntüsü (`cover`).
 */
export interface RawHide {
  terrain?: Record<string, number>;
  adjacentTo?: Record<string, number>;
  cover?: Record<string, HideCover>;
  note?: string;
}

export type Side = 'players' | 'enemies';

/** Yüklenmiş, doğrulanmış harita. Koordinatlar 0 tabanlı. */
export interface BattleMap {
  id: string;
  name: string;
  environmentId: string;
  size: GridSize;
  hexFeet: number;
  /** Düzeni yüklenen varyant (varyantlar kendi zemin ve başlangıç bölgelerini verebilir). */
  variantId: string;
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
  /** Haritanın gizlenme yerleri (genel kurallarla birleştirilmemiş ham hâli; birleşik: `battle/stealth.ts`). */
  hide: RawHide;
  /** Görev K13B: sefer haritasının açtığı ev kuralları (Klasik haritalarda boş). */
  seferKurallari: string[];
  /** Görev S2: hazır nesneler (0 tabanlı; aynalı haritada aynalı). */
  objects: Array<{ id?: string; kind: string; at: Offset; state?: string; lockDc?: number }>;
  /** Görev S3: hazır hedefler (0 tabanlı; aynalı haritada aynalı). */
  goals?: MapGoals;
  /** Görev S4: grup alanları (0 tabanlı; aynalı haritada aynalı). */
  groups?: Array<{ id: string; state?: 'asleep' | 'calm' | 'alarmed'; hexes: Offset[]; links?: string[]; route?: Offset[]; pause?: number }>;
  /** Kuyruk 16 K16B: hazır yüzeyler (0 tabanlı; aynalı haritada aynalı). */
  surfaces?: Array<{ kind?: string; spell?: string; hexes: Offset[] }>;
  /** Kuyruk 16 K16B: test/vitrin haritası. */
  vitrin?: boolean;
  /** Kuyruk 18 V1: sefer haritası. */
  sefer?: string;
}

export interface MapGoals {
  mode: 'all' | 'any';
  list: Array<Record<string, unknown> & { id: string; kind: string; hexes?: Offset[] }>;
  fail?: Array<Record<string, unknown> & { kind: string }>;
}

const SIDES = ['players', 'enemies'] as const;

/** JSON'daki hazır listeyi 0 tabanlı altıgenlere çevirir. */
const toOffsets = (hexes: number[][]): Offset[] => hexes.map(([c, r]) => ({ col: (c ?? 0) - 1, row: (r ?? 0) - 1 }));
const mirrorHex = (o: Offset, size: GridSize): Offset => ({ col: size.cols - 1 - o.col, row: o.row });

/** Ham haritadaki sorunları listeler; boş liste geçerli demektir. */
export function validateMap(raw: RawMap, opts: { images?: ReadonlySet<string> } = {}): string[] {
  const errors = validateBase(raw, opts);
  // Düzen (zemin, başlangıç bölgeleri, aynalama) her varyant için kendi ezmeleriyle denetlenir;
  // varyantların hepsi haritanın düzenini kullanıyorsa bir kez.
  const own = (raw.variants ?? []).filter((v) => v.tiles || v.startZones || v.mirrorable !== undefined);
  const layouts = own.length === 0 ? [raw] : (raw.variants ?? []).map((v) => withVariant(raw, v));
  for (const l of layouts) {
    for (const e of validateLayout(l)) if (!errors.includes(e)) errors.push(e);
  }
  return errors;
}

/** Varyantın düzeni haritanınkini ezer. */
function withVariant(raw: RawMap, v: MapVariant): RawMap {
  return {
    ...raw,
    id: raw.variants.length > 1 && (v.tiles || v.startZones) ? `${raw.id}/${v.id}` : raw.id,
    tiles: v.tiles ?? raw.tiles,
    startZones: v.startZones ?? raw.startZones,
    mirrorable: v.mirrorable ?? raw.mirrorable,
  };
}

/** Haritanın genel alanları (biçim, ortam, varyantlar). */
function validateBase(raw: RawMap, opts: { images?: ReadonlySet<string> }): string[] {
  const errors: string[] = [];
  const where = `Harita "${raw.id}"`;
  if (raw.orientation !== 'flat-top') errors.push(`${where}: yön "flat-top" olmalı`);
  if (raw.offset !== 'odd-q') errors.push(`${where}: offset "odd-q" olmalı`);
  const c = raw.size?.cols, r = raw.size?.rows;
  if (!Number.isInteger(c) || !Number.isInteger(r) || (c as number) < MIN_GRID.cols || (r as number) < MIN_GRID.rows
    || (c as number) > MAX_GRID.cols || (r as number) > MAX_GRID.rows) {
    errors.push(`${where}: boyut ${String(c)}×${String(r)} geçersiz (en az ${MIN_GRID.cols}×${MIN_GRID.rows}, en çok ${MAX_GRID.cols}×${MAX_GRID.rows})`);
  }
  if (!environments.some((e) => e.id === raw.environmentId)) {
    errors.push(`${where}: ortam bulunamadı "${raw.environmentId}"`);
  }
  for (const table of [raw.hide?.terrain ?? {}, raw.hide?.adjacentTo ?? {}]) {
    for (const [ch, bonus] of Object.entries(table)) {
      if (!TERRAIN[ch]) errors.push(`${where}: gizlenme yeri bilinmeyen harf "${ch}"`);
      if (!Number.isInteger(bonus)) errors.push(`${where}: "${ch}" gizlenme bonusu tam sayı olmalı`);
    }
  }
  for (const [ch, cover] of Object.entries(raw.hide?.cover ?? {})) {
    if (!TERRAIN[ch]) errors.push(`${where}: gizlenme örtüsü bilinmeyen harf "${ch}"`);
    if (!['leaves', 'sand', 'shadow'].includes(cover)) errors.push(`${where}: "${ch}" örtüsü leaves, sand ya da shadow olmalı`);
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
    errors.push(...effectErrors(v.effects, `${where} "${v.id}" varyantı`));
  }
  return errors;
}

/** Zemin tablosu, başlangıç bölgeleri ve aynalama uyumu. */
function validateLayout(raw: RawMap): string[] {
  const errors: string[] = [];
  const where = `Harita "${raw.id}"`;
  const size = raw.size ?? GRID;
  if (!Array.isArray(raw.tiles) || raw.tiles.length !== size.rows) {
    errors.push(`${where}: ${size.rows} satır olmalı`);
  }
  (raw.tiles ?? []).forEach((line, i) => {
    if ([...line].length !== size.cols) errors.push(`${where}: satır ${i + 1} ${size.cols} karakter olmalı`);
    for (const ch of new Set(line)) {
      if (!TERRAIN[ch]) errors.push(`${where}: satır ${i + 1} bilinmeyen harf "${ch}"`);
    }
  });
  for (const side of ['players', 'enemies'] as const) {
    const r = raw.startZones?.[side]?.colRange;
    const [a, b] = r ?? [];
    if (!r || r.length !== 2 || a === undefined || b === undefined || a < 1 || b > size.cols || a > b) {
      errors.push(`${where}: ${side} sütun aralığı 1..${size.cols} içinde olmalı`);
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
    if (raw.mirrorable && size.cols % 2 === 0) errors.push(`${where}: aynalanabilir haritanın sütun sayısı tek olmalı (odd-q)`);
    if (raw.mirrorable && explicit && (pa !== size.cols + 1 - eb || pb !== size.cols + 1 - ea)) {
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

function build(base: RawMap, variantId: string | undefined, mirrored: boolean): BattleMap {
  const v = base.variants.find((x) => x.id === variantId) ?? base.variants[0];
  const raw = v ? withVariant(base, v) : base;
  const tiles = [...raw.tiles];
  const zoneRanges = {
    players: raw.startZones.players.colRange as [number, number],
    enemies: raw.startZones.enemies.colRange as [number, number],
  };
  return {
    id: base.id,
    variantId: v?.id ?? '',
    name: raw.name,
    environmentId: raw.environmentId,
    size: { cols: raw.size.cols, rows: raw.size.rows },
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
    hide: { ...(raw.hide ?? {}) },
    seferKurallari: [...(raw.seferKurallari ?? [])],
    objects: (raw.objects ?? []).map((o) => ({ ...o, at: { col: o.at[0] - 1, row: o.at[1] - 1 } })),
    ...(raw.groups ? { groups: raw.groups.map(({ route, ...g }) => ({ ...g, hexes: g.hexes.map((h): Offset => ({ col: h[0] - 1, row: h[1] - 1 })), ...(route ? { route: route.map((h): Offset => ({ col: h[0] - 1, row: h[1] - 1 })) } : {}) })) } : {}),
    ...(raw.surfaces?.length ? { surfaces: raw.surfaces.map((x) => ({ ...x, hexes: x.hexes.map((h): Offset => ({ col: h[0] - 1, row: h[1] - 1 })) })) } : {}),
    ...(raw.vitrin ? { vitrin: true } : {}),
    ...(raw.sefer ? { sefer: raw.sefer } : {}),
    ...(raw.goals ? { goals: {
      mode: raw.goals.mode ?? 'all',
      list: raw.goals.list.map((g, i) => { const { hexes, ...rest } = g; return { ...rest, id: typeof g.id === 'string' ? g.id : `g${i + 1}`, ...(hexes ? { hexes: hexes.map((h): Offset => ({ col: h[0] - 1, row: h[1] - 1 })) } : {}) }; }),
      ...(raw.goals.fail ? { fail: raw.goals.fail.map((f) => ({ ...f })) } : {}),
    } } : {}),
  };
}

/** Ham haritayı doğrular ve yükler; sorun varsa hepsini tek hatada listeler. */
export function loadMap(raw: RawMap, opts: { images?: ReadonlySet<string> } = {}): BattleMap {
  const errors = validateMap(raw, opts);
  if (errors.length > 0) throw new Error(errors.join('\n'));
  return build(raw, undefined, false);
}

/**
 * Yatay aynalama: her satır ters çevrilir (sütun c → cols − 1 − c). Son sütun indeksi çift (sütun sayısı tek: 15, 21,
 * 31) olduğu için sütunların tek/çift kayması korunur ve komşuluklar bozulmaz (H1: aynalanabilir harita tek sütunlu olmalı). Başlangıç sütun
 * aralıkları aynı kalır (oyuncular yine solda), altıgenleri aynalı zeminden yeniden
 * hesaplanır; böylece Çöl'de taraflar zeminin öbür yarısında başlar. Hazır listeli
 * haritalarda oyuncular düşmanların, düşmanlar oyuncuların listesinin aynasını alır
 * (aynı sonuç: sol taraftaki zeminin hazır altıgenleri).
 */
export function mirrorMap(map: BattleMap): BattleMap {
  if (!map.mirrorable) throw new Error(`Harita "${map.id}" aynalanamaz`);
  const tiles = map.tiles.map((line) => [...line].reverse().join(''));
  const startZones = map.explicitZones
    ? { players: map.startZones.enemies.map((h) => mirrorHex(h, map.size)), enemies: map.startZones.players.map((h) => mirrorHex(h, map.size)) }
    : { players: zoneHexes(tiles, map.zoneRanges.players), enemies: zoneHexes(tiles, map.zoneRanges.enemies) };
  return { ...map, tiles, mirrored: !map.mirrored, startZones, objects: map.objects.map((o) => ({ ...o, at: mirrorHex(o.at, map.size) })),
    ...(map.groups ? { groups: map.groups.map((g) => ({ ...g, hexes: g.hexes.map((h) => mirrorHex(h, map.size)), ...(g.route ? { route: g.route.map((h) => mirrorHex(h, map.size)) } : {}) })) } : {}),
    ...(map.surfaces ? { surfaces: map.surfaces.map((x) => ({ ...x, hexes: x.hexes.map((h) => mirrorHex(h, map.size)) })) } : {}),
    ...(map.goals ? { goals: { ...map.goals, list: map.goals.list.map((g) => (g.hexes ? { ...g, hexes: g.hexes.map((h) => mirrorHex(h, map.size)) } : g)) } } : {}) };
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

/**
 * Haritayı kimliğiyle getirir: verilen varyantın düzeniyle (yoksa ilk varyant), istenirse
 * aynalı hâli.
 */
/** Eski harita kimlikleri (yeniden adlandırılan haritalar): eski kimlik yeni haritayı açar. */
const MAP_ALIASES: Record<string, string> = { 'volkan-adalar': 'volkan' };

/**
 * Kayıttan ya da eski bir oturumdan gelen harita/varyant seçimini bugünkü kataloğa oturtur:
 * eski kimlik eşlenir, bilinmeyen harita ilk haritaya, bilinmeyen varyant haritanın ilk varyantına düşer.
 */
export function resolveMapChoice(id: string, variantId?: string): { id: string; variantId: string } {
  const map = maps.find((m) => m.id === (MAP_ALIASES[id] ?? id)) ?? maps[0];
  if (!map) throw new Error('Harita kataloğu boş');
  const variant = map.variants.find((v) => v.id === variantId) ?? map.variants[0];
  return { id: map.id, variantId: variant?.id ?? '' };
}

export function getMap(id: string, opts: { mirrored?: boolean; variantId?: string } = {}): BattleMap {
  id = MAP_ALIASES[id] ?? id;
  const found = maps.find((m) => m.id === id);
  if (!found) throw new Error(`Harita bulunamadı: "${id}"`);
  const raw = RAW_MAPS.find((m) => m.id === id) as RawMap;
  const layout = opts.variantId && opts.variantId !== found.variantId ? build(raw, opts.variantId, false) : found;
  return opts.mirrored ? mirrorMap(layout) : layout;
}

/** Varyantın ortamı: varyant kendi ortamını veriyorsa o, yoksa haritanınki. */
export function environmentFor(map: BattleMap, variantId: string): string {
  return map.variants.find((v) => v.id === variantId)?.environmentId ?? map.environmentId;
}

/** Varyantın görünen adı (dile göre; İngilizce ad yoksa Türkçe). */
export const variantLabel = (v: Pick<MapVariant, 'name' | 'nameEn'>, lang: 'tr' | 'en'): string =>
  lang === 'en' && v.nameEn ? v.nameEn : v.name;
