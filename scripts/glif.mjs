// Ortak simge setleri (glif): data/glif-esleme.json `sayfalar` (assets-ham/esya/glif-1.jpg, glif-2.jpg; 4×4, macenta #FF00FF zemin,
// 16 yuvarlak madalyon) → public/glif/<ad>.webp (`boyutlar.buyuk`) + public/glif/kucuk/<ad>.webp (`boyutlar.kucuk`), kontrol görseli
// harita/belgeler/GLIF-KONTROL/<sayfa>.png (numara + ad) ve `kesim` kaydı. Kesim çekirdeği kaynak ikonlarıyla ortak
// (scripts/lib/madalyon.mjs: bağlı bileşen + elips alfa); anahtar kenar tabanlı (madalyon içinde macenta/pembe yok varsayımı, yine de
// yalnız kenardan ulaşılan zemin silinir). Ad, madalyon merkezinin düştüğü ızgara hücresinden (soldan sağa, yukarıdan aşağı).
// Çalıştırma: npm run glif [-- --kuru] [-- --kontrol <klasör>]. Kaynak sayfa yoksa o sayfa atlanır, kaydı değişmez.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { components, edgeKeyMask, medallionRgba } from './lib/madalyon.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data/glif-esleme.json');
const OUT = path.join(ROOT, 'public/glif');
const TILE = 168;

