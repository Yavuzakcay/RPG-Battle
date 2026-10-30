/**
 * Görev K24: yapay zekâ (Gemini vb.) ile üretilmiş ham ten maskesinin içe aktarılması (saf piksel işlemi; betik
 * `scripts/soy-maske-ice.ts` sharp ile okur/yazar). Ham görsel her boyutta, gri tonlu, kenarlı ya da kaymış olabilir.
 * Sıra: gri ton (çağıran) → çerçeve kırpma ve en-boy denetimi → jetonun tuvaline ya da opak sınırlayıcı kutusuna
 * eşleme (en yakın komşu) → eşik → jetonun saydam piksellerinde sıfır → küçük bileşen ve tek piksel delik temizliği.
 * Çıktı K21 elle maske biçiminde (jetonla aynı boyut, 0/255 gri). Kalite: otomatik maskeyle IoU, beyaz oranı, taşma.
 */

export interface Gray { data: Uint8Array; w: number; h: number }

export const RAW_MASK = {
  /** Varsayılan eşik (≥ beyaz). */
  threshold: 128,
  /** Bundan küçük beyaz bileşenler silinir (piksel). */
  minComponent: 4,
  /** En-boy oranı farkı bunu aşarsa uyarı. */
  aspectTolerance: 0.03,
  /** Otomatik maskeyle IoU bunun altındaysa "hizasız" uyarısı. */
  minIoU: 0.3,
  /** Beyaz piksellerin jetonun opak alanına oranı sınırları. */
  minWhite: 0.02,
  maxWhite: 0.8,
  /** Çerçeve sayılan kenar satırının en büyük değer aralığı (tekdüze). */
  frameRange: 12,
} as const;

/** Görüntüde [x0, y0, x1, y1] (dahil) dikdörtgen. */
export type Rect = [number, number, number, number];

const rowRange = (g: Gray, y: number, x0: number, x1: number) => {
  let lo = 255, hi = 0;
  for (let x = x0; x <= x1; x++) { const v = g.data[y * g.w + x]!; if (v < lo) lo = v; if (v > hi) hi = v; }
  return [lo, hi] as const;
};
const colRange = (g: Gray, x: number, y0: number, y1: number) => {
  let lo = 255, hi = 0;
  for (let y = y0; y <= y1; y++) { const v = g.data[y * g.w + x]!; if (v < lo) lo = v; if (v > hi) hi = v; }
  return [lo, hi] as const;
};

/**
 * Çerçeve kırpma: (1) kenardaki tekdüze ve siyah olmayan satır/sütunlar (gri ya da beyaz çerçeve) her zaman kırpılır;
 * (2) en-boy oranı hedeften farklıysa uzun kenardaki tekdüze siyah boşluk, oran tutana dek iki uçtan dengeli kırpılır.
 */
export function cropFrame(g: Gray, targetAspect: number): { rect: Rect; trimmed: boolean } {
  let [x0, y0, x1, y1] = [0, 0, g.w - 1, g.h - 1];
  const uniform = ([lo, hi]: readonly [number, number]) => hi - lo <= RAW_MASK.frameRange;
  const framed = (r: readonly [number, number]) => uniform(r) && r[0] >= 20;
  let changed = true, trimmed = false;
  while (changed && x1 - x0 > 4 && y1 - y0 > 4) {
    changed = false;
    if (framed(rowRange(g, y0, x0, x1))) { y0++; changed = true; }
    if (framed(rowRange(g, y1, x0, x1))) { y1--; changed = true; }
    if (framed(colRange(g, x0, y0, y1))) { x0++; changed = true; }
    if (framed(colRange(g, x1, y0, y1))) { x1--; changed = true; }
    trimmed ||= changed;
  }
  const aspect = () => (x1 - x0 + 1) / (y1 - y0 + 1);
  const empty = (r: readonly [number, number]) => uniform(r) && r[1] < 20;
  // Uzun kenardaki boşluk (letterbox): iki uçtan sırayla, oran tutana ya da boşluk bitene dek.
  // Oran tolerans dışındaysa başlar, boşluk kaldıkça tam orana (en yakın piksele) dek sürer.
  const off = () => Math.abs(aspect() / targetAspect - 1);
  const start = off() > RAW_MASK.aspectTolerance;
  for (let guard = 0; start && guard < g.w + g.h && off() > 0.5 / Math.max(x1 - x0 + 1, y1 - y0 + 1); guard++) {
    if (aspect() > targetAspect) {
      const l = empty(colRange(g, x0, y0, y1)), r = empty(colRange(g, x1, y0, y1));
      if (!l && !r) break;
      if (l && (!r || (x0 + (g.w - 1 - x1)) % 2 === 0)) x0++; else x1--;
    } else {
      const t = empty(rowRange(g, y0, x0, x1)), b = empty(rowRange(g, y1, x0, x1));
      if (!t && !b) break;
      if (t && (!b || (y0 + (g.h - 1 - y1)) % 2 === 0)) y0++; else y1--;
    }
    trimmed = true;
  }
  return { rect: [x0, y0, x1, y1], trimmed };
}

