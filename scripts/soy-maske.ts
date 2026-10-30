// Görev K15: soylu ırkların jetonları için ten/pul maskesi + soy renk ölçümü.
// Çalıştırma: npm run soy-maske  (vite-node; sharp)
// 1) Her sprite'ta ten maskesi (`head`: yalnızca baş bölgesi): ırkın gevşek aday rengi (data/soy-renkleri.json `mask`), baş bölgesindeki en büyük aday
//    bileşeni tohum; tohumun en parlak kümelerinden palet (saç gibi koyu bölgeler girmesin); paletten ΔE ≤ eşik adaylar;
//    sprite başına düzeltme (`maskFix`: dışlanan/eklenen dikdörtgenler, 256 px koordinat). Çıktı public/characters/maske/<ad>.png.
// 2) Ölçüm: soyların boyaması (src/ui/tint.ts, çalışma anındaki aynı fonksiyon) sonrası ten bölgesinin ortalama Lab'ı;
//    soy çiftleri arası ΔE → data/soy-olcum.json (testler görseli değil bu dosyayı okur).
// 3) Önizleme (--onizleme <dosya>): bütün soyların kadın ve erkek jetonları yan yana (Barbarian + iki sınıf).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { rgbToLab, deltaE } from '../src/ui/color';
import { tintPixels } from '../src/ui/tint';
import soy from '../data/soy-renkleri.json';
import type { TintSpec } from '../src/battle/types';
import { lineageTint, paletteKeys, paletteTint } from '../src/battle/avatar';

import { CHAR, OTO as OUT, ROOT } from './soy-maske-yollar';
import { applyHandMasks } from './soy-maske-el';
import { basOverlay, buildHeads } from './soy-bas';
import { applyHeadOverlay } from '../src/ui/headOverlay';
const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
type MaskCfg = { L: [number, number]; C: [number, number]; h: Array<[number, number]>; bright: number; th: number; zone?: number; fill?: { genders: string[]; hole: number; L: number; open?: number; minComp?: number; grow?: { L: number; C: number; steps: number } }; byGender?: Record<string, Partial<MaskCfg>> };
type Race = { mask: MaskCfg; lineages: Record<string, TintSpec['to'] | null>; select?: TintSpec['select'] };
const RACES = (soy as unknown as { races: Record<string, Race> }).races;
const FIX = (soy as unknown as { maskFix?: Record<string, { exclude?: number[][]; include?: number[][]; head?: boolean; seed?: number[] }> }).maskFix ?? {};
const hIn = (h: number, [a, b]: [number, number]) => (a <= b ? h >= a && h <= b : h >= a || h <= b);
const inBox = (x: number, y: number, b: number[]) => x >= b[0]! && y >= b[1]! && x <= b[2]! && y <= b[3]!;

