/**
 * Görev MC3: dört senaryonun (Çöl/Kale/Mağara/Orman, 5. seviye standart parti) imzası, verilen kural sürümü ve tohum sayısıyla
 * (`src/sim/mc3EskiYeni.ts` `signature`). 100 tohumluk hızlı regresyon için: sürüm başına ayrı süreç.
 *   npx vite-node scripts/mc3-imza.ts <sürüm> <tohum> [çıktı]
 */
import { writeFileSync } from 'node:fs';
import '../src/test-setup';

const m = await import('../src/sim/mc3EskiYeni');
const ver = Number(process.argv[2] ?? 105);
const seeds = Number(process.argv[3] ?? 3);
const t0 = Date.now();
const out = Object.fromEntries(['col', 'kale', 'magara', 'orman'].map((id) => [id, m.signature(id, seeds, ver)]));
const text = JSON.stringify({ surum: ver, tohum: seeds, imza: out, sn: Math.round((Date.now() - t0) / 1000) });
if (process.argv[4]) writeFileSync(process.argv[4], `${text}\n`);
console.log(text);
