/**
 * Görev K22: soy kafa kaplaması (saf piksel işlemi). Kapsamdaki jetonda (veride `basKaplama`) kafa sınırlayıcı kutusu
 * (`box`) içindeki ten maskesi pikselleri şeffaflaştırılır, temiz kafa görseli (jetonla aynı boyutta, yalnızca kutu
 * içinde opak; `npm run soy-bas` üretir) üstüne konur. Kutu dışındaki hiçbir piksel değişmez. Boyama maskesi: kutu
 * dışında eski ten maskesi, kutu içinde kafa görselinin opak pikselleri (göz ve işaretler dahil; LCh kaydırma açıklık
 * farklarını koruduğu için kontrast kalır). Kaplamanın örtmediği eski ten pikselleri eski hâline döner (delik kalmaz).
 */
export type Box = [number, number, number, number];

export function applyHeadOverlay(data: Uint8ClampedArray, mask: Uint8Array, overlay: Uint8ClampedArray, box: Box, W: number): { mask: Uint8Array; covered: number; restored: number } {
  const out = new Uint8Array(mask);
  let covered = 0, restored = 0;
  const [x0, y0, x1, y1] = box;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const p = y * W + x, i = p * 4;
    const a = overlay[i + 3] ?? 0;
    const wasSkin = mask[p] === 1;
    if (a > 0) {
      // Kafa görseli: sprite pikselinin yerine (yarı saydam kenarda alfa karışımı).
      const k = a / 255;
      for (let c = 0; c < 3; c++) data[i + c] = Math.round((overlay[i + c] ?? 0) * k + (wasSkin ? 0 : (data[i + c] ?? 0) * (1 - k)));
      data[i + 3] = wasSkin ? a : Math.max(data[i + 3] ?? 0, a);
      out[p] = 1;
      covered++;
    } else if (wasSkin) {
      // Eski ten pikseli: şeffaflaştırılır; kaplamanın örtmediği yerde eski hâli kalır (delik açılmaz) ve boyanmaz.
      out[p] = 1;
      restored++;
    } else {
      out[p] = mask[p] ?? 0;
    }
  }
  return { mask: out, covered, restored };
}
