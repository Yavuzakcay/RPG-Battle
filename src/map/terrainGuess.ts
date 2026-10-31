/**
 * Kuyruk 21 D1: görselden altıgen zemin önerisi (saf çekirdek; görsel okuma `scripts/harita-zemin.ts`'te).
 * 1) Her altıgenin ortalama rengi → 2) renk kümeleme (k-means, belirlenimci başlangıç) → 3) her küme merkezine en yakın
 * palet zemini (`harita/_ortak/zemin-renkleri.json`) → 4) elle düzeltme dosyası (`harita/<bolge>/duzeltme/<ad>.json`)
 * birleştirilir. Öneri yalnızca başlangıçtır; son sözü düzeltme dosyası söyler.
 */
export type Rgb = readonly [number, number, number];

/** Düzeltme dosyası (1 tabanlı sütun/satır; sırayla uygulanır: önce satırlar, sonra dikdörtgenler, en son hücreler). */
export interface TerrainCorrections {
  satirlar?: Record<string, string>;
  bolgeler?: Array<{ col0: number; row0: number; col1: number; row1: number; zemin: string }>;
  hucreler?: Array<{ col: number; row: number; zemin: string }>;
}

const d2 = (a: Rgb, b: Rgb) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

/**
 * Belirlenimci k-means: ilk merkez renklerin ortalamasına en yakın nokta, sonrakiler mevcut merkezlere en uzak nokta
 * (k-means++'ın rastgelesiz hâli). Dönen: merkezler ve her noktanın küme indeksi.
 */
export function kmeans(points: readonly Rgb[], k: number, iters = 20): { centers: Rgb[]; labels: number[] } {
  if (points.length === 0) return { centers: [], labels: [] };
  const n = Math.min(k, points.length);
  const mean: Rgb = [0, 1, 2].map((i) => points.reduce((s, p) => s + p[i]!, 0) / points.length) as unknown as Rgb;
  const centers: Rgb[] = [points.reduce((best, p) => (d2(p, mean) < d2(best, mean) ? p : best))];
  while (centers.length < n) {
    let far = points[0]!, farD = -1;
    for (const p of points) { const d = Math.min(...centers.map((c) => d2(p, c))); if (d > farD) { farD = d; far = p; } }
    centers.push(far);
  }
  let labels = points.map(() => 0);
  for (let it = 0; it < iters; it++) {
    const next = points.map((p) => centers.reduce((bi, c, i) => (d2(p, c) < d2(p, centers[bi]!) ? i : bi), 0));
    const changed = next.some((l, i) => l !== labels[i]);
    labels = next;
    for (let c = 0; c < centers.length; c++) {
      const mine = points.filter((_, i) => labels[i] === c);
      if (mine.length) centers[c] = [0, 1, 2].map((i) => mine.reduce((s, p) => s + p[i]!, 0) / mine.length) as unknown as Rgb;
    }
    if (!changed && it > 0) break;
  }
  return { centers, labels };
}

/** Palette en yakın zemin harfi (her harfin birden çok örnek rengi olabilir). */
export function nearestTerrain(c: Rgb, palette: Readonly<Record<string, readonly Rgb[]>>): string {
  let best = '.', bestD = Infinity;
  for (const [ch, list] of Object.entries(palette)) for (const p of list) { const d = d2(c, p); if (d < bestD) { bestD = d; best = ch; } }
  return best;
}

/** Algısal parlaklık (0–255). */
export const luminance = (c: Rgb) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];

/**
 * Altıgen renkleri (satır satır, `cols` × `rows`) → öneri satırları: kümele, her kümeyi palette eşle.
 * `voidLum`: parlaklığı bunun altındaki altıgenler kümelemeye girmeden `#` (harita dışı boşluk); koyu mağara zemini
 * siyah boşlukla karışmasın diye (Derinlikler görsellerinde zemin ≈ 30, boşluk ≈ 0–5).
 */
export function suggestTiles(colors: readonly Rgb[], cols: number, rows: number, palette: Readonly<Record<string, readonly Rgb[]>>, k = 8, voidLum = 0): string[] {
  const lit = colors.map((c, i) => ({ c, i })).filter(({ c }) => luminance(c) >= voidLum);
  const { centers, labels } = kmeans(lit.map(({ c }) => c), k);
  const charOf = centers.map((c) => nearestTerrain(c, palette));
  const out = colors.map(() => '#');
  lit.forEach(({ i }, j) => { out[i] = charOf[labels[j]!] ?? '.'; });
  return Array.from({ length: rows }, (_, r) => out.slice(r * cols, (r + 1) * cols).join(''));
}

/** Öneriye elle düzeltmeleri uygular (1 tabanlı). Geçersiz konum ya da tek harf olmayan zemin hata verir. */
export function applyCorrections(tiles: readonly string[], fix: TerrainCorrections): string[] {
  const grid = tiles.map((l) => [...l]);
  const rows = grid.length, cols = grid[0]?.length ?? 0;
  const set = (col: number, row: number, z: string, where: string) => {
    if (row < 1 || row > rows || col < 1 || col > cols) throw new Error(`${where}: (${col},${row}) harita dışında`);
    if ([...z].length !== 1) throw new Error(`${where}: zemin tek harf olmalı: "${z}"`);
    grid[row - 1]![col - 1] = z;
  };
  for (const [r, line] of Object.entries(fix.satirlar ?? {})) {
    const row = Number(r);
    if ([...line].length !== cols) throw new Error(`satır ${r}: ${[...line].length} harf, ${cols} olmalı`);
    [...line].forEach((z, i) => set(i + 1, row, z, `satır ${r}`));
  }
  for (const b of fix.bolgeler ?? []) {
    for (let r = Math.min(b.row0, b.row1); r <= Math.max(b.row0, b.row1); r++) for (let c = Math.min(b.col0, b.col1); c <= Math.max(b.col0, b.col1); c++) set(c, r, b.zemin, 'bölge');
  }
  for (const h of fix.hucreler ?? []) set(h.col, h.row, h.zemin, 'hücre');
  return grid.map((l) => l.join(''));
}
