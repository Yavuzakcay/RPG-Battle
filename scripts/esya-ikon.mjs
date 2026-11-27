// Dungeondex eşya ikon hattı (`npm run esya-ikon`): data/esya-ikon-sayfalar.json + assets-ham/esya/<sayfa>.jpg (yeşil ya da macenta zemin) →
// public/esya/<kimlik>.webp (256 px) ve public/esya/kucuk/<kimlik>.webp (96 px). Varyant kimliğinde '/' dosya adında '--' olur.
// Kurallar: sayfa kolon × satır hücreye bölünür (manifestte `hucre: "kare ~N px"` varsa N px kare hücre, sol üstten); zemin rengi sayfanın
// dört köşesinden örneklenir; anahtar kenardan başlar (taşkın dolgu), kapalı deliklerde yalnız zemine çok yakın yeşil silinir (cam iç hacmi
// kalır); yarı saydam kenarlar zeminden ayrıştırılır (unmix) ve kenar bandında yeşil taşması bastırılır (despill). Hücrede en büyük bileşenin
// %6'sından küçük bileşenler atılır (`hepsiniTut` hariç). Sayfa sırası = uygulama sırası (sonraki öncekini ezer), `yoksay` okunmaz, eksik sayfa
// atlanır, `ayniGorsel` bir görseli başka kimliklere kopyalar. Varyant kimliği oyunun açılmış kaydına kuralla eşlenir (`esle`), SRD üst kimliği
// açılmış kayıtlara kopyalanır (`bagla`); public/esya'ya yalnız oyun kayıtları yazılır, kalanı kayıtsızdır. `tamDespill`: bütün nesnede despill
// (cam). Katalog manifestleri (`KATALOG_MANIFESTLER`, ya da `--manifest` ile verilen ana dışı manifest): kimlikleri oyun kaydı olmasa da
// hedeftir (public/esya/<kimlik>.webp), `ayniGorsel` hücresi bütün hedeflere kopyalanır. Hiçbir manifestte hedefi olmayan kimlik kayıtsızdır
// (tek tek uyarı, yazılmaz). Zemin kipi köşe renginden: macenta (#FF00FF, `isMagenta`) sayfada anahtar macenta-pembe tonu siler, despill macenta taşmasını
// (min(R, B) − G) bastırır; nesnenin mavi/altın parıltısı kalır. Yeşil sayfada davranış önceki gibidir. Çıktı her çalıştırmada aynıdır (idempotent). Tam çalıştırma hiçbir manifestin (ana + katalog) hedefi olmayan eski dosyaları
// listeler, yalnız --temizle ile siler.
// Kontrol görselleri (hücre no + kimlik): --kontrol → harita/belgeler/ESYA-IKON-KONTROL/<sayfa>.png. --kuru: dosya yazmadan özet.
// Kullanım: npm run esya-ikon [-- --kontrol] [-- --kaynak <klasör>] [-- --sayfa varyant-1,silah-2] [-- --manifest data/katalog-ikon-sayfalar.json]
//   [-- --temizle]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { isMagenta } from './lib/madalyon.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** Ana manifest (oyun kayıtlarına bağlanır) ve katalog manifestleri (kimlikleri kayıt olmadan da hedef; silmeye karşı korunur). */
export const ANA_MANIFEST = 'data/esya-ikon-sayfalar.json';
export const KATALOG_MANIFESTLER = ['data/katalog-ikon-sayfalar.json'];
export const BUYUK = 256;
export const KUCUK = 96;
/**
 * Anahtar eşikleri (zemine RGB uzaklığı): altı tam saydam, üstü tam opak, arası yarı saydam. Delik eşiği daha sıkı. kirpAlfa: sınır kutusu
 * eşiği (yaygın parıltının soluk kuyruğu kırpılır); tasmaPay: hücre kırpımına her yönden eklenen pay (hücre kenarı oranı).
 */
export const ESIK = { alt: 45, ust: 160, delik: 55, delikMinPx: 3, yesilFark: 20, bilesenOran: 0.06, despillPx: 6, kirpAlfa: 48, tasmaPay: 0.15,
  /** Macenta kipi: taşkın dolgunun zemine uzaklık sınırı (parıltı halesi 160–200 arası; koyu dış çizgi ≥ 240 durdurur), izdüşüm artığı sınırı. */
  macentaUst: 200, izdusumArtik: 30, kaynakPay: 3, halkaFazla: -40,
  /** Macenta taban rampası: zemine uzaklık alt'tan (45) alt + macentaRampa'ya dek alfa 0 → 1 (zemine yakın yama ve sis silinir). */
  macentaRampa: 45,
  /** Macenta kapalı cep (manifest `cepTemizle`; O ≈ s·zemin: artık ≤ cepArtik, G ≤ cepG·min(R, B), s ≥ cepS; bileşen cepEnAz px ile
   *  cepOran·kırpım arası, geçiş kenarı cepKenarArtik) ve komşu hücre taşması (hücre içi bileşen, hücre sınırına değen, en büyük iç
   *  bileşenin tasmaOran'ından küçük). KATALOG-IKON-AKTAR-3. */
  cepArtik: 28, cepKenarArtik: 55, cepG: 0.25, cepS: 0.12, cepOran: 0.04, cepEnAz: 24, tasmaOran: 0.25,
  /** Renk bazlı kapalı boşluk (ESYA-IKON-ZEMIN-TEMIZLIK): dış taşkın dolgunun hale pikselleri (zemine uzaklık ≥ alt) kova renk
   *  kümesi (kanal başına boslukKova adım) olur; dolguya bağlı olmayan zemin tonlu (d < ust) bileşen, kırpım kenarına değmiyor,
   *  boyu boslukEnAz px ile kırpımın boslukOran'ı arası ve piksellerinin boslukEslesme'si kümedeki (≥ boslukSayi) kovaya düşüyorsa
   *  zemindir (zincir/halka arası parıltılı zemin). Nesnenin zümrüt/yaprak/pembe taşı dış halede bulunmayan renktedir: kalır. */
  boslukKova: 16, boslukSayi: 3, boslukEslesme: 0.8, boslukEnAz: 6, boslukOran: 0.2,
  /** Güçlü kenar despill'i: anahtarlı (yarı saydam) piksel ve ona kenarPx içindeki anahtar tonu baskın piksel. Kenar aşındırma: saydama
   *  1 ve 2 px uzaklıktaki görünen pikselin alfası asinma[0], asinma[1] ile çarpılır (kaynak ölçeğinde; 256 px'te ≈ 1 px). */
  kenarPx: 2, asinma: [0.35, 0.7],
  /** Yeşil kipte taşkın dolgu ve kapalı boşluğun zemine uzaklık sınırı (eskiden ust = 160): parıltının parlak sarı-yeşil iç halkası
   *  (d ≈ 160–200) dolguya katılır; alfası fark matından. */
  yesilUst: 200,
  /** Soluk parıltı despill'i (yeşil kip): anahtarlı bölgeye solukPx içinde, doygunluk (G − min) / G < solukS. */
  solukPx: 16, solukS: 0.35,
  /** Macenta pembe/somon hale söndürme (pembeSondur): ton aralığı (derece), en çok doygunluk, griye çekme oranı. */
  pembeTon: [290, 25], pembeS: 0.55, pembeSondur: 0.75 };

/** Zemin kipi: köşeden okunan zemin rengi macentaysa 'macenta', değilse 'yesil' (önceki sayfaların hepsi). */
export const zeminKipi = (zemin) => (isMagenta(zemin[0], zemin[1], zemin[2]) ? 'macenta' : 'yesil');

