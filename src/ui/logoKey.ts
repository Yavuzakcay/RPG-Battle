/**
 * Logo hattının saf görüntü işlemleri (Görev L; `scripts/logo.ts`, `npm run logo`). Ham RGB/RGBA tamponları üstünde
 * çalışır, sharp ya da DOM bilmez; testler sentetik tamponlarla sınar (görsel dosyası testlere girmez).
 *
 * Şeffaflaştırma: beyaz zemin kenardan bağlantılı yakın-beyaz (tüm kanallar > `WHITE_MIN`) flood-fill ile bulunur;
 * logonun içindeki parlak vurgular (zar yüzleri, ışık parıltısı) kenara bağlı olmadığı için korunur. Ön plan
 * 1 piksel daraltılır (beyaza karışmış kenar pikselleri atılır), alfa yaklaşık σ 0,8 ile yumuşatılır; saydam
 * piksellerin rengi en yakın ön plan rengiyle doldurulur ki yumuşak kenarda beyaz hale kalmasın.
 */

/** Yakın-beyaz eşiği: tüm kanallar bunun üstündeyse zemin adayı. */
export const WHITE_MIN = 232;
/** Alfa yumuşatma (Gauss σ, piksel). */
export const ALPHA_SIGMA = 0.8;

export interface Raw { data: Uint8Array | Uint8ClampedArray; width: number; height: number; channels: number }

const nearWhite = (d: Raw['data'], i: number): boolean => d[i]! > WHITE_MIN && d[i + 1]! > WHITE_MIN && d[i + 2]! > WHITE_MIN;

/** Kenardan bağlantılı yakın-beyaz zemin maskesi (1 = zemin), 4-komşuluk. */
export function backgroundMask(img: Raw): Uint8Array {
  const { data, width: w, height: h, channels: c } = img;
  const bg = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (p: number) => { if (!bg[p] && nearWhite(data, p * c)) { bg[p] = 1; stack.push(p); } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % w, y = (p - x) / w;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (y > 0) push(p - w);
    if (y < h - 1) push(p + w);
  }
  return bg;
}

/** Ön planı `px` piksel daraltır (zemine 8-komşu ön plan pikselleri zemin olur). */
export function erodeForeground(bg: Uint8Array, w: number, h: number, px = 1): Uint8Array {
  let cur = bg;
  for (let k = 0; k < px; k++) {
    const next = cur.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (cur[p]) continue;
      for (let dy = -1; dy <= 1 && !next[p]; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h && cur[yy * w + xx]) { next[p] = 1; break; }
      }
    }
    cur = next;
  }
  return cur;
}

/** Ayrılabilir Gauss bulanıklığı (tek kanal, 0–255). */
export function gaussBlur(a: Uint8Array, w: number, h: number, sigma: number): Uint8Array {
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k: number[] = [];
  let sum = 0;
  for (let i = -r; i <= r; i++) { const v = Math.exp(-(i * i) / (2 * sigma * sigma)); k.push(v); sum += v; }
  for (let i = 0; i < k.length; i++) k[i]! /= sum;
  const tmp = new Float32Array(w * h);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0;
    for (let i = -r; i <= r; i++) s += a[y * w + Math.min(w - 1, Math.max(0, x + i))]! * k[i + r]!;
    tmp[y * w + x] = s;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0;
    for (let i = -r; i <= r; i++) s += tmp[Math.min(h - 1, Math.max(0, y + i)) * w + x]! * k[i + r]!;
    out[y * w + x] = Math.round(s);
  }
  return out;
}

/** Kenara bağlı olmayan yakın-beyaz bölge (harf boşluğu ya da logo içi parlak vurgu). */
export interface WhiteIsland { size: number; box: { x0: number; y0: number; x1: number; y1: number }; pixels: number[]; inRegion: (f: (x: number, y: number) => boolean) => boolean }

