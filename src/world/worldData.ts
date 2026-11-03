/**
 * K46: dünya haritası verisi (`data/harita/`). Saf; görüntüleyici ve keşif sisi okur. Koordinatlar dünya pikseli
 * (tuval 13704×5998, 12×6 hücre, 1 hücre = 50 mil).
 */
import izgara from '../../data/harita/kita-izgara.json';
import kamera from '../../data/harita/kamera-onayarlari.json';
import komsuluk from '../../data/harita/komsuluk-grafi.json';
import deniz from '../../data/harita/deniz-yollari.json';
import yollar from '../../data/harita/yol-katmani.json';
import sisPoly from '../../data/harita/sis-poligonlari.json';
import eslesme from '../../data/harita/dugum-eslesme.json';
import kurallar from '../../data/harita/kesif-kurallari.json';

export type Pt = [number, number];
export interface Rect { x: number; y: number; w: number; h: number }

export const WORLD = {
  w: izgara.tuval[0] as number, h: izgara.tuval[1] as number,
  cols: izgara.sutun, rows: izgara.satir,
  cell: izgara.hucre_px as [number, number],
  milesPerCell: izgara.mil_per_hucre, footMilesPerDay: izgara.yaya_mil_gun, shipMilesPerDay: izgara.gemi_mil_gun,
};

/** Kamera ön ayarları (bölge kimliği → dünya dikdörtgeni). */
export const CAMERAS: Record<string, Rect> = kamera.kameralar as unknown as Record<string, Rect>;

export const FOG_RULES = kurallar as unknown as {
  izgara: [number, number]; baslangicYaricap: number; yolculukYaricap: number; yerlesimYaricap: number; gecitYaricap: number; gemiYaricap: number;
  adaBayraklari: Record<string, string[]>; irkBolge: Record<string, string>;
  kraken: { goz: Pt; nabizMs: number };
  hapishane: { katman: [number, number, number, number]; gunAraligi: number; pencereSaat: number; gecisMs: number };
};

/** Ada poligonları (sis): yalnızca bayrakla bütünüyle açılır. */
export const ISLANDS: Record<string, Pt[]> = sisPoly.poligonlar as unknown as Record<string, Pt[]>;

export interface Road { id: string; tur: string; noktalar: Pt[]; mil: number }
export const ROADS: Road[] = yollar.yollar as unknown as Road[];
export interface SeaRoute { id: string; noktalar: Pt[]; mil: number; gemi_gun: number }
export const SEA_ROUTES: SeaRoute[] = deniz.rotalar as unknown as SeaRoute[];
export const PORTS: Record<string, Pt> = deniz.iskeleler as unknown as Record<string, Pt>;

export interface Pass { a: string; b: string; ad: string; kapi_a: Pt; kapi_b: Pt }
export const PASSES: Pass[] = komsuluk.kenarlar as unknown as Pass[];
export interface Bridge { id: string; bolge: string; dunya_px: Pt; not?: string }
export const BRIDGES: Bridge[] = komsuluk.kopruler as unknown as Bridge[];
export interface HiddenPass { id: string; ad: string; a: string; b: string; kapi_a: Pt; kapi_b: Pt; kus_ucusu_mil?: number }
export const HIDDEN_PASSES: HiddenPass[] = komsuluk.gizli_gecitler as unknown as HiddenPass[];

const NODE_PX = eslesme.dugumler as unknown as Record<string, Pt>;
const PAGE_REGION = eslesme.sayfaBolge as unknown as Record<string, string>;
const PAGE_POINT = eslesme.sayfaNokta as unknown as Record<string, Pt>;

/** Serüven sayfasının kamera bölgesi (yoksa undefined). */
export const pageRegion = (page: string): string | undefined => PAGE_REGION[page];

/** Dikdörtgenin merkezi. */
export const rectCenter = (r: Rect): Pt => [r.x + r.w / 2, r.y + r.h / 2];

/**
 * Serüven düğümünün dünya konumu: eşleme tablosunda varsa oradan, yoksa sayfanın kamera dikdörtgeninde sayfa
 * koordinatıyla (x, y 0–1); kamerası olmayan sayfa tek noktada (Derinlikler girişi, Hapishane iskelesi).
 */
export function nodeWorld(page: string, node: string, x?: number, y?: number): Pt | null {
  const exact = NODE_PX[`${page}/${node}`];
  if (exact) return exact;
  const region = PAGE_REGION[page];
  const cam = region ? CAMERAS[region] : undefined;
  if (cam && x !== undefined && y !== undefined) return [Math.round(cam.x + x * cam.w), Math.round(cam.y + y * cam.h)];
  return PAGE_POINT[page] ?? (cam ? rectCenter(cam) : null);
}

/** İrkın yurt bölgesi (kamera kimliği ya da "derinlikler"). */
export const raceRegion = (raceId: string): string | undefined => FOG_RULES.irkBolge[raceId];

/** Bölgenin merkez noktası (kamera ya da sayfa noktası). */
export function regionCenter(region: string): Pt | null {
  const cam = CAMERAS[region];
  if (cam) return rectCenter(cam);
  return PAGE_POINT[region] ?? null;
}

/** Izgara hücresinin adı (A–L × 1–6). */
export function cellName(x: number, y: number): string {
  const c = Math.min(WORLD.cols - 1, Math.max(0, Math.floor(x / WORLD.cell[0])));
  const r = Math.min(WORLD.rows - 1, Math.max(0, Math.floor(y / WORLD.cell[1])));
  return `${String.fromCharCode(65 + c)}${r + 1}`;
}

/** Dünya pikseli → mil. */
export const pxToMiles = (px: number): number => (px / WORLD.cell[0]) * WORLD.milesPerCell;

/** Nokta poligonun içinde mi (ışın atma). */
export function inPolygon(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i] as Pt, [xj, yj] = poly[j] as Pt;
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
