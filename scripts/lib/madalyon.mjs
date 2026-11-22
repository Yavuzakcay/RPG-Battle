// Macenta zeminli madalyon sayfalarının ortak kesim çekirdeği: kaynak ikonları (Kuyruk E4c, scripts/kaynak-ikon.mjs) ve ortak
// simge setleri (glif, scripts/glif.mjs). Madalyon nesne sınırıyla (bağlı bileşen) bulunur; kenardaki pembemsi saçak için alfa,
// madalyonun kutusuna oturan elipsten gelir (yarıçap − `inset` px, `soft` px yumuşak kenar).

/** Macenta zemin: R ve B, G'nin en az 90 üstünde (pembemsi saçak dahil; madalyon renkleri bu eşiğin altında). */
export const isMagenta = (r, g, b) => r - g > 90 && b - g > 90;

/** Renk anahtarı: zemin rengine uyan her piksel zemin (1 = madalyon). Kaynak ikonlarının eski yolu. */
export function colorKeyMask(data, w, h, isBg = isMagenta) {
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = isBg(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]) ? 0 : 1;
  return mask;
}

/**
 * Kenar tabanlı anahtar: yalnız sayfa kenarından zemin rengiyle (4 komşu) ulaşılan pikseller zemin; madalyonun içindeki zemin
 * rengine benzer pikseller (pembe vurgu vb.) madalyonda kalır. 1 = madalyon.
 */
export function edgeKeyMask(data, w, h, isBg = isMagenta) {
  const bg = new Uint8Array(w * h);
  const stack = [];
  const seed = (x, y) => {
    const p = y * w + x;
    if (!bg[p] && isBg(data[p * 3], data[p * 3 + 1], data[p * 3 + 2])) { bg[p] = 1; stack.push(p); }
  };
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
  while (stack.length) {
    const p = stack.pop(); const x = p % w; const y = (p - x) / w;
    if (x > 0) seed(x - 1, y);
    if (x < w - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y < h - 1) seed(x, y + 1);
  }
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = bg[i] ? 0 : 1;
  return mask;
}

/** Bağlı bileşenler (8 komşu, yığınla): { area, x0, y0, x1, y1 } listesi, alanı `minArea` altı atılır. */
export function components(mask, w, h, minArea = 50000) {
  const seen = new Uint8Array(w * h); const out = [];
  const stack = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || seen[i]) continue;
    let area = 0; let x0 = w; let y0 = h; let x1 = -1; let y1 = -1;
    stack.push(i); seen[i] = 1;
    while (stack.length) {
      const p = stack.pop(); const x = p % w; const y = (p - x) / w;
      area++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx; const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (mask[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
      }
    }
    if (area >= minArea) out.push({ area, x0, y0, x1, y1 });
  }
  return out;
}

/** Soldan sağa, üst sıra sonra alt sıra: önce satır (merkez y, yarım madalyon çapı toleransı), sonra x. */
export function readingOrder(comps) {
  const mid = (c) => (c.y0 + c.y1) / 2;
  const size = comps.reduce((s, c) => s + (c.x1 - c.x0), 0) / comps.length;
  const sorted = [...comps].sort((a, b) => mid(a) - mid(b));
  const rows = [];
  for (const c of sorted) {
    const row = rows.find((r) => Math.abs(mid(r[0]) - mid(c)) < size / 2);
    if (row) row.push(c); else rows.push([c]);
  }
  return rows.flatMap((r) => r.sort((a, b) => a.x0 - b.x0));
}

/**
 * Bileşenin RGBA kesimi (kutusu kadar): madalyon hafif elips olabilir (ör. 529×551); alfa elipsten, sonra kare kutuya
 * oranlanınca yuvarlak görünür. `data` 3 kanallı ham RGB, `w` sayfa eni.
 */
export function medallionRgba(data, w, c, { inset = 2.5, soft = 1.2 } = {}) {
  const cw = c.x1 - c.x0 + 1; const ch = c.y1 - c.y0 + 1;
  const ra = cw / 2 - inset; const rb = ch / 2 - inset;
  const cx = (cw - 1) / 2; const cy = (ch - 1) / 2;
  const rgba = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const e = Math.hypot((x - cx) / ra, (y - cy) / rb); // 1 = elips kenarı
    const dist = (e - 1) * Math.min(ra, rb);
    const a = Math.max(0, Math.min(1, 0.5 - dist / soft));
    if (a <= 0) continue;
    const s = ((c.y0 + y) * w + c.x0 + x) * 3; const d = (y * cw + x) * 4;
    rgba[d] = data[s]; rgba[d + 1] = data[s + 1]; rgba[d + 2] = data[s + 2]; rgba[d + 3] = Math.round(a * 255);
  }
  return { rgba, cw, ch };
}
