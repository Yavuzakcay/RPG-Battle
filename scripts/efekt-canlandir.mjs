// Kuyruk E5: tek kareli efekt hücresinden prosedürel kısa canlandırma (4–6 kare). Saf, deterministik; kural/motor yok.
// Girdi: kırpılmış RGBA hücre (alfa = parlaklık alfası, renk alfaya bölünmüş). Çıktı: S×S kareler (RGBA, ham).
// Türler (spec `canlandirma[ad]`): nabiz (ölçek-nabız + solma), kayma (yönlü ilerleme/yükselme), halka (genişleyip solar),
// donme (döngü: satır kayması dalgası + hafif salınım; kare 0 = kare N), yayil (çapa noktasından büyüyüp solar).

/** Hücre içerik sınır kutusu (alfa > eşik). */
export function bboxOf(buf, w, h, thr = 24) {
  let x0 = w; let x1 = -1; let y0 = h; let y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (buf[(y * w + x) * 4 + 3] > thr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

/** Parlaklıkla alfa kaplı hücreyi önceden çarpılmış kayan noktalı RGBA'ya, S×S tuvale (kutu merkezi tuval merkezinde) koyar. */
export function toCanvas(buf, w, h, box, S, scale) {
  const out = new Float32Array(S * S * 4);
  const cx = (box.x0 + box.x1) / 2; const cy = (box.y0 + box.y1) / 2;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    // Tuval pikseli → kaynak (bilinear); scale: tuval px / kaynak px.
    const sx = (x + 0.5 - S / 2) / scale + cx - 0.5; const sy = (y + 0.5 - S / 2) / scale + cy - 0.5;
    const x0 = Math.floor(sx); const y0 = Math.floor(sy); const fx = sx - x0; const fy = sy - y0;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const xx = x0 + i; const yy = y0 + j;
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const wt = (i ? fx : 1 - fx) * (j ? fy : 1 - fy);
      const s = (yy * w + xx) * 4; const a = buf[s + 3] / 255;
      const d = (y * S + x) * 4;
      out[d] += buf[s] * a * wt; out[d + 1] += buf[s + 1] * a * wt; out[d + 2] += buf[s + 2] * a * wt; out[d + 3] += a * wt;
    }
  }
  return out;
}

/** Önceden çarpılmış tuvali dönüştürür: (x,y) çıkış pikseli için kaynak = M⁻¹; k: alfa çarpanı. `warp(x,y) → [sx,sy]` (tuval px). */
function resample(src, S, warp, k) {
  const out = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const [sx, sy] = warp(x + 0.5, y + 0.5);
    const fx0 = sx - 0.5; const fy0 = sy - 0.5;
    const x0 = Math.floor(fx0); const y0 = Math.floor(fy0); const fx = fx0 - x0; const fy = fy0 - y0;
    let r = 0; let g = 0; let b = 0; let a = 0;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const xx = x0 + i; const yy = y0 + j;
      if (xx < 0 || yy < 0 || xx >= S || yy >= S) continue;
      const wt = (i ? fx : 1 - fx) * (j ? fy : 1 - fy); const s = (yy * S + xx) * 4;
      r += src[s] * wt; g += src[s + 1] * wt; b += src[s + 2] * wt; a += src[s + 3] * wt;
    }
    const d = (y * S + x) * 4;
    const ak = Math.min(1, a * k);
    out[d + 3] = Math.round(ak * 255);
    if (a > 1e-4) { out[d] = Math.min(255, Math.round(r / a)); out[d + 1] = Math.min(255, Math.round(g / a)); out[d + 2] = Math.min(255, Math.round(b / a)); }
  }
  return out;
}

const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Kare ilerlemesi `p` (0..1, `n` kare) için ölçek, kayma (tuval oranı) ve alfa çarpanı. Spec: { tur, kare, pivot?: [0..1,0..1] (içerik kutusuna göre),
 * dx, dy (toplam kayma, tuval oranı), olcek: [a,b], alfa?: [..] }.
 */
