// Görev KATALOG-IKON-AKTAR-2: katalog ikonlarında otomatik kusur taraması (gözle bakılmaz) ve düzeltme sayfası taslağı.
// Girdi: data/katalog-ikon-sayfalar.json, public/esya/<kimlik>.webp (256 px), assets-ham/esya/<sayfa>.jpg (kaynak hücre kenarı için).
// Çıktı: harita/belgeler/KATALOG-IKON-KUSUR.md (sayfa, hücre, kimlik, kusur türü, ölçü). --duzeltme: kusurlu hücrelerden 4 × 4
// katalog-duzeltme-NN sayfaları (manifestte en sona; eskileri yeniden yazılır) + harita/belgeler/KATALOG-IKON-DUZELTME.md promptları.
// Sezgi (KUSUR eşikleri; eşiğin yarısı ile eşik arası "belirsiz"):
//   leylak/pembe hale: dış kenar bandında (saydama ≤ 3 px, α ≥ 30) macenta fazlası min(R, B) − G ≥ 25 ya da despill sonrası leylak
//     (B − G ≥ 40, R − G ≥ −10, R ≥ 110) piksel oranı.
//   somon hale: aynı bantta açık kırmızı-pembe (R ≥ 170, G ≥ 110, R − G ≥ 45, R − B ≥ 45, |G − B| ≤ 35) oranı.
//   macenta cep: bant dışı opak (α ≥ 200) zemin ailesi pikseli (G ≤ 0,2·min(R, B), min(R, B) ≥ 50, |R − B| ≤ 0,3·max) sayısı.
//   sis: görünen piksellerde α < 50 oranı (geniş düşük alfalı pus).
//   kenara dayanan parıltı: kaynak hücrenin 4 px kenar şeridinde zemine uzaklığı > 60 piksel oranı (parıltı/nesne hücre sınırında kesik).
// ESYA-IKON-ZEMIN-TEMIZLIK: bütün public/esya (256 ve kucuk/) taraması, ikonun kaynak sayfasının zemin kipine göre (yeşil / macenta):
//   anahtar kalıntısı (opak, saydama BANT'tan uzak; 8 komşu bileşen ≥ ZEMIN_KUSUR.kalintiBilesen, 96 px'te ölçekli):
//     yeşil: G − max(R, B) ≥ 60, ton 70–130°, doygunluk ≥ 0,6, parlaklık ≥ 0,55 (zümrüt ≈ 145°, yaprak koyu: sayılmaz);
//     macenta: G ≤ 0,2·min(R, B), min(R, B) ≥ 50, |R − B| ≤ 0,3·max (pembe/kırmızı taşta G yüksek: sayılmaz).
//   kenar halesi (saydama ≤ BANT, α ≥ 30) oranı: yeşil: G > max(R, B) + 8 ya da ton 58–150°, doygunluk ≥ 0,35, G ≥ 60 (sarı-yeşil, zeytin);
//     macenta: min(R, B) − G ≥ 25 ve R ≥ 120 (pembe/macenta) ya da yarı saydam (α < 240) açık pembe-somon (ton 300–8°, doygunluk
//     0,15–0,5, R ≥ 170);
//     leylak ve mavi parıltı sayılmaz.
//   Kip yalnız ikonun kaynak sayfasından: yeşil sayfanın ikonunda macenta ölçüsü (ve tersi) sayılmaz (meşru pembe/yeşil parıltı).
//   Ayırt (ESYA-IKON-AYIRT) çıktıları taranmaz: tabanları (assets/esya-taban) taranır (hasar tonu meşru yeşil/pembe ekler).
// Kullanım: node scripts/katalog-ikon-kusur.mjs [--kaynak <klasör>] [--duzeltme] [--klasor <public/esya yerine>] [--json <yol>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ANA_MANIFEST, KATALOG_MANIFESTLER, bagla, esle, manifestKimlikleri, oyunKayitlari, plan, sayfaAdi, zeminKipi } from './esya-ikon.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(ROOT, 'data/katalog-ikon-sayfalar.json');
export const DUZELTME_ON = 'katalog-duzeltme-';
export const KUSUR = {
  pembe: { esik: 0.12, ad: 'leylak/pembe hale' },
  somon: { esik: 0.12, ad: 'somon hale' },
  cep: { esik: 40, ad: 'macenta cep' },
  sis: { esik: 0.3, ad: 'sis' },
  kenar: { esik: 0.03, ad: 'kenara dayanan parıltı' },
};
const BANT = 3;
export const ERTELENDI_NOTU = 'ERTELENDİ (kullanıcı kararı 2026-11-26): kontakt incelemesinde yeniden üretim gerekmedi; macenta cep ve komşu taşma betikte düzeltildi (KATALOG-IKON-AKTAR-3). Gemini\'ye şimdi verilmeyecek; sayfalar seçim için manifestte kalır.';

