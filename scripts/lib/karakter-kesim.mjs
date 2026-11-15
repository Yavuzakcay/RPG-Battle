// Karakter jeton sayfası kesimi (Wizard 4x2: A ve B sayfaları). Saf kütüphane: ham RGB (Uint8Array, 3 bayt/piksel) alır, RGBA hücre döner.
// Izgara: koyu (L<45) çizgi aralıkları taranır; bulunamazsa eşit bölme + uyarı. Zemin: hücrenin kenar piksellerinden yeşil/macenta ölçülür,
// kenardan bağlı bileşenle silinir (karakterin içindeki yeşil/mor ayrıntıya dokunulmaz), sonra kenar halesi temizlenir.

export const COLS = 4;
export const ROWS = 2;
/** Sayfa A: 8 hücre; sayfa B: 7 hücre + boş 8. (soldan sağa, yukarıdan aşağı) */
export const SLUGS = {
  a: ['blast', 'deception', 'phoenix', 'revival', 'war', 'scribe', 'prophecy', 'sword-song'],
  b: ['mirage', 'sanctuary', 'alchemy', 'manifestation', 'space-bending', 'time', 'map', null],
};
export const BG_REFS = { yesil: [0, 255, 0], macenta: [255, 0, 255] };
const DARK = 45;
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function runs(flags) {
  const out = [];
  let s = -1;
  for (let i = 0; i <= flags.length; i++) {
    const on = i < flags.length && flags[i];
    if (on && s < 0) s = i;
    if (!on && s >= 0) { out.push([s, i]); s = -1; }
  }
  return out;
}

/** Bir eksendeki hücre aralıkları: koyu çizgi koşuları arasındaki boşluklar. */
function axisCells(data, w, h, axis, count) {
  const n = axis === 'x' ? w : h, m = axis === 'x' ? h : w;
  const dark = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    let c = 0;
    for (let j = 0; j < m; j++) {
      const p = axis === 'x' ? (j * w + i) * 3 : (i * w + j) * 3;
      if (lum(data[p], data[p + 1], data[p + 2]) < DARK) c++;
    }
    dark[i] = c / m > 0.9;
  }
  const lines = runs(dark).filter(([a, b]) => b - a >= 4);
  const bounds = [];
  let prev = 0;
  for (const [a, b] of lines) { if (a > prev) bounds.push([prev, a]); prev = b; }
  if (prev < n) bounds.push([prev, n]);
  const min = n / count * 0.5;
  const cells = bounds.filter(([a, b]) => b - a >= min);
  return cells.length === count ? cells : null;
}

/** Izgara: { ok, warn, cells: [{x,y,w,h}] } (soldan sağa, yukarıdan aşağı). */
export function detectGrid(data, w, h, cols = COLS, rows = ROWS) {
  const xs = axisCells(data, w, h, 'x', cols), ys = axisCells(data, w, h, 'y', rows);
  const ok = !!(xs && ys);
  const X = xs ?? Array.from({ length: cols }, (_, i) => [Math.round(i * w / cols), Math.round((i + 1) * w / cols)]);
  const Y = ys ?? Array.from({ length: rows }, (_, i) => [Math.round(i * h / rows), Math.round((i + 1) * h / rows)]);
  const cells = [];
  for (const [y0, y1] of Y) for (const [x0, x1] of X) cells.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  return { ok, warn: ok ? null : 'ızgara çizgileri bulunamadı: eşit bölme kullanıldı', cells };
}

function rect(data, w, r) {
  const d = new Uint8Array(r.w * r.h * 3);
  for (let y = 0; y < r.h; y++) d.set(data.subarray(((r.y + y) * w + r.x) * 3, ((r.y + y) * w + r.x + r.w) * 3), y * r.w * 3);
  return d;
}

/** Hücre zemini: kenar halkasındaki piksellerin medyanı; yeşil mi macenta mı (ad + ölçülen renk). */
export function cellBackground(d, w, h) {
  // Halka bulanık ızgara çizgisi kalıntısı içerebilir: yalnız bir referansa 100'den yakın pikseller oy verir ve ölçüme girer
  const ring = Math.max(2, Math.round(Math.min(w, h) * 0.02));
  const px = { yesil: [[], [], []], macenta: [[], [], []] };
  const cnt = { yesil: 0, macenta: 0 };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x >= ring && x < w - ring && y >= ring && y < h - ring) { x = w - ring - 1; continue; }
    const p = (y * w + x) * 3;
    for (const n of ['yesil', 'macenta']) {
      const r = BG_REFS[n];
      if (Math.hypot(d[p] - r[0], d[p + 1] - r[1], d[p + 2] - r[2]) < 100) { cnt[n]++; for (let k = 0; k < 3; k++) px[n][k].push(d[p + k]); }
    }
  }
  const name = cnt.yesil >= cnt.macenta ? 'yesil' : 'macenta';
  const arr = px[name];
  if (!arr[0].length) return { name, color: [...BG_REFS[name]] };
  const raw = arr.map((a) => a.slice());
  const color = arr.map((a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; });
  // Gürültü: seçilen piksellerin ortalama sapması (JPG'den çevrilmiş PNG'de de yüksek çıkar)
  let dev = 0;
  for (let i = 0; i < arr[0].length; i++) dev += Math.hypot(raw[0][i] - color[0], raw[1][i] - color[1], raw[2][i] - color[2]);
  return { name, color, noise: dev / arr[0].length };
}

