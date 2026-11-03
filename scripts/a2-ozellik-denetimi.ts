/**
 * Kuyruk 39: 6–10. seviye sınıf ve SRD alt sınıf özellikleri denetimi → docs/A2-OZELLIK-DENETIMI.md.
 * Kuyruk 19: 11–20. seviye → docs/A3-OZELLIK-DENETIMI.md (aynı betik).
 *   npx vite-node scripts/a2-ozellik-denetimi.ts
 * Durum: class-features.json (ok/partial/none) ve subclasses.json (calisir/planli/hikaye/calismiyor) etiketlerinden.
 */
import { writeFileSync } from 'node:fs';
import { loadClassData } from '../src/data';
await loadClassData();
const { gainedFeatures, subclassesOf } = await import('../src/rules/classFeatures');
const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
type M = { status?: string; note?: string } | undefined;
const label = (m: M, durum?: string): string => {
  if (durum === 'hikaye') return 'hikâye';
  if (durum === 'planli' && (!m || m.status === 'none')) return 'planlı sistem';
  if (!m) return 'planlı sistem';
  if (m.status === 'ok') return 'çalışır';
  if (m.status === 'partial') return 'çalışır (kısmi)';
  return /hikâye|hikaye/.test(m.note ?? '') ? 'hikâye' : 'çalışmıyor';
};
function audit(min: number, max: number, file: string, title: string): string {
  const rows: string[] = [];
  const count: Record<string, number> = {};
  const perClass: Record<string, number> = {};
  for (const c of CLASSES) {
    const sub = (subclassesOf(c) as Array<{ id: string; srd?: boolean; durum?: string; features?: Array<{ id: string; durum?: string }> }>).find((s) => s.srd);
    for (const f of gainedFeatures(c, max, sub?.id)) {
      if ((f.level ?? 0) < min) continue;
      const durum = f.from === 'class' ? undefined : sub?.features?.find((x) => f.key.endsWith(`:${x.id}`))?.durum;
      const l = label(f.mechanic as M, durum);
      count[l] = (count[l] ?? 0) + 1;
      if (l.startsWith('çalışır')) perClass[c] = (perClass[c] ?? 0) + 1;
      rows.push(`| ${c} | ${f.from === 'class' ? '—' : sub?.id ?? '—'} | ${f.level} | ${f.name} | ${l} | ${((f.mechanic as M)?.note ?? '').replace(/\|/g, '/').slice(0, 160)} |`);
    }
  }
  const md = `# ${title}

Üretim: \`npx vite-node scripts/a2-ozellik-denetimi.ts\`. Kaynak: SRD 5.2.1 sınıf tabloları (\`data/srd/progression.json\`), mekanik \`data/class-features.json\` ve \`data/subclasses.json\` (SRD alt sınıfları). Durum: **çalışır**, **çalışır (kısmi)**, **planlı sistem** (mekanik kaydı yok), **hikâye** (savaşta etkisiz), **çalışmıyor** (yeni sistem gerekir).

Özet: ${Object.entries(count).map(([k, v]) => `${k} ${v}`).join(', ')}. Sınıf başına çalışan (kısmi dahil): ${CLASSES.map((c) => `${c} ${perClass[c] ?? 0}`).join(', ')}.

| Sınıf | Alt sınıf | Seviye | Özellik | Durum | Not |
|---|---|---:|---|---|---|
${rows.join('\n')}
`;
  writeFileSync(file, md);
  return md.split('\n').slice(4, 5).join('\n');
}
console.log(audit(6, 10, 'docs/A2-OZELLIK-DENETIMI.md', 'Aşama 2 özellik denetimi: seviye 6–10 (Kuyruk 39)'));
console.log(audit(11, 20, 'docs/A3-OZELLIK-DENETIMI.md', 'Özellik denetimi: seviye 11–20 (Kuyruk 19)'));
