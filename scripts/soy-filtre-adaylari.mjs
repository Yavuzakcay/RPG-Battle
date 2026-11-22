// GORSEL-DUZELTME: maskesiz soy boyası için yedek CSS filtresi adayları. Çalıştırma: node scripts/soy-filtre-adaylari.mjs
// Her boyalı soyun hedef rengi oyunun kendi verisinden: `data/soy-renkleri.json` (`lch` hedefi; Drow seçili paletin orta durağı;
// High Elf HSL hedefi) ve Dragonborn'da pul `orta` rengi (`data/dragonborn-pul.json`; mahkûm kıyafetinde boya pul yolundandır).
// Hedefin HSL tonu/doygunluğu/açıklığından 8 farklı filtre (sepia + hue-rotate + saturate + brightness + contrast bileşimleri;
// akromatik hedefte (gümüş, beyaz, bulut) hafif tema tonu korunur). Çıktı data/soy-filtre-adaylari.json (yalnız önizleme sayfası
// `onizleme-filtre.html` okur). Seçim data/soy-filtre-yedek.json'da (oyun okur); yoksa bu betik ilk adayı "seçim bekliyor" diye yazar,
// var olan seçimlere dokunmaz. Human ten tonları maskelidir (yedek yok).
import fs from 'node:fs';

const soy = JSON.parse(fs.readFileSync('data/soy-renkleri.json', 'utf8')).races;
const pul = JSON.parse(fs.readFileSync('data/dragonborn-pul.json', 'utf8')).soylar;

