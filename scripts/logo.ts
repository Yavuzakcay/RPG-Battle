// Logo hattı (Görev L): assets-ham/logo/*.jpg → public/logo/*.webp, uygulama ikonları ve data/logo.json.
// Çalıştırma: npm run logo  (vite-node; saf görüntü işlemleri src/ui/logoKey.ts, testler sentetik tamponla sınar)
//
// 1. Şeffaf logolar: logo-acilis.jpg (yazılı) ve logo-masaustu.jpg (yazısız), beyaz zeminli. Zemin kenardan bağlantılı
//    yakın-beyaz flood-fill (tüm kanallar > 232) ile saydam; ön plan 1 px daralır, alfa σ 0,8 yumuşar. Logonun içindeki
//    parlak vurgular (zar yüzleri, parıltı) kenara bağlı olmadığından korunur. Hale denetimi data/logo.json `checks`.
// 2. Açılış katmanları (logo-acilis): altıgenin dışındaki sol ve sağ kanat, gövde (altıgen, ejderha, zar; boynuzlar
//    dahil) ve yazı bandı ayrı WebP; konumları tuval oranı olarak data/logo.json `acilis.layers`. Kanat dönme noktası
//    kanadın altıgene girdiği kök. Ejderha gözü: başta en parlak turuncu nokta (bulunamazsa sabit oran).
// 3. Uygulama ikonu: logo-mobil.jpg (kare, koyu kömür zemin); sanat (altıgen dahil) tuvalin %68'ine küçültülüp
//    #1A1A1C zemine ortalanır. Projede yalnızca web var (PWA manifesti, Capacitor/Electron/Tauri yok): favicon.ico
//    (16/32/48) ve apple-touch-icon (180, opak) üretilir; 1024 ana ikon assets-ham/logo/uretilen/ altında saklanır.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { DIE_FACES, alphaBounds, backgroundMask, grayFaces, inTriangle, largestComponent, offsetTriangle, type DieVertex, wingEnds, wingMask, enclosedWhite, fillBlob, findDie, findEye, hexBounds, keyDark, haloRatio, inPolygon, keyWhite, type Raw } from '../src/ui/logoKey';

const root = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), '..');
const RAW = path.join(root, 'assets-ham/logo');
const OUT = path.join(root, 'public/logo');
const ICON_DIR = path.join(root, 'public/ikon');
const MASTER_DIR = path.join(RAW, 'uretilen');
const DATA = path.join(root, 'data/logo.json');

/** Zemin rengi (ikon ve açılış ekranı). */
const CHARCOAL = { r: 0x1a, g: 0x1a, b: 0x1c };
const ICON_ART = 0.68;
/** Çıktı genişlikleri (px): açılış sahnesi en çok 900 CSS px; 1800 px 2× masaüstünde ve ~3× telefonda (≈350 px sahne) tam yoğunluk (Görev K2b). Menü başlığı daha küçük. */
const WIDTH = { acilis: 1800, masaustu: 1200 };
const WEBP = { quality: 88, alphaQuality: 100, effort: 6 } as const;

/**
 * Açılış logosunun altıgeni (tuval oranı; ölçüm: üst köşe ve dikey kenarlar ilk opak pikselden). Kanatlar bunun dışında
 * kalan, yazı bandının üstündeki pikseller; boynuz kutusu gövdeye kalır.
 */
const HEX: Array<[number, number]> = [[0.5, 0.109], [0.6696, 0.268], [0.6696, 0.605], [0.5, 0.765], [0.3316, 0.605], [0.3316, 0.268]];
const HORNS = { x0: 0.44, x1: 0.56 };
/** Kanat katmanının gövde altına bindirmesi (kaynak piksel). */
const OVERLAP_PX = 6;
/** Altıgen sınırının dışında, konturun kenar yumuşatmasının kanata girmemesi için pay (kaynak piksel). */
const OUTSIDE_PX = 3;
/** Geniş logoda kanat bölgesinin iç sınırı (boyun ve boynuzlar dışarıda; Görev L4) ve altıgenin dikey kenarları. */
// Altıgenin içinde kanat zarı y ≈ 0,415'e dek iner; zarın yanındaki kuyruk y ≈ 0,45'ten başlar (kanat değil).
const WING_X = { sol: 0.443, sag: 0.557, inHexMaxY: 0.43 };
const HEX_X = { sol: 0.3316, sag: 0.6696 };
/** Kapalı logoda kanat çokgenleri (kare kaynak oranı; kuyruk dışarıda; Görev L4). */
const CLOSED_WING_POLY: Array<[number, number]> = [[0.12, 0.15], [0.38, 0.15], [0.38, 0.36], [0.31, 0.40], [0.282, 0.46], [0.272, 0.70], [0.12, 0.70]];
const CLOSED_WING_POLY_R: Array<[number, number]> = [[0.88, 0.15], [0.62, 0.15], [0.62, 0.36], [0.70, 0.39], [0.74, 0.43], [0.745, 0.70], [0.88, 0.70]];
/** Yazı bandı: logo ile yazı arasındaki boş satırların ortası (ölçülür; bulunamazsa bu). */
const TEXT_TOP_FALLBACK = 0.775;
/** Göz arama kutusu ve sabit yedek. */
const EYE_BOX = { x0: 0.48, y0: 0.12, x1: 0.6, y1: 0.32 };
const EYE_FALLBACK = { x: 0.53, y: 0.215 };
/** Zar arama bölgesi: altıgen, merkezine doğru %80'e küçültülmüş (metal çerçeve dışarıda kalır). */
const HEX_CENTER: [number, number] = [0.5, (0.109 + 0.765) / 2];
const DIE_POLY = HEX.map(([x, y]) => [HEX_CENTER[0] + (x - HEX_CENTER[0]) * 0.8, HEX_CENTER[1] + (y - HEX_CENTER[1]) * 0.8] as [number, number]);
/** Zarın dış siyah konturu (kaynak piksel; yüz sınırına eklenir). */
const DIE_OUTLINE_PX = 10;

