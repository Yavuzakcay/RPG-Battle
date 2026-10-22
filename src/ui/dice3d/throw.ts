/**
 * "Sahte fizik" zar atışı (Görev J3): zarlar tepsinin solundan fırlatılır, birkaç kez seker, yuvarlanır ve önceden
 * belli sonuca oturur. Dönme, durma yöneliminden geriye doğru hesaplanır: q(t) = dönüş(eksen, açı·(1 − t)²) · q_son;
 * t = 1'de açı 0, zar tam istenen yüzde durur. Saf hesap (three.js yok), testlerde örneklenebilir.
 */
import { axisAngle, mul, norm, type Quat, type Vec3 } from './math';

export interface Tray { width: number; depth: number }
export const TRAY: Tray = { width: 6, depth: 4 };

/** Zemine değme anları (0–1) ve sonraki sekmenin tepe yüksekliği (zar boyuna göre). */
const BOUNCES = [0.36, 0.6, 0.76, 0.87];
const PEAKS = [0.9, 0.38, 0.12];

export interface DiePath {
  rest: Vec3;
  /** Zarın görünen yarıçapı (çevrel küre). */
  size: number;
  start: Vec3;
  axis: Vec3;
  turns: number;
  final: Quat;
  /** Zeminden merkez yüksekliği (oturunca). */
  restHeight: number;
}

export interface DieFrame { pos: Vec3; quat: Quat; /** Gölge koyuluğu 0–1 (yükseldikçe açılır). */ shadow: number; height: number }

/** n zarın tepsideki duruş yerleri ve boyu: tek sıra (≤4), fazlası iki sıra; çarpışmasın diye ayrı hücreler. */
export function layout(n: number, rand: () => number, tray: Tray = TRAY): { centers: Vec3[]; size: number } {
  const rows = n > 4 ? 2 : 1;
  const cols = Math.ceil(n / rows);
  const cw = tray.width / cols, cd = tray.depth / rows;
  const size = Math.min(n <= 2 ? 1.15 : 0.9, cw * 0.32, cd * 0.32);
  const centers: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const inRow = r === rows - 1 ? n - cols * (rows - 1) : cols;
    const x = (c - (inRow - 1) / 2) * cw * 0.92 + (rand() - 0.5) * cw * 0.12;
    const z = (r - (rows - 1) / 2) * cd * 0.9 + (rand() - 0.5) * cd * 0.12;
    centers.push([x, 0, z]);
  }
  return { centers, size };
}

export function makePath(rest: Vec3, size: number, final: Quat, restHeight: number, rand: () => number, tray: Tray = TRAY): DiePath {
  const start: Vec3 = [-tray.width / 2 - 2.2 - rand() * 0.6, 0, rest[2] + 1.2 + (rand() - 0.5) * 0.8];
  // Yuvarlanma ekseni harekete dik (biraz eğik): zemin üstünde yuvarlanır gibi.
  const dir = norm([rest[0] - start[0], 0, rest[2] - start[2]]);
  const axis = norm([dir[2] + (rand() - 0.5) * 0.4, (rand() - 0.5) * 0.5, -dir[0] + (rand() - 0.5) * 0.4]);
  return { rest, size, start, axis, turns: 1.6 + rand() * 1.2, final, restHeight };
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 2.4);

/** Zemin üstü yükseklik (zar boyu cinsinden): düşüş, azalan sekmeler, sonra durgun. */
export function hop(t: number): number {
  const b0 = BOUNCES[0] as number;
  if (t <= b0) return 3 * (1 - (t / b0) ** 2);
  for (let k = 0; k < BOUNCES.length - 1; k++) {
    const a = BOUNCES[k] as number, b = BOUNCES[k + 1] as number;
    if (t <= b) { const u = (t - a) / (b - a); return 4 * (PEAKS[k] ?? 0) * u * (1 - u); }
  }
  return 0;
}

export function frameAt(p: DiePath, t: number): DieFrame {
  const tt = Math.min(1, Math.max(0, t));
  const e = easeOut(tt);
  const h = hop(tt) * p.size;
  const pos: Vec3 = [
    p.start[0] + (p.rest[0] - p.start[0]) * e,
    p.restHeight + h,
    p.start[2] + (p.rest[2] - p.start[2]) * e,
  ];
  const angle = p.turns * Math.PI * 2 * (1 - tt) ** 2;
  const quat = mul(axisAngle(p.axis, angle), p.final);
  return { pos, quat, shadow: Math.max(0.15, 1 - h / (3 * p.size)), height: h };
}

/** Ses tetikleri için zemine değme anları (0–1) ve şiddeti; son değme "durdu" sayılmaz. */
export function bounceTimes(): Array<{ t: number; strength: number }> {
  return BOUNCES.map((t, i) => ({ t, strength: [1, 0.55, 0.3, 0.15][i] ?? 0.1 }));
}