/** Zemin tonu (taşkın dolgu ve delik adayı; gevşek, uzaklık eşiğiyle birlikte): yeşilde G baskın, macentada macenta fazlası min(R, B) − G > 0. */
const ZEMIN_TONU = {
  yesil: (r, g, b) => g > r + ESIK.yesilFark && g > b + ESIK.yesilFark,
  macenta: (r, g, b) => Math.min(r, b) - g > 0,
};

/**
 * Macenta kipinde anahtarlanan piksellerin alfası ve rengi. Parıltı halesi tek renk + zemin karışımıdır: piksel, en yakın anahtarlanmamış
 * (nesne) pikselin rengine F izdüşürülür (a = (O − Z)·(F − Z) / |F − Z|², renk F); karışım F ile açıklanmıyorsa (artık > izdusumArtik)
 * fark matı: a = 1 − fazla(O) / fazla(Z), renk ayrıştırılır (fazla = min(R, B) − G). Uzaklık rampası macentada parıltıyı opak pembe
 * bırakıyordu; yalnız alt sınırı kalır: zemine uzaklığı alt'ın altı tam saydam, alt + macentaRampa'ya dek rampa (Gemini'nin zemine yakın
 * renkli dikdörtgen yamaları ve sis). ("En az alfa" denendi: beyazımsı haleyi turkuaza, ucu yeşile çeviriyordu; DECISIONS KATALOG-IKON-AKTAR.)
 * Kaynak F anahtarlı bölgeden en az kaynakPay px içerideki nesne pikselidir (hemen bitişik geçiş halkası da zemine bulaşık); o halkadaki
 * fazlası halkaFazla'dan büyük pikseller yalnız izdüşüm tutarsa çözülür, tutmazsa (dış çizgi, nesnenin kendi rengi) olduğu gibi kalır.
 */
function macentaAyristir(rgb, w, h, zemin, zeminMi, out) {
  const n = w * h; const [zr, zg, zb] = zemin;
  const komsu = (p) => { const x = p % w; return [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p >= w ? p - w : -1, p < n - w ? p + w : -1]; };
  // Anahtarlı bölgeye uzaklık (nesne içinde, kaynakPay'e dek).
  const uzak = new Uint8Array(n).fill(255); const kuyruk = new Int32Array(n); let bas = 0; let son = 0;
  for (let i = 0; i < n; i++) if (zeminMi[i]) { uzak[i] = 0; kuyruk[son++] = i; }
  while (bas < son) {
    const p = kuyruk[bas++];
    if (uzak[p] >= ESIK.kaynakPay) continue;
    for (const q of komsu(p)) if (q >= 0 && uzak[q] === 255) { uzak[q] = uzak[p] + 1; kuyruk[son++] = q; }
  }
  const kaynak = new Int32Array(n).fill(-1); bas = 0; son = 0;
  for (let i = 0; i < n; i++) if (uzak[i] >= ESIK.kaynakPay) { kaynak[i] = i; kuyruk[son++] = i; }
  while (bas < son) {
    const p = kuyruk[bas++];
    for (const q of komsu(p)) if (q >= 0 && kaynak[q] < 0) { kaynak[q] = kaynak[p]; kuyruk[son++] = q; }
  }
  const fazlaZ = Math.max(1, Math.min(zr, zb) - zg);
  const taban = (r, g, b) => Math.min(1, Math.max(0, (Math.hypot(r - zr, g - zg, b - zb) - ESIK.alt) / ESIK.macentaRampa));
  for (let i = 0; i < n; i++) {
    const halka = !zeminMi[i] && uzak[i] < ESIK.kaynakPay;
    if (!zeminMi[i] && !halka) continue;
    const r = rgb[i * 3]; const g = rgb[i * 3 + 1]; const b = rgb[i * 3 + 2];
    if (halka && Math.min(r, b) - g <= ESIK.halkaFazla) continue;
    const k = kaynak[i];
    if (k >= 0) {
      const fr = rgb[k * 3]; const fg = rgb[k * 3 + 1]; const fb = rgb[k * 3 + 2];
      const vr = fr - zr; const vg = fg - zg; const vb = fb - zb; const L = vr * vr + vg * vg + vb * vb;
      if (L >= 1) {
        const a = Math.min(1, Math.max(0, ((r - zr) * vr + (g - zg) * vg + (b - zb) * vb) / L));
        const artik = Math.hypot(r - (zr + a * vr), g - (zg + a * vg), b - (zb + a * vb));
        if (artik <= ESIK.izdusumArtik) {
          out[i * 4] = fr; out[i * 4 + 1] = fg; out[i * 4 + 2] = fb; out[i * 4 + 3] = Math.round(a * (halka ? 1 : taban(r, g, b)) * 255);
          continue;
        }
      }
    }
    if (halka) continue;
    const a = Math.min(1, Math.max(0, 1 - (Math.min(r, b) - g) / fazlaZ));
    if (a > 0) {
      out[i * 4] = clamp((r - (1 - a) * zr) / a); out[i * 4 + 1] = clamp((g - (1 - a) * zg) / a); out[i * 4 + 2] = clamp((b - (1 - a) * zb) / a);
    }
    out[i * 4 + 3] = Math.round(a * taban(r, g, b) * 255);
  }
}

/**
 * Macenta kipinde kapalı cepler (yalnız manifest `cepTemizle` kimlikleri; KATALOG-IKON-AKTAR-3): nesnenin içinde kalan, anahtarlanmamış
 * "gölgeli macenta" bölgeler (zemin rengi karartılmış: O ≈ s·Z, artık ≤ cepArtik, G ≤ cepG·min(R, B), s ≥ cepS; 4 komşu bileşen).
 * Kırpım kenarına değmeyen, cepEnAz px ile kırpımın cepOran'ı arasındaki bileşen saydam olur; 1 px geçiş kenarı gevşek artıkla
 * (cepKenarArtik) eklenir. Nesnenin pembe/mor taşı, parıltı çekirdeği, mor dumanı zeminin karartılmış tonundan uzaktır (artık ≈ 60): kalır.
 * Genel kural değil: Gemini bazı eşyaların koyu dış çizgisini de zeminin karartılmış tonuyla çizmiş, kural her ikonda çizgiyi yerdi.
 */
function macentaCepleri(rgb, w, h, zemin, zeminMi) {
  const n = w * h; const [zr, zg, zb] = zemin; const zz = zr * zr + zg * zg + zb * zb;
  const aday = new Uint8Array(n); const gevsek = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (zeminMi[i]) continue;
    const r = rgb[i * 3]; const g = rgb[i * 3 + 1]; const b = rgb[i * 3 + 2];
    const s = (r * zr + g * zg + b * zb) / zz;
    if (s < ESIK.cepS || g > ESIK.cepG * Math.min(r, b)) continue;
    const artik = Math.hypot(r - s * zr, g - s * zg, b - s * zb);
    if (artik <= ESIK.cepArtik) aday[i] = 1; else if (artik <= ESIK.cepKenarArtik) gevsek[i] = 1;
  }
  const cep = new Uint8Array(n); const gor = new Uint8Array(n); const sinir = ESIK.cepOran * n;
  for (let i = 0; i < n; i++) {
    if (!aday[i] || gor[i]) continue;
    const parca = [i]; gor[i] = 1; let kenar = false;
    for (let k = 0; k < parca.length; k++) {
      const p = parca[k]; const x = p % w; const y = (p - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) kenar = true;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && aday[q] && !gor[q]) { gor[q] = 1; parca.push(q); }
      }
    }
    if (!kenar && parca.length >= ESIK.cepEnAz && parca.length <= sinir) for (const p of parca) cep[p] = 1;
  }
  const kenarPx = [];
  for (let i = 0; i < n; i++) {
    if (!gevsek[i]) continue;
    const x = i % w;
    if ((x > 0 && cep[i - 1]) || (x < w - 1 && cep[i + 1]) || (i >= w && cep[i - w]) || (i < n - w && cep[i + w])) kenarPx.push(i);
  }
  for (const i of kenarPx) cep[i] = 1;
  return cep;
}

