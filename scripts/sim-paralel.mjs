/**
 * Denge simülasyonu, senaryolar paralel (Görev B1): `npm run sim -- [savaş sayısı] [senaryo kimliği...]
 * [--seviye N] [--parti kimlik] [--is N]`. Her senaryo ayrı süreçte `src/sim/run.ts --satir` ile koşar; tablo
 * senaryo sırasıyla basılır ve `sim-sonuc/seviye-<N>-<parti>.md` dosyasına yazılır (git'e girmez).
 * `--is N`: aynı anda en çok N süreç (varsayılan çekirdek sayısı).
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';

const argv = process.argv.slice(2);
const take = (flag, def) => {
  const i = argv.indexOf(flag);
  if (i < 0) return def;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const level = take('--seviye', '5');
const party = take('--parti', 'standart');
const jobs = Math.max(1, Number(take('--is', String(cpus().length))) || 1);
const runs = argv[0] ?? '200';
const all = JSON.parse(readFileSync('data/sim-senaryolar.json', 'utf8')).scenarios.map((s) => s.id);
const ids = argv.length > 1 ? argv.slice(1) : all;
const unknown = ids.filter((id) => !all.includes(id));
if (unknown.length) throw new Error(`Bilinmeyen senaryo: ${unknown.join(', ')}`);

const bin = process.platform === 'win32' ? 'node_modules\\.bin\\vite-node.cmd' : 'node_modules/.bin/vite-node';
const one = (id) => new Promise((resolve, reject) => {
  const p = spawn(bin, ['src/sim/run.ts', runs, id, '--seviye', level, '--parti', party, '--satir'], { shell: process.platform === 'win32' });
  let out = '';
  let err = '';
  p.stdout.on('data', (d) => { out += d; });
  p.stderr.on('data', (d) => { err += d; });
  p.on('close', (code) => {
    const row = out.split('\n').find((l) => l.startsWith('| '));
    if (code !== 0 || !row) reject(new Error(`${id}: ${err || out}`));
    else { process.stderr.write(`tamam ${id}\n`); resolve(row); }
  });
});

const t0 = Date.now();
const rows = new Array(ids.length);
let next = 0;
await Promise.all(Array.from({ length: Math.min(jobs, ids.length) }, async () => {
  while (next < ids.length) {
    const i = next++;
    rows[i] = await one(ids[i]);
  }
}));
const head = [
  `> Parti: ${party}, seviye ${level}, ${runs} savaş, ${jobs} paralel süreç, ${((Date.now() - t0) / 60000).toFixed(1)} dk`,
  '',
  '| Senaryo | XP | Savaş | Parti kazandı | Berabere (20 tur) | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC | Ort. kurtarılan masum | Ejderha uyandı | Uyanınca kazanma | Süre |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
];
const text = [...head, ...rows].join('\n') + '\n';
process.stdout.write(text);
mkdirSync('sim-sonuc', { recursive: true });
const file = `sim-sonuc/seviye-${level}-${party}${argv.length > 1 ? '-' + ids.join('-') : ''}.md`;
writeFileSync(file, text);
process.stderr.write(`yazıldı: ${file}\n`);
