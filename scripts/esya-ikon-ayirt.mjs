// Görev ESYA-IKON-AYIRT (yalnız görünüm): SRD üst kimliğinden aynı ikonu paylaşan varyant kayıtlarına ayırt edici ikon üretir.
// Veri data/esya-ikon-ayirt.json (gruplar, renkler, glif/işaret oranları; kodda sabit yok). Taban ikon <tabanKlasor>/<taban>.webp (256) ve
// <tabanKlasor>/kucuk/<taban>.webp (96): `npm run esya-ikon` yazar (üst kimlik oyun kaydı değil, public/esya'da yok). Çıktı
// public/esya/<kimlik>.webp + kucuk/<kimlik>.webp; yalnız verideki kayıtlara, kendi hücresi (gerçek çizimi) olan kayda dokunmadan.
// Taban hiç değişmediği için çıktı her çalıştırmada aynıdır (idempotent).
// Kullanım: npm run esya-ikon:ayirt [-- --kuru] [-- --onizleme <png>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
// İkon hattı (esya-ikon.mjs) statik içe aktarılmaz: hat bu modülü kendi main'inden çağırır (döngüsel bekleme olurdu); bağımsız
// çalıştırmada dinamik yüklenir ve `hat` olarak verilir.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const veriOku = (root = ROOT) => JSON.parse(fs.readFileSync(path.join(root, 'data/esya-ikon-ayirt.json'), 'utf8'));

/** Verideki hedef kayıtlar: [{ id, grup, hasar?, renk, glif }] (grup sırasıyla). */
export function hedefler(veri) {
  const out = [];
  for (const g of veri.gruplar) {
    if (g.turler) for (const t of g.turler) out.push({ id: `${g.onek}${t}`, grup: g, hasar: t, renk: g.tur === 'zayiflik' ? g.ton : veri.hasarRenk[t], glif: t });
    for (const [id, u] of Object.entries(g.uyeler ?? {})) out.push({ id, grup: g, ...u });
  }
  return out;
}