/**
 * Zemine bağlı olmayan yakın-beyaz bölgeler (4-komşuluk). Kenardan flood-fill bunları saydam yapmaz: logo içindeki
 * vurgular korunur. Yazı bandındaki harf boşlukları (D, &) için çağıran bölgeyle seçer (`keyWhite` `enclosed`).
 */
export function enclosedWhite(img: Raw, bg: Uint8Array): WhiteIsland[] {
  const { data, width: w, height: h, channels: c } = img;
  const seen = new Uint8Array(w * h);
  const out: WhiteIsland[] = [];
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || bg[s] || !nearWhite(data, s * c)) continue;
    const pixels: number[] = [];
    const stack = [s];
    seen[s] = 1;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    while (stack.length) {
      const p = stack.pop()!;
      pixels.push(p);
      const x = p % w, y = (p - x) / w;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && !seen[q] && !bg[q] && nearWhite(data, q * c)) { seen[q] = 1; stack.push(q); }
      }
    }
    const box = { x0, y0, x1, y1 };
    out.push({
      size: pixels.length, box, pixels,
      inRegion: (f) => f(x0 / w, y0 / h) && f(x1 / w, y1 / h),
    });
  }
  return out;
}

/**
 * Beyaz zeminli RGB görüntüden RGBA: zemin saydam, ön plan 1 px daralmış, alfa yumuşak. Saydam ve yarı saydam
 * piksellerin rengi en yakın ön plan rengine taşınır (renk sızdırma; beyaz hale yok).
 */
export function keyWhite(img: Raw, opts: { erode?: number; sigma?: number; enclosed?: (x: number, y: number) => boolean } = {}): Raw {
  const { data, width: w, height: h, channels: c } = img;
  const base = backgroundMask(img);
  if (opts.enclosed) for (const comp of enclosedWhite(img, base)) if (comp.inRegion(opts.enclosed)) for (const p of comp.pixels) base[p] = 1;
  const bg = erodeForeground(base, w, h, opts.erode ?? 1);
  const hard = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) hard[p] = bg[p] ? 0 : 255;
  const alpha = gaussBlur(hard, w, h, opts.sigma ?? ALPHA_SIGMA);
  const out = new Uint8Array(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    out[p * 4] = data[p * c]!; out[p * 4 + 1] = data[p * c + 1]!; out[p * 4 + 2] = data[p * c + 2]!;
    // Daraltmanın dışında kalan (gerçek zemin) piksellerde yumuşak kenar en fazla bir piksel taşar.
    out[p * 4 + 3] = alpha[p]!;
  }
  // Renk sızdırma: zemin piksellerine komşu ön plan rengi (3 tur yeter; σ 0,8 kenarı ~2 px).
  let known = Uint8Array.from(bg, (v) => (v ? 0 : 1));
  for (let pass = 0; pass < 3; pass++) {
    const next = known.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (known[p]) continue;
      let n = 0, r = 0, g = 0, b = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] as const) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const q = yy * w + xx;
        if (!known[q]) continue;
        n++; r += out[q * 4]!; g += out[q * 4 + 1]!; b += out[q * 4 + 2]!;
      }
      if (n) { out[p * 4] = r / n; out[p * 4 + 1] = g / n; out[p * 4 + 2] = b / n; next[p] = 1; }
    }
    known = next;
  }
  return { data: out, width: w, height: h, channels: 4 };
}

/**
 * Hale ölçüsü: yarı saydam kenar piksellerinden beyaz kalıntı olanların oranı (kanalları > 215; koyu zeminde açık
 * çerçeve olarak görünür). Turuncu kanat ve renkli parıltı sayılmaz. Açık zeminde beyaz kalıntı görünmez; orada
 * kenar logonun kendi siyah dış çizgisidir (görsel denetim ekran görüntüsüyle).
 */
export function haloRatio(img: Raw): { edge: number; halo: number; ratio: number } {
  const { data, width: w, height: h } = img;
  let edge = 0, halo = 0;
  for (let p = 0; p < w * h; p++) {
    const a = data[p * 4 + 3]!;
    if (a === 0 || a === 255) continue;
    edge++;
    if (Math.min(data[p * 4]!, data[p * 4 + 1]!, data[p * 4 + 2]!) > 215) halo++;
  }
  return { edge, halo, ratio: edge ? halo / edge : 0 };
}

