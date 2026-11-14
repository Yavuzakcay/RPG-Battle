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
 * SD5: ten maskesi delik kapatma (`maskClose.ts`): eklenen piksel görselde dolu, çok koyu değil ve renksiz beyaz/gri değil
 * (göz akı, bebek, koyu ağız çizgisi delik sayılmaz). Elle maskede eklenen piksel tam ağırlık alır.
 */
export function closeSkinHoles(data: Uint8ClampedArray, mask: Uint8Array | undefined, weights: Uint8Array | undefined, W: number, H: number): { mask?: Uint8Array; weights?: Uint8Array } {
  const base = mask ?? Uint8Array.from(weights as Uint8Array, (w) => (w > 0 ? 1 : 0));
  const keep = (p: number) => {
    const i = p * 4;
    if ((data[i + 3] ?? 0) < 10) return false;
    const [L, a, b] = rgbToLab(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0);
    return L >= 30 && !(L > 80 && Math.hypot(a, b) < 6);
  };
  const closed = closeMask(base, W, H, { keep });
  if (mask) return { mask: closed };
  const w2 = Uint8Array.from(weights as Uint8Array);
  for (let p = 0; p < closed.length; p++) if (closed[p] && !base[p]) w2[p] = 255;
  return { weights: w2 };
}

