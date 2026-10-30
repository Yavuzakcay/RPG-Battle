// Görev K22: soy kafa kaplaması. Çalıştırma: npm run soy-bas (npm run soy-maske de çağırır).
// Kapsam veride: data/soy-renkleri.json `basKaplama` ({ ırk: [sınıflar] }). Kafa görseli assets/soy-bas/<ırk>-<kadin|erkek>.png
// (yalnızca okunur). Her kapsamdaki jetonda kafa sınırlayıcı kutusu ten maskesinin en üstteki bağlı bileşeninden; görselin
// kenara bağlı siyah zemini şeffaflaştırılır, kutuyu örtecek şekilde en yakın komşuyla ölçeklenir, tepesi kutunun tepesine
// ve yatayda kutunun ortasına hizalanır, kutuya kırpılır. Çıktı: public/characters/bas/<jeton>.png (jetonla aynı boyut) ve
// data/soy-bas.json (kutu, ölçek, boyutlar, atlananlar, uyarılar). Kafa görseli yoksa o cinsiyette kayıt yok (davranış aynı).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import soy from '../data/soy-renkleri.json';
import { CHAR, ROOT } from './soy-maske-yollar';

export const BAS_GIRDI = path.join(ROOT, 'assets/soy-bas');
export const BAS_CIKTI = path.join(CHAR, 'bas');
export const BAS_JSON = path.join(ROOT, 'data/soy-bas.json');
const GENDER: Record<string, string> = { female: 'kadin', male: 'erkek' };

type Entry = { box: [number, number, number, number]; scale: number; head: [number, number]; need: [number, number]; skin: number; uyari?: string };

/** Ten maskesinin en üstteki bağlı bileşeninin kutusu (kafa). */
export function headBox(mask: Uint8Array, W: number, H: number): [number, number, number, number] | null {
  let start = -1;
  for (let p = 0; p < mask.length; p++) if (mask[p]) { start = p; break; }
  if (start < 0) return null;
  const seen = new Uint8Array(mask.length); const st = [start]; seen[start] = 1;
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  while (st.length) {
    const p = st.pop()!; const x = p % W, y = (p / W) | 0;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const k = yy * W + xx;
      if (mask[k] && !seen[k]) { seen[k] = 1; st.push(k); }
    }
  }
  return [x0, y0, x1, y1];
}

/** Kafa görseli: kenara bağlı saf siyah (≤ 12) zemin şeffaf, opak kısma kırpılır. */
async function loadHead(file: string): Promise<{ data: Buffer; w: number; h: number; zemin: boolean }> {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const dark = (p: number) => Math.max(data[p * 4]!, data[p * 4 + 1]!, data[p * 4 + 2]!) <= 12 && data[p * 4 + 3]! > 0;
  const seen = new Uint8Array(W * H); const st: number[] = [];
  for (let x = 0; x < W; x++) for (const y of [0, H - 1]) if (dark(y * W + x)) { seen[y * W + x] = 1; st.push(y * W + x); }
  for (let y = 0; y < H; y++) for (const x of [0, W - 1]) if (dark(y * W + x) && !seen[y * W + x]) { seen[y * W + x] = 1; st.push(y * W + x); }
  let zemin = false;
  while (st.length) {
    const p = st.pop()!; data[p * 4 + 3] = 0; zemin = true;
    const x = p % W, y = (p / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const k = yy * W + xx;
      if (!seen[k] && dark(k)) { seen[k] = 1; st.push(k); }
    }
  }
  const trimmed = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 0 }).raw().toBuffer({ resolveWithObject: true });
  return { data: trimmed.data, w: trimmed.info.width, h: trimmed.info.height, zemin };
}

