// @ts-nocheck — node modülleri (fs, child_process) kullanan betik testi; uygulama tsconfig'inde node tipleri yok
/**
 * Wizard 4x2 sayfa kesimi (`scripts/lib/karakter-kesim.mjs`, `scripts/karakter-kes.mjs`). Görsel dosya yok: yapay RGB sayfalar
 * (koyu ızgara, yeşil/macenta zemin, "karakter" = içinde yeşil ayrıntılı dikdörtgen). A: 8 çıktı; B: 7 çıktı (8. hücre boş).
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
// @ts-ignore: saf JS betik kütüphanesi (tür bildirimi yok)
import * as lib from '../../scripts/lib/karakter-kesim.mjs';

const W = 2680, H = 1352, LINE = 24;
const GREEN: [number, number, number] = [0, 255, 0], MAG: [number, number, number] = [255, 0, 255];
function sheet(opts: { magenta?: number[]; empty?: number[]; noGrid?: boolean; hole?: boolean; speck?: boolean }): Uint8Array {
  const d = new Uint8Array(W * H * 3);
  const cw = (W - 5 * LINE) / 4, ch = (H - 3 * LINE) / 2;
  const cellAt = (x: number, y: number) => {
    const fx = x - LINE, fy = y - LINE;
    const cx = Math.floor(fx / (cw + LINE)), cy = Math.floor(fy / (ch + LINE));
    const ix = fx - cx * (cw + LINE), iy = fy - cy * (ch + LINE);
    if (fx < 0 || fy < 0 || cx > 3 || cy > 1 || ix >= cw || iy >= ch) return null;
    return { i: cy * 4 + cx, ix, iy };
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = opts.noGrid ? { i: Math.floor(y / (H / 2)) * 4 + Math.floor(x / (W / 4)), ix: x % (W / 4), iy: y % (H / 2) } : cellAt(x, y);
    let px: number[] = [20, 20, 20];
    if (c) {
      px = opts.magenta?.includes(c.i) ? MAG : GREEN;
      const inChar = !opts.empty?.includes(c.i) && c.ix > 200 && c.ix < 440 && c.iy > 120 && c.iy < 540;
      if (inChar) px = (c.ix > 280 && c.ix < 340 && c.iy > 200 && c.iy < 260) ? [60, 200, 90] : [120, 60, 200]; // içeride yeşil ayrıntı (anahtar renginden farklı ton)
      if (opts.hole && !opts.empty?.includes(c.i) && c.ix > 360 && c.ix < 400 && c.iy > 300 && c.iy < 340) px = c.i === 0 || !opts.magenta?.includes(c.i) ? GREEN : MAG; // kapalı zemin deliği
      if (opts.speck && c.ix >= 100 && c.ix < 102 && c.iy >= 100 && c.iy < 102) px = [80, 200, 80]; // izole nokta
    }
    d.set(px, (y * W + x) * 3);
  }
  return d;
}

describe('karakter sayfası kesimi', () => {
  it('JPEG: bulanık ızgara kalıntısı olan hücrede zemin yine silinir', async () => {
    const jpg = await sharp(Buffer.from(sheet({})), { raw: { width: W, height: H, channels: 3 } }).blur(2.5).jpeg({ quality: 70 }).toBuffer();
    const { data, info } = await sharp(jpg).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const r = lib.processSheet(new Uint8Array(data), info.width, info.height, lib.SLUGS.a);
    for (const c of r.cells) {
      expect(c.box.w).toBeLessThan(400);
      expect(c.box.h).toBeLessThan(500);
    }
  });
  it('ızgara: 4x2 hücre, çizgiler atlanır', () => {
    const g = lib.detectGrid(sheet({}), W, H);
    expect(g.ok).toBe(true);
    expect(g.cells).toHaveLength(8);
    expect(g.cells[0].w).toBeGreaterThan(600);
    expect(g.cells[0].w).toBeLessThan(660);
  });
  it('ızgara bulunamazsa eşit bölme + uyarı', () => {
    const g = lib.detectGrid(sheet({ noGrid: true }), W, H);
    expect(g.ok).toBe(false);
    expect(g.warn).toBeTruthy();
    expect(g.cells).toHaveLength(8);
  });
  it('A sayfası: 8 hücre, bir macenta; içteki yeşil ayrıntı korunur', () => {
    const r = lib.processSheet(sheet({ magenta: [2] }), W, H, lib.SLUGS.a);
    expect(r.cells.filter((c: any) => !c.empty)).toHaveLength(8);
    expect(r.cells[2].bg.name).toBe('macenta');
    expect(r.cells[0].bg.name).toBe('yesil');
    const c = r.cells[0];
    expect(c.leftover).toBeLessThanOrEqual(60 * 60); // yalnız içteki 60x60 ayrıntı kalır, kenar halesi yok
    // ayrıntı (yeşil) kutu içinde hâlâ opak
    const bx = c.box, px = (280 + 20) - bx.x, py = (200 + 20) - bx.y;
    expect(bx.w).toBeGreaterThan(200);
    expect(c.rgba[((c.box.y + py) * c.rect.w + (c.box.x + px)) * 4 + 3]).toBe(255);
  });
  it('kapalı zemin deliği silinir, farklı tondaki yeşil ayrıntı ve izole nokta kuralı', () => {
    const r = lib.processSheet(sheet({ hole: true, speck: true, magenta: [2] }), W, H, lib.SLUGS.a);
    for (const c of r.cells) {
      const w = c.rect.w, at = (x: number, y: number) => c.rgba[(y * w + x) * 4 + 3];
      expect(at(380, 320)).toBe(0); // delik şeffaf
      expect(at(300, 230)).toBe(255); // ayrıntı korunur
      expect(c.stats.interiorBefore).toBeGreaterThanOrEqual(39 * 39);
      expect(c.stats.interiorAfter).toBe(0);
      if (c.bg.name === 'yesil') expect(at(100, 100)).toBe(0); // izole nokta silindi (yeşil zeminli hücrelerde)
    }
    expect(r.cells[2].bg.name).toBe('macenta');
  });
  it('B sayfası: 8. hücre boş, 7 çıktı', () => {
    const r = lib.processSheet(sheet({ empty: [7] }), W, H, lib.SLUGS.b);
    expect(r.cells.filter((c: any) => !c.empty)).toHaveLength(7);
    expect(r.cells[7].empty).toBe(true);
  });
  it('betik: A 8 + B 7 dosya yazar, --kuru yazmaz, ikinci koşu ezmez', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'karakter-kes-'));
    const inDir = path.join(tmp, 'girdi'), outDir = path.join(tmp, 'cikti');
    fs.mkdirSync(inDir);
    const png = async (d: Uint8Array, f: string) => sharp(Buffer.from(d), { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(inDir, f));
    await png(sheet({ magenta: [2] }), 'wizard-male-human-a.png');
    await png(sheet({ empty: [7] }), 'wizard-male-human-b.png');
    await sharp(Buffer.from(sheet({})), { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 92 }).toFile(path.join(inDir, 'wizard-female-human-a.jpg'));
    await sharp(Buffer.from(sheet({ empty: [7] })), { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 92 }).toFile(path.join(inDir, 'wizard-female-human-b.jpg'));
    const run = (...a: string[]) => execFileSync('node', ['scripts/karakter-kes.mjs', '--girdi', inDir, '--cikti', outDir, ...a], { encoding: 'utf8' });
    run('--kuru');
    expect(fs.existsSync(outDir)).toBe(false);
    run();
    const out = fs.readdirSync(outDir).sort();
    expect(out).toHaveLength(30);
    expect(out).toContain('wizard-erkek-human-phoenix.png');
    expect(out).toContain('wizard-kadin-human-phoenix.png');
    expect(out).toContain('wizard-kadin-human-map.png');
    expect(out).toContain('wizard-erkek-human-map.png');
    const meta = await sharp(path.join(outDir, out[0])).metadata();
    expect([meta.width, meta.height]).toEqual([512, 512]);
    expect(run()).toContain('0 yazıldı, 30 atlandı');
    fs.rmSync(tmp, { recursive: true, force: true });
  }, 60000);
  it('barbarian 3x3: veriden 9 slug, çıktı sınıf klasörüne, --kuru yazmaz, ezmez', async () => {
    const cw = 640, ch = 640, L = 24, BW = L + 3 * (cw + L), BH = L + 3 * (ch + L);
    const d = new Uint8Array(BW * BH * 3);
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const fx = x - L, fy = y - L, cx = Math.floor(fx / (cw + L)), cy = Math.floor(fy / (ch + L));
      let px = [20, 20, 20];
      if (fx >= 0 && fy >= 0 && cx < 3 && cy < 3 && fx - cx * (cw + L) < cw && fy - cy * (ch + L) < ch) {
        const ix = fx - cx * (cw + L), iy = fy - cy * (ch + L), mag = cy * 3 + cx === 4;
        px = mag ? MAG : GREEN;
        if (ix > 200 && ix < 440 && iy > 120 && iy < 540) px = [120, 60, 200];
      }
      d.set(px, (y * BW + x) * 3);
    }
    const cfg = lib.CONFIG.siniflar.barbarian;
    expect(cfg.sayfalar['']).toHaveLength(9);
    expect(cfg.cikti).toBe('public/Subclass/Barbarian');
    expect(lib.CONFIG.siniflar.wizard.cikti).toBe('public/characters');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'karakter-kes-b-'));
    const inDir = path.join(tmp, 'girdi'), outDir = path.join(tmp, 'Subclass', 'Barbarian');
    fs.mkdirSync(inDir);
    await sharp(Buffer.from(d), { raw: { width: BW, height: BH, channels: 3 } }).png().toFile(path.join(inDir, 'barbarian-female-half-orc.png'));
    const run = (...a: string[]) => execFileSync('node', ['scripts/karakter-kes.mjs', '--sinif', 'barbarian', '--girdi', inDir, '--cikti', outDir, ...a], { encoding: 'utf8' });
    const rep = run('--kuru');
    expect(rep).toContain('9 hücre (beklenen 9');
    expect(fs.existsSync(outDir)).toBe(false);
    run();
    const out = fs.readdirSync(outDir).sort();
    expect(out).toHaveLength(9);
    expect(out).toContain('barbarian-kadin-half-orc-varis-yolu.png');
    expect(out).toContain('barbarian-kadin-half-orc-geride-kalan.png');
    expect(run()).toContain('0 yazıldı, 9 atlandı');
    fs.rmSync(tmp, { recursive: true, force: true });
  }, 60000);
});
