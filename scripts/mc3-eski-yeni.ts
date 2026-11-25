/**
 * Görev MC3: "eski = yeni" altın değerlerini yazar (`src/sim/mc3-altin.json`). MC3 öncesi commit'te (`f85717ea`, kural sürümü
 * 103, savaş kaydı 25) bir kez çalıştırıldı; yalnız bilinçli bir davranış değişikliğinde yeniden üretilir. Ortam testlerinkiyle
 * aynı (`src/test-setup.ts`).
 *   npx vite-node scripts/mc3-eski-yeni.ts [çıktı yolu] [imza tohumları, virgüllü; varsayılan 3]
 */
import { writeFileSync } from 'node:fs';
import '../src/test-setup';

const m = await import('../src/sim/mc3EskiYeni');
const out = process.argv[2] ?? 'src/sim/mc3-altin.json';
const seedsList = (process.argv[3] ?? '3').split(',').map(Number);
const rec = m.recordBattle('col', 1, 3);
const imza: Record<string, Record<string, string>> = {};
for (const n of seedsList) imza[n] = Object.fromEntries(['col', 'kale', 'magara', 'orman'].map((id) => [id, m.signature(id, n, 103)]));
const file = { surum: 103, savasKaydi: 25, savaslar: m.combatantHashes(), kayit: { version: 25, events: rec.events, son: m.stateHash(rec.state), oynatma: m.replayHash(rec.events) }, imza };
writeFileSync(out, `${JSON.stringify(file)}\n`);
console.log(`${Object.keys(file.savaslar).length} savaşçı, kayıt ${rec.events.length} olay (${file.kayit.son}/${file.kayit.oynatma}), imza ${JSON.stringify(imza)} → ${out}`);
