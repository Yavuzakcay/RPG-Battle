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
// Kullanım: node scripts/katalog-ikon-kusur.mjs [--kaynak <klasör>] [--duzeltme]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { sayfaAdi } from './esya-ikon.mjs';

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
      const ikon = path.join(ROOT, 'public/esya', `${o.id}.webp`);
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
  const kesin = satirlar.filter((r) => r.kesin); const belirsiz = satirlar.filter((r) => !r.kesin);
  const tur = (liste) => Object.values(KUSUR).map((k) => `${k.ad} ${liste.filter((r) => r.ad === k.ad).length}`).join(', ');
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
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'harita/belgeler/KATALOG-IKON-KUSUR.md'), md);
  console.log(`taranan ${taranan}, kusurlu hücre ${kusurlu.length}, kusur satırı ${kesin.length}, belirsiz ${belirsiz.length}`);
  if (!duzeltme) return;

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
