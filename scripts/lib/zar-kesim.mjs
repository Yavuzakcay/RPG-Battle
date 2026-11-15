// SD9b: zar sayfası bölütleme (saf; sharp/dosya yok, test edilebilir). Macenta zeminde yan yana yedi zar (soldan sağa d4, d6, d8,
// d10, d12, d20, d100). Temel yöntem: zeminden flood-fill + despill + bağlı bileşenler; yedi bileşen çıkmazsa sırayla:
//   0 kutu    : data/zar-kesim.json `kutular[tema]` (7 dikdörtgen, elle) varsa önce o
//   1 temel   : sıkı macenta eşiği
//   2 gevşek  : gevşek macenta eşiği (zemin temiz değilse; kenara değen artık zemin lekeleri de atılır)
//   3 aşındırma: ön plan 4-komşu aşındırılır (r = 1…ErodeMax) yedi çekirdek çıkana dek, çekirdekler özgün ön planda geri büyütülür
//   4 gevşek + aşındırma
//   5 şablon  : ön planın sınırlayıcı kutusu, başarılı sayfalardan (yoksa eşit) oransal şablonla yedi dikey şeride bölünür; doğrulanır
// Hiçbiri tutmazsa `ok: false` ("yeniden üretilmeli").
export const NAMES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
export const ERODE_MAX = 60;

const STRICT = {
  magenta: (r, g, b) => g <= 70 && r >= 150 && b >= 150 && Math.abs(r - b) <= 60,
  pure: (r, g, b) => g <= 25 && r >= 230 && b >= 220,
  spill: (r, g, b) => Math.min(r, b) - g >= 60 && Math.abs(r - b) <= 90,
};
const RELAXED = {
  magenta: (r, g, b) => g <= 115 && r >= 110 && b >= 110 && Math.min(r, b) - g >= 45 && Math.abs(r - b) <= 100,
  pure: (r, g, b) => g <= 45 && r >= 200 && b >= 190,
  spill: (r, g, b) => Math.min(r, b) - g >= 40 && Math.abs(r - b) <= 120,
};

/** Zemin maskesi (1 = zemin). `data`: RGB (3 kanal). */
export function background(data, w, h, cls) {
  const n = w * h;
  const bg = new Uint8Array(n);
  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  const stack = [];
  const seed = (i) => { if (!bg[i] && cls.magenta(...px(i))) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
  for (let i = 0; i < n; i++) if (cls.pure(...px(i))) seed(i);
  while (stack.length) {
    const i = stack.pop(); const x = i % w, y = (i / w) | 0;
    if (x > 0) seed(i - 1); if (x < w - 1) seed(i + 1); if (y > 0) seed(i - w); if (y < h - 1) seed(i + w);
  }
  for (let pass = 0; pass < 2; pass++) {
    const add = [];
    for (let i = 0; i < n; i++) {
      if (bg[i]) continue;
      const x = i % w, y = (i / w) | 0;
      const near = (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w]);
      if (near && cls.spill(...px(i))) add.push(i);
    }
    for (const i of add) bg[i] = 1;
  }
  return bg;
}

/** 4-komşu bağlı bileşenler (`fg`: 1 = dolu). Dönen: etiketler (-1 boş) ve bileşen listesi. */
export function components(fg, w, h) {
  const n = w * h; const comp = new Int32Array(n).fill(-1); const parts = [];
  for (let s = 0; s < n; s++) {
    if (!fg[s] || comp[s] >= 0) continue;
    const id = parts.length; const p = { id, count: 0, minX: w, minY: h, maxX: -1, maxY: -1 };
    const q = [s]; comp[s] = id;
    while (q.length) {
      const i = q.pop(); const x = i % w, y = (i / w) | 0;
      p.count++; if (x < p.minX) p.minX = x; if (x > p.maxX) p.maxX = x; if (y < p.minY) p.minY = y; if (y > p.maxY) p.maxY = y;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && fg[j] && comp[j] < 0) { comp[j] = id; q.push(j); }
    }
    parts.push(p);
  }
  return { comp, parts };
}

