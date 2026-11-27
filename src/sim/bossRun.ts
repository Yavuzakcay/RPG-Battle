/**
 * Kuyruk 43: boss savaşları dengesi. Veri `data/sim-boss.json`; senaryonun haritası ve kuralları `data/sim-senaryolar.json`.
 *   npm run sim:boss -- 200 [--boss beyaz-sehir] [--zorluk normal|kolay]
 * KATALOG-1 F: Mühür Ruhu satırları (`element` alanlı) iki kolda ölçülür: dirençsiz (bilerek) ve hazırlıklı (sim başlangıcında
 * partiye bossun elementine direnç, `setPartyResist`). Parti listesi `--partiler k18` (12 sınıflık duman partileri) ya da
 * virgüllü liste; yoksa `--parti` (varsayılan standart). `--kol dirençsiz|hazırlıklı` tek kol; `--cizgi soguk` aynı çizginin
 * üç kademesi. Satır başına süre (sn) yazılır.
 *   npm run sim:boss -- 100 --boss wolfgang --partiler k18
 */
import { loadTrExtra } from '../i18n';
import { loadClassData, loadMonsters } from '../data';
import data from '../../data/sim-boss.json';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
// Görev AS2: alt sınıf paketi (icerik/ ya da 12 kaydın fikstürü).
await (await import('./simIcerik')).loadSimContent();
const { SCENARIOS, PARTY_KINDS, measure, setPartyKind, setPartyResist } = await import('./balance');

declare const process: { argv: string[] };
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const runs = Number(args.find((a) => /^\d+$/.test(a)) ?? 200);
type Boss = { id: string; ad: string; senaryo: string; seviye: number; normal: Record<string, number>; kolay: Record<string, number>; element?: string; cizgi?: string };
const list = (data.bosslar as unknown as Boss[]).filter((b) => (!opt('--boss') || b.id === opt('--boss')) && (!opt('--cizgi') || b.cizgi === opt('--cizgi')));
const diffs = opt('--zorluk') ? [opt('--zorluk') as 'normal' | 'kolay'] : (['normal', 'kolay'] as const);
const partyArg = opt('--partiler');
const parties = partyArg === 'k18' ? Object.keys(PARTY_KINDS).filter((k) => k.startsWith('k18-'))
  : partyArg ? partyArg.split(',') : [opt('--parti') ?? 'standart'];
const kolArg = opt('--kol');
const kollar = (b: Boss): Array<'dirençsiz' | 'hazırlıklı'> => (!b.element ? ['dirençsiz'] : kolArg === 'dirençsiz' || kolArg === 'hazırlıklı' ? [kolArg] : ['dirençsiz', 'hazırlıklı']);
const t0 = Date.now();
for (const b of list) {
  const base = SCENARIOS.find((s) => s.id === b.senaryo);
  if (!base) throw new Error(`senaryo yok: ${b.senaryo}`);
  for (const kol of kollar(b)) {
    setPartyResist(kol === 'hazırlıklı' && b.element ? [b.element] : null);
    for (const d of diffs) {
      const s = { ...base, byLevel: { ...base.byLevel, [b.seviye]: b[d] } };
      const pcts: number[] = [];
      for (const p of parties) {
        setPartyKind(p);
        const t = Date.now();
        const r = measure(s, runs, 1, b.seviye);
        const pct = Math.round((100 * r.partyWins) / r.runs);
        pcts.push(pct);
        const extra = parties.length > 1 || b.element ? ` | ${p} | ${kol}` : '';
        console.log(`| ${b.ad} | ${b.seviye}${extra} | ${d === 'kolay' ? 'Kolay' : 'Normal'} | ${pct}% (${r.partyWins}/${r.runs})${r.timeouts ? ` z${r.timeouts}` : ''} | ${((Date.now() - t) / 1000).toFixed(0)} sn |`);
      }
      if (parties.length > 1) {
        const mean = Math.round(pcts.reduce((a, x) => a + x, 0) / pcts.length);
        console.log(`| **${b.ad}** | ${b.seviye} | **ortalama ${parties.length} parti** | ${kol} | ${d === 'kolay' ? 'Kolay' : 'Normal'} | **${mean}%** (en düşük ${Math.min(...pcts)}%, en yüksek ${Math.max(...pcts)}%) | |`);
      }
    }
  }
  setPartyResist(null);
}
console.log(`toplam süre: ${((Date.now() - t0) / 60000).toFixed(1)} dk`);
