/**
 * Görev H1: kaydırılabilir geniş haritanın kamerası (saf hesaplar). Dünya koordinatları `mapView` ile aynı (altıgen boyutu
 * sabit; 15×7 dünyası 1280×715). Pencere standart haritanın oranında ekrana sığar; kamera pencerenin dünyadaki sol üst
 * köşesi (`x`, `y`) ve yakınlaştırma (`zoom`; 1: pencere ≈ 15×7 altıgen). Kamera durumu kayda girmez (yereldir).
 */
import { VIEW } from './mapView';

/**
 * `v1`: yakınlaştırma 1'de pencerenin dünyadaki boyutu (yoksa standart pencere `VIEW`). Görev D: telefon dikeyde ekran
 * standart oranda değil; pencere ekranın kendi oranında (`useMapCamera` `scaleScreen`), ölçek sabit kalır.
 */
export interface Camera { x: number; y: number; zoom: number; v1?: Size }
export interface Size { w: number; h: number }
export interface Point { x: number; y: number }

/** Yakınlaştırmanın üst sınırı. */
export const MAX_ZOOM = 2.5;
/** Dokunma hedefi: ekrandaki altıgen en az bu genişlikte (px) kalmalı. */
export const MIN_HEX_PX = 44;
/** Sürükleme eşiği (px): altı dokunma sayılır. */
export const DRAG_PX = 8;

/** Pencerenin dünyadaki boyutu (`v1`: yakınlaştırma 1'deki pencere; yoksa standart pencere). */
export const viewSize = (zoom: number, v1: Size = VIEW): Size => ({ w: v1.w / zoom, h: v1.h / zoom });
const viewOf = (c: Camera): Size => viewSize(c.zoom, c.v1);

/** Ekran pikseli / dünya pikseli. */
export const scaleOf = (screen: Size, zoom: number): number => (screen.w / VIEW.w) * zoom;

/**
 * Yakınlaştırma sınırları: alt sınır ekrandaki altıgen ≥ 44 px olacak kadar (en çok 1'e kadar iner: standart pencereden
 * dar olmaz ama küçük ekranda 1 korunur); "Tümünü göster" bu sınırı aşabilir (salt görüntüleme).
 */
export function zoomLimits(screen: Size, hexWorldW: number): { min: number; max: number } {
  const hexAt1 = hexWorldW * scaleOf(screen, 1);
  return { min: Math.min(1, MIN_HEX_PX / hexAt1), max: MAX_ZOOM };
}

/**
 * Serüven öncesi (yalnız arayüz): dar ekran (telefon dikey) — 1 yakınlaştırmada altıgen `MIN_HEX_PX`'ten darsa küçük haritada da
 * kamera açılır; varsayılan yakınlaştırma altıgeni `targetPx` genişliğine getirir (en çok `MAX_ZOOM`). Dar değilse null.
 */
export function narrowZoom(screen: Size, hexWorldW: number, targetPx: number): number | null {
  if (!(screen.w > 0)) return null;
  const hexAt1 = hexWorldW * scaleOf(screen, 1);
  if (hexAt1 >= MIN_HEX_PX) return null;
  return Math.min(MAX_ZOOM, Math.max(1, targetPx / hexAt1));
}

/** Dünyanın tamamını gösteren yakınlaştırma (Tümünü göster). */
export const fitZoom = (world: Size, v1: Size = VIEW): number => Math.min(v1.w / world.w, v1.h / world.h, 1);

/** Kamerayı dünyanın içinde tutar; dünya pencereden küçükse ortalar. */
export function clampCamera(c: Camera, world: Size): Camera {
  const v = viewOf(c);
  const axis = (p: number, view: number, size: number) => (size <= view ? (size - view) / 2 : Math.max(0, Math.min(size - view, p)));
  return { zoom: c.zoom, x: axis(c.x, v.w, world.w), y: axis(c.y, v.h, world.h), ...(c.v1 ? { v1: c.v1 } : {}) };
}

/** Noktayı pencerenin ortasına alır. */
export function centerOn(c: Camera, p: Point, world: Size): Camera {
  const v = viewOf(c);
  return clampCamera({ ...c, x: p.x - v.w / 2, y: p.y - v.h / 2 }, world);
}

/** Noktalar pencerede (kenar payıyla) kalsın diye en az kaydırma; sığmıyorsa ilki ortalanır. */
export function ensureVisible(c: Camera, points: Point[], world: Size, margin = 90): Camera {
  if (points.length === 0) return c;
  const v = viewOf(c);
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  if (x1 - x0 + 2 * margin > v.w || y1 - y0 + 2 * margin > v.h) return centerOn(c, points[0]!, world);
  let { x, y } = c;
  if (x0 - margin < x) x = x0 - margin;
  if (x1 + margin > x + v.w) x = x1 + margin - v.w;
  if (y0 - margin < y) y = y0 - margin;
  if (y1 + margin > y + v.h) y = y1 + margin - v.h;
  return clampCamera({ ...c, x, y }, world);
}

/** Ekrandaki bir noktayı sabit tutarak yakınlaştırır (tekerlek, iki parmak). */
export function zoomAt(c: Camera, nextZoom: number, anchorScreen: Point, screen: Size, world: Size, limits: { min: number; max: number }): Camera {
  const z = Math.max(limits.min, Math.min(limits.max, nextZoom));
  const k0 = scaleOf(screen, c.zoom), k1 = scaleOf(screen, z);
  const wx = c.x + anchorScreen.x / k0, wy = c.y + anchorScreen.y / k0;
  return clampCamera({ ...c, zoom: z, x: wx - anchorScreen.x / k1, y: wy - anchorScreen.y / k1 }, world);
}

/** Ekran pikseli kadar kaydırma (sürükleme, ok tuşları). */
export function panBy(c: Camera, dxScreen: number, dyScreen: number, screen: Size, world: Size): Camera {
  const k = scaleOf(screen, c.zoom);
  return clampCamera({ ...c, x: c.x - dxScreen / k, y: c.y - dyScreen / k }, world);
}

/** Nokta pencerenin içinde mi (ekran dışı olay okları için); değilse pencere kenarındaki yön (birim vektör). */
export function offscreenDir(c: Camera, p: Point): Point | null {
  const v = viewOf(c);
  if (p.x >= c.x && p.x <= c.x + v.w && p.y >= c.y && p.y <= c.y + v.h) return null;
  const dx = p.x - (c.x + v.w / 2), dy = p.y - (c.y + v.h / 2);
  const n = Math.hypot(dx, dy) || 1;
  return { x: dx / n, y: dy / n };
}

/** Görev M2: mini haritada nokta (dünya) görünür pencere dikdörtgeninin içinde mi (sürükleme bundan başlar). */
export function inView(c: Camera, p: Point): boolean {
  const v = viewOf(c);
  return p.x >= c.x && p.x <= c.x + v.w && p.y >= c.y && p.y <= c.y + v.h;
}

/**
 * Görev M2: mini haritada pencere sürükleme. `grab` dikdörtgenin tutulduğu yerin sol üst köşeye uzaklığı (dünya);
 * pencerenin sol üstü `p − grab` olur, kamera sınırları içinde kalır (yakınlaştırma değişmez).
 */
export function dragViewTo(c: Camera, grab: Point, p: Point, world: Size): Camera {
  return clampCamera({ ...c, x: p.x - grab.x, y: p.y - grab.y }, world);
}
