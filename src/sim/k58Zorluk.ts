/**
 * Kuyruk K58 G6: zorluk sıralaması ölçümü. Parti ya da düşman tarafının zorluğu değişir (diğeri Normal); parti kazanma
 * oranı. npx vite-node src/sim/k58Zorluk.ts -- 30 [--seviye 3] [--senaryo kale,orman,col,magara]
 */
import { loadTrExtra } from '../i18n';
import { loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
// Görev AS2: alt sınıf paketi (icerik/ ya da 12 kaydın fikstürü).
await (await import('./simIcerik')).loadSimContent();
const { SCENARIOS, measure, setSimYz, setPartyKind } = await import('./balance');
declare const process: { argv: string[] };
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const runs = Number(args.find((a, i) => /^\d+$/.test(a) && !(args[i - 1] ?? '').startsWith('--')) ?? 30);
const level = Number(opt('--seviye') ?? 3);
const sc = (opt('--senaryo') ?? 'kale,orman,col,magara').split(',').map((id) => SCENARIOS.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x);
setPartyKind(opt('--parti') ?? 'standart');
const rate = (yz: Parameters<typeof setSimYz>[0]) => {
  setSimYz(yz);
  const per = sc.map((s) => { const m = measure(s, runs, 1, level); return m.partyWins / m.runs; });
  return { per, avg: per.reduce((a, b) => a + b, 0) / per.length };
};
const pct = (x: number) => `${Math.round(x * 100)}%`;
console.log(`| Ayar | ${sc.map((s) => s.id).join(' | ')} | Ort. |`);
console.log(`|---|${sc.map(() => '---').join('|')}|---|`);
for (const [label, yz] of [['Parti Kolay', { zorluk: { party: 'kolay' } }], ['Normal', undefined], ['Parti Usta', { zorluk: { party: 'usta' } }],
  ['Düşman Kolay', { zorluk: { enemies: 'kolay' } }], ['Düşman Usta', { zorluk: { enemies: 'usta' } }]] as const) {
  const r = rate(yz as Parameters<typeof setSimYz>[0]);
  console.log(`| ${label} | ${r.per.map(pct).join(' | ')} | ${pct(r.avg)} |`);
}
