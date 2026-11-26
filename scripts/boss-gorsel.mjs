// BOSS-GORSEL-1: Mühür Ruhu yaratık görselleri (30) → public/boss/<kimlik>.webp + data/boss-gorsel.json + kontrol sayfaları.
//   node scripts/boss-gorsel.mjs [--kaynak <klasör>] [--kuru] [--kimlik a,b]
// Kaynak varsayılan assets-ham/boss/ (depo dışı; ana checkout'ta). Dosya adı büyük/küçük harf fark etmez (Kongark.jpg → kongark).
// Zemin: her görselin dört köşesinden ayrı örneklenir (sabit macenta varsayılmaz), köşeler arası çift doğrusal karışımla yerel zemin
// (hafif gradyanlı macentada da). Saydamlık yalnız kenardan erişilen zemin benzeri bölgede (iç pembe/macenta tonlar korunur) ve
// zemine çok yakın, yeterince büyük iç boşluklarda. Yarı saydam kenarda renk zeminden ayrıştırılır (dekontaminasyon, erozyon yok).
// Zemine yakın renkli küçük yalıtılmış parçalar (pembe hale, kırıntı) atılır; zeminden uzak koyu/parlak parçalar (kristal, kıvılcım)
// korunur. Ölçek veride (Sv.1 0.25, Sv.2 0.6, Sv.3 1), görsele gömülmez.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const SRC = opt('--kaynak') ?? 'assets-ham/boss';
const DRY = args.includes('--kuru');
const ONLY = opt('--kimlik')?.split(',');
const OUT = 'public/boss';
const KONTROL = 'harita/belgeler/boss-gorsel-kontrol';
const CIZGI = {
  ates: ['cim', 'cimbom', 'cimbombom'], soguk: ['doggie', 'wolfie', 'wolfgang'], yildirim: ['sparkle', 'thunderse', 'stormer'],
  gurultu: ['twinkle', 'gongi', 'gongar'], asit: ['hydrop', 'hydras', 'hydraxe'], zehir: ['sporlet', 'mothcoon', 'mothraq'],
  isilti: ['lumbo', 'lighty', 'lightaur'], nekrotik: ['cerbit', 'cerbedo', 'cerbones'], psisik: ['mirit', 'mirath', 'mirage'],
  kuvvet: ['kongcuk', 'kongilla', 'kongark'],
};
const OLCEK = { 1: 0.25, 2: 0.6, 3: 1 };
const WORK = 1024; // işlem boyu (uzun kenar)
const OUT_H = 512; // çıktı uzun kenarı

const files = Object.fromEntries(fs.readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).map((f) => [f.replace(/\.[^.]+$/, '').toLowerCase(), f]));

function cornerColors(px, w, h) {
  const k = Math.max(6, Math.round(Math.min(w, h) * 0.02));
  const at = (x0, y0) => {
    const rs = [], gs = [], bs = [];
    for (let y = y0; y < y0 + k; y++) for (let x = x0; x < x0 + k; x++) { const i = (y * w + x) * 4; rs.push(px[i]); gs.push(px[i + 1]); bs.push(px[i + 2]); }
    const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
    const c = [med(rs), med(gs), med(bs)];
    let v = 0; for (let j = 0; j < rs.length; j++) v += (rs[j] - c[0]) ** 2 + (gs[j] - c[1]) ** 2 + (bs[j] - c[2]) ** 2;
    return { c, sd: Math.sqrt(v / rs.length) };
  };
  return [at(0, 0), at(w - k, 0), at(0, h - k), at(w - k, h - k)];
}
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

