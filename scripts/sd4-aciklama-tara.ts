/**
 * Görev SD4: açıklama taraması. Oluşturucu ve savaş kartlarında gösterilen açıklama metninin hangi kayıtlarda Türkçe,
 * hangilerinde İngilizce (SRD ham metni) ya da boş olduğunu sayar; Görev EN-ACIKLAMA: İngilizce arayüzde gösterilen açıklamanın
 * var/yok sayısı (EN sütunu). `harita/belgeler/ACIKLAMA-TARAMA.md` yazar.
 * Çalıştırma: `npx vite-node scripts/sd4-aciklama-tara.ts`.
 */
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { loadClassData, loadMonsters, items, spells, classData, classes, weapons, armor } from '../src/data';
import { allFeats } from '../src/rules/advancement';
import { armorDetail, itemSummary, weaponDetail } from '../src/ui/equipmentText';
import { loadLang, setLang } from '../src/i18n';
import canavarOzellik from '../data/canavar-ozellik.json';
import backgroundsData from '../data/backgrounds.json';
import { looksEnglish } from '../src/data/aciklamaDil';
import { subclassesOf } from '../src/rules/classFeatures';
import srdSpecies from '../data/srd/species.json';
import aciklamalar from '../data/aciklamalar.json';

await Promise.all([loadMonsters(), loadClassData()]);
// Görev AS2: SRD alt sınıfları dış pakette (icerik/ ya da 12 kaydın fikstürü).
await (await import('../src/sim/simIcerik')).loadSimContent();
const trPath = new URL('../data/aciklamalar-tr.json', import.meta.url);
const tr = (existsSync(trPath) && !process.env.SD4_ONCE ? JSON.parse(readFileSync(trPath, 'utf8')) : {}) as Record<string, Record<string, string>>;
const betimleme = (await import('../data/buyu-betimleme.json')).default as Record<string, { tr?: string; en?: string }>;
// Görev EN-ACIKLAMA: İngilizce açıklamalar (canavar ayrı dosyada).
const enPath = new URL('../data/aciklamalar-en.json', import.meta.url);
const enMonPath = new URL('../data/aciklamalar-en-canavar.json', import.meta.url);
const en = (existsSync(enPath) ? JSON.parse(readFileSync(enPath, 'utf8')) : {}) as Record<string, Record<string, string>>;
en.canavar = existsSync(enMonPath) ? (JSON.parse(readFileSync(enMonPath, 'utf8')) as { canavar: Record<string, string> }).canavar : {};
const good = (s: string | undefined) => !!s && s.trim().length > 5 && !looksEnglish(s);
/** İngilizce açıklama geçerli mi: boş değil, Türkçe harf yok, "yalnız Türkçe" notu değil. */
const goodEn = (s: string | undefined) => !!s && s.trim().length > 5 && !/[çşğıöüÇŞĞİÖÜ]/.test(s) && s !== 'Description available in Turkish only.';

interface Row { tur: string; toplam: number; trVar: number; karisik: number; ingilizce: number; bos: number; eksik: string[]; enVar: number; enEksik: string[] }
const rows: Row[] = [];
/**
 * `text`: düz Türkçe açıklama; `soft`: yalnız eldeki eski kısa metin (kısaltma / İngilizce SRD ham metni);
 * `en`: İngilizce arayüzde gösterilen açıklama (EN arayüzde üretilen özet de sayılır; `enList` ikinci geçişte doldurur).
 */
type Item = { id: string; text: string | undefined; soft?: string; en?: string };
const pending: Array<{ row: Row; list: Item[]; enOf?: (id: string) => string | undefined }> = [];
const add = (tur: string, list: Item[], enOf?: (id: string) => string | undefined) => {
  const r: Row = { tur, toplam: list.length, trVar: 0, karisik: 0, ingilizce: 0, bos: 0, eksik: [], enVar: 0, enEksik: [] };
  for (const x of list) {
    if (good(x.text)) { r.trVar++; continue; }
    const raw = (x.text ?? x.soft ?? '').trim();
    if (!raw) r.bos++; else if (looksEnglish(raw)) r.ingilizce++; else r.karisik++;
    r.eksik.push(x.id);
  }
  rows.push(r);
  pending.push({ row: r, list, enOf });
};

