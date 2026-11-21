/**
 * Gece kuyruğu Aşama 3c (salt okuma): efekt bağlaması (`data/efekt-baglama.json`: buyu, zemin, auraBuyu, rozetBuyu, konturBuyu,
 * cagirRenk, etkiHalka) olmayan savaşta kullanılan SRD büyüleri → `harita/belgeler/BUYU-EFEKT-EKSIK.md`. Görsel üretmez, bağlama eklemez.
 * Çalıştırma: `node scripts/buyu-efekt-eksik.mjs`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { mergedOf } from './lib/buyu-durum.mjs';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const fx = read('data/efekt-baglama.json');
const KEYS = ['buyu', 'zemin', 'auraBuyu', 'rozetBuyu', 'konturBuyu', 'cagirRenk', 'etkiHalka'];
const bound = new Map();
for (const k of KEYS) for (const id of Object.keys(fx[k] ?? {})) bound.set(id, [...(bound.get(id) ?? []), k]);
const game = ['data/spells.json', 'data/spells-45.json', 'data/spells-69.json'].flatMap((f) => read(f));
const rows = [];
for (const s of game.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))) {
  const m = mergedOf(s);
  const up = m.upgrade ? { ...m, ...m.upgrade } : m;
  if (up.offCombat) continue;
  if (bound.has(s.id)) continue;
  const lasting = !!(up.effect || up.failEffect || up.selfBuff || up.zone || up.ward || up.buffZone);
  rows.push({ id: s.id, name: s.name, level: s.level, kind: up.kind, lasting });
}
const lines = ['# Efekt bağlaması olmayan SRD büyüleri (gece kuyruğu Aşama 3c)', '',
  '`node scripts/buyu-efekt-eksik.mjs` üretir (salt okuma). Ölçüt: savaşta kullanılan (savaş dışı olmayan) büyünün kimliği',
  `\`data/efekt-baglama.json\`'ın ${KEYS.map((k) => `\`${k}\``).join(', ')} tablolarının hiçbirinde yok. Genel bağlamalar (hasar türüne göre`,
  'darbe, iyileştirme, ışınlanma, çağırma, koruma, durum halkası) bu büyülerde de çalışabilir; liste yalnız büyüye özgü bağlamanın',
  'olmadığını gösterir. Görsel üretilmedi, bağlama eklenmedi.', '',
  `Toplam: ${rows.length} büyü (süren etkili ${rows.filter((r) => r.lasting).length}, anlık ${rows.filter((r) => !r.lasting).length}); bağlı büyü kimliği ${bound.size}.`, '',
  '## Süren etki ya da alan bırakanlar (rozet/halka/zemin adayı)', '', '| Büyü | Sv | Mekanik türü |', '|---|---:|---|',
  ...rows.filter((r) => r.lasting).map((r) => `| ${r.name} (\`${r.id}\`) | ${r.level} | ${r.kind} |`), '',
  '## Anlık (mermi/ışın/darbe adayı)', '', '| Büyü | Sv | Mekanik türü |', '|---|---:|---|',
  ...rows.filter((r) => !r.lasting).map((r) => `| ${r.name} (\`${r.id}\`) | ${r.level} | ${r.kind} |`), ''];
writeFileSync(new URL('../harita/belgeler/BUYU-EFEKT-EKSIK.md', import.meta.url), lines.join('\n'));
console.log(`BUYU-EFEKT-EKSIK: ${rows.length} büyü (süren ${rows.filter((r) => r.lasting).length})`);
