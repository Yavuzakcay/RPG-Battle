/**
 * K46: keşif sisi. Saf; savaş hesabına ve kural sürümüne bağlı değil. Dünya 96×42 hücrelik bit ızgarası
 * (`data/harita/kesif-kurallari.json` `izgara`), Serüven kaydında `kesif` (base64). Açık hücre = keşfedilmiş.
 * Adalar (`sis-poligonlari.json`) yalnızca bayrakla bütün poligon olarak açılır; kapalı adanın iç hücreleri (hücre
 * merkezi poligonda) daire/yol açılmasında atlanır, kıyı hücreleri açılabilir ("kıyıdan geçerken kenar görünür").
 */
import { FOG_RULES, ISLANDS, WORLD, inPolygon, type Pt } from './worldData';

export const FOG_COLS = FOG_RULES.izgara[0];
export const FOG_ROWS = FOG_RULES.izgara[1];
export const CELL_W = WORLD.w / FOG_COLS;
export const CELL_H = WORLD.h / FOG_ROWS;

/** Açık hücreler (satır öncelikli, 1 = açık). */
export type Fog = Uint8Array;

export const emptyFog = (): Fog => new Uint8Array(FOG_COLS * FOG_ROWS);
export const fullFog = (): Fog => new Uint8Array(FOG_COLS * FOG_ROWS).fill(1);
export const cellCenter = (c: number, r: number): Pt => [(c + 0.5) * CELL_W, (r + 0.5) * CELL_H];

/** Hücrenin hangi adaya ait olduğu (merkezi poligon içinde), önbellekli. */
let islandCells: Array<string | null> | null = null;
function islandOf(i: number): string | null {
  if (!islandCells) {
    islandCells = Array.from({ length: FOG_COLS * FOG_ROWS }, (_, k) => {
      const p = cellCenter(k % FOG_COLS, Math.floor(k / FOG_COLS));
      return Object.entries(ISLANDS).find(([, poly]) => inPolygon(p, poly))?.[0] ?? null;
    });
  }
  return islandCells[i] ?? null;
}

/** Ada bayrakla açık mı (`adaBayraklari`: herhangi biri yeter). */
export const islandUnlocked = (id: string, flags: readonly string[]): boolean => (FOG_RULES.adaBayraklari[id] ?? []).some((f) => flags.includes(f));

/** Dairenin değdiği hücreleri açar (kapalı adanın iç hücreleri hariç). Yeni ızgara döner. */
export function revealCircle(fog: Fog, center: Pt, radius: number, flags: readonly string[] = []): Fog {
  const out = new Uint8Array(fog);
  const c0 = Math.max(0, Math.floor((center[0] - radius) / CELL_W)), c1 = Math.min(FOG_COLS - 1, Math.floor((center[0] + radius) / CELL_W));
  const r0 = Math.max(0, Math.floor((center[1] - radius) / CELL_H)), r1 = Math.min(FOG_ROWS - 1, Math.floor((center[1] + radius) / CELL_H));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    // Hücre dikdörtgeninin daireye en yakın noktası.
    const nx = Math.max(c * CELL_W, Math.min(center[0], (c + 1) * CELL_W));
    const ny = Math.max(r * CELL_H, Math.min(center[1], (r + 1) * CELL_H));
    if (Math.hypot(nx - center[0], ny - center[1]) > radius) continue;
    const i = r * FOG_COLS + c;
    const isl = islandOf(i);
    if (isl && !islandUnlocked(isl, flags)) continue;
    out[i] = 1;
  }
  return out;
}

/** Yol boyunca iz (hücre yarısı aralıkla daire). */
export function revealPath(fog: Fog, points: readonly Pt[], radius: number, flags: readonly string[] = []): Fog {
  let out = fog;
  if (points.length === 1) return revealCircle(out, points[0] as Pt, radius, flags);
  const step = Math.min(CELL_W, CELL_H) / 2;
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1] as Pt, points[i] as Pt];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k <= n; k++) out = revealCircle(out, [a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n], radius, flags);
  }
  return out;
}

/** Bayrağı gelmiş adaların bütün hücrelerini açar. */
export function unlockIslands(fog: Fog, flags: readonly string[]): Fog {
  const out = new Uint8Array(fog);
  for (let i = 0; i < out.length; i++) { const isl = islandOf(i); if (isl && islandUnlocked(isl, flags)) out[i] = 1; }
  return out;
}

export function isRevealed(fog: Fog, x: number, y: number): boolean {
  const c = Math.floor(x / CELL_W), r = Math.floor(y / CELL_H);
  if (c < 0 || r < 0 || c >= FOG_COLS || r >= FOG_ROWS) return false;
  return fog[r * FOG_COLS + c] === 1;
}

export const revealedCount = (fog: Fog): number => fog.reduce((n, v) => n + v, 0);

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Bit ızgarası → base64 (bayt başına 8 hücre). */
export function encodeFog(fog: Fog): string {
  const bytes = new Uint8Array(Math.ceil(fog.length / 8));
  for (let i = 0; i < fog.length; i++) if (fog[i]) bytes[i >> 3]! |= 1 << (i & 7);
  let s = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i]! << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    s += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]! + (i + 1 < bytes.length ? B64[(n >> 6) & 63]! : '=') + (i + 2 < bytes.length ? B64[n & 63]! : '=');
  }
  return s;
}

/** base64 → bit ızgarası; bozuk ya da yanlış boyda null. */
export function decodeFog(s: string): Fog | null {
  const clean = s.replace(/=+$/, '');
  if (!/^[A-Za-z0-9+/]*$/.test(clean)) return null;
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const v = [0, 1, 2, 3].map((k) => (i + k < clean.length ? B64.indexOf(clean[i + k] as string) : 0));
    const n = (v[0]! << 18) | (v[1]! << 12) | (v[2]! << 6) | v[3]!;
    bytes.push((n >> 16) & 255);
    if (i + 2 < clean.length) bytes.push((n >> 8) & 255);
    if (i + 3 < clean.length) bytes.push(n & 255);
  }
  if (bytes.length !== Math.ceil((FOG_COLS * FOG_ROWS) / 8)) return null;
  const fog = emptyFog();
  for (let i = 0; i < fog.length; i++) fog[i] = (bytes[i >> 3]! >> (i & 7)) & 1;
  return fog;
}