const significant = (parts, frac = 0.05) => { const big = Math.max(0, ...parts.map((p) => p.count)); return parts.filter((p) => p.count >= big * frac); };

/** Ön planı `r` kez 4-komşu aşındırır. */
export function erode(fg, w, h, r) {
  let cur = fg;
  for (let k = 0; k < r; k++) {
    const next = new Uint8Array(cur.length);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (cur[i] && x > 0 && x < w - 1 && y > 0 && y < h - 1 && cur[i - 1] && cur[i + 1] && cur[i - w] && cur[i + w]) next[i] = 1;
    }
    cur = next;
  }
  return cur;
}

/** Çekirdek etiketlerini özgün ön planda (en yakın çekirdek) büyütür; çok kaynaklı BFS. */
export function grow(fg, seeds, w, h) {
  const comp = new Int32Array(w * h).fill(-1); let frontier = [];
  for (let i = 0; i < comp.length; i++) if (seeds[i] >= 0) { comp[i] = seeds[i]; frontier.push(i); }
  while (frontier.length) {
    const next = [];
    for (const i of frontier) {
      const x = i % w, y = (i / w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && fg[j] && comp[j] < 0) { comp[j] = comp[i]; next.push(j); }
    }
    frontier = next;
  }
  return comp;
}

/** Etiket dizisinden (comp) bileşen listesi (id = etiket). */
export function partsOf(comp, w, h) {
  const m = new Map();
  for (let i = 0; i < comp.length; i++) {
    const id = comp[i]; if (id < 0) continue;
    const x = i % w, y = (i / w) | 0; const p = m.get(id) ?? { id, count: 0, minX: w, minY: h, maxX: -1, maxY: -1 };
    p.count++; if (x < p.minX) p.minX = x; if (x > p.maxX) p.maxX = x; if (y < p.minY) p.minY = y; if (y > p.maxY) p.maxY = y; m.set(id, p);
  }
  return [...m.values()];
}

const finish = (method, data, w, h, bg, comp, parts, note) => {
  const kept = parts.slice().sort((a, b) => a.minX - b.minX).map((p, k) => ({ ...p, order: k }));
  return { ok: kept.length === NAMES.length, method, w, h, data, bg, comp, kept, note };
};

/** Ön plan sınırlayıcı kutusu (x0..x1). */
const fgBox = (fg, w, h) => { let x0 = w, x1 = -1, y0 = h, y1 = -1; for (let i = 0; i < fg.length; i++) if (fg[i]) { const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { x0, x1, y0, y1 }; };

/** Başarılı sayfalardan oransal şablon: zar başına [başlangıç, bitiş] kesri (ön plan kutusu genişliğine göre; medyan). */
export function templateFrom(goods) {
  if (goods.length < 3) return Array.from({ length: 7 }, (_, k) => [k / 7, (k + 1) / 7]);
  const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[(s.length / 2) | 0]; };
  const cuts = []; // 6 kesim: komşu iki zarın sınırlayıcı kutuları arasının ortası
  for (let k = 0; k < 6; k++) cuts.push(med(goods.map((g) => { const a = g.kept[k], b = g.kept[k + 1]; const x0 = g.kept[0].minX, x1 = g.kept[6].maxX; return ((a.maxX + b.minX) / 2 - x0) / (x1 - x0 + 1); })));
  return [0, ...cuts, 1].slice(0, 8).map((v, i, arr) => (i < 7 ? [v, arr[i + 1]] : null)).filter(Boolean);
}

/** Şerit bölmenin makullüğü: her parça yeterince dolu ve kabaca kare. */
const plausible = (parts, w, h) => {
  if (parts.length !== 7) return false;
  const area = parts.map((p) => p.count); const med = area.slice().sort((a, b) => a - b)[3];
  return parts.every((p) => { const bw = p.maxX - p.minX + 1, bh = p.maxY - p.minY + 1; return bw > 0 && bh > 0 && bw / bh > 0.45 && bw / bh < 2.2 && p.count > med * 0.2 && p.count < med * 4; });
};

