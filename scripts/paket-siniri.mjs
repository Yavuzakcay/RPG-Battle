// Kuyruk A2: ana parça (index-*.js) boyut denetimi; sınır data/paket-siniri.json `anaParcaKb`. Aşarsa build başarısız.
// Çalıştırma: npm run build (son adım) ya da node scripts/paket-siniri.mjs (önce vite build).
import fs from 'node:fs';
import path from 'node:path';

const { anaParcaKb } = JSON.parse(fs.readFileSync('data/paket-siniri.json', 'utf8'));
const dir = 'dist/assets';
const main = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^index-.*\.js$/.test(f)) : [];
if (main.length === 0) { console.error('paket-siniri: dist/assets/index-*.js yok (önce vite build).'); process.exit(1); }
let bad = false;
for (const f of main) {
  const kb = fs.statSync(path.join(dir, f)).size / 1000;
  const ok = kb <= anaParcaKb;
  if (!ok) bad = true;
  console.log(`ana parça ${f}: ${kb.toFixed(2)} kB / sınır ${anaParcaKb} kB ${ok ? 'tamam' : 'AŞILDI'}`);
}
process.exit(bad ? 1 : 0);