export function skinMask(name: string, cfg: MaskCfg, data: Uint8Array, W: number, H: number): Uint8Array {
  const N = W * H;
  const lab: Array<[number, number, number]> = new Array(N);
  const cand = new Uint8Array(N);
  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (let i = 0; i < N; i++) {
    const l = rgbToLab(data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!);
    lab[i] = l;
    if (data[i * 4 + 3]! < 128) continue;
    const x = i % W, y = (i / W) | 0;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    const C = Math.hypot(l[1], l[2]), h = ((Math.atan2(l[2], l[1]) * 180) / Math.PI + 360) % 360;
    if (l[0] >= cfg.L[0] && l[0] <= cfg.L[1] && C >= cfg.C[0] && C <= cfg.C[1] && cfg.h.some((r) => hIn(h, r))) cand[i] = 1;
  }
  const comp = new Int32Array(N).fill(-1);
  const inZone: number[] = [];
  const zx0 = x0 + (x1 - x0) * 0.15, zx1 = x1 - (x1 - x0) * 0.15, zy1 = y0 + (y1 - y0) * (cfg.zone ?? 0.4);
  for (let i = 0; i < N; i++) {
    if (!cand[i] || comp[i]! >= 0) continue;
    const id = inZone.length; let z = 0; const st = [i]; comp[i] = id;
    while (st.length) {
      const j = st.pop()!;
      const x = j % W, y = (j / W) | 0;
      if (x >= zx0 && x <= zx1 && y <= zy1) z++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const k = yy * W + xx;
        if (cand[k] && comp[k]! < 0) { comp[k] = id; st.push(k); }
      }
    }
    inZone.push(z);
  }
  let seed = -1;
  for (let c = 0; c < inZone.length; c++) if (inZone[c]! > 0 && (seed < 0 || inZone[c]! > inZone[seed]!)) seed = c;
  const mask = new Uint8Array(N);
  const seedBox = FIX[name]?.seed;
  if (seed >= 0 || seedBox) {
    // Tohumun baş bölgesindeki pikselleri (ya da `seed` kutusundaki adaylar: yüz); k-means (k=5); en parlak kümeden
    // `bright` kadar koyuya kadarki kümeler palet.
    const pts: Array<[number, number, number]> = [];
    for (let i = 0; i < N; i++) {
      const x = i % W, y = (i / W) | 0;
      if (seedBox ? cand[i] && inBox(x, y, seedBox) : comp[i] === seed && x >= zx0 && x <= zx1 && y <= zy1) pts.push(lab[i]!);
    }
    const sorted = [...pts].sort((p, q) => p[0] - q[0]);
    const k = Math.min(5, pts.length);
    let cen: Array<[number, number, number]> = Array.from({ length: k }, (_, j) => [...sorted[Math.floor(((j + 0.5) / k) * sorted.length)]!] as [number, number, number]);
    const count = new Array(k).fill(0);
    for (let it = 0; it < 15; it++) {
      const sum = cen.map(() => [0, 0, 0, 0]);
      for (const p of pts) {
        let b = 0, bd = Infinity;
        cen.forEach((c, j) => { const d = deltaE(p, c); if (d < bd) { bd = d; b = j; } });
        const s = sum[b]!; s[0]! += p[0]; s[1]! += p[1]; s[2]! += p[2]; s[3]!++;
      }
      cen = sum.map((s, j) => (s[3] ? [s[0]! / s[3]!, s[1]! / s[3]!, s[2]! / s[3]!] : cen[j]!)) as Array<[number, number, number]>;
      sum.forEach((s, j) => { count[j] = s[3]; });
    }
    const big = cen.filter((_, j) => count[j] >= pts.length * 0.08);
    const top = Math.max(...big.map((c) => c[0]));
    const pal = big.filter((c) => c[0] >= top - cfg.bright);
    for (let i = 0; i < N; i++) if (cand[i] && Math.min(...pal.map((c) => deltaE(lab[i]!, c))) <= cfg.th) mask[i] = 1;
  }
  // Tek tük pikselleri at (8 komşudan en az 2'si maskede olmalı).
  const clean = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (!mask[i]) continue;
    const x = i % W, y = (i / W) | 0; let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && mask[(y + dy) * W + (x + dx)]) n++;
    if (n >= 2) clean[i] = 1;
  }
  if (cfg.fill?.genders.some((g) => name.includes(`-${g}-`))) fillHoles(clean, lab, data, cfg, W, H);
  const fix = FIX[name];
  // `head`: yalnızca baş bölgesi (bbox'ın üst %30'u; metal zırhla aynı renkte ten: Goliath).
  const headY = y0 + (y1 - y0) * 0.3;
  for (let i = 0; i < N; i++) {
    const x = i % W, y = (i / W) | 0;
    if (fix?.head && y > headY) clean[i] = 0;
    if (fix?.exclude?.some((b) => inBox(x, y, b))) clean[i] = 0;
    if (fix?.include?.some((b) => inBox(x, y, b)) && cand[i]) clean[i] = 1;
  }
  return clean;
}

/**
 * Görev K19: maskede delik bırakmama (Dragonborn kadın: pul dokusunun koyu pikselleri). Önce 3×3 morfolojik kapatma
 * (genişlet + aşındır), sonra delik doldurma: maskenin çevrelediği (görüntü kenarına maske dışından ulaşamayan)
 * en çok `hole` piksellik bileşenler, piksellerinin çoğu ten tonundaysa (ırkın ton aralığı, açıklık ≥ `L`) maskeye
 * girer. Göz ve ağız gibi büyük ya da ten tonunda olmayan boşluklar kalır. Kenar yumuşatma yok (pixel art).
 */