/**
 * Sayfayı yedi zara böler. `opts`: { kutu: [[x0,y0,x1,y1] × 7] | undefined, sablon: [[a,b] × 7] | undefined, erodeMax }.
 * Dönen: { ok, method, kept (7 parça, soldan sağa), comp, bg, ... }. Başarısızsa ok=false (en iyi deneme `method: 'yok'`).
 */
export function segment(data, w, h, opts = {}) {
  const tried = [];
  const strictBg = background(data, w, h, STRICT);
  const relaxBg = background(data, w, h, RELAXED);
  const fgOf = (bg) => Uint8Array.from(bg, (v) => (v ? 0 : 1));
  const plain = (bg) => { const fg = fgOf(bg); const { comp, parts } = components(fg, w, h); const kept = significant(parts); return { fg, comp, kept, parts }; };
  if (opts.kutu?.length === 7) {
    const bg = relaxBg; const comp = new Int32Array(w * h).fill(-1);
    opts.kutu.forEach(([x0, y0, x1, y1], k) => { for (let y = Math.max(0, y0); y <= Math.min(h - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(w - 1, x1); x++) { const i = y * w + x; if (!bg[i]) comp[i] = k; } });
    return finish('kutu', data, w, h, bg, comp, partsOf(comp, w, h), 'data/zar-kesim.json kutular');
  }
  for (const [name, bg] of [['temel', strictBg], ['gevsek', relaxBg]]) {
    const r = plain(bg); tried.push(`${name}: ${r.kept.length} bileşen`);
    if (r.kept.length === 7) { const keepIds = new Set(r.kept.map((p) => p.id)); const comp = Int32Array.from(r.comp, (v) => (keepIds.has(v) ? v : -1)); return finish(name, data, w, h, bg, comp, r.kept, tried.join('; ')); }
  }
  for (const [name, bg] of [['asindirma', strictBg], ['gevsek+asindirma', relaxBg]]) {
    const fg = fgOf(bg);
    for (let r = 1; r <= (opts.erodeMax ?? ERODE_MAX); r++) {
      const e = erode(fg, w, h, r); const { comp: ec, parts } = components(e, w, h); const sig = significant(parts, 0.08);
      if (parts.length === 0) break; // çekirdekler yok oldu
      if (sig.length === 7) {
        const ids = new Map(sig.map((p, k) => [p.id, k])); const seeds = Int32Array.from(ec, (v) => (ids.has(v) ? ids.get(v) : -1));
        const comp = grow(fg, seeds, w, h);
        return finish(name, data, w, h, bg, comp, partsOf(comp, w, h), `${tried.join('; ')}; ${name} r=${r}`);
      }
    }
    tried.push(`${name}: 7 çekirdek yok`);
  }
  // şablon: ön plan kutusunu oransal yedi şeride böl (`sablonYok`: ilk geçiş; şablon başarılı sayfalardan çıkarılır)
  const fg = fgOf(relaxBg); const box = fgBox(fg, w, h);
  if (!opts.sablonYok && box.x1 > box.x0) {
    const sab = opts.sablon?.length === 7 ? opts.sablon : templateFrom([]);
    const comp = new Int32Array(w * h).fill(-1); const span = box.x1 - box.x0 + 1;
    sab.forEach(([a, b], k) => { const xa = box.x0 + Math.round(a * span), xb = box.x0 + Math.round(b * span) - 1; for (let y = box.y0; y <= box.y1; y++) for (let x = xa; x <= xb; x++) { const i = y * w + x; if (fg[i]) comp[i] = k; } });
    const parts = partsOf(comp, w, h);
    if (plausible(parts, w, h)) return finish('sablon', data, w, h, relaxBg, comp, parts, `${tried.join('; ')}; oransal şablon (gözle doğrula)`);
    tried.push('şablon: parçalar makul değil');
  }
  const r = plain(strictBg);
  return { ...finish('yok', data, w, h, strictBg, r.comp, r.kept, tried.join('; ')), ok: false };
}