async function processOne(id) {
  const file = files[id];
  if (!file) return { id, yok: true };
  const raw = sharp(path.join(SRC, file)).removeAlpha();
  const meta = await raw.metadata();
  const scale = Math.min(1, WORK / Math.max(meta.width, meta.height));
  const w = Math.round(meta.width * scale), h = Math.round(meta.height * scale);
  const { data: rgb } = await sharp(path.join(SRC, file)).removeAlpha().resize(w, h).raw().toBuffer({ resolveWithObject: true });
  const px = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { px[i * 4] = rgb[i * 3]; px[i * 4 + 1] = rgb[i * 3 + 1]; px[i * 4 + 2] = rgb[i * 3 + 2]; px[i * 4 + 3] = 255; }
  const cs = cornerColors(px, w, h);
  const [tl, tr, bl, br] = cs.map((x) => x.c);
  const noise = Math.max(...cs.map((x) => x.sd));
  const bgAt = (x, y, out) => {
    const u = x / (w - 1), v = y / (h - 1);
    for (let c = 0; c < 3; c++) out[c] = (tl[c] * (1 - u) + tr[c] * u) * (1 - v) + (bl[c] * (1 - u) + br[c] * u) * v;
    return out;
  };
  const T0 = Math.max(28, noise * 2.5), T1 = T0 + 55; // tam zemin < T0 ≤ geçiş < T1 ≤ tam opak
  const dist = new Float32Array(w * h);
  const B = [0, 0, 0];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    bgAt(x, y, B); const i = (y * w + x) * 4;
    dist[y * w + x] = Math.hypot(px[i] - B[0], px[i + 1] - B[1], px[i + 2] - B[2]);
  }
  // Kenardan erişilen zemin benzeri bölge (d < T1), 4 komşu taşma.
  const outside = new Uint8Array(w * h);
  const stack = [];
  const seed = (x, y) => { const j = y * w + x; if (!outside[j] && dist[j] < T1) { outside[j] = 1; stack.push(j); } };
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
  while (stack.length) {
    const j = stack.pop(); const x = j % w, y = (j / w) | 0;
    if (x > 0) seed(x - 1, y); if (x < w - 1) seed(x + 1, y); if (y > 0) seed(x, y - 1); if (y < h - 1) seed(x, y + 1);
  }
  // İç boşluklar: zemine çok yakın (d < T0) ve en az 0,05 % alan kaplayan bileşenler de zemin.
  const seen = new Uint8Array(w * h); let holes = 0;
  for (let j0 = 0; j0 < w * h; j0++) {
    if (outside[j0] || seen[j0] || dist[j0] >= T0) continue;
    const comp = []; const st = [j0]; seen[j0] = 1;
    while (st.length) { const j = st.pop(); comp.push(j); const x = j % w, y = (j / w) | 0;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) { if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const k = ny * w + nx; if (!seen[k] && !outside[k] && dist[k] < T0) { seen[k] = 1; st.push(k); } } }
    // Zemine çok yakın (d < T0) kapalı boşluk (kaburga arası, kristaller arası): 12 px'ten büyükse zemin; çevresindeki
    // geçiş pikselleri (d < T1) de zemine taşar.
    if (comp.length >= 12) { holes++; for (const j of comp) { outside[j] = 1; stack.push(j); } }
  }
  while (stack.length) {
    const j = stack.pop(); const x = j % w, y = (j / w) | 0;
    if (x > 0) seed(x - 1, y); if (x < w - 1) seed(x + 1, y); if (y > 0) seed(x, y - 1); if (y < h - 1) seed(x, y + 1);
  }
  // Gölgeli kapalı boşluklar (kaburga arası koyu macenta gibi): zeminin tonunda, doygun (macentada min(R,B) − G > 80, |R − B| < 70)
  // ve 12 px'ten büyük kapalı bileşen saydam; çevresindeki daha az doygun geçiş (> 50) tona göre yarı saydam. Pembe ama doygun
  // olmayan çizim renkleri (hidra kuyruğu tonları) bu ölçüte girmez.
  const bgM = [0, 1, 2].map((c) => (tl[c] + tr[c] + bl[c] + br[c]) / 4);
  const KH = [0, 1, 2].filter((c) => bgM[c] > 128), OH = [0, 1, 2].filter((c) => bgM[c] <= 128);
  const hueSpill = (j) => { const i = j * 4; if (!KH.length || !OH.length) return 0; const ks = KH.map((c) => px[i + c]);
    return (Math.max(...ks) - Math.min(...ks) < 70) ? Math.min(...ks) - Math.max(...OH.map((c) => px[i + c])) : 0; };
  const shade = new Float32Array(w * h).fill(-1);
  const seen2 = new Uint8Array(w * h); let shadeHoles = 0;
  for (let j0 = 0; j0 < w * h; j0++) {
    if (outside[j0] || seen2[j0] || hueSpill(j0) <= 80) continue;
    const comp = []; const st = [j0]; seen2[j0] = 1;
    while (st.length) { const j = st.pop(); comp.push(j); const x = j % w, y = (j / w) | 0;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) { if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const k = ny * w + nx; if (!seen2[k] && !outside[k] && hueSpill(k) > 50) { seen2[k] = 1; st.push(k); } } }
    // İnce halka (çizgi ile zemin arasındaki koyu macenta kenar) değil, geniş gölgeli boşluk olmalı: 3×3 komşuluğunun hepsi
    // doygun olan "çekirdek" piksel en az 15.
    let core = 0;
    for (const j of comp) {
      const x = j % w, y = (j / w) | 0; if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1 || hueSpill(j) <= 80) continue;
      let all = true; for (let dy = -1; dy <= 1 && all; dy++) for (let dx = -1; dx <= 1; dx++) if (hueSpill((y + dy) * w + x + dx) <= 50) { all = false; break; }
      if (all) core++;
    }
    if (core < 15) continue;
    shadeHoles++;
    for (const j of comp) { const sp = hueSpill(j); shade[j] = sp >= 90 ? 0 : 1 - (sp - 50) / 40; }
  }
  for (let j = 0; j < w * h; j++) if (shade[j] >= 0) { const i = j * 4; px[i + 3] = Math.round(255 * shade[j]); }
  holes += shadeHoles;
  // Saydamlık + dekontaminasyon.
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const j = y * w + x, i = j * 4;
    if (!outside[j]) continue;
    const d = dist[j];
    const a = d <= T0 ? 0 : d >= T1 ? 1 : (d - T0) / (T1 - T0);
    if (a <= 0) { px[i + 3] = 0; continue; }
    bgAt(x, y, B);
    for (let c = 0; c < 3; c++) px[i + c] = Math.max(0, Math.min(255, (px[i + c] - (1 - a) * B[c]) / a));
    px[i + 3] = Math.round(a * 255);
  }
  // Kenar renk sızıntısı (despill): saydama 3 px yakın piksellerde zeminin baskın kanallarının fazlası bastırılır (macenta zeminde
  // min(R,B) − G, yeşil zeminde G − max(R,B)). Erozyon yok; çizgi kalınlığı aynı. İç renkler (kenardan uzak) dokunulmaz.
  const bgMean = [0, 1, 2].map((c) => (tl[c] + tr[c] + bl[c] + br[c]) / 4);
  const K = [0, 1, 2].filter((c) => bgMean[c] > 128), O = [0, 1, 2].filter((c) => bgMean[c] <= 128);
  const spillOf = (i) => (K.length && O.length ? Math.min(...K.map((c) => px[i + c])) - Math.max(...O.map((c) => px[i + c])) : 0);
  const band = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (px[(y * w + x) * 4 + 3] >= 128) continue;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h) band[ny * w + nx] = 1; }
  }
  let leak = 0, edge = 0;
  for (let j = 0; j < w * h; j++) {
    const i = j * 4;
    if (!band[j] || px[i + 3] === 0) continue;
    edge++;
    const sp = spillOf(i);
    if (sp > 0) { for (const c of K) px[i + c] = Math.max(0, px[i + c] - sp); }
    if (spillOf(i) > 30) leak++;
  }
  // Küçük yalıtılmış parçalar: alan < %0,15 ve ortalama zemin uzaklığı < T1 + 40 (pembe hale/kırıntı) → sil. Diğerleri kalır.
  const lab = new Int32Array(w * h).fill(-1); let removed = 0, kept = 0;
  const comps = [];
  for (let j0 = 0; j0 < w * h; j0++) {
    if (lab[j0] >= 0 || px[j0 * 4 + 3] < 24) continue;
    const comp = []; const st = [j0]; lab[j0] = comps.length;
    while (st.length) { const j = st.pop(); comp.push(j); const x = j % w, y = (j / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const k = ny * w + nx; if (lab[k] < 0 && px[k * 4 + 3] >= 24) { lab[k] = comps.length; st.push(k); } } }
    comps.push(comp);
  }
  const biggest = Math.max(...comps.map((c) => c.length));
  for (const comp of comps) {
    if (comp.length === biggest) continue;
    const md = comp.reduce((n, j) => n + dist[j], 0) / comp.length;
    if (comp.length < w * h * 0.0015 && md < T1 + 40) { removed++; for (const j of comp) px[j * 4 + 3] = 0; }
    else kept++;
  }
  // Kırp, küçült, yaz.
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const pad = 4; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const img = sharp(Buffer.from(px.buffer), { raw: { width: w, height: h, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 });
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const k = Math.min(1, OUT_H / Math.max(cw, ch));
  const ow = Math.round(cw * k), oh = Math.round(ch * k);
  const webp = await img.resize(ow, oh).webp({ quality: 90, alphaQuality: 100 }).toBuffer();
  if (!DRY) { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, `${id}.webp`), webp); }
  const kenarSizinti = edge ? leak / edge : 0;
  return {
    id, file, ham: [meta.width, meta.height], cikti: [ow, oh], zemin: hex(cs.map((x) => x.c).reduce((a, c) => a.map((v, i) => v + c[i] / 4), [0, 0, 0])),
    koseler: cs.map((x) => hex(x.c)), gurultu: Math.round(noise), esik: [Math.round(T0), Math.round(T1)], icBosluk: holes,
    silinenParca: removed, kalanParca: kept, kenarSizinti: Number(kenarSizinti.toFixed(3)), webp,
  };
}

