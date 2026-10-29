// Sprite sheet kesimi (Görev V): macenta arka planlı sheet'lerde kareleri bulur. Saf (görüntü kütüphanesi yok):
// girdi RGB piksel dizisi; testler sentetik dizilerle çalışır (görsel dosyası testlere girmez).
//
// 1. Macenta maskesi (tolerans: JPG gürültüsü, açık/koyu pembe zemin).
// 2. Bantlar: macenta oranı yüksek satır aralıkları (4×2 ızgarada iki bant; altlarındaki etiketler ve gri şerit
//    bant dışında kalır).
// 3. Hücreler: bant içinde macenta oranı yüksek sütun aralıkları; ince koyu ayraçlar ve gri boşluklar hücreleri böler.
// 4. Ayraçsız şeritte (geniş tek hücre): `split: 'period'` eşit bölme (sayı = genişlik / içerik profilinin periyodu),
//    `split: 'content'` içerik boşluklarından (düzensiz genişlikli karelerde, ör. engel).
// 5. Boş hücreler (içeriksiz) atılır.

/** Arka plan macentası: R ve B yüksek, birbirine yakın, G belirgin düşük. */
export const isMagenta = (r, g, b) => r >= 120 && b >= 120 && Math.min(r, b) - g >= 60 && Math.abs(r - b) <= 70;
/** JPG kenar halosu: arka plana komşu, macentaya kaymış parlak karışım pikseli. */
export const isHalo = (r, g, b) => Math.max(r, b) >= 100 && Math.min(r, b) - g >= 28 && Math.abs(r - b) <= 45;

/** Boşluk eşiği: satır/sütunun bu orandan azı macentaysa ayraç ya da gri zemin sayılır. */
const GAP = 0.06;

/** Uzunluğu `min`'den az olmayan true aralıkları: [[a, b], …] (b dahil). */
export function runs(flags, min = 1) {
  const out = [];
  let start = -1;
  for (let i = 0; i <= flags.length; i++) {
    if (i < flags.length && flags[i]) { if (start < 0) start = i; }
    else if (start >= 0) { if (i - start >= min) out.push([start, i - 1]); start = -1; }
  }
  return out;
}

/**
 * Kareleri bulur. `px(x, y)` → [r, g, b]. Döner: { frames: [{x0, y0, x1, y1}], grid: {rows, cols}, notes }.
 * `split`: ayraçsız geniş hücrelerde bölme yolu ('period' | 'content').
 */
