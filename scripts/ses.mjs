/**
 * Ses dosyalarını işler (Görev S): assets-ham/ses/*.mp3 (Suno ile üretildi) → public/ses/*.mp3 ve
 * data/ses-klipler.json (üretilen dosyalar, süre, boyut, zar klip grupları). Ham dosyalar build'e girmez.
 * Gerekli: ffmpeg ve ffprobe (PATH'te).
 *
 * Kategoriler (ada göre):
 *   ortam-*            ortam sesi: 96 kbps mono, baş/son sessizlik kırpılır, -20 LUFS
 *   menu-*, muzik-*    müzik: 128 kbps stereo, baş/son sessizlik kırpılır, -18 LUFS
 *   zar-*              efekt: 128 kbps mono; dosyadaki ayrı atışlar sessizlikle bölünür (zar-tekli-1, -2…),
 *                      her klip tepe -1 dBFS'e çekilir (kısa kliplerde LUFS ölçümü güvenilmez)
 *   son-*              savaş sonu ezgisi (zafer, yenilgi; Görev U): bölünmez, 128 kbps mono, tepe -1 dBFS
 * Ad verilirse (`npm run ses -- son-zafer son-yenilgi`) yalnızca onlar işlenir, diğer dosyalar ve kayıtları korunur.
 * Hepsi MP3 44,1 kHz (iOS dahil her tarayıcıda çalışır).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets-ham/ses');
const OUT = path.join(ROOT, 'public/ses');
const MANIFEST = path.join(ROOT, 'data/ses-klipler.json');

/** Zar dosyalarını bölme: en az bu kadar sessizlik (sn) atışları ayırır; bundan kısa klip atılır. */
const SPLIT = { noiseDb: -40, gap: 0.3, minClip: { 'zar-dur': 0.05, default: 0.25 } };
const TARGET = { ortam: -20, muzik: -18 };

