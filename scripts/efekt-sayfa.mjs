// Görev E1: siyah zeminli efekt sayfalarını kareye böler ve yatay şerit olarak yazar (sprite-ice `--efekt` kipi).
// Kesim tablosu data/efekt-kesim.json; çıktı public/sprites/efekt-<ad>.webp + data/sprite-esleme.json `efektler`.
// Saf yardımcılar (`cuts`, `gutterRuns`, `lumAlpha`) testten çağrılır.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { animate } from './efekt-canlandir.mjs';

const BLACK = 12;
/** Parlaklıktan alfa (0..1): (max(R,G,B) − siyah) / (255 − siyah); `siyah` varsayılan 12 (Kuyruk E2: sayfa başına `siyah`, gri yamalı zemin). */
export const lumAlpha = (r, g, b, black = BLACK) => Math.min(1, Math.max(0, (Math.max(r, g, b) - black) / (255 - black)));

/** 'karanlik' kesim: n parçaya, beklenen sınırın ±%22 penceresinde profilin (3 px kayan toplam) en düşük yeri. */
export function cuts(profile, n, from = 0, to = profile.length) {
  const len = to - from;
  const step = len / n;
  const out = [from];
  for (let k = 1; k < n; k++) {
    const nominal = from + k * step;
    const win = Math.round(step * 0.22);
    let best = Math.round(nominal); let bestV = Infinity;
    for (let x = Math.round(nominal) - win; x <= Math.round(nominal) + win; x++) {
      if (x < from + 1 || x > to - 2) continue;
      const v = profile[x - 1] + profile[x] + profile[x + 1] + Math.abs(x - nominal) * 0.01;
      if (v < bestV) { bestV = v; best = x; }
    }
    out.push(best);
  }
  out.push(to);
  return out.slice(0, -1).map((a, i) => [a, out[i + 1]]);
}

/** 'oluk' kesim: boydan boya en düşük parlaklığı `thr`'nin üstünde olan çizgiler oluk; aralardaki (≥ 20 px) koşular hücre. */
export function gutterRuns(minProfile, thr = 15, flat = null) {
  const out = [];
  let start = -1;
  // Oluk gri çizgidir: en düşük parlaklık eşiğin üstünde ve çizginin çoğu tek ton (`flat`: ortancaya ±15 içindeki pay ≥ %60;
  // içerik bandı değil; duvar bandını kesen ızgara çizgisi de oluk sayılır).
  // Oluk incedir (≤ 16 px; dış çerçeve kenarda olduğundan sınırsız): daha kalın tek tonlu koşu içerik bandıdır (duvar).
  const n = minProfile.length;
  const g = Array.from({ length: n }, (_, i) => minProfile[i] > thr && (!flat || flat[i] >= 0.6));
  for (let i = 0; i < n;) {
    if (!g[i]) { i++; continue; }
    let j = i; while (j < n && g[j]) j++;
    if (j - i > 16 && i > 0 && j < n) for (let k = i; k < j; k++) g[k] = false;
    i = j;
  }
  for (let i = 0; i <= n; i++) {
    const cell = i < n && !g[i];
    if (cell && start < 0) start = i;
    if (!cell && start >= 0) { if (i - start >= 20) out.push([start, i]); start = -1; }
  }
  return out;
}

/** Çizgi histogramlarından (256 kutu) ortancaya ±15 içindeki pay. */
function flatness(hists, n) {
  return hists.map((hist) => {
    let acc = 0; let med = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc * 2 >= n) { med = v; break; } }
    let near = 0;
    for (let v = Math.max(0, med - 15); v <= Math.min(255, med + 15); v++) near += hist[v];
    // Parlak tek tonlu içerik (duvar bandı) oluk değil: oluk koyu gridir (ortanca ≤ 110).
    return med <= 110 ? near / n : 0;
  });
}

async function rawOf(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const lum = new Float32Array(w * h);
  for (let k = 0; k < w * h; k++) lum[k] = Math.max(data[k * 3], data[k * 3 + 1], data[k * 3 + 2]);
  return { data, w, h, lum };
}

