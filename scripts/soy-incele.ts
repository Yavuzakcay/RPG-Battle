// Görev K21: soy maskesi inceleme sayfası. Çalıştırma: npm run soy-incele
// docs/sabah/soy-inceleme/index.html (internetsiz): Goliath, Dragonborn ve Drow'un bütün jetonları için orijinal,
// kullanılan maske (kırmızı örtü), maske kaynağı (otomatik/elle) ve soyların boyanmış hâlleri; sablon/<ad>.png çizim
// şablonları (siyah zemin + yarı saydam jeton; elle maske klasörüne KONMAZ). Elle maskeler önce doğrulanır.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { tintPixels } from '../src/ui/tint';
import { lineageTint } from '../src/battle/avatar';
import soy from '../data/soy-renkleri.json';
import { CHAR, INCELE, OTO } from './soy-maske-yollar';
import { applyHandMasks } from './soy-maske-el';

const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
const RACES: Array<[string, string[]]> = [
  ['goliath', Object.keys((soy.races as Record<string, { lineages: object }>).goliath!.lineages)],
  ['dragonborn', Object.keys((soy.races as Record<string, { lineages: object }>).dragonborn!.lineages)],
  ['elf', ['drow']],
];
const T = 128;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const sprites = RACES.flatMap(([r]) => ['female', 'male'].flatMap((g) => CLASSES.map((c) => `${r}-${g}-${c}`)));
const all = Object.keys(soy.races).flatMap((r) => ['female', 'male'].flatMap((g) => CLASSES.map((c) => `${r}-${g}-${c}`)));
const hand = await applyHandMasks(all);
fs.mkdirSync(path.join(INCELE, 'img'), { recursive: true });
fs.mkdirSync(path.join(INCELE, 'sablon'), { recursive: true });
const tile = (buf: Buffer, W: number, H: number) => sharp(buf, { raw: { width: W, height: H, channels: 4 } }).resize(T, T, { kernel: 'nearest' }).png().toBuffer();
let rows = '';
for (const [race, lins] of RACES) for (const g of ['female', 'male']) for (const cls of CLASSES) {
  const name = `${race}-${g}-${cls}`;
  const { data, info } = await sharp(path.join(CHAR, `${name}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const hw = hand.weights.get(name);
  let mask: Uint8Array | undefined;
  if (!hw) {
    const m = await sharp(path.join(OTO, `${name}.png`)).greyscale().raw().toBuffer();
    mask = new Uint8Array(m.length); for (let i = 0; i < m.length; i++) mask[i] = m[i]! > 127 ? 1 : 0;
  }
  const weight = (p: number) => (hw ? hw[p]! / 255 : mask![p]! ? 1 : 0);
  const ov = Buffer.from(data);
  for (let p = 0; p < W * H; p++) {
    const w = weight(p) * 0.6;
    if (!w) continue;
    ov[p * 4] = Math.round(ov[p * 4]! * (1 - w) + 255 * w); ov[p * 4 + 1] = Math.round(ov[p * 4 + 1]! * (1 - w)); ov[p * 4 + 2] = Math.round(ov[p * 4 + 2]! * (1 - w));
    ov[p * 4 + 3] = Math.max(ov[p * 4 + 3]!, Math.round(255 * w));
  }
  const tiles = [await tile(Buffer.from(data), W, H), await tile(ov, W, H)];
  for (const lin of lins) {
    const px = new Uint8ClampedArray(data);
    const t = lineageTint(race, lin, g as 'male' | 'female');
    if (t) tintPixels(px, t, mask, hw);
    tiles.push(await tile(Buffer.from(px.buffer), W, H));
  }
  await sharp({ create: { width: T * tiles.length + 4 * (tiles.length - 1), height: T, channels: 4, background: { r: 40, g: 40, b: 52, alpha: 1 } } })
    .composite(tiles.map((input, i) => ({ input, left: i * (T + 4), top: 0 }))).png({ compressionLevel: 9 }).toFile(path.join(INCELE, 'img', `${name}.png`));
  // Çizim şablonu: siyah zemin + %35 saydam jeton (renkli: elle maske klasörüne konursa doğrulama reddeder).
  const tpl = Buffer.alloc(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    const a = (data[p * 4 + 3]! / 255) * 0.35;
    for (let k = 0; k < 3; k++) tpl[p * 4 + k] = Math.round(data[p * 4 + k]! * a);
    tpl[p * 4 + 3] = 255;
  }
  await sharp(tpl, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(INCELE, 'sablon', `${name}.png`));
  const src = hand.sources[name] === 'el';
  rows += `<tr class="${src ? 'el' : 'oto'}"><td><b>${name}</b><br>${race === 'elf' ? 'elf (drow)' : race} · ${g === 'male' ? 'erkek' : 'kadın'} · ${cls}<br>maske: <span class="src">${src ? 'ELLE' : 'otomatik'}</span><br><code>${src ? `assets/soy-maske-el/${name}.png` : `public/characters/maske/${name}.png`}</code><br>şablon: <code>sablon/${name}.png</code><br>elle maske adı: <code>assets/soy-maske-el/${name}.png</code></td><td><img src="img/${name}.png" alt="${name}"><div class="cap">orijinal · maske (kırmızı) · ${lins.map(esc).join(' · ')}</div></td></tr>\n`;
}
const warn = hand.warnings.length ? `<div class="warn"><b>Elle maske uyarıları</b><ul>${hand.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>` : '<p>Elle maske uyarısı yok.</p>';
const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Soy maskesi inceleme</title><style>
body{background:#1e1e28;color:#ddd;font:14px sans-serif;margin:16px}table{border-collapse:collapse}td{border-bottom:1px solid #333;padding:6px;vertical-align:top}
td:first-child{width:330px}code{color:#9cf;font-size:12px}.el .src{color:#7f7}.oto .src{color:#fc6}img{image-rendering:pixelated;display:block}.cap{color:#888;font-size:12px}
.warn{background:#4a2a2a;padding:8px;margin-bottom:12px}</style></head><body><h1>Soy maskesi inceleme (Görev K21)</h1>
<p>Kırmızı örtü boyanacak ten bölgesidir. Örtü saça, zırha, kürke ya da silaha taşıyorsa o jeton için elle maske çizin (docs/soy-maske-el.md). Elle maskeler: ${Object.values(hand.sources).filter((x) => x === 'el').length} / ${sprites.length}.</p>
${warn}<table>${rows}</table></body></html>`;
fs.writeFileSync(path.join(INCELE, 'index.html'), html);
console.log(`inceleme: ${path.relative(process.cwd(), path.join(INCELE, 'index.html'))} (${sprites.length} jeton)`);
