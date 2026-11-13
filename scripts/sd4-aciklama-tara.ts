/**
 * Görev SD4: açıklama taraması. Oluşturucu ve savaş kartlarında gösterilen açıklama metninin hangi kayıtlarda Türkçe,
 * hangilerinde İngilizce (SRD ham metni) ya da boş olduğunu sayar; `harita/belgeler/ACIKLAMA-TARAMA.md` yazar.
 * Çalıştırma: `npx vite-node scripts/sd4-aciklama-tara.ts`.
 */
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { loadClassData, loadMonsters, items, spells, classData, classes } from '../src/data';
import { allFeats } from '../src/rules/advancement';
import { itemSummary } from '../src/ui/equipmentText';
import { looksEnglish } from '../src/data/aciklamaDil';
import { subclassesOf } from '../src/rules/classFeatures';
import srdSpecies from '../data/srd/species.json';
import aciklamalar from '../data/aciklamalar.json';

await Promise.all([loadMonsters(), loadClassData()]);
// Görev AS2: SRD alt sınıfları dış pakette (icerik/ ya da 12 kaydın fikstürü).
await (await import('../src/sim/simIcerik')).loadSimContent();
const trPath = new URL('../data/aciklamalar-tr.json', import.meta.url);
const tr = (existsSync(trPath) && !process.env.SD4_ONCE ? JSON.parse(readFileSync(trPath, 'utf8')) : {}) as Record<string, Record<string, string>>;
const betimleme = (await import('../data/buyu-betimleme.json')).default as Record<string, { tr?: string }>;
const good = (s: string | undefined) => !!s && s.trim().length > 5 && !looksEnglish(s);

interface Row { tur: string; toplam: number; trVar: number; karisik: number; ingilizce: number; bos: number; eksik: string[] }
const rows: Row[] = [];
/** `text`: düz Türkçe açıklama; `soft`: yalnız eldeki eski kısa metin (kısaltma / İngilizce SRD ham metni). */
const add = (tur: string, list: Array<{ id: string; text: string | undefined; soft?: string }>) => {
  const r: Row = { tur, toplam: list.length, trVar: 0, karisik: 0, ingilizce: 0, bos: 0, eksik: [] };
  for (const x of list) {
    if (good(x.text)) { r.trVar++; continue; }
    const raw = (x.text ?? x.soft ?? '').trim();
    if (!raw) r.bos++; else if (looksEnglish(raw)) r.ingilizce++; else r.karisik++;
    r.eksik.push(x.id);
  }
  rows.push(r);
};

// Büyüler: savaş kartı "Süren etkiler" mekanik açıklaması (TR kaynağı data/aciklamalar-tr.json `buyu`; yoksa SRD ham metni).
add('Büyü (mekanik açıklama)', spells.map((s) => ({ id: s.id, text: tr.buyu?.[s.id], soft: s.text })));
add('Büyü (betimleme, italik)', spells.map((s) => ({ id: s.id, text: betimleme[s.id]?.tr })));
// Eşyalar: kart özeti (etki özeti Türkçe üretilir; yoksa SRD metni) ya da data/aciklamalar-tr.json `esya`.
add('Eşya', items.map((i) => ({ id: i.id, text: tr.esya?.[i.id] ?? (looksEnglish(itemSummary(i)) ? undefined : itemSummary(i)), soft: itemSummary(i) })));
// Tür özellikleri (SRD species): `tur` tablosu.
add('Tür özelliği', srdSpecies.species.flatMap((s) => s.traits.map((t) => ({ id: `${s.id}/${t.id}`, text: tr.tur?.[`${s.id}/${t.id}`] }))));
// Feat'ler: data/aciklamalar.json feats (ne yapar + örnek).
const feats = (aciklamalar as unknown as { feats: { tr: Record<string, { what: string; example: string }> } }).feats.tr;
add('Feat', allFeats().map((f) => ({ id: f.id, text: feats[f.id] ? `${feats[f.id]?.what} ${feats[f.id]?.example}` : tr.feat?.[f.id] })));
// Sınıf özellikleri: data/aciklamalar.json features.
const cf = (aciklamalar as unknown as { features: { tr: Record<string, string> } }).features.tr;
const classFeatKeys = Object.keys(classData.mechanics.features).filter((k) => /^[a-z]+:[a-z-]+$/.test(k) && classes.some((c) => k.startsWith(`${c.id}:`)));
add('Sınıf özelliği', classFeatKeys.map((k) => ({ id: k, text: tr.yetenek?.[k] ?? cf[k] })));
// Alt sınıf özellikleri: subclasses.json description.tr.
add('Alt sınıf özelliği', classes.flatMap((c) => subclassesOf(c.id).flatMap((s) => s.features.map((f) => ({ id: `${c.id}/${s.id}:${f.id}`, text: tr.altsinif?.[`${c.id}/${s.id}:${f.id}`] ?? f.description?.tr })))));
// Invocation'lar: `note` (Türkçe), yoksa tr.invocation.
const inv = Object.values(classData.mechanics.features).flatMap((m) => m.invocations ?? []);
add('Invocation', inv.map((v) => ({ id: v.id, text: tr.invocation?.[v.id] ?? v.note })));
// Silah ustalıkları ve özellikleri: data/aciklamalar.json.
const ms = (aciklamalar as unknown as { mastery: { tr: Record<string, string> }; properties: { tr: Record<string, string> } });
add('Silah ustalığı', ['cleave', 'graze', 'nick', 'push', 'sap', 'slow', 'topple', 'vex'].map((id) => ({ id, text: ms.mastery.tr[id] })));
add('Silah özelliği', ['finesse', 'light', 'heavy', 'twoHanded', 'reach', 'versatile', 'thrown', 'ammunition', 'loading'].map((id) => ({ id, text: ms.properties.tr[id] })));

const lines = ['# Açıklama taraması (Görev SD4)', '', `Üretici: \`npx vite-node scripts/sd4-aciklama-tara.ts\`. Ölçüt: oluşturucu ve savaş kartında gösterilen açıklamanın Türkçe olması (\`src/data/aciklamaDil.ts\` sezgisi).`, '',
  '| Kayıt türü | Toplam | Türkçe açıklamalı | Yalnız kısa/karışık metin | İngilizce (SRD ham) | Boş | Eksik toplam |', '|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.tur} | ${r.toplam} | ${r.trVar} | ${r.karisik} | ${r.ingilizce} | ${r.bos} | ${r.eksik.length} |`), ''];
for (const r of rows) if (r.eksik.length > 0 && r.eksik.length <= 400) lines.push(`## Eksik: ${r.tur} (${r.eksik.length})`, '', r.eksik.join(', '), '');
writeFileSync(new URL('../harita/belgeler/ACIKLAMA-TARAMA.md', import.meta.url), lines.join('\n'));
console.log(lines.slice(0, 18).join('\n'));