const ids = Object.values(CIZGI).flat().filter((id) => !ONLY || ONLY.includes(id));
const rows = [];
for (const id of ids) { const r = await processOne(id); rows.push(r); console.log(id, r.yok ? 'YOK' : `${r.cikti.join('x')} zemin ${r.zemin} sızıntı ${r.kenarSizinti} silinen ${r.silinenParca}`); }

// data/boss-gorsel.json
const kademeOf = (id) => { for (const ids3 of Object.values(CIZGI)) { const i = ids3.indexOf(id); if (i >= 0) return i + 1; } return 0; };
const cizgiOf = (id) => Object.entries(CIZGI).find(([, v]) => v.includes(id))?.[0];
if (!DRY && !ONLY) {
  const out = {
    _not: 'BOSS-GORSEL-1: Mühür Ruhu yaratık görselleri; scripts/boss-gorsel.mjs üretir (kaynak depo dışı assets-ham/boss/), elle düzenlenmez. `dosya` public/ altındaki yol; görsel yoksa null (jeton yedek görünüme düşer). `olcek`: jeton görsel boyutu boss yüksekliğine göre (Sv.1 0.25, Sv.2 0.6, Sv.3 1); görsele gömülmez. Kontrol: harita/belgeler/BOSS-GORSEL-KONTROL.md.',
    olcek: OLCEK,
    gorseller: Object.fromEntries(rows.map((r) => [r.id, r.yok ? { dosya: null, kademe: kademeOf(r.id), cizgi: cizgiOf(r.id), olcek: OLCEK[kademeOf(r.id)] } : {
      dosya: `boss/${r.id}.webp`, kademe: kademeOf(r.id), cizgi: cizgiOf(r.id), olcek: OLCEK[kademeOf(r.id)],
      boyut: r.cikti, hamBoyut: r.ham, zemin: r.zemin,
    }])),
  };
  fs.writeFileSync('data/boss-gorsel.json', JSON.stringify(out, null, 2) + '\n');
}

