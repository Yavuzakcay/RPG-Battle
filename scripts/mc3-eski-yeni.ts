/**
 * Görev MC3: "eski = yeni" altın değerlerini yazar (`src/sim/mc3-altin.json`). MC5'ten beri MC3 öncesi taban
 * `origin/birlesik` `304bcb60` (KARAR104 ve KARAR104-KALAN dahil: kural sürümü 104, savaş kaydı 26; MC3-BIRLESTIR'de `a50fd8ed`); ilk sürüm `f85717ea`'da (kural 103, kayıt 25)
 * üretilmişti. O ağaçta bir kez çalıştırılır; yalnız bilinçli bir davranış değişikliğinde yeniden üretilir. Ortam testlerinkiyle
 * aynı (`src/test-setup.ts`).
 *   npx vite-node scripts/mc3-eski-yeni.ts [çıktı yolu] [imza tohumları, virgüllü; varsayılan 3] [eski altın (25 sürümlü kayıt)]
 * Eski altındaki 25 sürümlü kayıt (f85717ea'da kaydedilmiş olay günlüğü) taban ağaçta yeniden oynatılır; özeti `kayit25.oynatma`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import '../src/test-setup';

const m = await import('../src/sim/mc3EskiYeni');
const { setDefaultRuleVersion } = await import('../src/battle/create');
const { CURRENT_RULES } = await import('../src/battle/ruleVersion');
const out = process.argv[2] ?? 'src/sim/mc3-altin.json';
const seedsList = (process.argv[3] ?? '3').split(',').map(Number);
const old = JSON.parse(readFileSync(process.argv[4] ?? 'src/sim/mc3-altin.json', 'utf8')) as { kayit25?: { events: unknown[] }; kayit: { version: number; events: unknown[] } };
const events25 = (old.kayit25 ?? (old.kayit.version === 25 ? old.kayit : null))?.events;
if (!events25) throw new Error('25 sürümlü kayıt yok');
const base = CURRENT_RULES;
setDefaultRuleVersion(103);
const savaslar103 = m.combatantHashes();
setDefaultRuleVersion(base);
const savaslar = m.combatantHashes();
const rec = m.recordBattle('col', 1, 3);
const imza: Record<string, Record<string, string>> = {};
for (const n of seedsList) imza[n] = Object.fromEntries(['col', 'kale', 'magara', 'orman'].map((id) => [id, m.signature(id, n, base)]));
setDefaultRuleVersion(base);
const file = {
  surum: base, savasKaydi: 26, savaslar, savaslar103,
  kayit: { version: 26, events: rec.events, son: m.stateHash(rec.state), oynatma: m.replayHash(rec.events) },
  kayit25: { version: 25, events: events25, oynatma: m.replayHash(events25 as never) },
  imza,
};
writeFileSync(out, `${JSON.stringify(file)}\n`);
console.log(`taban ${base}: ${Object.keys(savaslar).length} savaşçı, kayıt 26 ${rec.events.length} olay (${file.kayit.son}/${file.kayit.oynatma}), kayıt 25 ${events25.length} olay (${file.kayit25.oynatma}), imza ${JSON.stringify(imza)} → ${out}`);
