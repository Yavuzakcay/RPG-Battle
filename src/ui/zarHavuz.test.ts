// @ts-nocheck — node modülleri (worker_threads, child_process) kullanan betik testi; uygulama tsconfig'inde node tipleri yok
/**
 * Zar kesicisi: dosya başına işçi + zaman aşımı (`scripts/lib/zar-havuz.mjs`), ilerleme çıktısı ve --kuru (`scripts/zarlar.mjs`).
 * Görsel dosya yok: yapay macenta sayfalar geçici klasörde.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
// @ts-ignore
import * as havuz from '../../scripts/lib/zar-havuz.mjs';
// @ts-ignore
import * as lib from '../../scripts/lib/zar-kesim.mjs';

const W = 760, H = 140;
function sheetRgb(): Buffer {
  const d = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let inside = false;
    for (let k = 0; k < 7; k++) { const dx = x - (60 + k * 105), dy = y - 70; if (dx * dx + dy * dy <= 45 * 45) inside = true; }
    d.set(inside ? [200, 170, 60] : [255, 0, 255], (y * W + x) * 3);
  }
  return d;
}

describe('zar kesici: işçi, zaman aşımı, ilerleme', () => {
  it('takılan iş zaman aşımıyla sonlanır, son adım raporlanır', async () => {
    const code = `const { parentPort } = require('node:worker_threads'); parentPort.postMessage({ step: 'zemin-temel' }); while (true) {}`;
    const r = await havuz.runJob(null, {}, { timeoutMs: 300, evalCode: code });
    expect(r.ok).toBe(false);
    expect(r.timedOut).toBe(true);
    expect(r.lastStep).toBe('zemin-temel');
    expect(r.ms).toBeLessThan(5000);
  });
  it('havuz sırayı korur ve eşzamanlılığı sınırlar', async () => {
    let live = 0, peak = 0;
    const out = await havuz.pool([1, 2, 3, 4, 5], 2, async (x) => { live++; peak = Math.max(peak, live); await new Promise((r) => setTimeout(r, 10)); live--; return x * 2; });
    expect(out).toEqual([2, 4, 6, 8, 10]);
    expect(peak).toBeLessThanOrEqual(2);
  });
  it('bölütleme eskisiyle aynı: yedi zar, soldan sağa', async () => {
    const jpg = await sharp(sheetRgb(), { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
    const { data, info } = await sharp(jpg).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const steps: string[] = [];
    const r = lib.segment(new Uint8Array(data), info.width, info.height, { onStep: (s: string) => steps.push(s) });
    expect(r.ok).toBe(true);
    expect(r.kept).toHaveLength(7);
    expect(steps).toContain('zemin-temel');
  });
  it('betik: ilerleme satırları, aşan dosya sonrakini kilitlemez, --kuru yazmaz', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zarlar-'));
    const raw = path.join(tmp, 'ham'), out = path.join(tmp, 'cikti');
    fs.mkdirSync(raw);
    const ids = JSON.parse(fs.readFileSync('data/zar-gorselleri.json', 'utf8')).themes.map((x) => x.id).slice(0, 2);
    for (const id of ids) await sharp(sheetRgb(), { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 90 }).toFile(path.join(raw, `zar-${id}.jpg`));
    const run = (...a: string[]) => execFileSync('node', ['scripts/zarlar.mjs', '--girdi', raw, '--cikti', out, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const ok = run('--kuru', '--is', '1');
    expect(ok).toContain('[1/2]');
    expect(ok).toContain('[2/2]');
    expect(ok).toMatch(/bitti \(\d+ ms\)/);
    expect(fs.existsSync(out)).toBe(false); // --kuru yazmaz
    // zaman aşımı: 1 ms; her iki dosya da aşar ama betik bitirir ve ikisini de raporlar
    let text = '';
    try { text = run('--kuru', '--is', '1', '--sure', '0.001'); } catch (e) { text = String(e.stdout ?? '') + String(e.stderr ?? ''); }
    expect((text.match(/ZAMAN AŞIMI/g) ?? []).length).toBeGreaterThanOrEqual(2);
    fs.rmSync(tmp, { recursive: true, force: true });
  }, 120000);
});
