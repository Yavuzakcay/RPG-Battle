/**
 * ROZET-CERCEVE-KIRPMA: rozet çerçevesine (`.avatar`: daire, 3 px kenarlık) jetonun bütün opak gövdesini sığdırma (yalnız görünüm; saf).
 *
 * Görünür alan "kemer": üst yarı içerik dairesi (çap = rozet − 2 × kenarlık), alt yarı aynı genişlikte dik kenarlı (ayaklar, etek, aşağı
 * bakan silah ucu dairenin alt köşelerinde kesilmez; figür çerçevenin alt kenarında durur). Kemer dışbükeydir.
 * Jetonun opak pikselleri (alfa > `ALPHA_MIN`) dışbükey zarfa indirgenir (`alphaHull`, birim kare koordinatı 0–1). Rozette görsel içerik
 * kutusunu doldurur; alt soy oranı (`--look-sx/sy`) ve yön aynası (`--mirror`) ayak çizgisinden uygulanır. `badgeFit` bundan sonra
 * zarfın kemere sığması için gereken EN KÜÇÜK değişikliği bulur:
 *   - zaten sığıyorsa dokunmaz (ölçek 1, kaydırma 0),
 *   - ölçek 1'de sığdıran en kısa kaydırma varsa yalnız kaydırır,
 *   - yoksa sığdıran en büyük ölçek (ayak çizgisinden; ikili arama) ve onda en kısa kaydırma.
 * Sonuç CSS (`--fit`: `translate(x%, y%) scale(k)`, kaynağı ayak çizgisi; taç ve kanat katmanı aynı dönüşümü izler) ve görselin kendi
 * koordinatında kemer kırpması (`--fit-clip`, `polygon(...)`) olarak `AvatarBadge`'e gider.
 */

/** Opak sayılan en küçük alfa (JETON-DENETIM ölçüsüyle aynı eşik). */
export const ALPHA_MIN = 60;
/** Kemer kenarındaki kenar yumuşatma payı (CSS px): figür kenara bu kadar yaklaşmaz. */
export const EDGE_PX = 0.75;
/** Rozet kenarlığı (CSS px; `styles.css` `.avatar` `border: 3px`). */
export const BADGE_BORDER = 3;
/** Kaydırma araması: dikeyde en çok bu kadar (içerik oranı), adım. */
const DY_MAX = 0.08, DY_STEP = 0.002;
/** Ölçek alt sınırı (bundan küçüğü aranmaz; ölçülen en küçük ≈ 0,83). */
const K_MIN = 0.5;

export type Pt = readonly [number, number];

