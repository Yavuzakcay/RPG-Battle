/**
 * Kuyruk K59 G3: zorluk ölçümü (K58 aracının seçmeli hâli). Ayar başına parti kazanma oranı (aynı tohumlar).
 *   npx vite-node src/sim/k59Zorluk.ts -- 50 --ayar normal,dusman-usta,parti-usta [--seviye 3] [--senaryo kale,orman,col,magara] [--ilk 1]
 * Ayarlar: normal, parti-kolay, parti-usta, dusman-kolay, dusman-usta.
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
const runs = Number(args.find((a, i) => /^\d+$/.test(a) && !(args[i - 1] ?? '').startsWith('--')) ?? 50);
const level = Number(opt('--seviye') ?? 3);
const first = Number(opt('--ilk') ?? 1);
const sc = (opt('--senaryo') ?? 'kale,orman,col,magara').split(',').map((id) => SCENARIOS.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x);
setPartyKind(opt('--parti') ?? 'standart');
const AYAR: Record<string, Parameters<typeof setSimYz>[0]> = {
  normal: undefined, 'parti-kolay': { zorluk: { party: 'kolay' } }, 'parti-usta': { zorluk: { party: 'usta' } },
  'dusman-kolay': { zorluk: { enemies: 'kolay' } }, 'dusman-usta': { zorluk: { enemies: 'usta' } },
};
for (const a of (opt('--ayar') ?? 'normal,dusman-usta,parti-usta').split(',')) {
  setSimYz(AYAR[a]);
  const per = sc.map((s) => { const m = measure(s, runs, first, level); return m.partyWins; });
  console.log(JSON.stringify({ ayar: a, seviye: level, tohum: runs, ilk: first, senaryo: sc.map((s) => s.id), kazanma: per, toplam: per.reduce((x, y) => x + y, 0), savas: runs * sc.length }));
}
