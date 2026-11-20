// KW1 (yalnız görünüm): Dragonborn kanat paleti. Kanadın rengi soyun BOYANMIŞ gövde rengine yakın olsun (eskiden çok açık gri-pastel).
// `npx vite-node scripts/dragonborn-kanat-palet.ts [--yaz] [--adim 5] [--rapor <dosya.json>]`
// Yöntem:
//  1. Gövde: örneklenen Dragonborn jetonları (sıralı listenin her ADIM'inci; pul maskesi) `src/ui/scaleTint.ts` `scalePixels` ile boyanır, maske pikselleri
//     (alfa ≥ 200) için havuzlanmış Lab ortalaması ve açıklık yüzdelikleri alınır (oyundaki boyama ile aynı kod).
//  2. Kanat: `public/kanat/dragonborn.webp` nötr gri (R=G=B), parlaklık (Rec.709 luma) 0.72–1.0 arasında yoğun. Filtre `src/ui/WingFilter.tsx`:
//     t = clamp((luma − esik) / (1 − esik)), renk = golge + (isik − golge) · t (sRGB). `esik` kanadın dar parlaklık aralığını palet aralığına gerer.
//  3. Hedef kanat ortalaması (Lab) = soyun gövde ortalaması; yalnız White (sıcak parlak beyaz) ve Silver (soğuk metalik gri-mavi) HEDEF'te elle.
//     golge/isik, hedef etrafında açıklık yayılımı S (gövde açıklık aralığının oranı) ile kurulur, birkaç yinelemeyle kanadın ölçülen ortalaması hedefe oturtulur.
//  4. Ölçüt (README ve test): kanat ortalaması ile gövde ortalaması ΔE ≤ 15 (Black/White ≤ 20); White ile Silver kanat ortalamaları ΔE ≥ 12.
// KW2: katman paletleri. `dragonborn-zar.webp` (kanat zarı) soyun paletinin PEMBEyle karışımı ile boyanır (Lab: a/b `ab` oranında pembeye, açıklık `aciklik` oranında pembe açıklığına
//     kayar; pembenin kroması açıklıkla ölçeklenir), `dragonborn-pence.webp` (pençe uçları) boynuz beyazıyla (jetonların boyanmamış boynuz piksellerinin ortalaması, L 80,4).
//     Zar paleti, zar bölgesinin taban paletle ölçülen ortalamasına PEMBE karışımı uygulanmış hedefe oturtulur (karışımsız hal = zar katmanı kapalı).
// --yaz: data/kanat-esleme.json `dragonborn.renkPaletleri` (golge, isik, esik, zar{...}), `katmanlar.pence.palet` ve `pembe` yazılır (`katmanlar.zar.etkin` korunur).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { scalePixels } from '../src/ui/scaleTint';
import { deltaE, labToRgb, rgbToLab } from '../src/ui/color';

const C = 'public/characters';
const SOY = ['black', 'blue', 'brass', 'bronze', 'copper', 'gold', 'green', 'red', 'silver', 'white'];
/** Hedefi gövde ortalamasından farklı olan soylar (Lab): White sıcak parlak beyaz, Silver soğuk metalik gri-mavi. */
const HEDEF: Record<string, [number, number, number]> = { white: [88, 0.5, 5.5], silver: [61, -2.5, -9.5] };
/** Açıklık yayılımı S: gövde açıklık aralığının (p5–p95) oranı, [min, max] ile sınırlı; soy başına elle ezme. */
const S_ORAN = 0.62, S_MIN = 20, S_MAX = 30;
const S_EZ: Record<string, number> = { white: 17 };
const ESIK = 0.76;
/** KW2: pembe (Lab) ve karışım oranları: `ab` renk (a*, b*) oranı, `aciklik` açıklık oranı. */
const PEMBE = { L: 75, a: 30, b: 4, ab: 0.5, aciklik: 0.15 };
/** KW2: boynuz beyazı: ortalama açıklık, gölge ve ışık uçları (Lab); esik ortalamayı oturtur. */
const BOYNUZ = { ortL: 80.4, golge: [62, 0.3, 3.5] as [number, number, number], isik: [94, 0, 3] as [number, number, number] };

