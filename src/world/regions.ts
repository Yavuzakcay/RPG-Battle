/**
 * K49 D: dünya bölgeleri ve bölge içi yüzme. Saf. Bölge ve yüzme ızgarası `data/harita/bolge-izgara.json`
 * (`scripts/k49-bolgeler.py`; hücre yürüme ızgarasıyla aynı, 32 dünya pikseli), parametreler `data/harita/bolge-yukleme.json`.
 * Serüven anahtarı `bolgeYukleme` (varsayılan açık); kapalıyken K47: yüzme yok, geçiş ekranı yok.
 */
import izgara from '../../data/harita/bolge-izgara.json';
import ayar from '../../data/harita/bolge-yukleme.json';
import type { Pt } from './worldData';

export interface WorldRegion { id: string; tr: string; en: string; kutu: [number, number, number, number] }
export const REGIONS = izgara.bolgeler as unknown as WorldRegion[];
export const REGION_RULES = ayar as unknown as {
  sureMs: { en: number; cok: number }; azaltMs: number; onYuklemeZoom: number[]; onYuklemeEnFazla: number;
  yuzme: { maliyet: number; dc: number; beceri: string[]; basarisizSaat: number; agirZirh: 'red' | 'uyari' };
};
export const SWIM = REGION_RULES.yuzme;
export const REGION_TOGGLE = 'bolgeYukleme';

const CELL = izgara.hucre, GW = izgara.genislik, GH = izgara.yukseklik;
const decode = (rows: number[][]): Uint8Array => {
  const out = new Uint8Array(GW * GH);
  rows.forEach((row, y) => { let x = 0; for (let i = 0; i < row.length; i += 2) { out.fill(row[i] as number, y * GW + x, y * GW + x + (row[i + 1] as number)); x += row[i + 1] as number; } });
  return out;
};
let reg: Uint8Array | null = null, swim: Uint8Array | null = null;
const regGrid = () => (reg ??= decode(izgara.satirlar as number[][]));
const swimGrid = () => (swim ??= decode(izgara.yuzme as number[][]));
const idx = (p: Pt) => Math.min(GH - 1, Math.max(0, Math.floor(p[1] / CELL))) * GW + Math.min(GW - 1, Math.max(0, Math.floor(p[0] / CELL)));

/** Noktanın hücre dizini (bölge/yüzme ızgarası). */
export const cellIndex = (p: Pt): number => idx(p);
/** Hücre dizininde yüzülebilir dar su mu (göl/nehir). */
export const swimAt = (i: number): boolean => swimGrid()[i] === 1;
/** Noktanın K49 bölgesi (yoksa null: açık deniz). */
export function worldRegionAt(p: Pt): WorldRegion | null {
  const r = regGrid()[idx(p)] ?? 0;
  return r ? REGIONS[r - 1] ?? null : null;
}

/** Yol boyunca ilk bölge değişimi (geçilen yeni bölge); yoksa null. Denizdeki (bölgesiz) noktalar atlanır. */
export function regionCrossing(path: Pt[]): WorldRegion | null {
  let cur: string | null = null;
  for (const p of path) {
    const r = worldRegionAt(p);
    if (!r) continue;
    if (cur && r.id !== cur) return r;
    cur = r.id;
  }
  return null;
}
/** Son bölge (yol bölge değiştirdiyse varılan bölge). */
export function arrivalRegion(path: Pt[]): WorldRegion | null {
  const from = path.length ? worldRegionAt(path[0]!) : null;
  for (let i = path.length - 1; i >= 0; i--) { const r = worldRegionAt(path[i]!); if (r) return r.id !== from?.id ? r : null; }
  return null;
}

/** Manifestteki zoom kaydı (yalnız gereken alanlar). */
export interface ZoomInfo { z: number; olcek: number; sutun: number; satir: number }
/** Bölgenin kutusunu kapsayan karolar (`onYuklemeZoom`, en çok `onYuklemeEnFazla`; önce düşük zoom). Yol `{z}/{x}/{y}.webp`. */
export function regionTiles(r: WorldRegion, zooms: ZoomInfo[], tile: number, levels = REGION_RULES.onYuklemeZoom, max = REGION_RULES.onYuklemeEnFazla): string[] {
  const out: string[] = [];
  for (const z of [...levels].sort((a, b) => a - b)) {
    const info = zooms.find((x) => x.z === z);
    if (!info) continue;
    const s = info.olcek * 1 / tile;
    const [x0, y0, x1, y1] = r.kutu;
    for (let y = Math.max(0, Math.floor(y0 * s)); y <= Math.min(info.satir - 1, Math.floor(y1 * s)); y++)
      for (let x = Math.max(0, Math.floor(x0 * s)); x <= Math.min(info.sutun - 1, Math.floor(x1 * s)); x++) {
        if (out.length >= max) return out;
        out.push(`${z}/${x}/${y}.webp`);
      }
  }
  return out;
}

/** Geçiş ekranının süresi: ön yükleme bitince ama en az `en`, en çok `cok`; hareketi azaltmada kısa solma. */
export function transitionMs(loadMs: number, reduced: boolean): number {
  if (reduced) return REGION_RULES.azaltMs;
  return Math.min(REGION_RULES.sureMs.cok, Math.max(REGION_RULES.sureMs.en, loadMs));
}