/** 256 px RGBA çıktıdan ölçüler. */
export function ikonOlcu(rgba, w, h) {
  const n = w * h; const a = (i) => rgba[i * 4 + 3];
  // Saydam piksele uzaklık (4 komşu, BANT'a dek).
  const uz = new Uint8Array(n).fill(255); const q = [];
  for (let i = 0; i < n; i++) if (a(i) === 0) { uz[i] = 0; q.push(i); }
  for (let k = 0; k < q.length; k++) {
    const p = q[k]; if (uz[p] >= BANT) continue; const x = p % w;
    for (const r of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p >= w ? p - w : -1, p < n - w ? p + w : -1]) {
      if (r >= 0 && uz[r] === 255) { uz[r] = uz[p] + 1; q.push(r); }
    }
  }
  let bant = 0; let pembe = 0; let somon = 0; let cep = 0; let gorunen = 0; let soluk = 0;
  for (let i = 0; i < n; i++) {
    const al = a(i); if (al === 0) continue;
    const r = rgba[i * 4]; const g = rgba[i * 4 + 1]; const b = rgba[i * 4 + 2];
    gorunen++; if (al < 50) soluk++;
    if (uz[i] <= BANT && al >= 30) {
      bant++;
      // Despill bantta macenta fazlasını sıfırlar: pembe → somon, leylak → R ≈ G ve B baskın (mavi/turkuaz parıltıda R < G kalır).
      if (Math.min(r, b) - g >= 25 || (b - g >= 40 && r - g >= -10 && r >= 110)) pembe++;
      if (r >= 170 && g >= 110 && r - g >= 45 && r - b >= 45 && Math.abs(g - b) <= 35) somon++;
    } else if (uz[i] > BANT && al >= 200) {
      const mn = Math.min(r, b); const mx = Math.max(r, b);
      if (g <= 0.2 * mn && mn >= 50 && mx - mn <= 0.3 * mx) cep++;
    }
  }
  return { pembe: bant ? pembe / bant : 0, somon: bant ? somon / bant : 0, cep, sis: gorunen ? soluk / gorunen : 0 };
}

/** ESYA-IKON-ZEMIN-TEMIZLIK: zemin kalıntısı ve kenar halesi eşikleri (256 px; 96 px'te alan oranıyla ölçeklenir). */
export const ZEMIN_KUSUR = {
  kalinti: { esik: 40, ad: 'anahtar kalıntısı' },
  hale: { esik: 0.1, ad: 'kenar halesi' },
  kalintiBilesen: 12,
};

