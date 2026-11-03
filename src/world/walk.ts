/**
 * K47: dünya haritasında yürüme (yol bulma, süre, karşılaşma) ve hızlı seyahat. Saf; zar `rng` ile.
 * Izgara `data/harita/yurume-izgara.json` (32 dünya pikseli hücre, 0 geçilmez; `scripts/yurume-izgara.py`),
 * parametreler `data/harita/gezinti-kurallari.json`.
 */
import izgara from '../../data/harita/yurume-izgara.json';
import kurallar from '../../data/harita/gezinti-kurallari.json';
import { CAMERAS, ISLANDS, SEA_ROUTES, inPolygon, pxToMiles, type Pt } from './worldData';
import type { Rng } from '../rules/dice';

export const WALK_RULES = kurallar as unknown as {
  yayaMilSaat: number; gemiMilSaat: number; ucusMilSaat: number; yolMaliyet: number; hubYaricap: number; yakalamaHucre: number;
  karsilasma: { carpan: number; yol: number; yabani: number; geceCarpan: number; gemi: number; ucus: number; kraken: number; geceSaat: [number, number] };
  irkHub: Record<string, string[]>; ucusBayraklari: string[]; korsanBayragi: string; yalnizKorsan: string[];
  hublar: Array<{ id: string; tur: 'yerlesim' | 'iskele'; iskele?: string; px: Pt }>;
  kontroller: Array<{ id: string; tur: 'kirmizi' | 'beyaz'; beceri: string[]; dc: number; px: Pt; yaricap: number; bayrak: string; pasifEsik?: number; ad: { tr: string; en: string } }>;
};

const CELL = izgara.hucre;
const GW = izgara.genislik, GH = izgara.yukseklik;
let costs: Uint8Array | null = null;
/** Hücre maliyetleri (RLE çözülür, önbellekli). */
function grid(): Uint8Array {
  if (costs) return costs;
  costs = new Uint8Array(GW * GH);
  izgara.satirlar.forEach((row: number[], y: number) => {
    let x = 0;
    for (let i = 0; i < row.length; i += 2) { costs!.fill(row[i] as number, y * GW + x, y * GW + x + (row[i + 1] as number)); x += row[i + 1] as number; }
  });
  return costs;
}

export const cellOf = (p: Pt): [number, number] => [Math.min(GW - 1, Math.max(0, Math.floor(p[0] / CELL))), Math.min(GH - 1, Math.max(0, Math.floor(p[1] / CELL)))];
const center = (x: number, y: number): Pt => [(x + 0.5) * CELL, (y + 0.5) * CELL];
export const costAt = (p: Pt): number => { const [x, y] = cellOf(p); return grid()[y * GW + x] as number; };
export const walkable = (p: Pt): boolean => costAt(p) > 0;

/** En yakın yürünebilir hücre (`yakalamaHucre` içinde; yoksa null). */
export function snap(p: Pt): [number, number] | null {
  const [cx, cy] = cellOf(p);
  const g = grid();
  for (let r = 0; r <= WALK_RULES.yakalamaHucre; r++) {
    let best: [number, number] | null = null, bd = Infinity;
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      if (x < 0 || y < 0 || x >= GW || y >= GH || !g[y * GW + x]) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d < bd) { bd = d; best = [x, y]; }
    }
    if (best) return best;
  }
  return null;
}

export interface WalkPlan { path: Pt[]; cells: Array<[number, number]>; miles: number; hours: number }