export function findCells(w, h, px, { split = 'period', minCell = 24 } = {}) {
  const mag = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [r, g, b] = px(x, y); mag[y * w + x] = isMagenta(r, g, b) ? 1 : 0; }
  const rowFrac = (y, x0 = 0, x1 = w - 1) => { let n = 0; for (let x = x0; x <= x1; x++) n += mag[y * w + x]; return n / (x1 - x0 + 1); };
  const colFrac = (x, y0, y1) => { let n = 0; for (let y = y0; y <= y1; y++) n += mag[y * w + x]; return n / (y1 - y0 + 1); };
  // Bantlar: macentası olan satır aralıkları (etiket ve gri şerit satırlarında macenta yok ya da çok az).
  const bands = runs(Array.from({ length: h }, (_, y) => rowFrac(y) >= GAP), minCell);
  const frames = [];
  const notes = [];
  let cols = 0;
  for (const [y0, y1] of bands) {
    // Hücre sütunları: macentası olan sütunlar; ince koyu ayraç ve gri boşluk sütunlarında macenta yok denecek kadar az.
    const cells = runs(Array.from({ length: w }, (_, x) => colFrac(x, y0, y1) >= GAP), minCell);
    // Hücre içi gerçek sınır: bant içinde hücre sütunlarında macentanın başladığı/bittiği satırlar (kenardaki gri şerit kırpılır).
    let rowCount = 0;
    for (const [x0, x1] of cells) {
      const bh = y1 - y0 + 1, cw = x1 - x0 + 1;
      const parts = [];
      if (cw > bh * 1.5) {
        if (split === 'content') {
          // İçerik sütunları: macenta olmayan pikseli olan sütunlar; aradaki tam macenta boşluklar kareleri ayırır.
          const has = Array.from({ length: cw }, (_, i) => colFrac(x0 + i, y0, y1) < 0.995);
          const raw = runs(has, 4);
          // Kare arası uçuşan parçacık: genişliği ortanca karenin %15'inden azsa en yakın kareye katılır.
          const med = [...raw].map(([a, b]) => b - a + 1).sort((p, q) => p - q)[Math.floor(raw.length / 2)] ?? 0;
          const segs = [];
          for (const sgm of raw) {
            const last = segs[segs.length - 1];
            if (sgm[1] - sgm[0] + 1 < med * 0.15 && last) last[1] = sgm[1];
            else if (last && last[1] - last[0] + 1 < med * 0.15) { last[1] = sgm[1]; }
            else segs.push([...sgm]);
          }
          // Kareler arası orta noktadan kes (kare içeriği tam kapsansın).
          segs.forEach(([a, b], k) => {
            const left = k === 0 ? 0 : Math.floor((segs[k - 1][1] + a) / 2) + 1;
            const right = k === segs.length - 1 ? cw - 1 : Math.floor((b + segs[k + 1][0]) / 2);
            parts.push([x0 + left, x0 + right]);
          });
          notes.push(`içerik boşluklarından ${segs.length} kare`);
        } else {
          // Kare sayısı içerik profilinin periyodundan (öz-ilinti; kareler eşit genişlikte, kare olmak zorunda değil).
          const prof = Array.from({ length: cw }, (_, i) => 1 - colFrac(x0 + i, y0, y1));
          const period = bestPeriod(prof, Math.round(bh * 0.45), Math.round(bh * 1.6));
          const n = Math.max(1, Math.round(cw / period));
          for (let k = 0; k < n; k++) parts.push([x0 + Math.round((k * cw) / n), x0 + Math.round(((k + 1) * cw) / n) - 1]);
          notes.push(`ayraçsız şerit ${cw}×${bh}: periyot ${period} px → ${n} hücre`);
        }
      } else parts.push([x0, x1]);
      for (const [a, b] of parts) {
        // İçerik yoksa (tam macenta) boş hücre: atılır.
        let content = 0;
        for (let y = y0; y <= y1 && content < 8; y += 2) for (let x = a; x <= b && content < 8; x += 2) if (!mag[y * w + x]) content++;
        if (content < 8) { notes.push(`boş hücre atlandı (x ${a}–${b})`); continue; }
        frames.push({ x0: a, y0, x1: b, y1 });
        rowCount++;
      }
    }
    cols = Math.max(cols, rowCount);
  }
  return { frames, grid: { rows: bands.length, cols }, notes };
}

/**
 * Profilin periyodu (`lo`..`hi` px): öz-ilintinin yerel tepelerinden, en yüksek tepenin %80'ine ulaşan en kısa gecikme
 * (katları da yüksek ilintili; frightened'da 2 kare = 1 periyot sanılmasın).
 */
export function bestPeriod(prof, lo, hi) {
  const n = prof.length;
  const mean = prof.reduce((a, b) => a + b, 0) / n;
  const d = prof.map((v) => v - mean);
  const score = [];
  for (let lag = 0; lag <= Math.min(hi + 1, n - 1); lag++) {
    let sum = 0;
    for (let i = 0; i + lag < n; i++) sum += d[i] * d[i + lag];
    score[lag] = sum / (n - lag);
  }
  const peaks = [];
  for (let lag = Math.max(2, lo); lag <= Math.min(hi, n - 2); lag++) if (score[lag] >= score[lag - 1] && score[lag] >= score[lag + 1]) peaks.push(lag);
  if (peaks.length === 0) return lo;
  const top = Math.max(...peaks.map((l) => score[l]));
  return peaks.find((l) => score[l] >= top * 0.8) ?? peaks[0];
}
