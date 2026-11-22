/**
 * ROZET-CERCEVE-KIRPMA: jeton alfa zarfları ve rozet sığdırma ölçeği (yalnız okur; jeton/maske değişmez).
 *   - `public/characters/*.webp` (oyunda kullanılan 256 px jetonlar) için `alphaHull` + `badgeFit` (rozet 44 ve 84 px; alt soy oranları
 *     `data/alt-soy-gorunum.json` `altSoylar[].oran` + 1×1): ölçek dağılımı ve kaydırılan/küçültülen jeton sayısı konsola.
 *   - Test fikstürü `src/ui/fixtures/rozet-kirpma.json`: JETON-DENETIM bölüm 2b'nin 69 jetonunun zarfı (yalnız sayılar; görsel teste girmez).
 * Çalıştırma: `npx vite-node scripts/rozet-sigdirma.ts`.
 */
import sharp from 'sharp';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { alphaHull, badgeFit, type Pt } from '../src/ui/badgeFit';
import gorunum from '../data/alt-soy-gorunum.json';

const DIR = 'public/characters';
const FOOT = (gorunum as unknown as { ayak: { yuzde: number } }).ayak.yuzde;
const ORAN = [{ en: 1, boy: 1 }, ...Object.values((gorunum as unknown as { altSoylar: Record<string, { oran?: { en: number; boy: number } }> }).altSoylar).flatMap((a) => (a.oran ? [a.oran] : []))]
  .filter((o, i, a) => a.findIndex((q) => q.en === o.en && q.boy === o.boy) === i);

function auditNames(): string[] {
  const md = readFileSync('harita/belgeler/JETON-DENETIM.md', 'utf8');
  const line = md.split('\n').find((l) => l.startsWith('Rozet kırpması ≥ 10 px'))!;
  return [...line.matchAll(/`([^`]+)` \d+/g)].map((m) => m[1]!);
}

async function hullOf(file: string): Promise<Pt[]> {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return alphaHull(data, info.width, info.height);
}

const names = readdirSync(DIR).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)).sort();
const listed = auditNames();
const fixture: Record<string, Pt[]> = {};
const ks: Record<string, number[]> = {};
let moved = 0, shrunk = 0;
for (const n of names) {
  const hull = await hullOf(`${DIR}/${n}.webp`);
  if (listed.includes(n)) fixture[n] = hull;
  for (const size of [44, 84]) for (const o of ORAN) {
    const f = badgeFit({ hull, size, sx: o.en, sy: o.boy, foot: FOOT });
    (ks[`${size} ${o.en}×${o.boy}`] ??= []).push(f.k);
    if (size === 84 && o.en === 1 && o.boy === 1) { if (f.k < 1) shrunk++; else if (f.tx || f.ty) moved++; }
  }
}
const q = (a: number[], p: number) => [...a].sort((x, y) => x - y)[Math.floor(p * (a.length - 1))]!.toFixed(3);
console.log(`jeton ${names.length}; rozet 84 (1×1): dokunulmayan ${names.length - moved - shrunk}, yalnız kaydırılan ${moved}, küçültülen ${shrunk}`);
for (const [k, a] of Object.entries(ks)) console.log(`${k}: ölçek en az ${q(a, 0)}, %5 ${q(a, 0.05)}, %25 ${q(a, 0.25)}, medyan ${q(a, 0.5)}; < 0,95: ${a.filter((x) => x < 0.95).length}, < 0,90: ${a.filter((x) => x < 0.9).length}`);
mkdirSync('src/ui/fixtures', { recursive: true });
writeFileSync('src/ui/fixtures/rozet-kirpma.json', JSON.stringify({
  not: 'ROZET-CERCEVE-KIRPMA: JETON-DENETIM 2b listesindeki jetonların alfa zarfı (alphaHull, birim kare). Üretici: npx vite-node scripts/rozet-sigdirma.ts',
  ayak: FOOT, oranlar: ORAN, jetonlar: listed, zarf: fixture }) + '\n');
console.log(`fikstür: ${Object.keys(fixture).length}/${listed.length} jeton`);