// Kontrol sayfaları: çizgi başına bir satır (ham | sonuç damalı | sonuç koyu), 5 çizgi bir sayfada.
if (!DRY) {
  fs.mkdirSync(KONTROL, { recursive: true });
  const TH = 140, GAP = 6;
  const checker = async (wd, ht) => {
    const s = 12, buf = Buffer.alloc(wd * ht * 3);
    for (let y = 0; y < ht; y++) for (let x = 0; x < wd; x++) { const v = ((x / s | 0) + (y / s | 0)) % 2 ? 200 : 245; buf.fill(v, (y * wd + x) * 3, (y * wd + x) * 3 + 3); }
    return sharp(buf, { raw: { width: wd, height: ht, channels: 3 } }).png().toBuffer();
  };
  const cell = async (r) => {
    const rawT = await sharp(path.join(SRC, r.file)).resize({ height: TH }).png().toBuffer();
    const rawW = (await sharp(rawT).metadata()).width;
    const res = await sharp(r.webp).resize({ height: TH, width: TH, fit: 'inside' }).png().toBuffer();
    const rm = await sharp(res).metadata();
    const chk = await sharp(await checker(TH, TH)).composite([{ input: res, left: Math.round((TH - rm.width) / 2), top: Math.round((TH - rm.height) / 2) }]).png().toBuffer();
    const dark = await sharp({ create: { width: TH, height: TH, channels: 3, background: '#20232a' } }).composite([{ input: res, left: Math.round((TH - rm.width) / 2), top: Math.round((TH - rm.height) / 2) }]).png().toBuffer();
    return { parts: [[rawT, rawW], [chk, TH], [dark, TH]], w: rawW + 2 * TH + 2 * GAP };
  };
  const lines = Object.entries(CIZGI);
  for (let p = 0; p < 2; p++) {
    const slice = lines.slice(p * 5, p * 5 + 5);
    const comps = []; let maxW = 0; let y = GAP;
    for (const [, idsL] of slice) {
      let x = GAP;
      for (const id of idsL) {
        const r = rows.find((q) => q.id === id); if (!r || r.yok) continue;
        const c = await cell(r);
        for (const [buf, wd] of c.parts) { comps.push({ input: buf, left: x, top: y }); x += wd + GAP; }
        x += GAP * 3;
      }
      maxW = Math.max(maxW, x); y += TH + GAP * 2;
    }
    await sharp({ create: { width: maxW, height: y, channels: 3, background: '#ffffff' } }).composite(comps).jpeg({ quality: 82 }).toFile(path.join(KONTROL, `sayfa-${p + 1}.jpg`));
  }
  fs.writeFileSync(path.join(KONTROL, 'olcum.json'), JSON.stringify(rows.map(({ webp, ...r }) => r), null, 1) + '\n');
}