const hsv = (r, g, b) => {
  const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const c = mx - mn;
  let h = 0;
  if (c) h = mx === r ? 60 * (((g - b) / c) % 6) : mx === g ? 60 * ((b - r) / c + 2) : 60 * ((r - g) / c + 4);
  return [(h + 360) % 360, mx ? c / mx : 0, mx / 255];
};
/** Opak iç pikselde anahtar kalıntısı (kip: 'yesil' | 'macenta'). */
export function kalintiMi(kip, r, g, b) {
  if (kip === 'macenta') { const mn = Math.min(r, b); const mx = Math.max(r, b); return g <= 0.2 * mn && mn >= 50 && mx - mn <= 0.3 * mx; }
  const [h, s, v] = hsv(r, g, b);
  return g - Math.max(r, b) >= 60 && h >= 70 && h <= 130 && s >= 0.6 && v >= 0.55;
}
/** Kenar bandı pikselinde hale. */
export function haleMi(kip, r, g, b, a = 255) {
  if (kip === 'macenta') {
    if (Math.min(r, b) - g >= 25 && r >= 120) return true;
    // Açık pembe-somon (beyaz/krem parıltının macenta üstünde kalan tonu): yalnız yarı saydam halede (opak altın/bronz kenar çizgisi sayılmaz).
    const [h, s] = hsv(r, g, b);
    return a < 240 && (h >= 300 || h <= 8) && s >= 0.15 && s <= 0.5 && r >= 170;
  }
  if (g > Math.max(r, b) + 8) return true;
  const [h, s] = hsv(r, g, b);
  return h >= 58 && h <= 150 && s >= 0.35 && g >= 60; // 58°: eski despill G = R yaptığı zeytin-sarı (≈ 60°) dahil
}

/**
 * ESYA-IKON-ZEMIN-TEMIZLIK ölçüsü: { kalinti: px (bileşen süzgeçli), hale: oran }. Bant = saydama 4 komşu uzaklığı ≤ BANT (α ≥ 30);
 * kalıntı bandın dışındaki opak (α ≥ 200) piksel, en az `bilesen` px'lik 8 komşu bileşende.
 */
export function zeminOlcu(rgba, w, h, kip, bilesen = ZEMIN_KUSUR.kalintiBilesen) {
  const n = w * h; const a = (i) => rgba[i * 4 + 3];
  const uz = new Uint8Array(n).fill(255); const q = [];
  for (let i = 0; i < n; i++) if (a(i) === 0) { uz[i] = 0; q.push(i); }
  for (let k = 0; k < q.length; k++) {
    const p = q[k]; if (uz[p] >= BANT) continue; const x = p % w;
    for (const r of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p >= w ? p - w : -1, p < n - w ? p + w : -1]) {
      if (r >= 0 && uz[r] === 255) { uz[r] = uz[p] + 1; q.push(r); }
    }
  }
  let bant = 0; let hale = 0; const aday = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const al = a(i); if (al === 0) continue;
    const r = rgba[i * 4]; const g = rgba[i * 4 + 1]; const b = rgba[i * 4 + 2];
    if (uz[i] <= BANT) { if (al >= 30) { bant++; if (haleMi(kip, r, g, b, al)) hale++; } } else if (al >= 200 && kalintiMi(kip, r, g, b)) aday[i] = 1;
  }
  let kalinti = 0; const gor = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (!aday[i] || gor[i]) continue;
    const st = [i]; gor[i] = 1; let say = 0;
    while (st.length) {
      const p = st.pop(); say++; const x = p % w; const y = (p - x) / w;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx; const ny = y + dy; const r = ny * w + nx;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && aday[r] && !gor[r]) { gor[r] = 1; st.push(r); }
      }
    }
    if (say >= bilesen) kalinti += say;
  }
  return { kalinti, hale: bant ? hale / bant : 0 };
}

/** Ölçüden zemin kusurları (256 px ölçeğinde; eşiğin yarısı ile eşik arası belirsiz). */
export function zeminKusurlari(olcu, kip) {
  const out = [];
  for (const tur of ['kalinti', 'hale']) {
    const k = ZEMIN_KUSUR[tur]; const v = olcu[tur];
    const ad = `${kip === 'macenta' ? 'macenta/pembe' : 'yeşil/sarı-yeşil'} ${k.ad}`;
    if (v >= k.esik) out.push({ tur, ad, deger: v, kesin: true });
    else if (v >= k.esik / 2) out.push({ tur, ad, deger: v, kesin: false });
  }
  return out;
}

const dosyaOf = (id) => `${id.split('/').join('--')}.webp`;

/**
 * public/esya dosyası → kaynak sayfa adı (ana + katalog manifesti; kopyalar kaynak hücrenin sayfası). Ayırt çıktıları `ayirt` kümesinde.
 */