/**
 * Macenta kipinde komşu hücreden taşan parça (KATALOG-IKON-AKTAR-3). Komşunun ucu bu hücreye girebilir ya da kırpım payında durup bu
 * hücrenin yarı saydam parıltısına değebilir; tam kırpımda tek bileşen olur. Bu yüzden bağlantıyı yalnız opak gövde (`tut` ve α ≥ 250)
 * taşır: gövde önce asıl hücre (`ic`) içinde 8 komşu etiketlenir, hücre sınırına değen ve en büyük iç gövdenin tasmaOran'ından küçük iç
 * gövde atılır; korunan iç gövdeye opak yolla ulaşamayan (hücre dışındaki) gövde de atılır. Arada kalan yarı saydam `tut` pikselleri
 * en yakın gövdeye (jeodezik, 8 komşu) bölüştürülür, atılan gövdeye yakın olanlar onunla gider. Atılan gövde yoksa hiçbir şey değişmez.
 */
function komsuTasmasi(tut, out, w, h, ic) {
  const n = w * h; const iceride = (x, y) => x >= ic.x0 && x < ic.x1 && y >= ic.y0 && y < ic.y1;
  const govde = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (tut[i] && out[i * 4 + 3] >= 250) govde[i] = 1;
  const komsu8 = (p, f) => {
    const x = p % w; const y = (p - x) / w;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx; const ny = y + dy;
      if ((dx || dy) && nx >= 0 && ny >= 0 && nx < w && ny < h) f(ny * w + nx, nx, ny);
    }
  };
  const lab = new Int32Array(n); const alan = [0]; const snr = [false];
  for (let i = 0; i < n; i++) {
    const x0 = i % w; const y0 = (i - x0) / w;
    if (!govde[i] || lab[i] || !iceride(x0, y0)) continue;
    const id = alan.length; const st = [i]; lab[i] = id; let say = 0; let kenar = false;
    while (st.length) {
      const p = st.pop(); say++; const x = p % w; const y = (p - x) / w;
      if (x === ic.x0 || y === ic.y0 || x === ic.x1 - 1 || y === ic.y1 - 1) kenar = true;
      komsu8(p, (q, nx, ny) => { if (govde[q] && !lab[q] && iceride(nx, ny)) { lab[q] = id; st.push(q); } });
    }
    alan.push(say); snr.push(kenar);
  }
  const enBuyuk = Math.max(0, ...alan);
  const at = (id) => snr[id] && alan[id] < ESIK.tasmaOran * enBuyuk;
  // Korunan iç gövdeden opak yolla ulaşılan gövde.
  const ulas = new Uint8Array(n); const st = [];
  for (let i = 0; i < n; i++) if (lab[i] && !at(lab[i])) { ulas[i] = 1; st.push(i); }
  while (st.length) komsu8(st.pop(), (q) => { if (govde[q] && !ulas[q] && !(lab[q] && at(lab[q]))) { ulas[q] = 1; st.push(q); } });
  let atilan = 0;
  for (let i = 0; i < n; i++) if (govde[i] && !ulas[i]) atilan++;
  if (!atilan) return;
  // Yarı saydam `tut` pikselleri en yakın gövdeye: 1 korunan, 2 atılan (çok kaynaklı BFS).
  const sahip = new Uint8Array(n); const kuyruk = [];
  for (let i = 0; i < n; i++) if (govde[i]) { sahip[i] = ulas[i] ? 1 : 2; kuyruk.push(i); }
  for (let k = 0; k < kuyruk.length; k++) {
    const p = kuyruk[k];
    komsu8(p, (q) => { if (tut[q] && !sahip[q]) { sahip[q] = sahip[p]; kuyruk.push(q); } });
  }
  for (let i = 0; i < n; i++) if (tut[i] && sahip[i] !== 1) tut[i] = 0;
}

