// Dragonborn renk önizlemesi (yalnız ölçüm/inceleme): `npx vite-node scripts/dragonborn-renk-sayfa.ts karsilastir <çıktı.png> <jeton-kodu>...`
//   karsilastir: her jeton kodu (ör. paladin-ID10) için 4 satır: erkek çarpma, erkek maske, kadın çarpma, kadın maske × 10 renk.
//   sinif <sinif> <çıktıKlasörü>: sınıfın bütün jetonları (Gariban + alt sınıf hücreleri) × 10 renk × cinsiyet, çarpma yöntemi, 20 hücre/sayfa, etiketli.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { tintPixels } from '../src/ui/tint';
import { lineageTint } from '../src/battle/avatar';
const C = 'public/characters', S = 96;
const COLORS = ['black', 'blue', 'brass', 'bronze', 'copper', 'gold', 'green', 'red', 'silver', 'white'];
async function render(name: string, color: string, method: 'mult' | 'maske'): Promise<Buffer> {
  const { data, info } = await sharp(path.join(C, `${name}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = new Uint8ClampedArray(data);
  const g = name.includes('-erkek-') ? 'male' : 'female';
  const t = lineageTint('dragonborn', color, g, method === 'maske' ? 'maske' : true);
  const m = method === 'maske' ? await sharp(path.join(C, 'maske', `${name}.png`)).greyscale().raw().toBuffer().catch(() => null) : null;
  if (t && (method === 'mult' || m)) tintPixels(px, t, m ? Uint8Array.from(m, (v) => (v > 127 ? 1 : 0)) : undefined);
  return sharp(Buffer.from(px.buffer), { raw: { width: info.width, height: info.height, channels: 4 } }).resize(S, S, { kernel: 'nearest' }).png().toBuffer();
}
const lab = (t: string) => Buffer.from(`<svg width="${S}" height="12"><text x="2" y="10" font-size="9" fill="#cfd3dc" font-family="sans-serif">${t}</text></svg>`);
const [mode, a, ...rest] = process.argv.slice(2);
if (mode === 'karsilastir') {
  for (const code of rest) {
    const [cls, cell] = code.split(/-(.+)/) as [string, string];
    const tiles: Array<{ input: Buffer; left: number; top: number }> = [];
    let r = 0;
    for (const g of ['erkek', 'kadin']) for (const method of ['mult', 'maske'] as const) {
      COLORS.forEach(async () => {});
      for (let c = 0; c < COLORS.length; c++) {
        tiles.push({ input: await render(`dragonborn-${g}-${cls}-${cell}`, COLORS[c]!, method), left: c * S, top: r * (S + 12) }, { input: lab(`${g[0]}·${method}·${COLORS[c]}`), left: c * S, top: r * (S + 12) + S });
      }
      r++;
    }
    const out = a!.replace('.png', `-${code}.png`);
    await sharp({ create: { width: COLORS.length * S, height: 4 * (S + 12), channels: 4, background: { r: 45, g: 50, b: 60, alpha: 1 } } }).composite(tiles).png().toFile(out);
  }
} else if (mode === 'sinif') {
  const cls = a!, outDir = rest[0]!;
  fs.mkdirSync(outDir, { recursive: true });
  const T = JSON.parse(fs.readFileSync(`data/${cls}-jeton.json`, 'utf8')) as { altSiniflar: Record<string, string>; cinsiyet?: Record<string, string>; formlar?: Record<string, { ikinci: string }> };
  const cells = ['GR', ...new Set(Object.values(T.altSiniflar)), ...Object.values(T.formlar ?? {}).map((f) => f.ikinci)];
  const items: Array<{ name: string; color: string; label: string }> = [];
  for (const g of ['erkek', 'kadin']) for (const cell of cells) {
    const name = `dragonborn-${g}-${cls}-${cell}`;
    if (!fs.existsSync(path.join(C, `${name}.webp`))) continue;
    // cinsiyet kısıtlı hücre (Karadul kadın, İmparator erkek) diğer cinsiyette zaten dosya yok ya da atlanır
    const restricted = Object.entries(T.cinsiyet ?? {}).some(([id, only]) => T.altSiniflar[id] === cell && only !== g);
    if (restricted) continue;
    for (const color of COLORS) items.push({ name, color, label: `${g === 'erkek' ? 'E' : 'K'} ${cell} ${color}` });
  }
  for (let p = 0; p * 20 < items.length; p++) {
    const sl = items.slice(p * 20, p * 20 + 20), tiles: Array<{ input: Buffer; left: number; top: number }> = [];
    for (let i = 0; i < sl.length; i++) { const x = (i % 5) * S, y = Math.floor(i / 5) * (S + 12); tiles.push({ input: await render(sl[i]!.name, sl[i]!.color, 'mult'), left: x, top: y }, { input: lab(`${cls} ${sl[i]!.label}`), left: x, top: y + S }); }
    await sharp({ create: { width: 5 * S, height: 4 * (S + 12), channels: 4, background: { r: 45, g: 50, b: 60, alpha: 1 } } }).composite(tiles).png().toFile(path.join(outDir, `${cls}-${String(p + 1).padStart(2, '0')}.png`));
  }
  console.log(cls, items.length, Math.ceil(items.length / 20));
}