// Büyüler: savaş kartı "Süren etkiler" mekanik açıklaması (TR kaynağı data/aciklamalar-tr.json `buyu`; yoksa SRD ham metni).
add('Büyü (mekanik açıklama)', spells.map((s) => ({ id: s.id, text: tr.buyu?.[s.id], soft: s.text, en: en.buyu?.[s.id] })));
add('Büyü (betimleme, italik)', spells.map((s) => ({ id: s.id, text: betimleme[s.id]?.tr, en: betimleme[s.id]?.en })));
// Eşyalar: kart özeti (etki özeti Türkçe üretilir; yoksa SRD metni) ya da data/aciklamalar-tr.json `esya`. EN: aciklamalar-en.json
// ya da EN arayüzde üretilen etki özeti.
add('Eşya', items.map((i) => ({ id: i.id, text: tr.esya?.[i.id] ?? (looksEnglish(itemSummary(i)) ? undefined : itemSummary(i)), soft: itemSummary(i) })),
  (id) => en.esya?.[id] ?? (tr.esya?.[id] ? undefined : itemSummary(items.find((i) => i.id === id)!)));
// Silah ve zırh: kart satırı arayüzün ürettiği özet (iki dilde); Dungeondex prospektüsünde ayrıca Türkçe paragraf.
add('Silah', weapons.map((w) => ({ id: w.id, text: weaponDetail(w) })), (id) => weaponDetail(weapons.find((w) => w.id === id)!));
const srdArmor = (armor as Array<(typeof armor)[number] & { srd?: string }>).filter((a) => a.srd);
add('Zırh', srdArmor.map((a) => ({ id: String(a.srd), text: armorDetail(a) })), (id) => armorDetail(srdArmor.find((a) => a.srd === id)!));
// Tür özellikleri (SRD species): `tur` tablosu.
add('Tür özelliği', srdSpecies.species.flatMap((s) => s.traits.map((t) => ({ id: `${s.id}/${t.id}`, text: tr.tur?.[`${s.id}/${t.id}`], en: en.tur?.[`${s.id}/${t.id}`] }))));
// Feat'ler: data/aciklamalar.json feats (ne yapar + örnek).
const feats = (aciklamalar as unknown as { feats: Record<'tr' | 'en', Record<string, { what: string; example: string }>> }).feats;
const featText = (l: 'tr' | 'en', id: string) => (feats[l][id] ? `${feats[l][id]?.what} ${feats[l][id]?.example}` : undefined);
add('Feat', allFeats().map((f) => ({ id: f.id, text: featText('tr', f.id) ?? tr.feat?.[f.id], en: featText('en', f.id) })));
// Sınıf özellikleri: data/aciklamalar.json features.
const cf = (aciklamalar as unknown as { features: Record<'tr' | 'en', Record<string, string>> }).features;
const classFeatKeys = Object.keys(classData.mechanics.features).filter((k) => /^[a-z]+:[a-z-]+$/.test(k) && classes.some((c) => k.startsWith(`${c.id}:`)));
add('Sınıf özelliği', classFeatKeys.map((k) => ({ id: k, text: tr.yetenek?.[k] ?? cf.tr[k], en: en.yetenek?.[k] ?? cf.en[k] })));
// Alt sınıf özellikleri: subclasses.json description.tr / .en.
add('Alt sınıf özelliği', classes.flatMap((c) => subclassesOf(c.id).flatMap((s) => s.features.map((f) => {
  const id = `${c.id}/${s.id}:${f.id}`;
  return { id, text: tr.altsinif?.[id] ?? f.description?.tr, en: en.altsinif?.[id] ?? f.description?.en };
}))));
// Invocation'lar: `note` (Türkçe), yoksa tr.invocation.
const inv = Object.values(classData.mechanics.features).flatMap((m) => m.invocations ?? []);
add('Invocation', inv.map((v) => ({ id: v.id, text: tr.invocation?.[v.id] ?? v.note, en: en.invocation?.[v.id] })));
// Durumlar ve büyü seçenekleri: data/aciklamalar-tr.json `durum`, `buyuSecenek`.
add('Durum', Object.keys(tr.durum ?? {}).map((id) => ({ id, text: tr.durum?.[id], en: en.durum?.[id] })));
add('Büyü seçeneği', Object.keys(tr.buyuSecenek ?? {}).map((id) => ({ id, text: tr.buyuSecenek?.[id], en: en.buyuSecenek?.[id] })));
// Canavar özellik ve eylemleri: data/canavar-ozellik.json listesi; TR aciklamalar-tr.json `canavar`, EN aciklamalar-en-canavar.json.
const canavarKeys = Object.values((canavarOzellik as unknown as { canavarlar: Record<string, Array<{ anahtar: string }>> }).canavarlar).flatMap((l) => l.map((f) => f.anahtar));
add('Canavar özelliği/eylemi', canavarKeys.map((id) => ({ id, text: tr.canavar?.[id], en: en.canavar?.[id] })));
// Geçmişler: data/backgrounds.json `summary` (TR/EN).
const bgs = (backgroundsData as unknown as { backgrounds: Array<{ id: string; summary?: { tr?: string; en?: string } }> }).backgrounds;
add('Geçmiş', bgs.map((b) => ({ id: b.id, text: b.summary?.tr, en: b.summary?.en })));
// Silah ustalıkları ve özellikleri: data/aciklamalar.json.
const ms = (aciklamalar as unknown as { mastery: Record<'tr' | 'en', Record<string, string>>; properties: Record<'tr' | 'en', Record<string, string>> });
const MASTERY = ['cleave', 'graze', 'nick', 'push', 'sap', 'slow', 'topple', 'vex'];
const PROPS = ['finesse', 'light', 'heavy', 'twoHanded', 'reach', 'versatile', 'thrown', 'ammunition', 'loading'];
add('Silah ustalığı', MASTERY.map((id) => ({ id, text: ms.mastery.tr[id], en: ms.mastery.en[id] })));
add('Silah özelliği', PROPS.map((id) => ({ id, text: ms.properties.tr[id], en: ms.properties.en[id] })));