/** '/' → '--' (varyant kimliği dosya adında). */
export const dosyaAdi = (id) => id.replace(/\//g, '--');
export const sayfaAdi = (dosya) => dosya.replace(/\.[a-z]+$/i, '');

/** Hücre dikdörtgenleri (okuma sırası). `hucre: "kare ~667 px"` → N px kare hücre, sol üstten; yoksa W/kolon × H/satır. */
export function hucreler(W, H, sayfa) {
  const kare = /kare\D*(\d+)/.exec(String(sayfa.hucre ?? ''));
  const cw = kare ? Number(kare[1]) : W / sayfa.kolon;
  const ch = kare ? Number(kare[1]) : H / sayfa.satir;
  const out = [];
  for (let r = 0; r < sayfa.satir; r++) for (let c = 0; c < sayfa.kolon; c++) {
    const x = Math.round(c * cw); const y = Math.round(r * ch);
    // Son kolon/satır sayfa kenarına dek uzar (kare hücrede sayfa artığı boştur; taşan uç kesilmez).
    const x1 = c === sayfa.kolon - 1 ? W : Math.min(W, Math.round((c + 1) * cw));
    const y1 = r === sayfa.satir - 1 ? H : Math.min(H, Math.round((r + 1) * ch));
    out.push({ x, y, w: x1 - x, h: y1 - y });
  }
  return out;
}

/**
 * Uygulama planı: kimlik → { sayfa, hucre (1'den), kaynakId } (sonraki sayfa öncekini ezer; `ayniGorsel` kopyaları en sonda).
 * `var(dosya)` sayfa dosyası var mı; yoksa atlanır. Dönen `ezilen`: [kimlik, eski konum, yeni konum]; `etkisiz`: uygulanamayan kopyalar.
 */
export function plan(manifest, varMi = () => true) {
  const yoksay = new Set(manifest.yoksay ?? []);
  const son = new Map(); const ezilen = []; const atlanan = []; const etkisiz = [];
  let sira = 0;
  for (const s of manifest.sayfalar) {
    sira++;
    const ad = sayfaAdi(s.dosya);
    if (yoksay.has(ad)) continue;
    if (!varMi(s.dosya)) { atlanan.push(ad); continue; }
    s.ogeler.forEach((o, i) => {
      if (!o?.id) return;
      const yeni = { sayfa: ad, hucre: i + 1, kaynakId: o.id, sira };
      const eski = son.get(o.id);
      if (eski) ezilen.push([o.id, `${eski.sayfa}#${eski.hucre}`, `${ad}#${i + 1}`]);
      son.set(o.id, yeni);
    });
  }
  for (const [kaynak, hedefler] of Object.entries(manifest.ayniGorsel ?? {})) {
    const k = son.get(kaynak);
    if (!k) { etkisiz.push(`${kaynak}: kaynak kimliğin hücresi yok (${hedefler.join(', ')} kopyalanmadı)`); continue; }
    for (const h of hedefler) {
      const kendi = son.get(h);
      // Hedefin kendi hücresi kaynaktan sonraki bir sayfadaysa (düzeltme) kopya onu ezmez.
      if (kendi && kendi.sira > k.sira) { etkisiz.push(`${kaynak} → ${h}: hedefin kendi hücresi (${kendi.sayfa}#${kendi.hucre}) daha sonra, kopya yapılmadı`); continue; }
      son.set(h, { ...k, kopya: kaynak });
    }
  }
  return { son, ezilen, atlanan, etkisiz };
}

/**
 * Oyun eşya kayıtları: { id, srd } (srd = SRD kimliği, `<dosya>:` öneki atılmış). Sihirli eşya + donanım (data/items.json +
 * data/items-srd.json), silah (data/weapons.json), zırh (data/armor.json; kimlik SRD'den). Oyunun açtığı varyantlar aynı `srd`'yi paylaşır.
 */
export function oyunKayitlari(root = ROOT) {
  const oku = (f) => JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf8'));
  const srdOf = (s) => (s ? String(s).split(':')[1] ?? null : null);
  const map = new Map();
  for (const i of [...oku('items.json'), ...oku('items-srd.json')]) map.set(i.id, { id: i.id, srd: srdOf(i.srd) });
  // Görev KATALOG-1: özgün katalog eşyaları (SRD kimliği yok; ikon kendi kimliğiyle eşlenir).
  for (const i of oku('items-katalog.json').esyalar ?? []) map.set(i.id, { id: i.id, srd: null });
  for (const w of oku('weapons.json')) map.set(w.id, { id: w.id, srd: srdOf(w.srd) });
  // Görev TE99: kalkan kaydı (`type: shield`, yalnız AC verisi) oyun eşyası değil; eskisi gibi kayıtsız kalır.
  for (const a of oku('armor.json')) if (a.srd && a.type !== 'shield') { const id = srdOf(a.srd); map.set(id, { id, srd: id }); }
  return [...map.values()];
}

/**
 * Varyant kimliği `<ana>/<varyant>` → oyunun açılmış kaydı. Kural (oyun adlandırmasından): adaylar `srd === ana` olan ve kimliği `ana`dan
 * farklı kayıtlardır; kimliğinde `<varyant>` tire sınırlı ardışık parça olarak geçen tek aday seçilir (potions-of-healing/greater →
 * potion-of-greater-healing, belt-of-giant-strength/hill → belt-of-hill-giant-strength). Tek aday yoksa eşleşmez, birden çoksa belirsiz.
 */
export function varyantEsle(id, kayitlar) {
  const [ana, varyant] = id.split('/');
  const adaylar = kayitlar.filter((k) => k.srd === ana && k.id !== ana);
  const uyan = adaylar.filter((k) => `-${k.id}-`.includes(`-${varyant}-`)).map((k) => k.id);
  return uyan.length === 1 ? { id: uyan[0] } : uyan.length > 1 ? { belirsiz: uyan } : { yok: adaylar.length ? 'açılmış kayıtlarda varyant adı yok' : 'oyunda açılmış varyant kaydı yok' };
}

/**
 * Manifest kimliklerini oyun kimliklerine çevir (kopya manifest döner; hücrede `kaynak` = manifestteki kimlik). Yalnız eşleşen varyantlar
 * değişir; eşleşmeyen ve belirsiz olanlar olduğu gibi kalır (bağlanmaz, raporlanır).
 */
export function esle(manifest, kayitlar) {
  const oyun = new Set(kayitlar.map((k) => k.id));
  const varyant = []; const eslesmeyen = []; const belirsiz = [];
  const gor = new Set();
  const sayfalar = manifest.sayfalar.map((s) => ({ ...s, ogeler: s.ogeler.map((o) => {
    if (!o?.id || !o.id.includes('/') || oyun.has(o.id)) return o;
    const e = varyantEsle(o.id, kayitlar);
    const ilk = !gor.has(o.id); gor.add(o.id);
    if (e.id) { if (ilk) varyant.push([o.id, e.id]); return { ...o, id: e.id, kaynak: o.id }; }
    if (ilk) (e.belirsiz ? belirsiz.push([o.id, e.belirsiz]) : eslesmeyen.push([o.id, e.yok]));
    return o;
  }) }));
  return { manifest: { ...manifest, sayfalar }, varyant, eslesmeyen, belirsiz };
}

/** Manifestin bütün kimlikleri: hücre öğeleri + `ayniGorsel` kaynak ve hedefleri. */
export function manifestKimlikleri(manifest) {
  const out = new Set();
  for (const s of manifest.sayfalar ?? []) for (const o of s.ogeler ?? []) if (o?.id) out.add(o.id);
  for (const [k, hedefler] of Object.entries(manifest.ayniGorsel ?? {})) { out.add(k); for (const h of hedefler) out.add(h); }
  return out;
}

/**
 * Planı oyun kayıtlarına bağla. Manifestteki SRD üst kimliği (oyunda kaydı yok ama oyun kayıtlarının `srd`'si) kendi ikonu olmayan bütün
 * açılmış kayıtlara kopyalanır (varyantın kendi ikonu önce gelir). `hedefler` (katalog kimlikleri) kayıt olmadan da yazılır. Kalanlar
 * `kayitsiz` (yazılmaz).
 */
export function bagla(son, kayitlar, hedefler = new Set()) {
  const oyun = new Set(kayitlar.map((k) => k.id));
  const cikti = new Map(); const ust = []; const kayitsiz = [];
  for (const [id, sn] of son) if (oyun.has(id) || hedefler.has(id)) cikti.set(id, sn);
  for (const [id, sn] of son) {
    if (oyun.has(id) || hedefler.has(id)) continue;
    const uyeler = kayitlar.filter((k) => k.srd === id && k.id !== id).map((k) => k.id);
    if (!uyeler.length) { kayitsiz.push(id); continue; }
    const alan = uyeler.filter((u) => !cikti.has(u));
    for (const u of alan) cikti.set(u, { ...sn, kopya: id });
    ust.push([id, uyeler, alan]);
  }
  return { cikti, ust, kayitsiz };
}

/** Sayfanın dört köşesinden (16×16) ortanca zemin rengi. */
function zeminRengi(buf, W, H) {
  const r = []; const g = []; const b = [];
  for (const [x0, y0] of [[0, 0], [W - 16, 0], [0, H - 16], [W - 16, H - 16]]) for (let y = y0; y < y0 + 16; y++) for (let x = x0; x < x0 + 16; x++) {
    const i = (y * W + x) * 3; r.push(buf[i]); g.push(buf[i + 1]); b.push(buf[i + 2]);
  }
  const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
  return [med(r), med(g), med(b)];
}

/**
 * Bir hücreyi anahtarla: RGBA tampon (w×h), bileşen süzgeci uygulanmış. `ic`: asıl hücre (genişletilmiş kırpım içinde); yalnız ağırlık
 * merkezi `ic` içindeki bileşenler tutulur (komşu hücreye taşan uç kesilmez, komşunun parçası girmez).
 */
export function anahtarla(rgb, w, h, zemin, hepsi = false, ic = { x0: 0, y0: 0, x1: w, y1: h }, tamDespill = false, cepTemizle = false, secenek = {}) {
  const n = w * h; const [zr, zg, zb] = zemin;
  // secenek.bosluk: false kapatır, sayı boslukEslesme'yi ezer (manifest `boslukKapali` / sayfa `boslukEslesme`); secenek.asinma: false kapatır.
  const bosluk = secenek.bosluk === false ? null : { eslesme: typeof secenek.bosluk === 'number' ? secenek.bosluk : ESIK.boslukEslesme };
  const kip = zeminKipi(zemin); const tonlu = ZEMIN_TONU[kip];
  const d = new Float32Array(n); const yesil = new Uint8Array(n); // yesil: zemin tonunda (macenta kipinde macenta-pembe)
  for (let i = 0; i < n; i++) {
    const r = rgb[i * 3]; const g = rgb[i * 3 + 1]; const b = rgb[i * 3 + 2];
    d[i] = Math.hypot(r - zr, g - zg, b - zb);
    yesil[i] = tonlu(r, g, b) ? 1 : 0;
  }
  const zeminMi = new Uint8Array(n); // 1: anahtarlanan bölge (alfa < 1)
  const yigin = [];
  const ust = kip === 'macenta' ? ESIK.macentaUst : ESIK.yesilUst;
  const it = (i) => { if (!zeminMi[i] && yesil[i] && d[i] < ust) { zeminMi[i] = 1; yigin.push(i); } };
  const yay = () => {
    while (yigin.length) {
      const p = yigin.pop(); const x = p % w; const y = (p - x) / w;
      if (x > 0) it(p - 1); if (x < w - 1) it(p + 1); if (y > 0) it(p - w); if (y < h - 1) it(p + w);
    }
  };
  for (let x = 0; x < w; x++) { it(x); it((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { it(y * w); it(y * w + w - 1); }
  yay();
  // Kapalı delikler: zemine çok yakın (sıkı eşik) ve yeterince büyük yeşil adalar; cam iç hacmi (soluk, uzak renk) kalır.
  const gor = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (zeminMi[i] || gor[i] || !yesil[i] || d[i] >= ESIK.delik) continue;
    const ada = [i]; gor[i] = 1;
    for (let k = 0; k < ada.length; k++) {
      const p = ada[k]; const x = p % w; const y = (p - x) / w;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && !gor[q] && !zeminMi[q] && yesil[q] && d[q] < ESIK.delik) { gor[q] = 1; ada.push(q); }
      }
    }
    if (ada.length >= ESIK.delikMinPx) { for (const p of ada) { zeminMi[p] = 1; yigin.push(p); } yay(); }
  }
  if (bosluk) for (const p of kapaliBosluklar(rgb, w, h, d, yesil, zeminMi, ust, bosluk)) zeminMi[p] = 1;
  const out = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    let r = rgb[i * 3]; let g = rgb[i * 3 + 1]; let b = rgb[i * 3 + 2]; let a = 1;
    if (zeminMi[i]) {
      a = Math.min(1, Math.max(0, (d[i] - ESIK.alt) / (ESIK.ust - ESIK.alt)));
      // Yeşil kipte fark matı da (ESYA-IKON-ZEMIN-TEMIZLIK): a ≤ 1 − (G − max(R, B)) / (Zg − max(Zr, Zb)); parıltı + zemin karışımı
      // (sarı-yeşil hale) uzaklık rampasıyla neredeyse opak kalıyordu.
      if (kip === 'yesil') a = Math.min(a, Math.max(0, 1 - (g - Math.max(r, b)) / Math.max(1, zg - Math.max(zr, zb))));
      if (a > 0) { // unmix: piksel = a·renk + (1−a)·zemin
        r = (r - (1 - a) * zr) / a; g = (g - (1 - a) * zg) / a; b = (b - (1 - a) * zb) / a;
      }
    }
    out[i * 4] = clamp(r); out[i * 4 + 1] = clamp(g); out[i * 4 + 2] = clamp(b); out[i * 4 + 3] = Math.round(a * 255);
  }
  if (kip === 'macenta') {
    macentaAyristir(rgb, w, h, zemin, zeminMi, out);
    if (cepTemizle) {
      const cep = macentaCepleri(rgb, w, h, zemin, zeminMi);
      for (let i = 0; i < n; i++) if (cep[i]) out[i * 4 + 3] = 0;
    }
  }
  // Despill: zemine en çok despillPx uzaklıktaki opak/yarı opak piksellerde G ≤ max(R, B). `tamDespill` (manifest `tamDespill`):
  // bütün nesnede (zemini içinden gösteren cam: yeşilimsi cam nötr olur; yeşil nesnede kullanılmaz).
  // Güçlü kenar despill'i (ESYA-IKON-ZEMIN-TEMIZLIK): anahtarlı bölgedeki (yarı saydam hale, kapalı boşluk) her pikselde ve ona kenarPx
  // içindeki yeşil baskın (G > max(R, B)) pikselde G, R ve B'nin ortalamasına çekilir: hale sarı-yeşil (G ≈ R) kalmaz, altın/turuncu olur.
  // Macenta kipinde taşma (1, 0, 1) yönündedir: min(R, B) − G fazlası R ve B'den düşülür (beyaz/gümüş kenar nötr, mavi parıltıda R,
  // altın parıltıda B zaten G'nin altında: dokunulmaz). `tamDespill` macentada aynı kural.
  // Soluk parıltı (yeşil kip): anahtarlı bölgeye solukPx içindeki, doygunluğu < solukS olan yeşil baskın piksel (beyaz/krem parıltının
  // yeşil zemin üstünde nane yeşili kalan geniş halesi) de G → (R + B) / 2.
  let bant = zeminMi; let yakin = zeminMi; let soluk = zeminMi;
  for (let k = 0; k < Math.max(ESIK.despillPx, ESIK.solukPx); k++) {
    soluk = genislet(soluk, w, h);
    if (k + 1 === ESIK.kenarPx) yakin = soluk;
    if (k + 1 === ESIK.despillPx) bant = soluk;
  }
  for (let i = 0; i < n; i++) {
    const a = out[i * 4 + 3];
    if (kip === 'yesil' && !tamDespill && soluk[i] && !bant[i] && a > 0) {
      const R = out[i * 4]; const G = out[i * 4 + 1]; const B = out[i * 4 + 2];
      if (G > Math.max(R, B) && (G - Math.min(R, B)) < ESIK.solukS * G) out[i * 4 + 1] = Math.round((R + B) / 2);
      continue;
    }
    if ((!tamDespill && !bant[i]) || a === 0) continue;
    const R = out[i * 4]; const G = out[i * 4 + 1]; const B = out[i * 4 + 2];
    if (kip === 'macenta') {
      const e = Math.min(R, B) - G;
      if (e > 0) { out[i * 4] -= e; out[i * 4 + 2] -= e; }
      if (zeminMi[i] || yakin[i]) pembeSondur(out, i);
      continue;
    }
    const ort = (R + B) / 2; const mx = Math.max(R, B);
    const guclu = zeminMi[i] || (G > mx && (yakin[i] || G - Math.min(R, B) < ESIK.solukS * G));
    const m = guclu ? ort : mx;
    if (G > m) out[i * 4 + 1] = Math.round(m);
  }
  // Bileşenler (alfa ≥ 128, 8 komşu): en büyüğün %6'sı altı atılır; yarı saydam kenar yalnız tutulan bileşene 2 px yakınsa kalır.
  const maske = new Uint8Array(n);
  for (let i = 0; i < n; i++) maske[i] = out[i * 4 + 3] >= 128 ? 1 : 0;
  const etiket = new Int32Array(n); const alan = [0]; const icte = [false];
  for (let i = 0; i < n; i++) {
    if (!maske[i] || etiket[i]) continue;
    const id = alan.length; let say = 0; let sx = 0; let sy = 0; const st = [i]; etiket[i] = id;
    while (st.length) {
      const p = st.pop(); say++; const x = p % w; const y = (p - x) / w; sx += x; sy += y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx; const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (maske[q] && !etiket[q]) { etiket[q] = id; st.push(q); }
      }
    }
    alan.push(say);
    const mx = sx / say; const my = sy / say;
    icte.push(mx >= ic.x0 && mx < ic.x1 && my >= ic.y0 && my < ic.y1);
  }
  const enBuyuk = Math.max(0, ...alan.filter((_, k) => icte[k]));
  let tut = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (etiket[i] && icte[etiket[i]] && (hepsi || alan[etiket[i]] >= ESIK.bilesenOran * enBuyuk)) tut[i] = 1;
  if (kip === 'macenta' && !hepsi) komsuTasmasi(tut, out, w, h, ic);
  const cekirdek = tut;
  tut = genislet(genislet(tut, w, h), w, h);
  for (let i = 0; i < n; i++) {
    if (etiket[i] ? !cekirdek[i] : !tut[i]) out[i * 4 + 3] = 0; // atılan bileşen ya da ondan kalan yarı saydam kenar
  }
  if (secenek.asinma !== false) asindir(out, w, h);
  return out;
}