/** Kapalı kanatlı (zarsız) logo (Görev L3): kaynak, çıktı genişliği ve zemin anahtarlama toleransı. */
const CLOSED_SRC = 'logo-mobil-zarsiz.jpg';
const CLOSED_REF = 'logo-mobil.jpg'; // zarlı sürüm: zar kutusu ve hizalama denetimi
const CLOSED_OUT = 'acilis-kapali.webp';
const CLOSED_BODY_OUT = 'acilis-kapali-govde.webp';
const CLOSED_WINGS_OUT = 'acilis-kapali-kanat.webp';
const CLOSED_WIDTH = 1200;
const DARK_TOL = 9;
/** Altıgen ölçüm satırı/sütunu: geniş logoda kanatların altında (0,55), kare logoda ortası. */
const HEX_ROW = { acilis: 0.55, kapali: 0.5 };

const r4 = (v: number) => Math.round(v * 10000) / 10000;

async function readRgb(file: string): Promise<Raw> {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: 3 };
}
const rgba = (img: Raw) => sharp(Buffer.from(img.data), { raw: { width: img.width, height: img.height, channels: 4 } });

/** RGBA görüntünün bir kısmı (maske dışını saydam yapar), kutuya kırpılmış. */
function layer(img: Raw, keep: (x: number, y: number) => boolean): { img: Raw; box: { x: number; y: number; w: number; h: number } } {
  const { width: w, height: h } = img;
  const out = new Uint8Array(img.data.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = (y * w + x) * 4;
    if (!keep(x / w, y / h)) continue;
    out.set(img.data.subarray(p, p + 4), p);
  }
  const full: Raw = { data: out, width: w, height: h, channels: 4 };
  const b = alphaBounds(full, 0);
  const pad = 2;
  const x0 = Math.max(0, b.x0 - pad), y0 = Math.max(0, b.y0 - pad);
  const x1 = Math.min(w - 1, b.x1 + pad), y1 = Math.min(h - 1, b.y1 + pad);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const crop = new Uint8Array(cw * ch * 4);
  for (let y = 0; y < ch; y++) crop.set(out.subarray(((y0 + y) * w + x0) * 4, ((y0 + y) * w + x1 + 1) * 4), y * cw * 4);
  return { img: { data: crop, width: cw, height: ch, channels: 4 }, box: { x: x0 / w, y: y0 / h, w: cw / w, h: ch / h } };
}

/** Logo ile yazı arasındaki boş satır bandının ortası (oran). */
function textTop(img: Raw): number {
  const { width: w, height: h } = img;
  const empty = (y: number) => { for (let x = 0; x < w; x++) if (img.data[(y * w + x) * 4 + 3]! > 8) return false; return true; };
  let best: [number, number] | null = null;
  for (let y = Math.round(h * 0.6), start = -1; y < Math.round(h * 0.9); y++) {
    if (empty(y)) { if (start < 0) start = y; }
    else if (start >= 0) { if (!best || y - start > best[1] - best[0]) best = [start, y]; start = -1; }
  }
  return best ? (best[0] + best[1]) / 2 / h : TEXT_TOP_FALLBACK;
}

async function writeWebp(img: Raw, file: string, width: number): Promise<{ file: string; bytes: number; width: number; height: number }> {
  const target = Math.max(1, Math.round(width));
  const buf = await rgba(img).resize({ width: target, kernel: 'lanczos3' }).webp(WEBP).toBuffer();
  fs.writeFileSync(file, buf);
  const meta = await sharp(buf).metadata();
  return { file: path.relative(root, file).replaceAll('\\', '/'), bytes: buf.length, width: meta.width!, height: meta.height! };
}

/** PNG girdili ICO (Windows Vista+ ve tarayıcılar PNG gömülü ICO okur). */
function ico(pngs: Array<{ size: number; data: Buffer }>): Buffer {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let offset = head.length;
  pngs.forEach((p, i) => {
    const o = 6 + 16 * i;
    head.writeUInt8(p.size >= 256 ? 0 : p.size, o); head.writeUInt8(p.size >= 256 ? 0 : p.size, o + 1);
    head.writeUInt8(0, o + 2); head.writeUInt8(0, o + 3);
    head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
    head.writeUInt32LE(p.data.length, o + 8); head.writeUInt32LE(offset, o + 12);
    offset += p.data.length;
  });
  return Buffer.concat([head, ...pngs.map((p) => p.data)]);
}

