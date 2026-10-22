// Menü arka planı: assets-ham/acilis/*.mp4 → public/acilis/*.mp4 (H.264) + *.webm (VP9, yedek) + poster *.webp.
// Çalıştırma: npm run acilis (ffmpeg gerekir).
//
// Özgün videoların ilk ve son karesi birbirini tutmuyor (SSIM 0,90–0,97; komşu kareler 0,93–0,999); <video loop>
// her turda sıçrar. Çözüm çapraz geçişli döngü: video X. saniyeden başlar, son X saniyesi baştaki ilk X saniyenin
// üstüne yavaşça karışır. Çıktının son karesi özgün X. saniyeye, yani çıktının ilk karesine bağlanır; dikiş yok.
// Süre D − X olur (10 sn → 9 sn). Poster çıktının ilk karesidir; poster → video geçişinde de sıçrama olmaz.
// Ses izi yok (-an); moov başta (+faststart), video indirilirken oynar.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(root, 'assets-ham/acilis');
const OUT = path.join(root, 'public/acilis');
/** Çapraz geçiş süresi (sn). */
const FADE = 1;

const run = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
const bitrate = (file) => Number(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=bit_rate', '-of', 'csv=p=0', file]).toString().trim());
const duration = (file) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

/** İki karenin benzerliği (SSIM, 1 = aynı). */
function ssim(a, b) {
  const r = spawnSync('ffmpeg', ['-i', a, '-i', b, '-lavfi', 'ssim', '-f', 'null', '-'], { encoding: 'utf8' });
  return Number(/All:([0-9.]+)/.exec(r.stderr)?.[1] ?? 0);
}
/**
 * Döngü dikişi: [son→ilk, ilk→ikinci] karelerin SSIM'i. Kodlama kaybı karışmasın diye kareler kayıpsız (PNG) çıkarılır;
 * `filter` verilirse çapraz geçişli çıktının kareleri, verilmezse özgün videonunkiler. İkinci değer komşu kare ölçütüdür.
 */
function seam(src, frames, tmp, filter) {
  const pick = `select='eq(n\\,0)+eq(n\\,1)+eq(n\\,${frames - 1})'`;
  const args = filter ? ['-i', src, '-filter_complex', `${filter.replace('[v]', '')},${pick}`] : ['-i', src, '-vf', pick];
  run([...args, '-vsync', '0', path.join(tmp, 'k%d.png')]);
  const [a, b, z] = [1, 2, 3].map((i) => path.join(tmp, `k${i}.png`));
  return [ssim(z, a), ssim(a, b)];
}

fs.mkdirSync(OUT, { recursive: true });
const tmp = fs.mkdtempSync(path.join(root, 'node_modules/.acilis-'));
for (const file of fs.readdirSync(RAW).filter((f) => f.endsWith('.mp4')).sort()) {
  const name = file.replace(/\.mp4$/, '');
  const src = path.join(RAW, file);
  const d = duration(src);
  // Bit hızı özgün videoyla sınırlı: dosya büyümez (yeniden kodlama kaybı CRF ile, tavan özgün bit hızı).
  const kbit = `${Math.round(bitrate(src) / 1000)}k`;
  const buf = `${Math.round(2 * bitrate(src) / 1000)}k`;
  const filter = `[0:v]split[a][b];[a]trim=start=${FADE},setpts=PTS-STARTPTS[govde];[b]trim=0:${FADE},setpts=PTS-STARTPTS[bas];`
    + `[govde][bas]xfade=transition=fade:duration=${FADE}:offset=${d - 2 * FADE},format=yuv420p[v]`;
  const mp4 = path.join(OUT, `${name}.mp4`);
  const webm = path.join(OUT, `${name}.webm`);
  run(['-i', src, '-filter_complex', filter, '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-maxrate', kbit, '-bufsize', buf,
    '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
  run(['-i', src, '-filter_complex', filter, '-map', '[v]', '-an', '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', kbit,
    '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', webm]);
  const fps = 24;
  const [beforeSeam, beforeNext] = seam(src, Math.round(d * fps), tmp, null);
  const [afterSeam, afterNext] = seam(src, Math.round((d - FADE) * fps), tmp, filter);
  // Poster: çıktının ilk karesi (kodlanmış videodan; videonun ilk görüntüsüyle aynı).
  const first = path.join(tmp, 'poster.png');
  run(['-i', mp4, '-vf', 'select=eq(n\\,0)', '-frames:v', '1', first]);
  await sharp(first).webp({ quality: 80 }).toFile(path.join(OUT, `${name}.webp`));
  const kb = (f) => Math.round(fs.statSync(f).size / 1024);
  console.log(`${name}: dikiş SSIM ${beforeSeam.toFixed(3)} (komşu kare ${beforeNext.toFixed(3)}) → ${afterSeam.toFixed(3)} (komşu ${afterNext.toFixed(3)}); `
    + `${d}s → ${duration(mp4).toFixed(2)}s; mp4 ${kb(src)} → ${kb(mp4)} kB, webm ${kb(webm)} kB, poster ${kb(path.join(OUT, `${name}.webp`))} kB`);
}
fs.rmSync(tmp, { recursive: true, force: true });