function fillHoles(m: Uint8Array, lab: Array<[number, number, number]>, data: Uint8Array, cfg: MaskCfg, W: number, H: number): void {
  const N = W * H;
  const skinish = (i: number) => {
    const l = lab[i]!; const h = ((Math.atan2(l[2], l[1]) * 180) / Math.PI + 360) % 360;
    return data[i * 4 + 3]! >= 128 && l[0] >= cfg.fill!.L && Math.hypot(l[1], l[2]) >= 4 && cfg.h.some((r) => hIn(h, r));
  };
  const nb = (i: number, f: (k: number) => void) => {
    const x = i % W, y = (i / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if ((dx || dy) && xx >= 0 && yy >= 0 && xx < W && yy < H) f(yy * W + xx);
    }
  };
  // Kapatma: yalnızca ten tonundaki pikseller eklenebilir.
  const dil = new Uint8Array(m);
  for (let i = 0; i < N; i++) if (!m[i] && skinish(i)) { let hit = false; nb(i, (k) => { if (m[k]) hit = true; }); if (hit) dil[i] = 1; }
  for (let i = 0; i < N; i++) if (dil[i] && !m[i]) { let all = true; nb(i, (k) => { if (!dil[k]) all = false; }); if (all) m[i] = 1; }
  // Büyütme: maskeye bitişik, ten tonunda ve yeterince açık/doygun pikseller (pulun koyu şeritleri) birkaç adımda eklenir.
  const g = cfg.fill!.grow;
  for (let step = 0; g && step < g.steps; step++) {
    const add: number[] = [];
    for (let i = 0; i < N; i++) {
      if (m[i] || !skinish(i) || lab[i]![0] < g.L || Math.hypot(lab[i]![1], lab[i]![2]) < g.C) continue;
      let hit = false; nb(i, (k) => { if (m[k]) hit = true; }); if (hit) add.push(i);
    }
    if (!add.length) break;
    for (const i of add) m[i] = 1;
  }
  // Açma (aşındır + genişlet): ten bölgesine ince bağlarla tutunan saç tutamları kopar; yalnızca açılmış maskenin bir
  // piksel komşuluğundaki maske pikselleri kalır (kenarlar geri gelir).
  const r = cfg.fill!.open ?? 1;
  let op = new Uint8Array(m);
  for (let t = 0; t < r; t++) { const e = new Uint8Array(N); for (let i = 0; i < N; i++) if (op[i]) { let all = true; nb(i, (k) => { if (!op[k]) all = false; }); if (all) e[i] = 1; } op = e; }
  for (let t = 0; t <= r; t++) { const d = new Uint8Array(op); for (let i = 0; i < N; i++) if (op[i]) nb(i, (k) => { d[k] = 1; }); op = d; }
  for (let i = 0; i < N; i++) if (m[i] && !op[i]) m[i] = 0;
  // Açmadan sonra kopan küçük parçalar (saç tutamları) atılır.
  const minc = cfg.fill!.minComp ?? 0;
  const lab2 = new Int32Array(N).fill(-1);
  for (let i = 0; minc && i < N; i++) {
    if (!m[i] || lab2[i]! >= 0) continue;
    const comp = [i]; lab2[i] = i;
    for (let q = 0; q < comp.length; q++) nb(comp[q]!, (k) => { if (m[k] && lab2[k]! < 0) { lab2[k] = i; comp.push(k); } });
    if (comp.length < minc) for (const j of comp) m[j] = 0;
  }
  // Delik doldurma (4 komşuluk: köşeden sızan delikler de delik sayılır).
  const seen = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (m[i] || seen[i]) continue;
    const comp: number[] = []; let edge = false; const st = [i]; seen[i] = 1;
    while (st.length) {
      const j = st.pop()!; comp.push(j);
      const x = j % W, y = (j / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) edge = true;
      for (const k of [j - 1, j + 1, j - W, j + W]) {
        if (k < 0 || k >= N || (Math.abs((k % W) - x) > 1)) continue;
        if (!m[k] && !seen[k]) { seen[k] = 1; st.push(k); }
      }
    }
    if (edge || comp.length > cfg.fill!.hole) continue;
    const sk = comp.filter(skinish);
    if (sk.length >= comp.length * 0.6) for (const j of sk) m[j] = 1;
  }
}

async function raw(file: string) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), W: info.width, H: info.height };
}

const meanLab = (data: Uint8Array, mask: Uint8Array, weights?: Uint8Array): [number, number, number] => {
  let L = 0, a = 0, b = 0, n = 0;
  for (let i = 0; i < mask.length; i++) {
    const w = weights ? weights[i]! / 255 : mask[i] ? 1 : 0;
    if (!w) continue;
    const l = rgbToLab(data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!); L += l[0] * w; a += l[1] * w; b += l[2] * w; n += w;
  }
  return n ? [L / n, a / n, b / n] : [0, 0, 0];
};