const arg = (k: string, d?: string) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const ADIM = +(arg('--adim', '5') as string);

const hex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const unhex = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
const labHex = (L: number, a: number, b: number) => hex(...labToRgb(L, a, b));

// 1) gövde
const names = fs.readdirSync(C).filter((f) => /^dragonborn-(erkek|kadin)-.*\.webp$/.test(f)).map((f) => f.slice(0, -5)).sort().filter((_, i) => i % ADIM === 0);
type Body = { L: number; a: number; b: number; Lp: number[]; n: number };
async function bodyStats(): Promise<Record<string, Body>> {
  const imgs = await Promise.all(names.map(async (n) => {
    const { data, info } = await sharp(path.join(C, `${n}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const mask = Uint8Array.from(await sharp(path.join(C, 'maske-pul', `${n}.png`)).greyscale().raw().toBuffer(), (v) => (v > 127 ? 1 : 0));
    return { data, W: info.width, H: info.height, mask };
  }));
  const out: Record<string, Body> = {};
  for (const soy of SOY) {
    let n = 0, sL = 0, sa = 0, sb = 0; const Ls: number[] = [];
    for (const im of imgs) {
      const d = Uint8ClampedArray.from(im.data);
      scalePixels(d, soy, im.mask, im.W, im.H);
      for (let p = 0; p < im.W * im.H; p++) {
        if (!im.mask[p] || d[p * 4 + 3]! < 200) continue;
        const [L, a, b] = rgbToLab(d[p * 4]!, d[p * 4 + 1]!, d[p * 4 + 2]!);
        n++; sL += L; sa += a; sb += b; if (n % 7 === 0) Ls.push(L);
      }
    }
    Ls.sort((x, y) => x - y);
    const pc = (q: number) => Ls[Math.floor(q * (Ls.length - 1))]!;
    out[soy] = { L: sL / n, a: sa / n, b: sb / n, Lp: [0.05, 0.25, 0.5, 0.75, 0.95].map(pc), n };
  }
  return out;
}

// 2) kanat: nötr gri, parlaklık histogramı (0..255)
async function wingHist(): Promise<number[]> {
  const { data, info } = await sharp('public/kanat/dragonborn.webp').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const h = new Array<number>(256).fill(0);
  for (let p = 0; p < info.width * info.height; p++) if (data[p * 4 + 3]! > 200) h[data[p * 4]!]!++;
  return h;
}
/** Alfa ağırlıklı parlaklık histogramı (katman görselleri: alfa = bölge ağırlığı). */
async function layerHist(file: string): Promise<number[]> {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const h = new Array<number>(256).fill(0);
  for (let p = 0; p < info.width * info.height; p++) h[data[p * 4]!]! += data[p * 4 + 3]! / 255;
  return h;
}
type Pal = { golge: string; isik: string; esik: number };
/** Filtre sonrası kanadın Lab ortalaması ve yüzdelikleri (histogram üzerinden). */
function wingMean(hist: number[], pal: Pal): { L: number; a: number; b: number; Lp: number[] } {
  const lo = unhex(pal.golge), hi = unhex(pal.isik);
  let n = 0, sL = 0, sa = 0, sb = 0; const rows: Array<[number, number]> = [];
  hist.forEach((c, v) => {
    if (!c) return;
    const t = Math.max(0, Math.min(1, (v / 255 - pal.esik) / (1 - pal.esik)));
    const rgb = lo.map((l, i) => Math.round(l + (hi[i]! - l) * t));
    const [L, a, b] = rgbToLab(rgb[0]!, rgb[1]!, rgb[2]!);
    n += c; sL += L * c; sa += a * c; sb += b * c; rows.push([L, c]);
  });
  rows.sort((x, y) => x[0] - y[0]);
  const pc = (q: number) => { let acc = 0; for (const [L, c] of rows) { acc += c; if (acc >= q * n) return L; } return rows[rows.length - 1]![0]; };
  return { L: sL / n, a: sa / n, b: sb / n, Lp: [0.05, 0.5, 0.95].map(pc) };
}
/** Hedef ortalamaya oturan palet: uçlar hedef ± S (t̄ ağırlıklı), yinelemeli düzeltme. */
function solve(hist: number[], target: [number, number, number], S: number): Pal {
  const tm = (() => { let n = 0, s = 0; hist.forEach((c, v) => { n += c; s += c * Math.max(0, Math.min(1, (v / 255 - ESIK) / (1 - ESIK))); }); return s / n; })();
  let off: [number, number, number] = [0, 0, 0], pal: Pal = { golge: '#000000', isik: '#ffffff', esik: ESIK };
  for (let it = 0; it < 12; it++) {
    const T = [target[0] + off[0], target[1] + off[1], target[2] + off[2]] as const;
    pal = { golge: labHex(T[0] - S * tm, T[1], T[2]), isik: labHex(T[0] + S * (1 - tm), T[1], T[2]), esik: ESIK };
    const m = wingMean(hist, pal);
    const e: [number, number, number] = [target[0] - m.L, target[1] - m.a, target[2] - m.b];
    off = [off[0] + e[0], off[1] + e[1], off[2] + e[2]];
    if (Math.hypot(...e) < 0.4) break;
  }
  return pal;
}

(async () => {
  const body = await bodyStats(), hist = await wingHist();
  const zarHist = await layerHist('public/kanat/dragonborn-zar.webp'), penceHist = await layerHist('public/kanat/dragonborn-pence.webp');
  const result: Record<string, Pal & { zar: Pal }> = {}, rapor: Record<string, unknown> = {};
  for (const soy of SOY) {
    const b = body[soy]!;
    const target = HEDEF[soy] ?? ([b.L, b.a, b.b] as [number, number, number]);
    const S = S_EZ[soy] ?? Math.max(S_MIN, Math.min(S_MAX, S_ORAN * (b.Lp[4]! - b.Lp[0]!)));
    const pal = solve(hist, target, S), w = wingMean(hist, pal);
    // KW2 zar: taban paletle zar bölgesinin ortalaması (wz0) → pembe karışımı hedefi → aynı yayılımla çöz
    const wz0 = wingMean(zarHist, pal);
    const Lz = wz0.L + PEMBE.aciklik * (PEMBE.L - wz0.L), f = Math.max(0.5, Math.min(1, Lz / PEMBE.L));
    const tz: [number, number, number] = [Lz, (1 - PEMBE.ab) * wz0.a + PEMBE.ab * PEMBE.a * f, (1 - PEMBE.ab) * wz0.b + PEMBE.ab * PEMBE.b * f];
    const zarPal = solve(zarHist, tz, S), wz = wingMean(zarHist, zarPal);
    result[soy] = { ...pal, zar: zarPal };
    rapor[soy] = { govde: { L: +b.L.toFixed(1), a: +b.a.toFixed(1), b: +b.b.toFixed(1), Lp: b.Lp.map((x) => +x.toFixed(1)) }, kanat: { L: +w.L.toFixed(1), a: +w.a.toFixed(1), b: +w.b.toFixed(1), Lp: w.Lp.map((x) => +x.toFixed(1)) }, dE: +deltaE([w.L, w.a, w.b], [b.L, b.a, b.b]).toFixed(1), S: +S.toFixed(1), ...pal,
      zarOnce: { L: +wz0.L.toFixed(1), a: +wz0.a.toFixed(1), b: +wz0.b.toFixed(1) }, zarSonra: { L: +wz.L.toFixed(1), a: +wz.a.toFixed(1), b: +wz.b.toFixed(1), Lp: wz.Lp.map((x) => +x.toFixed(1)) }, zarKayma: +deltaE([wz.L, wz.a, wz.b], [wz0.L, wz0.a, wz0.b]).toFixed(1), zarPal };
  }
  // KW2 pençe: sabit uçlar, esik ortalama açıklığı boynuz ortalamasına oturtur (açıklık esik arttıkça düşer)
  const pg = labHex(...BOYNUZ.golge), pi = labHex(...BOYNUZ.isik);
  let lo = 0.2, hi = 0.97;
  for (let it = 0; it < 40; it++) { const m = (lo + hi) / 2; if (wingMean(penceHist, { golge: pg, isik: pi, esik: m }).L > BOYNUZ.ortL) lo = m; else hi = m; }
  const penceEsik = +((lo + hi) / 2).toFixed(3), penceW = wingMean(penceHist, { golge: pg, isik: pi, esik: penceEsik });
  const wb = (s: string) => (rapor[s] as { kanat: { L: number; a: number; b: number } }).kanat;
  const ws = deltaE([wb('white').L, wb('white').a, wb('white').b], [wb('silver').L, wb('silver').a, wb('silver').b]);
  console.log('soy      gövde L a b            kanat L a b (p5/50/95)               ΔE   S    golge     isik');
  for (const soy of SOY) {
    const r = rapor[soy] as { govde: { L: number; a: number; b: number }; kanat: { L: number; a: number; b: number; Lp: number[] }; dE: number; S: number; golge: string; isik: string };
    console.log(`${soy.padEnd(8)} ${[r.govde.L, r.govde.a, r.govde.b].map((x) => x.toFixed(1).padStart(6)).join('')}   ${[r.kanat.L, r.kanat.a, r.kanat.b].map((x) => x.toFixed(1).padStart(6)).join('')} (${r.kanat.Lp.join('/')})   ${String(r.dE).padStart(5)} ${String(r.S).padStart(5)}  ${r.golge} ${r.isik}`);
  }
  console.log(`White ↔ Silver kanat ΔE: ${ws.toFixed(1)}; örnek jeton: ${names.length} (her ${ADIM}.), esik ${ESIK}`);
  console.log('\nKW2 zar (karışımsız → pembe karışımlı, zar bölgesi Lab ortalaması):');
  for (const soy of SOY) {
    const r = rapor[soy] as { zarOnce: { L: number; a: number; b: number }; zarSonra: { L: number; a: number; b: number; Lp: number[] }; zarKayma: number; zarPal: Pal };
    console.log(`${soy.padEnd(8)} ${[r.zarOnce.L, r.zarOnce.a, r.zarOnce.b].map((x) => x.toFixed(1).padStart(6)).join('')}  →${[r.zarSonra.L, r.zarSonra.a, r.zarSonra.b].map((x) => x.toFixed(1).padStart(6)).join('')} (L p5/50/95 ${r.zarSonra.Lp.join('/')})  kayma ΔE ${String(r.zarKayma).padStart(5)}  ${r.zarPal.golge} ${r.zarPal.isik}`);
  }
  console.log(`KW2 pençe: golge ${pg} isik ${pi} esik ${penceEsik} → ortalama L ${penceW.L.toFixed(1)} a ${penceW.a.toFixed(1)} b ${penceW.b.toFixed(1)} (hedef L ${BOYNUZ.ortL})`);
  if (arg('--rapor')) fs.writeFileSync(arg('--rapor') as string, JSON.stringify({ ornekJeton: names.length, adim: ADIM, esik: ESIK, beyazGumusDE: +ws.toFixed(1), pembe: PEMBE, pence: { golge: pg, isik: pi, esik: penceEsik, L: +penceW.L.toFixed(1), a: +penceW.a.toFixed(1), b: +penceW.b.toFixed(1) }, soylar: rapor }, null, 1) + '\n');
  if (process.argv.includes('--yaz')) {
    const f = 'data/kanat-esleme.json', j = JSON.parse(fs.readFileSync(f, 'utf8'));
    const slot = j.slotlar.dragonborn;
    slot.renkPaletleri = Object.fromEntries(SOY.map((s) => [s, { golge: result[s]!.golge, isik: result[s]!.isik, esik: result[s]!.esik, zar: result[s]!.zar }]));
    slot.katmanlar = { zar: { dosya: 'dragonborn-zar.webp', etkin: slot.katmanlar?.zar?.etkin ?? true }, pence: { dosya: 'dragonborn-pence.webp', palet: { golge: pg, isik: pi, esik: penceEsik } } };
    slot.pembe = PEMBE;
    fs.writeFileSync(f, JSON.stringify(j, null, 1) + '\n');
    console.log('yazıldı:', f);
  }
})();
