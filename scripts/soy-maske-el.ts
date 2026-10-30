// Görev K21: elle maskeler. assets/soy-maske-el/*.png doğrulanır (ad, boyut, gri ton); geçerliler gri ağırlık olarak
// public/characters/maske-el/'e kopyalanır, kaynak listesi ve uyarılar data/soy-maske-rapor.json'a yazılır.
// ELLE klasörüne hiçbir şey yazılmaz ve oradan hiçbir şey silinmez.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { checkHandMask, GRAY_TOLERANCE, maskSources } from '../src/ui/handMask';
import { CHAR, EL_KOPYA, ELLE, RAPOR } from './soy-maske-yollar';

export interface HandMasks { weights: Map<string, Uint8Array>; sources: Record<string, 'el' | 'oto'>; warnings: string[] }

export async function applyHandMasks(sprites: string[]): Promise<HandMasks> {
  const weights = new Map<string, Uint8Array>();
  const warnings: string[] = [];
  const sizes = new Map<string, { w: number; h: number }>();
  for (const s of sprites) {
    const m = await sharp(path.join(CHAR, `${s}.webp`)).metadata();
    sizes.set(s, { w: m.width ?? 0, h: m.height ?? 0 });
  }
  const files = fs.existsSync(ELLE) ? fs.readdirSync(ELLE).filter((f) => !f.startsWith('.') && f.toLowerCase() !== 'readme.md') : [];
  for (const file of files) {
    try {
      const { data, info } = await sharp(path.join(ELLE, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      let colored = 0;
      const w = new Uint8Array(info.width * info.height);
      for (let p = 0; p < w.length; p++) {
        const r = data[p * 4]!, g = data[p * 4 + 1]!, b = data[p * 4 + 2]!, a = data[p * 4 + 3]!;
        if (a > 0 && Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b)) > GRAY_TOLERANCE) colored++;
        w[p] = Math.round((((r + g + b) / 3) * a) / 255);
      }
      const c = checkHandMask({ file, width: info.width, height: info.height, colored }, (n) => sizes.get(n));
      if (!c.ok) { warnings.push(`${c.file}: ${c.warning} — yok sayıldı, otomatik maske kullanılıyor.`); continue; }
      weights.set(c.name, w);
    } catch (e) {
      warnings.push(`${file}: okunamadı (${(e as Error).message}) — yok sayıldı.`);
    }
  }
  fs.mkdirSync(EL_KOPYA, { recursive: true });
  for (const f of fs.readdirSync(EL_KOPYA)) if (!weights.has(f.replace(/\.png$/, ''))) fs.unlinkSync(path.join(EL_KOPYA, f));
  for (const [name, w] of weights) {
    const { w: W, h: H } = sizes.get(name)!;
    await sharp(Buffer.from(w), { raw: { width: W, height: H, channels: 1 } }).png({ compressionLevel: 9 }).toFile(path.join(EL_KOPYA, `${name}.png`));
  }
  const sources = maskSources(sprites, [...weights.keys()]);
  const rapor = JSON.parse(fs.readFileSync(RAPOR, 'utf8')) as { note: string };
  fs.writeFileSync(RAPOR, JSON.stringify({ note: rapor.note, sprites: sources, uyarilar: warnings }, null, 1) + '\n');
  for (const w of warnings) console.warn(`UYARI elle maske: ${w}`);
  console.log(`elle maske: ${weights.size} geçerli, ${warnings.length} uyarı`);
  return { weights, sources, warnings };
}
