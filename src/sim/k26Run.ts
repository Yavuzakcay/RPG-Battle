/**
 * Görev K26: Buzul ve Dağ haritalarının ilk ölçümü (harita başına tek satır, Kolay ve Normal).
 *   npm run sim:k26 -- 30 [--seviye 3] [--parti standart]
 * Normal: senaryonun seviye listesi (`data/sim-senaryolar.json`); Kolay: aynı listede en kalabalık düşmandan bir eksik
 * (eşitlikte ilk yazılan; tek düşmanlı liste aynen). Sonuçlar `harita/belgeler/DENGE.md`'ye elle yazılır.
 */
import { loadTrExtra } from '../i18n';
import { loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
const { SCENARIOS, measure, setPartyKind, enemiesAt } = await import('./balance');

declare const process: { argv: string[] };
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const runs = Number(args.find((a) => /^\d+$/.test(a)) ?? 30);
const level = Number(opt('--seviye') ?? 3);
if (opt('--parti')) setPartyKind(opt('--parti') as never);
const IDS = ['k29-buzul-acik', 'k29-buzul-kamp', 'k29-buzul-kayalik', 'k29-buzul-tapinak', 'k29-dag-karakol', 'k29-dag-kayalik', 'k29-dag-kopru', 'k29-dag-nobetci'];

/** Kolay liste: en kalabalık düşmandan bir eksik. */
export function easier(list: Record<string, number>): Record<string, number> {
  const total = Object.values(list).reduce((a, b) => a + b, 0);
  if (total <= 1) return list;
  const [top] = Object.entries(list).sort((a, b) => b[1] - a[1]);
  const out = { ...list, [top![0]]: top![1] - 1 };
  if (out[top![0]] === 0) delete out[top![0]];
  return out;
}
const pct = (a: number, b: number) => `${Math.round((100 * a) / b)}%`;
const fmt = (l: Record<string, number>) => Object.entries(l).map(([k, n]) => `${k} ×${n}`).join(', ');
console.log(`| Senaryo | Seviye | Normal düşmanlar | Normal | Kolay düşmanlar | Kolay | Ort. tur (N) |`);
console.log('|---|---|---|---|---|---|---|');
for (const id of IDS) {
  const base = SCENARIOS.find((s) => s.id === id);
  if (!base) throw new Error(`senaryo yok: ${id}`);
  const normal = enemiesAt(base, level);
  const kolay = easier(normal);
  const n = measure(base, runs, 1, level);
  const k = measure({ ...base, byLevel: { ...base.byLevel, [level]: kolay } }, runs, 1, level);
  const z = (r: typeof n) => (r.timeouts ? ` (z${r.timeouts})` : '');
  console.log(`| ${id} | ${level} | ${fmt(normal)} | ${pct(n.partyWins, n.runs)}${z(n)} | ${fmt(kolay)} | ${pct(k.partyWins, k.runs)}${z(k)} | ${n.avgRounds.toFixed(1)} |`);
}
