// Dragonborn pul deseni v2: oyun kodundan (src/ui/scaleTint.ts) kontak sayfaları (yalnız önizleme; public/ ve data/ değişmez).
// `npx vite-node scripts/dragonborn-pul-sayfa.ts`
// Çıktı docs/sabah/dragonborn-desen-v2/tam/:
//   sinif-<sınıf>.webp  satır = sınıfın jetonları (erkek + kadın), sütun = orijinal + 10 soy × (önce: eski çarpma filtresi | sonra: pul v2), 128 px
//   supheli-NN.webp     şüpheli jetonlar (suphe.json kodları; hiçbiri dışlanmadı): orijinal | Kırmızı | Mavi | Beyaz, 256 px, kırmızı çerçeve
//   savas-64.webp       bütün jetonlar × 10 soy, 64 px (savaş boyutu)
//   ozet.json           boyanan / maskesiz jeton sayısı
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { scaleMaskless, scalePixels } from '../src/ui/scaleTint';
import { multiplyPixels } from '../src/ui/tint';

const C = 'public/characters', OUT = 'docs/sabah/dragonborn-desen-v2/tam';
const SOY = ['black', 'blue', 'brass', 'bronze', 'copper', 'gold', 'green', 'red', 'silver', 'white'];
const AD: Record<string, string> = { black: 'Siyah', blue: 'Mavi', brass: 'Pirinç', bronze: 'Bronz', copper: 'Bakır', gold: 'Altın', green: 'Yeşil', red: 'Kırmızı', silver: 'Gümüş', white: 'Beyaz' };
// Önce: KQ6'dan bu göreve dek oyundaki çarpma filtresi (data/soy-renkleri.json eski `lineagesAlt` değerleri; White boyasız).
const ESKI: Record<string, string> = { black: '#5b606e', blue: '#5f84e8', brass: '#d9b25a', bronze: '#b07a48', copper: '#df7f58', gold: '#f6cc3c', green: '#58b068', red: '#e4524c', silver: '#c4cad6', white: '#ffffff' };
const BG = { r: 44, g: 48, b: 58, alpha: 1 };
const SINIF = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
const KOD: Record<string, string> = { TD: 'ten tonu dışı parça', AB: 'boyanmamış açık bölge', KP: 'küçük ayrık parçalar', YO: 'yoldaş çıkarıldı', GI: 'incelemede görülen sızıntı', MY: 'maske yok' };
const GORULEN = new Set(['dragonborn-kadin-fighter-ID4', 'dragonborn-erkek-ranger-ID4']);

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (w: number, h: number, s: string, color = '#e6e8ee', size = 12) =>
  Buffer.from(`<svg width="${w}" height="${h}"><text x="3" y="${h - 5}" font-size="${size}" fill="${color}" font-family="DejaVu Sans, Arial, sans-serif">${esc(s)}</text></svg>`);
const frame = (w: number, h: number, color = '#eb3232', sw = 3) =>
  Buffer.from(`<svg width="${w}" height="${h}"><rect x="${sw / 2}" y="${sw / 2}" width="${w - sw}" height="${h - sw}" fill="none" stroke="${color}" stroke-width="${sw}"/></svg>`);

const names = fs.readdirSync(C).filter((f) => /^dragonborn-(erkek|kadin)-.*\.webp$/.test(f)).map((f) => f.slice(0, -5)).sort();
const less = scaleMaskless();
const suphe = JSON.parse(fs.readFileSync(path.join(OUT, 'suphe.json'), 'utf8')).jetonlar as Record<string, { suphe: string[] }>;
const codesOf = (n: string): string[] => {
  const k = (suphe[n.replace(/^dragonborn-/, '')]?.suphe ?? []).filter((c) => c !== 'MY' && c !== 'GI');
  if (GORULEN.has(n)) k.push('GI');
  if (n in less) k.push('MY');
  return k;
};

