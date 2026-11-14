/**
 * SD5: ten maskesindeki küçük delikleri kapatma (yalnız çizim tarafı; `assets/soy-maske-el/` ve otomatik maskeler değişmez).
 * Maske kenarındaki ince çatlaklar ve içerideki 1–3 piksellik boşluklar (yüz ve ellerde boyanmayan açık lekeler) morfolojik
 * kapama (genişlet, sonra aşındır; 3×3 kare, `iterations` kez) ile dolar. Eklenen piksel yalnız görselde dolu (alfa ≥ 10) ve ten
 * renginden belirgin kopmayan pikseldir (`keep`): göz akı, bebek, ağız içi gibi koyu ya da renksiz ayrıntılar delik sayılmaz.
 * Saf: DOM bilmez.
 */
import { rgbToLab } from './color';

export interface CloseOptions { iterations?: number; /** Piksel eklenebilir mi (renk/alfa koruması). */ keep?: (p: number) => boolean }

function dilate(src: Uint8Array, W: number, H: number): Uint8Array {
  const out = new Uint8Array(src.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = 0;
    for (let dy = -1; dy <= 1 && !v; dy++) {
      const yy = y + dy; if (yy < 0 || yy >= H) continue;
      for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; if (xx >= 0 && xx < W && src[yy * W + xx]) { v = 1; break; } }
    }
    out[y * W + x] = v;
  }
  return out;
}
function erode(src: Uint8Array, W: number, H: number): Uint8Array {
  const out = new Uint8Array(src.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = 1;
    for (let dy = -1; dy <= 1 && v; dy++) {
      const yy = y + dy;
      for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; if (yy < 0 || yy >= H || xx < 0 || xx >= W || !src[yy * W + xx]) { v = 0; break; } }
    }
    out[y * W + x] = v;
  }
  return out;
}
/** `on` (piksel başına 0/1) kapatılır; dönen dizide yeni dolan pikseller 1. Özgün dizi değişmez. */
export function closeMask(on: Uint8Array, W: number, H: number, opts: CloseOptions = {}): Uint8Array {
  const n = opts.iterations ?? 2;
  let d = on;
  for (let i = 0; i < n; i++) d = dilate(d, W, H);
  for (let i = 0; i < n; i++) d = erode(d, W, H);
  const out = Uint8Array.from(on);
  for (let p = 0; p < out.length; p++) if (!out[p] && d[p] && (!opts.keep || opts.keep(p))) out[p] = 1;
  return out;
}

/**
 * SD5/SD6: ten maskesi temizliği (çizim tarafı; dosyalar değişmez). 1) Delik kapatma: küçük boşluklar dolar; eklenen piksel görselde
 * dolu, L ≥ 30 ve renksiz beyaz/gri değil (göz akı, bebek, koyu çizgi delik sayılmaz). 2) Kenar saçağı (SD6): ten maskesine
 * bitişik, maskenin dışında kalan açık ten pikselleri (anti-alias saçağı: yanak-çene, kulak, boyun, saç çizgisi, el/parmak kenarı)
 * 1 piksel genişletmeyle maskeye alınır; yalnız ten tonunda (ortalama ten tonundan en çok 28° sapan, krosu ortalamanın yarısından
 * yüksek) ve çok açık değil/renksiz beyaz değil pikseller: gömlek yakası, manşet, dantel, göz akı, diş ve gerçek vurgular dokunulmaz.
 * Elle maskede eklenen piksel tam ağırlık alır.
 */
export function closeSkinHoles(data: Uint8ClampedArray, mask: Uint8Array | undefined, weights: Uint8Array | undefined, W: number, H: number): { mask?: Uint8Array; weights?: Uint8Array } {
  const base = mask ?? Uint8Array.from(weights as Uint8Array, (w) => (w > 0 ? 1 : 0));
  const lab = (p: number) => rgbToLab(data[p * 4] ?? 0, data[p * 4 + 1] ?? 0, data[p * 4 + 2] ?? 0);
  const keep = (p: number) => {
    if ((data[p * 4 + 3] ?? 0) < 10) return false;
    const [L, a, b] = lab(p);
    return L >= 30 && !(L > 80 && Math.hypot(a, b) < 6);
  };
  const closed = closeMask(base, W, H, { keep });
  // Kenar saçağı: ten ortalaması (ton, kroma).
  let sa = 0, sb = 0, sc = 0, n = 0;
  for (let p = 0; p < closed.length; p++) if (closed[p] && (data[p * 4 + 3] ?? 0) >= 10) { const [, a, b] = lab(p); sa += a; sb += b; sc += Math.hypot(a, b); n++; }
  const out = Uint8Array.from(closed);
  if (n > 0) {
    const mh = (Math.atan2(sb, sa) * 180) / Math.PI, mc = sc / n;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (closed[p] || (data[p * 4 + 3] ?? 0) < 10) continue;
      let nb = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if ((dx || dy) && xx >= 0 && xx < W && yy >= 0 && yy < H && closed[yy * W + xx]) nb++;
      }
      if (nb < 2) continue;
      const [L, a, b] = lab(p);
      const c = Math.hypot(a, b);
      const dh = Math.abs((((Math.atan2(b, a) * 180) / Math.PI - mh + 540) % 360) - 180);
      if (L < 45 || L > 94 || c < mc * 0.5 || dh > 28 || (L > 80 && c < 10)) continue;
      out[p] = 1;
    }
  }
  if (mask) return { mask: out };
  const w2 = Uint8Array.from(weights as Uint8Array);
  for (let p = 0; p < out.length; p++) if (out[p] && !base[p]) w2[p] = 255;
  return { weights: w2 };
}
