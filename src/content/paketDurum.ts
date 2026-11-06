/**
 * Kuyruk K58 G8: ek paket durum belgesi (harita/belgeler/PAKET-DURUM.md). Paket metni (açıklama) belgeye girmez:
 * yalnız kimlik, ad, sınıf/alt sınıf, seviye, durum ve ilkel türleri. Kısmi nedeni sırayla: özelliğin `sistem`/`not`
 * alanı, PAKET-SIGMAYAN.md'de aynı ad + alt sınıf satırının "Kalan yaklaşıklık" sütunu, ilkellerin kısmi alanları
 * (`partialWarnings`), yoksa "neden bilinmiyor". Sayılar `summarize` ile (check:icerik aynı). Saf.
 */
import type { ContentPack } from './schema';
import { partialWarnings, summarize } from './schema';

export interface PaketDurumRow {
  pack: string; cls: string; sub: string; subName: string; id: string; name: string; level: number; status: string; ilkeller: string[]; reason?: string;
}
type Status = 'calisir' | 'kismi' | 'calismiyor' | 'planli' | 'hikaye';
const STATUS: Status[] = ['calisir', 'kismi', 'calismiyor', 'planli', 'hikaye'];
const LABEL: Record<Status, string> = { calisir: 'çalışır', kismi: 'kısmi', calismiyor: 'çalışmıyor', planli: 'planlı', hikaye: 'hikâye' };

/** PAKET-SIGMAYAN.md tablolarından (ad, alt sınıf) → kalan yaklaşıklık. */
export function sigmayanReasons(md: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of md.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 5 || !cells[1] || cells[1] === 'Özellik' || /^-+$/.test(cells[1])) continue;
    const where = /^(\S+)\s*\/\s*(\S+)\s*\/\s*\d+/.exec(cells[2] ?? '');
    const last = cells[cells.length - 2] ?? '';
    if (where && last && last !== '—') out.set(`${where[2]}|${cells[1]}`, last);
  }
  return out;
}

export function paketDurum(packs: Array<{ pack: ContentPack; raw: unknown }>, sigmayanMd = ''): { rows: PaketDurumRow[]; totals: Record<Status, number> } {
  const sig = sigmayanReasons(sigmayanMd);
  const rows: PaketDurumRow[] = [];
  const totals = { calisir: 0, kismi: 0, calismiyor: 0, planli: 0, hikaye: 0 } as Record<Status, number>;
  for (const { pack, raw } of packs) {
    for (const s of summarize(pack).subclasses) for (const k of STATUS) totals[k] += s.counts[k];
    const partial = new Map<string, string[]>();
    for (const p of partialWarnings(pack)) { const k = p.path.split(' ')[0] ?? ''; partial.set(k, [...(partial.get(k) ?? []), ...p.fields]); }
    const rawSubs = (raw as { subclasses?: Array<{ id?: string; features?: Array<Record<string, unknown>> }> })?.subclasses ?? [];
    for (const s of pack.subclasses) {
      const rs = rawSubs.find((x) => x.id === s.id);
      for (const f of s.features) {
        const rf = rs?.features?.find((x) => x.id === f.id) ?? {};
        const own = [rf.sistem, rf.not].filter((x): x is string => typeof x === 'string' && !!x).join('; ');
        const name = typeof f.name === 'string' ? f.name : f.name.tr;
        const reason = f.status !== 'kismi' ? undefined
          : own || sig.get(`${s.id}|${name}`) || (partial.get(`${s.id}/${f.id}`)?.length ? `kısmi alan: ${[...new Set(partial.get(`${s.id}/${f.id}`))].join(', ')}` : 'neden bilinmiyor');
        rows.push({ pack: pack.id, cls: s.class, sub: s.id, subName: typeof s.name === 'string' ? s.name : s.name.tr, id: f.id, name, level: f.level, status: f.status,
          ilkeller: (f.ilkeller ?? []).map((p) => String(p.tur ?? '?')), ...(reason ? { reason } : {}) });
      }
    }
  }
  return { rows, totals };
}

const cell = (t: string) => t.replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function paketDurumMd(d: ReturnType<typeof paketDurum>, packCount: number): string {
  const kismi = d.rows.filter((r) => r.status === 'kismi');
  const ilkelCount = new Map<string, number>();
  for (const r of kismi) for (const p of new Set(r.ilkeller)) ilkelCount.set(p, (ilkelCount.get(p) ?? 0) + 1);
  const top = [...ilkelCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5);
  const reasonKinds = new Map<string, number>();
  for (const r of kismi) { const k = r.reason === 'neden bilinmiyor' ? 'neden bilinmiyor' : r.reason?.startsWith('kısmi alan') ? 'ilkelde kısmi alan' : 'yazılı neden (sistem/not ya da PAKET-SIGMAYAN)'; reasonKinds.set(k, (reasonKinds.get(k) ?? 0) + 1); }
  const hikaye = new Map<string, PaketDurumRow[]>();
  for (const r of d.rows.filter((x) => x.status === 'hikaye')) hikaye.set(`${r.cls}/${r.sub}`, [...(hikaye.get(`${r.cls}/${r.sub}`) ?? []), r]);
  return [
    '# Ek paket durumu (Kuyruk K58 G8)',
    '',
    '`npm run paket-durum [klasör]` üretir (varsayılan `icerik/`); elle düzenlenmez. Paket metni (açıklama) girmez: kimlik, ad, sınıf/alt sınıf, seviye, durum, ilkel türleri. Sayılar `npm run check:icerik` ile aynı (`summarize`). Kısmi nedeni: özelliğin `sistem`/`not` alanı, harita/belgeler/PAKET-SIGMAYAN.md satırı, ilkelin kısmi alanları ya da "neden bilinmiyor".',
    '',
    '## Özet',
    '',
    `${packCount} paket, ${d.rows.length} özellik.`,
    '',
    `| ${STATUS.map((s) => LABEL[s]).join(' | ')} |`,
    `|${STATUS.map(() => '---').join('|')}|`,
    `| ${STATUS.map((s) => d.totals[s]).join(' | ')} |`,
    '',
    '### Kısmi nedenleri',
    '',
    '| Neden türü | Özellik |',
    '|---|---|',
    ...[...reasonKinds.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `| ${k} | ${n} |`),
    '',
    '### Kısmi özelliklerde en sık 5 ilkel',
    '',
    '| İlkel | Kısmi özellik |',
    '|---|---|',
    ...top.map(([k, n]) => `| \`${k}\` | ${n} |`),
    '',
    `### Hikâye özellikleri (${hikaye.size} alt sınıf)`,
    '',
    '| Sınıf / alt sınıf | Özellikler (seviye) |',
    '|---|---|',
    ...[...hikaye.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, rs]) => `| ${k} | ${rs.map((r) => `${cell(r.name)} (${r.level})`).join(', ')} |`),
    '',
    '## Liste',
    '',
    '| Paket | Sınıf / alt sınıf | Kimlik | Ad | Sv | Durum | İlkeller | Kısmi nedeni |',
    '|---|---|---|---|---|---|---|---|',
    ...d.rows.map((r) => `| ${r.pack} | ${r.cls} / ${r.sub} | ${r.id} | ${cell(r.name)} | ${r.level} | ${LABEL[r.status as Status] ?? r.status} | ${r.ilkeller.join(', ')} | ${cell(r.reason ?? '')} |`),
    '',
  ].join('\n');
}
