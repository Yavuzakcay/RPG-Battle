/**
 * Görev P0: `harita/belgeler/PAKET-ILKELLER.md` belgesini şema tablosundan üretir (`src/content/ilkelBelge.ts`).
 * `npx vite-node scripts/paket-ilkeller-belge.ts`
 */
import fs from 'node:fs';
import { loadClassData } from '../src/data';
import { belgeMetni } from '../src/content/ilkelBelge';

await loadClassData();
fs.writeFileSync('harita/belgeler/PAKET-ILKELLER.md', belgeMetni());
console.log('harita/belgeler/PAKET-ILKELLER.md yazıldı.');