export async function dosyaSayfalari(root, kaynak) {
  const oku = (y) => JSON.parse(fs.readFileSync(path.join(root, y), 'utf8'));
  const kayitlar = oyunKayitlari(root);
  const katalogHedef = new Set(KATALOG_MANIFESTLER.flatMap((y) => [...manifestKimlikleri(oku(y))]));
  const varMi = (d) => fs.existsSync(path.join(kaynak, d));
  const sayfaOf = new Map();
  for (const y of [ANA_MANIFEST, ...KATALOG_MANIFESTLER]) {
    const { son } = plan(esle(oku(y), kayitlar).manifest, varMi);
    const { cikti } = bagla(son, kayitlar, katalogHedef);
    for (const [id, sn] of cikti) sayfaOf.set(dosyaOf(id), sn.sayfa);
    // Ayırt tabanları (SRD üst kimliği; assets/esya-taban) da hücresinin sayfasından.
    for (const [id, sn] of son) if (!sayfaOf.has(dosyaOf(id))) sayfaOf.set(dosyaOf(id), sn.sayfa);
  }
  const { hedefler, veriOku } = await import('./esya-ikon-ayirt.mjs');
  const ayirt = new Set(hedefler(veriOku(root)).map((h) => dosyaOf(h.id)));
  return { sayfaOf, ayirt };
}