/** Jetonun opak (alfa > 127) piksellerinin sınırlayıcı kutusu. */
export function opaqueBox(alpha: Uint8Array, W: number, H: number): Rect | null {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let p = 0; p < W * H; p++) if (alpha[p]! > 127) { const x = p % W, y = (p - x) / W; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return x1 < 0 ? null : [x0, y0, x1, y1];
}

/** Ham dikdörtgeni hedef dikdörtgene en yakın komşuyla taşır; hedef dışı 0. */
export function resampleInto(g: Gray, src: Rect, W: number, H: number, dst: Rect): Uint8Array {
  const out = new Uint8Array(W * H);
  const [sx0, sy0, sx1, sy1] = src, [dx0, dy0, dx1, dy1] = dst;
  const sw = sx1 - sx0 + 1, sh = sy1 - sy0 + 1, dw = dx1 - dx0 + 1, dh = dy1 - dy0 + 1;
  for (let y = dy0; y <= dy1; y++) for (let x = dx0; x <= dx1; x++) {
    const X = sx0 + Math.min(sw - 1, Math.floor(((x - dx0 + 0.5) * sw) / dw));
    const Y = sy0 + Math.min(sh - 1, Math.floor(((y - dy0 + 0.5) * sh) / dh));
    out[y * W + x] = g.data[Y * g.w + X]!;
  }
  return out;
}

/** Küçük beyaz bileşenleri (4 komşuluk) siler, tek piksellik siyah delikleri doldurur. */
export function cleanMask(m: Uint8Array, W: number, H: number, minComponent: number = RAW_MASK.minComponent): { removed: number; filled: number } {
  const seen = new Uint8Array(W * H);
  let removed = 0, filled = 0;
  for (let p = 0; p < W * H; p++) {
    if (!m[p] || seen[p]) continue;
    const comp = [p]; seen[p] = 1;
    for (let i = 0; i < comp.length; i++) {
      const q = comp[i]!, x = q % W, y = (q - x) / W;
      for (const [X, Y] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as const) {
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const k = Y * W + X;
        if (m[k] && !seen[k]) { seen[k] = 1; comp.push(k); }
      }
    }
    if (comp.length < minComponent) for (const q of comp) { m[q] = 0; removed++; }
  }
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const p = y * W + x;
    if (!m[p] && m[p - 1] && m[p + 1] && m[p - W] && m[p + W]) { m[p] = 255; filled++; }
  }
  return { removed, filled };
}

export const iou = (a: Uint8Array, b: Uint8Array): number => {
  let i = 0, u = 0;
  for (let p = 0; p < a.length; p++) { const x = a[p]! > 0, y = b[p]! > 0; if (x && y) i++; if (x || y) u++; }
  return u ? i / u : 1;
};

export interface RawMaskResult {
  /** Jeton boyutunda 0/255 maske. */
  mask: Uint8Array;
  /** Ham görselin kullanılan kısmı ve tuvaldeki yeri. */
  src: Rect;
  dst: Rect;
  /** `canvas`: ham görsel tuvalin tamamı; `box`: jetonun opak sınırlayıcı kutusu. */
  fit: 'canvas' | 'box';
  metrics: { aspect: number; iou: number | null; white: number; spill: number; removed: number; filled: number };
  warnings: string[];
}

/**
 * Ham maskeyi jetona uydurur. `alpha`: jetonun alfa kanalı (W×H); `auto`: otomatik ten maskesi (0/1 ya da 0/255;
 * yoksa IoU ölçülmez).
 */