/** A* (8 yön, maliyet × uzunluk); erişilemezse null. Yol düzleştirilmiş noktalar (dünya pikseli). */
export function findPath(from: Pt, to: Pt): WalkPlan | null {
  const a = snap(from), b = snap(to);
  if (!a || !b) return null;
  const g = grid();
  const N = GW * GH, start = a[1] * GW + a[0], goal = b[1] * GW + b[0];
  const gs = new Float64Array(N).fill(Infinity), came = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  // İkili yığın (f, düğüm).
  const heap: Array<[number, number]> = [];
  const push = (f: number, n: number) => { heap.push([f, n]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p]![0] <= heap[i]![0]) break; [heap[p], heap[i]] = [heap[i]!, heap[p]!]; i = p; } };
  const pop = (): [number, number] => { const top = heap[0]!; const last = heap.pop()!; if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l]![0] < heap[m]![0]) m = l; if (r < heap.length && heap[r]![0] < heap[m]![0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i]!, heap[m]!]; i = m; } } return top; };
  const minCost = WALK_RULES.yolMaliyet;
  const h = (n: number) => Math.hypot((n % GW) - b[0], Math.floor(n / GW) - b[1]) * minCost;
  gs[start] = 0; push(h(start), start);
  while (heap.length) {
    const [, n] = pop();
    if (closed[n]) continue;
    if (n === goal) break;
    closed[n] = 1;
    const x = n % GW, y = Math.floor(n / GW);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const m = ny * GW + nx, c = g[m] as number;
      if (!c || closed[m]) continue;
      // Çapraz adımda köşe kesme yok (iki yanı da açık olmalı).
      if (dx && dy && (!g[y * GW + nx] || !g[ny * GW + x])) continue;
      const step = (dx && dy ? Math.SQRT2 : 1) * (c + (g[n] as number)) / 2;
      if (gs[n]! + step < gs[m]!) { gs[m] = gs[n]! + step; came[m] = n; push(gs[m]! + h(m), m); }
    }
  }
  if (!Number.isFinite(gs[goal]!)) return null;
  const cells: Array<[number, number]> = [];
  for (let n = goal; n !== -1; n = came[n]!) { cells.push([n % GW, Math.floor(n / GW)]); if (n === start) break; }
  cells.reverse();
  // Süre: hücre uzunluğu (mil) × maliyet/20 ÷ yaya hızı.
  let miles = 0, hours = 0;
  for (let i = 1; i < cells.length; i++) {
    const [x0, y0] = cells[i - 1]!, [x1, y1] = cells[i]!;
    const mi = pxToMiles(Math.hypot(x1 - x0, y1 - y0) * CELL);
    const c = ((g[y0 * GW + x0] as number) + (g[y1 * GW + x1] as number)) / 2;
    miles += mi; hours += (mi * (c / 20)) / WALK_RULES.yayaMilSaat;
  }
  // Düzleştirme: her 4 hücrede bir nokta + uç.
  const path = cells.filter((_, i) => i % 4 === 0 || i === cells.length - 1).map(([x, y]) => center(x, y));
  return { path, cells, miles, hours };
}

/** Saat gece mi (`geceSaat` [başlangıç, bitiş]). */
export const isNightHour = (hour: number): boolean => { const [a, b] = WALK_RULES.karsilasma.geceSaat; const hh = ((hour % 24) + 24) % 24; return a > b ? hh >= a || hh < b : hh >= a && hh < b; };

/** Yürüyüşte karşılaşma: geçilen hücre başına olasılık; olursa hücre sırası (yoksa -1). `multiplier` Game Master çarpanı. */
export function encounterIndex(plan: WalkPlan, startHour: number, rng: Rng, multiplier = WALK_RULES.karsilasma.carpan): number {
  const k = WALK_RULES.karsilasma;
  const g = grid();
  let hour = startHour;
  for (let i = 1; i < plan.cells.length; i++) {
    const [x, y] = plan.cells[i]!;
    const c = g[y * GW + x] as number;
    hour += (pxToMiles(CELL) * (c / 20)) / WALK_RULES.yayaMilSaat;
    const p = (c <= WALK_RULES.yolMaliyet ? k.yol : k.yabani) * (isNightHour(hour) ? k.geceCarpan : 1) * multiplier;
    if (rng() < p) return i;
  }
  return -1;
}

/** Noktanın bölgesi (kamera dikdörtgeni; ada poligonu önce). */
export function regionAt(p: Pt): string | null {
  for (const [id, poly] of Object.entries(ISLANDS)) if (inPolygon(p, poly)) return id;
  const hit = Object.entries(CAMERAS).filter(([id]) => id !== 'kita').find(([, r]) => p[0] >= r.x && p[0] <= r.x + r.w && p[1] >= r.y && p[1] <= r.y + r.h);
  return hit?.[0] ?? null;
}

export const hubById = (id: string) => WALK_RULES.hublar.find((h) => h.id === id);

/** İki iskele arasındaki deniz yolu (yön önemsiz); yoksa null. Rota kimliği "a-b". */
export function seaRoute(fromPort: string, toPort: string): { noktalar: Pt[]; mil: number } | null {
  const r = SEA_ROUTES.find((x) => x.id === `${fromPort}-${toPort}` || x.id === `${toPort}-${fromPort}`);
  if (!r) return null;
  return { noktalar: r.id.startsWith(fromPort) ? r.noktalar : [...r.noktalar].reverse(), mil: r.mil };
}
