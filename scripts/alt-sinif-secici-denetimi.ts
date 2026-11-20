// Alt sınıf seçici denetimi: `npx vite-node scripts/alt-sinif-secici-denetimi.ts` → harita/belgeler/ALT-SINIF-SECICI-DENETIMI.md
// Sınıf | pakette kayıtlı | seçicide görünen | görünmeyenler (kimlik, TR ad, neden); iki durum: icerik/ yüklü ve yok (mobil/APK: yalnız 12 bizim).
// Ayrıca ad denetimi (boş ad, boş EN, yinelenen kimlik/ad), "N özellik çalışmıyor" sayısı. icerik/ bu ortamda yoksa paket durumu "ölçülemedi".
import fs from 'node:fs';
import path from 'node:path';
import { classData, loadClassData, type SubclassDef } from '../src/data';
import { applyStoredContent, loadLocalFolder } from '../src/content/store';
import { displayName, genderVisible, isRemovedSubclass, notWorkingCount, setExternalSubclasses, subclassDefs, visibleSubclasses } from '../src/rules/subclasses';

const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
const FILES = import.meta.glob('../icerik/ek-*.json', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; };
await loadClassData();
const OWN = classData.subclasses.filter((s) => s.ev || s.cinsiyet || /^imza_|karadul/.test(s.id));
classData.subclasses = [...OWN];
const HAS = Object.keys(FILES).length > 0;

interface Row { cls: string; pack: number; shown: number; hidden: string[] }
function table(): { rows: Row[]; names: string[] } {
  const rows: Row[] = []; const names: string[] = [];
  for (const cls of CLASSES) {
    const all = subclassDefs(cls);
    const vis = visibleSubclasses(cls).filter((s) => genderVisible(s, { gender: 'erkek' }) || genderVisible(s, { gender: 'kadin' }));
    const hidden: string[] = [];
    for (const s of all) {
      if (vis.includes(s)) continue;
      hidden.push(`\`${s.id}\` ${s.name.tr || '(adsız)'} — ${isRemovedSubclass(s) ? 'kaldirilan (Barış Alanı)' : 'bilinmeyen süzgeç'}`);
    }
    for (const s of all) {
      const dn = displayName(s.name, cls);
      if (!s.name.tr?.trim() || !s.name.en?.trim()) names.push(`${cls}/${s.id}: boş ad (tr="${s.name.tr ?? ''}", en="${s.name.en ?? ''}")`);
      if (!dn.tr.trim()) names.push(`${cls}/${s.id}: görünen ad boş`);
    }
    const seen = new Map<string, string>();
    for (const s of vis) { const k = displayName(s.name, cls).tr.toLocaleLowerCase('tr'); if (seen.has(k)) names.push(`${cls}: yinelenen görünen ad "${k}" (${seen.get(k)}, ${s.id})`); seen.set(k, s.id); }
    const ids = vis.map((s) => s.id); if (new Set(ids).size !== ids.length) names.push(`${cls}: yinelenen kimlik`);
    rows.push({ cls, pack: all.filter((s) => !s.ev && !s.cinsiyet && !/^imza_|karadul/.test(s.id)).length, shown: vis.length, hidden });
    for (const s of vis) if (notWorkingCount(s) > 0) names.push(`(bilgi) ${cls}/${s.id}: ${notWorkingCount(s)} özellik çalışmıyor/planlı`);
  }
  return { rows, names };
}
const fmt = (rows: Row[]) => ['| Sınıf | Pakette kayıtlı | Seçicide görünen (bizim dahil) | Görünmeyenler (kimlik, TR ad, neden) |', '|---|---|---|---|',
  ...rows.map((r) => `| ${r.cls} | ${r.pack} | ${r.shown} | ${r.hidden.join('<br>') || '—'} |`), `| **Toplam** | **${rows.reduce((n, r) => n + r.pack, 0)}** | **${rows.reduce((n, r) => n + r.shown, 0)}** | |`].join('\n');

// Durum 1: icerik/ yok (mobil/APK): yalnız 12 bizim.
setExternalSubclasses([]); await loadLocalFolder(mem(), {});
const none = table();
// Durum 2: icerik/ yüklü (varsa).
let withPack: ReturnType<typeof table> | null = null; let packRows: Array<{ id: string; errors: string[] }> = [];
if (HAS) {
  await loadLocalFolder(mem(), FILES);
  const r = applyStoredContent(mem());
  packRows = r.map((x) => ({ id: x.pack.id, errors: x.errors.map((e) => `${e.code} ${e.path} ${e.detail ?? ''}`) }));
  withPack = table();
}
// Fikstür (SRD 12): depodaki kopya, yalnız doğrulama.
const fixture = (await import('../src/rules/fixtures/srd-alt-siniflar.json')).default as unknown as { subclasses: SubclassDef[] };
setExternalSubclasses(fixture.subclasses.map((s) => ({ ...s })));
const fx = table();
const missingSrd = fixture.subclasses.filter((s) => !visibleSubclasses(s.class).some((v) => v.id === s.id)).map((s) => `${s.class}/${s.id}`);

const md = [
  '# Alt sınıf seçici denetimi', '',
  'Üreten: `npx vite-node scripts/alt-sinif-secici-denetimi.ts`. Beklenen: 120 = 108 dış paket (`icerik/ek-<sınıf>.json`, Barış Alanı hariç) + 12 bizim (11 imza + Karadul); cinsiyet kuralları: İmparator yalnız erkek, Karadul yalnız kadın (tabloda iki cinsiyetin birleşimi sayılır).', '',
  '## Durum A: icerik/ yok (mobil/APK, temiz kopya)', '', fmt(none.rows), '',
  HAS ? '## Durum B: icerik/ yüklü' : '## Durum B: icerik/ yüklü: ÖLÇÜLEMEDİ (bu ortamda `icerik/` klasörü yok; depoya girmez)', '',
  withPack ? fmt(withPack.rows) : 'Yerelde çalıştırınca bu bölüm dolar (paket dosyası sayısı, doğrulama hataları, sınıf başına görünmeyenler ve nedenleri).', '',
  ...(packRows.length ? ['Paket doğrulaması:', '', ...packRows.map((p) => `- \`${p.id}\`: ${p.errors.length ? p.errors.join('; ') : 'geçerli'}`), ''] : []),
  '## Durum C: depodaki SRD fikstürü (12 SRD alt sınıfı) + bizim 12', '', fmt(fx.rows), '',
  missingSrd.length ? `SRD alt sınıflarından seçicide görünmeyen: ${missingSrd.join(', ')}` : 'SRD 12 alt sınıfının hepsi kendi sınıfının seçicisinde görünür (kod yolunda süzülen yok).', '',
  '## Ad / kimlik denetimi', '', ...[...(withPack ?? fx).names, ...(withPack ? [] : [])].map((x) => `- ${x}`), '',
].join('\n');
fs.writeFileSync(path.join(import.meta.dirname ?? '.', '../harita/belgeler/ALT-SINIF-SECICI-DENETIMI.md'), md + '\n');
console.log(md);
