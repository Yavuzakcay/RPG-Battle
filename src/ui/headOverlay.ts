/**
 * Görev K22: soy kafa kaplaması (saf piksel işlemi). Kapsamdaki jetonda (veride `basKaplama`) kafa sınırlayıcı kutusu
 * (`box`) içindeki ten maskesi pikselleri şeffaflaştırılır, temiz kafa görseli (jetonla aynı boyutta, yalnızca kutu
 * içinde opak; `npm run soy-bas` üretir) üstüne konur. Kutu dışındaki hiçbir piksel değişmez. Boyama maskesi: kutu
 * dışında eski ten maskesi, kutu içinde kafa görselinin opak pikselleri (göz ve işaretler dahil; LCh kaydırma açıklık
 * farklarını koruduğu için kontrast kalır). Kaplamanın örtmediği eski ten pikselleri eski hâline döner (delik kalmaz).
 */
export type Box = [number, number, number, number];

/**
 * Görev K23: `body: false` (veride `basKaplama.<ırk>.govdeBoya: false`): kafa dışında hiçbir ten boyanmaz. Boyama maskesi
 * yalnızca kaplamanın opak pikselleri; kaplamanın örtmediği eski ten pikselleri (kutu içinde de) boyanmaz. Kafa ile
 * boyanmayan ten (boyun) arasında dikiş kalmasın diye `weights` döner: boyanmayan tene 1–2 piksel uzaklıktaki kafa
 * pikselleri kısmen boyanır (85, 170; diğerleri 255).
 */
export function applyHeadOverlay(data: Uint8ClampedArray, mask: Uint8Array, overlay: Uint8ClampedArray, box: Box, W: number,
  opts: { body?: boolean } = {}): { mask: Uint8Array; covered: number; restored: number; weights?: Uint8Array } {
  const body = opts.body ?? true;
  const out = body ? new Uint8Array(mask) : new Uint8Array(mask.length);
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
      // Eski ten pikseli: kaplamanın örtmediği yerde eski hâli kalır (delik açılmaz). Gövde boyanıyorsa maskede kalır.
      out[p] = body ? 1 : 0;
      restored++;
    } else {
      out[p] = body ? (mask[p] ?? 0) : 0;
    }
  }
  if (body) return { mask: out, covered, restored };
  // Dikiş yumuşatma: boyanmayan ten (eski maske, kaplama dışı) komşuluğunda ağırlık düşer.
  const H = Math.floor(mask.length / W);
  const weights = new Uint8Array(mask.length);
  for (let p = 0; p < out.length; p++) {
    if (!out[p]) continue;
    const x = p % W, y = (p - x) / W;
    let d = 3;
    for (let dy = -2; dy <= 2 && d > 1; dy++) for (let dx = -2; dx <= 2; dx++) {
      const X = x + dx, Y = y + dy;
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const q = Y * W + X;
      if (mask[q] === 1 && !out[q]) d = Math.min(d, Math.max(Math.abs(dx), Math.abs(dy)));
    }
    weights[p] = d >= 3 ? 255 : d * 85;
  }
  return { mask: out, covered, restored, weights };
}

/**
 * Görev Z1: kafa görselinin ölçeği. Görsel (opak boyut) kafa kutusuyla her iki eksende `tolPx` içinde eşleşiyorsa
 * sprite'ın kendi piksel ölçeğinde çizilmiş sayılır: ölçekleme yok (×1, en yakın komşu bile uygulanmaz). Değilse eski
 * davranış: kutuyu örtecek ölçek (en yakın komşu) ve uyarı. Tolerans veride (`data/soy-renkleri.json` `basOlcekToleransPx`).
 */
export function headScale(head: [number, number], need: [number, number], tolPx: number): { scale: number; native: boolean; warn?: string } {
  const [hw, hh] = head, [bw, bh] = need;
  if (Math.abs(hw - bw) <= tolPx && Math.abs(hh - bh) <= tolPx) return { scale: 1, native: true };
  const scale = Math.max(bw / hw, bh / hh);
  return { scale, native: false, warn: `kafa görseli ${hw}×${hh}, gereken ≈${bw}×${bh} (±${tolPx} px dışında): ×${Math.round(scale * 100) / 100} en yakın komşuyla ölçeklendi` };
}
