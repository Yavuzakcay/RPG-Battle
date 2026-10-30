// Görev U3: savaş sonu başlık videoları. assets-ham/son-videolar/*.mp4 ve *-poster.jpg → public/son/ (ham dosyalar
// değişmez). mp4 (H.264) zaten 1280×720, sessiz ve web için sıkıştırılmış: olduğu gibi kopyalanır; H.264 çözmeyen
// tarayıcılar için VP9 .webm yedeği üretilir (ffmpeg, açılış videolarıyla aynı ayar). Adlar data/son-video.json'dan.
// Çalıştırma: npm run son-video
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'assets-ham/son-videolar');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'data/son-video.json'), 'utf8'));
const out = path.join(root, 'public', cfg.dir);
if (!fs.existsSync(src)) { console.log('assets-ham/son-videolar/ yok; atlandı.'); process.exit(0); }
fs.mkdirSync(out, { recursive: true });
const names = Object.values(cfg.files).flatMap((x) => Object.values(x));
for (const n of names) {
  for (const f of [`${n}.mp4`, `${n}-poster.jpg`]) {
    const from = path.join(src, f);
    if (!fs.existsSync(from)) throw new Error(`Eksik: assets-ham/son-videolar/${f}`);
    fs.copyFileSync(from, path.join(out, f));
    console.log(`${f}  ${(fs.statSync(from).size / 1024).toFixed(0)} kB`);
  }
  const webm = path.join(out, `${n}.webm`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(src, `${n}.mp4`), '-an', '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '1200k',
    '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', webm]);
  console.log(`${n}.webm  ${(fs.statSync(webm).size / 1024).toFixed(0)} kB`);
}