export function frameParams(spec, i) {
  const n = spec.kare ?? 5; const p = n > 1 ? i / (n - 1) : 0;
  const [s0, s1] = spec.olcek ?? [1, 1];
  switch (spec.tur) {
    case 'nabiz': {
      // Ölçek 0.9 → büyür → yerine oturur; alfa: hızlı belirir, tutar, solar.
      const sc = p < 0.4 ? lerp(s0, s1, smooth(p / 0.4)) : lerp(s1, (s0 + s1) / 2 + (s1 - s0) * 0.1, (p - 0.4) / 0.6);
      const k = p < 0.2 ? 0.45 + 0.55 * (p / 0.2) : p < 0.65 ? 1 : lerp(1, 0.35, (p - 0.65) / 0.35);
      return { sc, dx: 0, dy: 0, k };
    }
    case 'kayma': {
      // Yönlü ilerleme: kayma ease-out, alfa belirip solar.
      const e = 1 - (1 - p) * (1 - p);
      const k = p < 0.2 ? 0.5 + 0.5 * (p / 0.2) : p < 0.6 ? 1 : lerp(1, 0.25, (p - 0.6) / 0.4);
      return { sc: lerp(s0, s1, e), dx: (spec.dx ?? 0) * (e - 0.4), dy: (spec.dy ?? 0) * (e - 0.4), k };
    }
    case 'halka': {
      // Genişleyip solar: ölçek s0 → s1, alfa zarfı (iç: belirir; sonra söner).
      const k = p < 0.25 ? 0.4 + 0.6 * (p / 0.25) : lerp(1, 0.1, smooth((p - 0.25) / 0.75));
      return { sc: lerp(s0, s1, smooth(p)), dx: 0, dy: 0, k };
    }
    case 'yayil': {
      const k = p < 0.2 ? 0.5 + 0.5 * (p / 0.2) : lerp(1, 0.15, smooth((p - 0.2) / 0.8));
      return { sc: lerp(s0, s1, 1 - (1 - p) * (1 - p)), dx: 0, dy: 0, k };
    }
    case 'donme': {
      // Döngü: i/n (son kare ilk kareye bağlanır).
      const ph = (i / n) * Math.PI * 2;
      return { sc: s0 + (s1 - s0) * (0.5 + 0.5 * Math.sin(ph)), dx: 0, dy: 0, k: 1, ph };
    }
    default: return { sc: 1, dx: 0, dy: 0, k: 1 };
  }
}

/** Bir hücreden `spec.kare` karelik şerit üretir (S×S ham RGBA kareler). */
export async function animate(cell, spec, S, margin = 1.45) {
  const box = bboxOf(cell.buf, cell.w, cell.h);
  if (!box) throw new Error('boş hücre');
  const bw = box.x1 - box.x0; const bh = box.y1 - box.y0;
  // `merkez` [0..1, 0..1] (içerik kutusuna göre): tuval merkezi o nokta (ör. örümcek tırmanışı: ışınların çıktığı temas noktası kutunun sol-ortası);
  // içerik tuvale o noktadan en uzak kenara göre sığdırılır. Yoksa kutu merkezi.
  const m = spec.merkez;
  const cxs = m ? box.x0 + m[0] * bw : (box.x0 + box.x1) / 2; const cys = m ? box.y0 + m[1] * bh : (box.y0 + box.y1) / 2;
  const ext = m ? 2 * Math.max(cxs - box.x0, box.x1 - cxs, cys - box.y0, box.y1 - cys) : Math.max(bw, bh);
  const scale = S / (ext * margin);
  const src = toCanvas(cell.buf, cell.w, cell.h, { x0: cxs, x1: cxs, y0: cys, y1: cys }, S, scale);
  const n = spec.kare ?? 5;
  // Ölçek/kayma çapası: `merkez` varsa tuval merkezi; yoksa içerik kutusunun oranı (varsayılan merkez).
  const [px, py] = spec.pivot ?? [0.5, 0.5];
  const pivX = m ? S / 2 : S / 2 + (px - 0.5) * bw * scale; const pivY = m ? S / 2 : S / 2 + (py - 0.5) * bh * scale;
  const frames = [];
  for (let i = 0; i < n; i++) {
    const f = frameParams(spec, i);
    let warp;
    if (spec.tur === 'donme') {
      // Satır kayması dalgası: yatay kayma sin(y·k + faz); hafif dönüş salınımı.
      const amp = (spec.genlik ?? 0.07) * S; const kf = (spec.dalga ?? 2.6) * Math.PI * 2 / S;
      warp = (x, y) => {
        const z = (y - S / 2) / f.sc; const w0 = (x - S / 2) / f.sc;
        const rot = Math.sin(f.ph) * (spec.salinim ?? 0.05); const c = Math.cos(rot); const s = Math.sin(rot);
        return [S / 2 + w0 * c - z * s - amp * Math.sin(y * kf + f.ph), S / 2 + w0 * s + z * c];
      };
    } else {
      warp = (x, y) => [pivX + (x - pivX - f.dx * S) / f.sc, pivY + (y - pivY - f.dy * S) / f.sc];
    }
    frames.push(resample(src, S, warp, f.k));
  }
  return frames;
}