const cache = new Map<string, { data: Buffer; W: number; H: number; mask: Uint8Array | null }>();
async function load(n: string) {
  let e = cache.get(n);
  if (!e) {
    const { data, info } = await sharp(path.join(C, `${n}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const mf = path.join(C, 'maske-pul', `${n}.png`);
    const mask = fs.existsSync(mf) ? Uint8Array.from(await sharp(mf).greyscale().raw().toBuffer(), (v) => (v > 127 ? 1 : 0)) : null;
    e = { data, W: info.width, H: info.height, mask }; cache.set(n, e);
  }
  return e;
}
async function render(n: string, soy: string | null, kind: 'once' | 'sonra' | 'orijinal', size: number): Promise<Buffer> {
  const e = await load(n);
  const px = new Uint8ClampedArray(e.data);
  if (soy && kind === 'once' && soy !== 'white') multiplyPixels(px, { renk: ESKI[soy]!, muaf: 0.12, tam: 0.28 });
  if (soy && kind === 'sonra' && e.mask) scalePixels(px, soy, e.mask, e.W, e.H);
  const img = sharp(Buffer.from(px.buffer), { raw: { width: e.W, height: e.H, channels: 4 } });
  const scaled = size === e.W ? img : img.resize(size, size, { kernel: size === 128 ? 'nearest' : 'lanczos3' });
  return sharp(await scaled.png().toBuffer()).flatten({ background: BG }).png().toBuffer();
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (/^(siyah|mavi|pirinc|bronz|bakir|altin|yesil|kirmizi|gumus|beyaz)-\d\d\.webp$/.test(f)) fs.rmSync(path.join(OUT, f));

// 1) sınıf sayfaları
const S = 128, NAMEW = 230, HEAD = 40;
for (const cls of SINIF) {
  const rows = names.filter((n) => n.split('-')[2] === cls);
  const W = NAMEW + S + SOY.length * (2 * S + 8), H = HEAD + rows.length * (S + 6);
  const comp: sharp.OverlayOptions[] = [{ input: text(W, 22, `${cls}: satır = jeton; her soyda sol = önce (eski çarpma filtresi), sağ = sonra (pul v2). Kırmızı çerçeve = şüpheli, gri = maskesiz (boyanmadı).`, '#e6e8ee', 13), left: 0, top: 0 }];
  comp.push({ input: text(S, 18, 'orijinal'), left: NAMEW, top: 20 });
  SOY.forEach((s, i) => comp.push({ input: text(2 * S, 18, `${AD[s]}: önce | sonra`), left: NAMEW + S + i * (2 * S + 8), top: 20 }));
  for (const [r, n] of rows.entries()) {
    const y = HEAD + r * (S + 6), k = codesOf(n);
    comp.push({ input: text(NAMEW, S / 2 + 10, n.replace(/^dragonborn-/, ''), k.length ? '#f07070' : '#e6e8ee', 13), left: 0, top: y });
    if (k.length) comp.push({ input: text(NAMEW, 22, k.join(','), '#f07070', 12), left: 0, top: y + S / 2 + 8 });
    comp.push({ input: await render(n, null, 'orijinal', S), left: NAMEW, top: y });
    for (const [i, s] of SOY.entries()) {
      const x = NAMEW + S + i * (2 * S + 8);
      comp.push({ input: await render(n, s, 'once', S), left: x, top: y }, { input: await render(n, s, 'sonra', S), left: x + S, top: y });
      if (k.length) comp.push({ input: frame(S, S, k.includes('MY') ? '#9aa0aa' : '#eb3232', 2), left: x + S, top: y });
    }
  }
  await sharp({ create: { width: W, height: H, channels: 4, background: BG } }).composite(comp).webp({ quality: 90 }).toFile(path.join(OUT, `sinif-${cls}.webp`));
  console.log('sınıf', cls, rows.length);
}

// 2) şüpheli sayfaları (256 px): orijinal | Kırmızı | Mavi | Beyaz
const sus = names.filter((n) => codesOf(n).length);
const Z = 256, PER = 12, cols = ['orijinal', 'red', 'blue', 'white'];
for (let p = 0; p * PER < sus.length; p++) {
  const chunk = sus.slice(p * PER, p * PER + PER), half = Math.ceil(chunk.length / 2);
  const BW = 4 * Z + 30, W = 2 * BW, H = 30 + half * (Z + 26);
  const comp: sharp.OverlayOptions[] = [{ input: text(W, 26, 'Şüpheli jetonlar (dışlanmadı, hepsi boyalı): orijinal | Kırmızı | Mavi | Beyaz. Kodlar: ' + Object.entries(KOD).map(([a, b]) => `${a} ${b}`).join('; '), '#e6e8ee', 13), left: 0, top: 0 }];
  for (const [i, n] of chunk.entries()) {
    const bx = Math.floor(i / half) * BW, y = 30 + (i % half) * (Z + 26), k = codesOf(n);
    for (const [c, s] of cols.entries()) comp.push({ input: await render(n, s === 'orijinal' ? null : s, s === 'orijinal' ? 'orijinal' : 'sonra', Z), left: bx + c * Z, top: y });
    comp.push({ input: frame(4 * Z, Z, k.includes('MY') ? '#9aa0aa' : '#eb3232', 3), left: bx, top: y });
    comp.push({ input: text(4 * Z, 22, `${n.replace(/^dragonborn-/, '')}  [${k.map((c) => `${c} ${KOD[c]}`).join('; ')}]`, '#f07070', 13), left: bx, top: y + Z + 2 });
  }
  await sharp({ create: { width: W, height: H, channels: 4, background: BG } }).composite(comp).webp({ quality: 90 }).toFile(path.join(OUT, `supheli-${String(p + 1).padStart(2, '0')}.webp`));
}

// 3) savaş boyutu 64 px
{
  const s = 64, NW = 200, half = Math.ceil(names.length / 2), BW = NW + 11 * s + 20, W = 2 * BW, H = 24 + half * (s + 2);
  const comp: sharp.OverlayOptions[] = [];
  for (let b = 0; b < 2; b++) ['orijinal', ...SOY.map((x) => AD[x]!)].forEach((h, c) => comp.push({ input: text(s, 20, h.slice(0, 8), '#e6e8ee', 11), left: b * BW + NW + c * s, top: 0 }));
  for (const [i, n] of names.entries()) {
    const bx = Math.floor(i / half) * BW, y = 24 + (i % half) * (s + 2), k = codesOf(n);
    comp.push({ input: text(NW, s - 18, n.replace(/^dragonborn-/, '') + (k.length ? ` [${k.join(',')}]` : ''), k.length ? '#f07070' : '#e6e8ee', 11), left: bx, top: y });
    comp.push({ input: await render(n, null, 'orijinal', s), left: bx + NW, top: y });
    for (const [c, so] of SOY.entries()) comp.push({ input: await render(n, so, 'sonra', s), left: bx + NW + (c + 1) * s, top: y });
  }
  await sharp({ create: { width: W, height: H, channels: 4, background: BG } }).composite(comp).webp({ quality: 90 }).toFile(path.join(OUT, 'savas-64.webp'));
}
const ozet = { jeton: names.length, boyanan: names.length - Object.keys(less).length, maskesiz: less, supheli: sus.filter((n) => !(n in less)).map((n) => ({ jeton: n, kod: codesOf(n) })) };
fs.writeFileSync(path.join(OUT, 'ozet.json'), JSON.stringify(ozet, null, 1) + '\n');
console.log('boyanan', ozet.boyanan, 'maskesiz', Object.keys(less).length, 'şüpheli (boyalı)', ozet.supheli.length);
