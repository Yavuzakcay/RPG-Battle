// Kuyruk 31: Serüven düğüm koordinatı ince ayarı: npm run seruven-dugum -- <sayfa> <düğüm|giris|cikis|portal> <x> <y>
// data/seruven.json'daki koordinatı yazar (0–1, üç basamak). Ekrandaki düğüm aracı (#dugum) koordinatları gösterir.
import { readFileSync, writeFileSync } from 'node:fs';

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
