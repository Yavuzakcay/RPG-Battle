// Görev K24: yapay zekâ ile üretilmiş ham soy maskelerini içe aktarır. Çalıştırma:
//   npm run soy-maske-ice -- [--esik 128] [--zorla] [ad ...]
// Girdi assets/soy-maske-ham/<jeton>.png|jpg (her boyut); çıktı assets/soy-maske-el/<jeton>.png (jetonla aynı boyut,
// gri, 0/255; K21 biçimi). Var olan elle maske --zorla olmadan ezilmez (bu araçla yazılmış ve değişmemişse yenilenir).
// Kayıt data/soy-maske-yz.json (ölçümler, uyarılar, çıktının özeti), önizleme docs/sabah/soy-inceleme/ham/<jeton>.png.
// Ayrıntı docs/soy-maske-yz.md. Sonra: npm run soy-maske (elle maskeleri doğrulayıp kullanır), npm run soy-incele.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import soy from '../data/soy-renkleri.json';
import { importRawMask, rawMaskName, writeDecision } from '../src/ui/rawMask';
import { CHAR, ELLE, OTO, ROOT } from './soy-maske-yollar';
import { HAM, HAM_ONIZLEME, YZ_KAYIT, isYzMask, readYz, sha1, type YzEntry } from './soy-maske-yz';

const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];

const args = process.argv.slice(2);
const threshold = args.includes('--esik') ? Number(args[args.indexOf('--esik') + 1]) : undefined;
if (threshold !== undefined && !(threshold >= 1 && threshold <= 255)) throw new Error('--esik 1–255 olmalı');
const force = args.includes('--zorla');
const only = args.filter((x, i) => !x.startsWith('--') && args[i - 1] !== '--esik');

const sprites = new Set(Object.keys(soy.races).flatMap((r) => ['female', 'male'].flatMap((g) => CLASSES.map((c) => `${r}-${g}-${c}`)))
  .filter((n) => fs.existsSync(path.join(CHAR, `${n}.webp`))));
const kayit = readYz();
const files = fs.existsSync(HAM) ? fs.readdirSync(HAM).filter((f) => !f.startsWith('.') && f.toLowerCase() !== 'readme.md') : [];
const atlanan: string[] = [];
fs.mkdirSync(ELLE, { recursive: true });
fs.mkdirSync(HAM_ONIZLEME, { recursive: true });
let yazilan = 0;
for (const file of files) {
  const name = rawMaskName(file, sprites);
  if (!name) { atlanan.push(`${file}: ad bir soylu jetonla eşleşmiyor (<ırk>-<male|female>-<sınıf>.png|jpg)`); continue; }
  if (only.length && !only.includes(name)) continue;
  const { data: sp, info } = await sharp(path.join(CHAR, `${name}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const alpha = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) alpha[p] = sp[p * 4 + 3]!;
  // Gri ton: saydam pikseller siyah sayılır (JPG ve PNG aynı yol).
  const g = await sharp(path.join(HAM, file)).flatten({ background: '#000000' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const auto = fs.existsSync(path.join(OTO, `${name}.png`)) ? new Uint8Array(await sharp(path.join(OTO, `${name}.png`)).greyscale().resize(W, H, { kernel: 'nearest' }).raw().toBuffer()) : undefined;
  const r = importRawMask({ data: new Uint8Array(g.data), w: g.info.width, h: g.info.height }, alpha, W, H, { ...(threshold ? { threshold } : {}), ...(auto ? { auto } : {}) });
  const out = path.join(ELLE, `${name}.png`);
  const exists = fs.existsSync(out);
  const decision = writeDecision(exists, exists && isYzMask(name, kayit), force);
  const entry: YzEntry = { kaynak: path.relative(ROOT, path.join(HAM, file)), durum: decision === 'yaz' ? 'yazildi' : 'atlandi', fit: r.fit, olcum: r.metrics, uyarilar: [...r.warnings] };
  if (decision === 'atla') {
    entry.uyarilar.unshift('assets/soy-maske-el/ içinde aynı adlı elle maske var: ezilmedi (--zorla ile ezilir)');
    entry.sha1 = kayit.sprites[name]?.sha1;
  } else {
    const png = await sharp(Buffer.from(r.mask), { raw: { width: W, height: H, channels: 1 } }).png({ compressionLevel: 9 }).toBuffer();
    fs.writeFileSync(out, png);
    entry.sha1 = sha1(png);
    yazilan++;
  }
  kayit.sprites[name] = entry;
  // Önizleme: ham görsel · temizlenmiş maske · jeton üstünde kırmızı örtü.
  const T = 128;
  const ov = Buffer.from(sp);
  for (let p = 0; p < W * H; p++) if (r.mask[p]) { ov[p * 4] = Math.round(ov[p * 4]! * 0.4 + 255 * 0.6); ov[p * 4 + 1] = Math.round(ov[p * 4 + 1]! * 0.4); ov[p * 4 + 2] = Math.round(ov[p * 4 + 2]! * 0.4); ov[p * 4 + 3] = 255; }
  const tiles = [
    await sharp(path.join(HAM, file)).resize(T, T, { fit: 'contain', background: '#202028' }).png().toBuffer(),
    await sharp(Buffer.from(r.mask), { raw: { width: W, height: H, channels: 1 } }).resize(T, T, { kernel: 'nearest' }).png().toBuffer(),
    await sharp(ov, { raw: { width: W, height: H, channels: 4 } }).resize(T, T, { kernel: 'nearest' }).png().toBuffer(),
  ];
  await sharp({ create: { width: 3 * T + 8, height: T, channels: 4, background: { r: 40, g: 40, b: 52, alpha: 1 } } })
    .composite(tiles.map((input, i) => ({ input, left: i * (T + 4), top: 0 }))).png().toFile(path.join(HAM_ONIZLEME, `${name}.png`));
  for (const w of entry.uyarilar) console.warn(`UYARI ham maske ${name}: ${w}`);
}
kayit.atlanan = atlanan;
kayit.note = 'Görev K24: npm run soy-maske-ice üretir; elle düzenlenmez. sprites: yapay zekâ ham maskesinden assets/soy-maske-el/\'e yazılan (ya da var olan elle maske yüzünden atlanan) maskeler; sha1: yazılan dosyanın özeti (değişmişse elle düzenlenmiş sayılır, inceleme sayfasında "ELLE"); fit: canvas (ham görsel tuvalin tamamı) ya da box (jetonun opak kutusu); olcum: aspect (ham en-boy), iou (otomatik maskeyle), white (beyazın opak alana oranı), spill (jeton dışına taşan beyaz, silindi), removed/filled (temizlik). atlanan: adı eşleşmeyen dosyalar.';
fs.writeFileSync(YZ_KAYIT, JSON.stringify(kayit, null, 1) + '\n');
for (const a of atlanan) console.warn(`UYARI ham maske: ${a} — atlandı.`);
console.log(`ham maske: ${files.length} dosya, ${yazilan} yazıldı, ${atlanan.length} ad eşleşmedi. Sonra: npm run soy-maske && npm run soy-incele`);