/** Sayfadaki madalyonlar, hücre sırasıyla (hücre başına tam bir madalyon; yoksa hata). */
export function findMedallions(data, w, h, [cols, rows]) {
  const cellArea = (w / cols) * (h / rows);
  const comps = components(edgeKeyMask(data, w, h), w, h, Math.round(cellArea * 0.12));
  const byCell = new Map();
  for (const c of comps) {
    const cx = (c.x0 + c.x1) / 2; const cy = (c.y0 + c.y1) / 2;
    const cell = Math.min(rows - 1, Math.floor(cy / (h / rows))) * cols + Math.min(cols - 1, Math.floor(cx / (w / cols)));
    if (byCell.has(cell)) throw new Error(`hücre ${cell + 1}: birden çok madalyon (${comps.length} bileşen)`);
    byCell.set(cell, c);
  }
  const missing = [...Array(cols * rows).keys()].filter((k) => !byCell.has(k));
  if (missing.length) throw new Error(`madalyon bulunamayan hücreler: ${missing.map((k) => k + 1).join(', ')} (${comps.length} bileşen)`);
  return [...Array(cols * rows).keys()].map((k) => byCell.get(k));
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const label = (text, width) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="22"><text x="${width / 2}" y="16" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" fill="#e8e4da" text-anchor="middle">${esc(text)}</text></svg>`);

export async function cutGlyphs({ kuru = false, kontrol = path.join(ROOT, 'harita/belgeler/GLIF-KONTROL') } = {}) {
  const raw = fs.readFileSync(DATA, 'utf8');
  const cfg = JSON.parse(raw);
  const { buyuk, kucuk } = cfg.boyutlar;
  const kesim = { ...cfg.kesim };
  const report = [];
  for (const [si, page] of cfg.sayfalar.entries()) {
    const src = path.join(ROOT, page.kaynak);
    if (!fs.existsSync(src)) { report.push(`${page.kaynak} yok: sayfa ${si + 1} atlandı (${page.adlar.length} simge)`); continue; }
    const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info;
    const [cols, rows] = page.izgara;
    if (page.adlar.length !== cols * rows) throw new Error(`${page.kaynak}: ${page.adlar.length} ad, ızgara ${cols}×${rows}`);
    const comps = findMedallions(data, w, h, page.izgara);
    const tiles = [];
    if (!kuru) { fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(path.join(OUT, 'kucuk'), { recursive: true }); }
    for (const [k, c] of comps.entries()) {
      const ad = page.adlar[k];
      const { rgba, cw, ch } = medallionRgba(data, w, c);
      const base = sharp(rgba, { raw: { width: cw, height: ch, channels: 4 } });
      if (!kuru) {
        await base.clone().resize(buyuk, buyuk, { kernel: 'lanczos3', fit: 'fill' }).webp({ quality: 92, alphaQuality: 100, effort: 5 }).toFile(path.join(OUT, `${ad}.webp`));
        await base.clone().resize(kucuk, kucuk, { kernel: 'lanczos3', fit: 'fill' }).webp({ quality: 92, alphaQuality: 100, effort: 5 }).toFile(path.join(OUT, 'kucuk', `${ad}.webp`));
      }
      kesim[ad] = { sayfa: si + 1, hucre: k + 1, kutu: [c.x0, c.y0, c.x1, c.y1] };
      report.push(`${si + 1}.${String(k + 1).padStart(2, '0')} ${ad}: ${cw}×${ch} px`);
      // Kontrol karosu: koyu ve açık zeminde büyük, yanında küçük (48) ve satır içi boy (16); altta numara + ad.
      const big = await base.clone().resize(96, 96, { kernel: 'lanczos3', fit: 'fill' }).png().toBuffer();
      const small = await base.clone().resize(kucuk, kucuk, { kernel: 'lanczos3', fit: 'fill' }).png().toBuffer();
      const tiny = await base.clone().resize(16, 16, { kernel: 'lanczos3', fit: 'fill' }).png().toBuffer();
      tiles.push(await sharp({ create: { width: TILE, height: TILE, channels: 4, background: { r: 29, g: 33, b: 40, alpha: 1 } } })
        .composite([
          { input: { create: { width: TILE / 2, height: 120, channels: 4, background: { r: 226, g: 220, b: 204, alpha: 1 } } }, left: TILE / 2, top: 0 },
          { input: big, left: 8, top: 12 },
          { input: small, left: 112, top: 10 },
          { input: tiny, left: 128, top: 76 },
          { input: label(`${k + 1}. ${ad}`, TILE), left: 0, top: 128 },
        ]).png().toBuffer());
    }
    if (!kuru && kontrol) {
      fs.mkdirSync(kontrol, { recursive: true });
      const name = path.basename(page.kaynak).replace(/\.[^.]+$/, '');
      await sharp({ create: { width: cols * TILE + 8 * (cols + 1), height: rows * TILE + 8 * (rows + 1), channels: 4, background: { r: 14, g: 16, b: 20, alpha: 1 } } })
        .composite(tiles.map((input, i) => ({ input, left: 8 + (i % cols) * (TILE + 8), top: 8 + Math.floor(i / cols) * (TILE + 8) })))
        .png().toFile(path.join(kontrol, `${name}.png`));
    }
  }
  if (!kuru) {
    // Yalnız `kesim` (dosyanın son anahtarı) yeniden yazılır; elle biçimlenmiş üst kısım aynen kalır.
    const at = raw.lastIndexOf('"kesim"');
    if (at < 0) throw new Error('data/glif-esleme.json: "kesim" anahtarı yok');
    const order = cfg.sayfalar.flatMap((p) => p.adlar).filter((ad) => kesim[ad]);
    const body = order.map((ad) => `    ${JSON.stringify(ad)}: ${JSON.stringify(kesim[ad]).replace(/,"/g, ', "').replace(/":/g, '": ')}`).join(',\n');
    fs.writeFileSync(DATA, `${raw.slice(0, at)}"kesim": {${body ? `\n${body}\n  ` : ''}}\n}\n`);
  }
  return report;
}

if (process.argv[1] && process.argv[1].endsWith('glif.mjs')) {
  const i = process.argv.indexOf('--kontrol');
  const r = await cutGlyphs({ kuru: process.argv.includes('--kuru'), ...(i >= 0 ? { kontrol: process.argv[i + 1] } : {}) });
  console.log(r.join('\n'));
  const cut = r.filter((x) => /^\d+\.\d+ /.test(x)).length;
  console.log(`\n${cut} simge kesildi${process.argv.includes('--kuru') ? ' (kuru: dosya yazılmadı)' : ' → public/glif/ (128 px) + public/glif/kucuk/ (48 px)'}`);
}