const args = process.argv.slice(2);
const only = args.find((x, i) => !x.startsWith('--') && !['--onizleme', '--maskeler'].includes(args[i - 1] ?? ''));
const preview = args.includes('--onizleme') ? args[args.indexOf('--onizleme') + 1] : null;
const sheets = args.includes('--maskeler');
fs.mkdirSync(OUT, { recursive: true });
// Görev K21: elle maskeler (assets/soy-maske-el/; yalnızca okunur) önce; ölçüm ve önizleme onları kullanır.
const hand = await applyHandMasks(Object.keys(RACES).flatMap((r) => ['female', 'male'].flatMap((g) => CLASSES.map((c) => `${r}-${g}-${c}`))));
// Görev K22: kafa kaplaması (kapsam veride); ölçüm kaplanmış kafayla yapılır.
await buildHeads();
const report: Record<string, unknown> = {};
/** DROW-PALET: paletli soyların her paletinin ölçümü: `ırk/soy` → palet → jeton → Lab. */
const paletRows: Record<string, Record<string, Record<string, number[]>>> = {};
for (const [race, r] of Object.entries(RACES)) {
  if (only && only !== race) continue;
  const rows: Record<string, Record<string, number[]>> = {};
  const tiles: Array<{ input: Buffer; left: number; top: number }> = [];
  let n = 0;
  for (const g of ['female', 'male']) for (const cls of CLASSES) {
    const name = `${race}-${g}-${cls}`;
    const { data, W, H } = await raw(path.join(CHAR, `${name}.webp`));
    const mask = skinMask(name, { ...r.mask, ...r.mask.byGender?.[g] }, data, W, H);
    const m = Buffer.alloc(W * H);
    for (let i = 0; i < W * H; i++) m[i] = mask[i] ? 255 : 0;
    await sharp(m, { raw: { width: W, height: H, channels: 1 } }).png({ palette: true, colours: 2, compressionLevel: 9 }).toFile(path.join(OUT, `${name}.png`));
    // Ölçüm: her soyun boyaması sonrası ten ortalaması.
    rows[name] = {};
    // DROW-PALET: paletli soyda her palet ayrıca ölçülür (`paletler`; ΔE testi dördü için).
    const runs: Array<[string, string, ReturnType<typeof lineageTint>]> = [
      ...Object.keys(r.lineages).map((lin) => [lin, lin, lineageTint(race, lin, g as 'male' | 'female')] as [string, string, ReturnType<typeof lineageTint>]),
      ...Object.keys(r.lineages).flatMap((lin) => paletteKeys(race, lin).map((k) => [`${lin}@${k}`, lin, paletteTint(race, lin, k)] as [string, string, ReturnType<typeof lineageTint>])),
    ];
    for (const [key, , tint] of runs) {
      const lin = key;
      const px = new Uint8ClampedArray(data);
      const hw = hand.weights.get(name);
      // Görev K22: kafa kaplaması varsa boyamadan önce uygulanır, maske kafa kutusunda kaplamanın opak pikselleri olur.
      const bas = await basOverlay(name);
      let m2 = mask;
      let hw2: Uint8Array | undefined = hw && !bas ? hw : undefined;
      if (bas) {
        // Görev K23: gövde boyası kapalıysa maske yalnızca kafa: ΔE yalnızca kafada ölçülür.
        const r = applyHeadOverlay(px, hw ? Uint8Array.from(hw, (w) => (w > 0 ? 1 : 0)) : mask, bas.ov, bas.box, W, { body: bas.body });
        m2 = r.mask;
        if (r.weights) hw2 = r.weights;
      }
      if (tint) tintPixels(px, tint, hw2 ? undefined : m2, hw2);
      const lab = meanLab(new Uint8Array(px.buffer), m2, hw && !bas ? hw : undefined).map((v) => Math.round(v * 10) / 10);
      if (key.includes('@')) { const [l, k] = key.split('@') as [string, string]; ((paletRows[`${race}/${l}`] ??= {})[k] ??= {})[name] = lab; }
      else rows[name]![lin] = lab;
    }
    if (sheets) {
      const ov = Buffer.from(data);
      for (let i = 0; i < W * H; i++) if (mask[i]) { ov[i * 4] = 255; ov[i * 4 + 1] = 0; ov[i * 4 + 2] = 255; }
      const a = await sharp(Buffer.from(data), { raw: { width: W, height: H, channels: 4 } }).resize(128).png().toBuffer();
      const b = await sharp(ov, { raw: { width: W, height: H, channels: 4 } }).resize(128).png().toBuffer();
      tiles.push({ input: a, left: (n % 6) * 260, top: Math.floor(n / 6) * 130 }, { input: b, left: (n % 6) * 260 + 130, top: Math.floor(n / 6) * 130 });
    }
    n++;
  }
  if (sheets) await sharp({ create: { width: 1560, height: 520, channels: 4, background: { r: 40, g: 40, b: 50, alpha: 1 } } }).composite(tiles).png().toFile(`${args[args.indexOf('--maskeler') + 1]}/maske-${race}.png`);
  report[race] = rows;
  console.log(race, 'tamam');
}
if (!only) fs.writeFileSync(path.join(ROOT, 'data/soy-olcum.json'), JSON.stringify({ note: 'Görev K15: npm run soy-maske üretir. Her ırk/cinsiyet/sınıf jetonunda, her soyun boyamasından sonra ten maskesinin ortalama Lab rengi (L, a, b). Test (src/ui/tint.test.ts) soy çiftleri arası ΔE eşiğini bu dosyadan denetler. DROW-PALET: paletler: paletli soyların (elf/drow) her paletinin aynı ölçümü; races içindeki değer seçili palettir.', races: report, paletler: paletRows }, null, 1) + '\n');
if (preview) await import('./soy-onizleme').then((m) => m.default(preview));