/**
 * Macenta kipinde pembe/somon hale söndürme (ESYA-IKON-ZEMIN-TEMIZLIK): anahtarlı bölge ve kenarPx bandındaki pikselde ton pembe-somon
 * aralığında (pembeTon: 290°–360° ve 0°–25°) ve doygunluk ≤ pembeS ise renk parlaklığına (gri) pembeSondur oranında çekilir. Beyaz/krem
 * parıltı macenta üstünde ayrıştırmadan sonra şeftali-pembe kalıyordu. Doygun kırmızı ateş parıltısı (s > pembeS) ve altın (ton > 25°)
 * değişmez; bandın dışındaki pembe taş dokunulmaz.
 */
function pembeSondur(out, i) {
  const r = out[i * 4]; const g = out[i * 4 + 1]; const b = out[i * 4 + 2];
  const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const c = mx - mn;
  if (!c || mx !== r && !(mx === b && r > g)) return; // kırmızı ya da R > G'li mor-pembe baskın değil
  let h = mx === r ? 60 * (((g - b) / c) % 6) : 60 * ((r - g) / c + 4);
  h = (h + 360) % 360;
  if (!(h >= ESIK.pembeTon[0] || h <= ESIK.pembeTon[1]) || c / mx > ESIK.pembeS) return;
  const L = 0.299 * r + 0.587 * g + 0.114 * b; const k = ESIK.pembeSondur;
  out[i * 4] = Math.round(r + (L - r) * k); out[i * 4 + 1] = Math.round(g + (L - g) * k); out[i * 4 + 2] = Math.round(b + (L - b) * k);
}