// İkinci geçiş: EN arayüzde üretilen metinler (eşya etki özeti, silah/zırh satırı) için dil İngilizce.
await loadLang('en');
setLang('en');
for (const p of pending) for (const x of p.list) {
  const e = x.en ?? p.enOf?.(x.id);
  if (goodEn(e)) p.row.enVar++; else p.row.enEksik.push(x.id);
}
setLang('tr');

const lines = ['# Açıklama taraması (Görev SD4, EN-ACIKLAMA)', '', `Üretici: \`npx vite-node scripts/sd4-aciklama-tara.ts\`. Ölçüt: oluşturucu, savaş kartı ve Dungeondex'te gösterilen açıklamanın Türkçe olması (\`src/data/aciklamaDil.ts\` sezgisi); EN sütunu İngilizce arayüzde gösterilen açıklama (\`data/aciklamalar-en.json\`, \`aciklamalar-en-canavar.json\`, betimleme \`en\`, verinin kendi EN alanı ya da EN arayüzde üretilen özet; Türkçe harfsiz).`, '',
  '| Kayıt türü | Toplam | Türkçe açıklamalı | Yalnız kısa/karışık metin | İngilizce (SRD ham) | Boş | Eksik toplam | EN var | EN yok |', '|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.tur} | ${r.toplam} | ${r.trVar} | ${r.karisik} | ${r.ingilizce} | ${r.bos} | ${r.eksik.length} | ${r.enVar} | ${r.enEksik.length} |`), ''];
for (const r of rows) if (r.eksik.length > 0 && r.eksik.length <= 400) lines.push(`## Eksik: ${r.tur} (${r.eksik.length})`, '', r.eksik.join(', '), '');
for (const r of rows) if (r.enEksik.length > 0 && r.enEksik.length <= 400) lines.push(`## EN eksik: ${r.tur} (${r.enEksik.length})`, '', r.enEksik.join(', '), '');
writeFileSync(new URL('../harita/belgeler/ACIKLAMA-TARAMA.md', import.meta.url), lines.join('\n'));
console.log(lines.slice(0, 24).join('\n'));
