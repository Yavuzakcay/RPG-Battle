/**
 * Zafer ve yenilgi seslerinin yer tutucuları (Görev U): ffmpeg ile sentezlenen kısa ezgiler →
 * assets-ham/ses/son-zafer.mp3 ve son-yenilgi.mp3. Gerçek ses gelince aynı adla değiştirilip `npm run ses` çalıştırılır;
 * bu betik var olan dosyanın üstüne yazmaz (`--zorla` ile yazar).
 * Zafer: majör arpej (C5 E5 G5 C6), yenilgi: inen minör (A4 F4 D4 A3); her nota sinüs + bir oktav üstü, yumuşak zarf.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'assets-ham/ses');
const force = process.argv.includes('--zorla');

/** Notalar [frekans Hz, başlangıç sn, süre sn] → aevalsrc ifadesi. */
function expr(notes) {
  const parts = notes.map(([f, t0, d]) => {
    const env = `between(t,${t0},${t0 + d})*min(1,(t-${t0})/0.02)*exp(-3*(t-${t0})/${d})`;
    return `${env}*(0.6*sin(2*PI*${f}*t)+0.25*sin(4*PI*${f}*t))`;
  });
  // Süzgeç sözdiziminde virgül ayırıcıdır: ifadenin içindekiler kaçırılır.
  return `0.5*(${parts.join('+')})`.replace(/,/g, '\\,');
}
const SONGS = {
  'son-zafer': { len: 2.2, notes: [[523.25, 0, 0.35], [659.25, 0.18, 0.35], [783.99, 0.36, 0.4], [1046.5, 0.56, 1.5], [783.99, 0.56, 1.5]] },
  'son-yenilgi': { len: 2.6, notes: [[440, 0, 0.6], [349.23, 0.45, 0.6], [293.66, 0.9, 0.7], [220, 1.35, 1.2]] },
};
fs.mkdirSync(SRC, { recursive: true });
for (const [name, s] of Object.entries(SONGS)) {
  const out = path.join(SRC, `${name}.mp3`);
  if (fs.existsSync(out) && !force) { console.log(`${name}: var, dokunulmadı`); continue; }
  execFileSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', `aevalsrc=${expr(s.notes)}:s=44100:d=${s.len}`,
    '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '128k', out], { stdio: 'ignore' });
  console.log(`${name}: üretildi (${fs.statSync(out).size} B)`);
}