/** Zemini kenardan bağlı bileşenle siler (+ hale), ardından kapalı zemin renkli bölgeleri (kol arası, yay içi…) siler,
 * izole 1–3 piksellik zemin renkli noktaları temizler. opts.jpeg: JPG için iç eşik geniş. Dönüş: { rgba, gone, count, stats }. */
export function removeBackground(d, w, h, bg, opts = {}) {
  const tol = opts.tol ?? 80, halo = opts.halo ?? 140, hpass = opts.haloPasses ?? 2;
  const tight = opts.tight ?? (opts.jpeg ? 75 : 40); // kapalı bölge eşiği: anahtar renge dar yakınlık (gerçek yeşil/macenta ayrıntılar daha uzak tonda)
  const [br, bgc, bb] = bg.color;
  const dist = (p) => Math.hypot(d[p] - br, d[p + 1] - bgc, d[p + 2] - bb);
  const gone = new Uint8Array(w * h);
  const inner = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => { const i = y * w + x; if (!gone[i] && dist(i * 3) < tol) { gone[i] = 1; stack.push(i); } };
  // Kenar bandı (JPEG'de bulanık ızgara çizgisi kalıntısı): ilk 5 px'te koyu, 12 px'e dek zemin↔koyu karışım doğrusundaki piksel tohumdur
  const band = opts.band ?? 12, dk = 20;
  const seg = [br - dk, bgc - dk, bb - dk], sl = seg[0] * seg[0] + seg[1] * seg[1] + seg[2] * seg[2];
  const mixDist = (p) => {
    const v = [d[p] - dk, d[p + 1] - dk, d[p + 2] - dk];
    const t = Math.max(0, Math.min(1, (v[0] * seg[0] + v[1] * seg[1] + v[2] * seg[2]) / sl));
    return Math.hypot(v[0] - t * seg[0], v[1] - t * seg[1], v[2] - t * seg[2]);
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x >= band && x < w - band && y >= band && y < h - band) { x = w - band - 1; continue; }
    const p = (y * w + x) * 3, i = y * w + x;
    const e = Math.min(x, y, w - 1 - x, h - 1 - y);
    if (!gone[i] && ((e < 5 && lum(d[p], d[p + 1], d[p + 2]) < 70) || dist(p) < halo || mixDist(p) < 40)) { gone[i] = 1; stack.push(i); }
  }
  while (stack.length) {
    const i = stack.pop(), x = i % w, y = (i / w) | 0;
    if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1);
  }
  const haloPass = (only) => {
    const add = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (gone[i]) continue;
      const g = only || gone;
      const nb = (x > 0 && g[i - 1]) || (x < w - 1 && g[i + 1]) || (y > 0 && g[i - w]) || (y < h - 1 && g[i + w]);
      if (nb && dist(i * 3) < halo) add.push(i);
    }
    return add;
  };
  for (let pass = 0; pass < hpass; pass++) for (const i of haloPass(null)) gone[i] = 1;

  // İçte kalan (kenardan bağlı olmayan) zemin renkli bölgeler: dar eşikle 4 komşu bileşenler, hepsi silinir
  const keyLike = (i) => !gone[i] && dist(i * 3) < tight;
  let interiorBefore = 0;
  for (let i = 0; i < w * h; i++) if (keyLike(i)) interiorBefore++;
  const seen = new Uint8Array(w * h);
  for (let s0 = 0; s0 < w * h; s0++) {
    if (seen[s0] || !keyLike(s0)) continue;
    const comp = [s0], st = [s0];
    seen[s0] = 1;
    while (st.length) {
      const i = st.pop(), x = i % w, y = (i / w) | 0;
      const nbs = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
      for (const n of nbs) if (n >= 0 && !seen[n] && keyLike(n)) { seen[n] = 1; comp.push(n); st.push(n); }
    }
    for (const i of comp) { gone[i] = 1; inner[i] = 1; }
  }
  // İç bölgelerin kenarındaki sızıntı: yalnız iç bölgeye bitişik, zemine yakın pikseller (1 geçiş) silinir
  for (const i of haloPass(inner)) { gone[i] = 1; inner[i] = 1; }

  // İzole 1–3 piksellik (8 komşu) zemin renkli noktalar
  let specks = 0;
  const seen2 = new Uint8Array(w * h);
  for (let s0 = 0; s0 < w * h; s0++) {
    if (seen2[s0] || gone[s0]) continue;
    const comp = [s0], st = [s0];
    seen2[s0] = 1;
    while (st.length && comp.length <= 4) {
      const i = st.pop(), x = i % w, y = (i / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if ((dx || dy) && xx >= 0 && xx < w && yy >= 0 && yy < h) { const n = yy * w + xx; if (!seen2[n] && !gone[n]) { seen2[n] = 1; comp.push(n); st.push(n); } }
      }
    }
    if (comp.length <= 3 && !st.length && comp.every((i) => dist(i * 3) < halo)) { for (const i of comp) gone[i] = 1; specks++; }
  }

  const rgba = new Uint8Array(w * h * 4);
  let count = 0, interiorAfter = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, p = i * 3, o = i * 4;
    let r = d[p], g = d[p + 1], b = d[p + 2];
    if (gone[i]) { rgba[o + 3] = 0; continue; }
    // Silinene 2 px içindeki piksellerde zemin rengi sızıntısını bastır (yumuşak despill)
    let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && xx < w && yy >= 0 && yy < h && gone[yy * w + xx]) { near = true; break; }
    }
    if (near) {
      if (bg.name === 'yesil') g = Math.min(g, Math.max(r, b));
      else { const m = g; r = Math.min(r, m + 40); b = Math.min(b, m + 40); }
    }
    rgba[o] = r; rgba[o + 1] = g; rgba[o + 2] = b; rgba[o + 3] = 255;
    count++;
    if (dist(p) < tight) interiorAfter++;
  }
  return { rgba, gone, count, stats: { interiorBefore, interiorAfter, specks } };
}