export async function buildHeads(): Promise<{ sprites: Record<string, Entry>; atlanan: Record<string, string>; uyarilar: string[] }> {
  const scope = (soy as unknown as { basKaplama?: Record<string, string[]> }).basKaplama ?? {};
  const sprites: Record<string, Entry> = {};
  const atlanan: Record<string, string> = {};
  const uyarilar: string[] = [];
  const rapor = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/soy-maske-rapor.json'), 'utf8')) as { sprites: Record<string, string> };
  fs.mkdirSync(BAS_CIKTI, { recursive: true });
  for (const [race, classes] of Object.entries(scope)) for (const g of ['female', 'male']) {
    const file = path.join(BAS_GIRDI, `${race}-${GENDER[g]}.png`);
    if (!fs.existsSync(file)) { uyarilar.push(`${path.relative(ROOT, file)} yok: ${race} ${g} kafa kaplaması yapılmadı.`); continue; }
    const head = await loadHead(file);
    if (head.zemin) uyarilar.push(`${path.relative(ROOT, file)}: arka plan şeffaf değildi (opak siyah); kenara bağlı siyah zemin şeffaflaştırıldı.`);
    for (const cls of classes) {
      const name = `${race}-${g}-${cls}`;
      const { data: sp, info } = await sharp(path.join(CHAR, `${name}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const W = info.width, H = info.height;
      const mdir = rapor.sprites[name] === 'el' ? 'maske-el' : 'maske';
      const m = await sharp(path.join(CHAR, mdir, `${name}.png`)).greyscale().raw().toBuffer();
      const mask = new Uint8Array(m.length); for (let i = 0; i < m.length; i++) mask[i] = m[i]! > 127 ? 1 : 0;
      const box = headBox(mask, W, H);
      if (!box) { atlanan[name] = 'ten maskesi boş'; continue; }
      const [x0, y0, x1, y1] = box;
      // Dekoratif öğe denetimi: kutudaki opak piksellerin çoğu ten olmalı (kask, başlık, saç varsa düşer).
      let opaque = 0, skin = 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const p = y * W + x; if (sp[p * 4 + 3]! > 127) { opaque++; if (mask[p]) skin++; } }
      const ratio = opaque ? skin / opaque : 0;
      if (ratio < 0.5) { atlanan[name] = `kafada dekoratif öğe olabilir (kutuda ten oranı %${Math.round(ratio * 100)})`; continue; }
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      const s = Math.max(bw / head.w, bh / head.h);
      const nw = Math.max(1, Math.round(head.w * s)), nh = Math.max(1, Math.round(head.h * s));
      const scaled = await sharp(head.data, { raw: { width: head.w, height: head.h, channels: 4 } }).resize(nw, nh, { kernel: 'nearest' }).raw().toBuffer();
      const ov = Buffer.alloc(W * H * 4);
      const left = Math.round((x0 + x1) / 2 - nw / 2), top = y0;
      for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
        const X = left + x, Y = top + y;
        if (X < x0 || X > x1 || Y < y0 || Y > y1) continue;
        const si = (y * nw + x) * 4, di = (Y * W + X) * 4;
        for (let k = 0; k < 4; k++) ov[di + k] = scaled[si + k]!;
      }
      await sharp(ov, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(BAS_CIKTI, `${name}.png`));
      const e: Entry = { box, scale: Math.round(s * 100) / 100, head: [head.w, head.h], need: [bw, bh], skin: Math.round(ratio * 100) / 100 };
      if (Math.abs(s - 1) > 0.01) e.uyari = `kafa görseli ${head.w}×${head.h}, gereken ≈${bw}×${bh}: ×${e.scale} en yakın komşuyla ölçeklendi`;
      sprites[name] = e;
    }
  }
  for (const f of fs.readdirSync(BAS_CIKTI)) if (!sprites[f.replace(/\.png$/, '')]) fs.unlinkSync(path.join(BAS_CIKTI, f));
  fs.writeFileSync(BAS_JSON, JSON.stringify({ note: 'Görev K22: npm run soy-bas üretir; elle düzenlenmez. sprites: kafa kaplaması uygulanan jetonlar (box: kafa kutusu x0,y0,x1,y1; scale: kafa görselinin ölçeği; head: görselin opak boyutu; need: kutu boyutu; skin: kutuda ten oranı). atlanan: neden. Kaplama görseli public/characters/bas/<jeton>.png.', sprites, atlanan, uyarilar }, null, 1) + '\n');
  for (const u of uyarilar) console.warn(`UYARI kafa kaplaması: ${u}`);
  console.log(`kafa kaplaması: ${Object.keys(sprites).length} jeton, ${Object.keys(atlanan).length} atlandı`);
  return { sprites, atlanan, uyarilar };
}


/** Betikler için: jetonun kafa kaplaması (data/soy-bas.json + public/characters/bas/<jeton>.png); yoksa null. */
export async function basOverlay(name: string): Promise<{ ov: Uint8ClampedArray; box: [number, number, number, number] } | null> {
  if (!fs.existsSync(BAS_JSON)) return null;
  const e = (JSON.parse(fs.readFileSync(BAS_JSON, 'utf8')) as { sprites: Record<string, Entry> }).sprites[name];
  const f = path.join(BAS_CIKTI, `${name}.png`);
  if (!e || !fs.existsSync(f)) return null;
  const { data } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { ov: new Uint8ClampedArray(data), box: e.box };
}
