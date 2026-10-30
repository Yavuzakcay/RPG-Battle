// Görev K21: soy maskesi inceleme sayfası. Çalıştırma: npm run soy-incele
// docs/sabah/soy-inceleme/index.html (internetsiz): Goliath, Dragonborn ve Drow'un bütün jetonları için orijinal,
// kullanılan maske (kırmızı örtü), maske kaynağı (otomatik/elle) ve soyların boyanmış hâlleri; sablon/<ad>.png çizim
// şablonları (siyah zemin + yarı saydam jeton; elle maske klasörüne KONMAZ). Elle maskeler önce doğrulanır.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { tintPixels } from '../src/ui/tint';
import { lineagePalette, lineageTint, paletteKeys, paletteTint } from '../src/battle/avatar';
import soy from '../data/soy-renkleri.json';
import { CHAR, INCELE, OTO } from './soy-maske-yollar';
import { applyHandMasks } from './soy-maske-el';
import { basOverlay, buildHeads } from './soy-bas';
import { applyHeadOverlay } from '../src/ui/headOverlay';
import { HAM_ONIZLEME, isYzMask, readYz } from './soy-maske-yz';

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
const heads = await buildHeads();
fs.mkdirSync(path.join(INCELE, 'img'), { recursive: true });
fs.mkdirSync(path.join(INCELE, 'sablon'), { recursive: true });
const tile = (buf: Buffer, W: number, H: number) => sharp(buf, { raw: { width: W, height: H, channels: 4 } }).resize(T, T, { kernel: 'nearest' }).png().toBuffer();
let rows = '';
// Görev K24: yapay zekâ ham maskelerinin kaydı (önizleme docs/sabah/soy-inceleme/ham/<ad>.png, npm run soy-maske-ice).
const yz = readYz();
const tag = (t: string, cls: string) => `<span class="tag ${cls}">${esc(t)}</span>`;
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
  // Görev K22: kafa kaplaması (kapsamdaki jetonlarda): soy boyamaları kaplanmış kafayla; sonda önce/sonra.
  const bas = await basOverlay(name);
  const base01 = mask ?? Uint8Array.from(hw ?? [], (w) => (w > 0 ? 1 : 0));
  for (const lin of lins) {
    const px = new Uint8ClampedArray(data);
    const t = lineageTint(race, lin, g as 'male' | 'female');
    const r = bas ? applyHeadOverlay(px, base01, bas.ov, bas.box, W, { body: bas.body }) : null;
    // Görev K23: gövde boyası kapalıysa yalnızca kafa (yumuşak boyun geçişi).
    if (t) tintPixels(px, t, r ? (r.weights ? undefined : r.mask) : mask, r ? r.weights : hw);
    tiles.push(await tile(Buffer.from(px.buffer), W, H));
  }
  let headNote = '';
  if (bas) {
    const after = new Uint8ClampedArray(data);
    applyHeadOverlay(after, base01, bas.ov, bas.box, W);
    tiles.push(await tile(Buffer.from(data), W, H), await tile(Buffer.from(after.buffer), W, H));
    headNote = ` · KAFA: önce · sonra${bas.body ? '' : ' · GÖVDE: kapalı'}`;
  } else if (heads.atlanan[name]) headNote = ` · atlandı: ${heads.atlanan[name]}`;
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
  const ai = src && isYzMask(name, yz);
  const ye = yz.sprites[name];
  const hamCol = ye && fs.existsSync(path.join(HAM_ONIZLEME, `${name}.png`))
    ? `<td><img src="ham/${name}.png" alt="ham ${name}"><div class="cap">ham görsel · temizlenmiş maske · jeton üstünde örtü</div><div>${ye.durum === 'atlandi' ? tag('atlandı', 'red') : tag('yazıldı', 'green')}${ye.olcum?.iou != null ? tag(`IoU ${ye.olcum.iou}`, ye.olcum.iou < 0.3 ? 'red' : 'green') : ''}${ye.olcum ? tag(`beyaz %${Math.round(ye.olcum.white * 100)}`, ye.olcum.white < 0.02 || ye.olcum.white > 0.8 ? 'red' : 'green') : ''}${ye.uyarilar.map((w) => tag(w, 'orange')).join('')}</div></td>`
    : '<td class="cap">ham maske yok</td>';
  rows += `<tr class="${src ? 'el' : 'oto'}"><td><b>${name}</b><br>${race === 'elf' ? 'elf (drow)' : race} · ${g === 'male' ? 'erkek' : 'kadın'} · ${cls}<br>maske: <span class="src">${ai ? 'ELLE (yapay zekâ)' : src ? 'ELLE' : 'otomatik'}</span><br><code>${src ? `assets/soy-maske-el/${name}.png` : `public/characters/maske/${name}.png`}</code><br>şablon: <code>sablon/${name}.png</code><br>elle maske adı: <code>assets/soy-maske-el/${name}.png</code></td><td><img src="img/${name}.png" alt="${name}"><div class="cap">orijinal · maske (kırmızı) · ${lins.map(esc).join(' · ')}${esc(headNote)}</div></td>${hamCol}</tr>\n`;
}
const warn = hand.warnings.length ? `<div class="warn"><b>Elle maske uyarıları</b><ul>${hand.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>` : '<p>Elle maske uyarısı yok.</p>';
// DROW-PALET: dört palet; her palet için Monk, Barbarian, Sorcerer, Fighter, Rogue (kadın, erkek): Drow (palet) ·
// High Elf · Wood Elf. Seçili palet (data/soy-renkleri.json `elf.drowPalet`) işaretli. Görsel img/drow-palet-<P>.png.
const PAL_CLASSES = ['monk', 'barbarian', 'sorcerer', 'fighter', 'rogue'];
const selected = lineagePalette('elf', 'drow')?.key;
let palHtml = '';
for (const P of paletteKeys('elf', 'drow')) {
  const tiles: Buffer[] = [];
  for (const g of ['female', 'male'] as const) for (const cls of PAL_CLASSES) {
    const name = `elf-${g}-${cls}`;
    const { data, info } = await sharp(path.join(CHAR, `${name}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    const hw = hand.weights.get(name);
    let mask: Uint8Array | undefined;
    if (!hw) { const m = await sharp(path.join(OTO, `${name}.png`)).greyscale().raw().toBuffer(); mask = new Uint8Array(m.length); for (let i = 0; i < m.length; i++) mask[i] = m[i]! > 127 ? 1 : 0; }
    for (const t of [paletteTint('elf', 'drow', P), lineageTint('elf', 'high-elf', g), lineageTint('elf', 'wood-elf', g)]) {
      const px = new Uint8ClampedArray(data);
      // High Elf eski yolda maskesiz (K8b); Wood Elf boyanmaz.
      if (t) tintPixels(px, t, 'select' in t && !('lch' in t.to) && !('gradient' in t.to) ? undefined : mask, 'gradient' in t.to ? hw : undefined);
      tiles.push(await tile(Buffer.from(px.buffer), W, H));
    }
  }
  const cols = 6, gap = 4, rowsN = Math.ceil(tiles.length / cols);
  await sharp({ create: { width: cols * (T + gap), height: rowsN * (T + gap), channels: 4, background: { r: 40, g: 40, b: 52, alpha: 1 } } })
    .composite(tiles.map((input, i) => ({ input, left: (i % cols) * (T + gap), top: Math.floor(i / cols) * (T + gap) }))).png({ compressionLevel: 9 })
    .toFile(path.join(INCELE, 'img', `drow-palet-${P}.png`));
  const names: Record<string, string> = { A: 'kömür-mavi', B: 'mor-mavi', C: 'kül-gri', D: 'gece-mavi' };
  palHtml += `<h3>Palet ${P}: ${names[P] ?? ''}${P === selected ? ' <span class="tag green">seçili</span>' : ''}</h3><img src="img/drow-palet-${P}.png" alt="Drow palet ${P}"><div class="cap">her satır üç jeton grubu: Drow (palet ${P}) · High Elf · Wood Elf; kadın ve erkek, Monk · Barbarian · Sorcerer · Fighter · Rogue</div>\n`;
}

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Soy maskesi inceleme</title><style>
body{background:#1e1e28;color:#ddd;font:14px sans-serif;margin:16px}table{border-collapse:collapse}td{border-bottom:1px solid #333;padding:6px;vertical-align:top}
td:first-child{width:330px}code{color:#9cf;font-size:12px}.el .src{color:#7f7}.oto .src{color:#fc6}img{image-rendering:pixelated;display:block}.cap{color:#888;font-size:12px}
.warn{background:#4a2a2a;padding:8px;margin-bottom:12px}.tag{display:inline-block;border-radius:4px;padding:1px 6px;margin:2px 4px 0 0;font-size:12px;color:#111}.tag.green{background:#7c7}.tag.orange{background:#fb6}.tag.red{background:#f77}</style></head><body><h1>Soy maskesi inceleme (Görev K21)</h1>
<p>Kırmızı örtü boyanacak ten bölgesidir. Örtü saça, zırha, kürke ya da silaha taşıyorsa o jeton için elle maske çizin (docs/soy-maske-el.md). Elle maskeler: ${Object.values(hand.sources).filter((x) => x === 'el').length} / ${sprites.length}.</p>
<h2>Drow paletleri</h2><p>Seçim: <code>data/soy-renkleri.json</code> → <code>elf.drowPalet</code> (A, B, C, D). Değiştirip <code>npm run soy-maske</code> ve <code>npm run soy-incele</code>.</p>${palHtml}${warn}${yz.atlanan.length ? `<div class="warn"><b>Ham maske: adı eşleşmeyen dosyalar</b><ul>${yz.atlanan.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}<table><tr><th>jeton</th><th>maske ve soylar</th><th>ham maske (yapay zekâ)</th></tr>${rows}</table></body></html>`;
fs.writeFileSync(path.join(INCELE, 'index.html'), html);
console.log(`inceleme: ${path.relative(process.cwd(), path.join(INCELE, 'index.html'))} (${sprites.length} jeton)`);