export function bboxOf(rgba, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rgba[(y * w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Karakter kutusundan hücre kenarına en yakın uzaklık (px); küçükse taşma/kırpılma şüphesi. */
export function edgeDistance(b, w, h) {
  return Math.min(b.x, b.y, w - (b.x + b.w), h - (b.y + b.h));
}

/** Zemin renginde kalan opak piksel sayısı. */
export function leftoverBg(rgba, bg, n = 60) {
  let c = 0;
  for (let i = 0; i < rgba.length; i += 4) if (rgba[i + 3] && Math.hypot(rgba[i] - bg.color[0], rgba[i + 1] - bg.color[1], rgba[i + 2] - bg.color[2]) < n) c++;
  return c;
}

/** Bir sayfa: hücreleri ayırır, çözümler. kind: 'a' | 'b'. Boş hücre (slug null ya da karakter yok) `empty: true`. */
export function processSheet(data, w, h, kind, opts = {}) {
  const grid = detectGrid(data, w, h);
  const slugs = SLUGS[kind];
  const cells = grid.cells.map((r, i) => {
    const d = rect(data, w, r);
    const bg = cellBackground(d, r.w, r.h);
    const slug = slugs[i] ?? null;
    const res = removeBackground(d, r.w, r.h, bg, { jpeg: !!opts.jpeg || (bg.noise ?? 0) > 4 });
    const box = bboxOf(res.rgba, r.w, r.h);
    const empty = !slug || !box || res.count < r.w * r.h * 0.002;
    return {
      index: i + 1, slug, rect: r, bg, empty, rgba: res.rgba, box,
      distEdge: box ? edgeDistance(box, r.w, r.h) : null,
      leftover: leftoverBg(res.rgba, bg), stats: { ...res.stats, opaque: res.count },
    };
  });
  return { grid, cells };
}

/** Hücreyi canvas×canvas RGBA'ya yerleştirme planı: hücre ölçeği = canvas / hücre kısa kenarı; yatayda ortalı, altta hizalı. */
export function placement(box, cell, canvas, margin) {
  let s = canvas / Math.min(cell.w, cell.h);
  const maxW = canvas - 2 * margin, maxH = canvas - 2 * margin;
  s = Math.min(s, maxW / box.w, maxH / box.h);
  const w = Math.max(1, Math.round(box.w * s)), h = Math.max(1, Math.round(box.h * s));
  return { scale: s, w, h, left: Math.round((canvas - w) / 2), top: canvas - margin - h };
}