async function icons(): Promise<Record<string, unknown>> {
  const src = await readRgb(path.join(RAW, 'logo-mobil.jpg'));
  const { width: w, height: h, data } = src;
  // Kaynağın zemini (köşe ortalaması) hedef kömür renginden biraz açık: fark bütün görüntüden düşülür (birleşim izi olmasın).
  const corners = [[4, 4], [w - 5, 4], [4, h - 5], [w - 5, h - 5]].map(([x, y]) => (y! * w + x!) * 3);
  const bg = [0, 1, 2].map((c) => corners.reduce((s, i) => s + data[i + c]!, 0) / corners.length);
  const target = [CHARCOAL.r, CHARCOAL.g, CHARCOAL.b];
  const shifted = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) shifted[i] = Math.max(0, Math.min(255, Math.round(data[i]! - (bg[i % 3]! - target[i % 3]!))));
  // Sanatın sınırı: zeminden belirgin farklı pikseller.
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    if (Math.abs(data[i]! - bg[0]!) + Math.abs(data[i + 1]! - bg[1]!) + Math.abs(data[i + 2]! - bg[2]!) > 40) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  const SIZE = 1024;
  const scale = (ICON_ART * SIZE) / Math.max(x1 - x0 + 1, y1 - y0 + 1);
  const sw = Math.round(w * scale), sh = Math.round(h * scale);
  const left = Math.round(SIZE / 2 - ((x0 + x1 + 1) / 2) * scale), top = Math.round(SIZE / 2 - ((y0 + y1 + 1) / 2) * scale);
  const scaled = await sharp(shifted, { raw: { width: w, height: h, channels: 3 } }).resize(sw, sh, { kernel: 'lanczos3' }).png().toBuffer();
  // Ölçeklenmiş kaynak tuvalden taşabilir: önce geniş kömür zemine, sonra 1024 kırpılır.
  const PAD = Math.max(0, -left, -top, sw + left - SIZE, sh + top - SIZE);
  const master = await sharp({ create: { width: SIZE + 2 * PAD, height: SIZE + 2 * PAD, channels: 3, background: CHARCOAL } })
    .composite([{ input: scaled, left: left + PAD, top: top + PAD }]).extract({ left: PAD, top: PAD, width: SIZE, height: SIZE })
    .flatten({ background: CHARCOAL }).removeAlpha().png().toBuffer();
  fs.mkdirSync(MASTER_DIR, { recursive: true });
  fs.mkdirSync(ICON_DIR, { recursive: true });
  const masterFile = path.join(MASTER_DIR, 'ikon-1024.png');
  fs.writeFileSync(masterFile, master);
  const png = (size: number) => sharp(master).resize(size, size, { kernel: 'lanczos3' }).removeAlpha().png({ compressionLevel: 9 }).toBuffer();
  const icoSizes = [16, 32, 48];
  const icoBuf = ico(await Promise.all(icoSizes.map(async (size) => ({ size, data: await png(size) }))));
  fs.writeFileSync(path.join(root, 'public/favicon.ico'), icoBuf);
  const apple = await png(180);
  fs.writeFileSync(path.join(ICON_DIR, 'apple-touch-icon.png'), apple);
  const art = { x0: r4((left + x0 * scale) / SIZE), y0: r4((top + y0 * scale) / SIZE), x1: r4((left + (x1 + 1) * scale) / SIZE), y1: r4((top + (y1 + 1) * scale) / SIZE) };
  return {
    platform: 'web',
    note: 'Projede yalnızca web (Vite) var: PWA manifesti, Capacitor, Electron, Tauri yok. iOS, Android ve Windows uygulama ikonları üretilmez; platform eklenirse 1024 ana ikondan üretilir.',
    master: { file: path.relative(root, masterFile), size: SIZE, opaque: true, background: '#1A1A1C', art },
    files: [
      { file: 'public/favicon.ico', sizes: icoSizes, bytes: icoBuf.length },
      { file: 'public/ikon/apple-touch-icon.png', sizes: [180], bytes: apple.length, opaque: true },
    ],
  };
}

/**
 * Logodaki d20'nin 2B modeli (Görev L5): açılıştaki 3D zar son pozda buna oturur. Gri yüzler iki eşikte bulunur (açık
 * üst yüzler ve koyu alt yüzler), her yüz kaba merkezine göre adlanır; yüzün gerçek üçgeni gri üçgenin siyah çizginin
 * yarısı (`DIE_LINE_HALF_PX`) kadar dışa kaydırılmışıdır; köşe noktası onu paylaşan yüzlerin köşelerinin ortalaması.
 * Yüz renkleri (üst, alt, açık kenar bandı) ve rakamların merkezi ile yüksekliği ölçülür; rakam açıları gözle
 * belirlendi (`DIE_NUMBER_ANGLE`, CSS saat yönü derece; logodaki baskı).
 */