/** Monotone zincir dışbükey zarf (saat yönünün tersi; tekrarsız). */
export function convexHull(points: readonly Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [], up: Pt[] = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2]!, lo[lo.length - 1]!, q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]!; while (up.length >= 2 && cross(up[up.length - 2]!, up[up.length - 1]!, q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop();
  return lo.concat(up);
}

/**
 * Alfa kanalından opak piksellerin dışbükey zarfı, birim kare koordinatında (piksel köşeleri dahil: zarf bütün opak pikselleri kapsar).
 * `rgba`: RGBA dizisi (canvas `getImageData` ya da sharp raw), `w`×`h`. Opak piksel yoksa boş.
 */
export function alphaHull(rgba: ArrayLike<number>, w: number, h: number, min = ALPHA_MIN): Pt[] {
  const pts: Pt[] = [];
  for (let y = 0; y < h; y++) {
    let x0 = -1, x1 = -1;
    for (let x = 0; x < w; x++) if (rgba[(y * w + x) * 4 + 3]! > min) { if (x0 < 0) x0 = x; x1 = x; }
    if (x0 < 0) continue;
    pts.push([x0 / w, y / h], [x0 / w, (y + 1) / h], [(x1 + 1) / w, y / h], [(x1 + 1) / w, (y + 1) / h]);
  }
  // Zarfın ağırlık merkezinden dışa doğru 3 basamağa yuvarlama (veri boyu): zarf küçülmez, en çok 0,001 büyür.
  const hull = convexHull(pts);
  const cx = hull.reduce((s, p) => s + p[0], 0) / Math.max(1, hull.length), cy = hull.reduce((s, p) => s + p[1], 0) / Math.max(1, hull.length);
  const out = (v: number, c: number) => (v < c ? Math.floor(v * 1000 + 1e-6) : Math.ceil(v * 1000 - 1e-6)) / 1000;
  return hull.map(([x, y]) => [out(x, cx), out(y, cy)] as const);
}

export interface BadgeFitInput {
  /** `alphaHull` (birim kare). */
  hull: readonly Pt[];
  /** Rozet boyu (CSS px, kenarlık dahil). */
  size: number;
  /** Alt soy oranı (`lineageLook` `scaleX/scaleY`); çerçevesiz rozette 1. */
  sx?: number; sy?: number;
  /** Yön aynası (`naturalLeft` → −1). */
  mirror?: 1 | -1;
  /** Ayak çizgisi (oran ve sığdırma dönüşümünün kaynağı; `FOOT_FRAC`). */
  foot: number;
}
export interface BadgeFit {
  /** Ölçek (≤ 1, ayak çizgisinden). */ k: number;
  /** Kaydırma, içerik kutusunun oranı (CSS `translate` yüzdesi / 100). */ tx: number; ty: number;
  /** Kemerin yarıçapı (birim; kenar payı düşülmüş). */ r: number;
}

/** Kemer yarıçapı (birim): içerik dairesi eksi kenar payı. */
export const archRadius = (size: number) => 0.5 - EDGE_PX / Math.max(1, size - 2 * BADGE_BORDER);

/** Görselin birim noktası → rozet içerik kutusunda (oran + ayna, ayak kaynaklı). */
const lookPoints = (o: BadgeFitInput): Pt[] => {
  const sx = (o.sx ?? 1) * (o.mirror ?? 1), sy = o.sy ?? 1;
  return o.hull.map((p) => [0.5 + sx * (p[0] - 0.5), o.foot + sy * (p[1] - o.foot)] as const);
};

/** Verilen dikey kaydırmada kemere sığdıran yatay kaydırma aralığı (yoksa null). Noktalar ölçeklenmiş (ayaktan) içerik koordinatında. */
function dxRange(Q: readonly Pt[], dy: number, R: number): [number, number] | null {
  let lo = -Infinity, hi = Infinity;
  for (const [x, y0] of Q) {
    const y = y0 + dy;
    let half: number;
    if (y <= 0.5) { const d = 0.5 - y; if (d > R) return null; half = Math.sqrt(R * R - d * d); }
    else if (y <= 0.5 + R) half = R;
    else return null;
    lo = Math.max(lo, 0.5 - half - x); hi = Math.min(hi, 0.5 + half - x);
    if (lo > hi) return null;
  }
  return [lo, hi];
}

/** Ölçek `k`'de (ayaktan) sığdıran en kısa kaydırma; yoksa null. */
function shortestShift(Q: readonly Pt[], foot: number, k: number, R: number): [number, number] | null {
  const S = Q.map(([x, y]) => [0.5 + k * (x - 0.5), foot + k * (y - foot)] as const);
  let best: [number, number] | null = null, bestN = Infinity;
  const n = Math.round(DY_MAX / DY_STEP);
  // Dikey adımlar küçükten büyüğe (0, ±1, ±2 …): ilk bulunan dikeyde en kısa yatay; daha kısası artık çıkamazsa dur.
  for (let i = 0; i <= n; i++) for (const s of i ? [-1, 1] : [1]) {
    const dy = s * i * DY_STEP;
    if (Math.abs(dy) >= bestN) return best;
    const r = dxRange(S, dy, R);
    if (!r) continue;
    const dx = r[0] > 0 ? r[0] : r[1] < 0 ? r[1] : 0;
    const len = Math.hypot(dx, dy);
    if (len < bestN) { bestN = len; best = [dx, dy]; }
  }
  return best;
}

/** Sığdırma: bkz. dosya başı. Boş zarfta dokunmaz. */
export function badgeFit(o: BadgeFitInput): BadgeFit {
  const R = archRadius(o.size);
  const id = { k: 1, tx: 0, ty: 0, r: R };
  if (!o.hull.length) return id;
  const Q = lookPoints(o);
  const at1 = shortestShift(Q, o.foot, 1, R);
  if (at1) return { k: 1, tx: at1[0], ty: at1[1], r: R };
  let lo = K_MIN, hi = 1;
  if (!shortestShift(Q, o.foot, lo, R)) return { ...id, k: lo };
  for (let i = 0; i < 16; i++) { const mid = (lo + hi) / 2; if (shortestShift(Q, o.foot, mid, R)) lo = mid; else hi = mid; }
  const t = shortestShift(Q, o.foot, lo, R)!;
  return { k: lo, tx: t[0], ty: t[1], r: R };
}

/** Dönüşümden sonra zarf köşeleri (birim içerik kutusu; doğrulama ve test). */
export function fittedHull(o: BadgeFitInput, f: BadgeFit): Pt[] {
  return lookPoints(o).map(([x, y]) => [0.5 + f.k * (x - 0.5) + f.tx, o.foot + f.k * (y - o.foot) + f.ty] as const);
}

/** Nokta kemerin içinde mi (pay `eps`, birim). */
export function inArch(p: Pt, r: number, eps = 1e-9): boolean {
  const [x, y] = p;
  if (y <= 0.5) return Math.hypot(x - 0.5, y - 0.5) <= r + eps;
  return Math.abs(x - 0.5) <= r + eps && y <= 0.5 + r + eps;
}

/** Kemerin sınırı (içerik kutusu birimi): üst yarım daire + alt dik kenarlar. */
export function archOutline(r: number, seg = 20): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= seg; i++) { const a = Math.PI + (Math.PI * i) / seg; pts.push([0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)]); }
  pts.push([0.5 + r, 0.5 + r], [0.5 - r, 0.5 + r]);
  return pts;
}

const pct = (n: number) => `${Math.round(n * 10000) / 100}%`;
/**
 * CSS değişkenleri: `--fit` (görsel, taç, kanat katmanı; dokunulmayan jetonda yok) ve `--fit-clip`: kemer, görselin KENDİ koordinatında
 * (CSS `clip-path` dönüşümden önce uygulanır: kemer oran, ayna ve sığdırma dönüşümünün tersiyle görsele taşınır).
 */
export function fitCss(o: BadgeFitInput, f: BadgeFit): { fit?: string; clip: string } {
  const sx = (o.sx ?? 1) * (o.mirror ?? 1), sy = o.sy ?? 1;
  const inv = ([x, y]: Pt) => `${pct(0.5 + (x - 0.5 - f.tx) / (f.k * sx))} ${pct(o.foot + (y - o.foot - f.ty) / (f.k * sy))}`;
  const clip = `polygon(${archOutline(f.r).map(inv).join(', ')})`;
  const r4 = (n: number) => Math.round(n * 10000) / 10000;
  return f.k === 1 && f.tx === 0 && f.ty === 0 ? { clip } : { fit: `translate(${pct(f.tx)}, ${pct(f.ty)}) scale(${r4(f.k)})`, clip };
}
