// Dragonborn pul bölgesi maskesi (beyaz taban jetonlar): `npx vite-node scripts/soy-maske-dragonborn.ts [jeton...]`
// Yöntem (a + c): baş bölgesindeki pul renginden palet; palete yakın pikseller aday; 3×3 kapatma + küçük delik doldurma; bağlı bileşenler:
//   baş bileşeni (tohum) yalnız baş bölgesi + boyun (bbox'ın üst %`GOVDE_Y`'si) kadar, kuyruk (alt yarıda, yan kenara yakın, ince/uzun) ve
//   küçük eller (küçük bileşen) kalır; büyük gövde bileşenleri (beyaz pelerin, gümüş zırh) atılır. Elle düzeltme: data/soy-maske-dragonborn-el.json
//   (jeton → { yok: true } | { dahil: [[x0,y0,x1,y1]], haric: [[...]] }, 256 px koordinat). Çıktı public/characters/maske/<jeton>.png,
//   rapor data/soy-maske-dragonborn-rapor.json (piksel sayısı, bileşen sayıları).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { rgbToLab, deltaE } from '../src/ui/color';
import { CHAR, OTO as OUT, ROOT } from './soy-maske-yollar';

const EL = path.join(ROOT, 'data/soy-maske-dragonborn-el.json');
const el: Record<string, { yok?: boolean; dahil?: number[][]; haric?: number[][] }> = fs.existsSync(EL) ? JSON.parse(fs.readFileSync(EL, 'utf8')).jetonlar ?? {} : {};
const P = { th: 10, bas: 0.42, boyun: 0.52, kuyrukY: 0.45, kuyrukYan: 0.34, elMax: 0.035 };
const inBox = (x: number, y: number, b: number[]) => x >= b[0]! && y >= b[1]! && x <= b[2]! && y <= b[3]!;