/** Hücre ızgarası: satır bantları ve her bantta sütun aralıkları. */
function grid(img, spec) {
  const { w, h, lum } = img;
  // Kuyruk E2: satır başına sütun sayısı (`sutunlar`; donusum-kanat: kanat satırlarında bir kare iki hücre).
  const colsOf = (i) => spec.sutunlar?.[i] ?? spec.sutun;
  if (spec.kesim === 'esit') {
    // Düzenli ızgara: eşit bölme, her hücre çizgi kalınlığı kadar (`kenar`) içeriden.
    const k = spec.kenar ?? 0;
    const part = (len, n) => Array.from({ length: n }, (_, i) => [Math.round(i * len / n) + k, Math.round((i + 1) * len / n) - k]);
    return part(h, spec.satir).map((y, i) => ({ y, cols: part(w, colsOf(i)) }));
  }
  if (spec.kesim === 'oluk') {
    const colMin = new Float32Array(w).fill(255); const rowMin = new Float32Array(h).fill(255);
    const colH = Array.from({ length: w }, () => new Uint32Array(256)); const rowH = Array.from({ length: h }, () => new Uint32Array(256));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = lum[y * w + x];
      if (v < colMin[x]) colMin[x] = v; if (v < rowMin[y]) rowMin[y] = v; colH[x][v]++; rowH[y][v]++;
    }
    // Oluk kenarındaki yumuşatılmış gri pikseller kalmasın: hücreler `kenar` px içeriden.
    const k = spec.kenar ?? 0;
    const inset = (runs) => runs.map(([a, b]) => [a + k, b - k]);
    const rows = inset(gutterRuns(rowMin, 15, flatness(rowH, w))); const cols = inset(gutterRuns(colMin, 15, flatness(colH, h)));
    return rows.map((r) => ({ y: r, cols }));
  }
  const rowMax = new Float32Array(h);
  for (let y = 0; y < h; y++) { let m = 0; for (let x = 0; x < w; x++) m = Math.max(m, lum[y * w + x]); rowMax[y] = m; }
  return cuts(rowMax, spec.satir, 0, h).map(([y0, y1], i) => {
    const colMax = new Float32Array(w);
    for (let x = 0; x < w; x++) { let m = 0; for (let y = y0; y < y1; y++) m = Math.max(m, lum[y * w + x]); colMax[x] = m; }
    return { y: [y0, y1], cols: cuts(colMax, colsOf(i), 0, w) };
  });
}

/** Hücreyi RGBA'ya (parlaklık alfası, renk alfaya bölünmüş) çevirir. */
/**
 * Kuyruk SU2: şeffaf çatlak (opak zemin dokusundan yalnız çatlak çizgilerini çıkarır; kum tabanı alfa 0).
 * Koyu çatlak içi (`dBase − max(R,G,B)` smoothstep dLo..dHi) ve turuncu kenar (doygunluk sLo..sHi × R−B gLo..gHi, `glowA` ile) alfa üretir;
 * toplam alfa `tepe` ile sınırlanır; renk koyu kahverengi-kızıl (`darkC`) ile yumuşak pas (`glowC`) arasında. Veri `data/efekt-kesim.json` `catlak`.
 */
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
export function crackPixel(r, g, b, p) {
  const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const sat = mx > 0 ? (mx - mn) / mx : 0;
  const dark = smooth(p.dLo, p.dHi, p.dBase - mx);
  const glow = smooth(p.sLo, p.sHi, sat) * smooth(p.gLo, p.gHi, r - b) * p.glowA;
  const a = Math.max(dark, glow) * p.tepe;
  const w = dark + glow > 1e-6 ? glow / (dark + glow) : 0;
  return { a, c: [0, 1, 2].map((i) => Math.round(p.darkC[i] * (1 - w) + p.glowC[i] * w)) };
}