/** Kenar aşındırma: saydam (α = 0) piksele 4 komşu uzaklığı 1 ve 2 olan görünen pikselin alfası ESIK.asinma ile çarpılır. */
function asindir(out, w, h) {
  const n = w * h; let sinir = new Uint8Array(n);
  for (let i = 0; i < n; i++) sinir[i] = out[i * 4 + 3] === 0 ? 1 : 0;
  for (const kat of ESIK.asinma) {
    const yeni = genislet(sinir, w, h);
    for (let i = 0; i < n; i++) if (yeni[i] && !sinir[i]) out[i * 4 + 3] = Math.round(out[i * 4 + 3] * kat);
    sinir = yeni;
  }
}

/**
 * Renk bazlı kapalı boşluklar (ESYA-IKON-ZEMIN-TEMIZLIK): taşkın dolguya bağlı olmayan zemin tonlu (d < ust) 4 komşu bileşenlerden, dış
 * dolgunun hale renk kümesiyle (kova) eşleşenler. Zincir halkası, kolye ipi gibi kapalı aralıklarda parıltıyla karışmış zemin (sarı-yeşil,
 * pembe) saf zemine yakın piksel içermediği için delik kuralına girmiyordu. Dönen: zemine katılacak piksel indisleri.
 */
function kapaliBosluklar(rgb, w, h, d, ton, zeminMi, ust, ayar) {
  const n = w * h; const K = ESIK.boslukKova;
  const kova = (i) => ((rgb[i * 3] / K) | 0) * 4096 + ((rgb[i * 3 + 1] / K) | 0) * 64 + ((rgb[i * 3 + 2] / K) | 0);
  const kume = new Map();
  for (let i = 0; i < n; i++) if (zeminMi[i] && d[i] >= ESIK.alt) { const k = kova(i); kume.set(k, (kume.get(k) ?? 0) + 1); }
  const gor = new Uint8Array(n); const sonuc = [];
  for (let i = 0; i < n; i++) {
    if (gor[i] || zeminMi[i] || !ton[i] || d[i] >= ust) continue;
    const parca = [i]; gor[i] = 1; let kenar = false;
    for (let k = 0; k < parca.length; k++) {
      const p = parca[k]; const x = p % w; const y = (p - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) kenar = true;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && !gor[q] && !zeminMi[q] && ton[q] && d[q] < ust) { gor[q] = 1; parca.push(q); }
      }
    }
    if (kenar || parca.length < ESIK.boslukEnAz || parca.length > ESIK.boslukOran * n) continue;
    let es = 0;
    for (const p of parca) if ((kume.get(kova(p)) ?? 0) >= ESIK.boslukSayi) es++;
    if (es >= ayar.eslesme * parca.length) for (const p of parca) sonuc.push(p);
  }
  return sonuc;
}

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));
function genislet(m, w, h) {
  const o = new Uint8Array(m);
  for (let i = 0; i < m.length; i++) {
    if (!m[i]) continue;
    const x = i % w;
    if (x > 0) o[i - 1] = 1; if (x < w - 1) o[i + 1] = 1; if (i >= w) o[i - w] = 1; if (i < m.length - w) o[i + w] = 1;
  }
  return o;
}

