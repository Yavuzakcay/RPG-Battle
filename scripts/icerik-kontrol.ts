/**
 * `npm run check:icerik [klasör]` (Görev E1, P0): klasördeki (varsayılan `icerik/`) dış içerik paketlerini doğrular ve
 * rapor verir: kimlik çakışması (SRD ve öbür paketlerle), eksik alan, bilinmeyen etki/ilkel, seviye aralığı, alt sınıf
 * başına çalışır/kısmi/çalışmıyor/planlı/hikâye sayıları. Görev P0: ilkel hataları satır satır, yalnız kimlik + alan adı +
 * hata kodu (özellik metni yazılmaz); kısmi alanlar ve yedek jeton uyarı. Hata varsa çıkış kodu 1. Kod çalıştırılmaz.
 */
import fs from 'node:fs';
import path from 'node:path';
import { STRINGS_TR } from '../src/i18n/strings';
import { classData, loadClassData, loadMonsters, monsters } from '../src/data';
import { parsePack, partialWarnings, readablePath, summarize } from '../src/content/schema';

await Promise.all([loadClassData(), loadMonsters()]);
const dir = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('-')) ?? 'icerik');
const T = STRINGS_TR.content;
if (!fs.existsSync(dir)) {
  console.log(`Klasör yok: ${dir} (içerik paketlerini buraya koy; depoya girmez).`);
  process.exit(0);
}
const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.json')).sort();
const taken = classData.subclasses.map((s) => s.id);
const packs: string[] = [];
const monsterIds = new Set(monsters.map((m) => m.id));
let bad = 0;
let total = { calisir: 0, kismi: 0, planli: 0, hikaye: 0, calismiyor: 0 };
for (const f of files) {
  const full = path.join(dir, f);
  const bytes = fs.statSync(full).size;
  const text = bytes > 1024 * 1024 ? '' : fs.readFileSync(full, 'utf8');
  let raw: unknown = null;
  try { raw = JSON.parse(text); } catch { /* parsePack raporlar */ }
  const r = parsePack(text, bytes, { taken, packs, monsterIds });
  const warn = r.warnings ?? [];
  if (!r.ok) {
    bad += 1;
    console.log(`HATA  ${f} (${r.errors.length} hata)`);
    for (const e of r.errors) console.log(`      ${readablePath(raw, e.path)}  ${e.code}${e.detail ? `  ${e.detail}` : ''}`);
    for (const e of warn) console.log(`      uyarı ${readablePath(raw, e.path)}  ${e.code}`);
    continue;
  }
  packs.push(r.pack.id);
  taken.push(...r.pack.subclasses.map((s) => s.id));
  const sum = summarize(r.pack);
  console.log(`tamam ${f}: ${r.pack.id} — ${T.summary(sum.subclasses.length, sum.notWorking)}`);
  for (const s of sum.subclasses) {
    const c = s.counts;
    for (const k of Object.keys(total) as Array<keyof typeof total>) total[k] += c[k];
    const works = c.calisir + c.kismi;
    console.log(`      ${s.class}/${s.id}: ${s.features} özellik · çalışır ${c.calisir}, kısmi ${c.kismi}, çalışmıyor ${c.calismiyor}, planlı ${c.planli}, hikâye ${c.hikaye}${works === 0 ? ' · seçim listesinde görünmez' : c.calisir < s.features - c.hikaye ? ' · deneysel' : ''}`);
  }
  for (const e of warn) console.log(`      uyarı ${readablePath(raw, e.path)}  ${e.code}`);
  for (const p of partialWarnings(r.pack)) console.log(`      ${p.status === 'calisir' ? 'uyarı' : 'bilgi'} ${p.path}  kismiAlan  ${p.fields.join(',')}`);
}
console.log(`\n${files.length} paket, ${bad} hatalı · çalışır ${total.calisir}, kısmi ${total.kismi}, çalışmıyor ${total.calismiyor}, planlı ${total.planli}, hikâye ${total.hikaye}.`);
process.exit(bad ? 1 : 0);
