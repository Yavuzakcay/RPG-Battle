/**
 * Kuyruk K58 G8: `npm run paket-durum [klasör]` → harita/belgeler/PAKET-DURUM.md (`src/content/paketDurum.ts`).
 * check:icerik ile aynı ayrıştırma ve sayım; hatalı paket atlanır (check:icerik raporlar). Paket metni yazılmaz.
 */
import fs from 'node:fs';
import path from 'node:path';
import { classData, loadClassData, loadMonsters, monsters } from '../src/data';
import { parsePack, type ContentPack } from '../src/content/schema';
import { paketDurum, paketDurumMd } from '../src/content/paketDurum';

await Promise.all([loadClassData(), loadMonsters()]);
const dir = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('-')) ?? 'icerik');
const out = process.argv.includes('--cikti') ? process.argv[process.argv.indexOf('--cikti') + 1] ?? '' : 'harita/belgeler/PAKET-DURUM.md';
if (!fs.existsSync(dir)) { console.log(`Klasör yok: ${dir} (içerik paketlerini buraya koy; depoya girmez).`); process.exit(0); }
const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.json')).sort();
const taken = classData.subclasses.map((s) => s.id);
const ids: string[] = [];
const packs: Array<{ pack: ContentPack; raw: unknown }> = [];
for (const f of files) {
  const full = path.join(dir, f);
  const bytes = fs.statSync(full).size;
  const text = bytes > 1024 * 1024 ? '' : fs.readFileSync(full, 'utf8');
  const r = parsePack(text, bytes, { taken, packs: ids, monsterIds: new Set(monsters.map((m) => m.id)) });
  if (!r.ok) { console.log(`atlandı (hatalı) ${f}`); continue; }
  ids.push(r.pack.id); taken.push(...r.pack.subclasses.map((s) => s.id));
  packs.push({ pack: r.pack, raw: JSON.parse(text) });
}
const sig = fs.existsSync('harita/belgeler/PAKET-SIGMAYAN.md') ? fs.readFileSync('harita/belgeler/PAKET-SIGMAYAN.md', 'utf8') : '';
const d = paketDurum(packs, sig);
fs.writeFileSync(out, paketDurumMd(d, packs.length));
const t = d.totals;
console.log(`${packs.length} paket · çalışır ${t.calisir}, kısmi ${t.kismi}, çalışmıyor ${t.calismiyor}, planlı ${t.planli}, hikâye ${t.hikaye} → ${out}`);
