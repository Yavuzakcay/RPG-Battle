/**
 * Görev MC2: "eski = yeni" altın özetlerini yazar (`src/rules/fixtures/mc2-eski-yeni.json`). MC2 öncesi commit'te
 * (`cdc8c2a0`) bir kez çalıştırıldı; yalnız bilinçli bir davranış değişikliğinde yeniden üretilir. Ortam testlerinkiyle
 * aynı olsun diye `src/test-setup.ts` yüklenir (veri, EN metinleri, SRD alt sınıf fikstürü).
 *   npx vite-node scripts/mc2-eski-yeni.ts [çıktı yolu]
 */
import { writeFileSync } from 'node:fs';
import '../src/test-setup';

const { mc2Hashes } = await import('../src/rules/fixtures/mc2EskiYeni');
const out = process.argv[2] ?? 'src/rules/fixtures/mc2-eski-yeni.json';
const hashes = mc2Hashes();
writeFileSync(out, `${JSON.stringify(hashes, null, 1)}\n`);
console.log(`${Object.keys(hashes).length} durum → ${out}`);