/** Saydam olmayan içeriğin sınırı (alfa > eşik). */
export function alphaBounds(img: Raw, min = 8): { x0: number; y0: number; x1: number; y1: number } {
  const { data, width: w, height: h } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * 4 + 3]! <= min) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1 };
}

/**
 * Ejderha gözü: verilen kutuda (oran olarak) en parlak turuncu nokta. Turuncu: R yüksek, G orta, B düşük;
 * puan R + G (sarıya yakın parlak turuncu öne çıkar). Komşu 5×5 ortalaması alınır (tek gürültü pikseli seçilmesin).
 * Bulunamazsa null (çağıran sabit orana düşer).
 */
export function findEye(img: Raw, box: { x0: number; y0: number; x1: number; y1: number }): { x: number; y: number; score: number } | null {
  const { data, width: w, height: h, channels: c } = img;
  const X0 = Math.round(box.x0 * w), X1 = Math.round(box.x1 * w), Y0 = Math.round(box.y0 * h), Y1 = Math.round(box.y1 * h);
  const orange = (i: number) => {
    const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
    const a = c === 4 ? data[i + 3]! : 255;
    return a > 200 && r > 200 && g > 90 && g < 235 && b < 140 && r - b > 110 ? r + g : 0;
  };
  let best: { x: number; y: number; score: number } | null = null;
  for (let y = Math.max(2, Y0); y < Math.min(h - 2, Y1); y++) for (let x = Math.max(2, X0); x < Math.min(w - 2, X1); x++) {
    if (!orange((y * w + x) * c)) continue;
    let s = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) s += orange(((y + dy) * w + x + dx) * c);
    s /= 25;
    if (!best || s > best.score) best = { x, y, score: s };
  }
  return best && best.score > 250 ? { x: best.x / w, y: best.y / h, score: Math.round(best.score) } : null;
}

/** Nokta çokgenin içinde mi (çift-tek kuralı; koordinatlar oran). */
export function inPolygon(x: number, y: number, poly: ReadonlyArray<readonly [number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!, [xj, yj] = poly[j]!;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Logodaki d20'nin sınırı (Görev L2): verilen çokgenin (altıgenin içi, metal çerçeve hariç) içinde gümüş-gri
 * pikseller (kanallar birbirine yakın, parlaklık 85–245, opak). Kırmızı ejderha ve siyah zemin girmez. Sonuç zar
 * yüzlerinin sınırı (oran); dış siyah kontur çağıranın payıdır. Gürültü için satır/sütunda en az `minRun` piksel aranır.
 */
export function findDie(img: Raw, poly: ReadonlyArray<readonly [number, number]>, minRun = 6): { x0: number; y0: number; x1: number; y1: number; pixels: number } | null {
  const { data, width: w, height: h, channels: c } = img;
  const rows = new Uint32Array(h), cols = new Uint32Array(w);
  let pixels = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * c;
    const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!, a = c === 4 ? data[i + 3]! : 255;
    if (a < 250 || Math.max(r, g, b) - Math.min(r, g, b) > 24) continue;
    const lum = (r + g + b) / 3;
    if (lum < 85 || lum > 245 || !inPolygon(x / w, y / h, poly)) continue;
    rows[y]!++; cols[x]!++; pixels++;
  }
  const first = (arr: Uint32Array) => arr.findIndex((n) => n >= minRun);
  const last = (arr: Uint32Array) => { for (let i = arr.length - 1; i >= 0; i--) if (arr[i]! >= minRun) return i; return -1; };
  const x0 = first(cols), x1 = last(cols), y0 = first(rows), y1 = last(rows);
  if (x0 < 0 || y0 < 0) return null;
  return { x0: x0 / w, y0: y0 / h, x1: (x1 + 1) / w, y1: (y1 + 1) / h, pixels };
}
