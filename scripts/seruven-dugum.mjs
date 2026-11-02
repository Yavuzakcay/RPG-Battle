// Kuyruk 31: Serüven düğüm koordinatı ince ayarı: npm run seruven-dugum -- <sayfa> <düğüm|giris|cikis|portal> <x> <y>
// data/seruven.json'daki koordinatı yazar (0–1, üç basamak). Ekrandaki düğüm aracı (#dugum) koordinatları gösterir.
import { readFileSync, writeFileSync } from 'node:fs';

// Kuyruk 44: şehir görünümü düğümü: npm run seruven-dugum -- sehir <yerlesim> <bina|tam kimlik> <x> <y> (data/sehir-gorunum.json).
if (process.argv[2] === 'sehir') {
  const [, yer, bina, sx, sy] = process.argv.slice(2);
  const fx = Number(sx); const fy = Number(sy);
  if (!yer || !bina || !(fx >= 0 && fx <= 1) || !(fy >= 0 && fy <= 1)) { console.error('kullanım: npm run seruven-dugum -- sehir <yerlesim> <bina> <x 0–1> <y 0–1>'); process.exit(1); }
  const sp = 'data/sehir-gorunum.json';
  const sd = JSON.parse(readFileSync(sp, 'utf8'));
  const id = bina.includes('/') ? bina : `${yer}/${bina}`;
  const n = sd.yerlesimler[yer]?.dugumler.find((q) => q.id === id);
  if (!n) { console.error(`düğüm yok: ${id}`); process.exit(1); }
  n.x = Math.round(fx * 1000) / 1000; n.y = Math.round(fy * 1000) / 1000;
  writeFileSync(sp, `${JSON.stringify(sd, null, 1)}\n`);
  console.log(`${id} → (${n.x}; ${n.y})`);
  process.exit(0);
}
const [page, node, xs, ys] = process.argv.slice(2);
const x = Number(xs); const y = Number(ys);
if (!page || !node || !(x >= 0 && x <= 1) || !(y >= 0 && y <= 1)) { console.error('kullanım: npm run seruven-dugum -- <sayfa> <düğüm> <x 0–1> <y 0–1>'); process.exit(1); }
const p = 'data/seruven.json';
const d = JSON.parse(readFileSync(p, 'utf8'));
const pg = d.pages.find((q) => q.id === page);
if (!pg) { console.error(`sayfa yok: ${page}`); process.exit(1); }
const key = { giris: 'entry', cikis: 'exit', portal: 'portal' }[node];
const target = key ? pg[key] : pg.nodes.find((n) => n.id === node);
if (!target) { console.error(`düğüm yok: ${page}/${node}`); process.exit(1); }
target.x = Math.round(x * 1000) / 1000; target.y = Math.round(y * 1000) / 1000;
writeFileSync(p, `${JSON.stringify(d, null, 1)}\n`);
console.log(`${page}/${node} → (${target.x}; ${target.y})`);