/** Saydam olmayan sınır kutusu; boşsa null. */
function sinirKutusu(rgba, w, h) {
  let x0 = w; let y0 = h; let x1 = -1; let y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rgba[(y * w + x) * 4 + 3] > ESIK.kirpAlfa) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < 0 ? null : { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

/** Kırpılmış ikonu kare tuvale sığdır (kenar payı %4). */
async function kare(rgba, w, h, kutu, boyut) {
  const pay = Math.max(2, Math.round(boyut * 0.04));
  return sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).extract(kutu)
    .resize(boyut - 2 * pay, boyut - 2 * pay, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' })
    .extend({ top: pay, bottom: pay, left: pay, right: pay, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 88, alphaQuality: 100, effort: 5 }).toBuffer();
}

/** Bir sayfanın bütün hücrelerini işle: [{ hucre, id, buyuk, kucuk }] (boş/atlanan hücre id: null). */
export async function sayfaIsle(dosyaYolu, sayfa, hepsiniTut, tamDespill = new Set(), cepTemizle = new Set(), boslukKapali = new Set(), boslukZorla = new Set()) {
  const { data, info } = await sharp(dosyaYolu).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width; const H = info.height;
  const zemin = zeminRengi(data, W, H);
  const out = [];
  const rects = hucreler(W, H, sayfa);
  for (let k = 0; k < rects.length && k < sayfa.ogeler.length; k++) {
    const o = sayfa.ogeler[k];
    if (!o?.id) { out.push({ hucre: k + 1, id: null }); continue; }
    const c = rects[k];
    // Hücre her yöne payla genişletilir (sayfa sınırında kırpılır); asıl hücre `ic`.
    const m = Math.round(ESIK.tasmaPay * Math.min(c.w, c.h));
    const x = Math.max(0, c.x - m); const y = Math.max(0, c.y - m);
    const w = Math.min(W, c.x + c.w + m) - x; const h = Math.min(H, c.y + c.h + m) - y;
    const rgb = Buffer.alloc(w * h * 3);
    for (let r = 0; r < h; r++) data.copy(rgb, r * w * 3, ((y + r) * W + x) * 3, ((y + r) * W + x + w) * 3);
    const secili = (set) => set.has(o.id) || (o.kaynak && set.has(o.kaynak));
    // Renk bazlı kapalı boşluk: manifest `boslukKapali` kimliğinde kapalı, `boslukZorla` kimliğinde eşleşme şartsız (eşik 0: kapalı
    // her zemin tonlu bileşen zemin; gölgeli zemin, ör. yüzük içi), sayfa `boslukEslesme` eşiği ezer (riskli sayfa).
    const bosluk = secili(boslukKapali) ? false : secili(boslukZorla) ? 0 : (sayfa.boslukEslesme ?? true);
    const rgba = anahtarla(rgb, w, h, zemin, secili(hepsiniTut), { x0: c.x - x, y0: c.y - y, x1: c.x - x + c.w, y1: c.y - y + c.h }, secili(tamDespill), secili(cepTemizle), { bosluk });
    const kutu = sinirKutusu(rgba, w, h);
    if (!kutu) { out.push({ hucre: k + 1, id: o.id, bos: true }); continue; }
    const kenar = opakKenar(rgba, w, h, { ust: y > 0, alt: y + h < H, sol: x > 0, sag: x + w < W });
    out.push({ hucre: k + 1, id: o.id, kenar, buyuk: await kare(rgba, w, h, kutu, BUYUK), kucuk: await kare(rgba, w, h, kutu, KUCUK) });
  }
  return { out, zemin };
}

/**
 * Opak piksel (α ≥ 200) iç hücre sınırına değiyor mu: nesne komşu hücreye taşmış, kesilmiş olabilir. Sayfa kenarı ve yarı saydam
 * parıltı sayılmaz (yaygın hale hücreyi doldurabilir; kırpma onu kirpAlfa ile zaten keser).
 */
function opakKenar(rgba, w, h, ic) {
  const op = (x, y) => rgba[(y * w + x) * 4 + 3] >= 200;
  for (let x = 0; x < w; x++) if ((ic.ust && op(x, 0)) || (ic.alt && op(x, h - 1))) return true;
  for (let y = 0; y < h; y++) if ((ic.sol && op(0, y)) || (ic.sag && op(w - 1, y))) return true;
  return false;
}

/** Etiketi en çok iki satıra böl ('/' ya da '-' sınırından). */
function sar(t, n) {
  if (t.length <= n) return [t];
  let k = Math.max(t.lastIndexOf('/', n), t.lastIndexOf('-', n));
  if (k < n / 2) k = n - 1;
  const ikinci = t.slice(k + 1);
  return [t.slice(0, k + 1), ikinci.length > n ? `${ikinci.slice(0, n - 1)}…` : ikinci];
}

const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Etiketli kontrol görseli: her hücrede işlenmiş ikon (dama zemin üstünde), altında "#n kimlik"; ezilen/atlanan/belirsiz işaretli. */
async function kontrolGorseli(ad, sayfa, sonuc, son, belirsizIdler, kayitsiz, hedef) {
  const C = 200; const ET = 58; const K = sayfa.kolon; const R = Math.ceil(sonuc.length / K);
  const W = K * C; const H = 34 + R * (C + ET);
  const dama = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><pattern id="d" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#8a8f98"/><rect width="10" height="10" fill="#6e737c"/><rect x="10" y="10" width="10" height="10" fill="#6e737c"/></pattern></defs><rect width="${W}" height="${H}" fill="#1d2026"/>${sonuc.map((s, i) => `<rect x="${(i % K) * C + 4}" y="${34 + Math.floor(i / K) * (C + ET) + 4}" width="${C - 8}" height="${C - 8}" fill="url(#d)"/>`).join('')}</svg>`);
  const yazi = sonuc.map((s, i) => {
    const x = (i % K) * C + 6; const y = 34 + Math.floor(i / K) * (C + ET) + C;
    const sn = s.id ? son.get(s.id) : null;
    const ezildi = sn && !(sn.sayfa === ad && sn.hucre === s.hucre);
    const soru = s.id && belirsizIdler.has(s.id);
    const kyt = s.id && kayitsiz.has(s.id);
    const renk = !s.id || kyt ? '#9aa0a6' : ezildi ? '#f0a020' : soru ? '#ff6b6b' : '#e8eaed';
    const alt = !s.id ? 'atlandı' : ezildi ? `ezildi → ${sn.sayfa}#${sn.hucre}` : s.bos ? 'BOŞ' : kyt ? 'kayıtsız (yazılmadı)' : s.kenar ? 'kenara değiyor' : '';
    const [s1, s2] = sar(`#${s.hucre} ${s.id ? `${soru ? '? ' : ''}${s.id}` : '—'}`, 27);
    const satir = (t, dy, kalin) => `<text x="${x}" y="${y + dy}" font-family="Segoe UI, Arial" font-size="12" ${kalin ? 'font-weight="700" ' : ''}fill="${renk}">${xml(t)}</text>`;
    return satir(s1, 14, true) + (s2 ? satir(s2, 28, true) : '') + (alt ? satir(alt, s2 ? 44 : 30, false) : '');
  }).join('');
  const baslik = `<text x="8" y="23" font-family="Segoe UI, Arial" font-size="18" font-weight="700" fill="#e8eaed">${xml(ad)} — ${sayfa.kolon}×${sayfa.satir}, ${sonuc.length} hücre</text>`;
  const ust = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${baslik}${yazi}</svg>`);
  const ikonlar = [];
  for (let i = 0; i < sonuc.length; i++) {
    const s = sonuc[i];
    if (!s.buyuk) continue;
    ikonlar.push({ input: await sharp(s.buyuk).resize(C - 8, C - 8).png().toBuffer(), left: (i % K) * C + 4, top: 34 + Math.floor(i / K) * (C + ET) + 4 });
  }
  await sharp(dama).composite([...ikonlar, { input: ust, left: 0, top: 0 }]).png({ palette: true, quality: 90, effort: 8 }).toFile(hedef);
}

/**
 * Hattın beklenen çıktı dosyaları (`<kimlik>.webp`): her manifestin bütün sayfaları var sayılarak bağlanan kimlikleri. Bu kümedeki dosya
 * hiçbir çalıştırmada "eski" sayılmaz (yalnız --sayfa ya da tek manifestle çalışılsa da).
 */
export function beklenenDosyalar(manifestler, kayitlar, hedefler = new Set()) {
  const out = new Set();
  for (const m of manifestler) {
    const { cikti } = bagla(plan(esle(m, kayitlar).manifest).son, kayitlar, hedefler);
    for (const id of cikti.keys()) out.add(`${dosyaAdi(id)}.webp`);
  }
  return out;
}

/** Manifestin `belirsiz` metinlerinden geçen kimlikler (kontrol görselinde "?"). */
export function belirsizKimlikler(manifest, idler) {
  const metin = JSON.stringify(manifest.belirsiz ?? {});
  return new Set([...idler].filter((id) => new RegExp(`(^|[^a-z0-9/-])${id.replace(/[/-]/g, '\\$&')}([^a-z0-9/-]|$)`).test(metin)));
}

async function main() {
  const arg = (ad) => { const i = process.argv.indexOf(ad); return i >= 0 ? process.argv[i + 1] : undefined; };
  const kaynak = path.resolve(ROOT, arg('--kaynak') ?? 'assets-ham/esya');
  const kuru = process.argv.includes('--kuru');
  const kontrol = process.argv.includes('--kontrol');
  const yalniz = arg('--sayfa')?.split(',');
  const temizle = process.argv.includes('--temizle');
  const kayitlar = oyunKayitlari();
  const oku = (yol) => JSON.parse(fs.readFileSync(path.resolve(ROOT, yol), 'utf8'));
  const goreli = (yol) => path.relative(ROOT, yol).split(path.sep).join('/');
  const manifestYolu = path.resolve(ROOT, arg('--manifest') ?? ANA_MANIFEST);
  const anaMi = manifestYolu === path.resolve(ROOT, ANA_MANIFEST);
  const katalogYollari = [...new Set([...KATALOG_MANIFESTLER.map((y) => path.resolve(ROOT, y)).filter((y) => fs.existsSync(y)), ...(anaMi ? [] : [manifestYolu])])];
  const katalogHedef = new Set(katalogYollari.flatMap((y) => [...manifestKimlikleri(oku(y))]));
  const es = esle(oku(manifestYolu), kayitlar);
  const manifest = es.manifest;
  const varMi = (d) => fs.existsSync(path.join(kaynak, d));
  const { son, ezilen, atlanan, etkisiz } = plan(manifest, varMi);
  const { cikti, ust, kayitsiz } = bagla(son, kayitlar, katalogHedef);
  const kayitsizSet = new Set(kayitsiz);
  const hepsiniTut = new Set(manifest.hepsiniTut ?? []);
  const tamDespill = new Set(manifest.tamDespill ?? []);
  const cepTemizle = new Set(manifest.cepTemizle ?? []);
  const boslukKapali = new Set(manifest.boslukKapali ?? []);
  const boslukZorla = new Set(manifest.boslukZorla ?? []);
  const yoksay = new Set(manifest.yoksay ?? []);
  const belirsizIdler = belirsizKimlikler(manifest, son.keys());
  const OUT = path.join(ROOT, 'public/esya'); const OUTK = path.join(OUT, 'kucuk');
  const KON = path.join(ROOT, 'harita/belgeler/ESYA-IKON-KONTROL');
  if (!kuru) { fs.mkdirSync(OUTK, { recursive: true }); if (kontrol) fs.mkdirSync(KON, { recursive: true }); }
  const gorsel = new Map(); // kaynakId → { buyuk, kucuk } (son kazanan)
  const uyarilar = [];
  for (const s of manifest.sayfalar) {
    const ad = sayfaAdi(s.dosya);
    if (yoksay.has(ad) || !varMi(s.dosya) || (yalniz && !yalniz.includes(ad))) continue;
    const { out, zemin } = await sayfaIsle(path.join(kaynak, s.dosya), s, hepsiniTut, tamDespill, cepTemizle, boslukKapali, boslukZorla);
    for (const c of out) {
      if (!c.id) continue;
      if (c.bos) uyarilar.push(`${ad}#${c.hucre} ${c.id}: hücre boş çıktı`);
      if (c.kenar) uyarilar.push(`${ad}#${c.hucre} ${c.id}: ikon hücre kenarına değiyor (komşu hücreye taşmış olabilir)`);
      const sn = son.get(c.id);
      if (sn && sn.sayfa === ad && sn.hucre === c.hucre && c.buyuk) gorsel.set(c.id, c);
    }
    console.log(`${ad}: ${out.filter((c) => c.buyuk).length} ikon, zemin rgb(${zemin.join(',')})`);
    if (kontrol && !kuru) await kontrolGorseli(ad, s, out, son, belirsizIdler, kayitsizSet, path.join(KON, `${ad}.png`));
  }
  let yazilan = 0; let katalogYazilan = 0; const yazildi = new Set();
  for (const [id, sn] of cikti) {
    const g = gorsel.get(sn.kaynakId);
    if (!g) continue;
    yazilan++; yazildi.add(`${dosyaAdi(id)}.webp`);
    if (katalogHedef.has(id)) katalogYazilan++;
    if (kuru) continue;
    fs.writeFileSync(path.join(OUT, `${dosyaAdi(id)}.webp`), g.buyuk);
    fs.writeFileSync(path.join(OUTK, `${dosyaAdi(id)}.webp`), g.kucuk);
  }
  // Görev ESYA-IKON-AYIRT: üst kimlik kopyası paylaşan varyantlar (data/esya-ikon-ayirt.json) taban ikondan ayırt edilir; tabanlar
  // assets/esya-taban'a yazılır (bu çalıştırmada işlenmeyen sayfanın tabanı oradaki kayıttan), ayırt dosyaları kopyaların üstüne yazılır.
  if (!kuru && anaMi) { // ayırt verisi ana manifestin kayıtlarına bağlı; katalog çalıştırmasında atlanır
    const { ayirt, tabanYaz, veriOku } = await import('./esya-ikon-ayirt.mjs');
    const tabanlar = new Map();
    for (const g of veriOku(ROOT).gruplar) {
      const sn = son.get(g.taban); const gr = sn && gorsel.get(sn.kaynakId);
      if (gr) tabanlar.set(g.taban, { buyuk: gr.buyuk, kucuk: gr.kucuk });
    }
    tabanYaz(tabanlar, ROOT);
    await ayirt({ root: ROOT, hat: { BUYUK, KUCUK, cikti }, tabanlar });
  }
  // Tam çalıştırmada hiçbir manifestin (ana + katalog) hedefi olmayan dosyalar "eski"dir: listelenir, yalnız --temizle ile silinir.
  const eski = [];
  if (!yalniz && fs.existsSync(OUTK)) {
    const beklenen = beklenenDosyalar([oku(ANA_MANIFEST), ...katalogYollari.map(oku)], kayitlar, katalogHedef);
    for (const d of [OUT, OUTK]) for (const f of fs.readdirSync(d)) {
      if (f.endsWith('.webp') && !yazildi.has(f) && !beklenen.has(f)) eski.push(goreli(path.join(d, f)));
    }
  }
  const sil = temizle && !kuru;
  if (sil) for (const f of eski) fs.unlinkSync(path.join(ROOT, f));
  console.log(`${yazilan} kimlik yazıldı (katalog ${katalogYazilan})${kuru ? ' (kuru)' : ''}; manifest ${goreli(manifestYolu)}; varyant eşlendi ${es.varyant.length}, eşleşmeyen ${es.eslesmeyen.length}, belirsiz ${es.belirsiz.length}; üst kimlik kopyası ${ust.length}; eski dosya ${eski.length}${eski.length ? (sil ? ' silindi' : ' (silinmedi; --temizle)') : ''}; ezilen ${ezilen.length}; eksik sayfa ${atlanan.length ? atlanan.join(', ') : 'yok'}`);
  for (const id of kayitsiz) console.log(`  kayıtsız (yazılmadı): ${id}`);
  for (const f of eski) console.log(`  eski dosya${sil ? ' silindi' : ''}: ${f}`);
  for (const [id, eski, yeni] of ezilen) console.log(`  ezildi: ${id} ${eski} → ${yeni}`);
  for (const e of etkisiz) console.log(`  ayniGorsel: ${e}`);
  for (const u of uyarilar) console.log(`  uyarı: ${u}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