const DIE_LINE_HALF_PX = 6;
const DIE_NUMBER_ANGLE: Record<number, number> = { 20: 0, 18: 0, 4: 0, 6: 0, 8: -8, 2: 25, 14: 45, 12: -97, 10: -156, 16: 140 };
const DIE_ROUGH: Record<DieVertex, [number, number]> = {
  T: [0.5008, 0.296], UL: [0.424, 0.368], UR: [0.577, 0.368], LL: [0.421, 0.518], LR: [0.58, 0.518], B: [0.5005, 0.59],
  Fa: [0.5005, 0.356], Fl: [0.453, 0.49], Fr: [0.548, 0.49],
};
function dieModel(img: Raw) {
  const W = img.width, H = img.height, ch = img.channels;
  const box = { x0: 0.405, y0: 0.28, x1: 0.595, y1: 0.61 };
  const tri = (n: number) => DIE_FACES[n]!.map((v) => DIE_ROUGH[v]) as [[number, number], [number, number], [number, number]];
  const found: Record<number, { corners: [[number, number], [number, number], [number, number]] }> = {};
  for (const lum of [95, 58]) for (const g of grayFaces(img, box, lum)) {
    const n = Object.keys(DIE_FACES).map(Number).find((k) => inTriangle(g.c, tri(k)));
    if (n !== undefined && !found[n] && g.n < 30000) found[n] = { corners: g.corners };
  }
  const missing = Object.keys(DIE_FACES).filter((k) => !found[+k]);
  if (missing.length) throw new Error(`logodaki zarda yüz bulunamadı: ${missing.join(',')}`);
  // Köşe noktaları: her yüzün gri üçgenini piksel uzayında dışa kaydır, köşeyi en yakın kaba noktaya ata, ortala.
  const acc: Record<string, number[][]> = {};
  const toPx = (p: [number, number]): [number, number] => [p[0] * W, p[1] * H];
  for (const [n, f] of Object.entries(found)) {
    const outer = offsetTriangle(f.corners.map(toPx) as [[number, number], [number, number], [number, number]], DIE_LINE_HALF_PX);
    for (const q of outer) {
      const v = DIE_FACES[+n]!.reduce((b, k) => ((DIE_ROUGH[k][0] * W - q[0]) ** 2 + (DIE_ROUGH[k][1] * H - q[1]) ** 2 < (DIE_ROUGH[b][0] * W - q[0]) ** 2 + (DIE_ROUGH[b][1] * H - q[1]) ** 2 ? k : b));
      (acc[v] ??= []).push(q);
    }
  }
  const vertices = Object.fromEntries(Object.entries(acc).map(([k, qs]) => [k, [r4(qs.reduce((a, q) => a + q[0]!, 0) / qs.length / W), r4(qs.reduce((a, q) => a + q[1]!, 0) / qs.length / H)]]));
  const hex = (c: number[]) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const faces: Record<string, unknown> = {};
  for (const [n, f] of Object.entries(found)) {
    const t = f.corners;
    const cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
    const scaled = (k: number) => t.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]) as [[number, number], [number, number], [number, number]];
    const inner = scaled(0.8), numberArea = scaled(0.86);
    const ys = t.map((p) => p[1]), yTop = Math.min(...ys), yBot = Math.max(...ys);
    const sums = { top: [0, 0, 0, 0], bottom: [0, 0, 0, 0], rim: [0, 0, 0, 0] };
    const dark: Array<[number, number]> = [];
    const xs = t.map((p) => p[0]);
    for (let y = Math.floor(yTop * H); y < yBot * H; y++) for (let x = Math.floor(Math.min(...xs) * W); x < Math.max(...xs) * W; x++) {
      const p: [number, number] = [x / W, y / H];
      if (!inTriangle(p, t)) continue;
      const i = (y * W + x) * ch; const r = img.data[i]!, g = img.data[i + 1]!, b = img.data[i + 2]!;
      const l = (r + g + b) / 3;
      if (l < 55) { if (inTriangle(p, numberArea)) dark.push([x, y]); continue; }
      const add = (a: number[]) => { a[0]! += r; a[1]! += g; a[2]! += b; a[3]!++; };
      if (!inTriangle(p, inner)) add(sums.rim);
      else if (p[1] < yTop + 0.35 * (yBot - yTop)) add(sums.top);
      else if (p[1] > yTop + 0.65 * (yBot - yTop)) add(sums.bottom);
    }
    const avg = (a: number[]) => hex([a[0]! / a[3]!, a[1]! / a[3]!, a[2]! / a[3]!]);
    const ang = DIE_NUMBER_ANGLE[+n]!;
    const ux = Math.sin((ang * Math.PI) / 180), uy = -Math.cos((ang * Math.PI) / 180); // rakamın "yukarısı" (ekran)
    const mx = dark.reduce((a, q) => a + q[0], 0) / dark.length, my = dark.reduce((a, q) => a + q[1], 0) / dark.length;
    let lo = 1e9, hi = -1e9;
    for (const q of dark) { const u = (q[0] - mx) * ux + (q[1] - my) * uy; lo = Math.min(lo, u); hi = Math.max(hi, u); }
    // Tek haneli rakamda (dönük, köşegen vuruşlu "2" gibi) "yukarı" boyunca ölçüm kısa kalır: bölgenin uzun ekseni
    // (en uzak iki piksel arası) rakam boyuna daha yakın.
    if (+n < 10) {
      let far = 0;
      for (let i = 0; i < dark.length; i += 3) for (let j = i + 1; j < dark.length; j += 7) far = Math.max(far, Math.hypot(dark[i]![0] - dark[j]![0], dark[i]![1] - dark[j]![1]));
      hi = lo + Math.max(hi - lo, far * 0.92);
    }
    faces[n] = {
      gray: t.map((p) => [r4(p[0]), r4(p[1])]),
      top: avg(sums.top), bottom: avg(sums.bottom.map((v, i) => (sums.bottom[3] ? v : sums.top[i]!))), rim: avg(sums.rim),
      number: { c: [r4(mx / W), r4(my / H)], heightPx: Math.round(hi - lo), angle: ang },
    };
  }
  return { linePx: 2 * DIE_LINE_HALF_PX, vertices, faces };
}

