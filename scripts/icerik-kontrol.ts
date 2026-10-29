/**
 * `npm run check:icerik [klasör]` (Görev E1): klasördeki (varsayılan `icerik/`) dış içerik paketlerini doğrular ve
 * rapor verir: kimlik çakışması (SRD ve öbür paketlerle), eksik alan, bilinmeyen etki, seviye aralığı, "çalışmıyor"
 * sayısı; alt sınıf başına durum özeti. Hata varsa çıkış kodu 1. Yalnızca JSON okunur, kod çalıştırılmaz.
 */
import fs from 'node:fs';
import path from 'node:path';
import { STRINGS } from '../src/i18n/strings';
import { classData, loadClassData } from '../src/data';
import { parsePack, summarize } from '../src/content/schema';

await loadClassData();
const dir = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('-')) ?? 'icerik');
const T = STRINGS.tr.content;
if (!fs.existsSync(dir)) {
  console.log(`Klasör yok: ${dir} (içerik paketlerini buraya koy; depoya girmez).`);
  process.exit(0);
}
const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.json')).sort();
const taken = classData.subclasses.map((s) => s.id);
const packs: string[] = [];
let bad = 0;
let notWorking = 0;
for (const f of files) {
  const full = path.join(dir, f);
  const bytes = fs.statSync(full).size;
  const r = parsePack(bytes > 1024 * 1024 ? '' : fs.readFileSync(full, 'utf8'), bytes, { taken, packs });
  if (!r.ok) {
    bad += 1;
    console.log(`HATA  ${f}`);
    for (const e of r.errors) console.log(`      ${T.errors[e.code]?.(e.path, e.detail ?? '') ?? e.code}`);
    continue;
  }
  packs.push(r.pack.id);
  taken.push(...r.pack.subclasses.map((s) => s.id));
  const sum = summarize(r.pack);
  notWorking += sum.notWorking;
  console.log(`tamam ${f}: ${r.pack.id} — ${T.summary(sum.subclasses.length, sum.notWorking)}`);
  for (const s of sum.subclasses) {
    const c = s.counts;
    console.log(`      ${s.class}/${s.id}: ${s.features} özellik · çalışır ${c.calisir}, planlı ${c.planli}, hikâye ${c.hikaye}, çalışmıyor ${c.calismiyor}`);
  }
}
console.log(`\n${files.length} paket, ${bad} hatalı, toplam ${notWorking} özellik çalışmıyor.`);
process.exit(bad ? 1 : 0);