function cellRgba(img, x0, y0, x1, y1, black = BLACK, opaque = false, gain = 1, edge = 0, crack = null) {
  const cw = x1 - x0; const ch = y1 - y0;
  const out = Buffer.alloc(cw * ch * 4);
  let peak = 0;
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const s = ((y0 + y) * img.w + (x0 + x)) * 3; const d = (y * cw + x) * 4;
    const [r, g, b] = [img.data[s], img.data[s + 1], img.data[s + 2]];
    // Kuyruk E4b: opak hücre (su dokusu: siyah zeminli değil, dolu resim): alfa 1, renk olduğu gibi (normal karışım).
    if (crack) { const { a, c } = crackPixel(r, g, b, crack); out[d] = c[0]; out[d + 1] = c[1]; out[d + 2] = c[2]; out[d + 3] = Math.round(a * 255); if (a > peak) peak = a; continue; }
    if (opaque) { out[d] = r; out[d + 1] = g; out[d + 2] = b; out[d + 3] = 255; peak = 1; continue; }
    const a0 = lumAlpha(r, g, b, black);
    // Kuyruk E4c: `kazanc` (loş kareye parlaklık: alfa kazançla çarpılır, renk özgün alfaya bölünür → toplamalı karışımda r·kazanç) ve
    // `yumusat` (hücre kenarından `edge` px içeride alfa 0'dan 1'e smoothstep: kenara değen ışın/sütun dikişsiz biter).
    let a = Math.min(1, a0 * gain);
    if (edge > 0) {
      const dEdge = Math.min(x + 1, y + 1, cw - x, ch - y);
      if (dEdge < edge) { const u = dEdge / edge; a *= u * u * (3 - 2 * u); }
    }
    if (a > peak) peak = a;
    out[d] = a0 > 0 ? Math.min(255, Math.round(r / a0)) : 0;
    out[d + 1] = a0 > 0 ? Math.min(255, Math.round(g / a0)) : 0;
    out[d + 2] = a0 > 0 ? Math.min(255, Math.round(b / a0)) : 0;
    out[d + 3] = Math.round(a * 255);
  }
  return { buf: out, w: cw, h: ch, peak };
}

