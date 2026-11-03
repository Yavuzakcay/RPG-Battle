/**
 * K46: dünya haritası karo seçimi ve önbelleği (K45 `public/maps/dunya/manifest.json`). Saf.
 */
import type { Camera, Viewport } from './camera';
import { viewRect } from './camera';

export interface TileZoom { z: number; olcek: number; genislik: number; yukseklik: number; sutun: number; satir: number }
export interface TileManifest { tuval: [number, number]; karo: number; seviye: number; zoomlar: TileZoom[]; karoSayisi?: number }
export interface TileRef { z: number; x: number; y: number; key: string; url: string }

/** Kamera ölçeğine uygun zoom: karonun bir pikseli ekranda ≥ 1 piksel olacak en düşük ayrıntı (yeterli keskinlik). */
export function zoomFor(m: TileManifest, c: Camera, dpr = 1): TileZoom {
  const want = 1 / (c.scale / dpr); // ekran fiziksel pikseli başına dünya pikseli tersi
  const zs = [...m.zoomlar].sort((a, b) => a.z - b.z);
  return zs.find((z) => z.olcek >= want) ?? (zs[zs.length - 1] as TileZoom);
}

export const tileUrl = (base: string, z: number, x: number, y: number) => `${base}/${z}/${x}/${y}.webp`;

/** Görünür alan + `ring` karo halkası; merkezden uzaklığa göre sıralı (yakın önce). */
export function tilesInView(m: TileManifest, z: TileZoom, c: Camera, vp: Viewport, base: string, ring = 1): TileRef[] {
  const r = viewRect(c, vp);
  const size = m.karo / z.olcek; // bir karonun dünya pikseli
  const x0 = Math.max(0, Math.floor(r.x / size) - ring), x1 = Math.min(z.sutun - 1, Math.floor((r.x + r.w) / size) + ring);
  const y0 = Math.max(0, Math.floor(r.y / size) - ring), y1 = Math.min(z.satir - 1, Math.floor((r.y + r.h) / size) + ring);
  const out: TileRef[] = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push({ z: z.z, x, y, key: `${z.z}/${x}/${y}`, url: tileUrl(base, z.z, x, y) });
  const mx = c.cx / size, my = c.cy / size;
  return out.sort((a, b) => Math.hypot(a.x + 0.5 - mx, a.y + 0.5 - my) - Math.hypot(b.x + 0.5 - mx, b.y + 0.5 - my));
}

/** Karonun dünya dikdörtgeni. */
export function tileRect(m: TileManifest, z: TileZoom, x: number, y: number): { x: number; y: number; w: number; h: number } {
  const size = m.karo / z.olcek;
  return { x: x * size, y: y * size, w: Math.min(size, m.tuval[0] - x * size), h: Math.min(size, m.tuval[1] - y * size) };
}

/** En çok `limit` öğeli LRU önbellek (karo görselleri; en eski çıkarılır, `onEvict` ile serbest bırakılır). */
export class Lru<K, V> {
  private map = new Map<K, V>();
  constructor(readonly limit: number, private onEvict?: (k: K, v: V) => void) {}
  get size(): number { return this.map.size; }
  get(k: K): V | undefined {
    const v = this.map.get(k);
    if (v !== undefined) { this.map.delete(k); this.map.set(k, v); }
    return v;
  }
  has(k: K): boolean { return this.map.has(k); }
  set(k: K, v: V): void {
    if (this.map.has(k)) this.map.delete(k);
    this.map.set(k, v);
    while (this.map.size > this.limit) {
      const [ok, ov] = this.map.entries().next().value as [K, V];
      this.map.delete(ok);
      this.onEvict?.(ok, ov);
    }
  }
  keys(): K[] { return [...this.map.keys()]; }
}