export async function maskOf(name: string): Promise<{ mask: Uint8Array; W: number; H: number; info: Record<string, number> }> {
  const { data, info } = await sharp(path.join(CHAR, `${name}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const lab: Array<[number, number, number]> = new Array(N);
  let x0 = W, x1 = 0, y0 = H, y1 = 0, opaque = 0;
  for (let i = 0; i < N; i++) {
    lab[i] = rgbToLab(data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!);
    if (data[i * 4 + 3]! < 128) continue;
    opaque++;
    const x = i % W, y = (i / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const bh = y1 - y0 + 1, bw = x1 - x0 + 1;
  const empty = new Uint8Array(N);
  const rule = el[name];
  if (rule?.yok) return { mask: empty, W, H, info: { opaque, yok: 1 } };
  // palet: baş bölgesinin açık, düşük kromalı pikselleri (k-means, k=4)
  const headY = y0 + bh * P.bas;
  const pts: Array<[number, number, number]> = [];
  for (let i = 0; i < N; i++) {
    if (data[i * 4 + 3]! < 128) continue;
    const x = i % W, y = (i / W) | 0;
    if (y > headY || x < x0 + bw * 0.2 || x > x1 - bw * 0.2) continue;
    const l = lab[i]!; if (l[0] >= 55 && Math.hypot(l[1], l[2]) <= 28) pts.push(l);
  }
  if (pts.length < 40) return { mask: empty, W, H, info: { opaque, tohum: 0 } };
  const sorted = [...pts].sort((p, q) => p[0] - q[0]), k = 4;
  let cen = Array.from({ length: k }, (_, j) => [...sorted[Math.floor(((j + 0.5) / k) * sorted.length)]!] as [number, number, number]);
  const cnt = new Array(k).fill(0);
  for (let it = 0; it < 12; it++) {
    const sum = cen.map(() => [0, 0, 0, 0]);
    for (const p of pts) { let b = 0, bd = Infinity; cen.forEach((c, j) => { const d = deltaE(p, c); if (d < bd) { bd = d; b = j; } }); const s = sum[b]!; s[0]! += p[0]; s[1]! += p[1]; s[2]! += p[2]; s[3]!++; }
    cen = sum.map((s, j) => (s[3] ? [s[0]! / s[3]!, s[1]! / s[3]!, s[2]! / s[3]!] : cen[j]!)) as Array<[number, number, number]>;
    sum.forEach((s, j) => { cnt[j] = s[3]; });
  }
  const pal = cen.filter((_, j) => cnt[j] >= pts.length * 0.1);
  let cand = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (data[i * 4 + 3]! >= 128 && Math.min(...pal.map((c) => deltaE(lab[i]!, c))) <= P.th) cand[i] = 1;
  // 3×3 kapatma
  const dil = (a: Uint8Array) => { const o = new Uint8Array(N); for (let i = 0; i < N; i++) if (a[i]) { const x = i % W, y = (i / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) o[yy * W + xx] = 1; } } return o; };
  const ero = (a: Uint8Array) => { const o = new Uint8Array(N); for (let i = 0; i < N; i++) if (a[i]) { const x = i % W, y = (i / W) | 0; let all = true; for (let dy = -1; dy <= 1 && all; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H || !a[yy * W + xx]) { all = false; break; } } if (all) o[i] = 1; } return o; };
  const closed = ero(dil(cand));
  for (let i = 0; i < N; i++) if (closed[i] && data[i * 4 + 3]! >= 128) cand[i] = 1;
  // bileşenler
  const comp = new Int32Array(N).fill(-1); const comps: Array<{ px: number[]; cx: number; cy: number; minX: number; maxX: number; minY: number; maxY: number; head: number }> = [];
  for (let i = 0; i < N; i++) {
    if (!cand[i] || comp[i]! >= 0) continue;
    const id = comps.length, st = [i]; comp[i] = id; const px: number[] = []; let sx = 0, sy = 0, mnx = W, mxx = 0, mny = H, mxy = 0, head = 0;
    while (st.length) {
      const j = st.pop()!; px.push(j); const x = j % W, y = (j / W) | 0; sx += x; sy += y; mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mny = Math.min(mny, y); mxy = Math.max(mxy, y);
      if (y <= headY && x >= x0 + bw * 0.2 && x <= x1 - bw * 0.2) head++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const kk = yy * W + xx; if (cand[kk] && comp[kk]! < 0) { comp[kk] = id; st.push(kk); } }
    }
    comps.push({ px, cx: sx / px.length, cy: sy / px.length, minX: mnx, maxX: mxx, minY: mny, maxY: mxy, head });
  }
  let seed = -1; comps.forEach((c, j) => { if (c.head > 0 && (seed < 0 || c.head > comps[seed]!.head)) seed = j; });
  const mask = new Uint8Array(N); let nHead = 0, nTail = 0, nHand = 0, drop = 0;
  const bodyY = y0 + bh * P.boyun;
  comps.forEach((c, j) => {
    const area = c.px.length;
    const side = Math.min(c.cx - x0, x1 - c.cx) / bw;          // yana uzaklık (0 = kenar)
    const lowHalf = (c.cy - y0) / bh >= P.kuyrukY;
    const isHead = j === seed, isTail = !isHead && lowHalf && side <= P.kuyrukYan && area >= 40, isHand = !isHead && !isTail && area >= 6 && area <= opaque * P.elMax;
    if (!isHead && !isTail && !isHand) { drop += area; return; }
    for (const i of c.px) { const y = (i / W) | 0; if (isHead && y > bodyY) continue; mask[i] = 1; }
    if (isHead) nHead++; else if (isTail) nTail++; else nHand++;
  });
  for (let i = 0; i < N; i++) { const x = i % W, y = (i / W) | 0; if (rule?.dahil?.some((b) => inBox(x, y, b)) && data[i * 4 + 3]! >= 128) mask[i] = 1; if (rule?.haric?.some((b) => inBox(x, y, b))) mask[i] = 0; }
  let n = 0; for (let i = 0; i < N; i++) if (mask[i]) n++;
  return { mask, W, H, info: { opaque, n, nHead, nTail, nHand, drop } };
}

{
  const only = process.argv.slice(2);
  const names = fs.readdirSync(CHAR).filter((f) => /^dragonborn-(erkek|kadin)-.*\.webp$/.test(f)).map((f) => f.replace('.webp', '')).filter((n) => !only.length || only.includes(n));
  const repF = path.join(ROOT, 'data/soy-maske-dragonborn-rapor.json');
  const rep: Record<string, Record<string, number>> = fs.existsSync(repF) && only.length ? JSON.parse(fs.readFileSync(repF, 'utf8')).jetonlar : {};
  for (const name of names) {
    const { mask, W, H, info } = await maskOf(name);
    rep[name] = info;
    const out = path.join(OUT, `${name}.png`);
    if ((info.n ?? 0) < 30) { fs.rmSync(out, { force: true }); continue; }
    const buf = Buffer.alloc(W * H); for (let i = 0; i < W * H; i++) buf[i] = mask[i] ? 255 : 0;
    await sharp(buf, { raw: { width: W, height: H, channels: 1 } }).png({ palette: true, colours: 2, compressionLevel: 9 }).toFile(out);
  }
  fs.writeFileSync(repF, JSON.stringify({ not: 'scripts/soy-maske-dragonborn.ts: Dragonborn pul bölgesi maskesi (piksel sayıları; n < 30: maske yok).', jetonlar: rep }, null, 1) + '\n');
  console.log(names.length, 'jeton; maskesiz', names.filter((n) => (rep[n]?.n ?? 0) < 30).length);
}
