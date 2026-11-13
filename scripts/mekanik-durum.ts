/**
 * Kuyruk 18 (kuyruk sonu): bütün büyülerin (0–5. seviye, oyundaki kayıtlar) ve 1–10. seviye sınıf + SRD alt sınıf
 * özelliklerinin tek durum tablosu → docs/MEKANIK-DURUM.md.
 *   npx vite-node scripts/mekanik-durum.ts
 * Durum: **tam** (çalışır), **tam (yaklaşık)** (çalışır, sapması notta), **savaş dışı** (kart etiketi / Game Master
 * notu / hikâye), **eksik** (oyunda çalışmıyor). Hedef: eksik 0.
 */
import { writeFileSync } from 'node:fs';
import { loadClassData, spells } from '../src/data';
await loadClassData();
// Görev AS2: SRD alt sınıfları dış pakette (icerik/ ya da 12 kaydın fikstürü).
await (await import('../src/sim/simIcerik')).loadSimContent();
const { defaultSubclass, gainedFeatures, subclassesOf } = await import('../src/rules/classFeatures');
const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
type M = { status?: string; note?: string } | undefined;
const count: Record<string, number> = {};
const add = (k: string) => { count[k] = (count[k] ?? 0) + 1; };
const esc = (s: string) => s.replace(/\|/g, '/').replace(/\n/g, ' ').slice(0, 120);

const spellRows = [...spells].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)).map((s) => {
  const m = s.mechanics;
  const st = m.unsupported ? 'eksik' : m.offCombat ? 'savaş dışı' : m.approx ? 'tam (yaklaşık)' : 'tam';
  add(`büyü: ${st}`);
  return `| büyü | ${s.level} | ${s.name} | ${st} | ${esc(m.unsupported ?? m.approx ?? m.gmNote ?? '')} |`;
});

const featureLabel = (m: M, durum?: string): string => {
  if (durum === 'hikaye') return 'savaş dışı';
  if (!m) return durum === 'calisir' ? 'tam' : 'eksik';
  if (m.status === 'ok') return 'tam';
  if (m.status === 'partial') return 'tam (yaklaşık)';
  return /hikâye|hikaye|savaş dışı/i.test(m.note ?? '') ? 'savaş dışı' : 'eksik';
};
const featRows: string[] = [];
const seen = new Set<string>();
for (const c of CLASSES) {
  for (const sub of subclassesOf(c) as Array<{ id: string; srd?: boolean; features?: Array<{ id: string; durum?: string; status?: string }> }>) {
    if (sub.id !== defaultSubclass(c)) continue;
    for (const f of gainedFeatures(c, 10, sub.id)) {
      if (seen.has(f.key)) continue;
      seen.add(f.key);
      const d = f.from === 'class' ? undefined : sub.features?.find((x) => f.key.endsWith(`:${x.id}`));
      const st = featureLabel(f.mechanic as M, d?.durum ?? d?.status);
      add(`özellik: ${st}`);
      featRows.push(`| özellik | ${f.level} | ${c}${f.from === 'class' ? '' : ` / ${sub.id}`}: ${f.name} | ${st} | ${esc((f.mechanic as M)?.note ?? '')} |`);
    }
  }
}
const md = `# Mekanik durum tablosu (Kuyruk 18 sonu)

Üretim: \`npx vite-node scripts/mekanik-durum.ts\`. Bütün oyun büyüleri (0–5. seviye; 6.+ seviye büyü oyunda yok) ve 1–10. seviye sınıf + SRD alt sınıf özellikleri (oyunun seviye sınırı 10). Durum: **tam**, **tam (yaklaşık)** (çalışır; sapması notta), **savaş dışı** (kart etiketi, Game Master notu ya da hikâye), **eksik** (oyunda çalışmıyor).

Özet: ${Object.entries(count).sort().map(([k, v]) => `${k} ${v}`).join(', ')}.

| Tür | Seviye | Ad | Durum | Not |
|---|---:|---|---|---|
${[...spellRows, ...featRows].join('\n')}
`;
writeFileSync('docs/MEKANIK-DURUM.md', md);
console.log(md.split('\n')[4]);