/** Çıktı: yalnızca ses akışı, etiket ve gömülü kapak resmi yok (Suno dosyalarında kapak resmi var; boyutu şişirir). */
const CLEAN = ['-map', '0:a:0', '-map_metadata', '-1', '-vn'];
const run = (args) => {
  const out = args.pop();
  return execFileSync('ffmpeg', ['-hide_banner', '-y', ...args, ...CLEAN, out], { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
};
const stderrOf = (args) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { encoding: 'utf8' }).stderr;
const duration = (file) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

const categoryOf = (name) => (name.startsWith('ortam-') ? 'ortam' : name.startsWith('zar-') ? 'efekt' : name.startsWith('son-') ? 'son' : 'muzik');
const TRIM = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse';

/** İki geçişli EBU R128 normalizasyonu: önce ölç, sonra doğrusal kazançla uygula. */
function loudnorm(input, pre, target, outArgs, out) {
  const spec = `I=${target}:TP=-1.5:LRA=11`;
  const err = stderrOf(['-i', input, '-af', `${pre},loudnorm=${spec}:print_format=json`, '-f', 'null', '-']);
  const json = JSON.parse(err.slice(err.lastIndexOf('{'), err.lastIndexOf('}') + 1));
  const measured = `measured_I=${json.input_i}:measured_TP=${json.input_tp}:measured_LRA=${json.input_lra}:measured_thresh=${json.input_thresh}:offset=${json.target_offset}`;
  run(['-i', input, '-af', `${pre},loudnorm=${spec}:${measured}:linear=true`, ...outArgs, out]);
  return Number(json.input_i);
}

/** Sessizliklerle ayrılmış parçalar [başlangıç, bitiş] (sn). */
function segments(file, minClip) {
  const err = stderrOf(['-i', file, '-af', `silencedetect=noise=${SPLIT.noiseDb}dB:d=${SPLIT.gap}`, '-f', 'null', '-']);
  const starts = [...err.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...err.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  const total = duration(file);
  const out = [];
  let cur = 0;
  for (let i = 0; i < starts.length; i++) {
    out.push([cur, starts[i]]);
    cur = ends[i] ?? total;
  }
  out.push([cur, total]);
  return out.filter(([a, b]) => b - a >= minClip).map(([a, b]) => [Math.max(0, a - 0.02), Math.min(total, b + 0.05)]);
}

/** Tepe seviyesi (dBFS). */
function peakDb(file, af = 'anull') {
  const err = stderrOf(['-i', file, '-af', `${af},volumedetect`, '-f', 'null', '-']);
  return Number(/max_volume: (-?[\d.]+) dB/.exec(err)?.[1] ?? 0);
}

fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const old = only.length && fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : null;
if (!only.length) for (const f of fs.readdirSync(OUT)) if (f.endsWith('.mp3')) fs.unlinkSync(path.join(OUT, f));

const files = { ...(old?.files ?? {}) };
const zar = { ...(old?.zar ?? {}) };
const sources = fs.readdirSync(SRC).filter((f) => f.endsWith('.mp3') && (!only.length || only.includes(f.replace(/\.mp3$/, '')))).sort();
for (const f of sources) {
  const name = f.replace(/\.mp3$/, '');
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Ham dosya adı ASCII değil: ${f} (önce git mv ile yeniden adlandırın)`);
  const input = path.join(SRC, f);
  const cat = categoryOf(name);
  if (cat === 'efekt') {
    const min = SPLIT.minClip[name] ?? SPLIT.minClip.default;
    const segs = segments(input, min);
    zar[name] = [];
    segs.forEach(([a, b], i) => {
      const clip = `${name}-${i + 1}`;
      const len = b - a;
      const fade = `afade=t=in:d=0.005,afade=t=out:st=${Math.max(0, len - 0.03).toFixed(3)}:d=0.03`;
      const pre = `atrim=start=${a.toFixed(3)}:end=${b.toFixed(3)},asetpts=PTS-STARTPTS,${fade}`;
      const gain = -1 - peakDb(input, pre);
      const out = path.join(OUT, `${clip}.mp3`);
      run(['-i', input, '-af', `${pre},volume=${gain.toFixed(2)}dB`, '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k', out]);
      files[clip] = { category: cat, from: f, seconds: Number(duration(out).toFixed(3)), bytes: fs.statSync(out).size, segment: [Number(a.toFixed(3)), Number(b.toFixed(3))] };
      zar[name].push(clip);
    });
    continue;
  }
  if (cat === 'son') {
    const out = path.join(OUT, `${name}.mp3`);
    const gain = -1 - peakDb(input, TRIM);
    run(['-i', input, '-af', `${TRIM},volume=${gain.toFixed(2)}dB`, '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k', out]);
    files[name] = { category: cat, from: f, seconds: Number(duration(out).toFixed(3)), bytes: fs.statSync(out).size };
    continue;
  }
  const out = path.join(OUT, `${name}.mp3`);
  const outArgs = cat === 'ortam'
    ? ['-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '96k']
    : ['-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k'];
  const before = loudnorm(input, TRIM, TARGET[cat], outArgs, out);
  files[name] = { category: cat, from: f, seconds: Number(duration(out).toFixed(3)), bytes: fs.statSync(out).size, sourceLufs: before };
}

const total = Object.values(files).reduce((n, x) => n + x.bytes, 0);
const manifest = {
  note: 'npm run ses (scripts/ses.mjs) üretir; elle düzenlenmez. Kaynak: assets-ham/ses/ (Suno). files: public/ses/<ad>.mp3; zar: ham zar dosyasından bölünen klipler.',
  targets: { ortamLufs: TARGET.ortam, muzikLufs: TARGET.muzik, efektPeakDb: -1 },
  totalBytes: total,
  files,
  zar,
};
fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
for (const [k, v] of Object.entries(files)) console.log(`${k.padEnd(34)} ${v.category.padEnd(6)} ${v.seconds.toFixed(2).padStart(7)} sn ${(v.bytes / 1024).toFixed(0).padStart(5)} kB`);
for (const [k, v] of Object.entries(zar)) console.log(`${k}: ${v.length} klip`);
console.log(`Toplam public/ses: ${(total / 1024 / 1024).toFixed(2)} MB (${Object.keys(files).length} dosya)`);