const avgCorner = (r: Raw): [number, number, number] => {
  const pts = [[4, 4], [r.width - 5, 4], [4, r.height - 5], [r.width - 5, r.height - 5]].map(([x, y]) => (y! * r.width + x!) * r.channels);
  return [0, 1, 2].map((c) => Math.round(pts.reduce((s, i) => s + r.data[i + c]!, 0) / pts.length)) as [number, number, number];
};

/** Altıgenin iç siyahı: altıgen içinde koyu ve doygunluksuz piksellerin ortancası. */
function interiorBlack(img: Raw, hb: { top: number; bottom: number; left: number; right: number }): [number, number, number] {
  const vals: number[][] = [[], [], []];
  for (let y = hb.top; y < hb.bottom; y += 3) for (let x = hb.left; x < hb.right; x += 3) {
    const i = (y * img.width + x) * img.channels;
    const r = img.data[i]!, g = img.data[i + 1]!, b = img.data[i + 2]!;
    if (Math.max(r, g, b) < 18 && Math.max(r, g, b) - Math.min(r, g, b) < 6 && (img.channels < 4 || img.data[i + 3]! > 250)) { vals[0]!.push(r); vals[1]!.push(g); vals[2]!.push(b); }
  }
  return vals.map((v) => v.sort((a, b) => a - b)[Math.floor(v.length / 2)] ?? 0) as [number, number, number];
}

/**
 * Kapalı kanatlı katman ve hizalama (Görev L3). Geniş logo (açılış) tuvali sahnedir; kapalı katman, altıgenin dış
 * sınırları (üst/alt köşe, sol/sağ dikey kenar) çakışacak biçimde x ve y'de ayrı ölçeklenir (fark %2: iki çizimde
 * altıgen oranı biraz farklı). Zar kutusu zarlı kare logodan ölçülüp aynı dönüşümle geniş logodakiyle karşılaştırılır;
 * göz de öyle (ejderhanın başı iki çizimde farklı durduğu için göz birkaç yüzde kayık: ışık kapalı katmandaki gözden
 * çıkar, geniş logoya geçerken onunkine kayar).
 */