const dosyaAdi = (id) => id.replace(/\//g, '--');

/**
 * Kendi hücresi (gerçek çizimi) olan kayıtlar: ikon hattının bağlama çıktısında (`cikti`: kimlik → konum) kopya olmayanlar.
 */
export function gercekCizimler(cikti) {
  return { kendi: new Set([...cikti].filter(([, k]) => !k.kopya).map(([id]) => id)), bagli: new Set(cikti.keys()) };
}

/** Bağımsız çalıştırmada ikon hattının bağlama çıktısı (ham sayfalar yoksa bütün sayfalar var sayılır; yalnız manifest okunur). */
async function hatCiktisi(root) {
  const h = await import('./esya-ikon.mjs');
  const kayitlar = h.oyunKayitlari(root);
  const manifest = h.esle(JSON.parse(fs.readFileSync(path.join(root, 'data/esya-ikon-sayfalar.json'), 'utf8')), kayitlar).manifest;
  const ham = path.join(root, 'assets-ham/esya');
  const varMi = fs.existsSync(ham) ? (d) => fs.existsSync(path.join(ham, d)) : () => true;
  return { BUYUK: h.BUYUK, KUCUK: h.KUCUK, cikti: h.bagla(h.plan(manifest, varMi).son, kayitlar).cikti };
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
function rgb2hsl(r, g, b) {
  const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const l = (mx + mn) / 2; const d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hsl2rgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s; const x = c * (1 - Math.abs(((h / 60) % 2) - 1)); const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r + m, g + m, b + m];
}
const adim = (a, b, x) => (b <= a ? (x >= a ? 1 : 0) : Math.min(1, Math.max(0, (x - a) / (b - a))));

/**
 * Seçici ton: doygunluğu `doygunlukMin`…`doygunlukMax` aralığında artan (ve `parlaklikMin` üstü) piksellerin tonu hedef renge döner,
 * doygunluk hedefe yaklaşır, parlaklık korunur; `guc` karışım oranı. Metal/gri gövde değişmez.
 */
async function tonla(buf, renk, secici, guc) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [th, ts] = rgb2hsl(...hex(renk));
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const r = data[i] / 255; const g = data[i + 1] / 255; const b = data[i + 2] / 255;
    const [, s, l] = rgb2hsl(r, g, b);
    let w = adim(secici.doygunlukMin, secici.doygunlukMax, s) * guc;
    if (secici.parlaklikMin != null) w *= adim(secici.parlaklikMin, secici.parlaklikMin + 0.12, l);
    if (w <= 0) continue;
    const [nr, ng, nb] = hsl2rgb(th, Math.max(0, Math.min(1, s + (ts - s) * 0.75)), l);
    data[i] = Math.round((r + (nr - r) * w) * 255); data[i + 1] = Math.round((g + (ng - g) * w) * 255); data[i + 2] = Math.round((b + (nb - b) * w) * 255);
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

/** Köşe konumu (sol-ust, sag-ust, sol-alt, sag-alt). */
const kose = (k, S, n, pay) => ({ left: k.startsWith('sol') ? pay : S - n - pay, top: k.endsWith('ust') ? pay : S - n - pay });

/** Zayıflık işareti: kırmızı daire, beyaz aşağı ok (yazıtipine bağlı değil). */
const zayiflikIsaret = (n, renk) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="0 0 100 100">
<circle cx="50" cy="50" r="46" fill="${renk}" stroke="#111418" stroke-width="7"/><path d="M50 80 L22 46 H39 V20 H61 V46 H78 Z" fill="#ffffff" stroke="#111418" stroke-width="4" stroke-linejoin="round"/></svg>`);

/** Bir boyutta (256 ya da 96) ayırt ikonu. */
async function uret(veri, h, taban, S, kucukMu) {
  const g = h.grup;
  const img = await tonla(taban, h.renk, g.secici, g.guc);
  const ust = [];
  const n = Math.round(S * (kucukMu ? veri.glif.kucukOran : veri.glif.oran));
  const glif = await sharp(path.join(ROOT, 'public/glif', `${h.glif}.webp`)).resize(n, n, { kernel: 'lanczos3' }).png().toBuffer();
  ust.push({ input: glif, ...kose(g.kose, S, n, Math.round(S * veri.glif.kenar)) });
  if (g.isaret) {
    const m = Math.round(S * (kucukMu ? veri.isaret.kucukOran : veri.isaret.oran));
    ust.push({ input: zayiflikIsaret(m, g.isaret.renk), ...kose(g.isaret.kose, S, m, Math.round(S * veri.isaret.kenar)) });
  }
  return sharp(img).resize(S, S).composite(ust).webp({ quality: 88, alphaQuality: 100, effort: 5 }).toBuffer();
}

/**
 * Bütün hedefleri üret ve yaz. `hat`: { BUYUK, KUCUK, cikti } (ikon hattından; yoksa yüklenir). `tabanlar` (isteğe bağlı): taban
 * kimliği → { buyuk, kucuk } (ikon hattı bellekten verir); yoksa tabanKlasor'den okunur. Dönen: { yazilan, atlanan: [kimlik, neden][] }.
 */
export async function ayirt({ root = ROOT, hat, tabanlar = new Map(), kuru = false, log = console.log } = {}) {
  const veri = veriOku(root);
  const { BUYUK, KUCUK, cikti } = hat ?? await hatCiktisi(root);
  const { kendi, bagli } = gercekCizimler(cikti);
  const TB = path.join(root, veri.tabanKlasor);
  const OUT = path.join(root, 'public/esya');
  const tabanOku = (id) => {
    if (tabanlar.has(id)) return tabanlar.get(id);
    const b = path.join(TB, `${dosyaAdi(id)}.webp`); const k = path.join(TB, 'kucuk', `${dosyaAdi(id)}.webp`);
    return fs.existsSync(b) && fs.existsSync(k) ? { buyuk: fs.readFileSync(b), kucuk: fs.readFileSync(k) } : null;
  };
  const atlanan = []; let yazilan = 0;
  for (const h of hedefler(veri)) {
    if (kendi.has(h.id)) { atlanan.push([h.id, 'kendi çizimi var']); continue; }
    if (!bagli.has(h.id)) { atlanan.push([h.id, 'ikon hattında kaydı yok']); continue; }
    const t = tabanOku(h.grup.taban);
    if (!t) { atlanan.push([h.id, `taban yok (${veri.tabanKlasor}/${h.grup.taban}.webp)`]); continue; }
    const buyuk = await uret(veri, h, t.buyuk, BUYUK, false);
    const kucuk = await uret(veri, h, t.kucuk, KUCUK, true);
    yazilan++;
    if (kuru) continue;
    fs.writeFileSync(path.join(OUT, `${dosyaAdi(h.id)}.webp`), buyuk);
    fs.writeFileSync(path.join(OUT, 'kucuk', `${dosyaAdi(h.id)}.webp`), kucuk);
  }
  log(`ayırt: ${yazilan} kayıt yazıldı${kuru ? ' (kuru)' : ''}; atlanan ${atlanan.length}`);
  for (const [id, n] of atlanan) log(`  atlandı: ${id} (${n})`);
  return { yazilan, atlanan };
}

/** İkon hattından: verideki taban kimliklerinin görsellerini tabanKlasor'e yaz (yalnız değişmişse). */
export function tabanYaz(tabanlar, root = ROOT) {
  const veri = veriOku(root);
  const TB = path.join(root, veri.tabanKlasor);
  fs.mkdirSync(path.join(TB, 'kucuk'), { recursive: true });
  for (const id of new Set(veri.gruplar.map((g) => g.taban))) {
    const t = tabanlar.get(id);
    if (!t) continue;
    for (const [f, buf] of [[path.join(TB, `${dosyaAdi(id)}.webp`), t.buyuk], [path.join(TB, 'kucuk', `${dosyaAdi(id)}.webp`), t.kucuk]]) {
      if (!fs.existsSync(f) || !fs.readFileSync(f).equals(buf)) fs.writeFileSync(f, buf);
    }
  }
}

/** Önizleme: her grup bir satır, 256 ve 96 px yan yana (kontrol görseli; depoya girmez). */
async function onizleme(hedef, root = ROOT) {
  const veri = veriOku(root);
  const gruplar = veri.gruplar.map((g) => hedefler(veri).filter((h) => h.grup === g).map((h) => h.id).concat(g.tur === 'kure' ? [g.taban] : []));
  // Her satır: üstte 256 px kopya 128'e küçültülmüş, altta 96 px kopya kendi boyunda (ölçeksiz).
  const C = 132; const K = Math.max(...gruplar.map((g) => g.length));
  const parca = [];
  let y = 10;
  for (const ids of gruplar) {
    for (let i = 0; i < ids.length; i++) {
      parca.push({ input: await sharp(path.join(root, 'public/esya', `${dosyaAdi(ids[i])}.webp`)).resize(128, 128).png().toBuffer(), left: 10 + i * C, top: y });
      parca.push({ input: fs.readFileSync(path.join(root, 'public/esya/kucuk', `${dosyaAdi(ids[i])}.webp`)), left: 10 + i * C + 16, top: y + 130 });
    }
    y += 128 + 96 + 16;
  }
  await sharp({ create: { width: K * C + 20, height: y, channels: 4, background: '#23262c' } }).composite(parca).png({ palette: true, quality: 90, effort: 8 }).toFile(hedef);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--onizleme');
  if (i >= 0) await onizleme(path.resolve(process.argv[i + 1]));
  else await ayirt({ kuru: process.argv.includes('--kuru') });
}
