/**
 * Kuyruk 43: boss savaşları dengesi. Veri `data/sim-boss.json`; senaryonun haritası ve kuralları `data/sim-senaryolar.json`.
 *   npm run sim:boss -- 200 [--boss beyaz-sehir] [--zorluk normal|kolay]
 */
import { loadTrExtra } from '../i18n';
import { loadClassData, loadMonsters } from '../data';
import data from '../../data/sim-boss.json';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
// Görev AS2: alt sınıf paketi (icerik/ ya da 12 kaydın fikstürü).
await (await import('./simIcerik')).loadSimContent();
const { SCENARIOS, measure, setPartyKind } = await import('./balance');

declare const process: { argv: string[] };
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const runs = Number(args.find((a) => /^\d+$/.test(a)) ?? 200);
type Boss = { id: string; ad: string; senaryo: string; seviye: number; normal: Record<string, number>; kolay: Record<string, number> };
const list = (data.bosslar as unknown as Boss[]).filter((b) => !opt('--boss') || b.id === opt('--boss'));
const diffs = opt('--zorluk') ? [opt('--zorluk') as 'normal' | 'kolay'] : (['normal', 'kolay'] as const);
setPartyKind(opt('--parti') ?? 'standart');
for (const b of list) {
  const base = SCENARIOS.find((s) => s.id === b.senaryo);
  if (!base) throw new Error(`senaryo yok: ${b.senaryo}`);
  for (const d of diffs) {
    const s = { ...base, byLevel: { ...base.byLevel, [b.seviye]: b[d] } };
    const r = measure(s, runs, 1, b.seviye);
    console.log(`| ${b.ad} | ${b.seviye} | ${d === 'kolay' ? 'Kolay' : 'Normal'} | ${Math.round((100 * r.partyWins) / r.runs)}% (${r.partyWins}/${r.runs})${r.timeouts ? ` z${r.timeouts}` : ''} |`);
  }
}
