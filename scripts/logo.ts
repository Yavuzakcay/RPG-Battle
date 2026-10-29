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
import { alphaBounds, backgroundMask, enclosedWhite, findEye, haloRatio, inPolygon, keyWhite, type Raw } from '../src/ui/logoKey';

const root = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), '..');
const RAW = path.join(root, 'assets-ham/logo');
const OUT = path.join(root, 'public/logo');
const ICON_DIR = path.join(root, 'public/ikon');
const MASTER_DIR = path.join(RAW, 'uretilen');
const DATA = path.join(root, 'data/logo.json');

/** Zemin rengi (ikon ve açılış ekranı). */
const CHARCOAL = { r: 0x1a, g: 0x1a, b: 0x1c };
const ICON_ART = 0.68;
/** Çıktı genişlikleri (px): açılış telefonda ~3× yoğunlukta tam genişlik, menü başlığı daha küçük. */
const WIDTH = { acilis: 1400, masaustu: 1200 };
const WEBP = { quality: 88, alphaQuality: 100, effort: 6 } as const;

/**
 * Açılış logosunun altıgeni (tuval oranı; ölçüm: üst köşe ve dikey kenarlar ilk opak pikselden). Kanatlar bunun dışında
 * kalan, yazı bandının üstündeki pikseller; boynuz kutusu gövdeye kalır.
 */
const HEX: Array<[number, number]> = [[0.5, 0.109], [0.6696, 0.268], [0.6696, 0.605], [0.5, 0.765], [0.3316, 0.605], [0.3316, 0.268]];
const HORNS = { x0: 0.44, x1: 0.56 };
/** Kanat katmanının gövde altına bindirmesi (kaynak piksel). */
const OVERLAP_PX = 6;
/** Yazı bandı: logo ile yazı arasındaki boş satırların ortası (ölçülür; bulunamazsa bu). */
const TEXT_TOP_FALLBACK = 0.775;
/** Kanat kökü (dönme noktası), sol kanat; sağ kanat aynası. Altıgenin sol üst kenarında kolun girdiği yer. */
const WING_ROOT = { x: 0.385, y: 0.218 };
/** Göz arama kutusu ve sabit yedek. */
const EYE_BOX = { x0: 0.48, y0: 0.12, x1: 0.6, y1: 0.32 };
const EYE_FALLBACK = { x: 0.53, y: 0.215 };

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
    const wing = (s: 'sol' | 'sag') => (x: number, y: number) => y < tTop && !inHex(x, y) && side(s, x);
    // Kanat katmanı altıgen sınırından OVERLAP_PX içeri taşar: gövdenin altında kalır, ölçeklemede iki katmanın yarı
    // saydam kenarları üst üste binip dikiş (zemin sızması) göstermesin.
    const dx = OVERLAP_PX / src.width, dy = OVERLAP_PX / src.height;
    const wingLayer = (s: 'sol' | 'sag') => (x: number, y: number) =>
      y < tTop && side(s, x) && [[0, 0], [dx, 0], [-dx, 0], [0, dy], [0, -dy], [dx, dy], [-dx, -dy], [dx, -dy], [-dx, dy]].some(([ox, oy]) => !inHex(x + ox!, y + oy!));
    const parts = {
      'kanat-sol': layer(keyed, wingLayer('sol')),
      'kanat-sag': layer(keyed, wingLayer('sag')),
      govde: layer(keyed, (x, y) => y < tTop && !wing('sol')(x, y) && !wing('sag')(x, y)),
      yazi: layer(keyed, (_x, y) => y >= tTop),
    };
    const layers: Record<string, unknown> = {};
    for (const [id, part] of Object.entries(parts)) {
      const out = await writeWebp(part.img, path.join(OUT, `acilis-${id}.webp`), part.img.width * scale);
      layers[id] = { ...out, box: { x: r4(part.box.x), y: r4(part.box.y), w: r4(part.box.w), h: r4(part.box.h) } };
    }
    acilis = {
      aspect: r4(src.width / src.height),
      eye: eye ? { x: r4(eye.x), y: r4(eye.y), found: true } : { ...EYE_FALLBACK, found: false },
      textTop: r4(tTop),
      hex: HEX,
      roots: { 'kanat-sol': WING_ROOT, 'kanat-sag': { x: r4(1 - WING_ROOT.x), y: WING_ROOT.y } },
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
  console.log(JSON.stringify({ outputs, checks, eye: acilis.eye, textTop: acilis.textTop }, null, 1));
  console.log('ikon:', JSON.stringify(icon));
}

await main();