/** Klasör taraması: [{ dosya, boyut ('256' | '96' | 'taban'), sayfa, kip, olcu, kusur }]; kip sayfanın köşe renginden (`kipOf`). */
export async function zeminTara(klasor, sayfaOf, ayirt, kipOf, tabanKlasor) {
  const satir = [];
  const tara = async (dir, boyut, dosyalar) => {
    for (const f of dosyalar) {
      const sayfa = sayfaOf.get(f) ?? null; const kip = sayfa ? kipOf(sayfa) : null;
      if (!kip) { satir.push({ dosya: f, boyut, sayfa, kip: null, olcu: null, kusur: [] }); continue; }
      const { data, info } = await sharp(path.join(dir, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const olcek = (info.width / 256) ** 2;
      const olcu = zeminOlcu(data, info.width, info.height, kip, Math.max(2, Math.round(ZEMIN_KUSUR.kalintiBilesen * olcek)));
      const kusur = zeminKusurlari({ kalinti: olcu.kalinti / olcek, hale: olcu.hale }, kip);
      satir.push({ dosya: f, boyut, sayfa, kip, olcu, kusur });
    }
  };
  const liste = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.webp')).sort() : []);
  await tara(klasor, '256', liste(klasor).filter((f) => !ayirt.has(f)));
  await tara(path.join(klasor, 'kucuk'), '96', liste(path.join(klasor, 'kucuk')).filter((f) => !ayirt.has(f)));
  if (tabanKlasor) await tara(tabanKlasor, 'taban', liste(tabanKlasor));
  return satir;
}

/** Kaynak hücrenin 4 px kenar şeridinde zemine uzaklığı > 60 piksel oranı. */
export function kenarOrani(rgb, W, x0, y0, cw, ch, zemin) {
  let say = 0; let top = 0;
  const bak = (x, y) => { const p = (y * W + x) * 3; top++; if (Math.hypot(rgb[p] - zemin[0], rgb[p + 1] - zemin[1], rgb[p + 2] - zemin[2]) > 60) say++; };
  for (let s = 0; s < 4; s++) {
    for (let x = x0; x < x0 + cw; x++) { bak(x, y0 + s); bak(x, y0 + ch - 1 - s); }
    for (let y = y0 + 4; y < y0 + ch - 4; y++) { bak(x0 + s, y); bak(x0 + cw - 1 - s, y); }
  }
  return say / top;
}

/** Ölçülerden kusur listesi: [{ tur, ad, deger, kesin }] (kesin = eşiği geçti, değilse belirsiz). */
export function kusurlar(olcu) {
  const out = [];
  for (const [tur, k] of Object.entries(KUSUR)) {
    const v = olcu[tur]; if (v == null) continue;
    if (v >= k.esik) out.push({ tur, ad: k.ad, deger: v, kesin: true });
    else if (v >= k.esik / 2) out.push({ tur, ad: k.ad, deger: v, kesin: false });
  }
  return out;
}

function zeminRengi(buf, W, H) {
  const c = [[], [], []];
  for (const [x0, y0] of [[0, 0], [W - 16, 0], [0, H - 16], [W - 16, H - 16]]) for (let y = y0; y < y0 + 16; y++) for (let x = x0; x < x0 + 16; x++) {
    const i = (y * W + x) * 3; for (let k = 0; k < 3; k++) c[k].push(buf[i + k]);
  }
  return c.map((a) => a.sort((p, q) => p - q)[a.length >> 1]);
}

const yuzde = (v) => `%${(v * 100).toFixed(0)}`;
const deger = (k) => (k.tur === 'cep' ? `${k.deger} px` : yuzde(k.deger));

/** Ortak prompt bloğu: KATALOG-IKON-PROMPTLAR.md bölüm 6'daki ```text bloğu (CELLS: satırına dek). */
function ortakBlok() {
  const md = fs.readFileSync(path.join(ROOT, 'harita/belgeler/KATALOG-IKON-PROMPTLAR.md'), 'utf8');
  const bolum = md.slice(md.indexOf('## 6. Ortak üst blok'));
  const blok = /```text\n([\s\S]*?)```/.exec(bolum)[1];
  return blok.slice(0, blok.indexOf('CELLS:')).trimEnd();
}

const PARILTI_SATIRI = '- A magical item may have a thin soft glow hugging its silhouette';
const YENI_KURAL = '- NO outer glow and NO halo of any kind: magical light stays strictly inside the object\'s silhouette (glowing runes, gems, cracks, edges); the background around every object is one flat, uniform pure magenta #FF00FF right up to the dark outline.';

function duzeltmePromptu(ogeler) {
  const n = ogeler.length;
  let blok = ortakBlok().replace('a sprite sheet of 16 fantasy', `a sprite sheet of ${n} fantasy`);
  if (n < 16) blok = blok.replace('in the numbered order below.', `in the numbered order below. Only the first ${n} cells get an object; cells ${n + 1}–16 stay completely empty.`);
  blok = blok.split('\n').map((l) => (l.startsWith(PARILTI_SATIRI) ? YENI_KURAL : l)).join('\n');
  const hucre = ogeler.map((o, i) => `${i + 1}. ${o.gorunum}`);
  if (n < 16) hucre.push(`${n + 1}–16. Empty: plain flat magenta, nothing drawn.`);
  return `${blok}\n\nCELLS:\n${hucre.join('\n')}`;
}

async function main() {
  const arg = (ad) => { const i = process.argv.indexOf(ad); return i >= 0 ? process.argv[i + 1] : undefined; };
  const kaynak = path.resolve(ROOT, arg('--kaynak') ?? 'assets-ham/esya');
  const duzeltme = process.argv.includes('--duzeltme');
  const klasor = path.resolve(ROOT, arg('--klasor') ?? 'public/esya');
  const yazma = process.argv.includes('--yazma-yok');
  const ham = fs.readFileSync(MANIFEST, 'utf8');
  const manifest = JSON.parse(ham);
  const satirlar = []; const kusurlu = []; let taranan = 0; const eksik = [];
  for (const s of manifest.sayfalar) {
    const ad = sayfaAdi(s.dosya);
    if (ad.startsWith(DUZELTME_ON)) continue;
    const yol = path.join(kaynak, s.dosya);
    let src = null;
    if (fs.existsSync(yol)) {
      const { data, info } = await sharp(yol).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      src = { data, W: info.width, H: info.height, zemin: zeminRengi(data, info.width, info.height) };
    }
    for (let i = 0; i < s.ogeler.length; i++) {
      const o = s.ogeler[i]; if (!o?.id) continue;
      const ikon = path.join(klasor, `${o.id}.webp`);
      if (!fs.existsSync(ikon)) { eksik.push(`${ad}#${i + 1} ${o.id}`); continue; }
      taranan++;
      const { data, info } = await sharp(ikon).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const olcu = ikonOlcu(data, info.width, info.height);
      if (src) {
        const cw = Math.floor(src.W / s.kolon); const ch = Math.floor(src.H / s.satir);
        olcu.kenar = kenarOrani(src.data, src.W, (i % s.kolon) * cw, Math.floor(i / s.kolon) * ch, cw, ch, src.zemin);
      }
      const k = kusurlar(olcu);
      for (const x of k) satirlar.push({ sayfa: ad, hucre: i + 1, id: o.id, ...x });
      if (k.some((x) => x.kesin)) kusurlu.push({ sayfa: ad, hucre: i + 1, o, k: k.filter((x) => x.kesin) });
    }
  }
  // ESYA-IKON-ZEMIN-TEMIZLIK: bütün klasör, kaynak sayfanın zemin kipiyle.
  const kipler = new Map();
  for (const sayfa of new Set((await dosyaSayfalari(ROOT, kaynak)).sayfaOf.values())) {
    const f = ['.jpg', '.png', '.webp'].map((u) => path.join(kaynak, sayfa + u)).find((y) => fs.existsSync(y));
    if (!f) continue;
    const { data, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    kipler.set(sayfa, zeminKipi(zeminRengi(data, info.width, info.height)));
  }
  const { sayfaOf, ayirt } = await dosyaSayfalari(ROOT, kaynak);
  const varsayilan = klasor === path.join(ROOT, 'public/esya');
  const zemin = await zeminTara(klasor, sayfaOf, ayirt, (s) => kipler.get(s) ?? null, varsayilan ? path.join(ROOT, 'assets/esya-taban') : null);
  if (arg('--json')) fs.writeFileSync(path.resolve(ROOT, arg('--json')), JSON.stringify(zemin));
  // Manifestlerin `zeminMesru` kaydı (kimlik → gerekçe): gözle denetlenmiş meşru içerik rengi; kusur sayılmaz, ayrı listelenir.
  const mesru = new Map([ANA_MANIFEST, ...KATALOG_MANIFESTLER].flatMap((y) => Object.entries(JSON.parse(fs.readFileSync(path.join(ROOT, y), 'utf8')).zeminMesru ?? {})));
  const mesruMu = (r) => mesru.has(r.dosya.replace(/\.webp$/, '').split('--').join('/'));
  const zMesru = zemin.filter((r) => r.kusur.length && mesruMu(r));
  for (const r of zMesru) r.mesru = true;
  const zKusurlu = zemin.filter((r) => !r.mesru && r.kusur.some((k) => k.kesin));
  const zBelirsiz = zemin.filter((r) => !r.mesru && r.kusur.length && !r.kusur.some((k) => k.kesin));
  const kipsiz = zemin.filter((r) => !r.kip);
  const zSay = (kip, tur) => zKusurlu.filter((r) => r.kip === kip && r.kusur.some((k) => k.tur === tur && k.kesin)).length;
  const zOzet = ['yesil', 'macenta'].map((kip) => `${kip === 'yesil' ? 'yeşil' : 'macenta'}: kalıntı ${zSay(kip, 'kalinti')}, hale ${zSay(kip, 'hale')}`).join('; ');
  const zDeger = (k) => (k.tur === 'kalinti' ? `${Math.round(k.deger)} px` : yuzde(k.deger));
  const yer = (r) => (r.boyut === '256' ? r.dosya : `${r.boyut}/${r.dosya}`);
  console.log(`zemin taraması: ${zemin.length} dosya, kusurlu ${zKusurlu.length} (${zOzet}), belirsiz ${zBelirsiz.length}, kaynak sayfası bilinmeyen ${kipsiz.length}`);
  const zeminMd = [
    '## Bütün public/esya: zemin kalıntısı ve kenar halesi (ESYA-IKON-ZEMIN-TEMIZLIK)',
    '',
    'Taranan: `public/esya` (256), `public/esya/kucuk` (96) ve ayırt tabanları `assets/esya-taban` (ayırt çıktıları, hasar tonu meşru renk',
    'eklediği için taranmaz; tabanından gelir). Ölçü ikonun kaynak sayfasının zemin kipiyle (yeşil sayfada yalnız yeşil/sarı-yeşil, macenta',
    'sayfada yalnız macenta/pembe): anahtar kalıntısı = kenar bandı dışında opak anahtar rengi bileşenleri (256 px ölçeğinde px), kenar',
    `halesi = saydama ≤ 3 px bantta hale rengi oranı. Eşikler: kalıntı ${ZEMIN_KUSUR.kalinti.esik} px, hale ${yuzde(ZEMIN_KUSUR.hale.esik)} (yarısı belirsiz).`,
    '',
    `- Taranan dosya: ${zemin.length}; kaynak sayfası bilinmeyen (ölçülmeyen): ${kipsiz.length ? kipsiz.map(yer).join(', ') : 'yok'}`,
    `- Kusurlu: ${zKusurlu.length} (${zOzet})`,
    `- Belirsiz: ${zBelirsiz.length}`,
    `- Meşru (manifest \`zeminMesru\`, gözle denetlendi; ölçüye takılan dosya ${zMesru.length}):`,
    ...[...new Set(mesru.values())].map((g) => `  - ${g}: ${[...mesru].filter(([, v]) => v === g).map(([k]) => `\`${k}\``).join(', ')}`),
    '',
    ...(zKusurlu.length + zBelirsiz.length ? [
      '| Dosya | Sayfa | Kip | Kusur | Ölçü | Durum |',
      '|---|---|---|---|---|---|',
      ...[...zKusurlu, ...zBelirsiz].flatMap((r) => r.kusur.map((k) => `| \`${yer(r)}\` | ${r.sayfa} | ${r.kip} | ${k.ad} | ${zDeger(k)} | ${k.kesin ? 'kusur' : 'belirsiz'} |`)),
      '',
    ] : ['Kusurlu ya da belirsiz dosya yok.', '']),
  ];
  const kesin = satirlar.filter((r) => r.kesin); const belirsiz = satirlar.filter((r) => !r.kesin);
  const tur =(liste) => Object.values(KUSUR).map((k) => `${k.ad} ${liste.filter((r) => r.ad === k.ad).length}`).join(', ');
  const md = [
    '# KATALOG-IKON-KUSUR — katalog ikonlarında otomatik kusur taraması',
    '',
    'Görev KATALOG-IKON-AKTAR-2. `node scripts/katalog-ikon-kusur.mjs` üretir (elle düzenlenmez). Hücreler gözle denetlenmedi; yalnız piksel sezgisi',
    '(betiğin başındaki açıklama). Eşiği geçen "kusur", eşiğin yarısı ile eşik arası "belirsiz". Bir hücre birden çok satırda olabilir.',
    '',
    `- Taranan ikon: ${taranan}${eksik.length ? `; dosyası olmayan: ${eksik.join(', ')}` : ''}`,
    `- Kusurlu hücre: ${kusurlu.length} (kusur satırı ${kesin.length}: ${tur(kesin)})`,
    `- Belirsiz satır: ${belirsiz.length} (${tur(belirsiz)})`,
    `- Eşikler: ${Object.values(KUSUR).map((k) => `${k.ad} ${k === KUSUR.cep ? `${k.esik} px` : yuzde(k.esik)}`).join(', ')}`,
    '',
    '| Sayfa | Hücre | Kimlik | Kusur türü | Ölçü | Durum |',
    '|---|---|---|---|---|---|',
    ...satirlar.map((r) => `| ${r.sayfa} | ${r.hucre} | \`${r.id}\` | ${r.ad} | ${deger(r)} | ${r.kesin ? 'kusur' : 'belirsiz'} |`),
    '',
    ...zeminMd,
  ].join('\n');
  if (!yazma) fs.writeFileSync(path.join(ROOT, 'harita/belgeler/KATALOG-IKON-KUSUR.md'), md);
  console.log(`taranan ${taranan}, kusurlu hücre ${kusurlu.length}, kusur satırı ${kesin.length}, belirsiz ${belirsiz.length}`);
  if (!duzeltme || yazma) return;

  // Düzeltme sayfaları: kusurlu hücreler sayfa sırasıyla, 16'lık paketler.
  const sayfalar = [];
  for (let i = 0; i < kusurlu.length; i += 16) sayfalar.push(kusurlu.slice(i, i + 16));
  // Ertelenmiş düzeltme (kullanıcı kararı; sayfada `ertelendi`) yeniden üretimde korunur.
  const ertelendi = manifest.sayfalar.some((s) => sayfaAdi(s.dosya).startsWith(DUZELTME_ON) && s.ertelendi);
  const yeniSayfalar = sayfalar.map((p, n) => ({
    dosya: `${DUZELTME_ON}${String(n + 1).padStart(2, '0')}.jpg`, kolon: 4, satir: 4, ...(ertelendi ? { ertelendi: true } : {}),
    not: 'KATALOG-IKON-AKTAR-2 düzeltme sayfası: kusurlu hücrelerin yeniden üretimi (dış parıltı/hale yok). Öğedeki `eskiHucre` ilk sayfadaki yeri.',
    ogeler: p.map((x) => ({ ...x.o, eskiHucre: `${x.sayfa}#${x.hucre}` })),
  }));
  manifest.sayfalar = [...manifest.sayfalar.filter((s) => !sayfaAdi(s.dosya).startsWith(DUZELTME_ON)), ...yeniSayfalar];
  const girinti = /^\{\n( +)/.exec(ham)?.[1].length ?? 1;
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, girinti) + (ham.endsWith('\n') ? '\n' : ''));
  const doc = [
    '# KATALOG-IKON-DUZELTME — kusurlu katalog ikonları için düzeltme sayfaları',
    '',
    ...(ertelendi ? [`> **${ERTELENDI_NOTU}**`, ''] : []),
    'Görev KATALOG-IKON-AKTAR-2. `node scripts/katalog-ikon-kusur.mjs --duzeltme` üretir (elle düzenlenmez). Kaynak: `harita/belgeler/KATALOG-IKON-KUSUR.md`',
    `kusur satırları (belirsizler dahil değil). ${kusurlu.length} hücre, ${sayfalar.length} sayfa; manifestte \`${DUZELTME_ON}NN\` sayfaları en sonda,`,
    'üretilen görsel ilk sayfadaki hücrenin yerine geçer (sonraki sayfa ezer). Görsel yoksa betik sayfayı atlar.',
    '',
    'Prompt = `KATALOG-IKON-PROMPTLAR.md` bölüm 6 ortak bloğu; tek değişiklik: "thin soft glow hugging its silhouette" satırının yerine',
    'dış parıltı/hale yasağı (ışıltı yalnız silüetin içinde, zemin tek düz #FF00FF). Hücre tarifleri eski `gorunum` metni.',
    '',
    'Kullanım: promptu Gemini\'ye yapıştır, çıktıyı `assets-ham/esya/<dosya>` olarak kaydet, sonra',
    '`npm run esya-ikon -- --manifest data/katalog-ikon-sayfalar.json --sayfa katalog-duzeltme-01`.',
    '',
    ...yeniSayfalar.flatMap((s, n) => [
      `## ${n + 1}. \`${s.dosya}\``,
      '',
      '```text',
      duzeltmePromptu(s.ogeler),
      '```',
      '',
      '| Hücre | `id` | Eski hücre | Kusur |',
      '|---|---|---|---|',
      ...sayfalar[n].map((x, i) => `| ${i + 1} | \`${x.o.id}\` | ${x.sayfa}#${x.hucre} | ${x.k.map((k) => `${k.ad} (${deger(k)})`).join(', ')} |`),
      '',
    ]),
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'harita/belgeler/KATALOG-IKON-DUZELTME.md'), doc);
  console.log(`düzeltme: ${kusurlu.length} hücre, ${sayfalar.length} sayfa`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
