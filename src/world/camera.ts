/**
 * K46: dünya görüntüleyici kamerası. Saf. `cx, cy` görünen alanın merkezi (dünya pikseli), `scale` ekran pikseli
 * başına dünya pikseli (büyük = uzak). Görünüm kayda girmez.
 */
import { WORLD, type Pt, type Rect } from './worldData';

export interface Camera { cx: number; cy: number; scale: number }
export interface Viewport { w: number; h: number }

/** En yakın zoom (1:1, ekran pikseli başına 0,5 dünya pikseli) ve en uzak (bütün harita ekrana sığar). */
export const MIN_SCALE = 0.5;
export const maxScale = (vp: Viewport): number => Math.max(WORLD.w / Math.max(1, vp.w), WORLD.h / Math.max(1, vp.h)) * 1.05;

/** Kamerayı dünya sınırına ve zoom aralığına sıkıştırır. */
export function clampCamera(c: Camera, vp: Viewport): Camera {
  const scale = Math.min(maxScale(vp), Math.max(MIN_SCALE, c.scale));
  const halfW = (vp.w * scale) / 2, halfH = (vp.h * scale) / 2;
  const cx = halfW * 2 >= WORLD.w ? WORLD.w / 2 : Math.min(WORLD.w - halfW, Math.max(halfW, c.cx));
  const cy = halfH * 2 >= WORLD.h ? WORLD.h / 2 : Math.min(WORLD.h - halfH, Math.max(halfH, c.cy));
  return { cx, cy, scale };
}

/** Dikdörtgeni ekrana sığdıran kamera (en-boy oranı korunur). */
export function fitRect(r: Rect, vp: Viewport): Camera {
  return clampCamera({ cx: r.x + r.w / 2, cy: r.y + r.h / 2, scale: Math.max(r.w / Math.max(1, vp.w), r.h / Math.max(1, vp.h)) }, vp);
}

/** Bütün harita. */
export const fitWorld = (vp: Viewport): Camera => fitRect({ x: 0, y: 0, w: WORLD.w, h: WORLD.h }, vp);

export const toWorld = (c: Camera, vp: Viewport, sx: number, sy: number): Pt => [c.cx + (sx - vp.w / 2) * c.scale, c.cy + (sy - vp.h / 2) * c.scale];
export const toScreen = (c: Camera, vp: Viewport, wx: number, wy: number): Pt => [(wx - c.cx) / c.scale + vp.w / 2, (wy - c.cy) / c.scale + vp.h / 2];

/** Ekran noktası yerinde kalacak biçimde yakınlaştır (factor < 1 yaklaşır). */
export function zoomAt(c: Camera, vp: Viewport, factor: number, sx: number, sy: number): Camera {
  const [wx, wy] = toWorld(c, vp, sx, sy);
  const scale = Math.min(maxScale(vp), Math.max(MIN_SCALE, c.scale * factor));
  return clampCamera({ cx: wx - (sx - vp.w / 2) * scale, cy: wy - (sy - vp.h / 2) * scale, scale }, vp);
}

/** Ekran pikseli kadar kaydır. */
export const panBy = (c: Camera, vp: Viewport, dx: number, dy: number): Camera => clampCamera({ ...c, cx: c.cx - dx * c.scale, cy: c.cy - dy * c.scale }, vp);

/** Görünen dünya dikdörtgeni. */
export function viewRect(c: Camera, vp: Viewport): Rect {
  return { x: c.cx - (vp.w * c.scale) / 2, y: c.cy - (vp.h * c.scale) / 2, w: vp.w * c.scale, h: vp.h * c.scale };
}

/** Ölçek çubuğu: ekranda ~120 px'e en yakın yuvarlak mil değeri ve piksel boyu. */
export function scaleBar(c: Camera, targetPx = 120): { miles: number; px: number } {
  const milesPerPx = (c.scale / WORLD.cell[0]) * WORLD.milesPerCell;
  const raw = milesPerPx * targetPx;
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  const miles = steps.find((s) => s >= raw * 0.6) ?? steps[steps.length - 1] as number;
  return { miles, px: miles / milesPerPx };
}