async function closedLayer(wide: Raw, tTop: number, wideDieFaces: { x: number; y: number; w: number; h: number }, wideEye: { x: number; y: number } | null) {
  const src = await readRgb(path.join(RAW, CLOSED_SRC));
  const bg = avgCorner(src);
  const keyed = keyDark(src, bg, DARK_TOL);
  const hbC = hexBounds(keyed, 0.5, HEX_ROW.kapali);
  const fill = interiorBlack(keyed, hbC);
  const blob = fillBlob(keyed, [0.5, 0.5], fill, { grow: 12, sigma: 3, lum: [10, 90] });
  const hbW = hexBounds(wide, 0.5, HEX_ROW.acilis, tTop);
  const sx = (hbW.right - hbW.left) / (hbC.right - hbC.left);
  const sy = (hbW.bottom - hbW.top) / (hbC.bottom - hbC.top);
  // Kapalı piksel (px, py) → geniş tuval oranı.
  const toWide = (px: number, py: number) => ({ x: ((px - hbC.left) * sx + hbW.left) / wide.width, y: ((py - hbC.top) * sy + hbW.top) / wide.height });
  const tl = toWide(0, 0), br = toWide(src.width, src.height);
  const box = { x: r4(tl.x), y: r4(tl.y), w: r4(br.x - tl.x), h: r4(br.y - tl.y) };
  // Tek parça kapalı logo uygulamada kullanılmaz (gövde + kanat katmanları kullanılır): denetim için assets-ham'da.
  fs.mkdirSync(MASTER_DIR, { recursive: true });
  const out = await writeWebp(keyed, path.join(MASTER_DIR, CLOSED_OUT), CLOSED_WIDTH);
  // Görev L4: kapalı logo gövde ve kanat olarak ikiye. Kanat: çokgende kanat rengi ya da kanada yakın koyu piksel.
  // Gövdede kanatların yeri altıgenin iç siyahıyla dolar (kanatlar solunca altıgenin içi görünür).
  const W = src.width, H = src.height;
  const cw = { sol: wingMask(keyed, (x, y) => inPolygon(x, y, CLOSED_WING_POLY)), sag: wingMask(keyed, (x, y) => inPolygon(x, y, CLOSED_WING_POLY_R)) };
  const body: Raw = { data: Uint8Array.from(keyed.data), width: W, height: H, channels: 4 };
  const wings: Raw = { data: new Uint8Array(W * H * 4), width: W, height: H, channels: 4 };
  for (let p = 0; p < W * H; p++) {
    if (!cw.sol[p] && !cw.sag[p]) continue;
    wings.data.set(keyed.data.subarray(p * 4, p * 4 + 4), p * 4);
    body.data.set([fill[0], fill[1], fill[2]], p * 4);
  }
  const outBody = await writeWebp(body, path.join(OUT, CLOSED_BODY_OUT), CLOSED_WIDTH);
  const outWings = await writeWebp(wings, path.join(OUT, CLOSED_WINGS_OUT), CLOSED_WIDTH);
  const closedEnds = { sol: wingEnds(cw.sol, W, H, 'sol'), sag: wingEnds(cw.sag, W, H, 'sag') };
  const endsWide = (e: ReturnType<typeof wingEnds>) => e && { root: toWide(e.root.x, e.root.y), tip: toWide(e.tip.x, e.tip.y) };
  // Denetim: zarlı kare logodaki zar ve göz, aynı dönüşümle.
  const ref = keyDark(await readRgb(path.join(RAW, CLOSED_REF)), bg, DARK_TOL);
  const hbR = hexBounds(ref, 0.5, HEX_ROW.kapali);
  const cx = (hbR.left + hbR.right) / 2 / ref.width, cy = (hbR.top + hbR.bottom) / 2 / ref.height;
  const hw = (hbR.right - hbR.left) / ref.width, hh = (hbR.bottom - hbR.top) / ref.height;
  const poly: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; poly.push([cx + 0.33 * Math.cos(a) * hw, cy + 0.33 * Math.sin(a) * hh]); }
  const dieRef = findDie(ref, poly);
  if (!dieRef) throw new Error('kare logodaki zar bulunamadı');
  const d0 = toWide(dieRef.x0 * ref.width, dieRef.y0 * ref.height), d1 = toWide(dieRef.x1 * ref.width, dieRef.y1 * ref.height);
  const eyeC = findEye(keyed, { x0: 0.45, y0: 0.15, x1: 0.65, y1: 0.35 });
  const eye = eyeC ? toWide(eyeC.x * src.width, eyeC.y * src.height) : null;
  const px = (v: number, n: number) => Math.round(v * n * 10) / 10;
  return {
    file: out.file, bytes: out.bytes, width: out.width, height: out.height, box,
    body: { file: outBody.file, bytes: outBody.bytes }, wings: { file: outWings.file, bytes: outWings.bytes },
    wingEnds: { sol: endsWide(closedEnds.sol), sag: endsWide(closedEnds.sag) },
    background: bg, fill, blob: { pixels: blob.pixels, box: { x0: r4(blob.box.x0), y0: r4(blob.box.y0), x1: r4(blob.box.x1), y1: r4(blob.box.y1) } },
    align: {
      hexWide: hbW, hexClosed: hbC, hexClosedRef: hbR, scale: { x: r4(sx), y: r4(sy) },
      // Zar yüz kutusu (konturdan bağımsız) geniş logo pikseli: kapalı (dönüşümle) ve geniş; fark piksel.
      dieClosed: { x0: px(d0.x, wide.width), y0: px(d0.y, wide.height), x1: px(d1.x, wide.width), y1: px(d1.y, wide.height) },
      dieWide: { x0: px(wideDieFaces.x, wide.width), y0: px(wideDieFaces.y, wide.height), x1: px(wideDieFaces.x + wideDieFaces.w, wide.width), y1: px(wideDieFaces.y + wideDieFaces.h, wide.height) },
      eyeClosed: eye ? { x: r4(eye.x), y: r4(eye.y) } : null,
      eyeWide: wideEye ? { x: r4(wideEye.x), y: r4(wideEye.y) } : null,
    },
  };
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT, { recursive: true });
  const outputs: Record<string, unknown> = {};
  const checks: Record<string, unknown> = {};
  let acilis: Record<string, unknown> = {};
  for (const name of ['acilis', 'masaustu'] as const) {
    const src = await readRgb(path.join(RAW, `logo-${name}.jpg`));
    // Yazı bandındaki harf boşlukları (D, &) kenara bağlı değil: yalnızca o bantta, büyük kapalı beyaz bölgeler de
    // saydam olur (logo gövdesindeki vurgular korunur). Bant ölçümü kenardan flood-fill sonrası yapılır.
    const plain = keyWhite(src);
    const band = name === 'acilis' ? textTop(plain) : 2;
    const islands = enclosedWhite(src, backgroundMask(src)).filter((i) => i.size >= 30);
    const keyed = name === 'acilis' ? keyWhite(src, { enclosed: (_x, y) => y >= band }) : plain;
    const scale = WIDTH[name] / src.width;
    outputs[name] = await writeWebp(keyed, path.join(OUT, `logo-${name}.webp`), WIDTH[name]);
    const corner = keyed.data[3]! + keyed.data[(src.width - 1) * 4 + 3]! + keyed.data[(src.width * src.height - 1) * 4 + 3]!;
    const halo = haloRatio(keyed);
    const kept = islands.filter((i) => !i.inRegion((_x, y) => y >= band));
    checks[name] = { source: [src.width, src.height], cornerAlpha: corner, edgePixels: halo.edge, haloPixels: halo.halo, haloRatio: r4(halo.ratio), bounds: alphaBounds(keyed),
      textCounters: islands.length - kept.length, keptWhite: kept.map((i) => ({ size: i.size, box: [r4(i.box.x0 / src.width), r4(i.box.y0 / src.height), r4(i.box.x1 / src.width), r4(i.box.y1 / src.height)] })) };
    if (name !== 'acilis') continue;
    // Açılış katmanları.
    const eye = findEye(keyed, EYE_BOX);
    const tTop = band;
    const inHex = (x: number, y: number) => inPolygon(x, y, HEX);
    const side = (s: 'sol' | 'sag', x: number) => (s === 'sol' ? x < HORNS.x0 : x > HORNS.x1);
    // Kanat ile gövde (Görev L3): altıgenin dışında (sınırdan OUTSIDE_PX dışarıda, kontur kenar yumuşatması hariç)
    // kalan her şey kanat. Sınır bandında (OUTSIDE_PX dışarıdan OVERLAP_PX içeriye) yalnızca kanat rengindeki
    // (kırmızı/turuncu) pikseller kanata da girer: gövdenin altında kalan bindirme, ölçeklemede dikiş göstermez.
    // Bant altıgenin siyah dış konturunu içerdiğinden kontur kanata girmez (L'deki "kanat ucunda ince siyah çizgi":
    // bindirme konturu da alıyordu; kanat katlanırken kanatla birlikte dönen düz siyah çizgi oluyordu).
    const near = (x: number, y: number, px: number, test: (x: number, y: number) => boolean) => {
      const ddx = px / src.width, ddy = px / src.height;
      return [[0, 0], [ddx, 0], [-ddx, 0], [0, ddy], [0, -ddy], [ddx, ddy], [-ddx, -ddy], [ddx, -ddy], [-ddx, ddy]].some(([ox, oy]) => test(x + ox!, y + oy!));
    };
    const solidWing = (s: 'sol' | 'sag') => (x: number, y: number) => y < tTop && side(s, x) && !near(x, y, OUTSIDE_PX, inHex);
    const wingColor = (x: number, y: number) => {
      const i = (Math.min(src.height - 1, Math.floor(y * src.height)) * src.width + Math.min(src.width - 1, Math.floor(x * src.width))) * 4;
      const r = keyed.data[i]!, g = keyed.data[i + 1]!, b = keyed.data[i + 2]!;
      return r > 90 && r - b > 50 && r >= g;
    };
    // Görev L4: kanat katmanı kanadın tamamı (altıgenin üstünden geçen kol ve zar dahil): altıgen dışındaki her şey
    // ve kanat bölgesinde (sol x < WING_X.sol, sağ x > WING_X.sag; boyun ve boynuzlar dışarıda) kanat rengindeki ya da
    // kanada yakın koyu pikseller. Kanat altıgen çerçevesinin önünde çizilir; tam açıkken gövdedeki aynı piksellerle
    // çakışır (dikiş yok).
    const wingPix = {
      sol: largestComponent(wingMask(keyed, (x, y) => y < tTop && x < WING_X.sol && (x < HEX_X.sol || y < WING_X.inHexMaxY)), src.width, src.height),
      sag: largestComponent(wingMask(keyed, (x, y) => y < tTop && x > WING_X.sag && (x > HEX_X.sag || y < WING_X.inHexMaxY)), src.width, src.height),
    };
    const at = (m: Uint8Array, x: number, y: number) => m[Math.min(src.height - 1, Math.floor(y * src.height)) * src.width + Math.min(src.width - 1, Math.floor(x * src.width))] === 1;
    const wingLayer = (s: 'sol' | 'sag') => (x: number, y: number) =>
      solidWing(s)(x, y) || (y < tTop && side(s, x) && near(x, y, OVERLAP_PX, (a, b) => !inHex(a, b)) && wingColor(x, y)) || at(wingPix[s], x, y);
    // Katlanma ölçüsü: kanadın kökü (gövdeye en yakın uç) ve ucu.
    const fullMask = (s: 'sol' | 'sag') => {
      const m = new Uint8Array(src.width * src.height);
      for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) if (keyed.data[(y * src.width + x) * 4 + 3]! > 128 && wingLayer(s)(x / src.width, y / src.height)) m[y * src.width + x] = 1;
      return m;
    };
    const openEnds = { sol: wingEnds(fullMask('sol'), src.width, src.height, 'sol'), sag: wingEnds(fullMask('sag'), src.width, src.height, 'sag') };
    const parts = {
      'kanat-sol': layer(keyed, wingLayer('sol')),
      'kanat-sag': layer(keyed, wingLayer('sag')),
      govde: layer(keyed, (x, y) => y < tTop && !solidWing('sol')(x, y) && !solidWing('sag')(x, y)),
      yazi: layer(keyed, (_x, y) => y >= tTop),
    };
    const layers: Record<string, unknown> = {};
    for (const [id, part] of Object.entries(parts)) {
      const out = await writeWebp(part.img, path.join(OUT, `acilis-${id}.webp`), part.img.width * scale);
      layers[id] = { ...out, box: { x: r4(part.box.x), y: r4(part.box.y), w: r4(part.box.w), h: r4(part.box.h) } };
    }
    // Logodaki d20 (Görev L2): açılıştaki 3D zar bu kutuya oturtulur.
    const dieRaw = findDie(keyed, DIE_POLY);
    if (!dieRaw) throw new Error('logodaki zar bulunamadı');
    const ox = DIE_OUTLINE_PX / src.width, oy = DIE_OUTLINE_PX / src.height;
    const die = { x: r4(dieRaw.x0 - ox), y: r4(dieRaw.y0 - oy), w: r4(dieRaw.x1 - dieRaw.x0 + 2 * ox), h: r4(dieRaw.y1 - dieRaw.y0 + 2 * oy), pixels: dieRaw.pixels };
    // Kapalı kanatlı logo (Görev L3): zarsız sürüm koyu zeminden ayrılır, zarın eski yerindeki gri altıgen leke
    // altıgenin iç siyahıyla doldurulur; altıgen dış sınırı geniş logodakine oturacak biçimde ölçek ve öteleme.
    const closed = await closedLayer(keyed, tTop, { x: dieRaw.x0, y: dieRaw.y0, w: dieRaw.x1 - dieRaw.x0, h: dieRaw.y1 - dieRaw.y0 }, eye);
    // Katlanma (Görev L4): açık kanat, kökü kapalı kanadın köküne, ucu kapalı kanadın ucuna gelecek biçimde döner ve
    // küçülür (dönme noktası açık kanadın kökü). Açıyı ve uzunluğu sahne eni biriminde ölçeriz (dikey ÷ en/boy).
    const ar = src.width / src.height;
    const fold: Record<string, unknown> = {};
    for (const s of ['sol', 'sag'] as const) {
      const o = openEnds[s], c = (closed.wingEnds as Record<string, { root: { x: number; y: number }; tip: { x: number; y: number } } | null>)[s];
      if (!o || !c) throw new Error(`kanat ucu bulunamadı: ${s}`);
      const oRoot = { x: o.root.x / src.width, y: o.root.y / src.height }, oTip = { x: o.tip.x / src.width, y: o.tip.y / src.height };
      const vo = { x: oTip.x - oRoot.x, y: (oTip.y - oRoot.y) / ar }, vc = { x: c.tip.x - c.root.x, y: (c.tip.y - c.root.y) / ar };
      let rot = ((Math.atan2(vc.y, vc.x) - Math.atan2(vo.y, vo.x)) * 180) / Math.PI;
      while (rot > 180) rot -= 360;
      while (rot < -180) rot += 360;
      fold[`kanat-${s}`] = {
        root: { x: r4(oRoot.x), y: r4(oRoot.y) }, tip: { x: r4(oTip.x), y: r4(oTip.y) },
        closedRoot: { x: r4(c.root.x), y: r4(c.root.y) }, closedTip: { x: r4(c.tip.x), y: r4(c.tip.y) },
        rotate: Math.round(rot * 10) / 10, scale: r4(Math.hypot(vc.x, vc.y) / Math.hypot(vo.x, vo.y)),
        // Öteleme sahne oranı (kök → kapalı kök); bileşen katman kutusu yüzdesine çevirir.
        dx: r4(c.root.x - oRoot.x), dy: r4(c.root.y - oRoot.y),
      };
    }
    const dieMdl = dieModel(keyed);
    acilis = {
      dieModel: dieMdl,
      fold,
      closed,
      aspect: r4(src.width / src.height),
      eye: eye ? { x: r4(eye.x), y: r4(eye.y), found: true } : { ...EYE_FALLBACK, found: false },
      textTop: r4(tTop),
      die,
      hex: HEX,
      layers,
    };
  }
  const icon = await icons();
  const data = {
    note: 'npm run logo (scripts/logo.ts) üretir; elle düzenlenmez. Kaynak assets-ham/logo/*.jpg. Kutular ve noktalar tuval oranı (0–1). Görsellerdeki yazı ("DICE & HEX") sabittir; oyun adı değişirse kaynak görsel yeniden üretilmelidir (APP_NAME yalnızca canlı metni değiştirir).',
    method: { whiteMin: 232, erodePx: 1, alphaSigma: 0.8 },
    outputs, acilis, icon, checks,
  };
  fs.writeFileSync(DATA, JSON.stringify(data, null, 1) + '\n');
  console.log(JSON.stringify({ outputs, checks, eye: acilis.eye, textTop: acilis.textTop, die: acilis.die }, null, 1));
  console.log('ikon:', JSON.stringify(icon));
}

await main();
