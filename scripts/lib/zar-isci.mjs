// Zar sayfası işçisi: tek dosyayı yükler, bölütler ve (istenirse) çıktıyı yazar. Adım adım `step` mesajı gönderir (takılma tespiti).
import { parentPort, workerData } from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { NAMES, segment } from './zar-kesim.mjs';

const SIZE = 128, LARGEST = 116, FOOT = 122;
const COLORS = [[255, 80, 80], [80, 200, 255], [255, 220, 60], [120, 255, 120], [255, 140, 255], [255, 160, 60], [180, 180, 255]];
const step = (s) => parentPort?.postMessage({ step: s });

/** job: { file, theme, kutu, sablon, sablonYok, erodeMax, write, outDir, inspect, inspectDir } */
export async function processFile(job) {
  step('yukle');
  const { data, info } = await sharp(job.file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const seg = segment(data, w, h, { kutu: job.kutu, sablon: job.sablon, sablonYok: job.sablonYok, erodeMax: job.erodeMax, onStep: step });
  const res = { theme: job.theme, w, h, ok: seg.ok, method: seg.method, note: seg.note, count: seg.kept.length, kept: seg.kept.map((p) => ({ id: p.id, count: p.count, minX: p.minX, minY: p.minY, maxX: p.maxX, maxY: p.maxY })), wrote: 0 };
  if (job.inspect) {
    step('inceleme-gorseli');
    const out = Buffer.alloc(w * h * 3);
    const idx = new Map(seg.kept.map((p, k) => [p.id, k]));
    for (let i = 0; i < w * h; i++) {
      const k = idx.get(seg.comp[i]); const c = k !== undefined ? COLORS[k % 7] : null;
      for (let q = 0; q < 3; q++) out[i * 3 + q] = c ? (data[i * 3 + q] * 0.45 + c[q] * 0.55) | 0 : data[i * 3 + q] * 0.35;
    }
    fs.mkdirSync(job.inspectDir, { recursive: true });
    await sharp(out, { raw: { width: w, height: h, channels: 3 } }).resize({ width: Math.min(w, 1600) }).png().toFile(path.join(job.inspectDir, `${job.theme}.png`));
  }
  if (job.write && seg.ok) {
    step('kirpma-yazma');
    const largest = Math.max(...seg.kept.map((p) => Math.max(p.maxX - p.minX + 1, p.maxY - p.minY + 1)));
    const scale = LARGEST / largest; res.scale = scale;
    const out = path.join(job.outDir, job.theme);
    fs.mkdirSync(out, { recursive: true });
    for (const [k, p] of seg.kept.entries()) {
      const bw = p.maxX - p.minX + 1, bh = p.maxY - p.minY + 1;
      const rgba = Buffer.alloc(bw * bh * 4);
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
        const i = (p.minY + y) * w + p.minX + x;
        if (seg.comp[i] !== p.id) continue;
        const o = (y * bw + x) * 4;
        rgba[o] = data[i * 3]; rgba[o + 1] = data[i * 3 + 1]; rgba[o + 2] = data[i * 3 + 2]; rgba[o + 3] = 255;
      }
      const tw = Math.max(1, Math.round(bw * scale)), th = Math.max(1, Math.round(bh * scale));
      const fig = await sharp(rgba, { raw: { width: bw, height: bh, channels: 4 } }).resize(tw, th, { kernel: 'nearest' }).raw().toBuffer();
      const left = Math.round((SIZE - tw) / 2), top = FOOT - th;
      const canvas = Buffer.alloc(SIZE * SIZE * 4);
      for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
        const X = left + x, Y = top + y;
        if (X < 0 || Y < 0 || X >= SIZE || Y >= SIZE) continue;
        fig.copy(canvas, (Y * SIZE + X) * 4, (y * tw + x) * 4, (y * tw + x) * 4 + 4);
      }
      await sharp(canvas, { raw: { width: SIZE, height: SIZE, channels: 4 } }).webp({ lossless: true }).toFile(path.join(out, `${NAMES[k]}.webp`));
      res.wrote++;
    }
  }
  return res;
}

if (workerData && parentPort) {
  processFile(workerData).then((r) => parentPort.postMessage({ done: true, result: r }), (e) => { throw e; });
}