const lab2rgb = (L, a, b) => {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const fi = (t) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const x = fi(fx) * 0.95047, y = fi(fy), z = fi(fz) * 1.08883;
  const lin = [3.2404542 * x - 1.5371385 * y - 0.4985314 * z, -0.969266 * x + 1.8760108 * y + 0.041556 * z, 0.0556434 * x - 0.2040259 * y + 1.0572252 * z];
  return lin.map((c) => Math.round(Math.max(0, Math.min(1, c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)) * 255));
};
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hsl = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};
const hex = (rgb) => `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;

/** Soy → hedef renk (sRGB) ve kaynağı. Ten ortalaması L* ≈ 60 varsayılır (lch hedefinde `L` yoksa; gain/dL uygulanır). */
const hedef = {};
for (const [race, r] of Object.entries(soy)) {
  if (race === 'human') continue; // ten tonları maskeli (GORSEL-DUZELTME); yedek yok
  for (const [lin, to] of Object.entries(r.lineages ?? {})) {
    if (!to) continue;
    const key = `${race}/${lin}`;
    if (race === 'dragonborn' && pul[lin]) { hedef[key] = { rgb: hex2rgb(pul[lin].orta), kaynak: `dragonborn-pul.json soylar.${lin}.orta` }; continue; }
    if ('palet' in to) {
      const pal = r.paletler?.[lin]; const k = r[to.palet] ?? pal?.varsayilan; const g = pal?.secenekler?.[k]?.gradient;
      if (!g) continue;
      const m = g[Math.floor(g.length / 2)];
      hedef[key] = { rgb: lab2rgb(m[0], m[1], m[2]), kaynak: `soy-renkleri.json ${race}.paletler.${lin}.${k} orta durak` };
    } else if ('lch' in to) {
      const { h, c, L, gain = 1, dL = 0 } = to.lch;
      const Lt = L ?? Math.max(5, Math.min(95, 60 * gain + dL));
      const rad = (h * Math.PI) / 180;
      hedef[key] = { rgb: lab2rgb(Lt, c * Math.cos(rad), c * Math.sin(rad)), kaynak: `soy-renkleri.json ${race}.lineages.${lin}.lch` };
    } else if ('h' in to) {
      // Eski HSL yolu (High Elf): ton to.h, tipik ten doygunluğu/açıklığı ölçekli.
      const s = Math.min(1, 0.45 * to.s), l = Math.min(0.9, 0.55 * to.l);
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
      const H = (to.h ?? 0) / 360;
      hedef[key] = { rgb: [f(H + 1 / 3), f(H), f(H - 1 / 3)].map((v) => Math.round(v * 255)), kaynak: `soy-renkleri.json ${race}.lineages.${lin} (HSL)` };
    }
  }
}

const r1 = (n) => Math.round(n * 100) / 100;
const deg = (n) => `${Math.round(((n % 360) + 540) % 360 - 180)}deg`;
/** Sepia'nın kendi tonu (≈ 38°) ve tipik ten tonu (≈ 25°): hue-rotate bunlardan hedefe. */
const SEPIA = 38, TEN = 25;
const adaylar = {};
for (const [key, { rgb, kaynak }] of Object.entries(hedef)) {
  const [H, S, Lh] = rgb2hsl(rgb);
  const akromatik = S < 0.12;
  // Doygunluk çarpanı hedefin doygunluğuna göre; akromatikte düşük ama tema tonu kalsın.
  const m = akromatik ? 0.55 : Math.max(0.7, Math.min(2.2, 0.5 + 2.2 * S));
  const b = Math.max(0.55, Math.min(1.35, 0.6 + Lh * 0.9)); // hedef açıklığa göre parlaklık
  const d = deg(H - SEPIA);
  const list = [
    ['Hafif ton', `sepia(0.35) hue-rotate(${d}) saturate(${r1(1 + 0.25 * m)})`],
    ['Orta ton', `sepia(0.55) hue-rotate(${d}) saturate(${r1(1 + 0.55 * m)})`],
    ['Güçlü ton', `sepia(0.85) hue-rotate(${d}) saturate(${r1(1 + 1.1 * m)}) contrast(1.05)`],
    ['Soluk + boya', `grayscale(0.5) sepia(0.6) hue-rotate(${d}) saturate(${r1(1 + 0.8 * m)})`],
    ['Koyu ton', `sepia(0.6) hue-rotate(${d}) saturate(${r1(1 + 0.9 * m)}) brightness(${r1(Math.min(0.92, b * 0.9))}) contrast(1.1)`],
    ['Açık ton', `sepia(0.5) hue-rotate(${d}) saturate(${r1(1 + 0.5 * m)}) brightness(${r1(Math.max(1.06, b * 1.1))})`],
    ['Doğrudan döndürme', `hue-rotate(${deg(H - TEN)}) saturate(${r1(akromatik ? 0.6 : 1.1 + 0.3 * m)})`],
    ['Ton + hedef parlaklık', akromatik
      ? `grayscale(0.75) sepia(0.25) hue-rotate(${d}) brightness(${r1(b)}) contrast(1.05)`
      : `sepia(0.7) hue-rotate(${d}) saturate(${r1(0.8 + m)}) brightness(${r1(b)})`],
  ];
  adaylar[key] = { hedef: hex(rgb), kaynak, adaylar: list.map(([ad, filter], i) => ({ id: i + 1, ad, filter })) };
}

fs.writeFileSync('data/soy-filtre-adaylari.json', JSON.stringify({
  not: 'GORSEL-DUZELTME: node scripts/soy-filtre-adaylari.mjs üretir; elle düzenlenmez. Maskesi olmayan jetonda soy boyası yerine bütün jetona uygulanan yedek CSS filtresi adayları (soy başına 8; hedef renk oyunun verisinden). Önizleme ve seçim: npm run dev → /onizleme-filtre.html; seçim data/soy-filtre-yedek.json.',
  soylar: adaylar,
}, null, 1) + '\n');

const YEDEK = 'data/soy-filtre-yedek.json';
const old = fs.existsSync(YEDEK) ? JSON.parse(fs.readFileSync(YEDEK, 'utf8')) : { soylar: {} };
const soylar = {};
for (const [key, a] of Object.entries(adaylar)) {
  const cur = old.soylar?.[key];
  const sec = cur && !cur.bekliyor ? a.adaylar.find((x) => x.id === cur.aday) : undefined;
  soylar[key] = sec ? { aday: sec.id, filter: sec.filter } : { aday: 1, filter: a.adaylar[0].filter, bekliyor: true };
}
fs.writeFileSync(YEDEK, JSON.stringify({
  not: 'GORSEL-DUZELTME: maskesi olmayan jetonda soy boyası yerine bütün jetona uygulanan CSS filtresi (anahtar <ırk>/<soy>; oyun okur: src/ui/lineageLook.ts tintFallbackFilter). Yalnız maske yokken (ya da maskesiz boya hiçbir pikseli değiştirmezken) devreye girer; maske gelince kendiliğinden devre dışı (bu dosyaya dokunmadan). bekliyor: true = kullanıcı seçimi bekleniyor (geçici olarak ilk aday). Seçim: npm run dev → /onizleme-filtre.html → Kaydet (JSON panoya). Adaylar data/soy-filtre-adaylari.json.',
  soylar,
}, null, 1) + '\n');
console.log(`${Object.keys(adaylar).length} soy × 8 aday; seçim bekleyen ${Object.values(soylar).filter((s) => s.bekliyor).length}`);