export function importRawMask(raw: Gray, alpha: Uint8Array, W: number, H: number, opts: { threshold?: number; auto?: Uint8Array } = {}): RawMaskResult {
  const warnings: string[] = [];
  const box = opaqueBox(alpha, W, H) ?? [0, 0, W - 1, H - 1];
  const canvasAspect = W / H;
  const boxAspect = (box[2] - box[0] + 1) / (box[3] - box[1] + 1);
  const rawAspect = raw.w / raw.h;
  const near = (a: number, b: number) => Math.abs(a / b - 1) <= RAW_MASK.aspectTolerance;
  // Ham görsel yalnızca karakterin kırpılmış hâliyse (oran opak kutuya uyuyor, tuvale uymuyor) kutuya eşlenir.
  const fit: 'canvas' | 'box' = !near(rawAspect, canvasAspect) && near(rawAspect, boxAspect) ? 'box' : 'canvas';
  const target = fit === 'box' ? boxAspect : canvasAspect;
  const { rect: src, trimmed } = fit === 'box' ? { rect: [0, 0, raw.w - 1, raw.h - 1] as Rect, trimmed: false } : cropFrame(raw, target);
  const aspect = (src[2] - src[0] + 1) / (src[3] - src[1] + 1);
  if (!near(rawAspect, target)) warnings.push(`en-boy oranı ${rawAspect.toFixed(2)}, jeton ${target.toFixed(2)}${trimmed ? '; kenar kırpıldı' : ''}`);
  if (!near(aspect, target)) warnings.push(`kırpmadan sonra da oran tutmuyor (${aspect.toFixed(2)}): görsel esnetildi, hizayı kontrol et`);
  const dst: Rect = fit === 'box' ? box : [0, 0, W - 1, H - 1];
  const gray = resampleInto(raw, src, W, H, dst);
  const threshold = opts.threshold ?? RAW_MASK.threshold;
  const mask = new Uint8Array(W * H);
  let spill = 0, opaque = 0;
  for (let p = 0; p < W * H; p++) {
    const white = gray[p]! >= threshold;
    if (alpha[p]! > 127) { opaque++; if (white) mask[p] = 255; } else if (white) spill++;
  }
  const { removed, filled } = cleanMask(mask, W, H);
  let whiteN = 0;
  for (let p = 0; p < W * H; p++) if (mask[p]) whiteN++;
  const white = opaque ? whiteN / opaque : 0;
  const i = opts.auto ? iou(mask, opts.auto) : null;
  if (white < RAW_MASK.minWhite) warnings.push(`beyaz oranı %${(white * 100).toFixed(1)} (jeton alanının %${RAW_MASK.minWhite * 100}'sinden az): maske boş ya da eşik yüksek`);
  if (white > RAW_MASK.maxWhite) warnings.push(`beyaz oranı %${(white * 100).toFixed(1)} (%${RAW_MASK.maxWhite * 100}'den çok): zırh/giysi de beyaz olabilir`);
  if (i !== null && i < RAW_MASK.minIoU) warnings.push(`otomatik maskeyle IoU ${i.toFixed(2)} (< ${RAW_MASK.minIoU}): büyük olasılıkla hizasız`);
  if (opaque && spill / opaque > 0.05) warnings.push(`beyazın bir kısmı jetonun dışına taşıyordu (${spill} piksel, silindi): kayma olabilir`);
  return { mask, src, dst, fit, metrics: { aspect: Math.round(rawAspect * 1000) / 1000, iou: i === null ? null : Math.round(i * 1000) / 1000, white: Math.round(white * 1000) / 1000, spill, removed, filled }, warnings };
}

/** Ham dosyanın jeton adı (`<ad>.png|jpg|jpeg`; ad bir jetonla birebir aynı olmalı), yoksa null. */
export function rawMaskName(file: string, sprites: ReadonlySet<string>): string | null {
  const m = file.match(/^(.+)\.(png|jpe?g)$/i);
  return m && sprites.has(m[1]!) ? m[1]! : null;
}

/**
 * Yazma kararı: elle maske klasöründe aynı adlı dosya varsa ezilmez (`--zorla` yoksa). İstisna: dosya daha önce bu
 * araçla yazılmış ve o günden beri değişmemişse (kayıttaki özetle aynı) yeniden yazılır.
 */
export function writeDecision(exists: boolean, ownUnchanged: boolean, force: boolean): 'yaz' | 'atla' {
  return !exists || ownUnchanged || force ? 'yaz' : 'atla';
}