/** Bir sayfayı keser: { ad → { frames: Buffer[], fw, fh } } + ızgara raporu. */
export async function sliceSheet(file, spec, emptyThr = 0.04) {
  const img = await rawOf(file);
  const g = grid(img, spec);
  const report = { file: path.basename(file), size: `${img.w}×${img.h}`, rows: g.length, cols: g.map((r) => r.cols.length) };
  if (g.length !== spec.satir || g.some((r, i) => r.cols.length !== (spec.sutunlar?.[i] ?? spec.sutun))) {
    throw new Error(`${report.file}: ızgara ${g.length} satır × [${report.cols.join(',')}] sütun; beklenen ${spec.satir}×${spec.sutunlar ? `[${spec.sutunlar.join(',')}]` : spec.sutun}`);
  }
  // Kuyruk E5: `hucre: 'efekt'` (her hücre ayrı bir efektin tek karesi, satır sırasıyla `adlar`; boş hücreler atılır): kare sınır kutusu
  // ortalanır, kenar `yumusat` px yumuşar, `canlandirma[ad]` ile 4–6 karelik prosedürel şeride çevrilir (`scripts/efekt-canlandir.mjs`).
  if (spec.hucre === 'efekt') {
    const flat = g.flatMap((r) => r.cols.map((c) => ({ x: c, y: r.y })));
    if (spec.adlar.length > flat.length) throw new Error(`${report.file}: ${spec.adlar.length} ad > ${flat.length} hücre`);
    const result = {};
    for (let n = 0; n < spec.adlar.length; n++) {
      const ad = spec.adlar[n]; const f = flat[n];
      const c = cellRgba(img, f.x[0], f.y[0], f.x[1], f.y[1], spec.siyah ?? BLACK, false, spec.kazanc?.[ad]?.['1'] ?? 1, spec.yumusat?.[ad] ?? spec.yumusat?.['*'] ?? 0);
      if (c.peak < emptyThr) throw new Error(`${report.file}: ${n + 1}. hücre (${ad}) boş`);
      const S = spec.boyutlar?.[ad] ?? spec.boyut;
      const frames = await animate(c, spec.canlandirma[ad], S, spec.kenarPayi ?? 1.45);
      result[ad] = { frames, fw: S, fh: S, dropped: 0, grid: frames.length };
    }
    return { result, report };
  }
  const per = spec.blokSatir ?? 1;
  if (spec.adlar.length * per !== spec.satir) throw new Error(`${report.file}: ${spec.adlar.length} ad × ${per} satır ≠ ${spec.satir}`);
  const result = {};
  for (let n = 0; n < spec.adlar.length; n++) {
    const ad = spec.adlar[n];
    let ci = 0;
    const cells = g.slice(n * per, n * per + per).flatMap((r) => r.cols.map((c) => {
      ci++;
      let [x0, x1] = c; let [y0, y1] = r.y;
      // Kuyruk E4c: `ortaKare` (opak zemin dokusu: hücrenin ortasından kısa kenar boyunda kare).
      if (spec.ortaKare?.includes(ad)) {
        const side = Math.min(x1 - x0, y1 - y0);
        x0 += Math.floor((x1 - x0 - side) / 2); y0 += Math.floor((y1 - y0 - side) / 2); x1 = x0 + side; y1 = y0 + side;
      }
      return cellRgba(img, x0, y0, x1, y1, spec.siyah ?? BLACK, !!spec.opak?.includes(ad) && !spec.catlak?.[ad], spec.kazanc?.[ad]?.[String(ci)] ?? 1, spec.yumusat?.[ad] ?? 0, spec.catlak?.[ad] ?? null);
    }));
    // Sondaki boş kareler (ızgarada var, içerik yok) atılır.
    let count = cells.length;
    while (count > 1 && cells[count - 1].peak < emptyThr) count--;
    // Kuyruk A2: tabloda kare sınırı (ham sayfa değişmeden; alan-yildirim'in son iki karesi ateş közü).
    const cap = spec.kareSiniri?.[spec.adlar[n]];
    if (cap && cap < count) count = cap;
    // Kuyruk E4: tabloda başlangıç karesi (`kareBasla`: satırın ilk N karesi atılır; ör. ışının yalnız çıkış kıvılcımı olan ilk karesi döngüde titreme yapar).
    const skip = Math.min(spec.kareBasla?.[spec.adlar[n]] ?? 0, count - 1);
    // Kuyruk E4c: `sira` (1 tabanlı hücre sırası: kare atma ve ileri-geri döngü; ör. [1,2,3,2] → 4 kare ping-pong).
    const sira = spec.sira?.[ad];
    const used = sira ? sira.map((i) => cells[i - 1]) : cells.slice(skip, count);
    if (sira) count = cells.length;
    let fw; let fh; let frames;
    if (spec.kare === 'serit') {
      // En-boy korunur; bütün karelerin içerik bandına (dikey) kırpılır, aynı pencere (titreme yok).
      let top = Infinity; let bot = -1;
      for (const c of used) for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) if (c.buf[(y * c.w + x) * 4 + 3] > 8) { top = Math.min(top, y); bot = Math.max(bot, y); }
      top = Math.max(0, top - 4); bot = Math.min(Math.min(...used.map((c) => c.h)) - 1, bot + 4);
      const cw = Math.min(...used.map((c) => c.w));
      const bs = spec.boyutlar?.[ad] ?? spec.boyut;
      fw = bs; fh = Math.max(8, Math.round(bs * (bot - top + 1) / cw));
      frames = await Promise.all(used.map((c) => sharp(c.buf, { raw: { width: c.w, height: c.h, channels: 4 } })
        .extract({ left: Math.floor((c.w - cw) / 2), top, width: cw, height: bot - top + 1 }).resize(fw, fh, { fit: 'fill' }).raw().toBuffer()));
    } else {
      // Kare: hücreler en büyük kenarlı kare tuvale, hücre ortası tuval ortasına; sonra hedef boya.
      const S = Math.max(...used.map((c) => Math.max(c.w, c.h)));
      fw = fh = spec.boyutlar?.[ad] ?? spec.boyut;
      frames = await Promise.all(used.map(async (c) => {
        const canvas = Buffer.alloc(S * S * 4);
        let ox = Math.floor((S - c.w) / 2); let oy = Math.floor((S - c.h) / 2);
        // Kuyruk E4c: `ortala` (kare kendi içerik sınır kutusunun merkezine göre tuval ortasına; hücrede kaymış kareler hizalanır).
        if (spec.ortala?.includes(ad)) {
          let x0 = c.w; let x1 = -1; let y0 = c.h; let y1 = -1;
          for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) if (c.buf[(y * c.w + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
          if (x1 >= 0) { ox = Math.round(S / 2 - (x0 + x1 + 1) / 2); oy = Math.round(S / 2 - (y0 + y1 + 1) / 2); }
        }
        for (let y = 0; y < c.h; y++) {
          const ty = oy + y; if (ty < 0 || ty >= S) continue;
          const sx0 = Math.max(0, -ox); const sx1 = Math.min(c.w, S - ox);
          if (sx1 > sx0) c.buf.copy(canvas, (ty * S + ox + sx0) * 4, (y * c.w + sx0) * 4, (y * c.w + sx1) * 4);
        }
        return sharp(canvas, { raw: { width: S, height: S, channels: 4 } }).resize(fw, fh, { kernel: 'lanczos3' }).raw().toBuffer();
      }));
    }
    result[spec.adlar[n]] = { frames, fw, fh, dropped: cells.length - count, grid: cells.length };
  }
  return { result, report };
}

/** Kareleri yatay şeride birleştirip webp yazar. */
export async function writeStrip(outFile, { frames, fw, fh }) {
  const strip = Buffer.alloc(fw * frames.length * fh * 4);
  frames.forEach((f, i) => { for (let y = 0; y < fh; y++) f.copy(strip, (y * fw * frames.length + i * fw) * 4, y * fw * 4, (y + 1) * fw * 4); });
  await sharp(strip, { raw: { width: fw * frames.length, height: fh, channels: 4 } }).webp({ quality: 86, alphaQuality: 90, effort: 5 }).toFile(outFile);
}

/** Macenta zeminli ikon sayfası: eşit ızgara, her hücre sprite-ice anahtarıyla temizlenip 128 px kareye ortalanır. */
export async function sliceIcons(file, spec, outDir, processSprite) {
  const meta = await sharp(file).metadata();
  const cw = meta.width / spec.sutun; const ch = meta.height / spec.satir;
  const out = [];
  for (let i = 0; i < spec.adlar.length; i++) {
    const r = Math.floor(i / spec.sutun); const c = i % spec.sutun;
    const left = Math.round(c * cw); const top = Math.round(r * ch);
    const cell = await sharp(file).extract({ left, top, width: Math.round((c + 1) * cw) - left, height: Math.round((r + 1) * ch) - top }).png().toBuffer();
    const p = await processSprite(cell, { size: spec.boyut - 8, tol: spec.tolerans ?? 70 });
    const name = `efekt-${spec.onek ?? 'ikon'}-${spec.adlar[i]}`;
    await sharp({ create: { width: spec.boyut, height: spec.boyut, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: p.buffer, gravity: 'centre' }]).webp({ lossless: true }).toFile(path.join(outDir, `${name}.webp`));
    out.push({ id: spec.adlar[i], name, w: p.width, h: p.height, warnings: p.warnings });
  }
  return out;
}

/** Kuyruk E2: kesim sonrası kontrol görseli (iletişim kâğıdı): her şerit bir satır, koyu gri zeminde, karelerin arası çizgili. */
export async function contactSheet(file, strips, { bg = { r: 40, g: 40, b: 46 }, h = 96 } = {}) {
  const rows = [];
  for (const s of strips) {
    const fw = Math.round(h * s.fw / s.fh);
    const frames = await Promise.all(s.frames.map((f) => sharp(f, { raw: { width: s.fw, height: s.fh, channels: 4 } }).resize(fw, h).png().toBuffer()));
    rows.push({ fw, frames });
  }
  const W = Math.max(...rows.map((r) => (r.fw + 4) * r.frames.length)) + 4; const H = rows.length * (h + 4) + 4;
  const comp = [];
  rows.forEach((r, i) => r.frames.forEach((f, k) => comp.push({ input: f, left: 4 + k * (r.fw + 4), top: 4 + i * (h + 4) })));
  await sharp({ create: { width: W, height: H, channels: 4, background: { ...bg, alpha: 1 } } }).composite(comp).png().toFile(file);
}

/** `--efekt` kipi: kesim tablosundaki her sayfa (ad eşleşmesi uzantıdan bağımsız). */
/** `processSprite`: sprite-ice'ın macenta anahtarlı temizleyicisi (döngüsel içe aktarma olmasın diye parametre). */
/**
 * Kuyruk E2: `klasor` alanlı sayfa (E2 sayfaları) `public/<klasor>/`'e yazılır ve kaydı `data/efekt-e2.json`'a gider
 * (`efektler` + ikon sayfalarında `simgeler[onek]`; yalnızca tembel efekt parçası okur, ana paket büyümez). `kontrol`: verilirse
 * her sayfanın kontrol görseli `<kontrol>/<sayfa>.png`.
 */
export async function importEffects({ src = 'assets-ham/efekt', out = 'public/sprites', table = 'data/efekt-kesim.json', esleme = 'data/sprite-esleme.json',
  e2File = 'data/efekt-e2.json', publicDir = 'public', kontrol = null, processSprite } = {}) {
  const T = JSON.parse(fs.readFileSync(table, 'utf8'));
  if (!fs.existsSync(src)) { console.log(`${src} yok; işlenecek efekt sayfası yok.`); return null; }
  const files = fs.readdirSync(src).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  const byName = new Map(files.map((f) => [f.replace(/\.(png|jpe?g|webp)$/i, '').toLowerCase(), f]));
  fs.mkdirSync(out, { recursive: true });
  if (kontrol) fs.mkdirSync(kontrol, { recursive: true });
  const records = {}; const icons = {}; const missing = []; const notes = [];
  const e2 = { efektler: {}, simgeler: {} };
  for (const [sheet, spec] of Object.entries(T.sayfalar)) {
    const f = byName.get(sheet);
    if (!f) { missing.push(sheet); continue; }
    byName.delete(sheet);
    const file = path.join(src, f);
    const dir = spec.klasor ? path.join(publicDir, spec.klasor) : out;
    fs.mkdirSync(dir, { recursive: true });
    if (spec.ikon) {
      const list = await sliceIcons(file, spec, dir, processSprite);
      for (const ic of list) {
        if (spec.klasor) (e2.simgeler[spec.onek] ??= {})[ic.id] = `${spec.klasor}/${ic.name}`;
        else icons[ic.id] = ic.name;
        console.log(`${f} → ${ic.name}.webp (${ic.w}×${ic.h} içerik)${ic.warnings.length ? ` ⚠ ${ic.warnings.join('; ')}` : ''}`);
      }
      if (kontrol) {
        const imgs = await Promise.all(list.map((ic) => sharp(path.join(dir, `${ic.name}.webp`)).raw().toBuffer()));
        await contactSheet(path.join(kontrol, `${sheet}.png`), Array.from({ length: Math.ceil(imgs.length / spec.sutun) }, (_, r) =>
          ({ frames: imgs.slice(r * spec.sutun, (r + 1) * spec.sutun), fw: spec.boyut, fh: spec.boyut })), { bg: { r: 70, g: 70, b: 78 } });
      }
      continue;
    }
    const { result, report } = await sliceSheet(file, spec, T.bosEsik);
    console.log(`${f} ${report.size}: ${report.rows} satır × ${spec.sutunlar ? `[${report.cols.join(',')}]` : report.cols[0]} sütun`);
    if (kontrol) await contactSheet(path.join(kontrol, `${sheet}.png`), Object.values(result));
    for (const [ad, r] of Object.entries(result)) {
      const name = `efekt-${ad}`;
      await writeStrip(path.join(dir, `${name}.webp`), r);
      if (r.dropped) notes.push(`${name}: ızgarada ${r.grid} kare, sondaki ${r.dropped} kare atıldı (boş ya da kare sınırı) → ${r.frames.length}`);
      const rec = {
        kare: r.frames.length, sure: r.frames.length * (spec.kareMsler?.[ad] ?? spec.kareMs), tur: spec.turler?.[ad] ?? spec.tur, karisim: spec.opak?.includes(ad) || spec.normal?.includes(ad) ? 'normal' : 'screen', yon: spec.yonler?.[ad] ?? null,
        en: r.fw, boy: r.fh, dongu: spec.donguler?.[ad] ?? !!spec.dongu, kaynak: `${sheet}`, ...(spec.ortusme ? { ortusme: spec.ortusme } : {}),
        // Kuyruk E4: içe aktarılan ama hiçbir büyüye bağlanmayan şerit (kullanıcı kararı; kayıtta işaretli).
        ...(spec.kullanilmiyor?.includes(ad) ? { kullanilmiyor: true } : {}),
        // Kuyruk E4c: hareket azaltmada gösterilecek kare (0 tabanlı; yoksa ortadaki).
        ...(spec.sabit?.[ad] !== undefined ? { sabit: spec.sabit[ad] } : {}),
      };
      if (spec.klasor) e2.efektler[name] = { ...rec, yol: `${spec.klasor}/${name}` };
      else records[name] = rec;
      console.log(`  ${name}.webp ${r.frames.length} kare ${r.fw}×${r.fh}${r.dropped ? ` (sondaki ${r.dropped} kare atıldı: boş ya da kare sınırı)` : ''}`);
    }
  }
  // Elle biçimlenmiş dosya korunur: üretilen bölümler en sonda (varsa önce kesilir), kayıtlar tek satır.
  const text = fs.readFileSync(esleme, 'utf8');
  const cut = text.indexOf(',\n  "efektNotu"');
  const head = (cut >= 0 ? text.slice(0, cut) : text.slice(0, text.lastIndexOf('}'))).replace(/\s+$/, '');
  const one = (v) => JSON.stringify(v).replace(/^\{/, '{ ').replace(/\}$/, ' }').replace(/":/g, '": ').replace(/,"/g, ', "');
  const block = (o, ind = '  ') => `{\n${Object.entries(o).map(([k, v]) => `${ind}  ${JSON.stringify(k)}: ${typeof v === 'object' ? one(v) : JSON.stringify(v)}`).join(',\n')}\n${ind}}`;
  const E = {};
  E.efektNotu = 'Görev E1 (npm run sprite-ice -- --efekt üretir; elle düzenlenmez): efekt-<ad> → kare sayısı, toplam süre (ms), tür, karışım (screen: siyah zeminli sayfa, parlaklıktan alfa), yön (şeridin baktığı yön; null yönsüz), kare boyu (en×boy px), döngü, kaynak sayfa; ışında ortusme parçaların üst üste binme oranı. efektIkonlari: durum (SRD adı küçük harf) → ikon sprite adı (128 px, macenta anahtarla).';
  E.efektler = Object.fromEntries(Object.entries(records).sort(([a], [b]) => a.localeCompare(b)));
  E.efektIkonlari = icons;
  fs.writeFileSync(esleme, `${head},\n  "efektNotu": ${JSON.stringify(E.efektNotu)},\n  "efektler": ${block(E.efektler)},\n  "efektIkonlari": ${block(E.efektIkonlari)}\n}\n`);
  JSON.parse(fs.readFileSync(esleme, 'utf8'));
  // Kuyruk E2 kayıtları: ayrı dosya (tembel efekt parçası).
  const e2Sorted = Object.fromEntries(Object.entries(e2.efektler).sort(([a], [b]) => a.localeCompare(b)));
  const simg = Object.entries(e2.simgeler).map(([k, v]) => `    ${JSON.stringify(k)}: ${one(v)}`).join(',\n');
  fs.writeFileSync(e2File, `{\n  "not": "Kuyruk E2 (npm run sprite-ice -- --efekt üretir; elle düzenlenmez): data/efekt-kesim.json'da klasor alanlı sayfaların kayıtları. efektler: sprite-esleme efektler ile aynı biçim + yol (public/ altındaki yol, uzantısız). simgeler: ikon sayfası öneki → ad → yol (128 px, macenta anahtarla). Yalnızca tembel efekt parçası (src/ui/fx/) okur.",\n  "efektler": ${block(e2Sorted)},\n  "simgeler": {\n${simg}\n  }\n}\n`);
  JSON.parse(fs.readFileSync(e2File, 'utf8'));
  for (const m of T.mevcut ?? []) byName.delete(m);
  const unmatched = [...byName.values()];
  return { records, icons, missing, unmatched, notes, e2 };
}
